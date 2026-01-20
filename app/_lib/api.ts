type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const DEFAULT_DEV_API_BASE = "http://localhost:5002";
let cachedBaseUrl: string | null = null;

const debugApiLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[api] debugApiLog payload ->", ...args);
  }
};

function resolveBaseUrl(): string {
  if (cachedBaseUrl !== null) {
    debugApiLog("resolveBaseUrl using cached value", cachedBaseUrl);
    return cachedBaseUrl;
  }

  const envBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (envBase) {
    // Remove trailing slash to prevent double slashes when concatenating paths
    cachedBaseUrl = envBase.replace(/\/+$/, "");
    debugApiLog("resolveBaseUrl using env base", cachedBaseUrl);
    return cachedBaseUrl;
  }

  // In development, use localhost fallback
  if (process.env.NODE_ENV === "development") {
    cachedBaseUrl = DEFAULT_DEV_API_BASE;
    debugApiLog("resolveBaseUrl using development fallback", cachedBaseUrl);
    return cachedBaseUrl;
  }

  // In production, if NEXT_PUBLIC_API_BASE_URL is not set, log error and return empty
  // This will cause API calls to fail, making it obvious that the env var is missing
  if (process.env.NODE_ENV === "production") {
    console.error(
      "❌ NEXT_PUBLIC_API_BASE_URL is not set! " +
      "Please set this environment variable in Vercel to your backend URL."
    );
    cachedBaseUrl = "";
    debugApiLog("resolveBaseUrl production mode - env var missing", cachedBaseUrl);
    return cachedBaseUrl;
  }

  // Fallback for other cases
  cachedBaseUrl = "";
  debugApiLog("resolveBaseUrl defaulting to empty", cachedBaseUrl);
  return cachedBaseUrl;
}

