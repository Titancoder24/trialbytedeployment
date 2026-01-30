"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { formatDateToMMDDYYYY } from "@/lib/date-utils";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  Upload,
  Filter,
  Mail,
  User,
  Maximize2,
  Minimize2,
  RotateCcw,
  X,
  Download,
  Plus,
  Minus,
  Loader2,
  ChevronDown,
  LogOut,
  Link as LinkIcon,
  Eye,
  EyeOff,
  RefreshCw,
  Bell,
  Clipboard,
  ClipboardList,
  Clock,
  Target,
  BarChart3,
  MapPin,
  Settings,
  BookOpen,
} from "lucide-react";
import { Suspense } from "react";
import { useTherapeuticTrialDetail } from "@/hooks/use-therapeutic-trial-detail";
import { useQueryClient } from "@tanstack/react-query";
import { useLinkPreview } from "@/components/ui/link-preview-panel";
import { PreviewLink } from "@/components/ui/preview-link";

// API Response interface
interface ApiResponse {
  trials: TherapeuticTrial[];
}

// Types based on the JSON structure
interface TherapeuticTrial {
  trial_id: string;
  overview: {
    id: string;
    therapeutic_area: string;
    trial_identifier: string[];
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
    start_date_actual: string | null;
    start_date_benchmark: string | null;
    start_date_estimated: string | null;
    inclusion_period_actual: string | null;
    inclusion_period_benchmark: string | null;
    inclusion_period_estimated: string | null;
    enrollment_closed_actual: string | null;
    enrollment_closed_benchmark: string | null;
    enrollment_closed_estimated: string | null;
    primary_outcome_duration_actual: string | null;
    primary_outcome_duration_benchmark: string | null;
    primary_outcome_duration_estimated: string | null;
    trial_end_date_actual: string | null;
    trial_end_date_benchmark: string | null;
    trial_end_date_estimated: string | null;
    result_duration_actual: string | null;
    result_duration_benchmark: string | null;
    result_duration_estimated: string | null;
    result_published_date_actual: string | null;
    result_published_date_benchmark: string | null;
    result_published_date_estimated: string | null;
    overall_duration_complete: string | null;
    overall_duration_publish: string | null;
    timing_references: any[] | string | null;
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
    results_available: string | boolean | null;
    endpoints_met: string | boolean | null;
    adverse_events_reported: string | boolean | null;
    trial_outcome_content: string | null;
    trial_outcome_link: string | null;
    trial_outcome_attachment: string | any | null;
    trial_outcome_reference_date: string | null;
    site_notes: Array<{
      id?: string;
      date: string;
      noteType?: string;
      type?: string;
      content: string;
      sourceType?: string;
      source?: string;
      attachments?: (string | { url: string; name: string; size?: number; type?: string })[];
      isVisible?: boolean;
      adverse_event_reported?: string;
      adverse_event_type?: string;
      treatment_for_adverse_events?: string;
    }> | null;
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

export default function TherapeuticDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [trial, setTrial] = useState<TherapeuticTrial | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedReferences, setExpandedReferences] = useState<Record<number, boolean>>({});
  const [expandedPublishedResults, setExpandedPublishedResults] = useState<Record<number, boolean>>({});
  const [expandedSiteNotes, setExpandedSiteNotes] = useState<Record<number, boolean>>({});
  const [expandedOtherSources, setExpandedOtherSources] = useState<Record<number, boolean>>({ 0: true });
  const [selectedRefForAttachments, setSelectedRefForAttachments] = useState<any>(null);

