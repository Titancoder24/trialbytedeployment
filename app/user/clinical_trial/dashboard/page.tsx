"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TherapeuticFilterState, TherapeuticSearchCriteria, DEFAULT_THERAPEUTIC_FILTERS } from "@/components/therapeutic-types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Bookmark as BookmarkIcon,
  RefreshCw,
  Loader2,
  Calendar,
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
import { formatDisplayValue } from "@/lib/format-utils";
import Image from "next/image";
import { ClinicalTrialFilterModal, ClinicalTrialFilterState } from "@/components/clinical-trial-filter-modal";
import { ClinicalTrialAdvancedSearchModal, ClinicalTrialSearchCriteria } from "@/components/clinical-trial-advanced-search-modal";
import { SaveQueryModal } from "@/components/save-query-modal";
import { QueryHistoryModal } from "@/components/query-history-modal";
import { CustomizeColumnModal, ColumnSettings, DEFAULT_COLUMN_SETTINGS, COLUMN_OPTIONS } from "@/components/customize-column-modal";
import { useDrugNames } from "@/hooks/use-drug-names";
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
    start_date_actual: string | null;
    trial_end_date_estimated: string | null;
    actual_enrollment_closed_date: string | null;
    actual_trial_completion_date: string | null;
    actual_published_date: string | null;
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
    internal_note: string | null;
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

// Default empty filter state
const DEFAULT_FILTER_STATE: ClinicalTrialFilterState = {
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
  healthyVolunteers: [],
  trialRecordStatus: [],
  trialOutcome: [],
  studyDesignKeywords: []
};