function buildRequestUrl(path: string): string {
  const baseUrl = resolveBaseUrl();
  // Ensure path starts with / and remove any leading slashes to prevent double slashes
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Remove any double slashes that might occur (but preserve http:// or https://)
  const fullUrl = baseUrl
    ? `${baseUrl}${normalizedPath}`.replace(/([^:]\/)\/+/g, "$1")
    : normalizedPath;
  debugApiLog("buildRequestUrl computed url", { baseUrl, normalizedPath, fullUrl });
  return fullUrl;
}

async function request<T>(path: string, options: { method?: HttpMethod; body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const targetUrl = buildRequestUrl(path).replace(/\/$/, '');
  debugApiLog("request executing fetch", { method, targetUrl, body });
  
  try {
    const res = await fetch(targetUrl, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    
    let data: any = null;
    try { 
      data = await res.json(); 
    } catch (parseError) { 
      console.error("Failed to parse response as JSON:", parseError);
      // If response is not JSON, try to get text
      const text = await res.text();
      console.error("Response text:", text);
    }
    
    if (!res.ok) {
      const message = data?.error || data?.message || `Request failed (${res.status})`;
      // Only log as error for critical failures (5xx), use warn for client errors (4xx)
      if (res.status >= 500) {
      console.error("API request failed:", {
        status: res.status,
        statusText: res.statusText,
        url: targetUrl,
        message,
        data
      });
      } else {
        console.warn("API request failed (non-critical):", {
          status: res.status,
          statusText: res.statusText,
          url: targetUrl,
          message
        });
      }
      throw new Error(message);
    }
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.warn("Network error - API might be unreachable:", targetUrl);
        // Return a rejected promise with a proper error structure instead of throwing
        return Promise.reject({
          success: false,
          error: 'Network error - API might be unreachable',
          message: 'Cannot connect to API. Please check if the backend is running and the API URL is configured correctly.'
        });
      }
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{
      token: string
      user: { id: string; [key: string]: any }
      roles?: Array<{ id?: string; user_id?: string; role_id?: string; role_name: string }>
    }>(`/api/v1/users/loginUser`, {
      method: 'POST',
      body: { email, password },
    }),
};

export const usersApi = {
  create: (user: Record<string, unknown>) =>
    request(`/api/v1/users/registerUser`, { method: 'POST', body: user }),
  list: async () => {
    const res = await request<{ users: any[] }>(`/api/v1/users/getAllUsers`)
    return res?.users ?? []
  },
  getById: async (userId: string) => {
    const res = await request<{ user: any }>(`/api/v1/users/getUserById/${userId}`)
    return res?.user ?? null
  },
  delete: (userId: string) =>
    request(`/api/v1/users/deleteUser/${userId}`, { method: 'DELETE' }),
};

// Activity Logs

export type LogItem = {
  id: string
  user_id: string
  table_name: string
  record_id?: string | null
  action_type: string
  change_details?: Record<string, unknown> | null
  created_at: string
}

export type ActivityLogsParams = {
  page?: number
  pageSize?: number
  userId?: string
  tableName?: string
  actionType?: string
  from?: string
  to?: string
}

export type ActivityLogsResponse = {
  items: LogItem[]
  total: number
  page: number
  pageSize: number
}


export const activityLogsApi = {
  async list(params: ActivityLogsParams): Promise<ActivityLogsResponse> {
    // Call the actual Express.js endpoint
    const res = await request<{ activity: LogItem[] }>(`/api/v1/user-activity/listActivity`)
    const items = res?.activity ?? []

    // Since the backend doesn't handle pagination/filtering yet, we'll do it client-side
    let filteredItems = items

    // Apply filters
    if (params.userId) {
      filteredItems = filteredItems.filter((item) => item.user_id.toLowerCase().includes(params.userId!.toLowerCase()))
    }
    if (params.tableName) {
      filteredItems = filteredItems.filter((item) =>
        item.table_name.toLowerCase().includes(params.tableName!.toLowerCase()),
      )
    }
    if (params.actionType) {
      filteredItems = filteredItems.filter((item) => item.action_type === params.actionType)
    }
    if (params.from) {
      filteredItems = filteredItems.filter((item) => new Date(item.created_at) >= new Date(params.from!))
    }
    if (params.to) {
      filteredItems = filteredItems.filter((item) => new Date(item.created_at) <= new Date(params.to!))
    }

    // Apply pagination
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const startIndex = (page - 1) * pageSize
    const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize)

    return {
      items: paginatedItems,
      total: filteredItems.length,
      page,
      pageSize,
    }
  },
}
// Roles & Role Assignments
export const rolesApi = {
  list: async () => {
    const res = await request<{ roles: Array<{ id: string; role_name: string; created_at?: string }> }>(
      `/api/v1/roles/getAllRoles`
    );
    return res?.roles ?? [];
  },
  create: (roleName: string) => {
    const userId = typeof window !== 'undefined'
      ? (localStorage.getItem('userId') || localStorage.getItem('userId:') || '')
      : '';
    if (!userId) throw new Error('User ID not found in localStorage');
    return request(`/api/v1/roles/createRole/${userId}`, {
      method: 'POST',
      body: { role_name: roleName },
    });
  },
  remove: (roleId: string) => request(`/roles/${roleId}`, { method: 'DELETE' }),
  usersWithRoles: async () => {
    const res = await request<{ userRoles: Array<{ id: string; user_id: string; role_id: string; username?: string; email?: string; role_name: string }> }>(
      `/api/v1/user-roles/getAllUserRoles`
    );
    const rows = res?.userRoles ?? [];
    const userIdToGroup: Record<string, { user: { id: string; name?: string; email?: string }; roles: Array<{ id: string; role_name: string; created_at?: string }> }> = {};
    for (const row of rows) {
      if (!userIdToGroup[row.user_id]) {
        userIdToGroup[row.user_id] = {
          user: { id: row.user_id, name: row.username, email: row.email },
          roles: [],
        };
      }
      userIdToGroup[row.user_id].roles.push({
        // Use assignment id so UI can remove assignment with this id
        id: row.id,
        role_name: row.role_name,
      });
    }
    return Object.values(userIdToGroup);
  }, // shape: [{ user, roles: [] }]
  assignRole: (userId: string, roleId: string) => request(`/user-roles`, { method: 'POST', body: { user_id: userId, role_id: roleId } }),
  removeRole: (userRoleId: string) => request(`/user-roles/${userRoleId}`, { method: 'DELETE' }),
  getUserRoles: async (userId: string) => {
    const res = await request<{ roles: Array<{ id: string; user_id: string; role_id: string; role_name: string }> }>(
      `/api/v1/user-roles/getUserRoles/${userId}`
    );
    return res?.roles ?? [];
  },
};

// Approvals (Pending Changes)
export const approvalsApi = {
  list: (params: { page?: number; pageSize?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.pageSize) search.set('pageSize', String(params.pageSize));
    const qs = search.toString();
    return request<{ items: any[]; total: number }>(`/approvals${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/approvals/${id}`),
  approve: (id: string) => request(`/approvals/${id}/approve`, { method: 'POST' }),
  reject: (id: string, reason?: string) => request(`/approvals/${id}/reject`, { method: 'POST', body: { reason } }),
};

// Therapeutics
export const therapeuticsApi = {
  // Overview endpoints
  createOverview: (data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/overview`, { method: 'POST', body: data }),
  getAllOverviews: () =>
    request(`/api/v1/therapeutic/overview`),
  getOverviewById: (id: string) =>
    request(`/api/v1/therapeutic/overview/${id}`),
  updateOverview: (id: string, data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/overview/${id}`, { method: 'PATCH', body: data }),
  deleteOverview: (id: string, data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/overview/${id}`, { method: 'DELETE', body: data }),

  // Outcome endpoints
  createOutcome: (data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/outcome`, { method: 'POST', body: data }),
  getAllOutcomes: () =>
    request(`/api/v1/therapeutic/outcome`),
  getOutcomesByTrial: (trialId: string) =>
    request(`/api/v1/therapeutic/outcome/trial/${trialId}`),
  updateOutcomeByTrial: (trialId: string, data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/outcome/trial/${trialId}`, { method: 'PATCH', body: data }),
  deleteOutcomeByTrial: (trialId: string, data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/outcome/trial/${trialId}`, { method: 'DELETE', body: data }),

  // Criteria endpoints
  createCriteria: (data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/criteria`, { method: 'POST', body: data }),
  updateCriteriaByTrial: (trialId: string, data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/criteria/trial/${trialId}`, { method: 'PATCH', body: data }),

  // Timing endpoints
  createTiming: (data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/timing`, { method: 'POST', body: data }),
  updateTimingByTrial: (trialId: string, data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/timing/trial/${trialId}`, { method: 'PATCH', body: data }),

  // Results endpoints
  createResults: (data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/results`, { method: 'POST', body: data }),
  updateResultsByTrial: (trialId: string, data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/results/trial/${trialId}`, { method: 'PATCH', body: data }),

  // Sites endpoints
  createSites: (data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/sites`, { method: 'POST', body: data }),
  updateSitesByTrial: (trialId: string, data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/sites/trial/${trialId}`, { method: 'PATCH', body: data }),

  // Other Sources endpoints
  createOtherSources: (data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/other`, { method: 'POST', body: data }),
  updateOtherSourcesByTrial: (trialId: string, data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/other/trial/${trialId}`, { method: 'PATCH', body: data }),

  // Logs endpoints
  createLog: (data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/logs`, { method: 'POST', body: data }),
  updateLogByTrial: (trialId: string, data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/logs/trial/${trialId}`, { method: 'PATCH', body: data }),

  // Notes endpoints
  createNote: (data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/notes`, { method: 'POST', body: data }),
  updateNoteByTrial: (trialId: string, data: Record<string, unknown>) =>
    request(`/api/v1/therapeutic/notes/trial/${trialId}`, { method: 'PATCH', body: data }),
};

// Drugs
export const drugsApi = {
  // Get all drugs with complete data
  getAllDrugsWithData: () =>
    request<{ message: string; total_drugs: number; drugs: any[] }>(`/api/v1/drugs/all-drugs-with-data`),
  
  // Basic CRUD operations
  create: (data: Record<string, unknown>) =>
    request(`/api/v1/drugs/create-drug`, { method: 'POST', body: data }),
  
  getById: (id: string) =>
    request(`/api/v1/drugs/${id}`),
  
  update: (id: string, data: Record<string, unknown>) =>
    request(`/api/v1/drugs/update/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    request(`/api/v1/drugs/delete/${id}`, { method: 'DELETE' }),
  
  // Search and filter
  search: (query: string) =>
    request(`/api/v1/drugs/search?q=${encodeURIComponent(query)}`),
  
  // Get drugs by status
  getByStatus: (status: string) =>
    request(`/api/v1/drugs/status/${status}`),
  
  // Get drugs by manufacturer
  getManufacturer: (manufacturer: string) =>
    request(`/api/v1/drugs/manufacturer/${manufacturer}`),
};

export type { HttpMethod };

/**
 * Helper function to build a normalized API URL, removing double slashes
 * Use this for direct fetch calls instead of manually concatenating URLs
 */
export function buildApiUrl(path: string): string {
  const baseUrl = resolveBaseUrl();
  // Ensure path starts with / and remove any leading slashes to prevent double slashes
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Remove any double slashes that might occur (but preserve http:// or https://)
  const fullUrl = baseUrl
    ? `${baseUrl}${normalizedPath}`.replace(/([^:]\/)\/+/g, "$1")
    : normalizedPath;
  return fullUrl;
}


