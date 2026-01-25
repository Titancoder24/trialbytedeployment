"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { formatDateToMMDDYYYY } from "@/lib/date-utils";
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
import NotesSection, { NoteItem } from "@/components/notes-section";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { TrialSidebar } from "@/components/trial-sidebar";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslation } from "react-i18next";

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
  PlusCircle,
  Minus,
  Loader2,
  ChevronDown,
  LogOut,
  Bell,
  Pencil,
  Folder,
  Bookmark,
  Calendar,
} from "lucide-react";
import { Suspense } from "react";
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
    results_available?: boolean;
    endpoints_met?: boolean;
    result_posted?: boolean;
    result_date?: string;
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

function ClinicalTrialsPage() {
  const pathname = usePathname();
  const [trials, setTrials] = useState<TherapeuticTrial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  // Removed local state for endpointsMet and resultPosted - now using API data directly
  const [activeSection, setActiveSection] = useState("overview");
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filteredSections, setFilteredSections] = useState<string[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedOtherSources, setExpandedOtherSources] = useState<Record<number, boolean>>({ 0: true });
  const [expandedTimingRefs, setExpandedTimingRefs] = useState<Record<number, boolean>>({ 0: true }); // First card expanded by default
  const [zoomLevel, setZoomLevel] = useState(100); // Zoom level in percentage
  const [favoriteTrials, setFavoriteTrials] = useState<string[]>([]); // Favorite trials from localStorage

  // Modal states for View Source and Attachments
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteTrials');
    if (savedFavorites) {
      try {
        setFavoriteTrials(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error parsing saved favorites:', error);
      }
    }
  }, []);

  // Toggle favorite for current trial
  const toggleFavorite = (trialId: string) => {
    setFavoriteTrials(prev => {
      const newFavorites = prev.includes(trialId)
        ? prev.filter(id => id !== trialId)
        : [...prev, trialId];
      localStorage.setItem('favoriteTrials', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const toggleOtherSource = (index: number) => {
    setExpandedOtherSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { openLinkPreview } = useLinkPreview();
  const { t } = useTranslation();

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
  // Helper function to fetch from API
  const fetchFromAPI = useCallback(async (showLoading: boolean) => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/therapeutic/all-trials-with-data`;

      if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
        throw new Error("API base URL is not configured. Please check your environment variables.");
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response is not JSON, use the status text
        }
        throw new Error(errorMessage);
      }

      const data: ApiResponse = await response.json();

      // Cache the response for faster subsequent loads
      const cacheKey = 'trials_cache';
      const cacheTimestampKey = 'trials_cache_timestamp';
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        sessionStorage.setItem(cacheTimestampKey, Date.now().toString());
      } catch (e) {
        // Ignore storage errors
      }

      setTrials(data.trials);
      if (showLoading) {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching from API:", error);
      if (showLoading) {
        throw error;
      }
    }
  }, []);

  // Fetch trials data with caching for performance
  const fetchTrials = useCallback(async () => {
    try {
      setLoading(true);

      // Check cache first for instant loading
      const cacheKey = 'trials_cache';
      const cacheTimestampKey = 'trials_cache_timestamp';
      const cachedData = sessionStorage.getItem(cacheKey);
      const cachedTimestamp = sessionStorage.getItem(cacheTimestampKey);
      const cacheMaxAge = 30 * 60 * 1000; // 30 minutes cache for blazing fast loads

      // Use cached data if available and fresh
      if (cachedData && cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp, 10);
        if (age < cacheMaxAge) {
          const data = JSON.parse(cachedData);
          setTrials(data.trials);
          setLoading(false);
          // Refresh in background (don't await)
          fetchFromAPI(false);
          return;
        }
      }

      await fetchFromAPI(true);
    } catch (error) {
      console.error("Error fetching trials:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch trials data";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchFromAPI, toast]);

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

    // Navigate to home page
    router.push("/");
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

  // Handle refresh/reload trial data
  const handleRefresh = async () => {
    toast({
      title: "Refreshing",
      description: "Reloading trial data...",
    });

    try {
      await fetchTrials();
      toast({
        title: "Refreshed",
        description: "Trial data has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh trial data. Please try again.",
        variant: "destructive",
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

      const currentTrial = trials[currentTrialIndex];
      const fileName = `trial_${currentTrial?.trial_id || "export"}_${new Date().toISOString().split("T")[0]
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
    const currentTrial = trials[currentTrialIndex];
    if (currentTrial) {
      const exportData = {
        trial_id: currentTrial.trial_id,
        overview: currentTrial.overview,
        outcomes: currentTrial.outcomes,
        criteria: currentTrial.criteria,
        timing: currentTrial.timing,
        results: currentTrial.results,
        sites: currentTrial.sites,
        other: currentTrial.other,
        exported_at: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trial_${currentTrial.trial_id}_export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "JSON Export Complete",
        description: `Trial data has been exported to trial_${currentTrial.trial_id}_export.json`,
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

  // Handle closing a trial tab
  const handleCloseTab = (indexToClose: number) => {
    if (trials.length <= 1) {
      toast({
        title: "Cannot Close",
        description: "At least one trial must remain open",
        variant: "destructive",
      });
      return;
    }

    // Remove the trial from the trials array
    const updatedTrials = trials.filter((_, index) => index !== indexToClose);
    setTrials(updatedTrials);

    // Adjust current trial index if necessary
    if (indexToClose === currentTrialIndex) {
      // If closing the current tab, switch to the previous tab or first tab
      const newIndex = indexToClose > 0 ? indexToClose - 1 : 0;
      setCurrentTrialIndex(newIndex);

      // Update URL with new trial ID
      if (updatedTrials[newIndex]) {
        router.push(
          `/user/clinical_trial/trials?trialId=${updatedTrials[newIndex].trial_id}`,
          { scroll: false }
        );
      }
    } else if (indexToClose < currentTrialIndex) {
      // If closing a tab before the current one, decrease current index
      setCurrentTrialIndex(currentTrialIndex - 1);
    }
    // If closing a tab after the current one, no index adjustment needed

    toast({
      title: "Tab Closed",
      description: `Trial ${trials[indexToClose].overview.trial_identifier[0] ||
        trials[indexToClose].trial_id
        } has been closed`,
    });
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
  }, [trials.length]); // Re-run when trials load

  // Fetch trials on component mount and handle URL parameters
  useEffect(() => {
    const loadTrials = async () => {
      try {
        setLoading(true);

        // Check cache first for instant loading
        const cacheKey = 'trials_cache';
        const cacheTimestampKey = 'trials_cache_timestamp';
        const cachedData = sessionStorage.getItem(cacheKey);
        const cachedTimestamp = sessionStorage.getItem(cacheTimestampKey);
        const cacheMaxAge = 30 * 60 * 1000; // 30 minutes cache

        let allTrials: TherapeuticTrial[] = [];

        // Use cached data if available and fresh
        if (cachedData && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp, 10);
          if (age < cacheMaxAge) {
            const data = JSON.parse(cachedData);
            allTrials = data.trials;
          }
        }

        // If no cache or stale, fetch from API
        if (allTrials.length === 0) {
          await fetchFromAPI(true);
          const freshData = sessionStorage.getItem(cacheKey);
          if (freshData) {
            allTrials = JSON.parse(freshData).trials;
          }
        }

        // Get trial IDs from URL - only show these trials
        const trialIdParam = searchParams.get("trialId");
        const trialIdsParam = searchParams.get("trialIds");

        let targetTrialIds: string[] = [];

        if (trialIdsParam) {
          // Multiple trials: ?trialIds=id1,id2,id3
          targetTrialIds = trialIdsParam.split(',').filter(id => id.trim());
        } else if (trialIdParam) {
          // Single trial: ?trialId=xxx
          targetTrialIds = [trialIdParam];
        }

        if (targetTrialIds.length > 0 && allTrials.length > 0) {
          // Filter to only show the requested trials
          const filteredTrials = allTrials.filter(trial =>
            targetTrialIds.includes(trial.trial_id)
          );

          if (filteredTrials.length > 0) {
            setTrials(filteredTrials);
            setCurrentTrialIndex(0);
          } else {
            // If specified trial not found, show message
            toast({
              title: "Trial not found",
              description: "The requested trial(s) could not be found.",
              variant: "destructive",
            });
            // Redirect to dashboard
            router.push('/user/clinical_trial/dashboard');
          }
        } else if (allTrials.length > 0 && targetTrialIds.length === 0) {
          // No trial ID specified in URL - redirect to dashboard
          toast({
            title: "No trial selected",
            description: "Please select a trial from the dashboard.",
          });
          router.push('/user/clinical_trial/dashboard');
        }
      } catch (error) {
        console.error("Error loading trials:", error);
        toast({
          title: "Error",
          description: "Failed to load trial data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTrials();
  }, [searchParams]);

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

  // Handle keyboard shortcuts for tab management
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+W or Cmd+W to close current tab
      if ((event.ctrlKey || event.metaKey) && event.key === "w") {
        event.preventDefault();
        if (trials.length > 1) {
          handleCloseTab(currentTrialIndex);
        }
      }
      // Ctrl+Shift+W or Cmd+Shift+W to close all other tabs
      else if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "W"
      ) {
        event.preventDefault();
        if (trials.length > 1) {
          const currentTrial = trials[currentTrialIndex];
          setTrials([currentTrial]);
          setCurrentTrialIndex(0);
          router.push(
            `/user/clinical_trial/trials?trialId=${currentTrial.trial_id}`,
            { scroll: false }
          );
          toast({
            title: "Tabs Closed",
            description: "All other tabs have been closed (Ctrl+Shift+W)",
          });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [trials, currentTrialIndex, router]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Completed: "bg-blue-600 text-white",
      Active: "bg-green-600 text-white",
      Planned: "bg-yellow-600 text-white",
      Suspended: "bg-red-600 text-white",
    };
    return colors[status] || "bg-gray-600 text-white";
  };

  // Memoize current trial to prevent unnecessary recalculations
  const currentTrial = useMemo(() => trials[currentTrialIndex], [trials, currentTrialIndex]);
  const countries = useMemo(() => currentTrial?.overview.countries?.split(", ") || [], [currentTrial?.overview.countries]);

  // Loading state with skeleton UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header skeleton */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              <div className="h-8 w-40 bg-gray-200 rounded"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex gap-6">
          {/* Sidebar skeleton */}
          <div className="w-64 bg-white rounded-lg p-4 shadow-sm animate-pulse">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-5 w-5 bg-gray-200 rounded"></div>
                  <div className="h-4 w-28 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Main content skeleton */}
          <div className="flex-1">
            <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
              <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading trials data...</span>
        </div>
      </div>
    );
  }

  // No trials state
  if (!trials.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No trials available</p>
          <Button onClick={fetchTrials} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!currentTrial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Trial not found</p>
          <Button onClick={() => setCurrentTrialIndex(0)} variant="outline">
            Go to first trial
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 overflow-x-hidden ${isMaximized ? "fixed inset-0 z-50 overflow-auto" : ""
        }`}
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {/* Top Navigation */}
      <div
        className="sticky top-0 z-40"
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

          {/* Trials Search Box */}
          <button
            onClick={() => {
              router.push("/user/clinical_trial/dashboard");
            }}
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
              src="/pngs/trialsearchicon.png"
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
              backgroundColor: pathname.includes("/trials") ? "#204B73" : "#FFFFFF",
              boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Image
              src="/pngs/trialsicon.png"
              alt="Trials"
              width={20}
              height={20}
              className="object-contain"
              style={{
                filter: pathname.includes("/trials") ? "brightness(0) invert(1)" : "none",
              }}
            />
            <span
              style={{
                fontFamily: "Poppins",
                fontWeight: 400,
                fontStyle: "normal",
                fontSize: "14px",
                lineHeight: "150%",
                letterSpacing: "-2%",
                color: pathname.includes("/trials") ? "#FFFFFF" : "#000000",
              }}
            >
              Trials
            </span>
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

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

      {/* Container for gradient and content overlay */}
      <div className="relative" style={{ width: "calc(100% - 64px)", margin: "0 auto" }}>
        {/* Blue Gradient Background - Full height overlay */}
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
            pointerEvents: "none",
          }}
        />

        {/* Secondary Navigation - On top of gradient */}
        <div
          className="sticky top-[82px] z-30"
          style={{
            paddingTop: "10px",
          }}
        >
          {/* First Row - Navigation Controls */}
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left Section - Navigation and Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="flex items-center hover:bg-transparent h-8 px-2"
                style={{
                  fontFamily: "Poppins",
                  fontSize: "14px",
                  color: "#2B4863",
                }}
                onClick={() => router.back()}
              >
                <ChevronLeft className="h-4 w-4 mr-1 text-black" />
                {t("common.back")}
              </Button>
              {/* Separator line */}
              <div style={{ width: "1.5px", height: "20px", backgroundColor: "#7FCFF2" }} />
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-transparent h-8 px-2"
                style={{
                  fontFamily: "Poppins",
                  fontSize: "14px",
                  color: "#424242",
                }}
                onClick={() => router.forward()}
              >
                {t("common.forward")}
              </Button>
              {/* TrialByte button with logo */}
              <div
                className="flex items-center justify-center px-8 py-1 rounded-lg"
                style={{
                  backgroundColor: "#ffffff",
                }}
              >
                <Image src="/pngs/companyname.png" alt="TrialByte" width={70} height={14} className="object-contain" style={{ paddingTop: "3px" }} />
              </div>
            </div>

            {/* Right Section - Action Buttons and Icons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryModal(true)}
                className="h-8 rounded-[12px] px-7 py-5 text-[14px] font-semibold"
              >
                <Calendar className="h-4 w-4" />
                {t("common.recordHistory")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportModal(true)}
                className="h-8 rounded-[12px] px-7 py-5 text-[14px] font-semibold"
              >
                <Image src="/pngs/exporticon.png" alt="Export" width={16} height={16} />
                {t("common.export")}
              </Button>
            </div>
          </div>



          {/* Third Row - Right Side Icon Buttons */}
          <div className="flex items-center justify-end px-6 pb-0 gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${currentTrial && favoriteTrials.includes(currentTrial.trial_id) ? 'text-yellow-500' : ''}`}
              title={currentTrial && favoriteTrials.includes(currentTrial.trial_id) ? "Remove from favorites" : "Add to favorites"}
              onClick={() => {
                if (currentTrial) {
                  toggleFavorite(currentTrial.trial_id);
                  toast({
                    title: favoriteTrials.includes(currentTrial.trial_id) ? "Removed from Favorites" : "Added to Favorites",
                    description: favoriteTrials.includes(currentTrial.trial_id)
                      ? "Trial has been removed from your favorites"
                      : "Trial has been added to your favorites",
                  });
                }
              }}
            >
              <Bookmark className={`h-4 w-4 ${currentTrial && favoriteTrials.includes(currentTrial.trial_id) ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex items-center justify-center"
              title="Document"
            >
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold leading-none">A</span>
                <span className="text-[8px] leading-none">a</span>
              </div>
            </Button>
            {/* Zoom Controls - Styled Button Group */}
            <div
              className="flex items-center rounded-md overflow-hidden"
              style={{ border: "1.5px solid #204B73" }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-6 p-0 rounded-none hover:bg-transparent"
                style={{ color: "#204B73", borderRight: "1.5px solid #204B73" }}
                title="Decrease font size"
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
              >
                <Minus className="h-4 w-4" strokeWidth={2} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-8 p-0 rounded-none flex items-inherit justify-center hover:bg-transparent cursor-default"
                style={{ color: "#204B73", borderRight: "1.5px solid #204B73", gap: '0.01rem' }}
                title={`Font size: ${zoomLevel}%`}
              >
                <span className="text-lg font-semibold" style={{ color: "#204B73" }}>A</span>
                <span className="text-xs font-semibold" style={{ color: "#204B73" }}>A</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-6 p-0 rounded-none hover:bg-transparent"
                style={{ color: "#204B73" }}
                title="Increase font size"
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>
            {/* Language Selector */}
            <LanguageSelector />
          </div>
        </div>

        {/* Content Container - Overlaying the gradient */}
        <div
          className="flex relative"
          style={{
            marginTop: "-60px",
            zIndex: 20,
            position: "relative",
          }}
        >
          {/* Left Sidebar - CSS-based with icons */}
          <TrialSidebar
            activeSection={activeSection}
            onSectionClick={scrollToSection}
            isSectionVisible={isSectionVisible}
            onAssociatedStudiesClick={() => {
              // Scroll to Other Sources section which contains Associated Studies
              scrollToSection("otherSources");
              toast({
                title: "Associated Studies",
                description: "Scrolled to Other Sources section containing Associated Studies.",
              });
            }}
            onLogsClick={() => {
              if (currentTrial.logs && currentTrial.logs.length > 0) {
                const logMessages = currentTrial.logs
                  .map((log) => log.trial_changes_log)
                  .join("\n");
                toast({
                  title: "Trial Logs",
                  description: logMessages,
                });
              } else {
                toast({
                  title: "No Logs Available",
                  description: "No log entries found for this trial.",
                });
              }
            }}
          />


          {/* Main Content - with left margin to account for sidebar */}
          <div className="flex-1" style={{ marginLeft: "288.33px", maxWidth: "calc(100% - 288.33px)" }}>
            {/* Trial Content */}
            <div className={`${isMinimized ? "p-2" : "p-6"} overflow-x-hidden margin`} style={{ marginTop: "65px", zoom: zoomLevel / 100, transformOrigin: "top left" }} data-export-content>
              {/* Trial Tabs - Attached to Header */}
              <div
                className="px-4 py-3 flex items-center"
                style={{
                  borderRadius: "12px 12px 0 0",
                  overflowX: "auto",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div className="flex items-center" style={{ marginBottom: "-8px" }}>
                  {trials.map((trial, index) => (
                    <div key={trial.trial_id} className="flex items-center">
                      {/* Selected Tab - Outer blue box with inner white box */}
                      {index === currentTrialIndex ? (
                        <div
                          className="flex items-start bg-[#204B73] rounded-t-xl px-2 pt-2 pb-0"
                          style={{
                            marginBottom: "-12px",
                            paddingBottom: "11px",
                            position: "relative",
                            zIndex: 10,
                          }}
                        >
                          <div
                            className="flex items-center rounded-lg px-4 py-2"
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.18)",
                              fontFamily: "Poppins",
                              fontSize: "14px",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <button
                              onClick={() => {
                                setCurrentTrialIndex(index);
                                router.push(
                                  `/user/clinical_trial/trials?trialId=${trial.trial_id}`,
                                  { scroll: false }
                                );
                              }}
                              className="flex items-center text-white"
                            >
                              <span>
                                {trial.overview?.trial_id || trial.trial_id.slice(0, 12)}
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloseTab(index);
                              }}
                              className="ml-2 rounded-full p-1 transition-colors flex items-center justify-center bg-white hover:bg-gray-100"
                              title="Close this trial tab"
                            >
                              <X className="h-4 w-4 text-[#204B73]" strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Unselected Tab */
                        <div
                          className="relative flex items-center transition-all cursor-pointer text-[#204B73] hover:opacity-80 px-4 py-2"
                          style={{
                            fontFamily: "Poppins",
                            fontSize: "14px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <button
                            onClick={() => {
                              setCurrentTrialIndex(index);
                              router.push(
                                `/user/clinical_trial/trials?trialId=${trial.trial_id}`,
                                { scroll: false }
                              );
                            }}
                            className="flex items-center"
                          >
                            <span>
                              {trial.overview?.trial_id || trial.trial_id.slice(0, 12)}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseTab(index);
                            }}
                            className="ml-2 rounded-full p-1 transition-colors flex items-center justify-center bg-[#204B73] hover:bg-[#204B73]/80"
                            title="Close this trial tab"
                          >
                            <X className="h-4 w-4 text-white" strokeWidth={2} />
                          </button>
                        </div>
                      )}
                      {/* Separator line - hide if current or next tab is selected */}
                      {index !== currentTrialIndex && index + 1 !== currentTrialIndex && index < trials.length - 1 && (
                        <div
                          className="mx-2"
                          style={{
                            backgroundColor: "rgba(32, 75, 115, 0.3)",
                            width: "1.5px",
                            height: "2.5rem",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trial Header */}
              <div className="bg-[#204B73] text-white rounded-md p-3">
                <div className="flex items-start space-x-4">
                  <Image src="/pngs/redicon.png" alt="Trial Icon" width={38} height={38} className="object-contain" style={{ marginLeft: "40px", marginTop: "6px" }} />
                  <div className="flex-1">
                    <h1 className="font-semibold mb-2 leading-relaxed text-[18px]">
                      {currentTrial.overview.title}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Overview Section */}
              {isSectionVisible("overview") && (
                <Card className="rounded-t-md overflow-hidden mt-6" ref={overviewRef}>
                  {/* Overview Header Bar */}
                  <div
                    className="flex items-center justify-between px-8 py-4 rounded-tl-md rounded-tr-md"
                    style={{ backgroundColor: "#C3E9FB" }}
                  >
                    {/* Left side - Overview title, separator, Status */}
                    <div className="flex items-center">
                      <span
                        style={{
                          fontFamily: "Poppins",
                          fontSize: "18px",
                          fontWeight: 900,
                          color: "#000000ff",
                        }}
                      >
                        Overview
                      </span>
                      {/* Separator line */}
                      <div
                        className="self-stretch"
                        style={{
                          width: "2px",
                          backgroundColor: "#A1BDD6",
                          marginLeft: "20px",
                          marginRight: "20px",
                          marginTop: "-16px",
                          marginBottom: "-16px",
                        }}
                      />
                      <div className="flex items-center space-x-2">
                        <span
                          style={{
                            fontFamily: "Poppins",
                            fontSize: "14px",
                            fontWeight: 900,
                            color: "#204B73",
                          }}
                        >
                          Status :
                        </span>
                        <Badge
                          className="rounded px-3 py-2 flex items-center gap-1"
                          style={{
                            backgroundColor: "#2874A6",
                            color: "#ffffff",
                            fontFamily: "Poppins",
                            fontSize: "13px",
                            fontWeight: 900,
                          }}
                        >
                          {currentTrial.overview.status}
                          <Image src="/pngs/statusvalueicon.png" alt="info" width={14} height={14} className="ml-1" />
                        </Badge>
                      </div>
                    </div>
                    {/* Right side - Endpoints and Result Posted */}
                    <div className="flex items-center space-x-10">
                      <div className="flex items-center space-x-3">
                        <span style={{ fontFamily: "Poppins", fontSize: "14px", color: "#2B4863", fontWeight: 600 }}>
                          Endpoints met
                        </span>
                        <Switch
                          checked={Boolean(currentTrial.results[0]?.endpoints_met)}
                          disabled={true}
                          className="data-[state=checked]:bg-green-500 scale-100"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <span style={{ fontFamily: "Poppins", fontSize: "14px", color: "#2B4863", fontWeight: 600 }}>
                          Result Posted
                        </span>
                        {/* Non-interactive badges showing result posted status */}
                        <div className="flex items-center overflow-hidden rounded-sm border-[1.5px] border-black">
                          <Badge
                            className="px-2.5 py-1 rounded-none cursor-default"
                            style={{
                              backgroundColor: currentTrial.results[0]?.result_posted ? "#22c55e" : "#ffffff",
                              color: currentTrial.results[0]?.result_posted ? "#ffffff" : "#374151",
                              fontFamily: "Poppins",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRight: "1.5px solid #000000",
                              borderRadius: 0,
                            }}
                          >
                            Yes
                          </Badge>
                          <Badge
                            className="px-2.5 py-1 rounded-none cursor-default"
                            style={{
                              backgroundColor: !currentTrial.results[0]?.result_posted ? "#6b7280" : "#f3f4f6",
                              color: !currentTrial.results[0]?.result_posted ? "#ffffff" : "#374151",
                              fontFamily: "Poppins",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRadius: 0,
                            }}
                          >
                            No
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overview Content - Background image */}
                  <CardContent
                    className="p-6"
                    style={{
                      backgroundImage: "url('/pngs/overviewbg.png')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {/* Therapeutic Area and Trial Identifiers */}
                    <div className="mb-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          style={{
                            fontFamily: "Poppins",
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#ffffff",
                          }}
                        >
                          Therapeutic Area :
                        </span>
                        <Badge
                          className="rounded px-3 py-1"
                          style={{
                            backgroundColor: "#ffffff",
                            color: "#204B73",
                            fontFamily: "Poppins",
                            fontSize: "15px",
                            fontWeight: 600,
                          }}
                        >
                          {currentTrial.overview.therapeutic_area}
                        </Badge>
                      </div>
                      <div>
                        <span
                          style={{
                            fontFamily: "Poppins",
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#ffffff",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        >
                          Trial Identifier :
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            // Normalize trial_identifier - handle both string and array
                            const identifiers = currentTrial.overview.trial_identifier;
                            const normalizedIds: string[] = Array.isArray(identifiers)
                              ? identifiers
                              : typeof identifiers === 'string'
                                ? identifiers.split(',').map((id: string) => id.trim()).filter(Boolean)
                                : [];
                            return normalizedIds.map((identifier, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-white text-black rounded-[6px]"
                                style={{
                                  fontFamily: "Poppins",
                                  fontSize: "13px",
                                  fontWeight: 400,
                                  padding: "6px 12px",
                                }}
                              >
                                {identifier}
                              </Badge>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Scientific Title Section - White background */}
                  <CardContent className="p-6 bg-white">
                    {/* Scientific Title */}
                    <div
                      className="mb-6 p-4 rounded-lg"
                      style={{ border: "1px solid #E0E0E0" }}
                    >
                      <h3 className="text-lg font-semibold text-[#204B73] mb-3">
                        Scientific Title
                      </h3>
                      <p
                        className="text-gray-700 text-sm leading-relaxed"
                        style={{ fontFamily: "Poppins" }}
                      >
                        {currentTrial.outcomes[0]?.purpose_of_trial ||
                          "No scientific title available"}
                      </p>
                    </div>

                    {/* Summary */}
                    <div
                      className="mb-8 p-4 rounded-lg"
                      style={{ border: "1px solid #E0E0E0" }}
                    >
                      <h3 className="text-lg font-semibold text-[#204B73] mb-3">
                        Summary
                      </h3>
                      <p
                        className="text-gray-700 text-sm leading-relaxed"
                        style={{ fontFamily: "Poppins" }}
                      >
                        {currentTrial.outcomes[0]?.summary ||
                          "No summary available"}
                      </p>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      {/* Left Column - Key Information */}
                      <div
                        className="p-4 rounded-lg"
                        style={{ border: "1px solid #E0E0E0" }}
                      >
                        <h3 className="text-lg font-semibold text-[#204B73] mb-4">
                          Key Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-medium text-gray-600 min-w-[100px] flex-shrink-0" style={{ fontFamily: "Poppins" }}>
                              Disease Type :
                            </span>
                            <span className="text-sm text-gray-700 text-right" style={{ fontFamily: "Poppins" }}>
                              {currentTrial.overview.disease_type || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-medium text-gray-600 min-w-[100px] flex-shrink-0" style={{ fontFamily: "Poppins" }}>
                              Patient Segment :
                            </span>
                            <span className="text-sm text-gray-700 text-right" style={{ fontFamily: "Poppins" }}>
                              {currentTrial.overview.patient_segment || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-medium text-gray-600 min-w-[100px] flex-shrink-0" style={{ fontFamily: "Poppins" }}>
                              Primary Drug :
                            </span>
                            <span className="text-sm text-gray-700 text-right" style={{ fontFamily: "Poppins" }}>
                              {currentTrial.overview.primary_drugs || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-medium text-gray-600 min-w-[100px] flex-shrink-0" style={{ fontFamily: "Poppins" }}>
                              Secondary Drug :
                            </span>
                            <span className="text-sm text-gray-700 text-right" style={{ fontFamily: "Poppins" }}>
                              {currentTrial.overview.other_drugs || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-medium text-gray-600 min-w-[100px] flex-shrink-0" style={{ fontFamily: "Poppins" }}>
                              Trial Phase :
                            </span>
                            <Badge className="bg-green-600 text-white" style={{ fontFamily: "Poppins" }}>
                              Phase {currentTrial.overview.trial_phase || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Line of Therapy */}
                      <div
                        className="p-4 rounded-lg"
                        style={{ border: "1px solid #E0E0E0" }}
                      >
                        <h3 className="text-lg font-semibold text-[#204B73] mb-4">
                          Line of Therapy
                        </h3>
                        <div className="space-y-2">
                          {currentTrial.overview.line_of_therapy ? (
                            currentTrial.overview.line_of_therapy.split(',').map((therapy, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="text-blue-600">•</span>
                                <span className={`text-sm ${index === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`} style={{ fontFamily: "Poppins" }}>
                                  {therapy.trim()}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500" style={{ fontFamily: "Poppins" }}>
                              No line of therapy information available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Countries Section */}
                    <div
                      className="mb-8 p-4 rounded-lg"
                      style={{ border: "1px solid #E0E0E0" }}
                    >
                      <h3 className="text-lg font-semibold text-[#204B73] mb-4">
                        Countries
                      </h3>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {countries.length > 0 ? (
                          countries.map((country, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-gray-700 bg-[#F0F0F0] rounded-[6px] px-2 py-1 text-[14px] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 cursor-pointer"
                            >
                              {country.trim()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-black">
                            No countries specified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Additional Information Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Column - Details */}
                      <div
                        className="space-y-4 p-4 rounded-lg"
                        style={{ border: "1px solid #E0E0E0" }}
                      >
                        <div>
                          <span className="text-sm font-medium text-[#204B73]">
                            Region :
                          </span>
                          <span className="text-sm text-gray-700 ml-2" style={{ fontFamily: "Poppins" }}>
                            {currentTrial.overview.region || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[#204B73]" style={{ fontFamily: "Poppins" }}>
                            Sponsors & Collaborators :
                          </span>
                          <span className="text-sm text-gray-700 ml-2" style={{ fontFamily: "Poppins" }}>
                            {currentTrial.overview.sponsor_collaborators || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[#204B73]" style={{ fontFamily: "Poppins" }}>
                            Sponsor Field of Activity :
                          </span>
                          <span className="text-sm text-gray-700 ml-2" style={{ fontFamily: "Poppins" }}>
                            {currentTrial.overview.sponsor_field_activity ||
                              "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[#204B73]" style={{ fontFamily: "Poppins" }}>
                            Associated CRO :
                          </span>
                          <span className="text-sm text-gray-700 ml-2" style={{ fontFamily: "Poppins" }}>
                            {currentTrial.overview.associated_cro || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[#204B73]" style={{ fontFamily: "Poppins" }}>
                            Trial Tags :
                          </span>
                          <span className="text-sm text-gray-700 ml-2" style={{ fontFamily: "Poppins" }}>
                            {currentTrial.overview.trial_tags || "N/A"}
                          </span>
                        </div>

                        {/* Source Links */}
                        <div className="pt-4">
                          <span className="text-sm font-medium text-[#204B73] block mb-2" style={{ fontFamily: "Poppins" }}>
                            Source Links :
                          </span>
                          <div className="space-y-1">
                            {currentTrial.overview.reference_links &&
                              currentTrial.overview.reference_links.length > 0 ? (
                              currentTrial.overview.reference_links.map(
                                (link, index) => (
                                  <div key={index}>
                                    <span className="text-blue-600 text-xs">
                                      •
                                    </span>
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 text-xs ml-1 hover:underline"
                                      style={{ fontFamily: "Poppins" }}
                                    >
                                      {link}
                                    </a>
                                  </div>
                                )
                              )
                            ) : (
                              <span className="text-sm text-gray-600" style={{ fontFamily: "Poppins" }}>
                                No source links available
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <span className="text-sm font-medium text-[#204B73]">
                            Trial Record Status :
                          </span>
                          <span className="text-sm text-gray-700">
                            {currentTrial.overview.trial_record_status || "N/A"}
                          </span>
                          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                        </div>
                      </div>

                      {/* Right Column - Europe Map */}
                      <div
                        className="flex justify-center items-center p-4 rounded-lg"
                        style={{ border: "1px solid #E0E0E0" }}
                      >
                        <div className="relative w-full max-w-xs">
                          <Image
                            src="/europe.png"
                            alt="Europe Map"
                            width={300}
                            height={300}
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Objectives Section */}
              {isSectionVisible("objectives") && (
                <Card key={`${currentTrial.trial_id}-objectives`} className="mt-6" ref={objectivesRef}>
                  <div className="bg-sky-200 p-4 rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Objectives
                    </h2>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {/* Purpose of the trial */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-[#204B73] mb-3">
                        Purpose of the trial
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {currentTrial.outcomes[0]?.purpose_of_trial ||
                          "No purpose description available"}
                      </p>
                    </div>

                    {/* Primary Outcome */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-[#204B73] mb-4">
                        Primary Outcome
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-semibold text-[#204B73]">
                            Outcome Measure :
                          </span>
                          <p className="text-sm text-gray-700 mt-1">
                            {currentTrial.outcomes[0]?.primary_outcome_measure ||
                              "No primary outcome measure available"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#204B73]">
                            Measure Description :
                          </span>
                          <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                            {currentTrial.outcomes[0]?.summary ||
                              "No measure description available"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#204B73]">
                            Time Frame :
                          </span>
                          <p className="text-sm text-gray-700 mt-1">
                            {currentTrial.timing[0]?.primary_completion_date ||
                              currentTrial.timing[0]?.study_duration ||
                              "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Other Outcomes - Parse and display as separate numbered cards */}
                    {(() => {
                      const otherOutcomes = currentTrial.outcomes[0]?.other_outcome_measure;

                      // If no other outcomes, don't show anything
                      if (!otherOutcomes || otherOutcomes.trim() === '') {
                        return null;
                      }

                      // Try to parse multiple outcomes from the string
                      // Common patterns: "Outcome Measure: X Time Frame: Y" repeated
                      // Split by "Outcome Measure:" to get individual outcomes
                      const outcomeText = otherOutcomes.trim();

                      // Try to split by patterns like "Outcome Measure:" 
                      let outcomes: string[] = [];

                      // Check if text contains multiple "Outcome Measure:" patterns
                      if (outcomeText.toLowerCase().includes('outcome measure:')) {
                        // Split by "Outcome Measure:" but keep it for parsing
                        const parts = outcomeText.split(/(?=Outcome Measure:)/gi).filter(p => p.trim());
                        outcomes = parts.length > 0 ? parts : [outcomeText];
                      } else {
                        // Single outcome - treat entire text as one outcome
                        outcomes = [outcomeText];
                      }

                      return (
                        <>
                          {outcomes.map((outcome, index) => {
                            // Parse measure description and time frame if present
                            let measureText = outcome;
                            let description = "";
                            let timeFrame = "";

                            // Try to extract parts if they follow a pattern
                            const measureMatch = outcome.match(/Outcome Measure:\s*([^]*?)(?:Measure Description:|Time Frame:|$)/i);
                            const descMatch = outcome.match(/Measure Description:\s*([^]*?)(?:Time Frame:|$)/i);
                            const timeMatch = outcome.match(/Time Frame:\s*([^]*?)$/i);

                            if (measureMatch) measureText = measureMatch[1].trim();
                            if (descMatch) description = descMatch[1].trim();
                            if (timeMatch) timeFrame = timeMatch[1].trim();

                            return (
                              <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <h3 className="text-base font-semibold text-[#204B73] mb-4">
                                  Other Outcome : {index + 1}
                                </h3>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-sm font-semibold text-[#204B73]">
                                      Outcome Measure :
                                    </span>
                                    <p className="text-sm text-gray-700 mt-1">
                                      {measureText || outcome}
                                    </p>
                                  </div>
                                  {description && (
                                    <div>
                                      <span className="text-sm font-semibold text-[#204B73]">
                                        Measure Description :
                                      </span>
                                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                        {description}
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-sm font-semibold text-[#204B73]">
                                      Time Frame :
                                    </span>
                                    <p className="text-sm text-gray-700 mt-1">
                                      {timeFrame || currentTrial.timing[0]?.study_end_date ||
                                        currentTrial.timing[0]?.study_duration ||
                                        "Not specified"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Treatment Plan Section */}
              {isSectionVisible("treatmentPlan") && (
                <Card key={`${currentTrial.trial_id}-treatmentPlan`} className="mt-6" ref={treatmentPlanRef}>
                  <div className="bg-sky-200 p-4 rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Treatment Plan
                    </h2>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {/* Study Design Keywords - Bordered Card */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-[#204B73] mb-4">
                        Study Design Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentTrial.outcomes[0]?.study_design_keywords ? (
                          currentTrial.outcomes[0].study_design_keywords
                            .split(",")
                            .map((keyword, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-[#F0F0F0] text-gray-700 border-gray-300 px-4 py-1.5 rounded-md"
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

                    {/* Study Design - Bordered Card */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-[#204B73] mb-4">
                        Study Design
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <span className="text-sm font-semibold text-[#204B73] min-w-[180px] flex-shrink-0">
                            Primary Purpose :
                          </span>
                          <span className="text-sm text-gray-700">
                            {currentTrial.outcomes[0]?.purpose_of_trial?.split(' ').slice(0, 3).join(' ') || "Treatment"}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-semibold text-[#204B73] min-w-[180px] flex-shrink-0">
                            Allocation :
                          </span>
                          <span className="text-sm text-gray-700">
                            {currentTrial.outcomes[0]?.study_design_keywords?.toLowerCase().includes('randomized') ? 'Randomized' :
                              currentTrial.outcomes[0]?.study_design_keywords?.toLowerCase().includes('non-randomized') ? 'Non-Randomized' : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-semibold text-[#204B73] min-w-[180px] flex-shrink-0">
                            Interventional Model :
                          </span>
                          <span className="text-sm text-gray-700">
                            {currentTrial.outcomes[0]?.study_design_keywords?.toLowerCase().includes('parallel') ? 'Parallel Assignment' :
                              currentTrial.outcomes[0]?.study_design_keywords?.toLowerCase().includes('single group') ? 'Single Group Assignment' :
                                currentTrial.outcomes[0]?.study_design_keywords?.toLowerCase().includes('crossover') ? 'Crossover Assignment' : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-semibold text-[#204B73] min-w-[180px] flex-shrink-0">
                            Masking :
                          </span>
                          <span className="text-sm text-gray-700">
                            {currentTrial.outcomes[0]?.study_design_keywords?.toLowerCase().includes('open') ? 'None (Open Label)' :
                              currentTrial.outcomes[0]?.study_design_keywords?.toLowerCase().includes('double') ? 'Double Blind' :
                                currentTrial.outcomes[0]?.study_design_keywords?.toLowerCase().includes('single') && currentTrial.outcomes[0]?.study_design_keywords?.toLowerCase().includes('blind') ? 'Single Blind' : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-4 leading-relaxed">
                        {currentTrial.outcomes[0]?.summary ||
                          currentTrial.outcomes[0]?.study_design ||
                          "No detailed study design description available"}
                      </p>
                    </div>

                    {/* Treatment Regimen - Bordered Card */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-[#204B73] mb-4">
                        Treatment Regimen
                      </h3>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {currentTrial.outcomes[0]?.treatment_regimen ||
                            "No treatment regimen description available"}
                        </p>
                      </div>
                    </div>

                    {/* Number of Arms - Outside cards */}
                    <div className="pt-2">
                      <span className="text-sm text-gray-700">
                        Number of arms: {currentTrial.outcomes[0]?.number_of_arms || "N/A"}
                      </span>
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Left Column - Criteria (takes 2/3 width) */}
                      <div className="lg:col-span-2 space-y-4">
                        {/* Inclusion Criteria - Bordered Card */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="text-base font-semibold text-[#204B73] mb-4">
                            Inclusion Criteria
                          </h3>
                          {currentTrial.criteria[0]?.inclusion_criteria ? (
                            <ul className="space-y-2">
                              {currentTrial.criteria[0].inclusion_criteria
                                .split(/[•\n]/)
                                .filter((item: string) => item.trim())
                                .map((item: string, index: number) => (
                                  <li key={index} className="flex items-start text-sm text-gray-700">
                                    <span className="text-gray-500 mr-2 mt-0.5">•</span>
                                    <span>{item.trim()}</span>
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <span className="text-sm text-gray-600">
                              No inclusion criteria available
                            </span>
                          )}
                        </div>

                        {/* Exclusion Criteria - Bordered Card */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="text-base font-semibold text-[#204B73] mb-4">
                            Exclusion Criteria
                          </h3>
                          {currentTrial.criteria[0]?.exclusion_criteria ? (
                            <ul className="space-y-2">
                              {currentTrial.criteria[0].exclusion_criteria
                                .split(/[•\n]/)
                                .filter((item: string) => item.trim())
                                .map((item: string, index: number) => (
                                  <li key={index} className="flex items-start text-sm text-gray-700">
                                    <span className="text-gray-500 mr-2 mt-0.5">•</span>
                                    <span>{item.trim()}</span>
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <span className="text-sm text-gray-600">
                              No exclusion criteria available
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Column - Patient Details (takes 1/3 width) */}
                      <div className="space-y-3">
                        <div className="rounded-lg p-4 bg-[#F3F3F3]">
                          <h4 className="text-sm font-bold text-[#204B73] mb-1">
                            Ages Eligible for Study
                          </h4>
                          <p className="text-sm text-gray-700">
                            {currentTrial.criteria[0]?.age_from || "18"} Years
                          </p>
                        </div>

                        <div className="rounded-lg p-4 bg-[#F3F3F3]">
                          <h4 className="text-sm font-bold text-[#204B73] mb-1">
                            Sexes Eligible for Study
                          </h4>
                          <p className="text-sm text-gray-700">
                            {currentTrial.criteria[0]?.sex || "Both"}
                          </p>
                        </div>

                        <div className="rounded-lg p-4 bg-[#F3F3F3]">
                          <h4 className="text-sm font-bold text-[#204B73] mb-1">
                            Subject Type
                          </h4>
                          <p className="text-sm text-gray-700">
                            {currentTrial.criteria[0]?.subject_type ||
                              currentTrial.overview.disease_type ||
                              "N/A"}
                          </p>
                        </div>

                        <div className="rounded-lg p-4 bg-[#F3F3F3]">
                          <h4 className="text-sm font-bold text-[#204B73] mb-1">
                            Healthy Volunteers
                          </h4>
                          <p className="text-sm text-gray-700">
                            {currentTrial.criteria[0]?.healthy_volunteers === "false"
                              ? "No"
                              : currentTrial.criteria[0]?.healthy_volunteers === "true"
                                ? "Yes"
                                : "No"}
                          </p>
                        </div>

                        <div className="rounded-lg p-4 bg-[#F3F3F3]">
                          <h4 className="text-sm font-bold text-[#204B73] mb-1">
                            Target No of Volunteers
                          </h4>
                          <p className="text-sm text-gray-700">
                            {currentTrial.criteria[0]?.target_no_volunteers || "N/A"}
                          </p>
                        </div>

                        <div className="rounded-lg p-4 bg-[#F3F3F3]">
                          <h4 className="text-sm font-bold text-[#204B73] mb-1">
                            Actual enrolled Volunteers
                          </h4>
                          <p className="text-sm text-gray-700">
                            {currentTrial.criteria[0]?.actual_enrolled_volunteers || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timing Section */}
              {isSectionVisible("timing") && (
                <Card key={`${currentTrial.trial_id}-timing`} className="mt-6" ref={timingRef}>
                  <div className="bg-sky-200 p-4 rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Timing
                    </h2>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Timing Table - Full columns */}
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full border-collapse table-auto text-sm">
                          <thead>
                            <tr className="bg-[#204B73] text-white">
                              <th className="border border-[#1a3d5c] px-3 py-3 text-center font-medium">
                                Category
                              </th>
                              <th className="border border-[#1a3d5c] px-3 py-3 text-center font-medium">
                                Start Date
                              </th>
                              <th className="border border-[#1a3d5c] px-3 py-3 text-center font-medium">
                                Inclusion<br />Period(months)
                              </th>
                              <th className="border border-[#1a3d5c] px-3 py-3 text-center font-medium">
                                Enrolment<br />closed date
                              </th>
                              <th className="border border-[#1a3d5c] px-3 py-3 text-center font-medium">
                                Treatment & Primary<br />Outcome Measurement<br />Duration (months)
                              </th>
                              <th className="border border-[#1a3d5c] px-3 py-3 text-center font-medium">
                                Trial<br />Completion<br />date
                              </th>
                              <th className="border border-[#1a3d5c] px-3 py-3 text-center font-medium">
                                Duration to<br />Publish Result<br />(months)
                              </th>
                              <th className="border border-[#1a3d5c] px-3 py-3 text-center font-medium">
                                Result<br />Published<br />date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white">
                              <td className="border border-gray-300 px-3 py-3 text-center font-medium">
                                Actual
                              </td>
                              <td className="border border-gray-300 px-3 py-3 text-center">
                                {currentTrial.timing[0]?.start_date_estimated
                                  ? formatDateToMMDDYYYY(currentTrial.timing[0].start_date_estimated)
                                  : "N/A"}
                              </td>
                              <td className="border border-gray-300 px-3 py-3 text-center">
                                {currentTrial.timing[0]?.inclusion_period_months || "N/A"}
                              </td>
                              <td className="border border-gray-300 px-3 py-3 text-center">
                                {currentTrial.timing[0]?.enrolment_closed_date
                                  ? formatDateToMMDDYYYY(currentTrial.timing[0].enrolment_closed_date)
                                  : "N/A"}
                              </td>
                              <td className="border border-gray-300 px-3 py-3 text-center">
                                {currentTrial.timing[0]?.treatment_duration_months || "N/A"}
                              </td>
                              <td className="border border-gray-300 px-3 py-3 text-center">
                                {currentTrial.timing[0]?.trial_end_date_estimated
                                  ? formatDateToMMDDYYYY(currentTrial.timing[0].trial_end_date_estimated)
                                  : "N/A"}
                              </td>
                              <td className="border border-gray-300 px-3 py-3 text-center">
                                {currentTrial.timing[0]?.duration_to_publish_months || "N/A"}
                              </td>
                              <td className="border border-gray-300 px-3 py-3 text-center">
                                {currentTrial.results[0]?.result_date
                                  ? formatDateToMMDDYYYY(currentTrial.results[0].result_date)
                                  : "N/A"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Overall Duration Stats */}
                      <div className="flex items-center justify-end space-x-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700 italic">
                            Overall duration to Complete :
                          </span>
                          <Badge className="bg-[#28B463] text-white px-2 py-0.5 text-xs rounded">
                            {currentTrial.timing[0]?.overall_duration_months || "N/A"}
                          </Badge>
                          <span className="text-xs text-gray-500">(months)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700 italic">
                            Overall duration to publish result :
                          </span>
                          <Badge className="bg-[#28B463] text-white px-2 py-0.5 text-xs rounded">
                            {currentTrial.timing[0]?.duration_to_publish_months || "N/A"}
                          </Badge>
                          <span className="text-xs text-gray-500">(months)</span>
                        </div>
                      </div>

                      {/* Reference Section */}
                      <div>
                        <h3 className="text-base font-semibold text-[#204B73] mb-4">
                          Reference
                        </h3>
                        <div className="flex gap-4 overflow-x-auto pb-4">
                          {(() => {
                            // Get source type from URL
                            const getSourceType = (url: string) => {
                              if (url.includes('clinicaltrials.gov')) return 'CT.gov';
                              if (url.includes('pubmed') || url.includes('ncbi.nlm.nih.gov')) return 'PubMed';
                              if (url.includes('euclinicaltrials') || url.includes('clinicaltrialsregister.eu')) return 'EUCTR';
                              if (url.includes('who.int')) return 'WHO';
                              return 'Source';
                            };

                            const referenceLinks = currentTrial.overview.reference_links || [];

                            // If no reference links, don't show anything
                            if (referenceLinks.length === 0) {
                              return null;
                            }

                            return referenceLinks.map((link, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 min-w-[320px] flex-shrink-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-700">
                                      {currentTrial.results[0]?.result_date
                                        ? formatDateToMMDDYYYY(currentTrial.results[0].result_date)
                                        : "N/A"}
                                    </span>
                                    <span className="text-sm font-medium text-gray-700 bg-[#F0F0F0] px-3 py-1 rounded border border-gray-200">
                                      {getSourceType(link)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setExpandedTimingRefs(prev => ({ ...prev, [index]: !prev[index] }))}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${expandedTimingRefs[index]
                                      ? 'bg-gray-400 text-white'
                                      : 'bg-[#28B463] text-white'
                                      }`}
                                  >
                                    {expandedTimingRefs[index] ? (
                                      <X className="h-3 w-3" />
                                    ) : (
                                      <Plus className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                                {expandedTimingRefs[index] && (
                                  <>
                                    <div className="space-y-1 text-sm text-gray-600 mt-3">
                                      <p>
                                        <span className="text-[#204B73] font-medium">Study Start (Actual) :</span>{" "}
                                        {currentTrial.timing[0]?.start_date_estimated
                                          ? formatDateToMMDDYYYY(currentTrial.timing[0].start_date_estimated)
                                          : "N/A"}
                                      </p>
                                      <p>
                                        <span className="text-[#204B73] font-medium">Primary Completion (Actual) :</span>{" "}
                                        {currentTrial.timing[0]?.trial_end_date_estimated
                                          ? formatDateToMMDDYYYY(currentTrial.timing[0].trial_end_date_estimated)
                                          : "N/A"}
                                      </p>
                                      <p>
                                        <span className="text-[#204B73] font-medium">Study Completion (Actual) :</span>{" "}
                                        {currentTrial.timing[0]?.trial_end_date_estimated
                                          ? formatDateToMMDDYYYY(currentTrial.timing[0].trial_end_date_estimated)
                                          : "N/A"}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-4">
                                      <Button variant="outline" size="sm" className="bg-[#204B73] text-white hover:bg-[#1a3d5c] rounded-lg text-xs" onClick={() => { setSourceUrl(link); setShowSourceModal(true); }}>
                                        View source
                                      </Button>
                                      <Button variant="outline" size="sm" className="bg-[#204B73] text-white hover:bg-[#1a3d5c] rounded-lg text-xs" onClick={() => { setAttachmentUrl(link); setShowAttachmentsModal(true); }}>
                                        <FileText className="h-3 w-3 mr-1" />
                                        Attachments
                                      </Button>
                                      <Button variant="ghost" size="sm" className="text-[#204B73] p-1 h-auto" onClick={() => window.open(link, '_blank')}>
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Outcome Section */}
              {isSectionVisible("outcome") && (
                <Card key={`${currentTrial.trial_id}-outcome`} className="mt-6" ref={outcomeRef}>
                  <div className="bg-sky-200 p-4 rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Outcome
                    </h2>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - Results Available and Trial Outcome */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        {/* Results Available Toggle */}
                        <div className="flex items-center space-x-3 mb-6">
                          <span className="text-sm font-medium text-gray-700">
                            Results available
                          </span>
                          <Switch
                            checked={Boolean(currentTrial.results[0]?.results_available)}
                            disabled
                            className="data-[state=checked]:bg-[#28B463]"
                          />
                        </div>

                        {/* Trial Outcome */}
                        <div>
                          <span className="text-sm font-medium text-gray-700 block mb-2">
                            Trial Outcome :
                          </span>
                          <Badge className="bg-[#28B463] text-white px-3 py-1.5 text-xs rounded-lg">
                            {currentTrial.results[0]?.trial_outcome ||
                              "No outcome available"}
                          </Badge>
                        </div>
                      </div>

                      {/* Right Column - Trial Outcome Reference */}
                      <div className="lg:col-span-2 border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-[#204B73]">
                            Trial Outcome Reference
                          </h3>
                          <span className="text-sm text-gray-700 bg-[#F0F0F0] px-4 py-1.5 rounded-lg border border-gray-300">
                            {currentTrial.results[0]?.result_date
                              ? formatDateToMMDDYYYY(currentTrial.results[0].result_date)
                              : currentTrial.timing[0]?.trial_end_date_estimated
                                ? formatDateToMMDDYYYY(currentTrial.timing[0].trial_end_date_estimated)
                                : currentTrial.logs[0]?.trial_added_date
                                  ? formatDateToMMDDYYYY(currentTrial.logs[0].trial_added_date)
                                  : "N/A"}
                          </span>
                        </div>

                        {(() => {
                          const refText = currentTrial.results[0]?.reference || currentTrial.outcomes[0]?.summary || "";
                          // Don't show if it's just a date or empty
                          const isJustDate = /^\d{4}-\d{2}-\d{2}$/.test(refText.trim()) || /^\d{2}\/\d{2}\/\d{4}$/.test(refText.trim());
                          if (refText && !isJustDate) {
                            return (
                              <p className="text-sm text-gray-700 leading-relaxed mb-6">
                                {refText}
                              </p>
                            );
                          }
                          return null;
                        })()}

                        {/* Action Buttons - Right aligned */}
                        <div className="flex items-center justify-end space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-[#204B73] text-white hover:bg-[#1a3d5c] rounded-lg px-4"
                            onClick={() => {
                              // Try multiple sources for the URL
                              const refLink = currentTrial.overview.reference_links?.[0]
                                || currentTrial.notes?.[0]?.link
                                || currentTrial.results?.[0]?.reference
                                || `https://clinicaltrials.gov/study/${currentTrial.overview.trial_identifier?.[0] || currentTrial.trial_id}`;
                              setSourceUrl(refLink);
                              setShowSourceModal(true);
                            }}
                          >
                            View source
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-[#204B73] text-white hover:bg-[#1a3d5c] rounded-lg px-4"
                            onClick={() => {
                              // Try multiple sources for the URL
                              const refLink = currentTrial.overview.reference_links?.[0]
                                || currentTrial.notes?.[0]?.link
                                || currentTrial.results?.[0]?.reference
                                || `https://clinicaltrials.gov/study/${currentTrial.overview.trial_identifier?.[0] || currentTrial.trial_id}`;
                              setAttachmentUrl(refLink);
                              setShowAttachmentsModal(true);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Attachments
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#204B73] border border-gray-300 rounded-lg"
                            onClick={() => {
                              const refLink = currentTrial.overview.reference_links?.[0]
                                || currentTrial.notes?.[0]?.link
                                || currentTrial.results?.[0]?.reference
                                || `https://clinicaltrials.gov/study/${currentTrial.overview.trial_identifier?.[0] || currentTrial.trial_id}`;
                              if (refLink) window.open(refLink, '_blank');
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Published Results Section */}
              {isSectionVisible("publishedResults") && (
                <Card key={`${currentTrial.trial_id}-publishedResults`} className="mt-6" ref={publishedResultsRef}>
                  <div className="bg-sky-200 p-4 rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Published Results
                    </h2>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {currentTrial.results && currentTrial.results.length > 0 ? (
                        currentTrial.results.map((result, index) => (
                          <div key={result.id || index} className="bg-slate-700 rounded-lg overflow-hidden">
                            {/* Header */}
                            <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-wrap gap-2">
                                {result.result_date && (
                                  <Badge className="bg-white text-slate-700 hover:bg-gray-100">
                                    Date : {formatDateToMMDDYYYY(result.result_date)}
                                  </Badge>
                                )}
                                <Badge className="bg-white text-slate-700 hover:bg-gray-100">
                                  Result Type : {result.trial_outcome || "N/A"}
                                </Badge>
                                {result.reference && (
                                  <Badge className="bg-white text-slate-700 hover:bg-gray-100">
                                    Source : {result.reference.includes("PubMed") ? "PubMed" : "Clinical Source"}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="bg-white p-6 space-y-4">
                              {/* Trial Results */}
                              {result.trial_results && result.trial_results.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                                    Results :
                                  </h4>
                                  <ul className="space-y-2">
                                    {result.trial_results.map((res, idx) => (
                                      <li key={idx} className="text-sm text-gray-700 leading-relaxed flex items-start">
                                        <span className="text-blue-600 mr-2">•</span>
                                        {res}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Reference */}
                              {result.reference && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                                    Reference :
                                  </h4>
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {result.reference}
                                  </p>
                                </div>
                              )}

                              {/* Adverse Events */}
                              {result.adverse_event_reported === "Yes" && (
                                <div className="bg-red-50 p-4 rounded-lg">
                                  <h4 className="text-sm font-semibold text-red-800 mb-2">
                                    Adverse Events Reported
                                  </h4>
                                  {result.adverse_event_type && (
                                    <p className="text-sm text-red-700">
                                      Type: {result.adverse_event_type}
                                    </p>
                                  )}
                                  {result.treatment_for_adverse_events && (
                                    <p className="text-sm text-red-700 mt-1">
                                      Treatment: {result.treatment_for_adverse_events}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-3 pt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-slate-600 text-white hover:bg-slate-700"
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-600">
                            No published results available for this trial.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sites Section */}
              {isSectionVisible("sites") && (
                <Card key={`${currentTrial.trial_id}-sites`} className="mt-6" ref={sitesRef}>
                  <div className="bg-sky-200 p-4 rounded-t-lg flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Sites</h2>
                    <span className="text-sm font-medium text-gray-700">
                      Total No of Sites : {currentTrial.sites[0]?.total || "N/A"}
                    </span>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-8">
                      {/* World Map */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="aspect-[2/1]  flex items-center justify-center relative">
                          <Image
                            src="/world.png"
                            fill
                            alt="World Map"
                            className="object-cover"
                          />
                        </div>
                      </div>

                      {/* Site Information */}
                      <div>
                        <h3 className="text-base font-semibold text-gray-800 mb-6">
                          Site Information
                        </h3>

                        {currentTrial.sites[0]?.notes ? (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="space-y-2 mb-4">
                              <p className="text-sm font-medium text-gray-800">
                                Site Notes
                              </p>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {currentTrial.sites[0].notes}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-600">
                              No detailed site information available
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
                <Card key={`${currentTrial.trial_id}-otherSources`} className="mt-6" ref={otherSourcesRef}>
                  <div className="bg-sky-200 p-4 rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Other Sources
                    </h2>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {currentTrial.other && currentTrial.other.length > 0 ? (
                        [...currentTrial.other]
                          .sort((a, b) => {
                            const order: Record<string, number> = {
                              'pipeline_data': 1,
                              'press_releases': 2,
                              'publications': 3,
                              'trial_registries': 4,
                              'associated_studies': 5,
                              'legacy': 10
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

                            return (order[typeA] || 99) - (order[typeB] || 99);
                          })
                          .map((source, index) => {
                            // Parse the JSON data
                            let parsedData: any;
                            try {
                              parsedData = typeof source.data === 'string' ? JSON.parse(source.data) : source.data;
                            } catch (error) {
                              // If not JSON, treat as plain text
                              parsedData = { type: 'legacy', data: source.data };
                            }

                            const isExpanded = expandedOtherSources[index];

                            // Helper function for header labels
                            const getTypeHeaderLabel = (data: any) => {
                              if (!data) return 'Other Source';
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
                                      Date : {parsedData?.date ? formatDateToMMDDYYYY(parsedData.date) : "N/A"}
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
                                {isExpanded && parsedData && (
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
                          {currentTrial.logs && currentTrial.logs.length > 0 && currentTrial.logs[0].trial_added_date
                            ? formatDateToMMDDYYYY(currentTrial.logs[0].trial_added_date)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-[#204B73]">Last Modified Date :</span>
                        <span className="text-[15px] text-gray-700">
                          {currentTrial.logs && currentTrial.logs.length > 0 && currentTrial.logs[0].last_modified_date
                            ? formatDateToMMDDYYYY(currentTrial.logs[0].last_modified_date)
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
      </div>
      <Toaster />

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
              Record History - Trial {trials[currentTrialIndex]?.trial_id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Trial Change Log */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Trial Change Log</h3>
              <div className="space-y-3">
                {trials[currentTrialIndex]?.logs &&
                  trials[currentTrialIndex].logs.length > 0 ? (
                  trials[currentTrialIndex].logs.map((log, index) => (
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
                      <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                        {log.trial_changes_log}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Last Modified:</span>{" "}
                          {log.last_modified_date
                            ? formatDateToMMDDYYYY(log.last_modified_date)
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
                            ? formatDateToMMDDYYYY(log.next_review_date)
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
            <NotesSection
              title="Trial Notes"
              notes={trials[currentTrialIndex]?.notes?.map((note, index) => ({
                id: `note-${index}`,
                date: note.date_type || new Date().toISOString().split("T")[0],
                type: "General",
                content: note.notes || "",
                sourceLink: note.link || "",
                sourceType: "",
                sourceUrl: "",
                attachments: note.attachments || [],
                isVisible: true
              })) || []}
              onAddNote={() => { }} // Read-only
              onUpdateNote={() => { }} // Read-only
              onRemoveNote={() => { }} // Read-only
              showAddButton={false} // Hide add button for read-only
              className="bg-blue-50"
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  // Export history data
                  const historyData = {
                    trial_id: trials[currentTrialIndex]?.trial_id,
                    logs: trials[currentTrialIndex]?.logs || [],
                    notes: trials[currentTrialIndex]?.notes || [],
                    exported_at: new Date().toISOString(),
                  };

                  const dataStr = JSON.stringify(historyData, null, 2);
                  const dataBlob = new Blob([dataStr], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `trial_${trials[currentTrialIndex]?.trial_id}_history.json`;
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

      {/* View Source Modal */}
      <Dialog open={showSourceModal} onOpenChange={setShowSourceModal}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden [&>button]:hidden">
          <DialogTitle className="sr-only">Source</DialogTitle>
          <div className="flex flex-col h-full">
            <div className="bg-[#204B73] text-white px-4 py-3 flex items-center justify-between rounded-t-lg">
              <h2 className="text-lg font-semibold">Source</h2>
              <button
                onClick={() => setShowSourceModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              {sourceUrl ? (
                <iframe
                  src={sourceUrl}
                  className="w-full h-full border-0"
                  title="Source"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No source URL available
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attachments Modal */}
      <Dialog open={showAttachmentsModal} onOpenChange={setShowAttachmentsModal}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden [&>button]:hidden">
          <DialogTitle className="sr-only">Attachments</DialogTitle>
          <div className="flex flex-col h-full">
            <div className="bg-[#204B73] text-white px-4 py-3 flex items-center justify-between rounded-t-lg">
              <h2 className="text-lg font-semibold">Attachments</h2>
              <button
                onClick={() => setShowAttachmentsModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              {attachmentUrl ? (
                <iframe
                  src={attachmentUrl}
                  className="w-full h-full border-0"
                  title="Attachments"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No attachments available
                </div>
              )}
            </div>
            <div className="border-t bg-white px-4 py-3 flex justify-end">
              <Button
                className="bg-[#204B73] text-white hover:bg-[#1a3d5c] px-6"
                onClick={() => {
                  if (attachmentUrl) {
                    window.open(attachmentUrl, '_blank');
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}

export default function ClinicalTrialPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClinicalTrialsPage />
    </Suspense>
  );
}
