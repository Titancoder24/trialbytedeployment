"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatDateToMMDDYYYY } from "@/lib/date-utils";
import { normalizePhaseValue } from "@/lib/search-utils";
import { formatDisplayValue, normalizeForComparison } from "@/lib/format-utils";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Eye, Plus, Search, Loader2, Filter, Clock, Edit, ChevronDown, Settings, Download, Save, ExternalLink, Maximize2, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TherapeuticAdvancedSearchModal, TherapeuticSearchCriteria } from "@/components/therapeutic-advanced-search-modal";
import { TherapeuticFilterModal, TherapeuticFilterState } from "@/components/therapeutic-filter-modal";
import { SaveQueryModal } from "@/components/save-query-modal";
import { QueryHistoryModal } from "@/components/query-history-modal";
import { QueryLogsModal } from "@/components/query-logs-modal";
import { CustomizeColumnModal, ColumnSettings, DEFAULT_COLUMN_SETTINGS, COLUMN_OPTIONS } from "@/components/customize-column-modal";
import { usersApi, buildApiUrl } from "@/app/_lib/api";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Types based on the API response
interface TherapeuticTrial {
  trial_id: string;
  overview: {
    id: string;
    therapeutic_area: string;
    trial_identifier: string[];
    trial_id?: string; // New field for TB-XXXXXX format
    trial_phase: string;
    status: string;
    primary_drugs: string;
    other_drugs: string;
    title: string;
    disease_type: string;
    patient_segment: string;
    line_of_therapy: string;
    reference_links: string[];
    trial_tags: string;
    sponsor_collaborators: string;
    sponsor_field_activity: string;
    associated_cro: string;
    countries: string;
    region: string;
    trial_record_status: string;
    created_at: string;
    updated_at: string;
    original_trial_id?: string;
    is_updated_version?: boolean;
  };
  outcomes: Array<{
    id: string;
    trial_id: string;
    purpose_of_trial: string;
    summary: string;
    primary_outcome_measure: string;
    other_outcome_measure: string;
    study_design_keywords: string;
    study_design: string;
    treatment_regimen: string;
    number_of_arms: number;
  }>;
  criteria: Array<{
    id: string;
    trial_id: string;
    inclusion_criteria: string;
    exclusion_criteria: string;
    age_from: string;
    subject_type: string;
    age_to: string;
    sex: string;
    healthy_volunteers: string;
    target_no_volunteers: number;
    actual_enrolled_volunteers: number | null;
  }>;
  timing: Array<{
    id: string;
    trial_id: string;
    start_date_estimated: string | null;
    trial_end_date_estimated: string | null;
  }>;
  results: Array<{
    id: string;
    trial_id: string;
    trial_outcome: string;
    reference: string;
    trial_results: string[];
    adverse_event_reported: string;
    adverse_event_type: string | null;
    treatment_for_adverse_events: string | null;
    results_available: boolean | string;
    endpoints_met: boolean | string;
  }>;
  sites: Array<{
    id: string;
    trial_id: string;
    total: number;
    notes: string;
  }>;
  other: Array<{
    id: string;
    trial_id: string;
    data: string;
  }>;
  logs: Array<{
    id: string;
    trial_id: string;
    trial_changes_log: string;
    trial_added_date: string;
    last_modified_date: string | null;
    last_modified_user: string | null;
    full_review_user: string | null;
    next_review_date: string | null;
    attachment: string | null;
    internal_note: string | null;
  }>;
  notes: Array<{
    id: string;
    trial_id: string;
    date_type: string;
    notes: string;
    link: string;
    attachments: string[] | null;
  }>;
}

interface ApiResponse {
  message: string;
  total_trials: number;
  trials: TherapeuticTrial[];
}