export default function ClinicalTrialDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [trials, setTrials] = useState<TherapeuticTrial[]>([]);
  const [totalTrialCount, setTotalTrialCount] = useState<number>(0);
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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarTop, setSidebarTop] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState<ClinicalTrialFilterState>(DEFAULT_FILTER_STATE);
  const [appliedSearchCriteria, setAppliedSearchCriteria] = useState<ClinicalTrialSearchCriteria[]>([]);
  const [viewType, setViewType] = useState<'list' | 'card'>('list');
  const [viewTypeExpanded, setViewTypeExpanded] = useState(true);
  const [sortByExpanded, setSortByExpanded] = useState(true);
  const [customizeColumnModalOpen, setCustomizeColumnModalOpen] = useState(false);
  const [columnSettings, setColumnSettings] = useState<ColumnSettings>(DEFAULT_COLUMN_SETTINGS);
  const [favoriteTrialsModalOpen, setFavoriteTrialsModalOpen] = useState(false);
  const [favoriteTrials, setFavoriteTrials] = useState<string[]>([]);
  // State for editing queries
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null);
  const [editingQueryTitle, setEditingQueryTitle] = useState<string>("");
  const [editingQueryDescription, setEditingQueryDescription] = useState<string>("");

  // Sorting state
  const [sortField, setSortField] = useState<string>("");

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Pagination state
  const [resultsPerPage, setResultsPerPage] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTrials, setSelectedTrials] = useState<string[]>([]);

  const { drugAliasesMap } = useDrugNames();
  const [referenceLinkFilter, setReferenceLinkFilter] = useState("");

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

  // Fetch trials data using the therapeutics API with caching
  const fetchTrials = async (isRefresh = false, showToast = false) => {
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

            const trials = filterLatestVersions(data.trials);
            setTrials(trials);
            setTotalTrialCount(trials.length);
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

      const allTrials = data.trials || [];
      const filteredTrials = filterLatestVersions(allTrials);
      setTrials(filteredTrials);
      setTotalTrialCount(filteredTrials.length);

      if (isRefresh && showToast) {
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

        const allTrials = data.trials || [];
        const filteredTrials = filterLatestVersions(allTrials);
        setTrials(filteredTrials);
        setTotalTrialCount(filteredTrials.length);
      }
    } catch (e) {
      // Silently fail background updates
    }
  };

  useEffect(() => {
    fetchTrials();
    // Load column settings from localStorage
    const savedColumnSettings = localStorage.getItem('clinicalTrialColumnSettings');
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

  // Scroll handler for sticky sidebar effect
  useEffect(() => {
    let rafId: number;
    const HEADER_OFFSET = 5; // Height of fixed header
    const SCROLL_THRESHOLD = 150; // Start moving after scrolling this much

    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        // Start adjusting sidebar position after scrolling past threshold
        if (scrollY > SCROLL_THRESHOLD) {
          setSidebarTop(scrollY - SCROLL_THRESHOLD + HEADER_OFFSET);
        } else {
          setSidebarTop(0);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
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
  const getFieldValue = (trial: TherapeuticTrial, field: string): any => {
    switch (field) {
      // Basic Info
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
        return ids;
      case "trial_identifier": return trial.overview.trial_identifier?.join(", ") || "";
      case "title": return trial.overview.title || "";
      case "disease_type": return trial.overview.disease_type || "";
      case "therapeutic_area": return trial.overview.therapeutic_area || "";
      case "trial_phase": return trial.overview.trial_phase || "";
      case "primary_drugs": return trial.overview.primary_drugs || "";
      case "secondary_drugs": return trial.overview.other_drugs || "";
      case "trial_status": return trial.overview.status || "";
      case "trial_record_status": return trial.overview.trial_record_status || "";
      case "sponsor_collaborators": return trial.overview.sponsor_collaborators || "";
      case "countries": return trial.overview.countries || "";
      case "regions": return trial.overview.region || "";
      case "patient_segment": return trial.overview.patient_segment || "";
      case "line_of_therapy": return trial.overview.line_of_therapy || "";
      case "reference_links": return trial.overview.reference_links?.join(" ") || "";

      // Study Design & Outcomes
      case "purpose_of_trial": return trial.outcomes[0]?.purpose_of_trial || "";
      case "summary": return trial.outcomes[0]?.summary || "";
      case "primary_outcome_measure": return trial.outcomes[0]?.primary_outcome_measure || "";
      case "other_outcome_measure": return trial.outcomes[0]?.other_outcome_measure || "";
      case "treatment_regimen": return trial.outcomes[0]?.treatment_regimen || "";
      case "study_design": return trial.outcomes[0]?.study_design || "";
      case "number_of_arms": return trial.outcomes[0]?.number_of_arms?.toString() || "";

      // Criteria
      case "inclusion_criteria": return trial.criteria[0]?.inclusion_criteria || "";
      case "exclusion_criteria": return trial.criteria[0]?.exclusion_criteria || "";
      case "age_from": return trial.criteria[0]?.age_from || "";
      case "age_to": return trial.criteria[0]?.age_to || "";
      case "sex": return trial.criteria[0]?.sex || "";
      case "subject_type": return trial.criteria[0]?.subject_type || "";
      case "actual_enrolled_volunteers": return trial.criteria[0]?.actual_enrolled_volunteers?.toString() || "";
      case "target_enrolled_volunteers": return trial.criteria[0]?.target_no_volunteers?.toString() || "";
      case "enrollment": return trial.criteria[0]?.target_no_volunteers?.toString() || "0"; // Alias

      // Sites & Results
      case "total_number_of_sites": return trial.sites[0]?.total?.toString() || "";
      case "results_available":
        {
          const val = trial.results?.[0]?.results_available;
          return (val === true || val === "Yes" || val === "yes") ? "Yes" : "No";
        }
      case "endpoints_met":
        {
          const val = trial.results?.[0]?.endpoints_met;
          return (val === true || val === "Yes" || val === "yes") ? "Yes" : "No";
        }

      // Notes
      case "internal_note": return trial.logs?.[0]?.internal_note || "";
      case "next_review_date": return trial.logs?.[0]?.next_review_date || "";

      // Dates
      case "actual_start_date": return trial.timing[0]?.start_date_actual || "";
      case "estimated_start_date": return trial.timing[0]?.start_date_estimated || "";
      case "actual_enrollment_closed_date": return trial.timing[0]?.enrollment_closed_actual || "";
      case "estimated_enrollment_closed_date": return trial.timing[0]?.enrollment_closed_estimated || "";
      case "actual_trial_end_date": return trial.timing[0]?.trial_end_date_actual || "";
      case "estimated_trial_end_date": return trial.timing[0]?.trial_end_date_estimated || "";
      case "actual_result_published_date": return trial.timing[0]?.result_published_date_actual || "";
      case "estimated_result_published_date": return trial.timing[0]?.result_published_date_estimated || "";

      default: return "";
    }
  };

  // Sorting functions
  const parseAge = (ageStr: string | null | undefined): number => {
    if (!ageStr) return -1;
    const match = ageStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : -1;
  };

  // Helper to parse date string to timestamp (for proper date sorting)
  const parseDateToTimestamp = (dateStr: string | undefined | null): number => {
    if (!dateStr) return 0;
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  };

  // Helper to format date for display (MM/DD/YYYY)
  const formatDateToMMDDYYYY = (dateString: string | undefined | null): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if parsing fails
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const getSortValue = (trial: TherapeuticTrial, field: string): string | number => {
    switch (field) {
      // Basic Info Section
      case "trial_id":
      case "trialId": return trial.overview.trial_id || trial.trial_id || "";
      case "therapeutic_area":
      case "therapeuticArea": return trial.overview.therapeutic_area || "";
      case "disease_type":
      case "diseaseType": return trial.overview.disease_type || "";
      case "primary_drug":
      case "primaryDrug": return trial.overview.primary_drugs || "";
      case "trial_status":
      case "status": return trial.overview.status || "";
      case "trial_record_status":
      case "trialRecordStatus": return trial.overview.trial_record_status || "";
      case "sponsor":
      case "sponsorsCollaborators": return trial.overview.sponsor_collaborators || "";
      case "phase":
      case "trialPhase": return trial.overview.trial_phase || "";
      case "title": return trial.overview.title || "";
      case "patientSegment":
      case "patient_segment": return trial.overview.patient_segment || "";
      case "lineOfTherapy":
      case "line_of_therapy": return trial.overview.line_of_therapy || "";
      case "countries": return trial.overview.countries || "";
      case "fieldOfActivity":
      case "field_of_activity": return trial.overview.sponsor_field_activity || "";
      case "associatedCro":
      case "associated_cro": return trial.overview.associated_cro || "";
      case "trialTags":
      case "trial_tags": return trial.overview.trial_tags || "";
      case "otherDrugs":
      case "other_drugs": return trial.overview.other_drugs || "";
      case "regions": return trial.overview.region || "";

      // Eligibility Section - numeric fields parsed properly
      case "inclusion_criteria":
      case "inclusionCriteria": return trial.criteria[0]?.inclusion_criteria || "";
      case "exclusion_criteria":
      case "exclusionCriteria": return trial.criteria[0]?.exclusion_criteria || "";
      case "age_from":
      case "ageFrom": return parseFloat(trial.criteria[0]?.age_from || "0") || 0;
      case "age_to":
      case "ageTo": return parseFloat(trial.criteria[0]?.age_to || "0") || 0;
      case "subject_type":
      case "subjectType": return trial.criteria[0]?.subject_type || "";
      case "sex": return trial.criteria[0]?.sex || "";
      case "healthy_volunteers":
      case "healthyVolunteers": {
        const val = trial.criteria[0]?.healthy_volunteers;
        if (val === true || val === "Yes" || val === "yes") return "Yes";
        if (val === false || val === "No" || val === "no") return "No";
        return val || "";
      }
      case "target_no_volunteers":
      case "targetNoVolunteers": return parseInt(String(trial.criteria[0]?.target_no_volunteers || "0")) || 0;
      case "actual_enrolled_volunteers":
      case "actualEnrolledVolunteers": return parseInt(String(trial.criteria[0]?.actual_enrolled_volunteers || "0")) || 0;

      // Study Design Section - number_of_arms is numeric
      case "purpose_of_trial":
      case "purposeOfTrial": return trial.outcomes[0]?.purpose_of_trial || "";
      case "summary": return trial.outcomes[0]?.summary || "";
      case "primary_outcome_measures":
      case "primaryOutcomeMeasures": return trial.outcomes[0]?.primary_outcome_measure || "";
      case "other_outcome_measures":
      case "otherOutcomeMeasures": return trial.outcomes[0]?.other_outcome_measure || "";
      case "study_design_keywords":
      case "studyDesignKeywords": return trial.outcomes[0]?.study_design_keywords || "";
      case "study_design":
      case "studyDesign": return trial.outcomes[0]?.study_design || "";
      case "treatment_regimen":
      case "treatmentRegimen": return trial.outcomes[0]?.treatment_regimen || "";
      case "number_of_arms":
      case "numberOfArms": return parseInt(String(trial.outcomes[0]?.number_of_arms || "0")) || 0;

      // Timing Section - Return timestamps for proper date sorting
      case "start_date_estimated":
      case "startDateEstimated": return parseDateToTimestamp(trial.timing[0]?.start_date_estimated);
      case "estimated_start_date": return parseDateToTimestamp(trial.timing[0]?.start_date_estimated);

      case "trial_end_date_estimated":
      case "trialEndDateEstimated": return parseDateToTimestamp(trial.timing[0]?.trial_end_date_estimated);
      case "estimated_trial_end_date": return parseDateToTimestamp(trial.timing[0]?.trial_end_date_estimated);

      case "actual_start_date": return parseDateToTimestamp(trial.timing?.[0]?.start_date_actual);
      case "actual_enrollment_closed_date": return parseDateToTimestamp(trial.timing?.[0]?.enrollment_closed_actual);
      case "estimated_enrollment_closed_date": return parseDateToTimestamp(trial.timing?.[0]?.enrollment_closed_estimated);
      case "estimatedEnrollmentClosedDate": return parseDateToTimestamp(trial.timing?.[0]?.enrollment_closed_estimated);

      case "actual_trial_completion_date": return parseDateToTimestamp(trial.timing?.[0]?.trial_end_date_actual);
      case "estimated_trial_completion_date": return parseDateToTimestamp(trial.timing?.[0]?.trial_completion_date_estimated);

      case "actual_published_date": return parseDateToTimestamp(trial.timing?.[0]?.result_published_date_actual);
      case "estimated_result_published_date": return parseDateToTimestamp(trial.timing?.[0]?.result_published_date_estimated);
      case "estimatedResultPublishedDate": return parseDateToTimestamp(trial.timing?.[0]?.result_published_date_estimated);

      // Results Section
      case "trial_outcome":
      case "trialOutcome": return trial.results[0]?.trial_outcome || "";
      case "adverse_events_reported":
      case "adverseEventsReported": return trial.results[0]?.adverse_event_reported || "";
      case "adverse_event_type":
      case "adverseEventType": return trial.results[0]?.adverse_event_type || "";
      case "treatment_for_adverse_events":
      case "treatmentForAdverseEvents": return trial.results[0]?.treatment_for_adverse_events || "";

      case "resultsAvailable":
      case "results_available": {
        const val = trial.results?.[0]?.results_available;
        if (val === true || val === "Yes" || val === "yes") return "Yes";
        if (val === false || val === "No" || val === "no") return "No";
        return "No"; // Default to No if not set
      }
      case "endpointsMet":
      case "endpoints_met": {
        const val = trial.results?.[0]?.endpoints_met;
        if (val === true || val === "Yes" || val === "yes") return "Yes";
        if (val === false || val === "No" || val === "no") return "No";
        return val || (trial.results?.[0]?.trial_outcome ? "Yes" : "No"); // Fallback
      }

      // Sites Section - total is numeric
      case "total_sites":
      case "totalSites": return parseInt(String(trial.sites[0]?.total || "0")) || 0;
      case "site_notes":
      case "siteNotes": return trial.sites[0]?.notes || "";

      // New/Other fields
      case "reference_links":
      case "referenceLinks":
        return Array.isArray(trial.overview.reference_links)
          ? trial.overview.reference_links.join(", ")
          : "";
      case "nextReviewDate": return 0; // Placeholder
      case "lastModifiedDate": return parseDateToTimestamp(trial.overview.updated_at);

      default: return "";
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        // Toggle to descending
        setSortDirection("desc");
      } else {
        // Toggle to none (reset)
        setSortField("");
        setSortDirection("asc");
      }
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Helper function to normalize strings for comparison (handles case and underscores)
  const normalizeForComparison = (value: any): string => {
    if (value === null || value === undefined) return '';
    // Ensure value is a string before string operations
    // JOIN WITH COMMA to preserve separation for split(',') operations later
    const strValue = Array.isArray(value) ? value.join(", ") : String(value);
    return strValue
      .toLowerCase()
      .replace(/_/g, " ")           // Replace underscores with spaces
      .replace(/[(),\/\-–—]/g, " ") // Replace parentheses, commas, slashes, dashes with spaces
      .replace(/\s+/g, " ")         // Normalize multiple spaces to single space
      .trim();
  };

  // Helper function to recursively search for term in object
  const searchInObject = (obj: any, term: string): boolean => {
    if (!obj) return false;
    const normalizedTerm = normalizeForComparison(term);

    // Check direct match if string
    if (typeof obj === 'string') {
      return normalizeForComparison(obj).includes(normalizedTerm);
    }

    // If array, check each element
    if (Array.isArray(obj)) {
      return obj.some(item => searchInObject(item, term));
    }

    // If object, check all values
    if (typeof obj === 'object') {
      return Object.values(obj).some(val => searchInObject(val, term));
    }

    // Convert numbers/booleans to string and check
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return normalizeForComparison(String(obj)).includes(normalizedTerm);
    }

    return false;
  };


  // Helper function to evaluate search criteria
  const evaluateCriteria = (fieldValue: string | null | undefined, operator: string, searchValue: string, fieldName?: string): boolean => {
    // Handle null/undefined field values
    if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
      // If searching for "is not", then Empty qualifies as "is not X".
      // But user requirement says: "searches for a specific value do not return trials where that field is blank"
      // This likely means Positive matches (Is, Contains) should fail on Blank.
      // Negative matches (Is Not) might be debatable, but usually "Is Not Open" implies "Is Closed/Planned", not "Is Nothing".
      // However, standard logic: "Empty" != "Value" -> True.
      // Let's stick to standard logic for Negative, but ensure Positive fails.
      return operator === "is_not" || operator === "not_equals" ? true : false;
    }

    const field = normalizeForComparison(fieldValue);
    const value = normalizeForComparison(searchValue || '');

    // Drug fields special handling - check aliases for better matching (same logic as filters)
    const drugFields = ["primary_drugs", "secondary_drugs"];
    if (fieldName && drugFields.includes(fieldName)) {
      // Handle N/A, empty, or null-like values for drug fields
      const normalizedField = field.trim().toLowerCase();
      if (!normalizedField || normalizedField === "" || normalizedField === "n/a" || normalizedField === "na") {
        // For "is_not", empty/N/A values should match (trial doesn't have the drug)
        // For "is" and "contains", empty/N/A values should NOT match
        if (operator === "is_not" || operator === "not_equals") {
          return true; // Empty/N/A is "not" any specific drug
        }
        return false; // Empty/N/A doesn't "contain" or "is" any specific drug
      }

      // Direct match check - check if search value is contained in the field
      const directMatch = field.includes(value);

      // Check aliases for the search value
      const searchAliases = drugAliasesMap[searchValue?.toLowerCase()] || [];
      const aliasMatch = searchAliases.some(alias =>
        field.includes(normalizeForComparison(alias))
      );

      // Also check if any drug in the field has the search value as an alias
      const fieldDrugs = field.split(',').map(d => d.trim());
      const reverseAliasMatch = fieldDrugs.some(drug => {
        const drugAliases = drugAliasesMap[drug] || [];
        return drugAliases.some(alias => normalizeForComparison(alias).includes(value));
      });

      // For drug fields, both "is" and "contains" should use the same matching logic
      // This matches filter behavior where selecting a drug returns all trials with that drug or its aliases
      switch (operator) {
        case "contains":
        case "is":
          return directMatch || aliasMatch || reverseAliasMatch;
        case "is_not":
          return !(directMatch || aliasMatch || reverseAliasMatch);
        default: break;
      }
    }

    // Date Logic - Prioritize raw numeric comparison if available
    if (fieldName?.includes("date")) {
      // If getFieldValue returned a generic string/number, enforce Date parsing
      const fieldDate = typeof fieldValue === 'number' ? fieldValue : new Date(fieldValue).getTime();
      const searchDate = new Date(searchValue).getTime();

      const isFieldValid = !isNaN(fieldDate);
      if (isNaN(searchDate)) return false;

      // Normalize to YYYY-MM-DD for date-only comparison
      const toDateString = (ts: number) => new Date(ts).toISOString().split('T')[0];
      const fieldDateStr = isFieldValid ? toDateString(fieldDate) : "";
      const searchDateStr = toDateString(searchDate);

      // For "is_not", if the field date is invalid (empty), it is NOT the search date, so return true.
      if (!isFieldValid) {
        return operator === "is_not";
      }

      switch (operator) {
        case "is": return fieldDateStr === searchDateStr;
        case "is_not": return fieldDateStr !== searchDateStr;
        case "greater_than": return fieldDate > searchDate;
        case "greater_than_equal": return fieldDate >= searchDate;
        case "less_than": return fieldDate < searchDate;
        case "less_than_equal": return fieldDate <= searchDate;
        default: return false;
      }
    }

    // Special categorical fields logic (Sex, Phase, Selection fields)
    const categoricalFields = ["sex", "trial_phase", "trial_status", "results_available", "endpoints_met", "countries", "regions"];
    if (fieldName && categoricalFields.includes(fieldName)) {
      // Tokenize comma-separated values
      const tokens = field.split(',').map(t => t.trim());

      // Define singleValueFields for exact matching on single-value fields
      const singleValueFields = ["sex", "results_available", "endpoints_met", "healthy_volunteers"];

      if (operator === "is") {
        // "Is" Operator: only return trials where *only* that exact value is present.
        // Exact match on the whole string (normalized) covers "Only that value".
        // E.g. "Male" === "Male". "Male, Female" !== "Male".
        return field === value;
      }

      if (operator === "contains") {
        // For single-value fields, use exact match
        if (singleValueFields.includes(fieldName)) {
          return field === value;
        }
        // "Contains" Operator: include trials where value is part of multi-value field.
        // BUT avoid substring matching (Male in Female).
        // Check if ANY token equals the search value exactly.
        return tokens.includes(value);
      }

      if (operator === "is_not") {
        // For single-value fields, use exact match negation
        if (singleValueFields.includes(fieldName)) {
          return field !== value;
        }
        // "Is Not" Operator: exclude trials where value is part of multi-value field.
        // Check that NONE of the tokens equal the search value exactly.
        return !tokens.includes(value);
      }
    }

    // Handle text fields (Summary, Purpose, etc) that might be point-wise or multi-line
    // Relaxed matching: Normalize whitespace and check for token presence or normalized exact match
    if (operator === 'is' && typeof fieldValue === 'string' && (fieldValue.includes('\n') || fieldValue.includes('•') || fieldValue.includes('- '))) {
      // 1. Normalize both field and search value (collapse whitespace)
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
      const normField = normalize(fieldValue);
      const normSearch = normalize(searchValue || "");

      // If normalized values match exactly, return true
      if (normField === normSearch) return true;

      // 2. Tokenize by newlines or bullet points and check if any chunk matches normalized search
      const chunks = fieldValue.split(/\n|•/).map(s => normalize(s)).filter(Boolean);
      if (chunks.includes(normSearch)) return true;
    }

    // Special handling for trial_id: "is" should behave like "contains"
    if (fieldName === "trial_id" && operator === "is") {
      return field.includes(value);
    }

    // Default string comparison
    switch (operator) {
      case "contains": return field.includes(value);
      case "is": return field === value;
      case "is_not": {
        // Improved is_not logic: if field contains the value, return false.
        return !field.includes(value);
      }
      case "starts_with": return field.startsWith(value);
      case "ends_with": return field.endsWith(value);
      case "greater_than":
        const numField1 = parseFloat(fieldValue);
        const numValue1 = parseFloat(searchValue);
        return !isNaN(numField1) && !isNaN(numValue1) && numField1 > numValue1;
      case "greater_than_equal":
        const numField2 = parseFloat(fieldValue);
        const numValue2 = parseFloat(searchValue);
        return !isNaN(numField2) && !isNaN(numValue2) && numField2 >= numValue2;
      case "less_than":
        const numField3 = parseFloat(fieldValue);
        const numValue3 = parseFloat(searchValue);
        return !isNaN(numField3) && !isNaN(numValue3) && numField3 < numValue3;
      case "less_than_equal":
        const numField4 = parseFloat(fieldValue);
        const numValue4 = parseFloat(searchValue);
        return !isNaN(numField4) && !isNaN(numValue4) && numField4 <= numValue4;
      case "equals":
        const numField5 = parseFloat(fieldValue);
        const numValue5 = parseFloat(searchValue);
        return !isNaN(numField5) && !isNaN(numValue5) && numField5 === numValue5;
      case "not_equals":
        const numField6 = parseFloat(fieldValue);
        const numValue6 = parseFloat(searchValue);
        return !isNaN(numField6) && !isNaN(numValue6) && numField6 !== numValue6;
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
      confirmed: "bg-orange-500 text-white hover:bg-orange-600",      // Orange = Attention, confirmed
      terminated: "bg-red-500 text-white hover:bg-red-600",        // Red = Stop, danger, terminated
      open: "bg-yellow-500 text-white hover:bg-yellow-600",            // Purple = Open, distinct from active
      closed: "bg-gray-600 text-white hover:bg-gray-700",           // Gray = Inactive, closed
      completed: "bg-emerald-500 text-white hover:bg-emerald-600",     // Emerald = Success, completed
      active: "bg-green-500 text-white hover:bg-green-600",          // Green = Active, ongoing
      planned: "bg-blue-500 text-white hover:bg-blue-600",          // Blue = Planned, upcoming
      suspended: "bg-amber-500 text-white hover:bg-amber-600",       // Amber = Warning, suspended
      draft: "bg-slate-400 text-white hover:bg-slate-500",           // Slate = Draft, pending
    };
    return statusColors[normalizedStatus] || "bg-gray-400 text-white";
  };

  // Apply filters and search criteria, then sort
  const filteredTrials = trials.filter((trial) => {
    // Basic search filter - use normalize for consistent matching
    const matchesSearch = searchTerm === "" || searchInObject(trial, searchTerm);

    // Apply filters - use normalize for consistent matching with underscores and case
    const matchesFilters = (
      (appliedFilters.therapeuticAreas.length === 0 ||
        appliedFilters.therapeuticAreas.some(area =>
          normalizeForComparison(trial.overview.therapeutic_area || '').includes(normalizeForComparison(area)))) &&
      (appliedFilters.statuses.length === 0 ||
        appliedFilters.statuses.some(status =>
          normalizeForComparison(trial.overview.status || '') === normalizeForComparison(status))) &&
      (appliedFilters.diseaseTypes.length === 0 ||
        appliedFilters.diseaseTypes.some(type =>
          normalizeForComparison(trial.overview.disease_type || '').includes(normalizeForComparison(type)))) &&
      (appliedFilters.primaryDrugs.length === 0 ||
        appliedFilters.primaryDrugs.some(drug => {
          const normalizedDrug = normalizeForComparison(drug);
          const trialPrimary = normalizeForComparison(trial.overview.primary_drugs || '');
          // Check match or aliases
          if (trialPrimary.includes(normalizedDrug)) return true;
          const aliases = drugAliasesMap[drug.toLowerCase()];
          if (aliases) {
            return aliases.some(alias => trialPrimary.includes(normalizeForComparison(alias)));
          }
          return false;
        })) &&
      (appliedFilters.otherDrugs.length === 0 ||
        appliedFilters.otherDrugs.some(drug => {
          const normalizedDrug = normalizeForComparison(drug);
          const trialOther = normalizeForComparison(trial.overview.other_drugs || '');
          // Check match or aliases
          if (trialOther.includes(normalizedDrug)) return true;
          const aliases = drugAliasesMap[drug.toLowerCase()];
          if (aliases) {
            return aliases.some(alias => trialOther.includes(normalizeForComparison(alias)));
          }
          return false;
        })) &&
      (appliedFilters.trialPhases.length === 0 ||
        appliedFilters.trialPhases.some(phase => {
          const trialPhase = normalizeForComparison(trial.overview.trial_phase || '');
          const filterPhase = normalizeForComparison(phase);
          // Use exact matching for trial phases to avoid "Phase I" matching "Phase I/II" or "Phase III"
          return trialPhase === filterPhase;
        })) &&
      (appliedFilters.patientSegments.length === 0 ||
        appliedFilters.patientSegments.some(segment =>
          normalizeForComparison(trial.overview.patient_segment || '').includes(normalizeForComparison(segment)))) &&
      (appliedFilters.lineOfTherapy.length === 0 ||
        appliedFilters.lineOfTherapy.some(lot =>
          normalizeForComparison(trial.overview.line_of_therapy || '').includes(normalizeForComparison(lot)))) &&
      (appliedFilters.countries.length === 0 ||
        appliedFilters.countries.some(country =>
          normalizeForComparison(trial.overview.countries || '').includes(normalizeForComparison(country)))) &&
      (appliedFilters.sponsorsCollaborators.length === 0 ||
        appliedFilters.sponsorsCollaborators.some(sponsor =>
          normalizeForComparison(trial.overview.sponsor_collaborators || '').includes(normalizeForComparison(sponsor)))) &&
      (appliedFilters.sponsorFieldActivity.length === 0 ||
        appliedFilters.sponsorFieldActivity.some(activity =>
          normalizeForComparison(trial.overview.sponsor_field_activity || '').includes(normalizeForComparison(activity)))) &&
      (appliedFilters.associatedCro.length === 0 ||
        appliedFilters.associatedCro.some(cro =>
          normalizeForComparison(trial.overview.associated_cro || '').includes(normalizeForComparison(cro)))) &&
      (appliedFilters.trialTags.length === 0 ||
        appliedFilters.trialTags.some(tag =>
          normalizeForComparison(trial.overview.trial_tags || '').includes(normalizeForComparison(tag)))) &&
      // Missing filters implementation
      (appliedFilters.trialRecordStatus.length === 0 ||
        appliedFilters.trialRecordStatus.some(status =>
          normalizeForComparison(trial.overview.trial_record_status || '').includes(normalizeForComparison(status)))) &&
      (appliedFilters.sex.length === 0 ||
        appliedFilters.sex.some(val =>
          normalizeForComparison(trial.criteria?.[0]?.sex || '').includes(normalizeForComparison(val)))) &&
      (appliedFilters.healthyVolunteers.length === 0 ||
        appliedFilters.healthyVolunteers.some(val =>
          normalizeForComparison(trial.criteria?.[0]?.healthy_volunteers || '').includes(normalizeForComparison(val)))) &&
      (appliedFilters.trialOutcome.length === 0 ||
        appliedFilters.trialOutcome.some(val =>
          normalizeForComparison(trial.results?.[0]?.trial_outcome || '').includes(normalizeForComparison(val)))) &&
      (appliedFilters.studyDesignKeywords.length === 0 ||
        appliedFilters.studyDesignKeywords.some(val =>
          normalizeForComparison(trial.outcomes?.[0]?.study_design_keywords || '').includes(normalizeForComparison(val)))) &&
      // Reference Link Header Filter
      (!referenceLinkFilter || (
        Array.isArray(trial.overview?.reference_links)
          ? trial.overview.reference_links.some(link => link.toLowerCase().includes(referenceLinkFilter.toLowerCase()))
          : (typeof trial.overview?.reference_links === 'string' && trial.overview.reference_links.toLowerCase().includes(referenceLinkFilter.toLowerCase()))
      ))
    );

    // Apply advanced search criteria
    const matchesAdvancedSearch = appliedSearchCriteria.length === 0 ||
      appliedSearchCriteria.every(criteria => {
        const fieldValue = getFieldValue(trial, criteria.field);
        const isMatch = evaluateCriteria(fieldValue, criteria.operator, criteria.value, criteria.field);

        // Debug Log only for active searches to reduce noise
        if (appliedSearchCriteria.length > 0) {
          console.log(`🔍 AdvSearch [${criteria.field}] Op:[${criteria.operator}]`, {
            trialId: trial.overview.trial_id || trial.trial_id,
            fieldRaw: fieldValue,
            searchVal: criteria.value,
            match: isMatch
          });
        }
        return isMatch;
      });

    return matchesSearch && matchesFilters && matchesAdvancedSearch;
  }).sort((a, b) => {
    if (!sortField) return 0; // No sorting if no field selected

    const aValue = getSortValue(a, sortField);
    const bValue = getSortValue(b, sortField);

    // Special handling for Yes/No fields
    const yesNoFields = ['results_available', 'endpoints_met', 'healthy_volunteers'];
    if (yesNoFields.includes(sortField) && typeof aValue === 'string' && typeof bValue === 'string') {
      const aLower = aValue.toLowerCase().trim();
      const bLower = bValue.toLowerCase().trim();

      const getYesNoOrder = (val: string): number => {
        if (val === 'yes') return 1;
        if (val === 'no') return 2;
        return 3; // Other/Empty
      };

      const aOrder = getYesNoOrder(aLower);
      const bOrder = getYesNoOrder(bLower);

      return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
    }

    // Handle string comparisons
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    // Handle numeric comparisons (including timestamps)
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

  // Handler for column settings changes from CustomizeColumnModal
  const handleColumnSettingsChange = (settings: ColumnSettings) => {
    setColumnSettings(settings);
    // Optionally save to localStorage for persistence
    localStorage.setItem('clinicalTrialColumnSettings', JSON.stringify(settings));
  };

  const handleApplyAdvancedSearch = (criteria: ClinicalTrialSearchCriteria[]) => {
    setAppliedSearchCriteria(criteria);
  };

  const clearAllFilters = () => {
    setAppliedFilters(DEFAULT_FILTER_STATE);
    setAppliedSearchCriteria([]);
    setSearchTerm("");
    setEditingQueryId(null);
    setEditingQueryTitle("");
    setEditingQueryDescription("");
  };

  const hasActiveFilters = () => {
    return Object.values(appliedFilters).some(filter => filter.length > 0);
  };

  const hasActiveAdvancedSearch = () => {
    return appliedSearchCriteria.length > 0;
  };

  const getActiveFilterCount = () => {
    return Object.values(appliedFilters).reduce((count, filter) => count + filter.length, 0);
  };

  const getActiveAdvancedSearchCount = () => {
    return appliedSearchCriteria.length;
  };

  // Function to format filter label for display
  const formatFilterLabel = (key: string): string => {
    const labelMap: Record<string, string> = {
      therapeuticAreas: "Therapeutic Area",
      diseaseTypes: "Disease Type",
      primaryDrugs: "Primary Drug",
      trialPhases: "Trial Phase",
      statuses: "Status",
      sponsorsCollaborators: "Sponsor",
      countries: "Countries",
      patientSegments: "Patient Segment",
      lineOfTherapy: "Line of Therapy",
      regions: "Regions",
      otherDrugs: "Other Drugs",
      fieldOfActivity: "Field of Activity",
      associatedCro: "Associated CRO",
      trialTags: "Trial Tags",
      sex: "Sex",
      healthyVolunteers: "Healthy Volunteers",
      subjectType: "Subject Type",
      trialRecordStatus: "Trial Record Status",
      trialOutcome: "Trial Outcome",
      studyDesignKeywords: "Study Design Keywords"
    };
    return labelMap[key] || key;
  };

  const handleSaveQuery = () => {
    // Reset editing state for NEW save from the dashboard sidebar
    setEditingQueryId(null);
    setEditingQueryTitle("");
    setEditingQueryDescription("");
    setSaveQueryModalOpen(true);
  };

  const handleSaveQuerySuccess = () => {
    toast({
      title: "Success",
      description: "Query saved successfully",
    });
    // Reset editing state after successful save
    setEditingQueryId(null);
    setEditingQueryTitle("");
    setEditingQueryDescription("");
  };

  const handleLoadQuery = (queryData: any) => {
    if (queryData.searchTerm) {
      setSearchTerm(queryData.searchTerm);
    }
    if (queryData.filters) {
      // Merge with default state to ensure all keys exist
      setAppliedFilters({ ...DEFAULT_FILTER_STATE, ...queryData.filters });
    }
    if (queryData.searchCriteria) {
      setAppliedSearchCriteria(queryData.searchCriteria);
    }
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

  const toggleSelectAll = () => {
    const currentIds = paginatedTrials.map(t => t.trial_id);
    const allSelected = currentIds.every(id => selectedTrials.includes(id));

    if (allSelected) {
      setSelectedTrials(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      const newSelected = [...new Set([...selectedTrials, ...currentIds])];
      setSelectedTrials(newSelected);
    }
  };

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
                    <span className="text-black text-sm font-bold">{t("common.trialId")} :</span>
                    <Badge className="bg-green-600 text-white hover:bg-green-700 px-3 py-1 text-xs font-medium rounded-lg">
                      {trial.overview.trial_id?.replace('TB-', '') || trial.trial_id.slice(0, 6)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">{t("common.therapeuticArea")} :</span>
                    <div className="flex items-center gap-1.5">
                      {/* Red Icon */}
                      <Image
                        src="/pngs/redicon.png"
                        alt="Therapeutic Area"
                        width={13}
                        height={13}
                      />
                      <span className="text-sm font-medium text-gray-900">{formatDisplayValue(trial.overview.therapeutic_area)}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Disease Type + Primary Drug + Trial Status + Sponsor + Phase */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">{t("common.diseaseType")} :</span>
                    <span className="text-sm font-medium text-gray-900">{formatDisplayValue(trial.overview.disease_type)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">{t("common.primaryDrug")} :</span>
                    <span className="text-sm font-medium text-gray-900">{trial.overview.primary_drugs || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">{t("common.trialStatus")} :</span>
                    <Badge className={`px-3 py-1 text-xs font-medium rounded-lg ${getStatusColorCard(trial.overview.status)}`}>
                      {trial.overview.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">{t("common.sponsor")} :</span>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                      {trial.overview.sponsor_collaborators || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-black text-sm font-bold">{t("common.phase")} :</span>
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
                  <BookmarkIcon
                    className={`h-4 w-4 ${favoriteTrials.includes(trial.trial_id)
                      ? 'fill-blue-500 text-blue-500'
                      : 'text-gray-400 hover:text-blue-500'
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

  // Map COLUMN_OPTIONS keys (camelCase) to Table Header keys (snake_case)
  // This ensures sorting set in Card View (Sidebar) reflects correctly in List View (Table Headers) and vice-versa
  const SORT_KEY_MAP: Record<string, string> = {
    trialId: "trial_id",
    therapeuticArea: "therapeutic_area",
    diseaseType: "disease_type",
    primaryDrug: "primary_drug",
    trialRecordStatus: "trial_record_status",
    sponsorsCollaborators: "sponsor",
    trialPhase: "phase",
    title: "title",
    patientSegment: "patient_segment",
    lineOfTherapy: "line_of_therapy",
    countries: "countries",
    fieldOfActivity: "field_of_activity",
    associatedCro: "associated_cro",
    trialTags: "trial_tags",
    otherDrugs: "other_drugs",
    regions: "regions",
    status: "trial_status",
    inclusionCriteria: "inclusion_criteria",
    exclusionCriteria: "exclusion_criteria",
    ageFrom: "age_from",
    ageTo: "age_to",
    subjectType: "subject_type",
    sex: "sex",
    healthyVolunteers: "healthy_volunteers",
    targetNoVolunteers: "target_no_volunteers",
    actualEnrolledVolunteers: "actual_enrolled_volunteers",
    purposeOfTrial: "purpose_of_trial",
    summary: "summary",
    primaryOutcomeMeasures: "primary_outcome_measures",
    otherOutcomeMeasures: "other_outcome_measures",
    studyDesignKeywords: "study_design_keywords",
    studyDesign: "study_design",
    treatmentRegimen: "treatment_regimen",
    numberOfArms: "number_of_arms",
    startDateEstimated: "start_date_estimated",
    trialEndDateEstimated: "trial_end_date_estimated",
    resultsAvailable: "results_available",
    endpointsMet: "endpoints_met",
    trialOutcome: "trial_outcome",
    totalSites: "total_sites",
    siteNotes: "site_notes",
    // Make sure we have fallbacks or mappings for new fields if logical
    estimatedEnrollmentClosedDate: "estimated_enrollment_closed_date",
    estimatedResultPublishedDate: "estimated_result_published_date",
    referenceLinks: "reference_links",
    nextReviewDate: "next_review_date",
    lastModifiedDate: "updated_at",
    // Fallback for self-mapping
    adverseEventsReported: "adverse_events_reported",
    adverseEventType: "adverse_event_type",
    treatmentForAdverseEvents: "treatment_for_adverse_events",
    adverseEventReported: "adverse_event_reported"
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Top Navigation - Matching Trials Page */}
      <div
        style={{
          width: "calc(100% - 64px)",
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

          {/* Trials Search Box - Active/Selected */}
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
              backgroundColor: "#204B73",
              boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Image
              src="/pngs/trialsearchicon.png"
              alt="Trials Search"
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
              {t("trials.trialsSearch")}
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
                {t("common.trials")}
              </span>
            </button>
          </Link>

          {/* Search Box */}
          <div
            className="flex items-center"
            style={{
              flex: "1",
              minWidth: "300px",
              maxWidth: "800px",
              height: "52px",
              borderRadius: "12px",
              gap: "8px",
              padding: "16px",
              backgroundColor: "#FFFFFF",
              marginLeft: "auto",
              boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Image
              src="/pngs/trialsearchicon.png"
              alt="Search"
              width={20}
              height={20}
              className="object-contain"
            />
            <input
              type="text"
              placeholder={t("common.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none bg-transparent"
              style={{
                fontFamily: "Poppins",
                fontWeight: 400,
                fontStyle: "normal",
                fontSize: "14px",
                lineHeight: "150%",
                letterSpacing: "-2%",
                color: "#000000",
              }}
            />
          </div>

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
                src="/pngs/profile.png"
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
                  {t("common.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Container for gradient and content overlay */}
      <div className="relative" style={{ width: "calc(100% - 64px)", margin: "0 auto" }}>
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
            {/* Left side - Header Text */}
            <div className="flex items-center space-x-4">
              {/* Navigation removed */}
            </div>

            {/* Right side - Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAdvancedSearchModalOpen(true)}
                className={`flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm ${hasActiveAdvancedSearch() ? "bg-green-100 text-green-700" : "bg-white text-black"}`}
                style={{
                  fontFamily: "Poppins",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: hasActiveAdvancedSearch() ? "#15803d" : "#000000",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                }}
              >
                <Search className="h-5 w-5" style={{ color: hasActiveAdvancedSearch() ? "#15803d" : "#000000" }} />
                {t("common.advancedSearch")}
                {hasActiveAdvancedSearch() && (
                  <Badge className="ml-1 bg-green-600 text-white text-xs px-1 py-0">
                    {getActiveAdvancedSearchCount()}
                  </Badge>
                )}
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
                {t("common.filter")}
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
                {t("common.savedQueries")}
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
                {t("common.export")}
              </button>
            </div>
          </div>



          <div className="flex items-start">
            {/* Sidebar - TrialsListing Style */}
            <div
              ref={sidebarRef}
              className="w-64 flex-shrink-0 rounded-[12px] bg-white z-40 dashboard-sidebar-scroll"
              style={{
                fontFamily: "Poppins, sans-serif",
                marginLeft: "20px",
                width: "256px",
                transform: `translateY(${sidebarTop}px)`,
                transition: "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
                maxHeight: "calc(100vh - 100px)",
                overflowY: "auto"
              }}
            >
              <style jsx>{`
                .dashboard-sidebar-scroll::-webkit-scrollbar {
                  width: 12px;
                }
                .dashboard-sidebar-scroll::-webkit-scrollbar-track {
                  background: #f1f1f1;
                  border-radius: 4px;
                  margin: 4px 0;
                }
                .dashboard-sidebar-scroll::-webkit-scrollbar-thumb {
                  background: #204B73;
                  border-radius: 4px;
                  border: 2px solid #f1f1f1;
                }
                .dashboard-sidebar-scroll::-webkit-scrollbar-thumb:hover {
                  background: #1a3d5c;
                }
              `}</style>
              {/* Search Button */}
              {/* Search Button Removed */}

              {/* View Type Section - Collapsible */}
              <div className="relative">
                <button
                  className="w-full flex items-center justify-between gap-2 py-3 px-4"
                  style={{
                    backgroundColor: "#204B73",
                    height: "74px",
                    borderRadius: "12px 12px 0 0",
                  }}
                  onClick={() => setViewTypeExpanded(!viewTypeExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src="/pngs/viewicon.png"
                      alt="View"
                      width={18}
                      height={18}
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                    <span className="text-white" style={{ fontFamily: "Poppins", fontSize: "16px", fontWeight: 500 }}>{t("common.viewType")}</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-white transition-transform ${viewTypeExpanded ? '' : '-rotate-90'}`} />
                </button>
                {viewTypeExpanded && (
                  <div className="py-3 px-4 space-y-2">
                    <label className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded hover:bg-gray-50" style={{ color: viewType === 'list' ? "#204B73" : "#374151" }}>
                      <input
                        type="checkbox"
                        checked={viewType === 'list'}
                        onChange={() => setViewType('list')}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: "#204B73" }}
                      />
                      <span style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: viewType === 'list' ? 500 : 400 }}>{t("common.listView")}</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded hover:bg-gray-50" style={{ color: "#9CA3AF" }}>
                      <input
                        type="checkbox"
                        checked={viewType === 'card'}
                        onChange={() => setViewType('card')}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: "#204B73" }}
                      />
                      <span style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: 400 }}>{t("common.cardView")}</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Sort By Section - Collapsible */}
              <div className="relative">
                <button
                  className="w-full flex items-center justify-between gap-2 py-3 px-4"
                  style={{
                    backgroundColor: "#204B73",
                    height: "74px",
                    borderRadius: "0",
                  }}
                  onClick={() => setSortByExpanded(!sortByExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src="/pngs/filtericon.png"
                      alt="Sort"
                      width={18}
                      height={18}
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                    <span className="text-white" style={{ fontFamily: "Poppins", fontSize: "16px", fontWeight: 500 }}>{t("common.sortBy")}</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-white transition-transform ${sortByExpanded ? '' : '-rotate-90'}`} />
                </button>
                {sortByExpanded && (
                  <div className="py-3 px-4 space-y-1">
                    {/* Display all columns enabled in settings */}
                    {COLUMN_OPTIONS
                      .filter(item => columnSettings[item.key])
                      .map(({ key, label }) => {
                        // Resolve canonical key (snake_case)
                        const canonicalKey = SORT_KEY_MAP[key] || key;
                        const isSelected = sortField === canonicalKey;

                        return (
                          <label
                            key={key}
                            className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded hover:bg-gray-50 w-full"
                            style={{ color: isSelected ? "#204B73" : "#374151" }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSort(canonicalKey)}
                              className="w-4 h-4 rounded border-gray-300"
                              style={{ accentColor: "#204B73" }}
                            />
                            <span style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: isSelected ? 500 : 400 }}>{label}</span>
                            {isSelected && (
                              <span className="ml-auto text-xs font-bold text-blue-600">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    {sortField && (
                      <button
                        onClick={() => {
                          setSortField("");
                          setSortDirection("asc");
                        }}
                        className="w-full text-left text-sm py-2 px-2 hover:bg-gray-50 rounded transition-colors"
                        style={{ color: "#204B73", fontFamily: "Poppins", fontSize: "13px", fontWeight: 500 }}
                      >
                        {t("common.clearSort")}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar Action Buttons */}
              <div className="flex flex-col">
                {/* Save This Query */}
                <div className="relative">
                  <button
                    onClick={handleSaveQuery}
                    onMouseEnter={() => setHoveredButton("save")}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="w-full text-left px-4 py-3 transition-all flex items-center gap-3"
                    style={{
                      width: "256px",
                      height: "73.86px",
                      display: "flex",
                      alignItems: "center",
                      borderTopWidth: "1.5px",
                      borderTopStyle: "solid",
                      borderTopColor: "rgb(224, 224, 224)",
                      backgroundColor: hoveredButton === "save" ? "#204B73" : "transparent",
                      color: hoveredButton === "save" ? "white" : "#374151"
                    }}
                  >
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <Image
                        src="/pngs/savethisqueryicon.png"
                        alt="Save Query"
                        width={18}
                        height={18}
                        className="object-contain"
                        style={{ filter: hoveredButton === "save" ? "brightness(0) invert(1)" : "none" }}
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
                      {t("common.saveThisQuery")}
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
                    onMouseEnter={() => setHoveredButton("history")}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="w-full text-left px-4 py-3 transition-all flex items-center gap-3"
                    style={{
                      width: "256px",
                      height: "73.86px",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: hoveredButton === "history" ? "#204B73" : "transparent",
                      color: hoveredButton === "history" ? "white" : "#374151"
                    }}
                  >
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <Image
                        src="/pngs/queryhistory.png"
                        alt="Query History"
                        width={18}
                        height={18}
                        className="object-contain"
                        style={{ filter: hoveredButton === "history" ? "brightness(0) invert(1)" : "none" }}
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
                    onMouseEnter={() => setHoveredButton("favorites")}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="w-full text-left px-4 py-3 transition-all flex items-center gap-3"
                    style={{
                      width: "256px",
                      height: "73.86px",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: hoveredButton === "favorites" ? "#204B73" : "transparent",
                      color: hoveredButton === "favorites" ? "white" : "#374151"
                    }}
                  >
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <Image
                        src="/pngs/favoritetrialsicon.png"
                        alt="Favorite Trials"
                        width={18}
                        height={18}
                        className="object-contain"
                        style={{ filter: hoveredButton === "favorites" ? "brightness(0) invert(1)" : "none" }}
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
                    onMouseEnter={() => setHoveredButton("columns")}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="w-full text-left px-4 py-3 transition-all flex items-center gap-3"
                    style={{
                      width: "256px",
                      height: "73.86px",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: hoveredButton === "columns" ? "#204B73" : "transparent",
                      color: hoveredButton === "columns" ? "white" : "#374151"
                    }}
                  >
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <Image
                        src="/pngs/customizeicon.png"
                        alt="Customize"
                        width={18}
                        height={18}
                        className="object-contain"
                        style={{ filter: hoveredButton === "columns" ? "brightness(0) invert(1)" : "none" }}
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

                {(hasActiveFilters() || hasActiveAdvancedSearch()) && (
                  <div className="flex items-center space-x-3">
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
                    <button
                      onClick={clearAllFilters}
                      className="ml-2 px-3 py-1 rounded text-white text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: "#0070d8ff",
                        fontFamily: "Poppins",
                        height: "24px"
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Bar - Above Trial Data */}
              {(() => {
                // Use totalTrialCount from API for accurate total, but calculate percentages from loaded trials
                const displayTotal = totalTrialCount || trials.length;
                const loadedTrials = trials.length;

                // Count trials by status (case-insensitive matching) from loaded data
                const plannedCount = trials.filter(t =>
                  t.overview.status?.toLowerCase() === 'planned'
                ).length;
                const openCount = trials.filter(t =>
                  t.overview.status?.toLowerCase() === 'open' ||
                  t.overview.status?.toLowerCase() === 'recruiting' ||
                  t.overview.status?.toLowerCase() === 'active'
                ).length;
                const closedCount = trials.filter(t =>
                  t.overview.status?.toLowerCase() === 'closed'
                ).length;
                const terminatedCount = trials.filter(t =>
                  t.overview.status?.toLowerCase() === 'terminated' ||
                  t.overview.status?.toLowerCase() === 'withdrawn' ||
                  t.overview.status?.toLowerCase() === 'suspended'
                ).length;
                const completedCount = trials.filter(t =>
                  t.overview.status?.toLowerCase() === 'completed'
                ).length;

                // Calculate percentages using the formula (based on loaded trials for accuracy)
                const activePercentage = loadedTrials > 0
                  ? Math.round((plannedCount + openCount + closedCount) / loadedTrials * 100)
                  : 0;
                const terminatedPercentage = loadedTrials > 0
                  ? Math.round(terminatedCount / loadedTrials * 100)
                  : 0;
                const completedPercentage = loadedTrials > 0
                  ? Math.round(completedCount / loadedTrials * 100)
                  : 0;

                return (
                  <div
                    className="flex items-center gap-8 py-3 mb-1"
                    style={{ fontFamily: "Poppins", fontSize: "14px", backgroundColor: "transparent" }}
                  >
                    <span className="flex items-center gap-2">
                      <span style={{ color: "#204B73" }}>📊</span>
                      <span className="font-semibold" style={{ color: "#204B73" }}>{displayTotal}</span>
                      <span style={{ color: "#204B73" }}>Total Trials</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FFB547", display: "inline-block" }} />
                      <span className="font-medium" style={{ color: "#333333" }}>{activePercentage}%</span>
                      <span style={{ color: "#333333" }}>Active Trials</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EF4444", display: "inline-block" }} />
                      <span className="font-medium" style={{ color: "#333333" }}>{terminatedPercentage}%</span>
                      <span style={{ color: "#333333" }}>Terminated</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22C55E", display: "inline-block" }} />
                      <span className="font-medium" style={{ color: "#333333" }}>{completedPercentage}%</span>
                      <span style={{ color: "#333333" }}>Completed</span>
                    </span>
                  </div>
                );
              })()}

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
                            <input
                              type="checkbox"
                              className="rounded cursor-pointer"
                              checked={paginatedTrials.length > 0 && paginatedTrials.every(t => selectedTrials.includes(t.trial_id))}
                              onChange={toggleSelectAll}
                            />
                          </th>
                          {columnSettings.trialId && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[90px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>{t("common.trialId")}</span>
                                  {sortField === "trial_id" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("trial_id")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.therapeuticArea && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>{t("common.therapeuticArea")}</span>
                                  {sortField === "therapeutic_area" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("therapeutic_area")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.diseaseType && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[90px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>{t("common.diseaseType")}</span>
                                  {sortField === "disease_type" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("disease_type")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.primaryDrug && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[90px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>{t("common.primaryDrug")}</span>
                                  {sortField === "primary_drug" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("primary_drug")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Trial Status - Always visible */}
                          {columnSettings.status && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Status</span>
                                  {sortField === "trial_status" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("trial_status")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Trial Record Status Column - Added */}
                          {columnSettings.trialRecordStatus && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[140px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Trial Record Status</span>
                                  {sortField === "trial_record_status" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("trial_record_status")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.sponsorsCollaborators && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>{t("common.sponsor")}</span>
                                  {sortField === "sponsor" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("sponsor")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.trialPhase && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[80px] sticky top-0 z-10 " style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>{t("common.phase")}</span>
                                  {sortField === "phase" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("phase")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Title Column */}
                          {columnSettings.title && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[180px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Title</span>
                                  {sortField === "title" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("title")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Patient Segment Column */}
                          {columnSettings.patientSegment && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[100px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Patient Segment</span>
                                  {sortField === "patient_segment" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("patient_segment")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Line of Therapy Column */}
                          {columnSettings.lineOfTherapy && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[100px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Line of Therapy</span>
                                  {sortField === "line_of_therapy" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("line_of_therapy")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Countries Column */}
                          {columnSettings.countries && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Countries</span>
                                  {sortField === "countries" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("countries")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Other Drugs Column */}
                          {columnSettings.otherDrugs && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[100px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Other Drugs</span>
                                  {sortField === "other_drugs" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("other_drugs")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Regions Column */}
                          {columnSettings.regions && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[100px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Regions</span>
                                  {sortField === "regions" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("regions")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Field of Activity Column */}
                          {columnSettings.fieldOfActivity && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Field of Activity</span>
                                  {sortField === "field_of_activity" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("field_of_activity")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Associated CRO Column */}
                          {columnSettings.associatedCro && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[100px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Associated CRO</span>
                                  {sortField === "associated_cro" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("associated_cro")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Trial Tags Column */}
                          {columnSettings.trialTags && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[100px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Trial Tags</span>
                                  {sortField === "trial_tags" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("trial_tags")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Eligibility Section Columns */}
                          {columnSettings.inclusionCriteria && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[150px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Inclusion Criteria</span>
                                  {sortField === "inclusion_criteria" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("inclusion_criteria")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.exclusionCriteria && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[150px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Exclusion Criteria</span>
                                  {sortField === "exclusion_criteria" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("exclusion_criteria")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.ageFrom && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[80px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Age From</span>
                                  {sortField === "age_from" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("age_from")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.ageTo && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[80px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Age To</span>
                                  {sortField === "age_to" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("age_to")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.subjectType && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[100px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Subject Type</span>
                                  {sortField === "subject_type" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("subject_type")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.sex && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[80px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Sex</span>
                                  {sortField === "sex" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("sex")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.healthyVolunteers && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Healthy Volunteers</span>
                                  {sortField === "healthy_volunteers" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("healthy_volunteers")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.targetNoVolunteers && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Target Volunteers</span>
                                  {sortField === "target_no_volunteers" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("target_no_volunteers")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.actualEnrolledVolunteers && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Enrolled Volunteers</span>
                                  {sortField === "actual_enrolled_volunteers" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("actual_enrolled_volunteers")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Study Design Section Columns */}
                          {columnSettings.purposeOfTrial && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[150px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Purpose of Trial</span>
                                  {sortField === "purpose_of_trial" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("purpose_of_trial")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.summary && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[180px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Summary</span>
                                  {sortField === "summary" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("summary")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.primaryOutcomeMeasures && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[150px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Primary Outcome</span>
                                  {sortField === "primary_outcome_measures" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("primary_outcome_measures")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.otherOutcomeMeasures && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[150px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Other Outcome</span>
                                  {sortField === "other_outcome_measures" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("other_outcome_measures")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.studyDesignKeywords && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[130px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Design Keywords</span>
                                  {sortField === "study_design_keywords" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("study_design_keywords")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.studyDesign && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[130px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Study Design</span>
                                  {sortField === "study_design" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("study_design")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.treatmentRegimen && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[130px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Treatment Regimen</span>
                                  {sortField === "treatment_regimen" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("treatment_regimen")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.numberOfArms && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[100px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>No. of Arms</span>
                                  {sortField === "number_of_arms" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("number_of_arms")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Timing Section Columns */}
                          {columnSettings.actualStartDate && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Actual Start</span>
                                  {sortField === "start_date_actual" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("start_date_actual")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.startDateEstimated && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Start Date</span>
                                  {sortField === "start_date_estimated" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("start_date_estimated")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.trialEndDateEstimated && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>End Date</span>
                                  {sortField === "trial_end_date_estimated" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("trial_end_date_estimated")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.actualEnrollmentClosedDate && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[130px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Actual Enr. Close</span>
                                  {sortField === "actual_enrollment_closed_date" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("actual_enrollment_closed_date")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.actualTrialCompletionDate && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[130px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Actual Completion</span>
                                  {sortField === "actual_trial_completion_date" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("actual_trial_completion_date")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.actualPublishedDate && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Published Date</span>
                                  {sortField === "actual_published_date" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("actual_published_date")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Results Section Columns */}
                          {columnSettings.resultsAvailable && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[100px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Results Available</span>
                                  {sortField === "results_available" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("results_available")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.endpointsMet && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[100px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Endpoints Met</span>
                                  {sortField === "endpoints_met" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("endpoints_met")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.adverseEventsReported && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Adverse Events</span>
                                  {sortField === "adverse_events_reported" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("adverse_events_reported")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.trialOutcome && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Trial Outcome</span>
                                  {sortField === "trial_outcome" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("trial_outcome")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.trialOutcomeContent && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[150px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Outcome Content</span>
                                  {sortField === "trial_outcome_content" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("trial_outcome_content")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.adverseEventReported && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>AE Reported</span>
                                  {sortField === "adverse_event_reported" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("adverse_event_reported")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.adverseEventType && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[120px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>AE Type</span>
                                  {sortField === "adverse_event_type" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("adverse_event_type")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.treatmentForAdverseEvents && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[130px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>AE Treatment</span>
                                  {sortField === "treatment_for_adverse_events" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("treatment_for_adverse_events")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Sites Section Columns */}
                          {columnSettings.totalSites && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[80px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Total Sites</span>
                                  {sortField === "total_sites" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("total_sites")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {columnSettings.siteNotes && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[150px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Site Notes</span>
                                  {sortField === "site_notes" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("site_notes")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Reference Links */}
                          {columnSettings.referenceLinks && (
                            <th className="px-4 text-left align-middle font-medium text-white w-[150px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                              <div className="flex flex-col py-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <span style={{ fontSize: "13px" }}>Reference Links</span>
                                  {sortField === "reference_links" && (
                                    <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSort("reference_links")}
                                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                                  style={{ fontSize: "11px" }}
                                >
                                  Sort <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                          )}
                          {/* Like/Favorite Column */}
                          <th className="px-2 text-center align-middle font-medium text-white w-[40px] sticky top-0 z-10" style={{ fontFamily: "Poppins" }}>
                            <div className="flex flex-col py-2 items-center">
                              <BookmarkIcon className="h-4 w-4" />
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
                                  <span className="truncate">{formatDisplayValue(trial.overview.therapeutic_area)}</span>
                                </div>
                              </td>
                            )}
                            {columnSettings.diseaseType && (
                              <td className="p-4 align-middle w-[100px] max-w-[100px]">
                                <span className="truncate block" title={trial.overview.disease_type}>
                                  {formatDisplayValue(trial.overview.disease_type)}
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
                            {columnSettings.status && (
                              <td className="p-4 align-middle w-[120px]">
                                <Badge className={`${getStatusColor(trial.overview.status)} px-3 py-1 rounded-lg`}>
                                  {trial.overview.status}
                                </Badge>
                              </td>
                            )}
                            {/* Trial Record Status - Added */}
                            {columnSettings.trialRecordStatus && (
                              <td className="p-4 align-middle w-[140px] max-w-[140px]">
                                <span className="truncate block" title={trial.overview.trial_record_status}>
                                  {trial.overview.trial_record_status || "N/A"}
                                </span>
                              </td>
                            )}
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
                            {/* Title */}
                            {columnSettings.title && (
                              <td className="p-4 align-middle w-[180px] max-w-[180px]">
                                <span className="truncate block" title={trial.overview.title}>
                                  {trial.overview.title || "N/A"}
                                </span>
                              </td>
                            )}

                            {/* Patient Segment */}
                            {columnSettings.patientSegment && (
                              <td className="p-4 align-middle w-[100px] max-w-[100px]">
                                <span className="truncate block" title={trial.overview.patient_segment}>
                                  {formatDisplayValue(trial.overview.patient_segment) || "N/A"}
                                </span>
                              </td>
                            )}
                            {/* Line of Therapy */}
                            {columnSettings.lineOfTherapy && (
                              <td className="p-4 align-middle w-[100px] max-w-[100px]">
                                <span className="truncate block" title={trial.overview.line_of_therapy}>
                                  {formatDisplayValue(trial.overview.line_of_therapy) || "N/A"}
                                </span>
                              </td>
                            )}
                            {/* Countries */}
                            {columnSettings.countries && (
                              <td className="p-4 align-middle w-[120px] max-w-[120px]">
                                <span className="truncate block" title={trial.overview.countries}>
                                  {trial.overview.countries || "N/A"}
                                </span>
                              </td>
                            )}
                            {/* Other Drugs */}
                            {columnSettings.otherDrugs && (
                              <td className="p-4 align-middle w-[100px] max-w-[100px]">
                                <span className="truncate block" title={trial.overview.other_drugs}>
                                  {trial.overview.other_drugs || "N/A"}
                                </span>
                              </td>
                            )}
                            {/* Regions */}
                            {columnSettings.regions && (
                              <td className="p-4 align-middle w-[100px] max-w-[100px]">
                                <span className="truncate block" title={trial.overview.region}>
                                  {trial.overview.region || "N/A"}
                                </span>
                              </td>
                            )}
                            {/* Field of Activity */}
                            {columnSettings.fieldOfActivity && (
                              <td className="p-4 align-middle w-[120px] max-w-[120px]">
                                <span className="truncate block" title={trial.overview.sponsor_field_activity}>
                                  {trial.overview.sponsor_field_activity || "N/A"}
                                </span>
                              </td>
                            )}
                            {/* Associated CRO */}
                            {columnSettings.associatedCro && (
                              <td className="p-4 align-middle w-[100px] max-w-[100px]">
                                <span className="truncate block" title={trial.overview.associated_cro}>
                                  {trial.overview.associated_cro || "N/A"}
                                </span>
                              </td>
                            )}
                            {/* Trial Tags */}
                            {columnSettings.trialTags && (
                              <td className="p-4 align-middle w-[100px] max-w-[100px]">
                                <span className="truncate block" title={trial.overview.trial_tags}>
                                  {trial.overview.trial_tags || "N/A"}
                                </span>
                              </td>
                            )}
                            {/* Eligibility Section Cells */}
                            {columnSettings.inclusionCriteria && (
                              <td className="p-4 align-middle w-[150px] max-w-[150px]">
                                <span className="truncate block" title={trial.criteria?.[0]?.inclusion_criteria}>
                                  {trial.criteria?.[0]?.inclusion_criteria || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.exclusionCriteria && (
                              <td className="p-4 align-middle w-[150px] max-w-[150px]">
                                <span className="truncate block" title={trial.criteria?.[0]?.exclusion_criteria}>
                                  {trial.criteria?.[0]?.exclusion_criteria || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.ageFrom && (
                              <td className="p-4 align-middle w-[80px]">
                                <span>{trial.criteria?.[0]?.age_from?.replace(/,/g, ' ') || "N/A"}</span>
                              </td>
                            )}
                            {columnSettings.ageTo && (
                              <td className="p-4 align-middle w-[80px]">
                                <span>{trial.criteria?.[0]?.age_to?.replace(/,/g, ' ') || "N/A"}</span>
                              </td>
                            )}
                            {columnSettings.subjectType && (
                              <td className="p-4 align-middle w-[100px] max-w-[100px]">
                                <span className="truncate block" title={trial.criteria?.[0]?.subject_type}>
                                  {trial.criteria?.[0]?.subject_type || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.sex && (
                              <td className="p-4 align-middle w-[80px]">
                                <span>{trial.criteria?.[0]?.sex || "N/A"}</span>
                              </td>
                            )}
                            {columnSettings.healthyVolunteers && (
                              <td className="p-4 align-middle w-[120px]">
                                <span>{trial.criteria?.[0]?.healthy_volunteers || "N/A"}</span>
                              </td>
                            )}
                            {columnSettings.targetNoVolunteers && (
                              <td className="p-4 align-middle w-[120px]">
                                <span>{trial.criteria?.[0]?.target_no_volunteers ?? "N/A"}</span>
                              </td>
                            )}
                            {columnSettings.actualEnrolledVolunteers && (
                              <td className="p-4 align-middle w-[120px]">
                                <span>{trial.criteria?.[0]?.actual_enrolled_volunteers ?? "N/A"}</span>
                              </td>
                            )}

                            {/* Study Design Section Cells */}
                            {columnSettings.purposeOfTrial && (
                              <td className="p-4 align-middle w-[150px] max-w-[150px]">
                                <span className="truncate block" title={trial.outcomes?.[0]?.purpose_of_trial}>
                                  {trial.outcomes?.[0]?.purpose_of_trial || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.summary && (
                              <td className="p-4 align-middle w-[180px] max-w-[180px]">
                                <span className="truncate block" title={trial.outcomes?.[0]?.summary}>
                                  {trial.outcomes?.[0]?.summary || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.primaryOutcomeMeasures && (
                              <td className="p-4 align-middle w-[150px] max-w-[150px]">
                                <span className="truncate block" title={trial.outcomes?.[0]?.primary_outcome_measure}>
                                  {trial.outcomes?.[0]?.primary_outcome_measure || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.otherOutcomeMeasures && (
                              <td className="p-4 align-middle w-[150px] max-w-[150px]">
                                <span className="truncate block" title={trial.outcomes?.[0]?.other_outcome_measure}>
                                  {trial.outcomes?.[0]?.other_outcome_measure || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.studyDesignKeywords && (
                              <td className="p-4 align-middle w-[130px] max-w-[130px]">
                                <span className="truncate block" title={trial.outcomes?.[0]?.study_design_keywords}>
                                  {trial.outcomes?.[0]?.study_design_keywords || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.studyDesign && (
                              <td className="p-4 align-middle w-[130px] max-w-[130px]">
                                <span className="truncate block" title={trial.outcomes?.[0]?.study_design}>
                                  {trial.outcomes?.[0]?.study_design || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.treatmentRegimen && (
                              <td className="p-4 align-middle w-[130px] max-w-[130px]">
                                <span className="truncate block" title={trial.outcomes?.[0]?.treatment_regimen}>
                                  {trial.outcomes?.[0]?.treatment_regimen || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.numberOfArms && (
                              <td className="p-4 align-middle w-[100px]">
                                <span>{trial.outcomes?.[0]?.number_of_arms ?? "N/A"}</span>
                              </td>
                            )}
                            {/* Timing Section Cells */}
                            {columnSettings.actualStartDate && (
                              <td className="p-4 align-middle w-[120px]">
                                <span>{formatDateToMMDDYYYY(trial.timing?.[0]?.start_date_actual)}</span>
                              </td>
                            )}
                            {columnSettings.startDateEstimated && (
                              <td className="p-4 align-middle w-[120px]">
                                <span>{formatDateToMMDDYYYY(trial.timing?.[0]?.start_date_estimated)}</span>
                              </td>
                            )}
                            {columnSettings.trialEndDateEstimated && (
                              <td className="p-4 align-middle w-[120px]">
                                <span>{formatDateToMMDDYYYY(trial.timing?.[0]?.trial_end_date_estimated)}</span>
                              </td>
                            )}
                            {columnSettings.actualEnrollmentClosedDate && (
                              <td className="p-4 align-middle w-[120px]">
                                <span>{formatDateToMMDDYYYY(trial.timing?.[0]?.enrollment_closed_actual)}</span>
                              </td>
                            )}
                            {columnSettings.actualTrialCompletionDate && (
                              <td className="p-4 align-middle w-[120px]">
                                <span>{formatDateToMMDDYYYY(trial.timing?.[0]?.trial_end_date_actual)}</span>
                              </td>
                            )}
                            {columnSettings.actualPublishedDate && (
                              <td className="p-4 align-middle w-[120px]">
                                <span>{formatDateToMMDDYYYY(trial.timing?.[0]?.result_published_date_actual)}</span>
                              </td>
                            )}
                            {/* Results Section Cells */}
                            {columnSettings.resultsAvailable && (
                              <td className="p-4 align-middle w-[100px]">
                                <span>{trial.results?.[0]?.results_available === true || trial.results?.[0]?.results_available === "Yes" || trial.results?.[0]?.results_available === "yes" ? "Yes" : "No"}</span>
                              </td>
                            )}
                            {columnSettings.endpointsMet && (
                              <td className="p-4 align-middle w-[100px]">
                                <span>{trial.results?.[0]?.endpoints_met === true || trial.results?.[0]?.endpoints_met === "Yes" || trial.results?.[0]?.endpoints_met === "yes" ? "Yes" : "No"}</span>
                              </td>
                            )}
                            {columnSettings.adverseEventsReported && (
                              <td className="p-4 align-middle w-[120px]">
                                <span>{trial.results?.[0]?.adverse_event_reported || "N/A"}</span>
                              </td>
                            )}
                            {columnSettings.trialOutcome && (
                              <td className="p-4 align-middle w-[120px] max-w-[120px]">
                                <span className="truncate block" title={trial.results?.[0]?.trial_outcome}>
                                  {trial.results?.[0]?.trial_outcome || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.trialOutcomeContent && (
                              <td className="p-4 align-middle w-[150px] max-w-[150px]">
                                <span className="truncate block" title={trial.results?.[0]?.trial_results?.join(", ")}>
                                  {trial.results?.[0]?.trial_results?.join(", ") || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.adverseEventReported && (
                              <td className="p-4 align-middle w-[120px]">
                                <span>{trial.results?.[0]?.adverse_event_reported || "N/A"}</span>
                              </td>
                            )}
                            {columnSettings.adverseEventType && (
                              <td className="p-4 align-middle w-[120px] max-w-[120px]">
                                <span className="truncate block" title={trial.results?.[0]?.adverse_event_type || undefined}>
                                  {trial.results?.[0]?.adverse_event_type || "N/A"}
                                </span>
                              </td>
                            )}
                            {columnSettings.treatmentForAdverseEvents && (
                              <td className="p-4 align-middle w-[130px] max-w-[130px]">
                                <span className="truncate block" title={trial.results?.[0]?.treatment_for_adverse_events || undefined}>
                                  {trial.results?.[0]?.treatment_for_adverse_events || "N/A"}
                                </span>
                              </td>
                            )}
                            {/* Sites Section Cells */}
                            {columnSettings.totalSites && (
                              <td className="p-4 align-middle w-[80px]">
                                <span>{trial.sites?.[0]?.total ?? "N/A"}</span>
                              </td>
                            )}
                            {columnSettings.siteNotes && (
                              <td className="p-4 align-middle w-[150px] max-w-[150px]">
                                <span className="truncate block" title={trial.sites?.[0]?.notes}>
                                  {trial.sites?.[0]?.notes || "N/A"}
                                </span>
                              </td>
                            )}
                            {/* Reference Links */}
                            {columnSettings.referenceLinks && (
                              <td className="p-4 align-middle w-[150px] max-w-[150px]">
                                <span className="truncate block" title={trial.overview.reference_links?.join(", ") || "N/A"}>
                                  {trial.overview.reference_links?.join(", ") || "N/A"}
                                </span>
                              </td>
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
                                <BookmarkIcon
                                  className={`h-4 w-4 ${favoriteTrials.includes(trial.trial_id)
                                    ? 'fill-blue-500 text-blue-500'
                                    : 'text-gray-400 hover:text-blue-500'
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
                editingQueryId={editingQueryId}
                editingQueryTitle={editingQueryTitle}
                editingQueryDescription={editingQueryDescription}
                storageKey="userDashboardQueries"
                queryType="user-dashboard"
              />

              {/* Advanced Search Modal */}
              <ClinicalTrialAdvancedSearchModal
                open={advancedSearchModalOpen}
                onOpenChange={setAdvancedSearchModalOpen}
                onApplySearch={handleApplyAdvancedSearch}
                onOpenSavedQueries={() => setQueryHistoryModalOpen(true)}
                currentSearchCriteria={appliedSearchCriteria}
                editingQueryId={editingQueryId}
                editingQueryTitle={editingQueryTitle}
                editingQueryDescription={editingQueryDescription}
                storageKey="userDashboardQueries"
                queryType="user-dashboard"
              />

              {/* Save Query Modal */}
              <SaveQueryModal
                open={saveQueryModalOpen}
                onOpenChange={setSaveQueryModalOpen}
                onSaveSuccess={handleSaveQuerySuccess}
                currentFilters={appliedFilters}
                currentSearchCriteria={appliedSearchCriteria}
                searchTerm={searchTerm}
                editingQueryId={editingQueryId}
                editingQueryTitle={editingQueryTitle}
                editingQueryDescription={editingQueryDescription}
                storageKey="userDashboardQueries"
                queryType="user-dashboard"
                sourceModal={filterModalOpen ? "filter" : "advanced"}
              />

              {/* Query History Modal */}
              <QueryHistoryModal
                open={queryHistoryModalOpen}
                onOpenChange={setQueryHistoryModalOpen}
                onLoadQuery={handleLoadQuery}
                storageKey="userDashboardQueries"
                queryType="user-dashboard"
                onEditQuery={(queryData) => {
                  // Close the query history modal
                  setQueryHistoryModalOpen(false);

                  // Check if query has filters (Filter modal) or searchCriteria (Advanced Search modal)
                  const hasFilters = queryData.filters && Object.values(queryData.filters).some(
                    (arr: any) => Array.isArray(arr) && arr.length > 0
                  );
                  const hasSearchCriteria = queryData.searchCriteria && queryData.searchCriteria.length > 0;

                  // Capture editing details
                  if (queryData.queryId) {
                    setEditingQueryId(queryData.queryId);
                    setEditingQueryTitle(queryData.queryTitle || "");
                    setEditingQueryDescription(queryData.queryDescription || "");
                  } else {
                    // Reset if new or not provided (just in case)
                    setEditingQueryId(null);
                    setEditingQueryTitle("");
                    setEditingQueryDescription("");
                  }

                  // Pre-populate the data
                  if (queryData.filters) {
                    // Merge with default state to ensure all keys exist
                    setAppliedFilters({ ...DEFAULT_FILTER_STATE, ...queryData.filters });
                  }
                  if (queryData.searchCriteria) {
                    setAppliedSearchCriteria(queryData.searchCriteria);
                  }
                  if (queryData.searchTerm) {
                    setSearchTerm(queryData.searchTerm);
                  }

                  // Open the appropriate modal based on query type or sourceModal metadata
                  if (queryData.sourceModal === "filter") {
                    setFilterModalOpen(true);
                  } else if (queryData.sourceModal === "advanced") {
                    setAdvancedSearchModalOpen(true);
                  } else if (hasFilters && !hasSearchCriteria) {
                    // Fallback for legacy queries
                    setFilterModalOpen(true);
                  } else {
                    // Open Advanced Search modal (default for search criteria or mixed)
                    setAdvancedSearchModalOpen(true);
                  }
                }}
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
    </div >
  );
}

