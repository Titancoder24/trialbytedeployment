// API service for dropdown management
import { useState, useEffect } from 'react';
import { buildApiUrl } from '@/app/_lib/api';

export interface DropdownCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DropdownOption {
  id: number;
  value: string;
  label: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class DropdownManagementAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = buildApiUrl(`/api/v1/dropdown-management${endpoint}`);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      });

      // Handle network errors
      if (!response.ok) {
        try {
          const data = await response.json();
          return {
            success: false,
            error: data.message || `Request failed (${response.status})`,
          };
        } catch {
          return {
            success: false,
            error: `Request failed (${response.status})`,
          };
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Handle network errors (API unreachable, CORS, etc.)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const url = buildApiUrl(`/api/v1/dropdown-management${endpoint}`);
        console.warn('Dropdown management API might be unreachable:', url);
        return {
          success: false,
          error: 'Network error - API might be unreachable',
        };
      }
      console.warn('Dropdown management API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Categories
  async getCategories(): Promise<ApiResponse<DropdownCategory[]>> {
    return this.request<DropdownCategory[]>('/categories');
  }

  async createCategory(category: {
    name: string;
    description?: string;
  }): Promise<ApiResponse<DropdownCategory>> {
    return this.request<DropdownCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(
    id: number,
    category: {
      name: string;
      description?: string;
      is_active: boolean;
    }
  ): Promise<ApiResponse<DropdownCategory>> {
    return this.request<DropdownCategory>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Options
  async getOptions(categoryName?: string): Promise<ApiResponse<DropdownOption[]>> {
    const endpoint = categoryName ? `/options/${categoryName}` : '/options';
    return this.request<DropdownOption[]>(endpoint);
  }

  async createOption(option: {
    categoryName: string;
    value: string;
    label: string;
    description?: string;
    sortOrder?: number;
  }): Promise<ApiResponse<DropdownOption>> {
    return this.request<DropdownOption>('/options', {
      method: 'POST',
      body: JSON.stringify(option),
    });
  }

  async updateOption(
    id: number,
    option: {
      value: string;
      label: string;
      description?: string;
      sortOrder: number;
      isActive: boolean;
    }
  ): Promise<ApiResponse<DropdownOption>> {
    return this.request<DropdownOption>(`/options/${id}`, {
      method: 'PUT',
      body: JSON.stringify(option),
    });
  }

  async deleteOption(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/options/${id}`, {
      method: 'DELETE',
    });
  }
}

export const dropdownManagementAPI = new DropdownManagementAPI();

// Hook for using dropdown options in components
export const useDropdownOptions = (categoryName: string) => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dropdownManagementAPI.getOptions(categoryName);

        if (response.success && response.data) {
          setOptions(response.data);
        } else {
          setError(response.error || 'Failed to fetch options');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [categoryName]);

  return { options, loading, error };
};

// Utility function to convert dropdown options to SearchableSelectOption format
// Also deduplicates values that are essentially the same but differ by formatting
export const convertToSearchableSelectOptions = (options: DropdownOption[]) => {
  // First, convert to the target format
  const converted = options.map(option => ({
    value: option.value,
    label: option.label,
  }));

  // Normalize for comparison: remove all types of dashes and extra spaces
  const normalizeForComparison = (str: string): string => {
    return str
      .replace(/\s*[—–-]\s*/g, '') // Remove all types of dashes with surrounding spaces
      .replace(/\s+/g, ' ')        // Normalize multiple spaces to single space
      .toLowerCase()
      .trim();
  };

  // Deduplicate: keep the version with em dash (—) as preferred format
  const deduplicatedMap = new Map<string, { value: string; label: string }>();

  converted.forEach(option => {
    const normalized = normalizeForComparison(option.label);
    const existing = deduplicatedMap.get(normalized);

    if (!existing) {
      deduplicatedMap.set(normalized, option);
    } else {
      // Prefer the version with em dash (—) over regular dash or no dash
      const hasEmDash = (str: string) => str.includes('—');
      const hasEnDash = (str: string) => str.includes('–');

      if (hasEmDash(option.label) && !hasEmDash(existing.label)) {
        deduplicatedMap.set(normalized, option);
      } else if (hasEnDash(option.label) && !hasEmDash(existing.label) && !hasEnDash(existing.label)) {
        deduplicatedMap.set(normalized, option);
      }
      // Keep existing if it already has better formatting
    }
  });

  return Array.from(deduplicatedMap.values());
};