export default function AdminTherapeuticsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [trials, setTrials] = useState<TherapeuticTrial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrial, setSelectedTrial] = useState<TherapeuticTrial | null>(
    null
  );
  const [deletingTrials, setDeletingTrials] = useState<Record<string, boolean>>(
    {}
  );
  const [isDeletingAllTrials, setIsDeletingAllTrials] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState<TherapeuticSearchCriteria[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<TherapeuticFilterState>({
    // Basic Info Section
    therapeuticAreas: [],
    statuses: [],
    diseaseTypes: [],
    primaryDrugs: [],
    trialPhases: [],
    patientSegments: [],
    lineOfTherapy: [],
    countries: [],
    sponsorsCollaborators: [],
    sponsorFieldActivity: [],
    associatedCro: [],
    trialTags: [],
    otherDrugs: [],
    regions: [],
    trialRecordStatus: [],
    // Eligibility Section
    inclusionCriteria: [],
    exclusionCriteria: [],
    ageFrom: [],
    ageTo: [],
    subjectType: [],
    sex: [],
    healthyVolunteers: [],
    targetNoVolunteers: [],
    actualEnrolledVolunteers: [],
    // Study Design Section
    purposeOfTrial: [],
    summary: [],
    primaryOutcomeMeasures: [],
    otherOutcomeMeasures: [],
    studyDesignKeywords: [],
    studyDesign: [],
    treatmentRegimen: [],
    numberOfArms: [],
    // Timing Section
    startDateEstimated: [],
    trialEndDateEstimated: [],
    // Results Section
    resultsAvailable: [],
    endpointsMet: [],
    adverseEventsReported: [],
    trialOutcome: [],
    trialOutcomeContent: [],
    adverseEventReported: [],
    adverseEventType: [],
    treatmentForAdverseEvents: [],
    // Sites Section
    totalSites: [],
    siteNotes: [],
  });
  const [saveQueryModalOpen, setSaveQueryModalOpen] = useState(false);
  const [queryHistoryModalOpen, setQueryHistoryModalOpen] = useState(false);
  const [queryLogsModalOpen, setQueryLogsModalOpen] = useState(false);
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null);
  const [editingQueryTitle, setEditingQueryTitle] = useState<string>("");
  const [editingQueryDescription, setEditingQueryDescription] = useState<string>("");

  // Sorting state
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Column customization state
  const [customizeColumnModalOpen, setCustomizeColumnModalOpen] = useState(false);
  const [columnSettings, setColumnSettings] = useState<ColumnSettings>(DEFAULT_COLUMN_SETTINGS);
  const isDevMode = process.env.NODE_ENV === "development";

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Multiple selection state
  const [selectedTrials, setSelectedTrials] = useState<Set<string>>(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [showViewSelectedButton, setShowViewSelectedButton] = useState(false);

  // User name mapping cache
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});

  // Drug name mapping: maps each drug name to all related names (drug_name, generic_name, other_name) from the same drug entry
  const [drugNameMapping, setDrugNameMapping] = useState<Map<string, Set<string>>>(new Map());

  // Populate user name mapping cache from trials data
  const populateUserNameMap = async (trialsData: TherapeuticTrial[]) => {
    const userIds = new Set<string>();

    // Collect all unique user IDs from logs
    trialsData.forEach(trial => {
      if (trial.logs && trial.logs.length > 0) {
        trial.logs.forEach(log => {
          if (log.last_modified_user && log.last_modified_user.trim() !== "") {
            userIds.add(log.last_modified_user);
          }
        });
      }
    });

    // Fetch users and build mapping
    try {
      const users = await usersApi.list();
      const newMap: Record<string, string> = {};

      userIds.forEach(userId => {
        // Check if it's already "Admin" or "admin"
        const lowerUserId = userId.toLowerCase();
        if (lowerUserId === 'admin' || lowerUserId === 'administrator') {
          newMap[userId] = 'Admin';
          return;
        }

        // Check if it's a UUID (user ID format)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(userId)) {
          const user = users.find((u: any) => u.id === userId);
          if (user && user.username) {
            newMap[userId] = user.username;
          } else {
            // Default to "Admin" if user not found
            newMap[userId] = 'Admin';
          }
        } else {
          // If it's not a UUID, it might already be a username/name
          newMap[userId] = userId;
        }
      });

      setUserNameMap(prev => ({ ...prev, ...newMap }));
      console.log('User name mapping populated:', newMap);
    } catch (error: any) {
      // Handle network errors gracefully
      const isNetworkError = error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('NetworkError') ||
        error?.message?.includes('Network error');

      if (isNetworkError) {
        console.warn("Network error populating user name map (non-critical):", error);
      } else {
        console.warn("Error populating user name map (non-critical):", error);
      }
      // Continue with existing map if user fetch fails
    }
  };

  // Fetch trials data
  // Filter function to show only the latest version of each record
  const filterLatestVersions = (trials: TherapeuticTrial[]) => {
    const trialMap = new Map<string, TherapeuticTrial>();

    trials.forEach(trial => {
      const key = trial.overview?.title || trial.trial_id;

      // If this trial has an original_trial_id, it's an updated version
      if (trial.overview?.original_trial_id) {
        // This is an updated version, replace the original
        trialMap.set(key, trial);
      } else if (!trialMap.has(key)) {
        // This is an original version, add it if we don't have a newer version
        trialMap.set(key, trial);
      }
      // If we already have a newer version, skip this old one
    });

    return Array.from(trialMap.values());
  };

  // Apply localStorage updates to trials data (lightweight - only clears update flags)
  const applyLocalStorageUpdates = (trials: TherapeuticTrial[]) => {
    try {
      // Clear any pending update flags after data is fetched from API
      trials.forEach(trial => {
        try {
          const recentlyUpdated = localStorage.getItem(`trial_updated_${trial.trial_id}`);
          if (recentlyUpdated) {
            localStorage.removeItem(`trial_updated_${trial.trial_id}`);
          }
        } catch (e) {
          // Ignore localStorage errors
        }
      });
      return trials;
    } catch (error) {
      console.error('Error applying localStorage updates:', error);
      return trials;
    }
  };


  // Clean up old versions (optional - can be called manually)
  const cleanupOldVersions = () => {
    const mappings = JSON.parse(localStorage.getItem('trialUpdateMappings') || '[]');
    if (mappings.length > 0) {
      console.log('Found trial update mappings:', mappings);
      console.log('Old versions can be cleaned up from the database if needed');
      // In a real scenario, you might want to call an API to delete old versions
    }
  };

  const fetchTrials = async (isRefresh = false, showToast = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch fresh data from API (removed localStorage caching to avoid quota issues)
      let response: Response;
      try {
        // Use normalized URL helper to prevent double slashes
        const apiUrl = buildApiUrl("/api/v1/therapeutic/all-trials-with-data");
        response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      } catch (fetchError: any) {
        // Handle network errors gracefully
        if (fetchError?.message?.includes('Failed to fetch') || fetchError?.name === 'TypeError') {
          console.warn("Network error fetching trials (non-critical):", fetchError);
          // Don't show error toast for network errors, just use existing data
          return;
        }
        throw fetchError;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      const allTrials = data.trials || [];

      // Filter out old versions and only show the latest version of each record
      const filteredTrials = filterLatestVersions(allTrials);

      // Apply localStorage updates to show the latest edited values
      const trialsWithLocalUpdates = applyLocalStorageUpdates(filteredTrials);

      // Use the updated data (API + localStorage updates) as the source of truth
      setTrials(trialsWithLocalUpdates);

      // Pre-populate user name mapping cache
      populateUserNameMap(trialsWithLocalUpdates);

      if (isRefresh && showToast) {
        toast({
          title: "Refreshed",
          description: "Clinical trials data has been updated",
        });
      }

    } catch (error: any) {
      // Handle network errors gracefully
      const isNetworkError = error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('NetworkError') ||
        error?.name === 'TypeError';

      if (isNetworkError) {
        console.warn("Network error fetching trials (non-critical):", error);
        // Don't show error toast for network errors, just use existing data
      } else {
        console.warn("Error fetching trials (non-critical):", error);
        toast({
          title: "Error",
          description: "Failed to fetch trials data. Please check your connection and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch drugs and build drug name mapping
  const fetchDrugsAndBuildMapping = async () => {
    try {
      let response: Response;
      try {
        // Use normalized URL helper to prevent double slashes
        const apiUrl = buildApiUrl("/api/v1/drugs/all-drugs-with-data");
        response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      } catch (fetchError: any) {
        // Handle network errors gracefully
        if (fetchError?.message?.includes('Failed to fetch') || fetchError?.name === 'TypeError') {
          console.warn("Network error fetching drugs for mapping (non-critical):", fetchError);
          return;
        }
        throw fetchError;
      }

      if (!response.ok) {
        console.warn("Failed to fetch drugs for mapping (non-critical):", response.status);
        return;
      }

      const data = await response.json();
      const drugs = data.drugs || [];

      // Build mapping: each drug name (drug_name, generic_name, other_name) maps to a set of all related names
      const mapping = new Map<string, Set<string>>();

      drugs.forEach((drug: any) => {
        const overview = drug.overview || {};
        const drugName = (overview.drug_name || "").trim();
        const genericName = (overview.generic_name || "").trim();
        const otherName = (overview.other_name || "").trim();

        // Collect all non-empty names for this drug
        const allNames = new Set<string>();
        if (drugName) allNames.add(drugName);
        if (genericName) allNames.add(genericName);
        if (otherName) allNames.add(otherName);

        // Only process if we have at least one name
        if (allNames.size > 0) {
          // Map each name to the set of all related names
          allNames.forEach(name => {
            if (!mapping.has(name)) {
              mapping.set(name, new Set<string>());
            }
            // Add all names from this drug to the mapping for each name
            allNames.forEach(relatedName => {
              mapping.get(name)!.add(relatedName);
            });
          });
        }
      });

      setDrugNameMapping(mapping);
      console.log("Drug name mapping built. Total entries:", mapping.size);

      // Log all entries for debugging
      if (mapping.size > 0) {
        console.log("All drug mapping entries:");
        mapping.forEach((relatedSet, drugName) => {
          const relatedArray = Array.from(relatedSet);
          console.log(`  "${drugName}" -> [${relatedArray.join(", ")}]`);

          // Specifically log entries containing "value 100", "value 101", or "value 102"
          if (drugName.toLowerCase().includes('value 100') ||
            drugName.toLowerCase().includes('value 101') ||
            drugName.toLowerCase().includes('value 102') ||
            relatedArray.some(name => name.toLowerCase().includes('value 100') ||
              name.toLowerCase().includes('value 101') ||
              name.toLowerCase().includes('value 102'))) {
            console.log(`  *** Found value 100/101/102 entry: "${drugName}" -> [${relatedArray.join(", ")}]`);
          }
        });
      } else {
        console.warn("Drug name mapping is empty! No drugs found or drugs have no names.");
      }
    } catch (error: any) {
      // Handle network errors gracefully
      const isNetworkError = error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('NetworkError') ||
        error?.name === 'TypeError';

      if (isNetworkError) {
        console.warn("Network error fetching drugs for mapping (non-critical):", error);
      } else {
        console.warn("Error fetching drugs for mapping (non-critical):", error);
      }
      // Continue without drug mapping if fetch fails
    }
  };

  // Clear cache function
  const clearCache = () => {
    try {
      console.log("[AdminTherapeuticsPage] Clearing therapeutic trial cache keys");
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (
          key === "therapeuticTrials" ||
          key.startsWith("trial_")
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => {
        console.log("[AdminTherapeuticsPage] Removing localStorage key:", key);
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn("[AdminTherapeuticsPage] Failed to clear trial cache:", error);
    }
  };


  const deleteAllTrials = async () => {
    if (!isDevMode) {
      toast({
        title: "Restricted",
        description: "Bulk delete is only available in development mode.",
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        "This will permanently delete ALL trials from the development database. Are you sure you want to continue?"
      )
    ) {
      return;
    }

    const currentUserId = typeof window !== 'undefined'
      ? localStorage.getItem("userId") || "2be97b5e-5bf3-43f2-b84a-4db4a138e497"
      : "2be97b5e-5bf3-43f2-b84a-4db4a138e497";

    setIsDeletingAllTrials(true);

    try {
      // Use normalized URL helper to prevent double slashes
      const apiUrl = buildApiUrl("/api/v1/therapeutic/all-trials/dev");
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ user_id: currentUserId }),
      }
      );

      if (response.ok) {
        const data = await response.json().catch(() => null);
        console.log("[AdminTherapeuticsPage] Delete all trials response:", data);
        clearCache();
        setTrials([]);
        setSelectedTrials(new Set());
        setIsSelectAllChecked(false);
        toast({
          title: "All trials deleted",
          description: `Removed ${data?.deleted_count ?? 0} trial(s) from the development database.`,
        });
        await fetchTrials(true);
      } else {
        const errorPayload = await response.json().catch(() => null);
        console.error(
          "[AdminTherapeuticsPage] Delete all trials failed:",
          errorPayload
        );
        toast({
          title: "Error",
          description:
            errorPayload?.message || "Failed to delete all trials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(
        "[AdminTherapeuticsPage] Delete all trials exception:",
        error
      );
      toast({
        title: "Error",
        description: "Failed to delete all trials",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAllTrials(false);
    }
  };

  // Delete trial
  const deleteTrial = async (trialId: string) => {
    if (!confirm("Are you sure you want to delete this trial?")) return;

    try {
      setDeletingTrials((prev) => ({ ...prev, [trialId]: true }));

      const currentUserId = typeof window !== 'undefined'
        ? localStorage.getItem("userId") || "2be97b5e-5bf3-43f2-b84a-4db4a138e497"
        : "2be97b5e-5bf3-43f2-b84a-4db4a138e497";

      // Use normalized URL helper to prevent double slashes
      const apiUrl = buildApiUrl(`/api/v1/therapeutic/trial/${trialId}/${currentUserId}/delete-all`);
      const response = await fetch(apiUrl, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Clear localStorage cache to prevent stale data
        clearCache();

        // Optimistically remove the trial from the current state
        setTrials(prevTrials => prevTrials.filter(trial => trial.trial_id !== trialId));

        toast({
          title: "Success",
          description: "Trial deleted successfully",
        });

        // Refresh the list to ensure consistency (force refresh from API)
        await fetchTrials(true);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete trial",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting trial:", error);
      toast({
        title: "Error",
        description: "Failed to delete trial",
        variant: "destructive",
      });
    } finally {
      setDeletingTrials((prev) => ({ ...prev, [trialId]: false }));
    }
  };

  // Handle edit button click
  const handleEditClick = (trialId: string) => {
    const popup = window.open(
      `/admin/therapeutics/edit/${trialId}`,
      `edit_trial_${trialId}`,
      "width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no"
    );
    if (!popup) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups for this site to edit trials.",
        variant: "destructive",
      });
    }
  };

  // Handle advanced search
  const handleAdvancedSearch = async (criteria: TherapeuticSearchCriteria[]) => {
    console.log('Advanced search criteria:', criteria);

    // Always rebuild drug mapping if search involves drug fields to ensure it is up-to-date
    const hasDrugField = criteria.some(c => c.field === 'primary_drugs' || c.field === 'other_drugs');

    const startTime = Date.now();
    setIsSearching(true);

    try {
      if (hasDrugField) {
        console.log('Search involves drug fields, rebuilding drug mapping...');
        await fetchDrugsAndBuildMapping();
      }

      setAdvancedSearchCriteria(criteria);

      // Log advanced search execution
      const executionTime = Date.now() - startTime;
      const queryLog = {
        id: Date.now().toString(),
        queryId: 'advanced_search_' + Date.now(),
        queryTitle: 'Advanced Search',
        queryDescription: `Advanced search with ${criteria.length} criteria`,
        executedAt: new Date().toISOString(),
        executedBy: 'current_user',
        queryType: 'advanced_search' as const,
        criteria: criteria,
        filters: appliedFilters,
        searchTerm: searchTerm,
        resultCount: trials.length, // This will be updated after filtering
        executionTime: executionTime
      };

      // Save to localStorage with limit to prevent quota errors
      try {
        const existingLogs = JSON.parse(localStorage.getItem('queryExecutionLogs') || '[]');
        existingLogs.unshift(queryLog);
        // Keep only the last 50 logs to prevent quota overflow
        const limitedLogs = existingLogs.slice(0, 50);
        localStorage.setItem('queryExecutionLogs', JSON.stringify(limitedLogs));
      } catch (e) {
        console.warn('Could not save query log to localStorage:', e);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle advanced search modal close
  const handleAdvancedSearchModalChange = (open: boolean) => {
    setIsAdvancedSearchOpen(open);
    // Clear editing state when modal closes
    if (!open) {
      setEditingQueryId(null);
      setEditingQueryTitle("");
      setEditingQueryDescription("");
    }
  };

  // Handle load query from history
  const handleLoadQuery = (queryData: any) => {
    console.log('Loading query data:', queryData);

    const startTime = Date.now();

    // Load search criteria if available
    if (queryData.searchCriteria && Array.isArray(queryData.searchCriteria)) {
      setAdvancedSearchCriteria(queryData.searchCriteria);
    }

    // Load filters if available
    if (queryData.filters) {
      setAppliedFilters(queryData.filters);
    }

    // Load search term if available
    if (queryData.searchTerm) {
      setSearchTerm(queryData.searchTerm);
    }

    // Log query execution with proper metadata
    const executionTime = Date.now() - startTime;
    const queryLog = {
      id: Date.now().toString(),
      queryId: queryData.queryId || 'unknown',
      queryTitle: queryData.queryTitle || 'Unknown Query',
      queryDescription: queryData.queryDescription || null,
      executedAt: new Date().toISOString(),
      executedBy: 'current_user', // You can replace this with actual user info
      queryType: 'saved_query' as const,
      criteria: queryData.searchCriteria,
      filters: queryData.filters,
      searchTerm: queryData.searchTerm,
      resultCount: trials.length, // This will be updated after filtering
      executionTime: executionTime
    };

    // Save to localStorage with limit to prevent quota errors
    try {
      const existingLogs = JSON.parse(localStorage.getItem('queryExecutionLogs') || '[]');
      existingLogs.unshift(queryLog); // Add to beginning of array
      // Keep only the last 50 logs to prevent quota overflow
      const limitedLogs = existingLogs.slice(0, 50);
      localStorage.setItem('queryExecutionLogs', JSON.stringify(limitedLogs));
    } catch (e) {
      console.warn('Could not save query log to localStorage:', e);
    }

    toast({
      title: "Query Loaded",
      description: "Query has been loaded successfully",
    });
  };

  // Handle execute query from logs
  const handleExecuteQueryFromLog = (queryData: any) => {
    console.log('Executing query from log:', queryData);

    // Load search criteria if available
    if (queryData.searchCriteria && Array.isArray(queryData.searchCriteria)) {
      setAdvancedSearchCriteria(queryData.searchCriteria);
    }

    // Load filters if available
    if (queryData.filters) {
      setAppliedFilters(queryData.filters);
    }

    // Load search term if available
    if (queryData.searchTerm) {
      setSearchTerm(queryData.searchTerm);
    }

    toast({
      title: "Query Executed",
      description: `"${queryData.queryTitle}" has been applied to your current view`,
    });
  };

  // Handle edit query from history
  const handleEditQuery = (queryData: any) => {
    console.log('Editing query data:', queryData);

    // Store the query being edited
    setEditingQueryId(queryData.queryId);
    setEditingQueryTitle(queryData.queryTitle || "");
    setEditingQueryDescription(queryData.queryDescription || "");

    // Determine content presence
    const hasAdvancedCriteria = queryData.searchCriteria && Array.isArray(queryData.searchCriteria) && queryData.searchCriteria.length > 0;

    // Load search criteria
    if (queryData.searchCriteria && Array.isArray(queryData.searchCriteria)) {
      setAdvancedSearchCriteria(queryData.searchCriteria);
    } else {
      setAdvancedSearchCriteria([]);
    }

    // Load filters if available
    if (queryData.filters) {
      setAppliedFilters(queryData.filters);
    }

    // Load search term if available
    if (queryData.searchTerm) {
      setSearchTerm(queryData.searchTerm);
    } else {
      setSearchTerm("");
    }

    // Open the appropriate modal
    // If it has advanced criteria, it must be an advanced search
    if (hasAdvancedCriteria) {
      setIsAdvancedSearchOpen(true);
      setFilterModalOpen(false);
    } else {
      // Otherwise, assume it's a filter-based query (or basic search) and open Filter Modal
      setFilterModalOpen(true);
      setIsAdvancedSearchOpen(false);
    }
  };

  // Handle save query success
  const handleSaveQuerySuccess = () => {
    // Clear editing state after successful save
    setEditingQueryId(null);
    setEditingQueryTitle("");
    setEditingQueryDescription("");
  };

  // Handle search term change
  const handleSearchTermChange = (value: string) => {
    console.log('Search term changed:', {
      previousValue: searchTerm,
      newValue: value,
      trimmedValue: value.trim(),
      totalTrials: trials.length
    });
    setSearchTerm(value);
  };

  // Handle filter application
  const handleApplyFilters = (filters: TherapeuticFilterState) => {
    const startTime = Date.now();

    setAppliedFilters(filters);
    const activeFilterCount = Object.values(filters).reduce((count, arr) => count + arr.length, 0);

    // Log filter execution
    const executionTime = Date.now() - startTime;
    const queryLog = {
      id: Date.now().toString(),
      queryId: 'filter_' + Date.now(),
      queryTitle: 'Filter Application',
      queryDescription: `Applied ${activeFilterCount} filter criteria`,
      executedAt: new Date().toISOString(),
      executedBy: 'current_user',
      queryType: 'filter' as const,
      criteria: advancedSearchCriteria,
      filters: filters,
      searchTerm: searchTerm,
      resultCount: trials.length, // This will be updated after filtering
      executionTime: executionTime
    };

    // Save to localStorage with limit to prevent quota errors
    try {
      const existingLogs = JSON.parse(localStorage.getItem('queryExecutionLogs') || '[]');
      existingLogs.unshift(queryLog);
      // Keep only the last 50 logs to prevent quota overflow
      const limitedLogs = existingLogs.slice(0, 50);
      localStorage.setItem('queryExecutionLogs', JSON.stringify(limitedLogs));
    } catch (e) {
      console.warn('Could not save query log to localStorage:', e);
    }

    if (activeFilterCount > 0) {
      toast({
        title: "Filters Applied",
        description: `Applied ${activeFilterCount} filter criteria`,
      });
    } else {
      toast({
        title: "Filters Cleared",
        description: "All filters have been cleared",
      });
    }
  };

  // Get available sort options (only enabled columns)
  const getAvailableSortOptions = (): Array<{ key: keyof ColumnSettings, label: string }> => {
    return COLUMN_OPTIONS.filter(option => columnSettings[option.key]);
  };

  // Handle sort field selection
  const handleSort = (field: keyof ColumnSettings) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort value from trial based on field
  const getSortValue = (trial: TherapeuticTrial, field: string): string | number => {
    // Helper to parse date string to timestamp (for proper date sorting)
    const parseDateToTimestamp = (dateStr: string | undefined | null): number => {
      if (!dateStr) return 0;
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    };

    switch (field) {
      // Core fields
      case "trialId": return trial.overview?.trial_id || trial.overview?.trial_identifier?.[0] || "";
      case "title": return trial.overview?.title || "";
      case "therapeuticArea": return trial.overview?.therapeutic_area || "";
      case "diseaseType": return trial.overview?.disease_type || "";
      case "primaryDrug": return trial.overview?.primary_drugs || "";
      case "trialPhase": return trial.overview?.trial_phase || "";
      case "patientSegment": return trial.overview?.patient_segment || "";
      case "lineOfTherapy": return trial.overview?.line_of_therapy || "";
      case "countries": return trial.overview?.countries || "";
      case "sponsorsCollaborators": return trial.overview?.sponsor_collaborators || "";
      case "fieldOfActivity": return trial.overview?.sponsor_field_activity || "";
      case "associatedCro": return trial.overview?.associated_cro || "";
      case "trialTags": return trial.overview?.trial_tags || "";
      case "otherDrugs": return trial.overview?.other_drugs || "";
      case "regions": return trial.overview?.region || "";
      case "trialRecordStatus": return trial.overview?.trial_record_status || "";
      case "status": return trial.overview?.status || "";

      // Eligibility fields
      case "inclusionCriteria": return trial.criteria?.[0]?.inclusion_criteria || "";
      case "exclusionCriteria": return trial.criteria?.[0]?.exclusion_criteria || "";
      // Numeric fields - parse as numbers
      case "ageFrom": return parseFloat(trial.criteria?.[0]?.age_from || "0") || 0;
      case "ageTo": return parseFloat(trial.criteria?.[0]?.age_to || "0") || 0;
      case "subjectType": return trial.criteria?.[0]?.subject_type || "";
      case "sex": return trial.criteria?.[0]?.sex || "";
      case "healthyVolunteers": return trial.criteria?.[0]?.healthy_volunteers || "";
      case "targetNoVolunteers": return parseInt(String(trial.criteria?.[0]?.target_no_volunteers || "0")) || 0;
      case "actualEnrolledVolunteers": return parseInt(String(trial.criteria?.[0]?.actual_enrolled_volunteers || "0")) || 0;

      // Study Design fields
      case "purposeOfTrial": return trial.outcomes?.[0]?.purpose_of_trial || "";
      case "summary": return trial.outcomes?.[0]?.summary || "";
      case "primaryOutcomeMeasures": return trial.outcomes?.[0]?.primary_outcome_measure || "";
      case "otherOutcomeMeasures": return trial.outcomes?.[0]?.other_outcome_measure || "";
      case "studyDesignKeywords": return trial.outcomes?.[0]?.study_design_keywords || "";
      case "studyDesign": return trial.outcomes?.[0]?.study_design || "";
      case "treatmentRegimen": return trial.outcomes?.[0]?.treatment_regimen || "";
      case "numberOfArms": return parseInt(String(trial.outcomes?.[0]?.number_of_arms || "0")) || 0;

      // Timing fields - return timestamps for proper date sorting
      case "startDateEstimated": return parseDateToTimestamp(trial.timing?.[0]?.start_date_estimated);
      case "trialEndDateEstimated": return parseDateToTimestamp(trial.timing?.[0]?.trial_end_date_estimated);
      case "actualStartDate": return parseDateToTimestamp(trial.timing?.[0]?.start_date_actual);
      case "actualEnrollmentClosedDate": return parseDateToTimestamp(trial.timing?.[0]?.enrollment_closed_actual);
      case "actualTrialCompletionDate": return parseDateToTimestamp(trial.timing?.[0]?.trial_end_date_actual);
      case "actualPublishedDate": return parseDateToTimestamp(trial.timing?.[0]?.result_published_date_actual);
      case "estimatedEnrollmentClosedDate": return parseDateToTimestamp(trial.timing?.[0]?.enrollment_closed_estimated);
      case "estimatedResultPublishedDate": return parseDateToTimestamp(trial.timing?.[0]?.result_published_date_estimated);

      // Results fields - special handling for Yes/No sorting
      case "resultsAvailable": {
        const val = trial.results?.[0]?.results_available;
        if (val === true || val === "Yes" || val === "yes") return "Yes";
        if (val === false || val === "No" || val === "no") return "No";
        return "No"; // Default to No if not set
      }
      case "endpointsMet": {
        // Return the actual endpoints_met value (Yes/No/NA) for proper sorting
        const endpointsMet = trial.results?.[0]?.endpoints_met;
        if (endpointsMet) return endpointsMet;
        // Fallback to trial_outcome if endpoints_met is not available
        return trial.results?.[0]?.trial_outcome || "";
      }
      case "trialOutcome": return trial.results?.[0]?.trial_outcome || "";

      // Sites fields
      case "totalSites": return parseInt(String(trial.sites?.[0]?.total || "0")) || 0;

      // Admin-only fields
      case "referenceLinks": return Array.isArray(trial.overview?.reference_links) ? trial.overview.reference_links.join(", ") : "";
      case "nextReviewDate": return parseDateToTimestamp(trial.logs?.[0]?.next_review_date);
      case "lastModifiedDate": return parseDateToTimestamp(trial.logs?.[0]?.last_modified_date);

      default: return "";
    }
  };

  // Apply advanced search criteria to filter trials
  const applyAdvancedSearchFilter = (trial: TherapeuticTrial, criteria: TherapeuticSearchCriteria[]): boolean => {
    // Helper to get user name synchronously (using cache)
    const getUserNameSync = (userId: string): string => {
      if (!userId || userId.trim() === "") return "";

      // Check cache first
      if (userNameMap[userId]) {
        return userNameMap[userId];
      }

      // Check if it's already "Admin" or "admin"
      const lowerUserId = userId.toLowerCase();
      if (lowerUserId === 'admin' || lowerUserId === 'administrator') {
        return 'Admin';
      }

      // If it's not in cache and not "admin", return as-is (will be resolved later)
      return userId;
    };
    if (criteria.length === 0) return true;

    // Debug: Log all trials and their trial_tags/disease_type for debugging
    if (criteria.some(c => c.field === "trial_tags")) {
      console.log('All trials trial_tags and disease_type:', trials.map(t => ({
        id: t.trial_id,
        title: t.overview?.title || "N/A",
        trial_tags: t.overview?.trial_tags || "N/A",
        disease_type: t.overview?.disease_type || "N/A",
        combined: `${t.overview?.trial_tags || ""} ${t.overview?.disease_type || ""}`.trim()
      })));
    }

    const results = criteria.map((criterion) => {
      const { field, operator, value } = criterion;
      let fieldValue = "";

      // Get the field value from the trial data
      switch (field) {
        // Overview fields
        case "title": fieldValue = trial.overview.title || ""; break;
        case "therapeutic_area": fieldValue = trial.overview.therapeutic_area || ""; break;
        case "trial_identifier": fieldValue = trial.overview.trial_identifier?.join(", ") || ""; break;
        case "trial_id":
          // Search across multiple identifier fields
          const ids = [
            trial.overview.trial_id,
            trial.trial_id,
            trial.nct_id,
            trial.protocol_id,
            trial.overview.trial_identifier ? trial.overview.trial_identifier.join(" ") : "",
            trial.other_ids ? String(trial.other_ids) : ""
          ].filter(Boolean).join(" ");
          fieldValue = ids;
          break;
        case "trial_phase": fieldValue = trial.overview.trial_phase || ""; break;
        case "status": fieldValue = trial.overview.status || ""; break;
        case "primary_drugs": fieldValue = trial.overview.primary_drugs || ""; break;
        case "other_drugs": fieldValue = trial.overview.other_drugs || ""; break; // Admin uses "other_drugs"
        case "disease_type": fieldValue = trial.overview.disease_type || ""; break;
        case "patient_segment": fieldValue = trial.overview.patient_segment || ""; break;
        case "line_of_therapy": fieldValue = trial.overview.line_of_therapy || ""; break;
        case "sponsor_collaborators": fieldValue = trial.overview.sponsor_collaborators || ""; break;
        case "sponsor_field_activity": fieldValue = trial.overview.sponsor_field_activity || ""; break;
        case "associated_cro": fieldValue = trial.overview.associated_cro || ""; break;
        case "countries": fieldValue = trial.overview.countries || ""; break;
        case "region":
        case "regions": fieldValue = trial.overview.region || ""; break;
        case "trial_record_status": fieldValue = trial.overview.trial_record_status || ""; break;
        case "created_at": fieldValue = trial.overview.created_at || ""; break;
        case "updated_at": fieldValue = trial.overview.updated_at || ""; break;
        case "reference_links": fieldValue = trial.overview.reference_links?.join(" ") || ""; break;

        case "trial_tags":
          // Search in both trial_tags and disease_type since the UI shows disease_type as tags
          const trialTags = trial.overview.trial_tags || "";
          const diseaseType = trial.overview.disease_type || "";
          fieldValue = `${trialTags} ${diseaseType}`.trim();
          break;

        // Outcomes fields
        case "purpose_of_trial": fieldValue = trial.outcomes[0]?.purpose_of_trial || ""; break;
        case "summary": fieldValue = trial.outcomes[0]?.summary || ""; break;
        case "primary_outcome_measure": fieldValue = trial.outcomes[0]?.primary_outcome_measure || ""; break;
        case "other_outcome_measure": fieldValue = trial.outcomes[0]?.other_outcome_measure || ""; break;
        case "study_design_keywords": fieldValue = trial.outcomes[0]?.study_design_keywords || ""; break;
        case "study_design": fieldValue = trial.outcomes[0]?.study_design || ""; break;
        case "treatment_regimen": fieldValue = trial.outcomes[0]?.treatment_regimen || ""; break;
        case "number_of_arms": fieldValue = trial.outcomes[0]?.number_of_arms?.toString() || ""; break;

        // Criteria fields
        case "inclusion_criteria": fieldValue = trial.criteria[0]?.inclusion_criteria || ""; break;
        case "exclusion_criteria": fieldValue = trial.criteria[0]?.exclusion_criteria || ""; break;
        case "age_from": fieldValue = trial.criteria[0]?.age_from || ""; break;
        case "age_to": fieldValue = trial.criteria[0]?.age_to || ""; break;
        case "subject_type": fieldValue = trial.criteria[0]?.subject_type || ""; break;
        case "sex": fieldValue = trial.criteria[0]?.sex || ""; break; // Sex
        case "healthy_volunteers": fieldValue = trial.criteria[0]?.healthy_volunteers || ""; break;
        case "target_no_volunteers":
        case "target_enrolled_volunteers": fieldValue = trial.criteria[0]?.target_no_volunteers?.toString() || ""; break;
        case "actual_enrolled_volunteers": fieldValue = trial.criteria[0]?.actual_enrolled_volunteers?.toString() || ""; break;

        // Timing fields
        case "start_date_estimated":
        case "estimated_start_date": fieldValue = trial.timing[0]?.start_date_estimated || ""; break;
        case "actual_start_date": fieldValue = trial.timing[0]?.start_date_actual || ""; break; // Corrected
        case "trial_end_date_estimated":
        case "estimated_trial_end_date": fieldValue = trial.timing[0]?.trial_end_date_estimated || ""; break;
        case "actual_trial_end_date": fieldValue = trial.timing[0]?.trial_end_date_actual || ""; break; // Corrected from actual_trial_completion_date
        case "actual_enrollment_closed_date": fieldValue = trial.timing[0]?.enrollment_closed_actual || ""; break; // Corrected from actual_enrollment_closed_date
        case "actual_result_published_date": fieldValue = trial.timing[0]?.result_published_date_actual || ""; break; // Corrected from actual_published_date

        // Added missing estimated fields
        case "estimated_enrollment_closed_date": fieldValue = trial.timing[0]?.enrollment_closed_estimated || ""; break;
        case "estimated_result_published_date": fieldValue = trial.timing[0]?.result_published_date_estimated || ""; break;

        // Results fields
        case "trial_outcome": fieldValue = trial.results[0]?.trial_outcome || ""; break;
        case "trial_results": fieldValue = trial.results[0]?.trial_results?.join(", ") || ""; break;
        case "adverse_event_reported": fieldValue = trial.results[0]?.adverse_event_reported || ""; break;
        case "adverse_event_type": fieldValue = trial.results[0]?.adverse_event_type || ""; break;
        case "treatment_for_adverse_events": fieldValue = trial.results[0]?.treatment_for_adverse_events || ""; break;
        case "results_available":
          {
            const val = trial.results?.[0]?.results_available;
            fieldValue = (val === true || val === "Yes" || val === "yes") ? "Yes" : "No";
          }
          break;
        case "endpoints_met":
          {
            const val = trial.results?.[0]?.endpoints_met;
            fieldValue = (val === true || val === "Yes" || val === "yes") ? "Yes" : "No";
          }
          break;

        // Sites fields
        case "total_sites":
        case "total_number_of_sites": fieldValue = trial.sites[0]?.total?.toString() || ""; break;
        case "site_notes": fieldValue = trial.sites[0]?.notes || ""; break;
        case "internal_note":
          fieldValue = trial.logs?.[0]?.internal_note || "";
          // Debug log for internal_note search
          console.log('🔍 Internal Note Debug:', {
            trialId: trial.trial_id,
            logsLength: trial.logs?.length || 0,
            hasLogs: !!trial.logs,
            logsArray: trial.logs,
            internalNote: trial.logs?.[0]?.internal_note,
            extractedValue: fieldValue
          });
          break;
        case "next_review_date": fieldValue = trial.logs?.[0]?.next_review_date || ""; break;


        case "last_modified_date":
          // Get the most recent last_modified_date from logs array
          if (trial.logs && trial.logs.length > 0) {
            const dates = trial.logs
              .map(log => log.last_modified_date)
              .filter(date => date !== null && date !== undefined)
              .sort()
              .reverse(); // Most recent first
            fieldValue = dates.length > 0 ? dates[0] : "";
            // Console removed to reduce noise
          } else {
            fieldValue = "";
          }
          break;
        case "last_modified_user":
          // Get all unique last_modified_user values from logs array and convert IDs to names
          if (trial.logs && trial.logs.length > 0) {
            const users = trial.logs
              .map(log => {
                const userId = log.last_modified_user;
                if (!userId || userId.trim() === "") return null;
                return getUserNameSync(userId);
              })
              .filter(user => user !== null && user !== undefined && user.trim() !== "")
              .filter((user, index, self) => self.indexOf(user) === index); // Get unique values
            fieldValue = users.join(", ");
          } else {
            fieldValue = "";
          }
          break;
        case "full_review_user":
          if (trial.logs && trial.logs.length > 0) {
            const users = trial.logs.map(l => getUserNameSync(l.full_review_user || "")).filter(Boolean);
            fieldValue = users.join(", ");
          } else { fieldValue = ""; }
          break;

        default:
          fieldValue = "";
      }

      // Apply the operator
      const targetValue = String(fieldValue).toLowerCase();

      // Extract search value early (handle both string and array values)
      // This must be done before any special handling that uses searchValue
      const rawSearchValue = Array.isArray(value) ? value[0] || "" : (typeof value === 'string' ? value : String(value || ""));
      const searchValue = rawSearchValue.trim();
      const searchValueLower = searchValue.toLowerCase();

      // Categorical "Strict Is" and "Smart Contains" Logic
      const categoricalFields = [
        "sex", "trial_phase", "status", "results_available", "endpoints_met",
        "trial_record_status", "healthy_volunteers", "adverse_event_reported",
        "countries", "region", "sponsor_collaborators", "trial_outcome",
        "therapeutic_area", "disease_type", "patient_segment", "line_of_therapy",
        "trial_tags"
      ];

      // Fields that need format normalization (snake_case vs display format)
      const fieldsNeedingNormalization = [
        "disease_type", "therapeutic_area", "patient_segment", "line_of_therapy",
        "trial_phase", "trial_record_status", "countries", "region"
      ];

      if (categoricalFields.includes(field)) {
        const tokens = fieldValue.split(/[,;]+/).map(t => t.trim().toLowerCase());

        // For fields that need normalization, also create normalized tokens
        const normalizedTokens = fieldsNeedingNormalization.includes(field)
          ? fieldValue.split(/[,;]+/).map(t => normalizeForComparison(t))
          : tokens;

        // Normalized search value for format-agnostic comparison
        const normalizedSearchValue = normalizeForComparison(searchValue);

        // Special handling for trial_tags - use substring matching since tags can be multi-word
        if (field === "trial_tags") {
          const fieldValueLower = fieldValue.toLowerCase();
          if (operator === "is") {
            return fieldValueLower.includes(searchValueLower);
          }
          if (operator === "contains") {
            return fieldValueLower.includes(searchValueLower);
          }
          if (operator === "is_not") {
            return !fieldValueLower.includes(searchValueLower);
          }
        }

        // Define singleValueFields outside the operator blocks so all operators can use it
        const singleValueFields = ["sex", "results_available", "endpoints_met", "healthy_volunteers", "adverse_event_reported"];

        if (operator === "is") {
          // For single-value fields (like results_available, endpoints_met), use exact match
          if (singleValueFields.includes(field)) {
            return targetValue === searchValueLower;
          }
          // Handle text fields (Summary, Purpose, etc) that might be point-wise
          // If operator is 'is', check if ANY of the points match exactly
          if (operator === 'is' && typeof fieldValue === 'string' && (fieldValue.includes('\n') || fieldValue.includes('•') || fieldValue.includes('- '))) {
            // Tokenize by newlines or bullet points
            const chunks = fieldValue.split(/\n|•/).map(s => s.trim()).filter(Boolean);
            // If any chunk matches exactly (case insensitive was already handled by tokenization? No, field is raw here?)
            // Wait, applyAdvancedSearchFilter logic lower down does .toLowerCase().
            // But here we might return early?
            // Actually, let's inject this logic into the generic token check below or add a specific block.

            const searchValueLower = (searchValue || "").toLowerCase().trim();
            const chunksLower = chunks.map(c => c.toLowerCase());
            if (chunksLower.includes(searchValueLower)) return true;
          }

          // Special handling for categorical/multi-value fields (e.g. "Region1, Region2")
          // We want "is not Region1" to exclude "Region1, Region2"
          // And "is Region1" to include "Region1, Region2" if treating as tag match?
          // Standard "is" usually means exact match or contains?
          // Current logic below uses `includes` for `is` if generic string?
          // No, `is` defaults to `targetValue === searchValueLower`.

          if (tokens.length > 0) { }
          // For "is" operator on categorical fields:
          // If field has a SINGLE value (one token), do exact match
          // If field has MULTIPLE values (comma-separated), the entire field should equal the search value exactly
          // This means "is X" should NOT match "X, Y" - only match "X" exactly
          if (fieldsNeedingNormalization.includes(field)) {
            // Exact match on the FULL normalized field value
            const normalizedFullValue = normalizeForComparison(fieldValue);
            return normalizedFullValue === normalizedSearchValue;
          }
          // Exact match on the full field value (not token match)
          return targetValue === searchValueLower;
        }
        if (operator === "contains") {
          // For single-value fields, use exact match
          if (singleValueFields.includes(field)) {
            return targetValue === searchValueLower;
          }
          // Use normalized comparison for fields with format mismatches
          if (fieldsNeedingNormalization.includes(field)) {
            return normalizedTokens.includes(normalizedSearchValue);
          }
          return tokens.includes(searchValueLower);
        }
        if (operator === "is_not") {
          // For single-value fields, use exact match negation
          if (singleValueFields.includes(field)) {
            return targetValue !== searchValueLower;
          }
          // "Is Not" Operator: exclude trials where value is part of multi-value field.
          // Check that NONE of the tokens equal the search value exactly.
          // Use normalized comparison for fields with format mismatches
          if (fieldsNeedingNormalization.includes(field)) {
            return !normalizedTokens.includes(normalizedSearchValue);
          }
          return !tokens.includes(searchValueLower);
        }
      }

      // Special handling for trial_tags with multiple values
      if (field === "trial_tags" && Array.isArray(value)) {
        // For multiple tags, all tags must be present (AND logic)
        // Handle different possible formats of trial_tags data
        const trialTagsString = fieldValue.toLowerCase();

        // Check if all tags are present in the trial_tags string
        const allTagsPresent = value.every(tag => {
          const tagLower = tag.toLowerCase().trim();
          // Check for exact word match or comma-separated match
          return trialTagsString.includes(tagLower) ||
            trialTagsString.split(/[,\s]+/).includes(tagLower);
        });

        console.log('Trial Tags Search Debug:', {
          fieldValue,
          searchTags: value,
          allTagsPresent,
          trialTagsString,
          trialTags: trial.overview.trial_tags,
          diseaseType: trial.overview.disease_type
        });

        return allTagsPresent;
      }

      // Special handling for date fields
      const dateFields = ['created_at', 'updated_at', 'last_modified_date', 'start_date_estimated', 'trial_end_date_estimated', 'actual_start_date', 'actual_trial_end_date', 'actual_enrollment_closed_date', 'actual_result_published_date'];
      if (dateFields.includes(field) || field.includes("date")) {
        const fieldDate = new Date(fieldValue).getTime();
        const searchDate = new Date(rawSearchValue).getTime();

        const isFieldValid = !isNaN(fieldDate);
        if (isNaN(searchDate)) return false;

        // Normalize to YYYY-MM-DD for date-only comparison
        // Use UTC to avoid timezone shifts if the input is ISO ending in Z
        const toDateString = (ts: number) => new Date(ts).toISOString().split('T')[0];

        const fieldDateStr = isFieldValid ? toDateString(fieldDate) : "";
        const searchDateStr = toDateString(searchDate);

        console.log(`[DEBUG DATE] Field: ${field}, Op: ${operator}, FieldVal: "${fieldValue}", SearchVal: "${rawSearchValue}"`);
        console.log(`[DEBUG DATE NORM] FieldStr: "${fieldDateStr}", SearchStr: "${searchDateStr}"`);

        // For "is_not", if the field date is invalid (empty), it is NOT the search date, so return true.
        // For other operators, if field date is invalid, we can't compare, so return false.
        if (!isFieldValid) {
          return operator === "is_not";
        }

        switch (operator) {
          case "is": return fieldDateStr === searchDateStr; // Compare strings
          case "is_not": return fieldDateStr !== searchDateStr; // Compare strings
          // For relative comparisons, keep numeric timestamp but normalize to same time boundary?
          // Actually, for > and <, maybe timestamps are fine IF we align them?
          // But strict "is" fails because of time. Only "is" and "is_not" really need string comparison.
          // Let's stick to timestamps for relative for now as "is" is the main complaint.
          case "greater_than": return fieldDate > searchDate;
          case "greater_than_equal": return fieldDate >= searchDate;
          case "less_than": return fieldDate < searchDate;
          case "less_than_equal": return fieldDate <= searchDate;
          default: return false;
        }
      }

      // Special handling for trial_id: "is" should behave like "contains"
      if (field === "trial_id" && operator === "is") {
        return targetValue.includes(searchValueLower);
      }

      // Special handling for drug fields (primary_drugs, other_drugs) - check related drug names
      // IMPORTANT: For drug fields, ONLY use the drug mapping logic - don't fall through to default
      if (field === "primary_drugs" || field === "other_drugs") {
        // If search value is empty or undefined, don't match anything
        if (!searchValue || searchValue === "") {
          console.log('Search value is empty for drug field - no match:', {
            field,
            searchValue,
            rawValue: value,
            trialId: trial.trial_id
          });
          return false;
        }

        // If mapping is empty, return false (don't match anything)
        if (drugNameMapping.size === 0) {
          console.log('Drug mapping is empty - no matches for drug field search:', {
            field,
            searchValue,
            trialId: trial.trial_id
          });
          return false;
        }

        // searchValueLower is already defined at the top
        const trialDrugValue = fieldValue.toLowerCase().trim();

        // If trial has no drug value or is N/A
        // For "is_not", empty/N/A values should match (trial doesn't have the drug)
        // For "is" and "contains", empty/N/A values should NOT match
        if (!trialDrugValue || trialDrugValue === "" || trialDrugValue === "n/a" || trialDrugValue === "na") {
          if (operator === "is_not" || operator === "not_equals") {
            return true; // Empty/N/A is "not" any specific drug
          }
          return false; // Empty/N/A doesn't "contain" or "is" any specific drug
        }

        // Get all related drug names for the search value (case-insensitive)
        const relatedNames = new Set<string>();

        // Iterate through the drug mapping to find all related names
        // The mapping has original case keys, so we need to do case-insensitive lookup
        drugNameMapping.forEach((relatedSet, drugName) => {
          const drugNameLower = drugName.toLowerCase().trim();

          // If the search value matches this drug name (case-insensitive)
          if (drugNameLower === searchValueLower) {
            // Add all related names from this drug entry (convert to lowercase)
            relatedSet.forEach(name => {
              const nameLower = name.toLowerCase().trim();
              if (nameLower) {
                relatedNames.add(nameLower);
              }
            });
            // Also add the drug name itself
            if (drugNameLower) {
              relatedNames.add(drugNameLower);
            }
          }
        });

        // Also check if any name in the related sets matches the search value
        drugNameMapping.forEach((relatedSet, drugName) => {
          relatedSet.forEach(name => {
            const nameLower = name.toLowerCase().trim();
            if (nameLower === searchValueLower) {
              // This name matches the search, so add all names from this drug entry
              relatedSet.forEach(relatedName => {
                const relatedNameLower = relatedName.toLowerCase().trim();
                if (relatedNameLower) {
                  relatedNames.add(relatedNameLower);
                }
              });
              // Also add the key drug name
              const drugNameLower = drugName.toLowerCase().trim();
              if (drugNameLower) {
                relatedNames.add(drugNameLower);
              }
            }
          });
        });

        // If we found related names, check if the trial's drug value matches any of them
        if (relatedNames.size > 0) {
          // Normalize trial drug value for comparison
          const trialValueTrimmed = trialDrugValue.trim();

          // Split trial drug value by comma to handle multi-drug fields like "letrozole, Exemestane"
          const trialDrugs = trialValueTrimmed.split(',').map(d => d.trim().toLowerCase());

          // Check if trial value exactly matches any related name (case-insensitive)
          // OR if any individual drug in a comma-separated list matches
          const matchesRelatedName = Array.from(relatedNames).some(relatedName => {
            const relatedNameTrimmed = relatedName.trim();
            // Check exact match on whole field
            if (trialValueTrimmed === relatedNameTrimmed) {
              console.log(`  ✓ Match found: trial value "${trialDrugValue}" matches related name "${relatedName}"`);
              return true;
            }
            // Check if any individual drug in comma-separated list matches
            if (trialDrugs.some(drug => drug === relatedNameTrimmed)) {
              console.log(`  ✓ Match found: drug "${relatedNameTrimmed}" found in trial drugs "${trialDrugValue}"`);
              return true;
            }
            return false;
          });

          // Debug logging
          console.log('Drug search debug:', {
            field,
            searchValue,
            searchValueLower,
            trialDrugValue,
            trialValueTrimmed,
            relatedNames: Array.from(relatedNames),
            matchesRelatedName,
            operator,
            drugNameMappingSize: drugNameMapping.size,
            trialId: trial.trial_id,
            willMatch: matchesRelatedName
          });

          // Extra logging for value 100/101/102 searches
          if (searchValueLower.includes('value 100') || searchValueLower.includes('value 101') || searchValueLower.includes('value 102')) {
            console.log('*** Value 100/101/102 search details:', {
              searchValue,
              searchValueLower,
              relatedNames: Array.from(relatedNames),
              trialDrugValue,
              trialValueTrimmed,
              matches: matchesRelatedName,
              trialId: trial.trial_id
            });
          }

          switch (operator) {
            case "contains":
            case "is":
              // For "is" and "contains", only match if trial value exactly equals any related name
              // This ensures all related records (value 100, value 101, value 102) are shown
              return matchesRelatedName;
            case "is_not":
              return !matchesRelatedName;
            case "equals":
              // For equals, only match if trial value exactly equals any related name
              return matchesRelatedName;
            case "not_equals":
              return !matchesRelatedName;
            default:
              return matchesRelatedName;
          }
        } else {
          // If no related names found, this trial should NOT match for drug field searches
          // Log for debugging
          console.log('No related drug names found for search - trial will NOT match:', {
            searchValue,
            searchValueLower,
            trialDrugValue,
            drugNameMappingKeys: Array.from(drugNameMapping.keys()).slice(0, 20), // Show first 20 keys
            drugNameMappingSize: drugNameMapping.size,
            trialId: trial.trial_id
          });

          // For value 100/101/102, show more details
          if (searchValueLower.includes('value 100') || searchValueLower.includes('value 101') || searchValueLower.includes('value 102')) {
            console.warn('*** Value 100/101/102 not found in mapping!', {
              searchValue,
              trialDrugValue,
              allMappingKeys: Array.from(drugNameMapping.keys()),
              message: 'Check if drug entry has these values in drug_name, generic_name, or other_name fields'
            });
          }

          // Return false - don't match if no related names found
          // This ensures only trials with related drug names are shown
          return false;
        }
      }


      // Debug logging for internal_note before comparison
      if (field === "internal_note") {
        console.log('🔎 Internal Note Comparison:', {
          trialId: trial.trial_id,
          targetValue: targetValue.substring(0, 100) + '...',
          searchValueLower,
          operator,
          includesCheck: targetValue.includes(searchValueLower),
          equalsCheck: targetValue === searchValueLower
        });
      }

      // Special handling for internal_note and other text fields - normalize whitespace for comparison
      // This handles cases where search input collapses newlines to spaces but database has \n
      if (field === "internal_note") {
        const normalizedTarget = targetValue.replace(/[\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim();
        const normalizedSearch = searchValueLower.replace(/[\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim();

        console.log('🔎 Internal Note Normalized:', {
          normalizedTarget: normalizedTarget.substring(0, 100) + '...',
          normalizedSearch,
          includesCheck: normalizedTarget.includes(normalizedSearch)
        });

        switch (operator) {
          case "contains": return normalizedTarget.includes(normalizedSearch);
          case "is": return normalizedTarget === normalizedSearch;
          case "is_not": return !normalizedTarget.includes(normalizedSearch);
          default: return normalizedTarget.includes(normalizedSearch);
        }
      }

      switch (operator) {
        case "contains": return targetValue.includes(searchValueLower);
        case "is": return targetValue === searchValueLower;
        case "is_not": return !targetValue.includes(searchValueLower);
        case "starts_with": return targetValue.startsWith(searchValueLower);
        case "ends_with": return targetValue.endsWith(searchValueLower);
        case "greater_than": {
          const nF1 = parseFloat(fieldValue); const nS1 = parseFloat(searchValue);
          return !isNaN(nF1) && !isNaN(nS1) && nF1 > nS1;
        }
        case "greater_than_equal": {
          const nF2 = parseFloat(fieldValue); const nS2 = parseFloat(searchValue);
          return !isNaN(nF2) && !isNaN(nS2) && nF2 >= nS2;
        }
        case "less_than": {
          const nF3 = parseFloat(fieldValue); const nS3 = parseFloat(searchValue);
          return !isNaN(nF3) && !isNaN(nS3) && nF3 < nS3;
        }
        case "less_than_equal": {
          const nF4 = parseFloat(fieldValue); const nS4 = parseFloat(searchValue);
          return !isNaN(nF4) && !isNaN(nS4) && nF4 <= nS4;
        }
        case "equals": {
          const nF5 = parseFloat(fieldValue); const nS5 = parseFloat(searchValue);
          return !isNaN(nF5) && !isNaN(nS5) && nF5 === nS5;
        }
        case "not_equals": {
          const nF6 = parseFloat(fieldValue); const nS6 = parseFloat(searchValue);
          return !isNaN(nF6) && !isNaN(nS6) && nF6 !== nS6;
        }
        default: return true;
      }
    });

    // Apply logic operators
    let finalResult = results[0];
    for (let i = 1; i < results.length; i++) {
      const logic = criteria[i - 1].logic;
      if (logic === "AND") {
        finalResult = finalResult && results[i];
      } else if (logic === "OR") {
        finalResult = finalResult || results[i];
      }
    }

    // Log summary for drug field searches
    const drugCriteria = criteria.filter(c => c.field === "primary_drugs" || c.field === "other_drugs");
    if (drugCriteria.length > 0 && drugNameMapping.size > 0) {
      drugCriteria.forEach(criterion => {
        const criterionValue = Array.isArray(criterion.value) ? criterion.value[0] || "" : (criterion.value || "");
        const searchValueLower = criterionValue.toLowerCase().trim();
        if (searchValueLower) {
          // Find related names for this search
          const relatedNames = new Set<string>();
          drugNameMapping.forEach((relatedSet, drugName) => {
            const drugNameLower = drugName.toLowerCase().trim();
            if (drugNameLower === searchValueLower) {
              relatedSet.forEach(name => {
                const nameLower = name.toLowerCase().trim();
                if (nameLower) relatedNames.add(nameLower);
              });
              if (drugNameLower) relatedNames.add(drugNameLower);
            }
          });
          drugNameMapping.forEach((relatedSet, drugName) => {
            relatedSet.forEach(name => {
              const nameLower = name.toLowerCase().trim();
              if (nameLower === searchValueLower) {
                relatedSet.forEach(relatedName => {
                  const relatedNameLower = relatedName.toLowerCase().trim();
                  if (relatedNameLower) relatedNames.add(relatedNameLower);
                });
                const drugNameLower = drugName.toLowerCase().trim();
                if (drugNameLower) relatedNames.add(drugNameLower);
              }
            });
          });

          if (relatedNames.size > 0) {
            console.log(`🔍 Drug Search Summary for "${criterionValue}":`, {
              searchValue: criterionValue,
              relatedNames: Array.from(relatedNames),
              expectedMatches: `Trials with primary_drugs matching any of: ${Array.from(relatedNames).join(", ")}`,
              trialId: trial.trial_id,
              trialPrimaryDrug: trial.overview?.primary_drugs || "N/A",
              willMatch: finalResult
            });
          }
        }
      });
    }

    return finalResult;
  };

  const handleColumnSettingsChange = (newSettings: ColumnSettings) => {
    setColumnSettings(newSettings);
    // Save to localStorage
    localStorage.setItem('adminTrialColumnSettings', JSON.stringify(newSettings));
  };

  // Filter trials based on search term, advanced search criteria, and filters
  const filteredTrials = trials.filter((trial) => {
    // Basic search term filter - search across multiple fields
    const matchesSearchTerm = (() => {
      // If search term is empty or only whitespace, match all
      if (!searchTerm || !searchTerm.trim()) {
        return true;
      }

      // Trim and normalize search term
      const trimmedSearch = searchTerm.trim();
      const searchLower = trimmedSearch.toLowerCase();

      // Build comprehensive searchable text from all relevant fields
      const searchableFields = [
        // Trial ID fields
        trial.trial_id || "",
        trial.overview?.trial_id || "",
        trial.overview?.id || "",
        // Overview fields
        trial.overview?.title || "",
        trial.overview?.therapeutic_area || "",
        trial.overview?.disease_type || "",
        trial.overview?.sponsor_collaborators || "",
        trial.overview?.sponsor_field_activity || "",
        trial.overview?.associated_cro || "",
        trial.overview?.primary_drugs || "",
        trial.overview?.other_drugs || "",
        trial.overview?.patient_segment || "",
        trial.overview?.line_of_therapy || "",
        trial.overview?.trial_tags || "",
        trial.overview?.countries || "",
        trial.overview?.region || "",
        trial.overview?.trial_record_status || "",
        trial.overview?.trial_phase || "",
        trial.overview?.status || "",
        // Trial identifiers and references
        ...(trial.overview?.trial_identifier || []),
        ...(trial.overview?.reference_links || []),
        // Outcomes fields
        trial.outcomes?.[0]?.purpose_of_trial || "",
        trial.outcomes?.[0]?.summary || "",
        trial.outcomes?.[0]?.primary_outcome_measure || "",
        trial.outcomes?.[0]?.other_outcome_measure || "",
        trial.outcomes?.[0]?.study_design_keywords || "",
        trial.outcomes?.[0]?.study_design || "",
        trial.outcomes?.[0]?.treatment_regimen || "",
        // Criteria fields
        trial.criteria?.[0]?.inclusion_criteria || "",
        trial.criteria?.[0]?.exclusion_criteria || "",
        trial.criteria?.[0]?.subject_type || "",
        trial.criteria?.[0]?.sex || "",
        trial.criteria?.[0]?.healthy_volunteers || "",
        trial.criteria?.[0]?.age_from || "",
        trial.criteria?.[0]?.age_to || "",
        // Results fields
        trial.results?.[0]?.trial_outcome || "",
        ...(trial.results?.[0]?.trial_results || []),
        trial.results?.[0]?.adverse_event_reported || "",
        trial.results?.[0]?.adverse_event_type || "",
        trial.results?.[0]?.treatment_for_adverse_events || "",
        // Sites fields
        trial.sites?.[0]?.notes || "",
        trial.sites?.[0]?.total?.toString() || "",
      ];

      // Join all searchable fields and normalize
      const searchableText = searchableFields
        .filter(field => field !== null && field !== undefined && field !== "")
        .join(" ")
        .toLowerCase()
        .trim();

      // Perform case-insensitive search
      const matches = searchableText.includes(searchLower);

      // Debug logging (only log when search term is provided)
      if (trimmedSearch && matches) {
        console.log('Search match found:', {
          trialId: trial.trial_id,
          title: trial.overview?.title,
          searchTerm: trimmedSearch,
          matchedFields: searchableFields.filter(f =>
            f && f.toString().toLowerCase().includes(searchLower)
          ).slice(0, 3) // Log first 3 matching fields
        });
      }

      return matches;
    })();

    // Advanced search filter
    const matchesAdvancedSearch = applyAdvancedSearchFilter(trial, advancedSearchCriteria);

    // Apply filters
    // Advanced filtering logic for all available filter fields
    const matchesFilters = (() => {
      // Helper: Check if value matches any filter value (exact match for dropdowns)
      const checkExact = (filterValues: string[] | undefined, value: string | undefined | null) => {
        if (!filterValues || filterValues.length === 0) return true;
        if (!value) return false;

        // Try direct match first
        if (filterValues.includes(value)) return true;

        // Normalize value (handles Phase 1 -> Phase I etc.)
        const normalizedValue = normalizePhaseValue(value);
        if (filterValues.includes(normalizedValue)) return true;

        // Try case-insensitive match
        const lowerValue = normalizedValue.toLowerCase();
        if (filterValues.some(f => f.toLowerCase() === lowerValue)) return true;

        // Try snake_case match (handles "Phase I" -> "phase_i", "United States" -> "united_states")
        // Also handle "Development In Progress (DIP)" -> "development_in_progress" by stripping parens
        const cleanValue = lowerValue.replace(/\(.*\)/g, '').trim();
        const snakeValue = cleanValue.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        if (filterValues.includes(snakeValue)) return true;

        // Fallback: full snake value including parens content
        const fullSnakeValue = lowerValue.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        if (filterValues.includes(fullSnakeValue)) return true;

        // Use normalizeForComparison for format-agnostic matching
        // This handles cases like "Solid Tumor, Unspecified" matching "solid_tumor_unspecified"
        const normalizedDbValue = normalizeForComparison(value);
        if (filterValues.some(f => normalizeForComparison(f) === normalizedDbValue)) return true;

        return false;
      };

      // Helper: Check if value contains any filter value (partial match for text/multi-select)
      const checkPartial = (filterValues: string[] | undefined, value: string | undefined | null) => {
        if (!filterValues || filterValues.length === 0) return true;
        if (!value) return false;

        const lowerValue = value.toLowerCase();
        // Create a normalized version that converts underscores to spaces (like user dashboard)
        const normalizedValue = lowerValue.replace(/_/g, ' ').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        // Also keep the loose version for compatibility
        const looseValue = lowerValue.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        // Create snake version for DB values that are snake_case
        const snakeValue = lowerValue.replace(/[^a-z0-9]+/g, '_');

        return filterValues.some((f) => {
          const fLower = f.toLowerCase();
          // Normalize filter value the same way
          const fNormalized = fLower.replace(/_/g, ' ').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

          // 1. Direct partial match
          if (lowerValue.includes(fLower)) return true;

          // 2. Normalized match (underscores -> spaces) - PRIMARY FIX
          if (normalizedValue.includes(fNormalized) || fNormalized.includes(normalizedValue)) return true;

          // 3. Loose partial match (ignore punctuation/spacing differences)
          const fLoose = fLower.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
          if (fLoose && looseValue.includes(fLoose)) return true;

          // 4. Snake_case partial match (ignore underscores vs spaces)
          const fSnake = fLower.replace(/[^a-z0-9]+/g, '_');
          if (fSnake && snakeValue.includes(fSnake)) return true;

          return false;
        });
      };

      // Helper: Check numeric values (supports ranges like "10-50", "1000+", "<10")
      const checkNumeric = (filterValues: string[] | undefined, value: number | undefined | null) => {
        if (!filterValues || filterValues.length === 0) return true;
        if (value === undefined || value === null) return false;

        return filterValues.some(filter => {
          // Exact match
          if (filter === value.toString()) return true;

          // Range match "10-50"
          if (filter.includes('-')) {
            const [min, max] = filter.split('-').map(str => parseInt(str.trim()));
            return !isNaN(min) && !isNaN(max) && value >= min && value <= max;
          }

          // "1000+"
          if (filter.endsWith('+')) {
            const min = parseInt(filter.replace('+', '').trim());
            return !isNaN(min) && value >= min;
          }

          // "<10"
          if (filter.startsWith('<')) {
            const max = parseInt(filter.replace('<', '').trim());
            return !isNaN(max) && value < max;
          }

          // ">10"
          if (filter.startsWith('>')) {
            const min = parseInt(filter.replace('>', '').trim());
            return !isNaN(min) && value > min;
          }

          return false;
        });
      };

      // Helper: Check drug with aliases (for Primary/Other Drugs)
      const checkDrugWithAliases = (filterValues: string[] | undefined, value: string | undefined | null) => {
        if (!filterValues || filterValues.length === 0) return true;
        if (!value) return false;

        const lowerValue = value.toLowerCase();

        return filterValues.some(filter => {
          const filterLower = filter.toLowerCase();
          // Check direct match
          if (lowerValue.includes(filterLower)) return true;

          // Check aliases from mapping
          let aliasMatch = false;
          // Find the filter term in the mapping (search both keys and values)
          // Case 1: Filter term is a key
          drugNameMapping.forEach((aliases, key) => {
            if (aliasMatch) return;
            if (key.toLowerCase() === filterLower) {
              // Check if any alias matches the trial value
              aliasMatch = Array.from(aliases).some(alias => lowerValue.includes(alias.toLowerCase())) ||
                lowerValue.includes(key.toLowerCase());
            }
            // Case 2: Filter term is in the aliases set
            if (!aliasMatch && aliases.has(filter)) { // Check exact case in set first, or iterate
              // If filter is an alias, we should check against the key (canonical name) and other aliases
              if (Array.from(aliases).some(a => a.toLowerCase() === filterLower)) {
                aliasMatch = lowerValue.includes(key.toLowerCase()) ||
                  Array.from(aliases).some(a => lowerValue.includes(a.toLowerCase()));
              }
            }
          });

          if (!aliasMatch) {
            // Fallback: iterate all to find if filter is an alias (slower but thorough)
            for (const [key, aliases] of Array.from(drugNameMapping.entries())) {
              const keyLower = key.toLowerCase();
              const aliasesArr = Array.from(aliases).map(a => a.toLowerCase());
              if (keyLower === filterLower || aliasesArr.includes(filterLower)) {
                // Filter matches this group. Check if trial value matches any in group
                if (lowerValue.includes(keyLower) || aliasesArr.some(a => lowerValue.includes(a))) {
                  return true;
                }
              }
            }
          }

          return aliasMatch;
        });
      };

      // Helper: Check tags (handle comma separation and normalization)
      const checkTags = (filterValues: string[] | undefined, value: string | undefined | null) => {
        if (!filterValues || filterValues.length === 0) return true;
        if (!value) return false;

        const lowerValue = value.toLowerCase();
        // Normalize underscores to spaces for comparison
        const normalizedValue = lowerValue.replace(/_/g, ' ');

        return filterValues.some(filter => {
          const filterLower = filter.toLowerCase();
          const normalizedFilter = filterLower.replace(/_/g, ' ');
          return normalizedValue.includes(normalizedFilter) || lowerValue.includes(filterLower);
        });
      };

      // Overview Fields
      if (!checkPartial(appliedFilters.therapeuticAreas, trial.overview?.therapeutic_area)) return false;
      if (!checkExact(appliedFilters.statuses, trial.overview?.status)) return false;
      if (!checkPartial(appliedFilters.diseaseTypes, trial.overview?.disease_type)) return false;
      if (!checkDrugWithAliases(appliedFilters.primaryDrugs, trial.overview?.primary_drugs)) return false;
      if (!checkExact(appliedFilters.trialPhases, trial.overview?.trial_phase)) return false;
      if (!checkPartial(appliedFilters.countries, trial.overview?.countries)) return false;
      if (!checkPartial(appliedFilters.sponsorsCollaborators, trial.overview?.sponsor_collaborators)) return false;
      if (!checkExact(appliedFilters.trialRecordStatus, trial.overview?.trial_record_status)) return false;
      if (!checkPartial(appliedFilters.patientSegments, trial.overview?.patient_segment)) return false;
      if (!checkPartial(appliedFilters.lineOfTherapy, trial.overview?.line_of_therapy)) return false;
      if (!checkTags(appliedFilters.trialTags, trial.overview?.trial_tags)) return false;

      // Expanded Overview Fields
      if (!checkDrugWithAliases(appliedFilters.otherDrugs, trial.overview?.other_drugs)) return false;
      if (!checkPartial(appliedFilters.regions, trial.overview?.region)) return false;
      if (!checkPartial(appliedFilters.sponsorFieldActivity, trial.overview?.sponsor_field_activity)) return false;
      if (!checkPartial(appliedFilters.associatedCro, trial.overview?.associated_cro)) return false;

      // Criteria Fields (Eligibility Section)
      const criteria = trial.criteria?.[0];
      if (!checkExact(appliedFilters.sex, criteria?.sex)) return false;
      if (!checkExact(appliedFilters.healthyVolunteers, criteria?.healthy_volunteers)) return false;
      if (!checkExact(appliedFilters.subjectType, criteria?.subject_type)) return false;
      if (!checkPartial(appliedFilters.inclusionCriteria, criteria?.inclusion_criteria)) return false;
      if (!checkPartial(appliedFilters.exclusionCriteria, criteria?.exclusion_criteria)) return false;
      if (!checkExact(appliedFilters.ageFrom, criteria?.age_from)) return false;
      if (!checkExact(appliedFilters.ageTo, criteria?.age_to)) return false;
      if (!checkNumeric(appliedFilters.targetNoVolunteers, criteria?.target_no_volunteers)) return false;
      if (!checkNumeric(appliedFilters.actualEnrolledVolunteers, criteria?.actual_enrolled_volunteers)) return false;


      // Outcomes Fields
      const outcomes = trial.outcomes?.[0];
      if (!checkPartial(appliedFilters.purposeOfTrial, outcomes?.purpose_of_trial)) return false;
      if (!checkPartial(appliedFilters.summary, outcomes?.summary)) return false;
      if (!checkPartial(appliedFilters.primaryOutcomeMeasures, outcomes?.primary_outcome_measure)) return false;
      if (!checkPartial(appliedFilters.otherOutcomeMeasures, outcomes?.other_outcome_measure)) return false;
      if (!checkPartial(appliedFilters.studyDesignKeywords, outcomes?.study_design_keywords)) return false;
      if (!checkPartial(appliedFilters.studyDesign, outcomes?.study_design)) return false;
      if (!checkPartial(appliedFilters.treatmentRegimen, outcomes?.treatment_regimen)) return false;
      if (!checkNumeric(appliedFilters.numberOfArms, outcomes?.number_of_arms)) return false;

      // Timing Fields
      const timing = trial.timing?.[0];
      if (!checkExact(appliedFilters.startDateEstimated, timing?.start_date_estimated)) return false;
      if (!checkExact(appliedFilters.trialEndDateEstimated, timing?.trial_end_date_estimated)) return false;


      // Results Fields
      const results = trial.results?.[0];
      if (!checkPartial(appliedFilters.trialOutcome, results?.trial_outcome)) return false; // Partial match for safety
      if (!checkPartial(appliedFilters.trialOutcomeContent, results?.trial_outcome)) return false;
      if (!checkExact(appliedFilters.adverseEventsReported, results?.adverse_event_reported)) return false;
      if (!checkExact(appliedFilters.adverseEventReported, results?.adverse_event_reported)) return false;
      if (!checkPartial(appliedFilters.adverseEventType, results?.adverse_event_type)) return false;
      if (!checkPartial(appliedFilters.treatmentForAdverseEvents, results?.treatment_for_adverse_events)) return false;

      // Results available check (special logic)
      if (appliedFilters.resultsAvailable && appliedFilters.resultsAvailable.length > 0) {
        const hasResults = (trial.results && trial.results.length > 0 && !!trial.results[0].trial_outcome);
        const wantedYes = appliedFilters.resultsAvailable.includes("Yes");
        const wantedNo = appliedFilters.resultsAvailable.includes("No");

        if (wantedYes && !wantedNo && !hasResults) return false;
        if (wantedNo && !wantedYes && hasResults) return false;
      }

      // Sites Fields
      const sites = trial.sites?.[0];
      if (!checkNumeric(appliedFilters.totalSites, sites?.total)) return false;
      if (!checkPartial(appliedFilters.siteNotes, sites?.notes)) return false;

      return true;
    })();

    return matchesSearchTerm && matchesAdvancedSearch && matchesFilters;
  }).sort((a, b) => {
    if (!sortField) return 0; // No sorting if no field selected

    const aValue = getSortValue(a, sortField);
    const bValue = getSortValue(b, sortField);

    // Special handling for Yes/No fields (resultsAvailable, endpointsMet, healthyVolunteers)
    const yesNoFields = ['resultsAvailable', 'endpointsMet', 'healthyVolunteers'];
    if (yesNoFields.includes(sortField) && typeof aValue === 'string' && typeof bValue === 'string') {
      // Normalize to lowercase for comparison
      const aLower = aValue.toLowerCase().trim();
      const bLower = bValue.toLowerCase().trim();

      // Define sort order: Yes > No > NA/empty (for ascending)
      const getYesNoOrder = (val: string): number => {
        if (val === 'yes') return 1;
        if (val === 'no') return 2;
        return 3; // NA or empty
      };

      const aOrder = getYesNoOrder(aLower);
      const bOrder = getYesNoOrder(bLower);

      // For ascending: Yes first (lower order value first)
      // For descending: No first (higher order value first)
      return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
    }

    // Handle numeric comparisons (including timestamps for dates)
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Handle string comparisons (alphabetical)
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    // Mixed types - convert to string
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    const comparison = aStr.localeCompare(bStr);
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination logic
  const totalItems = filteredTrials.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTrials = filteredTrials.slice(startIndex, endIndex);

  // Log summary when advanced search with drug fields is active
  useEffect(() => {
    const drugCriteria = advancedSearchCriteria.filter(c => c.field === "primary_drugs" || c.field === "other_drugs");
    if (drugCriteria.length > 0 && drugNameMapping.size > 0) {
      drugCriteria.forEach(criterion => {
        const criterionValue = Array.isArray(criterion.value) ? criterion.value[0] || "" : (criterion.value || "");
        if (criterionValue) {
          const searchValueLower = criterionValue.toLowerCase().trim();
          const relatedNames = new Set<string>();
          drugNameMapping.forEach((relatedSet, drugName) => {
            const drugNameLower = drugName.toLowerCase().trim();
            if (drugNameLower === searchValueLower) {
              relatedSet.forEach(name => {
                const nameLower = name.toLowerCase().trim();
                if (nameLower) relatedNames.add(nameLower);
              });
              if (drugNameLower) relatedNames.add(drugNameLower);
            }
          });
          drugNameMapping.forEach((relatedSet, drugName) => {
            relatedSet.forEach(name => {
              const nameLower = name.toLowerCase().trim();
              if (nameLower === searchValueLower) {
                relatedSet.forEach(relatedName => {
                  const relatedNameLower = relatedName.toLowerCase().trim();
                  if (relatedNameLower) relatedNames.add(relatedNameLower);
                });
                const drugNameLower = drugName.toLowerCase().trim();
                if (drugNameLower) relatedNames.add(drugNameLower);
              }
            });
          });

          const matchingTrials = filteredTrials.filter(trial => {
            const trialDrug = (trial.overview?.primary_drugs || "").toLowerCase().trim();
            return Array.from(relatedNames).some(name => name === trialDrug);
          });

          console.log(`📊 Drug Search Summary for "${criterionValue}":`, {
            searchValue: criterionValue,
            relatedNames: Array.from(relatedNames),
            totalTrials: trials.length,
            filteredTrials: filteredTrials.length,
            matchingTrials: matchingTrials.length,
            matchingTrialIds: matchingTrials.map(t => t.trial_id),
            expectedMatches: `Should show only trials with primary_drugs matching: ${Array.from(relatedNames).join(", ")}`
          });
        }
      });
    }
  }, [filteredTrials, advancedSearchCriteria, drugNameMapping, trials]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, advancedSearchCriteria, appliedFilters, itemsPerPage]);

  // Log search results summary when filters change
  useEffect(() => {
    console.log('Search results summary:', {
      totalTrials: trials.length,
      filteredTrials: filteredTrials.length,
      searchTerm: searchTerm || '(empty)',
      hasAdvancedSearch: advancedSearchCriteria.length > 0,
      hasFilters: Object.values(appliedFilters).some(arr => arr.length > 0),
      currentPage: currentPage,
      itemsPerPage: itemsPerPage
    });
  }, [filteredTrials.length, searchTerm, advancedSearchCriteria.length, appliedFilters, currentPage, itemsPerPage, trials.length]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  useEffect(() => {
    // Clear old bloated localStorage cache to prevent quota issues
    // This removes the 'therapeuticTrials' cache that was causing QuotaExceededError
    try {
      localStorage.removeItem('therapeuticTrials');
      localStorage.removeItem('trialUpdateMappings');
    } catch (e) {
      console.warn('Could not clear old localStorage cache:', e);
    }

    fetchTrials();
    fetchDrugsAndBuildMapping(); // Fetch drugs and build name mapping

    // Load column settings from localStorage
    const savedSettings = localStorage.getItem('adminTrialColumnSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Merge with default settings to ensure new fields (trialId, title) are included
        setColumnSettings({ ...DEFAULT_COLUMN_SETTINGS, ...parsedSettings });
      } catch (error) {
        console.error('Error loading column settings:', error);
      }
    }
  }, []);

  // Refresh data when page becomes visible (e.g., returning from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing data...');
        fetchTrials(true, false); // Refresh without toast
        fetchDrugsAndBuildMapping(); // Rebuild drug mapping
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also refresh when window gains focus (alternative to visibility change)
    const handleFocus = () => {
      console.log('Window gained focus, refreshing data...');
      fetchTrials(true, false); // Refresh without toast
      fetchDrugsAndBuildMapping(); // Rebuild drug mapping
    };

    window.addEventListener('focus', handleFocus);

    // Listen for custom refresh event from edit pages
    const handleRefreshFromEdit = () => {
      console.log('Refresh triggered from edit page, refreshing data...');
      fetchTrials(true, false); // Refresh without toast
      fetchDrugsAndBuildMapping(); // Rebuild drug mapping
    };

    window.addEventListener('refreshFromEdit', handleRefreshFromEdit);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('refreshFromEdit', handleRefreshFromEdit);
    };
  }, []);

  // Debug: Log trials data when filter modal opens
  useEffect(() => {
    if (filterModalOpen) {
      console.log('Main page: Passing trials to filter modal:', trials.length, trials)
    }
  }, [filterModalOpen, trials]);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    return formatDateToMMDDYYYY(dateString);
  };

  // Multiple selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allTrialIds = new Set(paginatedTrials.map(trial => trial.trial_id));
      setSelectedTrials(allTrialIds);
      setIsSelectAllChecked(true);
    } else {
      setSelectedTrials(new Set());
      setIsSelectAllChecked(false);
    }
  };

  const handleSelectTrial = (trialId: string, checked: boolean) => {
    const newSelectedTrials = new Set(selectedTrials);
    if (checked) {
      newSelectedTrials.add(trialId);
    } else {
      newSelectedTrials.delete(trialId);
    }
    setSelectedTrials(newSelectedTrials);

    // Update select all checkbox state
    setIsSelectAllChecked(newSelectedTrials.size === paginatedTrials.length);
  };

  const handleViewSelectedTrials = (openInTabs: boolean = false) => {
    if (selectedTrials.size === 0) {
      toast({
        title: "No trials selected",
        description: "Please select at least one trial to view.",
        variant: "destructive",
      });
      return;
    }

    const selectedTrialIds = Array.from(selectedTrials);

    if (openInTabs) {
      // Open in new tabs - backend view
      selectedTrialIds.forEach(trialId => {
        window.open(`/admin/therapeutics/${trialId}/backend`, '_blank');
      });
    } else {
      // Open in popup windows - backend view (default)
      selectedTrialIds.forEach((trialId, index) => {
        const popup = window.open(
          `/admin/therapeutics/${trialId}/backend`,
          `trial_backend_${trialId}`,
          `width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no,left=${100 + (index * 50)},top=${100 + (index * 50)}`
        );
        if (!popup) {
          toast({
            title: "Popup blocked",
            description: "Please allow popups for this site to open multiple trials.",
            variant: "destructive",
          });
        }
      });
    }

    toast({
      title: "Trials opened",
      description: `Opened ${selectedTrialIds.length} trial${selectedTrialIds.length > 1 ? 's' : ''} in backend view successfully.`,
    });
  };

  const handleExportSelected = () => {
    if (selectedTrials.size === 0) {
      toast({
        title: "No trials selected",
        description: "Please select at least one trial to export.",
        variant: "destructive",
      });
      return;
    }

    const selectedTrialData = trials.filter(trial => selectedTrials.has(trial.trial_id));

    // Create CSV content
    const csvContent = [
      // Header
      ['Trial ID', 'Title', 'Therapeutic Area', 'Disease Type', 'Status', 'Phase', 'Sponsor', 'Created Date'].join(','),
      // Data rows
      ...selectedTrialData.map(trial => [
        trial.trial_id,
        `"${trial.overview.title || 'Untitled'}"`,
        `"${formatDisplayValue(trial.overview.therapeutic_area)}"`,
        `"${formatDisplayValue(trial.overview.disease_type)}"`,
        `"${trial.overview.status || 'Unknown'}"`,
        `"${trial.overview.trial_phase || 'N/A'}"`,
        `"${trial.overview.sponsor_collaborators || 'N/A'}"`,
        `"${formatDate(trial.overview.created_at)}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `therapeutic_trials_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${selectedTrialData.length} trial${selectedTrialData.length > 1 ? 's' : ''} to CSV.`,
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      Planned: "bg-amber-100 text-amber-700",
      Active: "bg-emerald-100 text-emerald-700",
      Completed: "bg-teal-100 text-teal-700",
      Terminated: "bg-red-100 text-red-700",
      Suspended: "bg-orange-100 text-orange-700",
      Draft: "bg-gray-100 text-gray-700",
    };
    return statusColors[status] || "bg-gray-100 text-gray-700";
  };

  // Note: Do not block render with a loading screen; render UI immediately

  return (
    <div className="space-y-4 w-0 min-w-full">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold">Clinical Trials</h1>
          <p className="text-sm text-muted-foreground">
            Browse and manage all trials. Total: {trials.length}
            {advancedSearchCriteria.length > 0 && (
              <span className="ml-2 text-blue-600">
                • {advancedSearchCriteria.length} advanced filter{advancedSearchCriteria.length > 1 ? 's' : ''} active
              </span>
            )}
            {Object.values(appliedFilters).some(arr => arr.length > 0) && (
              <span className="ml-2 text-purple-600">
                • {Object.values(appliedFilters).reduce((count, arr) => count + arr.length, 0)} filter{Object.values(appliedFilters).reduce((count, arr) => count + arr.length, 0) > 1 ? 's' : ''} active
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAdvancedSearchOpen(true)}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Search className="h-4 w-4 mr-2" />
            Advanced Search
          </Button>
          <Button
            variant="outline"
            onClick={() => setFilterModalOpen(true)}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchTrials(true, true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button onClick={() => {
            const popup = window.open(
              "/admin/therapeutics/new/5-consolidated",
              "add_new_trial",
              "width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no"
            );
            if (!popup) {
              toast({
                title: "Popup blocked",
                description: "Please allow popups for this site to add new trials.",
                variant: "destructive",
              });
            }
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Trial
          </Button>
          {isDevMode && (
            <Button
              variant="destructive"
              onClick={deleteAllTrials}
              disabled={isDeletingAllTrials}
              className="flex items-center"
            >
              {isDeletingAllTrials ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Trials (Dev)
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search trials by title, therapeutic area, disease type, drugs, sponsor, etc..."
            value={searchTerm}
            onChange={(e) => handleSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {(searchTerm || advancedSearchCriteria.length > 0 || Object.values(appliedFilters).some(arr => arr.length > 0)) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('Clearing all filters and search term');
              setSearchTerm("");
              setAdvancedSearchCriteria([]);
              setAppliedFilters({
                therapeuticAreas: [],
                statuses: [],
                diseaseTypes: [],
                primaryDrugs: [],
                trialPhases: [],
                patientSegments: [],
                lineOfTherapy: [],
                countries: [],
                sponsorsCollaborators: [],
                sponsorFieldActivity: [],
                associatedCro: [],
                trialTags: [],
                sex: [],
                healthyVolunteers: [],
                trialRecordStatus: [],
                // Additional fields from trial creation form
                otherDrugs: [],
                regions: [],
                ageMin: [],
                ageMax: [],
                subjectType: [],
                ecogPerformanceStatus: [],
                priorTreatments: [],
                biomarkerRequirements: [],
                estimatedEnrollment: [],
                actualEnrollment: [],
                enrollmentStatus: [],
                recruitmentPeriod: [],
                studyCompletionDate: [],
                primaryCompletionDate: [],
                populationDescription: [],
                studySites: [],
                principalInvestigators: [],
                siteStatus: [],
                siteCountries: [],
                siteRegions: [],
                siteContactInfo: [],
                trialResults: [],
                trialOutcomeContent: [],
                resultsAvailable: [],
                endpointsMet: [],
                adverseEventsReported: [],
                studyStartDate: [],
                firstPatientIn: [],
                lastPatientIn: [],
                studyEndDate: [],
                interimAnalysisDates: [],
                finalAnalysisDate: [],
                regulatorySubmissionDate: [],
                purposeOfTrial: [],
                summary: [],
                primaryOutcomeMeasures: [],
                otherOutcomeMeasures: [],
                studyDesignKeywords: [],
                studyDesign: [],
                treatmentRegimen: [],
                numberOfArms: [],
                inclusionCriteria: [],
                exclusionCriteria: [],
                ageFrom: [],
                ageTo: [],
                gender: [],
                targetNoVolunteers: [],
                actualEnrolledVolunteers: [],
                startDateEstimated: [],
                trialEndDateEstimated: [],
                trialOutcome: [],
                adverseEventReported: [],
                adverseEventType: [],
                treatmentForAdverseEvents: [],
                totalSites: [],
                siteNotes: [],
                publicationType: [],
                registryName: [],
                studyType: []
              });
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Selection Controls */}
      {selectedTrials.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-800">
              {selectedTrials.size} trial{selectedTrials.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewSelectedTrials(false)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Open in Popups (Default)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSelected}
                className="bg-white hover:bg-gray-50 text-green-700 border-green-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTrials(new Set());
              setIsSelectAllChecked(false);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Sort By Dropdown and Query Actions */}
      <div className="flex items-center justify-between">
        {/* Left side - Sort and Customize Columns */}
        <div className="flex items-center space-x-2">
          <div className="relative" ref={sortDropdownRef}>
            <Button
              variant="outline"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              {sortField ? (
                <>
                  {COLUMN_OPTIONS.find(opt => opt.key === sortField)?.label || "Sort By"}
                  <span className="ml-2 text-xs">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                </>
              ) : (
                "Sort By"
              )}
            </Button>
            {sortDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[450px] overflow-y-auto">
                <div className="py-1">
                  {getAvailableSortOptions().map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        handleSort(option.key);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortField === option.key ? "bg-blue-50 font-semibold text-blue-700" : ""
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {sortField === option.key && (
                          <span className="text-xs font-bold">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {sortField && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSortField("");
                setSortDirection("asc");
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear Sort
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setCustomizeColumnModalOpen(true)}
            className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize Columns
          </Button>
        </div>

        {/* Right side - Query Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setSaveQueryModalOpen(true)}
            className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Query
          </Button>
          <Button
            variant="outline"
            onClick={() => setQueryHistoryModalOpen(true)}
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <Clock className="h-4 w-4 mr-2" />
            Saved Queries
          </Button>
          <Button
            variant="outline"
            onClick={() => setQueryLogsModalOpen(true)}
            className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
          >
            <Clock className="h-4 w-4 mr-2" />
            Query Logs
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card relative overflow-hidden">
        {/* Desktop / larger screens → normal table with fixed height scrollable container */}
        <div
          className="h-[calc(100vh-480px)] min-h-[400px] w-full overflow-auto"
        >
          <table className="min-w-[1800px] w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b bg-muted/40">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12 sticky top-0 bg-muted/40">
                  <Checkbox
                    checked={isSelectAllChecked}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Trial ID</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Title</th>
                {/* Basic Info Section */}
                {columnSettings.therapeuticArea && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Therapeutic Area</th>}
                {columnSettings.diseaseType && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Disease Type</th>}
                {columnSettings.primaryDrug && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Primary Drug</th>}
                {columnSettings.trialPhase && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Trial Phase</th>}
                {columnSettings.patientSegment && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Patient Segment</th>}
                {columnSettings.lineOfTherapy && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Line of Therapy</th>}
                {columnSettings.countries && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Countries</th>}
                {columnSettings.sponsorsCollaborators && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Sponsors & Collaborators</th>}
                {columnSettings.fieldOfActivity && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Field of Activity</th>}
                {columnSettings.associatedCro && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Associated CRO</th>}
                {columnSettings.trialTags && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Trial Tags</th>}
                {columnSettings.otherDrugs && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Other Drugs</th>}
                {columnSettings.regions && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Region</th>}
                {columnSettings.trialRecordStatus && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Trial Record Status</th>}
                {columnSettings.status && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Status</th>}
                {/* Eligibility Section */}
                {columnSettings.inclusionCriteria && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Inclusion Criteria</th>}
                {columnSettings.exclusionCriteria && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Exclusion Criteria</th>}
                {columnSettings.ageFrom && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Age From</th>}
                {columnSettings.ageTo && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Age To</th>}
                {columnSettings.subjectType && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Subject Type</th>}
                {columnSettings.sex && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Sex</th>}
                {columnSettings.healthyVolunteers && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Healthy Volunteers</th>}
                {columnSettings.targetNoVolunteers && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Target Volunteers</th>}
                {columnSettings.actualEnrolledVolunteers && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Actual Volunteers</th>}
                {/* Study Design Section */}
                {columnSettings.purposeOfTrial && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Purpose of Trial</th>}
                {columnSettings.summary && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Summary</th>}
                {columnSettings.primaryOutcomeMeasures && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Primary Outcome</th>}
                {columnSettings.otherOutcomeMeasures && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Other Outcome</th>}
                {columnSettings.studyDesignKeywords && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Study Design Keywords</th>}
                {columnSettings.studyDesign && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Study Design</th>}
                {columnSettings.treatmentRegimen && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Treatment Regimen</th>}
                {columnSettings.numberOfArms && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Number of Arms</th>}
                {/* Timing Section */}
                {columnSettings.startDateEstimated && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Start Date Est.</th>}
                {columnSettings.trialEndDateEstimated && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">End Date Est.</th>}
                {columnSettings.actualStartDate && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Actual Start Date</th>}
                {columnSettings.actualEnrollmentClosedDate && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Actual Enrollment Closed</th>}
                {columnSettings.actualTrialCompletionDate && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Actual Trial Completion</th>}
                {columnSettings.actualPublishedDate && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Actual Published Date</th>}
                {/* Results Section */}
                {columnSettings.resultsAvailable && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Results Available</th>}
                {columnSettings.endpointsMet && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Endpoints Met</th>}
                {columnSettings.trialOutcome && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Trial Outcome</th>}
                {/* Sites Section */}
                {columnSettings.totalSites && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Total Sites</th>}
                {/* New Fields */}
                {columnSettings.estimatedEnrollmentClosedDate && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Est. Enrollment Closed</th>}
                {columnSettings.estimatedResultPublishedDate && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Est. Result Published</th>}
                {columnSettings.referenceLinks && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Reference Links</th>}
                {/* Admin-only Fields */}
                {columnSettings.nextReviewDate && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Next Review Date</th>}
                {columnSettings.lastModifiedDate && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Last Modified Date</th>}
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Created</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground sticky top-0 bg-muted/40">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isSearching ? (
                <tr className="border-b">
                  <td colSpan={50} className="h-24 text-center p-4">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                      <p className="text-muted-foreground">Searching trials...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedTrials.length === 0 ? (
                <tr className="border-b">
                  <td colSpan={50} className="h-24 text-center p-4">
                    No trials found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedTrials.map((trial) => (
                  <tr key={trial.trial_id} className="border-b transition-colors hover:bg-muted/40">
                    <td className="p-4 align-middle">
                      <Checkbox
                        checked={selectedTrials.has(trial.trial_id)}
                        onCheckedChange={(checked) => handleSelectTrial(trial.trial_id, checked as boolean)}
                      />
                    </td>
                    <td className="p-4 align-middle font-mono max-w-[140px] truncate" title={trial.overview.trial_id || trial.trial_id}>
                      {trial.overview.trial_id || (trial.trial_id ? `${trial.trial_id.slice(0, 8)}...` : "-")}
                    </td>
                    <td className="p-4 align-middle max-w-[200px] truncate" title={trial.overview.title}>
                      {trial.overview.title || "Untitled"}
                    </td>
                    {/* Basic Info Section */}
                    {columnSettings.therapeuticArea && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{formatDisplayValue(trial.overview.therapeutic_area)}</td>
                    )}
                    {columnSettings.diseaseType && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{formatDisplayValue(trial.overview.disease_type)}</td>
                    )}
                    {columnSettings.primaryDrug && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{trial.overview.primary_drugs || "N/A"}</td>
                    )}
                    {columnSettings.trialPhase && (
                      <td className="p-4 align-middle">{trial.overview.trial_phase || "N/A"}</td>
                    )}
                    {columnSettings.patientSegment && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{formatDisplayValue(trial.overview.patient_segment)}</td>
                    )}
                    {columnSettings.lineOfTherapy && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{formatDisplayValue(trial.overview.line_of_therapy)}</td>
                    )}
                    {columnSettings.countries && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{trial.overview.countries || "N/A"}</td>
                    )}
                    {columnSettings.sponsorsCollaborators && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{trial.overview.sponsor_collaborators || "N/A"}</td>
                    )}
                    {columnSettings.fieldOfActivity && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{trial.overview.sponsor_field_activity || "N/A"}</td>
                    )}
                    {columnSettings.associatedCro && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{trial.overview.associated_cro || "N/A"}</td>
                    )}
                    {columnSettings.trialTags && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{trial.overview.trial_tags || "N/A"}</td>
                    )}
                    {columnSettings.otherDrugs && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{trial.overview.other_drugs || "N/A"}</td>
                    )}
                    {columnSettings.regions && (
                      <td className="p-4 align-middle max-w-[120px] truncate">{trial.overview.region || "N/A"}</td>
                    )}
                    {columnSettings.trialRecordStatus && (
                      <td className="p-4 align-middle max-w-[120px] truncate">{formatDisplayValue(trial.overview.trial_record_status)}</td>
                    )}
                    {columnSettings.status && (
                      <td className="p-4 align-middle max-w-[120px] truncate">{formatDisplayValue(trial.overview.status)}</td>
                    )}
                    {/* Eligibility Section */}
                    {columnSettings.inclusionCriteria && (
                      <td className="p-4 align-middle max-w-[200px] truncate">{trial.criteria[0]?.inclusion_criteria || "N/A"}</td>
                    )}
                    {columnSettings.exclusionCriteria && (
                      <td className="p-4 align-middle max-w-[200px] truncate">{trial.criteria[0]?.exclusion_criteria || "N/A"}</td>
                    )}
                    {columnSettings.ageFrom && (
                      <td className="p-4 align-middle">{trial.criteria[0]?.age_from || "N/A"}</td>
                    )}
                    {columnSettings.ageTo && (
                      <td className="p-4 align-middle">{trial.criteria[0]?.age_to || "N/A"}</td>
                    )}
                    {columnSettings.subjectType && (
                      <td className="p-4 align-middle">{trial.criteria[0]?.subject_type || "N/A"}</td>
                    )}
                    {columnSettings.sex && (
                      <td className="p-4 align-middle">{trial.criteria[0]?.sex || "N/A"}</td>
                    )}
                    {columnSettings.healthyVolunteers && (
                      <td className="p-4 align-middle">{trial.criteria[0]?.healthy_volunteers || "N/A"}</td>
                    )}
                    {columnSettings.targetNoVolunteers && (
                      <td className="p-4 align-middle">{trial.criteria[0]?.target_no_volunteers || "N/A"}</td>
                    )}
                    {columnSettings.actualEnrolledVolunteers && (
                      <td className="p-4 align-middle">{trial.criteria[0]?.actual_enrolled_volunteers || "N/A"}</td>
                    )}
                    {/* Study Design Section */}
                    {columnSettings.purposeOfTrial && (
                      <td className="p-4 align-middle max-w-[200px] truncate">{trial.outcomes[0]?.purpose_of_trial || "N/A"}</td>
                    )}
                    {columnSettings.summary && (
                      <td className="p-4 align-middle max-w-[200px] truncate">{trial.outcomes[0]?.summary || "N/A"}</td>
                    )}
                    {columnSettings.primaryOutcomeMeasures && (
                      <td className="p-4 align-middle max-w-[200px] truncate">{trial.outcomes[0]?.primary_outcome_measure || "N/A"}</td>
                    )}
                    {columnSettings.otherOutcomeMeasures && (
                      <td className="p-4 align-middle max-w-[200px] truncate">{trial.outcomes[0]?.other_outcome_measure || "N/A"}</td>
                    )}
                    {columnSettings.studyDesignKeywords && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{trial.outcomes[0]?.study_design_keywords || "N/A"}</td>
                    )}
                    {columnSettings.studyDesign && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{trial.outcomes[0]?.study_design || "N/A"}</td>
                    )}
                    {columnSettings.treatmentRegimen && (
                      <td className="p-4 align-middle max-w-[150px] truncate">{trial.outcomes[0]?.treatment_regimen || "N/A"}</td>
                    )}
                    {columnSettings.numberOfArms && (
                      <td className="p-4 align-middle">{trial.outcomes[0]?.number_of_arms || "N/A"}</td>
                    )}
                    {/* Timing Section */}
                    {columnSettings.startDateEstimated && (
                      <td className="p-4 align-middle text-sm">{formatDate(trial.timing[0]?.start_date_estimated) || "N/A"}</td>
                    )}
                    {columnSettings.trialEndDateEstimated && (
                      <td className="p-4 align-middle text-sm">{formatDate(trial.timing[0]?.trial_end_date_estimated) || "N/A"}</td>
                    )}
                    {columnSettings.actualStartDate && (
                      <td className="p-4 align-middle text-sm">{formatDate(trial.timing[0]?.start_date_actual) || "N/A"}</td>
                    )}
                    {columnSettings.actualEnrollmentClosedDate && (
                      <td className="p-4 align-middle text-sm">{formatDate(trial.timing[0]?.enrollment_closed_actual) || "N/A"}</td>
                    )}
                    {columnSettings.actualTrialCompletionDate && (
                      <td className="p-4 align-middle text-sm">{formatDate(trial.timing[0]?.trial_end_date_actual) || "N/A"}</td>
                    )}
                    {columnSettings.actualPublishedDate && (
                      <td className="p-4 align-middle text-sm">{formatDate(trial.timing[0]?.result_published_date_actual) || "N/A"}</td>
                    )}
                    {/* Results Section */}
                    {columnSettings.resultsAvailable && (
                      <td className="p-4 align-middle">{(() => {
                        console.log(`[DEBUG] Trial ${trial.trial_id} - Results object:`, trial.results?.[0]);
                        console.log(`[DEBUG] Trial ${trial.trial_id} - results_available value:`, trial.results?.[0]?.results_available, typeof trial.results?.[0]?.results_available);
                        console.log(`[DEBUG] Trial ${trial.trial_id} - endpoints_met value:`, trial.results?.[0]?.endpoints_met, typeof trial.results?.[0]?.endpoints_met);
                        const isAvailable = trial.results?.[0]?.results_available === true || trial.results?.[0]?.results_available === "Yes" || trial.results?.[0]?.results_available === "yes";
                        return isAvailable ? "Yes" : "No";
                      })()}</td>
                    )}
                    {columnSettings.endpointsMet && (
                      <td className="p-4 align-middle">{trial.results?.[0]?.endpoints_met === true || trial.results?.[0]?.endpoints_met === "Yes" || trial.results?.[0]?.endpoints_met === "yes" ? "Yes" : "No"}</td>
                    )}
                    {columnSettings.trialOutcome && (
                      <td className="p-4 align-middle">{trial.results[0]?.trial_outcome || "N/A"}</td>
                    )}
                    {/* Sites Section */}
                    {columnSettings.totalSites && (
                      <td className="p-4 align-middle">{trial.sites[0]?.total || "N/A"}</td>
                    )}
                    {/* New Fields */}
                    {columnSettings.estimatedEnrollmentClosedDate && (
                      <td className="p-4 align-middle text-sm">{formatDate(trial.timing[0]?.enrollment_closed_estimated) || "N/A"}</td>
                    )}
                    {columnSettings.estimatedResultPublishedDate && (
                      <td className="p-4 align-middle text-sm">{formatDate(trial.timing[0]?.result_published_date_estimated) || "N/A"}</td>
                    )}
                    {columnSettings.referenceLinks && (
                      <td className="p-4 align-middle max-w-[200px] truncate">{trial.overview.reference_links?.join(", ") || "N/A"}</td>
                    )}
                    {/* Admin-only Fields */}
                    {columnSettings.nextReviewDate && (
                      <td className="p-4 align-middle text-sm">{formatDate(trial.logs[0]?.next_review_date) || "N/A"}</td>
                    )}
                    {columnSettings.lastModifiedDate && (
                      <td className="p-4 align-middle text-sm">{formatDate(trial.logs[0]?.last_modified_date) || "N/A"}</td>
                    )}
                    <td className="p-4 align-middle text-sm">{formatDate(trial.overview.created_at)}</td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          router.push(`/admin/therapeutics/${trial.trial_id}`);
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(trial.trial_id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTrial(trial.trial_id)}
                          disabled={deletingTrials[trial.trial_id]}
                          className="text-red-600 hover:text-red-700"
                        >
                          {deletingTrials[trial.trial_id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )))}
            </tbody>
            <caption className="mt-4 text-sm text-muted-foreground caption-bottom">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} Clinical Trials
            </caption>
          </table>
        </div>
      </div>

      {/* Mobile / small screens → cards */}
      <div className="block md:hidden space-y-4 p-2">
        {paginatedTrials.map((trial) => (
          <Card key={trial.trial_id} className="shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Trial ID: <span className="font-mono">
                    {trial.overview.trial_id || trial.trial_id.slice(0, 8) + '...'}
                  </span></p>
                  <p className="font-semibold">{trial.overview.title || "Untitled"}</p>
                  <Badge variant="outline">{trial.overview.therapeutic_area || "N/A"}</Badge>
                  <p className="text-sm">Disease: {trial.overview.disease_type || "N/A"}</p>
                  <p className="text-sm">Status: <span className={getStatusColor(trial.overview.status)}>{trial.overview.status || "Unknown"}</span></p>
                  <p className="text-sm">Phase: {trial.overview.trial_phase || "N/A"}</p>
                  <p className="text-sm">Sponsor: {trial.overview.sponsor_collaborators || "N/A"}</p>
                  <p className="text-sm">Created: {formatDate(trial.overview.created_at)}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Checkbox
                    checked={selectedTrials.has(trial.trial_id)}
                    onCheckedChange={(checked) => handleSelectTrial(trial.trial_id, checked as boolean)}
                  />
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      const popup = window.open(
                        `/admin/therapeutics/${trial.trial_id}/backend`,
                        `trial_backend_${trial.trial_id}`,
                        `width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no`
                      );
                      if (!popup) {
                        toast({
                          title: "Popup blocked",
                          description: "Please allow popups for this site to view trial backend data.",
                          variant: "destructive",
                        });
                      }
                    }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(trial.trial_id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTrial(trial.trial_id)}
                      disabled={deletingTrials[trial.trial_id]}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deletingTrials[trial.trial_id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="items-per-page" className="text-sm font-medium whitespace-nowrap">
                Results per page:
              </Label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}>
                <SelectTrigger className="w-[70px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} results
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* Advanced Search Modal */}
      <TherapeuticAdvancedSearchModal
        open={isAdvancedSearchOpen}
        onOpenChange={handleAdvancedSearchModalChange}
        onApplySearch={handleAdvancedSearch}
        trials={trials}
        currentFilters={appliedFilters}
        initialCriteria={advancedSearchCriteria}
        editingQueryId={editingQueryId}
        editingQueryTitle={editingQueryTitle}
        editingQueryDescription={editingQueryDescription}
        onSaveQuerySuccess={handleSaveQuerySuccess}
        storageKey="adminTherapeuticQueries"
        queryType="admin-therapeutic"
      />

      {/* Filter Modal */}
      <TherapeuticFilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        onApplyFilters={handleApplyFilters}
        currentFilters={appliedFilters}
        trials={trials}
        storageKey="adminTherapeuticQueries"
        queryType="admin-therapeutic"
        editingQueryId={editingQueryId}
        editingQueryTitle={editingQueryTitle}
        editingQueryDescription={editingQueryDescription}
      />

      {/* Save Query Modal */}
      <SaveQueryModal
        open={saveQueryModalOpen}
        onOpenChange={setSaveQueryModalOpen}
        currentFilters={appliedFilters}
        currentSearchCriteria={advancedSearchCriteria}
        searchTerm={searchTerm}
        onSaveSuccess={handleSaveQuerySuccess}
        editingQueryId={editingQueryId}
        editingQueryTitle={editingQueryTitle}
        editingQueryDescription={editingQueryDescription}
        storageKey="adminTherapeuticQueries"
        queryType="admin-therapeutic"
        sourceModal={filterModalOpen ? "filter" : "advanced"}
      />

      {/* Query History Modal */}
      <QueryHistoryModal
        open={queryHistoryModalOpen}
        onOpenChange={setQueryHistoryModalOpen}
        onLoadQuery={handleLoadQuery}
        onEditQuery={handleEditQuery}
        storageKey="adminTherapeuticQueries"
        queryType="admin-therapeutic"
      />

      {/* Query Logs Modal */}
      <QueryLogsModal
        open={queryLogsModalOpen}
        onOpenChange={setQueryLogsModalOpen}
        onExecuteQuery={handleExecuteQueryFromLog}
      />

      {/* Customize Column Modal */}
      <CustomizeColumnModal
        open={customizeColumnModalOpen}
        onOpenChange={setCustomizeColumnModalOpen}
        columnSettings={columnSettings}
        onColumnSettingsChange={handleColumnSettingsChange}
      />
    </div>
  );
}
