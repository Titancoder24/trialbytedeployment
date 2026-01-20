"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
// Using native HTML table elements for sticky header support
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Search,
  Filter,
  FileText,
  Upload,
  ChevronLeft,
  MoreHorizontal,
  Bookmark,
  Clock,
  Eye,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Heart,
  RefreshCw,
  Loader2,
  Calendar,
} from "lucide-react";

// React icons for TrialsListing-style sidebar
import { IoSearch } from "react-icons/io5";
import { FaRegFolder, FaTimes } from "react-icons/fa";
import { TbArrowsSort } from "react-icons/tb";
import { CiSaveDown2, CiBookmark } from "react-icons/ci";
import { GoHistory } from "react-icons/go";
import { SlList } from "react-icons/sl";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateToMMDDYYYY } from "@/lib/date-utils";
import Image from "next/image";
import { ClinicalTrialFilterModal, ClinicalTrialFilterState } from "@/components/clinical-trial-filter-modal";
import { ClinicalTrialAdvancedSearchModal, ClinicalTrialSearchCriteria } from "@/components/clinical-trial-advanced-search-modal";
import { SaveQueryModal } from "@/components/save-query-modal";
import { QueryHistoryModal } from "@/components/query-history-modal";
import { CustomizeColumnModal, ColumnSettings, DEFAULT_COLUMN_SETTINGS } from "@/components/customize-column-modal";
import { FavoriteTrialsModal } from "@/components/favorite-trials-modal";
import { ExportTrialsModal } from "@/components/export-trials-modal";
import { GlobalSearchModal } from "@/components/global-search-modal";
import { buildApiUrl } from "@/app/_lib/api";
import { toast } from "@/hooks/use-toast";

// Types based on the therapeutics API response
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