  const toggleReference = (index: number) => {
    setExpandedReferences(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const togglePublishedResult = (index: number) => {
    setExpandedPublishedResults(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleSiteNote = (index: number) => {
    setExpandedSiteNotes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleOtherSource = (index: number) => {
    setExpandedOtherSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const { openLinkPreview } = useLinkPreview();


  // Helper function to check if a value is valid (not null, undefined, or empty string)
  const isValidValue = (value: any): boolean => {
    return value !== null && value !== undefined && value !== "" && String(value).trim() !== "";
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use React Query to fetch trial data (must be declared before useEffects that use it)
  const { data: apiData, isLoading: queryLoading, error: queryError, refetch } = useTherapeuticTrialDetail(resolvedParams.id);

  // Helper function to transform API data to our interface
  const transformTrialData = (data: any): TherapeuticTrial | null => {
    if (!data?.data) return null;

    return {
      trial_id: data.trial_id,
      overview: {
        id: data.data.overview.id,
        therapeutic_area: data.data.overview.therapeutic_area || "N/A",
        trial_identifier: data.data.overview.trial_identifier || [],
        trial_phase: data.data.overview.trial_phase || "N/A",
        status: data.data.overview.status || "N/A",
        primary_drugs: data.data.overview.primary_drugs || "N/A",
        other_drugs: data.data.overview.other_drugs || "N/A",
        title: data.data.overview.title || "N/A",
        disease_type: data.data.overview.disease_type || "N/A",
        patient_segment: data.data.overview.patient_segment || "N/A",
        line_of_therapy: data.data.overview.line_of_therapy || "N/A",
        reference_links: data.data.overview.reference_links || [],
        trial_tags: data.data.overview.trial_tags || "N/A",
        sponsor_collaborators: data.data.overview.sponsor_collaborators || "N/A",
        sponsor_field_activity: data.data.overview.sponsor_field_activity || "N/A",
        associated_cro: data.data.overview.associated_cro || "N/A",
        countries: data.data.overview.countries || "N/A",
        region: data.data.overview.region || "N/A",
        trial_record_status: data.data.overview.trial_record_status || "N/A",
        created_at: data.data.overview.created_at || "N/A",
        updated_at: data.data.overview.updated_at || "N/A",
      },
      outcomes: data.data.outcomes.map((outcome: any) => ({
        id: outcome.id,
        trial_id: outcome.trial_id,
        purpose_of_trial: outcome.purpose_of_trial || "N/A",
        summary: outcome.summary || "N/A",
        primary_outcome_measure: outcome.primary_outcome_measure || "N/A",
        other_outcome_measure: outcome.other_outcome_measure || "N/A",
        study_design_keywords: outcome.study_design_keywords || "N/A",
        study_design: outcome.study_design || "N/A",
        treatment_regimen: outcome.treatment_regimen || "N/A",
        number_of_arms: outcome.number_of_arms || 0,
      })),
      criteria: data.data.criteria.map((criterion: any) => ({
        id: criterion.id,
        trial_id: criterion.trial_id,
        inclusion_criteria: criterion.inclusion_criteria || "N/A",
        exclusion_criteria: criterion.exclusion_criteria || "N/A",
        age_from: criterion.age_from || "N/A",
        subject_type: criterion.subject_type || "N/A",
        age_to: criterion.age_to || "N/A",
        sex: criterion.sex || "N/A",
        healthy_volunteers: criterion.healthy_volunteers || "N/A",
        target_no_volunteers: criterion.target_no_volunteers || 0,
        actual_enrolled_volunteers: criterion.actual_enrolled_volunteers || 0,
      })),
      timing: data.data.timing.map((timing: any) => ({
        id: timing.id,
        trial_id: timing.trial_id,
        start_date_actual: timing.start_date_actual || null,
        start_date_benchmark: timing.start_date_benchmark || null,
        start_date_estimated: timing.start_date_estimated || null,
        inclusion_period_actual: timing.inclusion_period_actual || null,
        inclusion_period_benchmark: timing.inclusion_period_benchmark || null,
        inclusion_period_estimated: timing.inclusion_period_estimated || null,
        enrollment_closed_actual: timing.enrollment_closed_actual || null,
        enrollment_closed_benchmark: timing.enrollment_closed_benchmark || null,
        enrollment_closed_estimated: timing.enrollment_closed_estimated || null,
        primary_outcome_duration_actual: timing.primary_outcome_duration_actual || null,
        primary_outcome_duration_benchmark: timing.primary_outcome_duration_benchmark || null,
        primary_outcome_duration_estimated: timing.primary_outcome_duration_estimated || null,
        trial_end_date_actual: timing.trial_end_date_actual || null,
        trial_end_date_benchmark: timing.trial_end_date_benchmark || null,
        trial_end_date_estimated: timing.trial_end_date_estimated || null,
        result_duration_actual: timing.result_duration_actual || null,
        result_duration_benchmark: timing.result_duration_benchmark || null,
        result_duration_estimated: timing.result_duration_estimated || null,
        result_published_date_actual: timing.result_published_date_actual || null,
        result_published_date_benchmark: timing.result_published_date_benchmark || null,
        result_published_date_estimated: timing.result_published_date_estimated || null,
        overall_duration_complete: timing.overall_duration_complete || null,
        overall_duration_publish: timing.overall_duration_publish || null,
        timing_references: timing.timing_references || null,
      })),
      results: data.data.results.map((result: any) => {
        // Parse site_notes if it's a string
        let siteNotes = result.site_notes;
        if (typeof siteNotes === 'string' && siteNotes.trim()) {
          try {
            siteNotes = JSON.parse(siteNotes);
          } catch (e) {
            console.warn('Failed to parse site_notes:', e);
            siteNotes = null;
          }
        }
        if (!Array.isArray(siteNotes)) {
          siteNotes = null;
        }

        // Parse trial_outcome_attachment if it's a string
        let attachment = result.trial_outcome_attachment;
        if (typeof attachment === 'string' && attachment.trim()) {
          try {
            attachment = JSON.parse(attachment);
          } catch (e) {
            // If parsing fails, keep as string or null
            attachment = attachment || null;
          }
        }

        return {
          id: result.id,
          trial_id: result.trial_id,
          trial_outcome: result.trial_outcome || "N/A",
          reference: result.reference || "N/A",
          trial_results: result.trial_results || [],
          adverse_event_reported: result.adverse_event_reported || "N/A",
          adverse_event_type: result.adverse_event_type || null,
          treatment_for_adverse_events: result.treatment_for_adverse_events || null,
          results_available: result.results_available !== null && result.results_available !== undefined
            ? (result.results_available === true || result.results_available === "true" || result.results_available === "Yes")
            : null,
          endpoints_met: result.endpoints_met !== null && result.endpoints_met !== undefined
            ? (result.endpoints_met === true || result.endpoints_met === "true" || result.endpoints_met === "Yes")
            : null,
          adverse_events_reported: result.adverse_events_reported !== null && result.adverse_events_reported !== undefined
            ? (result.adverse_events_reported === true || result.adverse_events_reported === "true" || result.adverse_events_reported === "Yes")
            : null,
          trial_outcome_content: result.trial_outcome_content || null,
          trial_outcome_link: result.trial_outcome_link || null,
          trial_outcome_attachment: attachment,
          trial_outcome_reference_date: result.trial_outcome_reference_date || result.reference || null,
          site_notes: siteNotes,
        };
      }),
      sites: data.data.sites.map((site: any) => ({
        id: site.id,
        trial_id: site.trial_id,
        total: site.total || 0,
        notes: site.notes || "N/A",
      })),
      other: data.data.other.map((other: any) => ({
        id: other.id,
        trial_id: other.trial_id,
        data: other.data || "N/A",
        url: other.url || "N/A",
      })),
      logs: data.data.logs.map((log: any) => ({
        id: log.id,
        trial_id: log.trial_id,
        trial_changes_log: log.trial_changes_log || "N/A",
        trial_added_date: log.trial_added_date || "N/A",
        last_modified_date: log.last_modified_date || "N/A",
        last_modified_user: log.last_modified_user || "N/A",
        full_review_user: log.full_review_user || "N/A",
        next_review_date: log.next_review_date || "N/A",
        attachment: log.attachment || null,
      })),
      notes: data.data.notes.map((note: any) => ({
        id: note.id,
        trial_id: note.trial_id,
        date_type: note.date_type || "N/A",
        notes: note.notes || "N/A",
        link: note.link || "N/A",
        attachments: (() => {
          if (Array.isArray(note.attachments)) {
            return note.attachments;
          } else if (typeof note.attachments === 'string' && note.attachments.trim()) {
            try {
              const parsed = JSON.parse(note.attachments);
              return Array.isArray(parsed) ? parsed : [note.attachments];
            } catch {
              return note.attachments.includes(',')
                ? note.attachments.split(',').map((item: string) => item.trim()).filter((item: string) => item)
                : [note.attachments];
            }
          }
          return [];
        })(),
      })),
    };
  };

  // Transform and set trial data when API data changes
  useEffect(() => {
    if (apiData) {
      const transformedTrial = transformTrialData(apiData);
      if (transformedTrial) {
        console.log("Transformed trial data:", transformedTrial);
        console.log("Timing data from API:", apiData.data.timing);
        console.log("Transformed timing data:", transformedTrial.timing);
        setTrial(transformedTrial);
      } else {
        toast({
          title: "No Data Available",
          description: "Unable to load trial data.",
          variant: "destructive",
        });
        router.push("/admin/therapeutics");
      }
    }
  }, [apiData, router, toast]);

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      if (queryError instanceof Error && queryError.message.includes("not found")) {
        toast({
          title: "Trial Not Found",
          description: "The requested therapeutic trial could not be found.",
          variant: "destructive",
        });
        router.push("/admin/therapeutics");
      } else {
        toast({
          title: "Error",
          description: "Failed to load trial data.",
          variant: "destructive",
        });
      }
    }
  }, [queryError, router, toast]);

  // Set loading state based on query
  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading]);

  // Function to manually refresh data
  const handleRefresh = async () => {
    try {
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["therapeutic-trial-detail", resolvedParams.id] });
      await refetch();
      toast({
        title: "Data Refreshed",
        description: "Trial data has been refreshed.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh trial data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Listen for storage events to refresh when data is updated from edit page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If timing data was saved, refresh
      if (e.key?.includes('trial_timing_') || e.key?.includes('trial_db_saved_')) {
        console.log("Detected timing data update, refreshing...");
        queryClient.invalidateQueries({ queryKey: ["therapeutic-trial-detail", resolvedParams.id] });
        refetch();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (for same-tab updates)
    const handleCustomRefresh = () => {
      console.log("Custom refresh event received, refreshing...");
      queryClient.invalidateQueries({ queryKey: ["therapeutic-trial-detail", resolvedParams.id] });
      refetch();
    };

    window.addEventListener('trial-data-updated', handleCustomRefresh);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('trial-data-updated', handleCustomRefresh);
    };
  }, [resolvedParams.id, queryClient, refetch]);
  const [endpointsMet, setEndpointsMet] = useState(true);
  const [resultPosted, setResultPosted] = useState({ yes: true, no: false });
  const [activeSection, setActiveSection] = useState("overview");
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filteredSections, setFilteredSections] = useState<string[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showBackendView, setShowBackendView] = useState(false);
  const [otherSourcesExpanded, setOtherSourcesExpanded] = useState(false);

  // Trial tabs state for quick switching between trials - shows ALL trials
  const [allTrialTabs, setAllTrialTabs] = useState<Array<{ id: string; identifier: string }>>([]);

  // Fetch ALL trials for the tab bar
  useEffect(() => {
    const fetchAllTrials = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/therapeutic/all-trials-with-data`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.trials) {
            setAllTrialTabs(data.trials.map((t: any) => ({
              id: t.trial_id,
              identifier: t.overview?.trial_identifier?.[0] || t.trial_id
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching trials list:", error);
      }
    };
    fetchAllTrials();
  }, []);

  // Handle switching to a different trial tab
  const switchToTrial = (trialId: string) => {
    if (trialId !== resolvedParams.id) {
      router.push(`/admin/therapeutics/${trialId}`);
    }
  };

  // Handle closing/removing a trial tab from view
  const closeTrialTab = (e: React.MouseEvent, trialId: string) => {
    e.stopPropagation();
    // If closing current tab, switch to the next one or go back to list
    if (trialId === resolvedParams.id) {
      const currentIndex = allTrialTabs.findIndex(t => t.id === trialId);
      if (allTrialTabs.length > 1) {
        // Switch to next trial, or previous if at end
        const nextIndex = currentIndex < allTrialTabs.length - 1 ? currentIndex + 1 : currentIndex - 1;
        router.push(`/admin/therapeutics/${allTrialTabs[nextIndex].id}`);
      } else {
        router.push('/admin/therapeutics');
      }
    }
  };

  // Refs for each section
  const overviewRef = useRef<HTMLDivElement>(null);
  const objectivesRef = useRef<HTMLDivElement>(null);
  const treatmentPlanRef = useRef<HTMLDivElement>(null);
  const patientDescriptionRef = useRef<HTMLDivElement>(null);
  const timingRef = useRef<HTMLDivElement>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);
  const publishedResultsRef = useRef<HTMLDivElement>(null);
  const sitesRef = useRef<HTMLDivElement>(null);
  const otherSourcesRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Logout functionality
  const handleLogout = () => {
    // Clear any stored authentication data (tokens, user data, etc.)
    // This is a placeholder - implement based on your auth system
    localStorage.removeItem("authToken");
    sessionStorage.clear();

    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });

    // Navigate to admin login page
    router.push("/admin/login");
  };

  // Handle maximize/fullscreen functionality
  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      setIsMinimized(false); // Reset minimize when maximizing
      toast({
        title: "Maximized",
        description: "Trial view has been maximized for better visibility",
      });
    } else {
      toast({
        title: "Restored",
        description: "Trial view has been restored to normal size",
      });
    }
  };

  // Handle minimize/compact view functionality
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setIsMaximized(false); // Reset maximize when minimizing
      toast({
        title: "Minimized",
        description: "Trial view has been minimized to compact mode",
      });
    } else {
      toast({
        title: "Expanded",
        description: "Trial view has been expanded to normal mode",
      });
    }
  };


  // Handle filter dialog
  const handleFilter = () => {
    setShowFilterDialog(true);
  };

  // Apply section filters
  const applySectionFilter = (sections: string[]) => {
    setFilteredSections(sections);
    setShowFilterDialog(false);

    if (sections.length > 0) {
      toast({
        title: "Filter Applied",
        description: `Showing ${sections.length} selected section(s)`,
      });
    } else {
      toast({
        title: "Filter Cleared",
        description: "All sections are now visible",
      });
    }
  };

  // Check if a section should be visible based on filters
  const isSectionVisible = (sectionName: string) => {
    if (filteredSections.length === 0) return true; // Show all if no filter applied
    return filteredSections.includes(sectionName);
  };

  // Export page as PDF
  const exportAsPDF = async () => {
    try {
      setIsExporting(true);

      // Get the main content div (excluding sidebar and navigation)
      const element = document.querySelector(
        "[data-export-content]"
      ) as HTMLElement;
      if (!element) {
        throw new Error("Content not found for export");
      }

      // Temporarily remove filters for complete export
      const originalFilters = filteredSections;
      setFilteredSections([]);

      // Wait for state update to render all sections
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        height: element.scrollHeight,
        width: element.scrollWidth,
      });

      // Restore original filters
      setFilteredSections(originalFilters);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `trial_${trial?.trial_id || "export"}_${new Date().toISOString().split("T")[0]
        }.pdf`;

      pdf.save(fileName);

      toast({
        title: "PDF Export Complete",
        description: `Trial has been exported as ${fileName}`,
      });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast({
        title: "PDF Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  // Export as JSON (existing functionality)
  const exportAsJSON = () => {
    if (trial) {
      const exportData = {
        trial_id: trial.trial_id,
        overview: trial.overview,
        outcomes: trial.outcomes,
        criteria: trial.criteria,
        timing: trial.timing,
        results: trial.results,
        sites: trial.sites,
        other: trial.other,
        exported_at: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trial_${trial.trial_id}_export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "JSON Export Complete",
        description: `Trial data has been exported to trial_${trial.trial_id}_export.json`,
      });
    } else {
      toast({
        title: "Export Failed",
        description: "No trial data available to export",
        variant: "destructive",
      });
    }
    setShowExportModal(false);
  };


  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const refs = {
      overview: overviewRef,
      objectives: objectivesRef,
      treatmentPlan: treatmentPlanRef,
      patientDescription: patientDescriptionRef,
      timing: timingRef,
      outcome: outcomeRef,
      publishedResults: publishedResultsRef,
      sites: sitesRef,
      otherSources: otherSourcesRef,
    };

    const targetRef = refs[sectionId as keyof typeof refs];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setActiveSection(sectionId);
    }
  };

  // Intersection Observer to update active section on scroll
  useEffect(() => {
    const sections = [
      { id: "overview", ref: overviewRef },
      { id: "objectives", ref: objectivesRef },
      { id: "treatmentPlan", ref: treatmentPlanRef },
      { id: "patientDescription", ref: patientDescriptionRef },
      { id: "timing", ref: timingRef },
      { id: "outcome", ref: outcomeRef },
      { id: "publishedResults", ref: publishedResultsRef },
      { id: "sites", ref: sitesRef },
      { id: "otherSources", ref: otherSourcesRef },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = sections.find(
              (s) => s.ref.current === entry.target
            );
            if (section) {
              setActiveSection(section.id);
            }
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "-80px 0px -50% 0px",
      }
    );

    sections.forEach((section) => {
      if (section.ref.current) {
        observer.observe(section.ref.current);
      }
    });

    return () => {
      sections.forEach((section) => {
        if (section.ref.current) {
          observer.unobserve(section.ref.current);
        }
      });
    };
  }, [trial]); // Re-run when trial loads

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLogoutDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Completed: "bg-blue-600 text-white",
      Active: "bg-green-600 text-white",
      Planned: "bg-yellow-600 text-white",
      Suspended: "bg-red-600 text-white",
    };
    return colors[status] || "bg-gray-600 text-white";
  };

  const countries = trial?.overview.countries?.split(", ") || [];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading trial details...</p>
        </div>
      </div>
    );
  }

  // No trial state
  if (!trial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Trial not found</p>
          <Button onClick={() => router.push("/admin/therapeutics")} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 overflow-x-hidden ${isMaximized ? "fixed inset-0 z-50 overflow-auto" : ""
        }`}
    >
      {/* Top Navigation */}
      <div className="bg-white border-b">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.jpeg"
                alt="Logo"
                width={160}
                height={40}
                className="h-10 w-auto rounded"
              />
            </div>
            <Button
              onClick={() => {
                router.push("/admin/therapeutics");
              }}
              variant="ghost"
              className="text-gray-600"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Clinical Trials
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <FileText className="h-4 w-4 mr-2" />
              Trial Details
            </Button>

            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              disabled={queryLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${queryLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-blue-500 font-medium">TrialByte</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">✉</span>
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
                  onClick={() => setShowLogoutDropdown(!showLogoutDropdown)}
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${showLogoutDropdown ? "rotate-180" : ""
                      }`}
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
        </div>
      </div>

      {/* Secondary Navigation */}
      <div className="bg-blue-100 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="flex items-center text-gray-600 hover:text-gray-800"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => router.forward()}
            >
              Forward
            </Button>
          </div>
          <div className="flex items-center space-x-2">

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Trial Tabs Bar - Shows ALL available trials */}
      <div className="bg-[#D7EFFF] px-6 py-3 border-b border-[#2B4863]/10">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-1">
          {allTrialTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => switchToTrial(tab.id)}
              className={`flex items-center gap-3 px-5 py-2 rounded-full text-sm font-bold cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${tab.id === resolvedParams.id
                ? "bg-[#2B4863] text-white shadow-md"
                : "bg-transparent text-[#2B4863] hover:bg-[#2B4863]/10"
                }`}
            >
              <span>{tab.identifier}</span>
              <button
                onClick={(e) => closeTrialTab(e, tab.id)}
                className={`flex items-center justify-center w-5 h-5 rounded-full transition-colors ${tab.id === resolvedParams.id
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-[#2B4863]/10 text-[#2B4863] hover:bg-[#2B4863]/20"
                  }`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar - Sticky */}
        <div className="w-full lg:w-64 bg-white border-r border-[#2B4863] lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          <div className="py-2">
            {/* Main Navigation Items */}
            {isSectionVisible("overview") && (
              <button
                onClick={() => scrollToSection("overview")}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-l-4 ${activeSection === "overview"
                  ? "border-l-[#2B4863] bg-blue-50 text-[#2B4863]"
                  : "border-l-transparent text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <Clipboard className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">Overview</span>
              </button>
            )}

            {isSectionVisible("objectives") && (
              <button
                onClick={() => scrollToSection("objectives")}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-l-4 ${activeSection === "objectives"
                  ? "border-l-[#2B4863] bg-blue-50 text-[#2B4863]"
                  : "border-l-transparent text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <Target className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">Objectives</span>
              </button>
            )}

            {isSectionVisible("treatmentPlan") && (
              <button
                onClick={() => scrollToSection("treatmentPlan")}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-l-4 ${activeSection === "treatmentPlan"
                  ? "border-l-[#2B4863] bg-blue-50 text-[#2B4863]"
                  : "border-l-transparent text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <ClipboardList className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">Treatment Plan</span>
              </button>
            )}

            {isSectionVisible("patientDescription") && (
              <button
                onClick={() => scrollToSection("patientDescription")}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-l-4 ${activeSection === "patientDescription"
                  ? "border-l-[#2B4863] bg-blue-50 text-[#2B4863]"
                  : "border-l-transparent text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">Patient Description</span>
              </button>
            )}

            {isSectionVisible("timing") && (
              <button
                onClick={() => scrollToSection("timing")}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-l-4 ${activeSection === "timing"
                  ? "border-l-[#2B4863] bg-blue-50 text-[#2B4863]"
                  : "border-l-transparent text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <Clock className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">Timing</span>
              </button>
            )}

            {isSectionVisible("outcome") && (
              <button
                onClick={() => scrollToSection("outcome")}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-l-4 ${activeSection === "outcome"
                  ? "border-l-[#2B4863] bg-blue-50 text-[#2B4863]"
                  : "border-l-transparent text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <BarChart3 className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">Outcome</span>
              </button>
            )}

            {isSectionVisible("publishedResults") && (
              <button
                onClick={() => scrollToSection("publishedResults")}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-l-4 ${activeSection === "publishedResults"
                  ? "border-l-[#2B4863] bg-blue-50 text-[#2B4863]"
                  : "border-l-transparent text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">Published Results</span>
              </button>
            )}

            {isSectionVisible("sites") && (
              <button
                onClick={() => scrollToSection("sites")}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-l-4 ${activeSection === "sites"
                  ? "border-l-[#2B4863] bg-blue-50 text-[#2B4863]"
                  : "border-l-transparent text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <MapPin className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">Sites</span>
              </button>
            )}

            {/* Other Sources - Expandable */}
            {isSectionVisible("otherSources") && (
              <div>
                <button
                  onClick={() => {
                    setOtherSourcesExpanded(!otherSourcesExpanded);
                    scrollToSection("otherSources");
                  }}
                  className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${activeSection === "otherSources" || otherSourcesExpanded
                    ? "bg-[#2B4863] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Other Sources</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${otherSourcesExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Sub-items */}
                {otherSourcesExpanded && (
                  <div className="bg-white py-2">
                    <button
                      onClick={() => scrollToSection("otherSources")}
                      className="w-full flex items-center gap-3 pl-14 pr-5 py-2 text-left text-sm text-gray-700 hover:text-[#2B4863] hover:bg-gray-50 transition-colors"
                    >
                      Pipeline Data
                    </button>
                    <button
                      onClick={() => scrollToSection("otherSources")}
                      className="w-full flex items-center gap-3 pl-14 pr-5 py-2 text-left text-sm text-gray-400 hover:text-[#2B4863] hover:bg-gray-50 transition-colors"
                    >
                      Press Release
                    </button>
                    <button
                      onClick={() => scrollToSection("otherSources")}
                      className="w-full flex items-center gap-3 pl-14 pr-5 py-2 text-left text-sm text-gray-400 hover:text-[#2B4863] hover:bg-gray-50 transition-colors"
                    >
                      Publications
                    </button>
                    <button
                      onClick={() => scrollToSection("otherSources")}
                      className="w-full flex items-center gap-3 pl-14 pr-5 py-2 text-left text-sm text-gray-400 hover:text-[#2B4863] hover:bg-gray-50 transition-colors"
                    >
                      Trial Registries
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Associated Studies */}
            <button
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Associated Studies functionality will be available in the next update.",
                });
              }}
              className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-l-4 border-l-transparent text-gray-600 hover:bg-gray-50"
            >
              <BookOpen className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">Associated Studies</span>
            </button>

            {/* Logs */}
            {isSectionVisible("logs") && (
              <button
                onClick={() => scrollToSection("logs")}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-l-4 ${activeSection === "logs"
                  ? "border-l-[#2B4863] bg-blue-50 text-[#2B4863]"
                  : "border-l-transparent text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">Logs</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Trial Header */}
          <div
            className={`bg-white border-b ${isMinimized ? "px-2 py-1" : "px-6 py-2"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {trial.overview.trial_identifier?.[0] || trial.trial_id}
                </h2>
                <Badge className={getStatusColor(trial.overview.status)}>
                  {trial.overview.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMaximize}
                  className={`${isMaximized ? "bg-blue-100 text-blue-600" : ""}`}
                  title={isMaximized ? "Restore view" : "Maximize view"}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className={`${isMinimized ? "bg-blue-100 text-blue-600" : ""}`}
                  title={isMinimized ? "Expand view" : "Minimize view"}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  title="Refresh trial data"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFilter}
                  className={`${filteredSections.length > 0 ? "bg-blue-100 text-blue-600" : ""
                    }`}
                  title="Filter sections"
                >
                  <Filter className="h-4 w-4" />
                  {filteredSections.length > 0 && (
                    <span className="ml-1 text-xs bg-blue-600 text-white rounded-full px-1">
                      {filteredSections.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Trial Content */}
          <div className={`${isMinimized ? "p-2" : "p-6"} overflow-x-auto`} data-export-content>
            {/* Trial Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="text-red-400 text-3xl">🎯</div>
                <div className="flex-1">
                  <h1 className="text-xl font-semibold mb-2">
                    {trial.overview.title}
                  </h1>
                </div>
              </div>
            </div>

            {/* Overview Section */}
            {isSectionVisible("overview") && (
              <Card className="rounded-t-none" ref={overviewRef}>
                <CardContent className="p-6">
                  {/* Status and Controls */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge
                          className={getStatusColor(
                            trial.overview.status
                          )}
                        >
                          {trial.overview.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Endpoints met</span>
                        <Switch
                          checked={endpointsMet}
                          onCheckedChange={setEndpointsMet}
                          disabled={true}
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm">Resulted Posted</span>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              resultPosted.yes
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }
                          >
                            Yes
                          </Badge>
                          <Badge
                            className={
                              resultPosted.no
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }
                          >
                            No
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Therapeutic Area and Trial Identifiers */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          Therapeutic Area
                        </span>
                        <Badge className="bg-blue-600 text-white">
                          {trial.overview.therapeutic_area}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium mb-2 block">
                        Trial Identifier :
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(trial.overview.trial_identifier || []).map(
                          (identifier, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-white"
                            >
                              {identifier}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scientific Title */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Scientific Title
                    </h3>
                    <p className="text-black text-sm leading-relaxed whitespace-pre-wrap">
                      {trial.outcomes[0]?.purpose_of_trial ||
                        "No scientific title available"}
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Summary
                    </h3>
                    <p className="text-black text-sm leading-relaxed whitespace-pre-wrap">
                      {trial.outcomes[0]?.summary ||
                        "No summary available"}
                    </p>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Left Column - Key Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Key Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[140px] flex-shrink-0">
                            Disease Type :
                          </span>
                          <span className="text-sm text-gray-700">
                            {trial.overview.disease_type || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[140px] flex-shrink-0">
                            Patient Segment :
                          </span>
                          <span className="text-sm text-gray-700">
                            {trial.overview.patient_segment || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[140px] flex-shrink-0">
                            Primary Drug :
                          </span>
                          <span className="text-sm text-gray-700">
                            {trial.overview.primary_drugs || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[140px] flex-shrink-0">
                            Other Drugs :
                          </span>
                          <span className="text-sm text-gray-700">
                            {trial.overview.other_drugs || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[140px] flex-shrink-0">
                            Trial Phase :
                          </span>
                          <Badge className="bg-green-600 text-white">
                            Phase {trial.overview.trial_phase || "N/A"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Line of Therapy */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Line of Therapy
                      </h3>
                      <div className="space-y-2">
                        {trial.overview.line_of_therapy ? (
                          trial.overview.line_of_therapy.split(/,\s*|\n/).map((line, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span className="text-blue-600">•</span>
                              <span className="text-sm font-medium text-gray-900">
                                {line.trim()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-gray-600">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Countries Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Countries
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {countries.length > 0 ? (
                          countries.map((country, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-center bg-white text-gray-700 py-2.5 px-4 rounded-md border-gray-300 shadow-sm font-medium h-auto flex items-center justify-center"
                            >
                              {country.trim()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-600">
                            No countries specified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Details */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Region :
                        </span>
                        <span className="text-sm text-gray-700 ml-2">
                          {trial.overview.region || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Sponsors & Collaborators :
                        </span>
                        <span className="text-sm text-gray-700 ml-2">
                          {trial.overview.sponsor_collaborators || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Sponsor Field of Activity :
                        </span>
                        <span className="text-sm text-gray-700 ml-2">
                          {trial.overview.sponsor_field_activity ||
                            "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Associated CRO :
                        </span>
                        <span className="text-sm text-gray-700 ml-2">
                          {trial.overview.associated_cro || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Trial Tags :
                        </span>
                        <span className="text-sm text-gray-700 ml-2">
                          {trial.overview.trial_tags || "N/A"}
                        </span>
                      </div>

                      {/* Source Links */}
                      <div className="pt-4">
                        <span className="text-sm font-medium text-gray-600 block mb-2">
                          Source Links :
                        </span>
                        <div className="space-y-1">
                          {trial.overview.reference_links &&
                            trial.overview.reference_links.length > 0 ? (
                            trial.overview.reference_links.map(
                              (link, index) => (
                                <div key={index}>
                                  <span className="text-blue-600 text-xs">
                                    •
                                  </span>
                                  <PreviewLink
                                    href={link}
                                    title="Source Link"
                                    className="text-blue-600 text-xs ml-1 hover:underline"
                                  >
                                    {link}
                                  </PreviewLink>
                                </div>
                              )
                            )
                          ) : (
                            <span className="text-sm text-gray-600">
                              No source links available
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <span className="text-sm font-medium text-gray-600">
                          Trial Record Status :
                        </span>
                        <span className="text-sm text-gray-700">
                          {trial.overview.trial_record_status || "N/A"}
                        </span>
                        <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>

                    {/* Right Column - Europe Map - Temporarily Commented */}
                    {/* <div className="flex justify-center items-center">
                      <div className="relative w-full max-w-xs">
                        <Image
                          src="/europe.png"
                          alt="Europe Map"
                          width={300}
                          height={300}
                          className="object-contain"
                        />
                  </div>
                    </div> */}
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Objectives Section */}
            {isSectionVisible("objectives") && (
              <Card className="mt-6" ref={objectivesRef}>
                <div className="bg-sky-200 p-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Objectives
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {/* Purpose of the trial */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-base font-semibold text-gray-700 mb-4">
                        Purpose of the trial
                      </h3>
                      <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">
                        {trial.outcomes[0]?.purpose_of_trial ||
                          "No purpose description available"}
                      </p>
                    </div>

                    {/* Primary Outcome */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-semibold text-blue-700 mb-4">
                          Primary Outcome
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Outcome Measure :
                            </span>
                            <p className="text-sm text-black mt-1 whitespace-pre-wrap">
                              {trial.outcomes[0]
                                ?.primary_outcome_measure ||
                                "No primary outcome measure available"}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Measure Description :
                            </span>
                            <p className="text-sm text-black mt-1 leading-relaxed whitespace-pre-wrap">
                              {trial.outcomes[0]?.summary ||
                                "No measure description available"}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Other Outcome Measures :
                            </span>
                            <p className="text-sm text-black mt-1 whitespace-pre-wrap">
                              {trial.outcomes[0]
                                ?.other_outcome_measure ||
                                "No other outcome measures available"}
                            </p>
                          </div>
                        </div>
                      </div>


                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Treatment Plan Section */}
            {isSectionVisible("treatmentPlan") && (
              <Card className="mt-6" ref={treatmentPlanRef}>
                <div className="bg-sky-200 p-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Treatment Plan
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {/* Study Design Keywords */}
                    <div>
                      <h3 className="text-base font-semibold text-blue-700 mb-4">
                        Study Design Keywords
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {trial.outcomes[0]?.study_design_keywords ? (
                          trial.outcomes[0].study_design_keywords
                            .split(",")
                            .map((keyword, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-gray-100 text-gray-800 py-3 px-8 rounded-md border-none font-bold text-sm h-auto flex items-center justify-center min-w-[120px]"
                              >
                                {keyword.trim()}
                              </Badge>
                            ))
                        ) : (
                          <span className="text-sm text-gray-600">
                            No study design keywords available
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Study Design */}
                    <div>
                      <h3 className="text-base font-semibold text-blue-700 mb-4">
                        Study Design
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[120px] flex-shrink-0">
                            Study Design :
                          </span>
                          <span className="text-sm text-black">
                            {trial.outcomes[0]?.study_design || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[120px] flex-shrink-0">
                            Keywords :
                          </span>
                          <span className="text-sm text-black">
                            {trial.outcomes[0]?.study_design_keywords ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[120px] flex-shrink-0">
                            Number of Arms :
                          </span>
                          <span className="text-sm text-black">
                            {trial.outcomes[0]?.number_of_arms || "N/A"}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-black mt-4 leading-relaxed whitespace-pre-wrap">
                        {trial.outcomes[0]?.summary ||
                          "No detailed study design description available"}
                      </p>
                    </div>

                    {/* Treatment Regimen */}
                    <div>
                      <h3 className="text-base font-semibold text-blue-700 mb-4">
                        Treatment Regimen
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Treatment Description :
                          </span>
                          <p className="text-sm text-black mt-1 whitespace-pre-wrap">
                            {trial.outcomes[0]?.treatment_regimen ||
                              "No treatment regimen description available"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">
                          Number of arms:{" "}
                          {trial.outcomes[0]?.number_of_arms || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Patient Description Section */}
            {isSectionVisible("patientDescription") && (
              <Card className="mt-6" ref={patientDescriptionRef}>
                <div className="bg-sky-200 p-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Patient Description
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Criteria (takes 2/3 width) */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Inclusion Criteria */}
                      <div>
                        <h3 className="text-base font-semibold text-blue-700 mb-4">
                          Inclusion Criteria
                        </h3>
                        {trial.criteria[0]?.inclusion_criteria ? (
                          <div className="text-sm text-black">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="whitespace-pre-wrap">
                              {trial.criteria[0].inclusion_criteria}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600">
                            No inclusion criteria available
                          </span>
                        )}
                      </div>

                      {/* Exclusion Criteria */}
                      <div>
                        <h3 className="text-base font-semibold text-blue-700 mb-4">
                          Exclusion Criteria
                        </h3>
                        {trial.criteria[0]?.exclusion_criteria ? (
                          <div className="text-sm text-black">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="whitespace-pre-wrap">
                              {trial.criteria[0].exclusion_criteria}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600">
                            No exclusion criteria available
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Patient Details (takes 1/3 width) */}
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Ages Eligible for Study
                        </h4>
                        <p className="text-sm text-gray-600">
                          {trial.criteria[0]?.age_from || "N/A"} -{" "}
                          {trial.criteria[0]?.age_to || "N/A"} Years
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Sexes Eligible for Study
                        </h4>
                        <p className="text-sm text-gray-600">
                          {trial.criteria[0]?.sex || "N/A"}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Subject Type
                        </h4>
                        <p className="text-sm text-gray-600">
                          {trial.criteria[0]?.subject_type || "N/A"}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Healthy Volunteers
                        </h4>
                        <p className="text-sm text-gray-600">
                          {trial.criteria[0]?.healthy_volunteers ===
                            "false"
                            ? "No"
                            : trial.criteria[0]?.healthy_volunteers ===
                              "true"
                              ? "Yes"
                              : "N/A"}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Target No of Volunteers
                        </h4>
                        <p className="text-sm text-gray-600">
                          {trial.criteria[0]?.target_no_volunteers ||
                            "N/A"}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Actual enrolled Volunteers
                        </h4>
                        <p className="text-sm text-gray-600">
                          {trial.criteria[0]
                            ?.actual_enrolled_volunteers || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timing Section */}
            {isSectionVisible("timing") && (
              <Card className="mt-6" ref={timingRef}>
                <div className="p-4 rounded-t-lg" style={{ backgroundColor: '#2B4863' }}>
                  <h2 className="text-lg font-semibold text-white">
                    Timing
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {/* Timing Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse table-auto min-w-[800px]">
                        <thead>
                          <tr className="text-white" style={{ backgroundColor: '#2B4863' }}>
                            <th className="border border-slate-400 px-4 py-3 text-left text-sm font-medium">
                              Category
                            </th>
                            <th className="border border-slate-400 px-4 py-3 text-left text-sm font-medium">
                              Start Date
                            </th>
                            <th className="border border-slate-400 px-4 py-3 text-left text-sm font-medium">
                              Inclusion Period(months)
                            </th>
                            <th className="border border-slate-400 px-4 py-3 text-left text-sm font-medium">
                              Enrolment closed date
                            </th>
                            <th className="border border-slate-400 px-4 py-3 text-left text-sm font-medium">
                              Treatment & Primary Outcome Measurement Duration
                              (months)
                            </th>
                            <th className="border border-slate-400 px-4 py-3 text-left text-sm font-medium">
                              Trial Completion date
                            </th>
                            <th className="border border-slate-400 px-4 py-3 text-left text-sm font-medium">
                              Duration to Publish Result (months)
                            </th>
                            <th className="border border-slate-400 px-4 py-3 text-left text-sm font-medium">
                              Result Published date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Actual Row */}
                          <tr className="bg-white">
                            <td className="border border-slate-300 px-4 py-3 text-sm font-medium">
                              Actual
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.start_date_actual)
                                ? formatDateToMMDDYYYY(trial.timing[0].start_date_actual)
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.inclusion_period_actual)
                                ? trial.timing[0].inclusion_period_actual
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.enrollment_closed_actual)
                                ? formatDateToMMDDYYYY(trial.timing[0].enrollment_closed_actual)
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.primary_outcome_duration_actual)
                                ? trial.timing[0].primary_outcome_duration_actual
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.trial_end_date_actual)
                                ? formatDateToMMDDYYYY(trial.timing[0].trial_end_date_actual)
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.result_duration_actual)
                                ? trial.timing[0].result_duration_actual
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.result_published_date_actual)
                                ? formatDateToMMDDYYYY(trial.timing[0].result_published_date_actual)
                                : "N/A"}
                            </td>
                          </tr>
                          {/* Benchmark Row */}
                          <tr className="bg-gray-50">
                            <td className="border border-slate-300 px-4 py-3 text-sm font-medium">
                              Benchmark
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.start_date_benchmark)
                                ? formatDateToMMDDYYYY(trial.timing[0].start_date_benchmark)
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.inclusion_period_benchmark)
                                ? trial.timing[0].inclusion_period_benchmark
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.enrollment_closed_benchmark)
                                ? formatDateToMMDDYYYY(trial.timing[0].enrollment_closed_benchmark)
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.primary_outcome_duration_benchmark)
                                ? trial.timing[0].primary_outcome_duration_benchmark
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.trial_end_date_benchmark)
                                ? formatDateToMMDDYYYY(trial.timing[0].trial_end_date_benchmark)
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.result_duration_benchmark)
                                ? trial.timing[0].result_duration_benchmark
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.result_published_date_benchmark)
                                ? formatDateToMMDDYYYY(trial.timing[0].result_published_date_benchmark)
                                : "N/A"}
                            </td>
                          </tr>
                          {/* Estimated Row */}
                          <tr className="bg-white">
                            <td className="border border-slate-300 px-4 py-3 text-sm font-medium">
                              Estimated
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.start_date_estimated)
                                ? formatDateToMMDDYYYY(trial.timing[0].start_date_estimated)
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.inclusion_period_estimated)
                                ? trial.timing[0].inclusion_period_estimated
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.enrollment_closed_estimated)
                                ? formatDateToMMDDYYYY(trial.timing[0].enrollment_closed_estimated)
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.primary_outcome_duration_estimated)
                                ? trial.timing[0].primary_outcome_duration_estimated
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.trial_end_date_estimated)
                                ? formatDateToMMDDYYYY(trial.timing[0].trial_end_date_estimated)
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.result_duration_estimated)
                                ? trial.timing[0].result_duration_estimated
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {isValidValue(trial.timing[0]?.result_published_date_estimated)
                                ? formatDateToMMDDYYYY(trial.timing[0].result_published_date_estimated)
                                : "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Statistics */}
                    <div className="flex items-center justify-center space-x-8">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          Overall duration to complete :
                        </span>
                        <Badge className="bg-green-600 text-white">
                          {isValidValue(trial.timing[0]?.overall_duration_complete)
                            ? trial.timing[0].overall_duration_complete
                            : "N/A"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          Overall duration to publish :
                        </span>
                        <Badge className="bg-green-600 text-white">
                          {isValidValue(trial.timing[0]?.overall_duration_publish)
                            ? trial.timing[0].overall_duration_publish
                            : "N/A"}
                        </Badge>
                      </div>
                    </div>

                    {/* Reference Section */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 mb-4">
                        Reference
                      </h3>

                      {/* Reference Grid */}
                      {(() => {
                        // Parse timing_references if it's a string
                        let timingReferences = trial.timing[0]?.timing_references;
                        if (typeof timingReferences === 'string') {
                          try {
                            timingReferences = JSON.parse(timingReferences);
                          } catch (e) {
                            console.warn('Failed to parse timing_references:', e);
                            timingReferences = null;
                          }
                        }

                        // Ensure it's an array and filter visible references
                        const visibleReferences = Array.isArray(timingReferences)
                          ? timingReferences.filter((ref: any) => ref.isVisible !== false && (ref.date || ref.content))
                          : [];

                        if (visibleReferences.length === 0) {
                          return (
                            <div className="text-sm text-gray-500 mb-6">
                              No references available
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {visibleReferences.map((ref: any, index: number) => {
                              const isExpanded = expandedReferences[index];
                              return (
                                <div
                                  key={ref.id || index}
                                  className={`border rounded-xl transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-white shadow-md' : 'bg-white'}`}
                                  style={{ borderColor: isExpanded ? '#2B4863' : '#E2E8F0' }}
                                >
                                  {/* Header Info */}
                                  <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100 font-medium px-3 py-1 text-xs">
                                        {ref.date ? formatDateToMMDDYYYY(ref.date) : "No date"}
                                      </Badge>
                                      <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100 font-medium px-3 py-1 text-xs">
                                        {ref.registryType || "No registry type"}
                                      </Badge>
                                    </div>
                                    <button
                                      onClick={() => toggleReference(index)}
                                      className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                                      style={{ backgroundColor: '#2B4863', color: 'white' }}
                                    >
                                      {isExpanded ? <X size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                                    </button>
                                  </div>

                                  {/* Expandable Content */}
                                  {isExpanded && (
                                    <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                      <div className="space-y-2 border-t pt-3">
                                        <div className="flex text-xs">
                                          <span className="font-bold text-[#2B4863] min-w-[150px]">Study Start (Actual) :</span>
                                          <span className="text-gray-700">
                                            {isValidValue(trial.timing[0]?.start_date_actual)
                                              ? formatDateToMMDDYYYY(trial.timing[0].start_date_actual)
                                              : "N/A"}
                                          </span>
                                        </div>
                                        <div className="flex text-xs">
                                          <span className="font-bold text-[#2B4863] min-w-[150px]">Primary Completion (Actual) :</span>
                                          <span className="text-gray-700">
                                            {isValidValue(trial.timing[0]?.enrollment_closed_actual)
                                              ? formatDateToMMDDYYYY(trial.timing[0].enrollment_closed_actual)
                                              : "N/A"}
                                          </span>
                                        </div>
                                        <div className="flex text-xs">
                                          <span className="font-bold text-[#2B4863] min-w-[150px]">Study Completion (Actual) :</span>
                                          <span className="text-gray-700">
                                            {isValidValue(trial.timing[0]?.trial_end_date_actual)
                                              ? formatDateToMMDDYYYY(trial.timing[0].trial_end_date_actual)
                                              : "N/A"}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 pt-2">
                                        <Button
                                          size="sm"
                                          className="h-8 px-4 text-xs font-medium text-white shadow-sm"
                                          style={{ backgroundColor: '#2B4863' }}
                                          onClick={() => ref.viewSource && openLinkPreview(ref.viewSource, "View Source")}
                                        >
                                          View source
                                        </Button>

                                        <div className="flex items-center h-8 rounded-md shadow-sm overflow-hidden">
                                          <Button
                                            size="sm"
                                            className="h-full px-3 text-xs font-medium text-white border-r border-[#ffffff33] rounded-none"
                                            style={{ backgroundColor: '#2B4863' }}
                                            onClick={() => {
                                              if (ref.attachments && ref.attachments.length > 0) {
                                                setSelectedRefForAttachments(ref);
                                              } else {
                                                toast({
                                                  title: "No attachments",
                                                  description: "No attachments available for this reference.",
                                                });
                                              }
                                            }}
                                          >
                                            Attachments
                                            <FileText className="ml-2 h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            className="h-full px-2 text-white rounded-none"
                                            style={{ backgroundColor: '#2B4863' }}
                                            onClick={() => {
                                              if (ref.attachments && ref.attachments.length > 0) {
                                                ref.attachments.forEach((attach: any) => {
                                                  if (attach.url) window.open(attach.url, '_blank');
                                                });
                                              } else if (ref.viewSource) {
                                                openLinkPreview(ref.viewSource, "View Source");
                                              } else {
                                                toast({
                                                  title: "Nothing to download",
                                                  description: "No files or source links available to download.",
                                                });
                                              }
                                            }}
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Outcome Section */}
            {isSectionVisible("outcome") && trial.results && trial.results.length > 0 && (
              <Card className="mt-6" ref={outcomeRef}>
                <div className="bg-[#C6EDFD] p-4 rounded-t-lg">
                  <h2 className="text-lg font-bold text-gray-800">
                    Outcome
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel: Results available & Outcome Status */}
                    <div className="lg:col-span-1 border border-gray-200 rounded-xl p-6 flex flex-col justify-center space-y-8">
                      <div className="flex items-center justify-between">
                        <span className="text-[15px] font-bold text-[#204B73]">
                          Results available
                        </span>
                        <Switch
                          checked={trial.results[0]?.results_available === true || trial.results[0]?.results_available === "true" || trial.results[0]?.results_available === "Yes"}
                        />
                      </div>

                      <div className="space-y-3">
                        <span className="text-[15px] font-bold text-[#204B73]">
                          Trial Outcome :
                        </span>
                        <div className="bg-[#22C55E] text-white px-4 py-2 rounded-md text-sm font-medium w-full text-center">
                          {trial.results[0]?.trial_outcome || "No outcome available"}
                          {(trial.results[0]?.endpoints_met === true || trial.results[0]?.endpoints_met === "true" || trial.results[0]?.endpoints_met === "Yes") && ", Primary endpoints met"}
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Outcome Reference Details */}
                    <div className="lg:col-span-2 border border-gray-200 rounded-xl p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[#204B73]">
                          Trial Outcome Reference
                        </h3>
                        {trial.results[0]?.trial_outcome_reference_date && (
                          <div className="bg-gray-100 text-gray-900 px-3 py-1 rounded text-sm font-bold">
                            {formatDateToMMDDYYYY(trial.results[0].trial_outcome_reference_date)}
                          </div>
                        )}
                      </div>

                      <p className="text-[#334155] text-[15px] leading-relaxed">
                        {trial.results[0]?.trial_outcome_content || trial.results[0]?.reference || "No reference content available."}
                      </p>

                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          className="bg-[#204B73] hover:bg-[#1a3d5e] text-white px-6 py-2 h-10 rounded-md text-sm font-medium"
                          onClick={() => trial.results[0]?.trial_outcome_link && openLinkPreview(trial.results[0].trial_outcome_link, "Outcome Link")}
                        >
                          View source
                        </Button>

                        <div className="flex rounded-md shadow-sm overflow-hidden">
                          <Button
                            className="bg-[#204B73] hover:bg-[#1a3d5e] text-white px-6 py-2 h-10 rounded-none text-sm font-medium flex items-center gap-2 border-r border-[#ffffff33]"
                            onClick={() => {
                              if (trial.results[0]?.trial_outcome_attachment) {
                                const attach = trial.results[0].trial_outcome_attachment;
                                const url = typeof attach === 'object' ? attach.url : attach;
                                if (url) {
                                  openLinkPreview(url, "Attachment");
                                }
                              } else {
                                toast({
                                  title: "No attachments",
                                  description: "No attachments available for this outcome.",
                                });
                              }
                            }}
                          >
                            Attachments
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            className="bg-[#204B73] hover:bg-[#1a3d5e] text-white px-3 py-2 h-10 rounded-none"
                            onClick={() => {
                              if (trial.results[0]?.trial_outcome_attachment) {
                                const attach = trial.results[0].trial_outcome_attachment;
                                const url = typeof attach === 'object' ? attach.url : attach;
                                const name = typeof attach === 'object' ? (attach.name || 'attachment') : 'attachment';
                                if (url) {
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = name;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other outcome details if they exist and are important */}
                  {(trial.results[0]?.trial_results && trial.results[0].trial_results.length > 0) ||
                    (trial.results[0]?.adverse_event_reported === "Yes" || trial.results[0]?.adverse_events_reported === true) ? (
                    <div className="mt-8 pt-6 border-t border-gray-100 space-y-6">
                      {trial.results[0]?.trial_results && trial.results[0].trial_results.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-3">Trial Results:</h4>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {trial.results[0].trial_results.map((result, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-blue-600 font-bold mt-0.5">•</span>
                                {result}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(trial.results[0]?.adverse_event_reported === "Yes" ||
                        trial.results[0]?.adverse_events_reported === true ||
                        trial.results[0]?.adverse_events_reported === "true" ||
                        trial.results[0]?.adverse_events_reported === "Yes") && (
                          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                              Adverse Event Information:
                            </h4>
                            {trial.results[0]?.adverse_event_type && (
                              <p className="text-sm text-gray-700 mb-1">
                                Type: <span className="font-medium">{trial.results[0].adverse_event_type}</span>
                              </p>
                            )}
                            {trial.results[0]?.treatment_for_adverse_events && (
                              <p className="text-sm text-gray-700">
                                Treatment: <span className="font-medium">{trial.results[0].treatment_for_adverse_events}</span>
                              </p>
                            )}
                          </div>
                        )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}


            {/* Published Results Section - Results Notes */}
            {isSectionVisible("publishedResults") && trial.results[0]?.site_notes && trial.results[0].site_notes.length > 0 && (
              <Card className="mt-6" ref={publishedResultsRef}>
                <div className="bg-sky-200 p-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Published Results
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {trial.results[0].site_notes
                      .filter((note: any) => note.isVisible !== false)
                      .map((note: any, index: number) => {
                        const noteDate = note.date ? formatDateToMMDDYYYY(note.date) : null;
                        const resultType = note.noteType || note.type || "N/A";
                        const source = note.sourceType || note.source || "N/A";
                        const content = note.content || "";

                        const isExpanded = expandedPublishedResults[index];

                        return (
                          <div key={index} className="bg-slate-700 rounded-lg overflow-hidden">
                            {/* Header */}
                            <div
                              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-600 transition-colors"
                              onClick={() => togglePublishedResult(index)}
                            >
                              <div className="flex items-center space-x-4 flex-wrap gap-2">
                                {noteDate && (
                                  <Badge className="bg-white text-slate-700 hover:bg-gray-100 font-bold">
                                    Date : {noteDate}
                                  </Badge>
                                )}
                                {resultType && resultType !== "N/A" && (
                                  <Badge className="bg-white text-slate-700 hover:bg-gray-100 font-bold">
                                    Result Type : {resultType}
                                  </Badge>
                                )}
                                {source && source !== "N/A" && (
                                  <Badge className="bg-white text-slate-700 hover:bg-gray-100 font-bold">
                                    Source : {source}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-white">
                                {isExpanded ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                              </div>
                            </div>

                            {/* Collapsible Content */}
                            {isExpanded && (
                              <div className="bg-white p-6 space-y-4">
                                {/* Content Text */}
                                {content && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-800 mb-2 font-bold">
                                      Content:
                                    </h4>
                                    <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">
                                      {content}
                                    </p>
                                  </div>
                                )}

                                {/* Adverse Event Information */}
                                {(note.adverse_event_reported || note.adverse_event_type || note.treatment_for_adverse_events) && (
                                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">
                                      Adverse Event Information:
                                    </h4>
                                    {note.adverse_event_reported && (
                                      <p className="text-sm text-black mb-1">
                                        Reported: <span className="font-semibold">{note.adverse_event_reported}</span>
                                      </p>
                                    )}
                                    {note.adverse_event_type && (
                                      <p className="text-sm text-black mb-1">
                                        Type: <span className="font-semibold">{note.adverse_event_type}</span>
                                      </p>
                                    )}
                                    {note.treatment_for_adverse_events && (
                                      <p className="text-sm text-black">
                                        Treatment: <span className="font-semibold">{note.treatment_for_adverse_events}</span>
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Attachments */}
                                {note.attachments && note.attachments.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">
                                      Attachments:
                                    </h4>
                                    <div className="space-y-2">
                                      {note.attachments.map((attachment: any, attachIndex: number) => {
                                        const fileUrl = typeof attachment === 'object' && attachment?.url ? attachment.url : (typeof attachment === 'string' ? attachment : null);
                                        const fileName = typeof attachment === 'object' && attachment?.name ? attachment.name : (typeof attachment === 'string' ? attachment : `Attachment ${attachIndex + 1}`);

                                        return (
                                          <div key={attachIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                                            <span className="text-sm text-gray-700 truncate flex-1 font-medium">{fileName}</span>
                                            {fileUrl && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-800 h-7 px-2 text-xs font-bold"
                                                onClick={() => openLinkPreview(fileUrl, fileName)}
                                              >
                                                View
                                              </Button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                  {source && source !== "N/A" && (
                                    <Button
                                      size="sm"
                                      className="bg-slate-600 hover:bg-slate-700 text-white font-bold h-9 px-4"
                                      onClick={() => {
                                        if (note.sourceType || note.source) {
                                          openLinkPreview(note.sourceType || note.source, "Source Link");
                                        }
                                      }}
                                    >
                                      View source
                                    </Button>
                                  )}
                                  {note.attachments && note.attachments.length > 0 && (
                                    <Button
                                      size="sm"
                                      className="bg-slate-600 hover:bg-slate-700 text-white font-bold h-9 px-4 flex items-center gap-2"
                                      onClick={() => setSelectedRefForAttachments({ attachments: note.attachments })}
                                    >
                                      Attachments
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    {(!trial.results[0].site_notes || trial.results[0].site_notes.filter((note: any) => note.isVisible !== false).length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        No published results available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sites Section */}
            {isSectionVisible("sites") && (
              <Card className="mt-6" ref={sitesRef}>
                <div className="bg-[#C6EDFD] px-6 py-4 rounded-t-xl border-b border-[#A2DDF9] flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1E293B]">Site Information</h2>
                  {trial.sites[0]?.total && (
                    <Badge className="bg-[#E2E8F0] text-[#475569] hover:bg-[#E2E8F0] font-bold px-4 py-1.5 rounded-lg text-sm border-none shadow-none">
                      Total No of Sites : {trial.sites[0].total}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Site Information Details */}
                    <div>

                      {trial.sites[0]?.notes ? (() => {
                        // Parse the notes JSON string
                        let siteNotes: any[] = [];
                        try {
                          const notesData = typeof trial.sites[0].notes === 'string'
                            ? JSON.parse(trial.sites[0].notes)
                            : trial.sites[0].notes;
                          siteNotes = Array.isArray(notesData) ? notesData : [];
                        } catch (e) {
                          console.error('Failed to parse site notes:', e);
                          siteNotes = [];
                        }

                        // Filter to show only visible notes
                        const visibleNotes = siteNotes.filter((note: any) => note.isVisible !== false);

                        if (visibleNotes.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <p className="text-sm text-gray-600">
                                No site notes available
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {visibleNotes.map((note: any, index: number) => {
                              const isExpanded = expandedSiteNotes[index];

                              return (
                                <Card key={note.id || index} className="border border-gray-100 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                                  <CardContent className="p-6 flex-1 flex flex-col">
                                    {/* Header Row: Date and Registry Badge */}
                                    <div className="flex items-center justify-between mb-5">
                                      <div className="flex items-center gap-2">
                                        {note.date && (
                                          <div className="bg-[#F1F5F9] text-[#475569] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap">
                                            {formatDateToMMDDYYYY(note.date)}
                                          </div>
                                        )}
                                        {note.registryType && (
                                          <div className="bg-[#F1F5F9] text-[#475569] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap">
                                            {note.registryType}
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => toggleSiteNote(index)}
                                        className="bg-[#204B73] text-white p-1 rounded-full hover:bg-[#1a3d5e] transition-colors shadow-sm flex-shrink-0"
                                      >
                                        {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                      </button>
                                    </div>

                                    {/* Body content */}
                                    <div className="flex-1 space-y-4">
                                      {note.content && (
                                        <div className="space-y-4">
                                          {note.content.split('\n').map((line: string, i: number) => {
                                            if (line.includes(':')) {
                                              const [label, value] = line.split(':');
                                              return (
                                                <div key={i} className="space-y-1">
                                                  <label className="text-[14px] text-[#64748B] block font-medium leading-tight">
                                                    {label.trim()} :
                                                  </label>
                                                  <span className="text-[16px] font-bold text-[#1E293B] block leading-snug">
                                                    {value.trim()}
                                                  </span>
                                                </div>
                                              );
                                            }
                                            return (
                                              <p key={i} className="text-[16px] font-bold text-[#204B73] leading-snug">
                                                {line}
                                              </p>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {isExpanded && (
                                        <div className="pt-4 space-y-3 border-t border-gray-50 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                          {note.attachments && Array.isArray(note.attachments) && note.attachments.length > 0 && (
                                            <div>
                                              <label className="text-[13px] text-[#64748B] block font-semibold mb-2">Attachments :</label>
                                              <div className="space-y-2">
                                                {note.attachments.map((attachment: any, attachIndex: number) => {
                                                  const fileUrl = typeof attachment === 'object' && attachment?.url ? attachment.url : attachment;
                                                  const fileName = typeof attachment === 'object' && attachment?.name ? attachment.name : `File ${attachIndex + 1}`;
                                                  return (
                                                    <div key={attachIndex} className="flex items-center gap-2 p-2 bg-[#F8FAFC] rounded-lg border border-gray-100">
                                                      <FileText className="h-4 w-4 text-[#204B73] flex-shrink-0" />
                                                      <span className="text-[13px] text-gray-700 truncate flex-1 font-medium">{fileName}</span>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-3 text-[12px] text-[#204B73] hover:text-blue-800 font-bold hover:bg-blue-50"
                                                        onClick={() => openLinkPreview(fileUrl, fileName)}
                                                      >
                                                        View
                                                      </Button>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Footer: View Source Button */}
                                    <div className="mt-6 flex justify-end">
                                      {note.viewSource && (
                                        <Button
                                          className="bg-[#204B73] hover:bg-[#1a3d5e] text-white px-6 py-2 h-10 rounded-md text-[14px] font-bold shadow-sm transition-all active:scale-95"
                                          onClick={() => openLinkPreview(note.viewSource, "Site Source")}
                                        >
                                          View source
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        );
                      })() : (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-600">
                            No site information available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Sources Section */}
            {isSectionVisible("otherSources") && (
              <Card className="mt-6" ref={otherSourcesRef}>
                <div className="bg-sky-200 p-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Other Sources
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {(() => { console.log("Rendering Other Sources - trial.other:", trial.other); return null; })()}

                    {/* Display Other Sources from step 5-7 */}
                    {trial.other && trial.other.length > 0 ? (
                      [...trial.other]
                        .sort((a, b) => {
                          const order = {
                            'pipeline_data': 1,
                            'press_releases': 2,
                            'publications': 3,
                            'trial_registries': 4,
                            'associated_studies': 5,
                            'legacy': 6
                          };

                          let typeA = 'legacy';
                          let typeB = 'legacy';

                          try {
                            const dataA = typeof a.data === 'string' ? JSON.parse(a.data) : a.data;
                            typeA = dataA.type || 'legacy';
                          } catch (e) { }

                          try {
                            const dataB = typeof b.data === 'string' ? JSON.parse(b.data) : b.data;
                            typeB = dataB.type || 'legacy';
                          } catch (e) { }

                          return (order[typeA as keyof typeof order] || 99) - (order[typeB as keyof typeof order] || 99);
                        })
                        .map((source, index) => {
                          // Parse the JSON data
                          let parsedData: any;
                          try {
                            parsedData = typeof source.data === 'string' ? JSON.parse(source.data) : source.data;
                            console.log(`Other Source ${index}:`, parsedData);
                          } catch (error) {
                            console.error(`Failed to parse source data:`, source.data);
                            // If not JSON, treat as plain text
                            parsedData = { type: 'legacy', data: source.data };
                          }

                          const isExpanded = expandedOtherSources[index];

                          // Helper function for header labels
                          const getTypeHeaderLabel = (data: any) => {
                            const type = data.type || 'legacy';
                            const labels: Record<string, string> = {
                              'pipeline_data': 'Pipeline Data',
                              'press_releases': 'Press Release',
                              'publications': 'Publication',
                              'trial_registries': 'Trial Registry',
                              'associated_studies': 'Associated Study',
                              'legacy': 'Other Source'
                            };

                            const label = labels[type] || 'Other Source';

                            if (type === 'trial_registries' && data.registry) return `Trial Registry : ${data.registry}`;
                            if (type === 'publications' && data.type && data.type !== 'publications') return `Publication : ${data.type}`;
                            if (type === 'associated_studies' && data.type && data.type !== 'associated_studies') return `Associated Study : ${data.type}`;

                            return label;
                          };

                          const Row = ({ label, value }: { label: string; value: any }) => (
                            <div className="flex text-xs py-1">
                              <span className="font-bold text-[#204B73] min-w-[150px]">{label} :</span>
                              <span className="text-gray-700 whitespace-pre-wrap">{value || "N/A"}</span>
                            </div>
                          );

                          return (
                            <div
                              key={index}
                              className={`border rounded-xl transition-all duration-300 overflow-hidden mb-4 ${isExpanded ? 'bg-white shadow-md' : 'bg-white'}`}
                              style={{ borderColor: isExpanded ? '#2B4863' : '#E2E8F0' }}
                            >
                              {/* Header */}
                              <div
                                className="p-4 flex items-center justify-between transition-colors"
                                style={{ backgroundColor: isExpanded ? '#2B4863' : 'transparent' }}
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className={`${isExpanded ? 'bg-white text-[#2B4863]' : 'bg-gray-100 text-gray-800'} hover:bg-gray-100 font-medium px-3 py-1 text-xs`}>
                                    Date : {parsedData.date ? formatDateToMMDDYYYY(parsedData.date) : "N/A"}
                                  </Badge>
                                  <Badge variant="secondary" className={`${isExpanded ? 'bg-white text-[#2B4863]' : 'bg-gray-100 text-gray-800'} hover:bg-gray-100 font-medium px-3 py-1 text-xs`}>
                                    {getTypeHeaderLabel(parsedData)}
                                  </Badge>
                                </div>
                                <button
                                  onClick={() => toggleOtherSource(index)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-sm"
                                  style={{
                                    backgroundColor: isExpanded ? 'white' : '#2B4863',
                                    color: isExpanded ? '#2B4863' : 'white'
                                  }}
                                >
                                  {isExpanded ? <Minus size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                                </button>
                              </div>

                              {/* Content */}
                              {isExpanded && (
                                <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="space-y-1 border-t pt-3">
                                    {parsedData.type === 'pipeline_data' && (
                                      <>
                                        <Row label="Pipeline Date" value={parsedData.date ? formatDateToMMDDYYYY(parsedData.date) : "N/A"} />
                                        <Row label="Information" value={parsedData.information} />
                                      </>
                                    )}

                                    {parsedData.type === 'press_releases' && (
                                      <>
                                        <Row label="Date" value={parsedData.date ? formatDateToMMDDYYYY(parsedData.date) : "N/A"} />
                                        <Row label="Title" value={parsedData.title} />
                                        <Row label="Description" value={parsedData.description} />
                                      </>
                                    )}

                                    {parsedData.type === 'publications' && (
                                      <>
                                        <Row label="Date" value={parsedData.date ? formatDateToMMDDYYYY(parsedData.date) : "N/A"} />
                                        <Row label="Title" value={parsedData.title} />
                                        <Row label="Publication Type" value={parsedData.publicationType || (parsedData.type !== 'publications' ? parsedData.type : "")} />
                                        <Row label="Description" value={parsedData.description} />
                                      </>
                                    )}

                                    {parsedData.type === 'trial_registries' && (
                                      <>
                                        <Row label="Registry Name" value={parsedData.registry} />
                                        <Row label="Registry Identifier" value={parsedData.identifier} />
                                        <Row label="Date" value={parsedData.date ? formatDateToMMDDYYYY(parsedData.date) : "N/A"} />
                                        <Row label="Description" value={parsedData.description} />
                                      </>
                                    )}

                                    {parsedData.type === 'associated_studies' && (
                                      <>
                                        <Row label="Study Type" value={parsedData.studyType || (parsedData.type !== 'associated_studies' ? parsedData.type : "")} />
                                        <Row label="Title" value={parsedData.title} />
                                        <Row label="Date" value={parsedData.date ? formatDateToMMDDYYYY(parsedData.date) : "N/A"} />
                                        <Row label="Description" value={parsedData.description} />
                                      </>
                                    )}

                                    {parsedData.type === 'legacy' && (
                                      <Row label="Data" value={parsedData.data} />
                                    )}
                                  </div>

                                  {/* Buttons */}
                                  <div className="flex items-center gap-2 pt-2">
                                    {parsedData.url && parsedData.url !== "N/A" && (
                                      <Button
                                        size="sm"
                                        className="h-8 px-4 text-xs font-medium text-white shadow-sm bg-[#204B73] hover:bg-[#204B73]/90"
                                        onClick={() => openLinkPreview(parsedData.url, "View Source")}
                                      >
                                        View source
                                      </Button>
                                    )}

                                    {(parsedData.fileUrl || (parsedData.url && (parsedData.url.includes('utfs.io') || parsedData.url.includes('edgestore')))) && (
                                      <div className="flex items-center h-8 rounded-md shadow-sm overflow-hidden bg-[#204B73]">
                                        <Button
                                          size="sm"
                                          className="h-full px-3 text-xs font-medium text-white border-r border-[#ffffff33] rounded-none bg-transparent hover:bg-white/10"
                                          onClick={() => {
                                            const url = parsedData.fileUrl || parsedData.url;
                                            if (url) window.open(url, '_blank');
                                          }}
                                        >
                                          Attachments
                                          <FileText className="ml-2 h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="h-full px-2 text-white rounded-none bg-transparent hover:bg-white/10"
                                          onClick={() => {
                                            const url = parsedData.fileUrl || parsedData.url;
                                            if (url) {
                                              const link = document.createElement('a');
                                              link.href = url;
                                              link.download = parsedData.file || 'attachment';
                                              link.click();
                                            }
                                          }}
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-600">
                          No other sources available
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Logs Section */}
            {isSectionVisible("logs") && (
              <Card className="mt-6 border border-gray-200 shadow-sm overflow-hidden" ref={logsRef}>
                <div className="bg-[#D7EFFF] px-4 py-2 flex items-center justify-between">
                  <h2 className="text-[17px] font-bold text-gray-800">Logs</h2>
                  <div className="flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-4 py-1.5 text-sm font-medium text-gray-600 border-r border-gray-200">
                      Alert
                    </div>
                    <div className="px-3 py-1.5 text-[#2B4863]">
                      <Bell size={18} fill="#2B4863" className="opacity-80" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 bg-white">
                  <div className="flex flex-wrap gap-x-24 gap-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#204B73]">Trial added Date :</span>
                      <span className="text-[15px] text-gray-700">
                        {trial?.logs && trial.logs.length > 0 && trial.logs[0].trial_added_date
                          ? formatDateToMMDDYYYY(trial.logs[0].trial_added_date)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#204B73]">Last Modified Date :</span>
                      <span className="text-[15px] text-gray-700">
                        {trial?.logs && trial.logs.length > 0 && trial.logs[0].last_modified_date
                          ? formatDateToMMDDYYYY(trial.logs[0].last_modified_date)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Toaster />

      {/* Backend View Modal */}
      <Dialog open={showBackendView} onOpenChange={setShowBackendView}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Backend View - Trial {trial?.trial_id}</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Raw Data
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (trial) {
                      navigator.clipboard.writeText(JSON.stringify(trial, null, 2));
                      toast({
                        title: "Copied to Clipboard",
                        description: "Trial data has been copied to clipboard.",
                      });
                    }
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Copy JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (trial) {
                      const dataStr = JSON.stringify(trial, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                      const exportFileDefaultName = `trial_${trial.trial_id}_backend_data.json`;
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                      toast({
                        title: "Download Complete",
                        description: "Trial backend data has been downloaded.",
                      });
                    }
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Download
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {trial ? (
              <div className="space-y-4">
                {/* Trial Overview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Trial Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Trial ID:</span> {trial.trial_id}
                    </div>
                    <div>
                      <span className="font-medium">Title:</span> {trial.overview.title}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {trial.overview.status}
                    </div>
                    <div>
                      <span className="font-medium">Phase:</span> {trial.overview.trial_phase}
                    </div>
                    <div>
                      <span className="font-medium">Therapeutic Area:</span> {trial.overview.therapeutic_area}
                    </div>
                    <div>
                      <span className="font-medium">Disease Type:</span> {trial.overview.disease_type}
                    </div>
                  </div>
                </div>

                {/* Raw JSON Data */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Raw Trial Data (JSON)</h3>
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96">
                    {JSON.stringify(trial, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No trial data available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Trial Sections</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select which sections to display:
            </p>
            <div className="space-y-3">
              {[
                { id: "overview", label: "Overview" },
                { id: "objectives", label: "Objectives" },
                { id: "treatmentPlan", label: "Treatment Plan" },
                { id: "patientDescription", label: "Patient Description" },
                { id: "timing", label: "Timing" },
                { id: "outcome", label: "Outcome" },
                { id: "publishedResults", label: "Published Results" },
                { id: "sites", label: "Sites" },
                { id: "otherSources", label: "Other Sources" },
                { id: "logs", label: "Logs" },
              ].map((section) => (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={
                      filteredSections.length === 0 ||
                      filteredSections.includes(section.id)
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilteredSections((prev) =>
                          prev.includes(section.id)
                            ? prev
                            : [...prev, section.id]
                        );
                      } else {
                        setFilteredSections((prev) =>
                          prev.filter((id) => id !== section.id)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={section.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {section.label}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFilteredSections([]);
                  setShowFilterDialog(false);
                }}
              >
                Clear All
              </Button>
              <Button
                onClick={() => {
                  applySectionFilter(filteredSections);
                }}
              >
                Apply Filter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Record History - Trial {trial?.trial_id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Trial Change Log */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Trial Change Log</h3>
              <div className="space-y-3">
                {trial?.logs &&
                  trial.logs.length > 0 ? (
                  trial.logs.map((log, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-800">
                          Change #{index + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.trial_added_date
                            ? formatDateToMMDDYYYY(log.trial_added_date)
                            : "N/A"}
                        </span>
                      </div>
                      <p className="text-sm text-black mb-2">
                        {log.trial_changes_log}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Last Modified:</span>{" "}
                          {log.last_modified_date
                            ? new Date(
                              log.last_modified_date
                            ).toLocaleDateString()
                            : "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Modified By:</span>{" "}
                          {log.last_modified_user || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Reviewed By:</span>{" "}
                          {log.full_review_user || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Next Review:</span>{" "}
                          {log.next_review_date
                            ? new Date(
                              log.next_review_date
                            ).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No change history available for this trial
                  </div>
                )}
              </div>
            </div>

            {/* Trial Notes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Trial Notes</h3>
              <div className="space-y-3">
                {trial?.notes &&
                  trial.notes.length > 0 ? (
                  trial.notes.map((note: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-blue-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-800">
                          Note #{index + 1} - {note.date_type}
                        </span>
                      </div>
                      <p className="text-sm text-black mb-2 whitespace-pre-wrap">{note.notes}</p>
                      {note.link && (
                        <a
                          href={note.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View Link
                        </a>
                      )}
                      {note.attachments && Array.isArray(note.attachments) && note.attachments.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-gray-600">
                            Attachments:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {note.attachments.map((attachment: any, attachIndex: number) => (
                              <Badge
                                key={attachIndex}
                                variant="outline"
                                className="text-xs"
                              >
                                {attachment}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No notes available for this trial
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  // Export history data
                  const historyData = {
                    trial_id: trial?.trial_id,
                    logs: trial?.logs || [],
                    notes: trial?.notes || [],
                    exported_at: new Date().toISOString(),
                  };

                  const dataStr = JSON.stringify(historyData, null, 2);
                  const dataBlob = new Blob([dataStr], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `trial_${trial?.trial_id}_history.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  toast({
                    title: "History Exported",
                    description: "Trial history has been exported successfully",
                  });
                }}
              >
                Export History
              </Button>
              <Button onClick={() => setShowHistoryModal(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Trial Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Choose your preferred export format:
            </p>

            <div className="space-y-3">
              <Button
                onClick={exportAsPDF}
                disabled={isExporting}
                className="w-full justify-start h-16 text-left"
                variant="outline"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Export as PDF</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      {isExporting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Generating PDF...
                        </>
                      ) : (
                        "Complete trial document with all sections"
                      )}
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={exportAsJSON}
                disabled={isExporting}
                className="w-full justify-start h-16 text-left"
                variant="outline"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm6 2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Export as JSON</div>
                    <div className="text-sm text-gray-500">
                      Raw trial data for integration or analysis
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attachments View Modal */}
      <Dialog open={!!selectedRefForAttachments} onOpenChange={(open) => !open && setSelectedRefForAttachments(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reference Attachments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRefForAttachments?.attachments && selectedRefForAttachments.attachments.length > 0 ? (
              <div className="space-y-2">
                {selectedRefForAttachments.attachments.map((attach: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#2B4863]" />
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                        {attach.name || `Attachment ${idx + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 h-8"
                        onClick={() => attach.url && window.open(attach.url, '_blank')}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 h-8"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = attach.url;
                          link.download = attach.name || 'attachment';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No attachments found
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              style={{ backgroundColor: '#2B4863' }}
              onClick={() => setSelectedRefForAttachments(null)}
              className="text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