export default function ClinicalTrialDashboard() {
  const router = useRouter();
  const [trials, setTrials] = useState<TherapeuticTrial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [advancedSearchModalOpen, setAdvancedSearchModalOpen] = useState(false);
  const [saveQueryModalOpen, setSaveQueryModalOpen] = useState(false);
  const [queryHistoryModalOpen, setQueryHistoryModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [appliedFilters, setAppliedFilters] = useState<ClinicalTrialFilterState>({
    therapeuticAreas: [],
    statuses: [],
    diseaseTypes: [],
    primaryDrugs: [],
    otherDrugs: [],
    trialPhases: [],
    patientSegments: [],
    lineOfTherapy: [],
    countries: [],
    sponsorsCollaborators: [],
    sponsorFieldActivity: [],
    associatedCro: [],
    trialTags: [],
    sex: [],
    healthyVolunteers: []
  });
  const [appliedSearchCriteria, setAppliedSearchCriteria] = useState<ClinicalTrialSearchCriteria[]>([]);
  const [viewType, setViewType] = useState<'list' | 'card'>('list');
  const [customizeColumnModalOpen, setCustomizeColumnModalOpen] = useState(false);
  const [columnSettings, setColumnSettings] = useState<ColumnSettings>(DEFAULT_COLUMN_SETTINGS);
  const [favoriteTrialsModalOpen, setFavoriteTrialsModalOpen] = useState(false);
  const [favoriteTrials, setFavoriteTrials] = useState<string[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [resultsPerPage, setResultsPerPage] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTrials, setSelectedTrials] = useState<string[]>([]);

  // Fetch trials data using the therapeutics API with caching
  const fetchTrials = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Check cache first for instant loading (only on initial load)
      const cacheKey = 'trials_cache';
      const cacheTimestampKey = 'trials_cache_timestamp';
      const cacheMaxAge = 30 * 60 * 1000; // 30 minutes cache for blazing fast loads

      if (!isRefresh) {
        const cachedData = sessionStorage.getItem(cacheKey);
        const cachedTimestamp = sessionStorage.getItem(cacheTimestampKey);

        if (cachedData && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp, 10);
          if (age < cacheMaxAge) {
            const data = JSON.parse(cachedData);
            setTrials(data.trials);
            setLoading(false);
            // Refresh in background silently
            fetchFromAPIBackground();
            return;
          }
        }
      }

      // Use normalized URL helper to prevent double slashes
      const apiUrl = buildApiUrl("/api/v1/therapeutic/all-trials-with-data");
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();

      // Cache the response
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        sessionStorage.setItem(cacheTimestampKey, Date.now().toString());
      } catch (e) {
        // Ignore storage errors
      }

      setTrials(data.trials);

      if (isRefresh) {
        toast({
          title: "Refreshed",
          description: "Clinical trials data has been updated",
        });
      }
    } catch (error) {
      console.error("Error fetching trials:", error);
      toast({
        title: "Error",
        description: "Failed to fetch trials data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Background API fetch helper
  const fetchFromAPIBackground = async () => {
    try {
      const apiUrl = buildApiUrl("/api/v1/therapeutic/all-trials-with-data");
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (response.ok) {
        const data: ApiResponse = await response.json();
        try {
          sessionStorage.setItem('trials_cache', JSON.stringify(data));
          sessionStorage.setItem('trials_cache_timestamp', Date.now().toString());
        } catch (e) { }
        setTrials(data.trials);
      }
    } catch (e) {
      // Silently fail background updates
    }
  };

  useEffect(() => {
    fetchTrials();
    // Load column settings from localStorage
    const savedColumnSettings = localStorage.getItem('trialColumnSettings');
    if (savedColumnSettings) {
      try {
        setColumnSettings(JSON.parse(savedColumnSettings));
      } catch (error) {
        console.error('Error parsing saved column settings:', error);
      }
    }

    // Load favorite trials from localStorage
    const savedFavoriteTrials = localStorage.getItem('favoriteTrials');
    if (savedFavoriteTrials) {
      try {
        setFavoriteTrials(JSON.parse(savedFavoriteTrials));
      } catch (error) {
        console.error('Error parsing saved favorite trials:', error);
      }
    }
  }, []);

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLogoutDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Logout functionality
  const handleLogout = () => {
    // Clear any stored authentication data (tokens, user data, etc.)
    // This is a placeholder - implement based on your auth system
    localStorage.removeItem('authToken');
    sessionStorage.clear();

    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });

    // Navigate to home page
    router.push("/");
  };

  // Helper function to get field value from trial object
  // Returns empty string if value is null/undefined
  const getFieldValue = (trial: TherapeuticTrial, field: string): string => {
    switch (field) {
      case "disease_type": return trial.overview.disease_type || "";
      case "therapeutic_area": return trial.overview.therapeutic_area || "";
      case "trial_phase": return trial.overview.trial_phase || "";
      case "primary_drugs": return trial.overview.primary_drugs || "";
      case "trial_status": return trial.overview.status || "";
      case "sponsor_collaborators": return trial.overview.sponsor_collaborators || "";
      case "countries": return trial.overview.countries || "";
      case "patient_segment": return trial.overview.patient_segment || "";
      case "line_of_therapy": return trial.overview.line_of_therapy || "";
      case "trial_identifier": return trial.overview.trial_identifier?.join(", ") || "";
      case "enrollment": return trial.criteria[0]?.target_no_volunteers?.toString() || "0";
      default: return "";
    }
  };

  // Sorting functions
  const getSortValue = (trial: TherapeuticTrial, field: string): string | number => {
    switch (field) {
      case "trial_id": return trial.trial_id;
      case "therapeutic_area": return trial.overview.therapeutic_area;
      case "disease_type": return trial.overview.disease_type;
      case "primary_drug": return trial.overview.primary_drugs;
      case "trial_status": return trial.overview.status;
      case "sponsor": return trial.overview.sponsor_collaborators || "";
      case "phase": return trial.overview.trial_phase;
      default: return "";
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        // Toggle to descending
        setSortDirection("desc");
      } else {
        // Clear sort if already descending
        setSortField("");
        setSortDirection("asc");
      }
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Helper function to evaluate search criteria
  const evaluateCriteria = (fieldValue: string | null | undefined, operator: string, searchValue: string): boolean => {
    // Handle null/undefined field values
    if (fieldValue === null || fieldValue === undefined) {
      return operator === "is_not" ? true : false;
    }

    const field = fieldValue.toLowerCase();
    const value = (searchValue || '').toLowerCase();

    switch (operator) {
      case "contains": return field.includes(value);
      case "is": return field === value;
      case "is_not": return field !== value;
      case "starts_with": return field.startsWith(value);
      case "ends_with": return field.endsWith(value);
      default: return true;
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    return formatDateToMMDDYYYY(dateString);
  };

  // Status colors with color psychology - vibrant solid colors
  // Handles both lowercase and capitalized status values
  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    const statusColors: Record<string, string> = {
      confirmed: "bg-orange-500 text-white",      // Orange = Attention, confirmed
      terminated: "bg-red-500 text-white",        // Red = Stop, danger, terminated
      open: "bg-green-500 text-white",            // Green = Go, active, open
      closed: "bg-gray-600 text-white",           // Gray = Inactive, closed
      completed: "bg-emerald-500 text-white",     // Emerald = Success, completed
      active: "bg-green-500 text-white",          // Green = Active, ongoing
      planned: "bg-blue-500 text-white",          // Blue = Planned, upcoming
      suspended: "bg-amber-500 text-white",       // Amber = Warning, suspended
      draft: "bg-slate-400 text-white",           // Slate = Draft, pending
    };
    return statusColors[normalizedStatus] || "bg-gray-400 text-white";
  };

  // Apply filters and search criteria, then sort
  const filteredTrials = trials.filter((trial) => {
    // Basic search filter
    const matchesSearch = searchTerm === "" ||
      (trial.trial_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trial.overview.therapeutic_area || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trial.overview.disease_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trial.overview.primary_drugs || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trial.overview.title || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Apply filters
    const matchesFilters = (
      (appliedFilters.therapeuticAreas.length === 0 ||
        appliedFilters.therapeuticAreas.some(area =>
          (trial.overview.therapeutic_area || '').toLowerCase().includes(area.toLowerCase()))) &&
      (appliedFilters.statuses.length === 0 ||
        appliedFilters.statuses.some(status =>
          (trial.overview.status || '').toLowerCase() === status.toLowerCase())) &&
      (appliedFilters.diseaseTypes.length === 0 ||
        appliedFilters.diseaseTypes.some(type =>
          (trial.overview.disease_type || '').toLowerCase().includes(type.toLowerCase()))) &&
      (appliedFilters.primaryDrugs.length === 0 ||
        appliedFilters.primaryDrugs.some(drug =>
          (trial.overview.primary_drugs || '').toLowerCase().includes(drug.toLowerCase()))) &&
      (appliedFilters.trialPhases.length === 0 ||
        appliedFilters.trialPhases.some(phase => {
          const trialPhase = (trial.overview.trial_phase || '').toLowerCase();
          const filterPhase = phase.toLowerCase();
          // Handle both "Phase I" and "I" formats
          return trialPhase.includes(filterPhase) ||
            filterPhase.includes(trialPhase) ||
            `phase ${trialPhase}` === filterPhase;
        })) &&
      (appliedFilters.countries.length === 0 ||
        appliedFilters.countries.some(country =>
          (trial.overview.countries || '').toLowerCase().includes(country.toLowerCase())))
    );

    // Apply advanced search criteria
    const matchesAdvancedSearch = appliedSearchCriteria.length === 0 ||
      appliedSearchCriteria.every(criteria => {
        const fieldValue = getFieldValue(trial, criteria.field);
        return evaluateCriteria(fieldValue, criteria.operator, criteria.value);
      });

    return matchesSearch && matchesFilters && matchesAdvancedSearch;
  }).sort((a, b) => {
    if (!sortField) return 0; // No sorting if no field selected

    const aValue = getSortValue(a, sortField);
    const bValue = getSortValue(b, sortField);

    // Handle string comparisons
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    // Handle numeric comparisons
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Mixed types - convert to string
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    const comparison = aStr.localeCompare(bStr);
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleApplyFilters = (filters: ClinicalTrialFilterState) => {
    setAppliedFilters(filters);
  };

  const handleApplyAdvancedSearch = (criteria: ClinicalTrialSearchCriteria[]) => {
    setAppliedSearchCriteria(criteria);
  };

  const clearAllFilters = () => {
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
      healthyVolunteers: []
    });
    setAppliedSearchCriteria([]);
  };

  const hasActiveFilters = () => {
    return Object.values(appliedFilters).some(filter => filter.length > 0) ||
      appliedSearchCriteria.length > 0;
  };

  const getActiveFilterCount = () => {
    const filterCount = Object.values(appliedFilters).reduce((count, filter) => count + filter.length, 0);
    return filterCount + appliedSearchCriteria.length;
  };

  const handleSaveQuerySuccess = () => {
    toast({
      title: "Success",
      description: "Query saved successfully",
    });
  };

  const handleLoadQuery = (queryData: any) => {
    if (queryData.searchTerm) {
      setSearchTerm(queryData.searchTerm);
    }
    if (queryData.filters) {
      setAppliedFilters(queryData.filters);
    }
    if (queryData.searchCriteria) {
      setAppliedSearchCriteria(queryData.searchCriteria);
    }
  };

  const handleColumnSettingsChange = (newSettings: ColumnSettings) => {
    setColumnSettings(newSettings);
    // Save to localStorage
    localStorage.setItem('trialColumnSettings', JSON.stringify(newSettings));
  };

  // Favorite trials functionality
  const toggleFavoriteTrial = (trialId: string) => {
    setFavoriteTrials(prev => {
      const newFavorites = prev.includes(trialId)
        ? prev.filter(id => id !== trialId)
        : [...prev, trialId];

      // Save to localStorage
      localStorage.setItem('favoriteTrials', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const getFavoriteTrialsData = () => {
    return trials.filter(trial => favoriteTrials.includes(trial.trial_id)).map(trial => ({
      id: trial.trial_id,
      trialId: trial.overview.trial_id || `#${trial.trial_id.slice(0, 6)}`,
      therapeuticArea: trial.overview.therapeutic_area,
      diseaseType: trial.overview.disease_type,
      primaryDrug: trial.overview.primary_drugs,
      status: trial.overview.status,
      sponsor: trial.overview.sponsor_collaborators || "N/A",
      phase: trial.overview.trial_phase
    }));
  };

  // Pagination helpers
  const totalPages = Math.ceil(filteredTrials.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = Math.min(startIndex + resultsPerPage, filteredTrials.length);
  const paginatedTrials = filteredTrials.slice(startIndex, endIndex);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  const toggleTrialSelection = (trialId: string) => {
    setSelectedTrials(prev =>
      prev.includes(trialId)
        ? prev.filter(id => id !== trialId)
        : [...prev, trialId]
    );
  };

  const openSelectedTrials = () => {
    if (selectedTrials.length > 0) {
      // Open the first selected trial for now
      router.push(`/user/clinical_trial/trials?trialId=${selectedTrials[0]}`);
    }
  };

  // Reset to first page when filters change
  const handleResultsPerPageChange = (value: string) => {
    setResultsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Render card view - horizontal layout matching reference design
  const renderCardView = () => {
    return (
      <div className="flex flex-col gap-4">
        {paginatedTrials.map((trial) => (
          <Card
            key={trial.trial_id}
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 bg-white"
            onClick={() => {
              router.push(`/user/clinical_trial/trials?trialId=${trial.trial_id}`);
            }}
          >
            <div className="flex items-start gap-4">
              {/* Checkbox */}
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={selectedTrials.includes(trial.trial_id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleTrialSelection(trial.trial_id)}
                />
              </div>

              {/* Card Content */}
              <div className="flex-1 min-w-0">
                {/* Row 1: Trial ID + Therapeutic Area */}
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">Trial ID :</span>
                    <Badge className="bg-green-600 text-white hover:bg-green-700 px-3 py-1 text-xs font-medium rounded-lg">
                      {trial.overview.trial_id?.replace('TB-', '') || trial.trial_id.slice(0, 6)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">Therapeutic Area :</span>
                    <div className="flex items-center gap-1.5">
                      {/* Red Icon */}
                      <Image
                        src="/pngs/redicon.png"
                        alt="Therapeutic Area"
                        width={13}
                        height={13}
                      />
                      <span className="text-sm font-medium text-gray-900">{trial.overview.therapeutic_area}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Disease Type + Primary Drug + Trial Status + Sponsor + Phase */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">Disease Type :</span>
                    <span className="text-sm font-medium text-gray-900">{trial.overview.disease_type}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">Primary Drug :</span>
                    <span className="text-sm font-medium text-gray-900">{trial.overview.primary_drugs || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">Trial Status :</span>
                    <Badge className={`px-3 py-1 text-xs font-medium rounded-lg ${getStatusColorCard(trial.overview.status)}`}>
                      {trial.overview.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">Sponsor :</span>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                      {trial.overview.sponsor_collaborators || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">Phase :</span>
                    <span className="text-sm font-medium text-gray-900">{trial.overview.trial_phase}</span>
                  </div>
                </div>
              </div>

              {/* Favorite Button */}
              <div className="flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteTrial(trial.trial_id);
                  }}
                  className="h-8 w-8 p-0 hover:bg-red-50"
                >
                  <Heart
                    className={`h-4 w-4 ${favoriteTrials.includes(trial.trial_id)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-400 hover:text-red-500'
                      }`}
                  />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // Status colors for card view - more vibrant
  // Handles both lowercase and capitalized status values
  const getStatusColorCard = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    const statusColors: Record<string, string> = {
      confirmed: "bg-orange-500 text-white hover:bg-orange-600",
      terminated: "bg-red-500 text-white hover:bg-red-600",
      open: "bg-green-500 text-white hover:bg-green-600",
      closed: "bg-gray-600 text-white hover:bg-gray-700",
      completed: "bg-emerald-500 text-white hover:bg-emerald-600",
      active: "bg-green-500 text-white hover:bg-green-600",
      planned: "bg-blue-500 text-white hover:bg-blue-600",
      suspended: "bg-amber-500 text-white hover:bg-amber-600",
      draft: "bg-slate-400 text-white hover:bg-slate-500",
    };
    return statusColors[normalizedStatus] || "bg-gray-400 text-white";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading trials data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Top Navigation - Matching Trials Page */}
      <div
        style={{
          width: "calc(100% - 32px)",
          maxWidth: "1409px",
          margin: "25px auto 0",
          borderRadius: "24px",
          backgroundColor: "#F7F9FB",
        }}
      >
        {/* Navigation Container */}
        <div
          className="flex items-center"
          style={{
            width: "calc(100% - 54px)",
            height: "32px",
            marginTop: "11.75px",
            marginLeft: "16px",
            marginRight: "16px",
            gap: "8px",
          }}
        >
          {/* Logo Box */}
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "12px",
              padding: "10px",
              gap: "8px",
              backgroundColor: "#FFFFFF",
            }}
          >
            <Image
              src="/pngs/logo1.png"
              alt="Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>

          {/* Dashboard Box - Active/Selected */}
          <button
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: "140px",
              height: "52px",
              borderRadius: "12px",
              paddingTop: "12px",
              paddingRight: "20px",
              paddingBottom: "12px",
              paddingLeft: "16px",
              gap: "8px",
              backgroundColor: "#204B73",
              boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Image
              src="/pngs/dashboardicon.png"
              alt="Dashboard"
              width={20}
              height={20}
              className="object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <span
              style={{
                fontFamily: "Poppins",
                fontWeight: 400,
                fontStyle: "normal",
                fontSize: "14px",
                lineHeight: "150%",
                letterSpacing: "-2%",
                color: "#FFFFFF",
              }}
            >
              Dashboard
            </span>
          </button>

          {/* Trials Search Box */}
          <button
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: "165px",
              height: "52px",
              borderRadius: "12px",
              paddingTop: "12px",
              paddingRight: "20px",
              paddingBottom: "12px",
              paddingLeft: "16px",
              gap: "8px",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Image
              src="/pngs/trialsearchIcon.png"
              alt="Trials Search"
              width={20}
              height={20}
              className="object-contain"
            />
            <span
              style={{
                fontFamily: "Poppins",
                fontWeight: 400,
                fontStyle: "normal",
                fontSize: "14px",
                lineHeight: "150%",
                letterSpacing: "-2%",
                color: "#000000",
              }}
            >
              Trials Search
            </span>
          </button>

          {/* Trials Box */}
          <Link href="/user/clinical_trial/trials">
            <button
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: "151px",
                height: "52px",
                borderRadius: "12px",
                paddingTop: "12px",
                paddingRight: "20px",
                paddingBottom: "12px",
                paddingLeft: "16px",
                gap: "8px",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Image
                src="/pngs/trialsicon.png"
                alt="Trials"
                width={20}
                height={20}
                className="object-contain"
                style={{ filter: "brightness(0) saturate(100%) invert(55%) sepia(6%) saturate(470%) hue-rotate(185deg) brightness(92%) contrast(87%)" }}
              />
              <span
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 400,
                  fontStyle: "normal",
                  fontSize: "14px",
                  lineHeight: "150%",
                  letterSpacing: "-2%",
                  color: "#000000",
                }}
              >
                Trials
              </span>
            </button>
          </Link>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* TrialByte Box */}
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              height: "48px",
              borderRadius: "12px",
              padding: "8px 16px",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Image
              src="/pngs/companyname.png"
              alt="TrialByte"
              width={80}
              height={24}
              className="object-contain"
            />
          </div>

          {/* Message Icon Box */}
          <button
            className="flex items-center justify-center"
            style={{
              width: "56px",
              height: "48px",
              borderRadius: "12px",
              padding: "16px",
              gap: "8px",
              backgroundColor: "#FFFFFF",
              flexShrink: 0,
              boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Image
              src="/pngs/messageicon.png"
              alt="Messages"
              width={24}
              height={24}
              className="object-contain"
            />
          </button>

          {/* Profile Box */}
          <div ref={dropdownRef} className="relative" style={{ flexShrink: 0 }}>
            <button
              className="flex items-center"
              onClick={() => setShowLogoutDropdown(!showLogoutDropdown)}
              style={{
                width: "220px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#FFFFFF",
                padding: "8px 8px",
                gap: "8px",
                boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Image
                src="/pngs/Profile.png"
                alt="Profile"
                width={32}
                height={32}
                className="object-contain"
              />
              <span
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 400,
                  fontStyle: "normal",
                  fontSize: "14px",
                  lineHeight: "150%",
                  letterSpacing: "-2%",
                  color: "#000000",
                }}
              >
                James cameron
              </span>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${showLogoutDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {showLogoutDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    setShowLogoutDropdown(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Container for gradient and content overlay */}
      <div className="relative" style={{ width: "calc(100% - 32px)", maxWidth: "1409px", margin: "0 auto" }}>
        {/* Blue Gradient Background */}
        <div
          className="absolute"
          style={{
            top: "30px",
            left: "0",
            right: "0",
            minHeight: "80vh",
            borderRadius: "12px",
            background: "linear-gradient(180deg, rgba(97, 204, 250, 0.4) 0%, rgba(247, 249, 251, 0.2) 100%)",
            zIndex: 1,
          }}
        />

        {/* Content overlaying the gradient */}
        <div className="relative" style={{ zIndex: 2, paddingTop: "38px" }}>
          {/* Secondary Header - Action Buttons Row */}
          <div
            className="flex items-center justify-between px-6 py-3"
            style={{ backgroundColor: "transparent" }}
          >
            {/* Left side - Back/Forward */}
            <div className="flex items-center space-x-4">
              <Link
                href="/user"
                className="flex items-center text-[#2B4863] hover:opacity-80"
                style={{ fontFamily: "Poppins", fontSize: "14px" }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" style={{ color: "#000000" }} />
                <span>Back</span>
              </Link>
              <div
                style={{
                  width: "1.5px",
                  height: "20px",
                  backgroundColor: "#7FCFF2",
                }}
              />
              <span
                className="text-[#424242]"
                style={{ fontFamily: "Poppins", fontSize: "14px" }}
              >
                Forward
              </span>
            </div>

            {/* Right side - Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAdvancedSearchModalOpen(true)}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                style={{
                  fontFamily: "Poppins",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#000000",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                }}
              >
                <Search className="h-5 w-5" style={{ color: "#000000" }} />
                Advanced Search
              </button>
              <button
                onClick={() => setFilterModalOpen(true)}
                className={`flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm ${hasActiveFilters() ? "bg-blue-100" : "bg-white"}`}
                style={{
                  fontFamily: "Poppins",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#000000",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                }}
              >
                <Image
                  src="/pngs/filtericon.png"
                  alt="Filter"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                Filter
                {hasActiveFilters() && (
                  <Badge className="ml-1 bg-blue-600 text-white text-xs px-1 py-0">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setQueryHistoryModalOpen(true)}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                style={{
                  fontFamily: "Poppins",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#000000",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                }}
              >
                <Calendar className="h-5 w-5" style={{ color: "#000000" }} />
                Saved Queries
              </button>
              <button
                onClick={() => setExportModalOpen(true)}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                style={{
                  fontFamily: "Poppins",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#000000",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                }}
              >
                <Image
                  src="/pngs/exporticon.png"
                  alt="Export"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                Export
              </button>
            </div>
          </div>



          <div className="flex">
            {/* Sidebar - TrialsListing Style */}
            <div className="w-64 flex-shrink-0 h-fit rounded-[12px] bg-white" style={{ fontFamily: "Poppins, sans-serif", marginLeft: "20px", width: "256px" }}>
              {/* Search Button */}
              <div className="relative" style={{ height: "73.86px", display: "flex", alignItems: "center", padding: "0 16px" }}>
                <button
                  onClick={() => setSearchModalOpen(true)}
                  className="w-full flex items-center justify-start gap-3 hover:bg-gray-50 transition-colors"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    padding: "0",
                  }}
                >
                  <Image
                    src="/pngs/trialsearchicon.png"
                    alt="Search"
                    width={18}
                    height={18}
                    style={{ filter: "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(1234%) hue-rotate(181deg) brightness(95%) contrast(89%)" }}
                  />
                  <span style={{ color: "#374151", fontFamily: "Poppins", fontSize: "14px", fontWeight: 400 }}>Search</span>
                </button>
                <div
                  className="absolute"
                  style={{
                    width: "256px",
                    height: "0px",
                    bottom: "0px",
                    left: "0px",
                    borderTopWidth: "1px",
                    borderTopStyle: "solid",
                    borderTopColor: "rgb(224, 224, 224)",
                  }}
                />
              </div>

              {/* View Type Section */}
              <div className="relative">
                <button
                  className="w-full flex items-center justify-between gap-2 py-3 px-4"
                  style={{
                    backgroundColor: "#204B73",
                    height: "56px",
                    borderRadius: "0",
                  }}
                  onClick={() => setViewType(viewType === 'list' ? 'card' : 'list')}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src="/pngs/viewicon.png"
                      alt="View"
                      width={18}
                      height={18}
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                    <span className="text-white" style={{ fontFamily: "Poppins", fontSize: "16px", fontWeight: 500 }}>View Type</span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-white" />
                </button>
                <div className="py-3 px-4 space-y-2">
                  <label className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded hover:bg-gray-50" style={{ color: viewType === 'list' ? "#204B73" : "#374151" }}>
                    <input
                      type="checkbox"
                      checked={viewType === 'list'}
                      onChange={() => setViewType('list')}
                      className="w-4 h-4 rounded border-gray-300"
                      style={{ accentColor: "#204B73" }}
                    />
                    <span style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: viewType === 'list' ? 500 : 400 }}>List view</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded hover:bg-gray-50" style={{ color: "#9CA3AF" }}>
                    <input
                      type="checkbox"
                      checked={viewType === 'card'}
                      onChange={() => setViewType('card')}
                      className="w-4 h-4 rounded border-gray-300"
                      style={{ accentColor: "#204B73" }}
                    />
                    <span style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: 400 }}>Card view</span>
                  </label>
                </div>
              </div>

              {/* Sort By Section */}
              <div className="relative">
                <button
                  className="w-full flex items-center justify-between gap-2 py-3 px-4"
                  style={{
                    backgroundColor: "#204B73",
                    height: "56px",
                    borderRadius: "0",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src="/pngs/filtericon.png"
                      alt="Sort"
                      width={18}
                      height={18}
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                    <span className="text-white" style={{ fontFamily: "Poppins", fontSize: "16px", fontWeight: 500 }}>Sort By</span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-white" />
                </button>
                <div className="py-3 px-4 space-y-1">
                  {/* Display only the columns selected in Customize Column View */}
                  {[
                    { key: "trial_id", label: "Trial ID", setting: "trialId" as keyof typeof columnSettings },
                    { key: "therapeutic_area", label: "Therapeutic Area", setting: "therapeuticArea" as keyof typeof columnSettings },
                    { key: "disease_type", label: "Disease Type", setting: "diseaseType" as keyof typeof columnSettings },
                    { key: "primary_drug", label: "Primary Drug", setting: "primaryDrug" as keyof typeof columnSettings },
                    { key: "trial_status", label: "Trial Status", setting: "trialRecordStatus" as keyof typeof columnSettings },
                    { key: "sponsor", label: "Sponsor", setting: "sponsorsCollaborators" as keyof typeof columnSettings },
                    { key: "phase", label: "Phase", setting: "trialPhase" as keyof typeof columnSettings },
                  ]
                    .filter(item => columnSettings[item.setting])
                    .map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded hover:bg-gray-50"
                        style={{ color: "#374151" }}
                      >
                        <input
                          type="checkbox"
                          checked={sortField === key}
                          onChange={() => handleSort(key)}
                          className="w-4 h-4 rounded border-gray-300"
                          style={{ accentColor: "#204B73" }}
                        />
                        <span style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: 400 }}>{label}</span>
                      </label>
                    ))}
                  {sortField && (
                    <button
                      onClick={() => {
                        setSortField("");
                        setSortDirection("asc");
                      }}
                      className="w-full text-left text-sm py-2 px-2 hover:bg-gray-50 rounded transition-colors"
                      style={{ color: "#204B73", fontFamily: "Poppins", fontSize: "13px", fontWeight: 500 }}
                    >
                      Clear Sort
                    </button>
                  )}
                </div>
              </div>

              {/* Sidebar Action Buttons */}
              <div className="flex flex-col">
                {/* Save This Query */}
                <div className="relative">
                  <button
                    onClick={() => setSaveQueryModalOpen(true)}
                    className="w-full text-left px-4 py-3 transition-all flex items-center gap-3 text-gray-700 hover:bg-gray-50"
                    style={{
                      width: "256px",
                      height: "73.86px",
                      display: "flex",
                      alignItems: "center",
                      borderTopWidth: "1.5px",
                      borderTopStyle: "solid",
                      borderTopColor: "rgb(224, 224, 224)",
                    }}
                  >
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <Image
                        src="/pngs/savethisqueryicon.png"
                        alt="Save Query"
                        width={18}
                        height={18}
                        className="object-contain"
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 400,
                        fontStyle: "normal",
                        fontSize: "14px",
                        lineHeight: "100%",
                        letterSpacing: "0%",
                        textTransform: "capitalize",
                      }}
                    >
                      Save This Query
                    </span>
                  </button>
                  <div
                    className="absolute"
                    style={{
                      width: "256px",
                      height: "0px",
                      top: "73.86px",
                      left: "0px",
                      borderWidth: "1px",
                      borderTopStyle: "solid",
                      borderTopColor: "rgb(224, 224, 224)",
                    }}
                  />
                </div>

                {/* Query History */}
                <div className="relative">
                  <button
                    onClick={() => setQueryHistoryModalOpen(true)}
                    className="w-full text-left px-4 py-3 transition-all flex items-center gap-3 text-gray-700 hover:bg-gray-50"
                    style={{
                      width: "256px",
                      height: "73.86px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <Image
                        src="/pngs/queryhistory.png"
                        alt="Query History"
                        width={18}
                        height={18}
                        className="object-contain"
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 400,
                        fontStyle: "normal",
                        fontSize: "14px",
                        lineHeight: "100%",
                        letterSpacing: "0%",
                        textTransform: "capitalize",
                      }}
                    >
                      Query History
                    </span>
                  </button>
                  <div
                    className="absolute"
                    style={{
                      width: "256px",
                      height: "0px",
                      top: "73.86px",
                      left: "0px",
                      borderWidth: "1px",
                      borderTopStyle: "solid",
                      borderTopColor: "rgb(224, 224, 224)",
                    }}
                  />
                </div>

                {/* Favorite Trials */}
                <div className="relative">
                  <button
                    onClick={() => setFavoriteTrialsModalOpen(true)}
                    className="w-full text-left px-4 py-3 transition-all flex items-center gap-3 text-gray-700 hover:bg-gray-50"
                    style={{
                      width: "256px",
                      height: "73.86px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <Image
                        src="/pngs/favoritetrialsicon.png"
                        alt="Favorite Trials"
                        width={18}
                        height={18}
                        className="object-contain"
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 400,
                        fontStyle: "normal",
                        fontSize: "14px",
                        lineHeight: "100%",
                        letterSpacing: "0%",
                        textTransform: "capitalize",
                      }}
                    >
                      Favorite Trials
                    </span>
                  </button>
                  <div
                    className="absolute"
                    style={{
                      width: "256px",
                      height: "0px",
                      top: "73.86px",
                      left: "0px",
                      borderWidth: "1px",
                      borderTopStyle: "solid",
                      borderTopColor: "rgb(224, 224, 224)",
                    }}
                  />
                </div>

                {/* Customize Column View */}
                <div className="relative">
                  <button
                    onClick={() => setCustomizeColumnModalOpen(true)}
                    className="w-full text-left px-4 py-3 transition-all flex items-center gap-3 text-gray-700 hover:bg-gray-50"
                    style={{
                      width: "256px",
                      height: "73.86px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <Image
                        src="/pngs/customizeicon.png"
                        alt="Customize"
                        width={18}
                        height={18}
                        className="object-contain"
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 400,
                        fontStyle: "normal",
                        fontSize: "14px",
                        lineHeight: "100%",
                        letterSpacing: "0%",
                        textTransform: "capitalize",
                      }}
                    >
                      Customize Column View
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 p-6">


              {/* View Type and Active Filters */}
              <div className="mb-1 flex items-center justify-between">

                {hasActiveFilters() && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(appliedFilters).map(([key, values]) =>
                        values.map((value: string) => (
                          <Badge
                            key={`${key}-${value}`}
                            variant="outline"
                            className="bg-blue-100 text-blue-700 text-xs"
                          >
                            {value}
                          </Badge>
                        ))
                      )}
                      {appliedSearchCriteria.map((criteria) => (
                        <Badge
                          key={criteria.id}
                          variant="outline"
                          className="bg-green-100 text-green-700 text-xs"
                        >
                          {criteria.field}: {criteria.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Bar - Above Trial Data */}
              <div
                className="flex items-center gap-8 py-3 mb-1"
                style={{ fontFamily: "Poppins", fontSize: "14px", backgroundColor: "transparent" }}
              >
                <span className="flex items-center gap-2">
                  <span style={{ color: "#204B73" }}>📊</span>
                  <span className="font-semibold" style={{ color: "#204B73" }}>{trials.length}</span>
                  <span style={{ color: "#204B73" }}>Total Trials</span>
                </span>
                <span className="flex items-center gap-2">
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FFB547", display: "inline-block" }} />
                  <span className="font-medium" style={{ color: "#333333" }}>45%</span>
                  <span style={{ color: "#333333" }}>Active Trials</span>
                </span>
                <span className="flex items-center gap-2">
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EF4444", display: "inline-block" }} />
                  <span className="font-medium" style={{ color: "#333333" }}>25%</span>
                  <span style={{ color: "#333333" }}>Terminated</span>
                </span>
                <span className="flex items-center gap-2">
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22C55E", display: "inline-block" }} />
                  <span className="font-medium" style={{ color: "#333333" }}>30%</span>
                  <span style={{ color: "#333333" }}>Completed</span>
                </span>
              </div>

              {/* Conditional Rendering: Table or Card View */}
              {viewType === 'list' ? (
                <Card className="border overflow-x-auto">
                  <div>
                    {/* Table */}
                    <table className="w-full caption-bottom text-sm" style={{ minWidth: '800px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', overflow: 'hidden' }}>
                      <thead style={{ backgroundColor: '#204B73', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                        <tr className="border-b">
                          {/* Checkbox Column */}
                          <th className="h-auto px-4 text-left align-middle font-medium text-white w-[50px] sticky top-0 z-10 ">
                            <input type="checkbox" className="rounded" />
                          </th>
                          {columnSettings.trialId && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[90px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Trial ID</span>
                                  {sortField === "trial_id" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("trial_id")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Filter <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.therapeuticArea && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Therapeutic Area</span>
                                  {sortField === "therapeutic_area" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("therapeutic_area")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Filter <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.diseaseType && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[90px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Disease Type</span>
                                  {sortField === "disease_type" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("disease_type")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Filter <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.primaryDrug && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[90px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Primary Drug</span>
                                  {sortField === "primary_drug" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("primary_drug")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Filter <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Trial Status - Always visible */}
                          <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                            <div className="flex flex-col py-2">
                              <div className="flex items-center gap-1 mb-1">
                                <span style={{ fontSize: "13px" }}>Trial Status</span>
                                {sortField === "trial_status" && (
                                  <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                )}
                              </div>
                              <button
                                onClick={() => handleSort("trial_status")}
                                className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                style={{ fontSize: "11px" }}
                              >
                                Filter <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                          </th>
                          {columnSettings.sponsorsCollaborators && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Sponsor</span>
                                  {sortField === "sponsor" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("sponsor")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Filter <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.trialPhase && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[80px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Phase</span>
                                  {sortField === "phase" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("phase")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Filter <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Like/Favorite Column */}
                          <th className="px-2 text-center align-middle font-medium text-white w-[40px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                            <div className="flex flex-col py-2 items-center">
                              <Heart className="h-4 w-4" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {paginatedTrials.map((trial) => (
                          <tr
                            key={trial.trial_id}
                            className="border-b transition-colors hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              // Navigate to trials page with trial data
                              router.push(`/user/clinical_trial/trials?trialId=${trial.trial_id}`);
                            }}
                          >
                            {/* Checkbox Column */}
                            <td className="p-4 align-middle w-[50px]">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedTrials.includes(trial.trial_id)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => toggleTrialSelection(trial.trial_id)}
                              />
                            </td>
                            {columnSettings.trialId && (
                              <td className="px-4 py-3 align-middle w-[100px]">
                                <span className="bg-gray-200/70 text-black font-bold px-2 py-1 rounded-lg text-xs inline-block">
                                  {trial.overview.trial_id || trial.trial_id.slice(0, 6)}
                                </span>
                              </td>
                            )}
                            {columnSettings.therapeuticArea && (
                              <td className="p-4 align-middle w-[90px] max-w-[90px]">
                                <div className="flex items-center" title={trial.overview.therapeutic_area}>
                                  {/* Red Icon */}
                                  <Image src="/pngs/redicon.png" alt="icon" width={16} height={16} className="mr-2 flex-shrink-0" />
                                  <span className="truncate">{trial.overview.therapeutic_area}</span>
                                </div>
                              </td>
                            )}
                            {columnSettings.diseaseType && (
                              <td className="p-4 align-middle w-[100px] max-w-[100px]">
                                <span className="truncate block" title={trial.overview.disease_type}>
                                  {trial.overview.disease_type}
                                </span>
                              </td>
                            )}
                            {columnSettings.primaryDrug && (
                              <td className="p-4 align-middle w-[120px] max-w-[120px]">
                                <span className="truncate block" title={trial.overview.primary_drugs}>
                                  {trial.overview.primary_drugs}
                                </span>
                              </td>
                            )}
                            {/* Trial Status - Always visible with color badges */}
                            <td className="p-4 align-middle w-[120px]">
                              <Badge className={`${getStatusColor(trial.overview.status)} px-3 py-1 rounded-lg`}>
                                {trial.overview.status}
                              </Badge>
                            </td>
                            {columnSettings.sponsorsCollaborators && (
                              <td className="p-4 align-middle w-[120px] max-w-[120px]">
                                <span className="truncate block" title={trial.overview.sponsor_collaborators || "N/A"}>
                                  {trial.overview.sponsor_collaborators || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.trialPhase && (
                              <td className="p-4 align-middle w-[80px]">{trial.overview.trial_phase}</td>
                            )}
                            <td className="p-4 align-middle">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click when clicking favorite button
                                  toggleFavoriteTrial(trial.trial_id);
                                }}
                                className="h-8 w-8 p-0 hover:bg-red-50"
                              >
                                <Heart
                                  className={`h-4 w-4 ${favoriteTrials.includes(trial.trial_id)
                                    ? 'fill-red-500 text-red-500'
                                    : 'text-gray-400 hover:text-red-500'
                                    }`}
                                />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls for List View */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mt-6 px-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Results Per Page</span>
                      <select
                        value={resultsPerPage}
                        onChange={(e) => handleResultsPerPageChange(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="12">12</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {startIndex + 1}-{endIndex} OF {filteredTrials.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                          &lt;
                        </button>
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                          &gt;
                        </button>
                      </div>
                      <button
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                        className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      >
                        First page
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                        className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        Last page
                      </button>
                    </div>

                    <Button
                      onClick={openSelectedTrials}
                      disabled={selectedTrials.length === 0}
                      className="px-6 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: "#204B73" }}
                    >
                      Open Selected Trials
                    </Button>
                  </div>
                </Card>
              ) : (
                <div>
                  {renderCardView()}

                  {/* Pagination Controls for Card View */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mt-6 px-4 py-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Results Per Page</span>
                      <select
                        value={resultsPerPage}
                        onChange={(e) => handleResultsPerPageChange(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="12">12</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {startIndex + 1}-{endIndex} OF {filteredTrials.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                          &lt;
                        </button>
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                          &gt;
                        </button>
                      </div>
                      <button
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                        className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      >
                        First page
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                        className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        Last page
                      </button>
                    </div>

                    <Button
                      onClick={openSelectedTrials}
                      disabled={selectedTrials.length === 0}
                      className="px-6 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: "#204B73" }}
                    >
                      Open Selected Trials
                    </Button>
                  </div>
                </div>
              )}

              {/* Filter Modal */}
              <ClinicalTrialFilterModal
                open={filterModalOpen}
                onOpenChange={setFilterModalOpen}
                onApplyFilters={handleApplyFilters}
                currentFilters={appliedFilters}
              />

              {/* Advanced Search Modal */}
              <ClinicalTrialAdvancedSearchModal
                open={advancedSearchModalOpen}
                onOpenChange={setAdvancedSearchModalOpen}
                onApplySearch={handleApplyAdvancedSearch}
                onOpenSavedQueries={() => setQueryHistoryModalOpen(true)}
              />

              {/* Save Query Modal */}
              <SaveQueryModal
                open={saveQueryModalOpen}
                onOpenChange={setSaveQueryModalOpen}
                onSaveSuccess={handleSaveQuerySuccess}
                currentFilters={appliedFilters}
                currentSearchCriteria={appliedSearchCriteria}
                searchTerm={searchTerm}
              />

              {/* Query History Modal */}
              <QueryHistoryModal
                open={queryHistoryModalOpen}
                onOpenChange={setQueryHistoryModalOpen}
                onLoadQuery={handleLoadQuery}
              />

              {/* Customize Column Modal */}
              <CustomizeColumnModal
                open={customizeColumnModalOpen}
                onOpenChange={setCustomizeColumnModalOpen}
                columnSettings={columnSettings}
                onColumnSettingsChange={handleColumnSettingsChange}
              />

              {/* Favorite Trials Modal */}
              <FavoriteTrialsModal
                open={favoriteTrialsModalOpen}
                onOpenChange={setFavoriteTrialsModalOpen}
                favoriteTrials={getFavoriteTrialsData()}
                onRemoveTrials={(trialIds) => {
                  // Remove selected trials from favorites
                  const newFavorites = favoriteTrials.filter(id => !trialIds.includes(id));
                  setFavoriteTrials(newFavorites);
                  localStorage.setItem('favoriteTrials', JSON.stringify(newFavorites));
                }}
              />

              {/* Global Search Modal */}
              <GlobalSearchModal
                open={searchModalOpen}
                onOpenChange={setSearchModalOpen}
                onSearch={setSearchTerm}
                currentSearchTerm={searchTerm}
              />

              {/* Export Trials Modal */}
              <ExportTrialsModal
                open={exportModalOpen}
                onOpenChange={setExportModalOpen}
                trials={filteredTrials.map(trial => ({
                  id: trial.trial_id,
                  trialId: trial.overview.trial_id || trial.trial_id.slice(0, 10),
                  therapeuticArea: trial.overview.therapeutic_area,
                  diseaseType: trial.overview.disease_type,
                  primaryDrug: trial.overview.primary_drugs,
                  status: trial.overview.status,
                  sponsor: trial.overview.sponsor_collaborators || "N/A",
                  phase: trial.overview.trial_phase
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

