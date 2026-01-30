"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
  Bell,
} from "lucide-react";
import { Suspense } from "react";
import { useLinkPreview } from "@/components/ui/link-preview-panel";
import { PreviewLink } from "@/components/ui/preview-link";

// API Response interface
interface ApiResponse {
  drugs: DrugData[];
}

// Types based on the JSON structure
interface DrugData {
  drug_id: string;
  overview: {
    id: string;
    therapeutic_area: string;
    drug_identifier: string[];
    drug_phase: string;
    status: string;
    primary_drugs: string;
    other_drugs: string;
    title: string;
    disease_type: string;
    patient_segment: string;
    line_of_therapy: string;
    reference_links: string[];
    drug_tags: string;
    sponsor_collaborators: string;
    sponsor_field_activity: string;
    associated_cro: string;
    countries: string;
    region: string;
    drug_record_status: string;
    created_at: string;
    updated_at: string;
  };
  outcomes: Array<{
    id: string;
    drug_id: string;
    purpose_of_drug: string;
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
    drug_id: string;
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
    drug_id: string;
    start_date_estimated: string | null;
    drug_end_date_estimated: string | null;
  }>;
  results: Array<{
    id: string;
    drug_id: string;
    drug_outcome: string;
    reference: string;
    drug_results: string[];
    adverse_event_reported: string;
    adverse_event_type: string | null;
    treatment_for_adverse_events: string | null;
  }>;
  sites: Array<{
    id: string;
    drug_id: string;
    total: number;
    notes: string;
  }>;
  other: Array<{
    id: string;
    drug_id: string;
    data: string;
  }>;
  logs: Array<{
    id: string;
    drug_id: string;
    drug_changes_log: string;
    drug_added_date: string;
    last_modified_date: string | null;
    last_modified_user: string | null;
    full_review_user: string | null;
    next_review_date: string | null;
  }>;
  notes: Array<{
    id: string;
    drug_id: string;
    date_type: string;
    notes: string;
    link: string;
    attachments: string[] | null;
  }>;
}

export default function DrugDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [drug, setDrug] = useState<DrugData | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [expandedOtherSources, setExpandedOtherSources] = useState<Record<number, boolean>>({ 0: true });

  const toggleOtherSource = (index: number) => {
    setExpandedOtherSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  const { toast } = useToast();
  const { openLinkPreview } = useLinkPreview();

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

  // Fetch drug data
  useEffect(() => {
    const fetchDrug = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/drugs/all-drugs-with-data`);
        const data = await response.json();

        if (data.drugs && data.drugs.length > 0) {
          const drugId = resolvedParams.id;
          const foundDrug = data.drugs.find((d: DrugData) => d.drug_over_id === drugId);

          if (foundDrug) {
            setDrug(foundDrug);
          } else {
            toast({
              title: "Drug Not Found",
              description: "The requested drug could not be found.",
              variant: "destructive",
            });
            router.push("/admin/drugs");
          }
        } else {
          toast({
            title: "No Data Available",
            description: "Unable to load drug data.",
            variant: "destructive",
          });
          router.push("/admin/drugs");
        }
      } catch (error) {
        console.error("Error fetching drug:", error);
        toast({
          title: "Error",
          description: "Failed to load drug data.",
          variant: "destructive",
        });
        router.push("/admin/drugs");
      } finally {
        setLoading(false);
      }
    };

    fetchDrug();
  }, [resolvedParams.id, router]);

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

  // Handle refresh/reload drug data
  const handleRefresh = async () => {
    toast({
      title: "Refreshing",
      description: "Reloading drug data...",
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/drugs/all-drugs-with-data`);
      const data = await response.json();

      if (data.drugs && data.drugs.length > 0) {
        const drugId = resolvedParams.id;
        const foundDrug = data.drugs.find((d: DrugData) => d.drug_over_id === drugId);

        if (foundDrug) {
          setDrug(foundDrug);
          toast({
            title: "Refreshed",
            description: "Drug data has been successfully updated",
          });
        } else {
          toast({
            title: "Drug Not Found",
            description: "The requested drug could not be found.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh drug data. Please try again.",
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

      const fileName = `drug_${drug?.drug_id || "export"}_${new Date().toISOString().split("T")[0]
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
    if (drug) {
      const exportData = {
        drug_id: drug.drug_id,
        overview: drug.overview,
        outcomes: drug.outcomes,
        criteria: drug.criteria,
        timing: drug.timing,
        results: drug.results,
        sites: drug.sites,
        other: drug.other,
        exported_at: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `drug_${drug.drug_id}_export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "JSON Export Complete",
        description: `Trial data has been exported to drug_${drug.drug_id}_export.json`,
      });
    } else {
      toast({
        title: "Export Failed",
        description: "No drug data available to export",
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
  }, [drug]); // Re-run when drug loads

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

  const countries = drug?.overview.countries?.split(", ") || [];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading drug details...</p>
        </div>
      </div>
    );
  }

  // No drug state
  if (!drug) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Drug not found</p>
          <Button onClick={() => router.push("/admin/drugs")} variant="outline">
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
                router.push("/admin/drugs");
              }}
              variant="ghost"
              className="text-gray-600"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Drugs
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <FileText className="h-4 w-4 mr-2" />
              Drug Details
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
              onClick={() => setShowHistoryModal(true)}
            >
              Record History
            </Button>
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

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r min-h-screen">
          <div className="p-4 space-y-2">
            {isSectionVisible("overview") && (
              <Button
                variant="ghost"
                onClick={() => scrollToSection("overview")}
                className={`w-full justify-start ${activeSection === "overview"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Overview
              </Button>
            )}
            {isSectionVisible("objectives") && (
              <Button
                variant="ghost"
                onClick={() => scrollToSection("objectives")}
                className={`w-full justify-start ${activeSection === "objectives"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
              >
                <div
                  className={`w-4 h-4 mr-2 rounded-full border-2 ${activeSection === "objectives"
                    ? "border-blue-600"
                    : "border-gray-400"
                    }`}
                ></div>
                Objectives
              </Button>
            )}
            {isSectionVisible("treatmentPlan") && (
              <Button
                variant="ghost"
                onClick={() => scrollToSection("treatmentPlan")}
                className={`w-full justify-start ${activeSection === "treatmentPlan"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Treatment Plan
              </Button>
            )}
            {isSectionVisible("patientDescription") && (
              <Button
                variant="ghost"
                onClick={() => scrollToSection("patientDescription")}
                className={`w-full justify-start ${activeSection === "patientDescription"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Patient Description
              </Button>
            )}
            {isSectionVisible("timing") && (
              <Button
                variant="ghost"
                onClick={() => scrollToSection("timing")}
                className={`w-full justify-start ${activeSection === "timing"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
              >
                <div
                  className={`w-4 h-4 mr-2 rounded border ${activeSection === "timing"
                    ? "border-blue-600"
                    : "border-gray-400"
                    }`}
                ></div>
                Timing
              </Button>
            )}
            {isSectionVisible("outcome") && (
              <Button
                variant="ghost"
                onClick={() => scrollToSection("outcome")}
                className={`w-full justify-start ${activeSection === "outcome"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Outcome
              </Button>
            )}
            {isSectionVisible("publishedResults") && (
              <Button
                variant="ghost"
                onClick={() => scrollToSection("publishedResults")}
                className={`w-full justify-start ${activeSection === "publishedResults"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Published Results
              </Button>
            )}
            {isSectionVisible("sites") && (
              <Button
                variant="ghost"
                onClick={() => scrollToSection("sites")}
                className={`w-full justify-start ${activeSection === "sites"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
              >
                <div
                  className={`w-4 h-4 mr-2 rounded border ${activeSection === "sites"
                    ? "border-blue-600"
                    : "border-gray-400"
                    }`}
                ></div>
                Sites
              </Button>
            )}
            {isSectionVisible("otherSources") && (
              <Button
                variant="ghost"
                onClick={() => scrollToSection("otherSources")}
                className={`w-full justify-start ${activeSection === "otherSources"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
              >
                <div
                  className={`w-4 h-4 mr-2 rounded ${activeSection === "otherSources"
                    ? "bg-blue-600"
                    : "bg-gray-400"
                    }`}
                ></div>
                Other Sources
              </Button>
            )}
          </div>

          <div className="px-4 py-6 border-t">
            <div className="space-y-4">
              <div className="text-sm text-gray-600">Pipeline Data</div>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  toast({
                    title: "Feature Coming Soon",
                    description:
                      "Associated Studies functionality will be available in the next update.",
                  });
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Associated Studies
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  if (drug.logs && drug.logs.length > 0) {
                    const logMessages = drug.logs
                      .map((log) => log.drug_changes_log)
                      .join("\n");
                    toast({
                      title: "Trial Logs",
                      description: logMessages,
                    });
                  } else {
                    toast({
                      title: "No Logs Available",
                      description: "No log entries found for this drug.",
                    });
                  }
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Logs
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Trial Header */}
          <div
            className={`bg-white border-b ${isMinimized ? "px-2 py-1" : "px-6 py-2"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {drug.overview.primary_drugs || drug.drug_over_id}
                </h2>
                <Badge className={getStatusColor(drug.overview.status)}>
                  {drug.overview.status}
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
                  title="Refresh drug data"
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
          <div className={`${isMinimized ? "p-2" : "p-6"} overflow-x-hidden`} data-export-content>
            {/* Trial Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="text-red-400 text-3xl">🎯</div>
                <div className="flex-1">
                  <h1 className="text-xl font-semibold mb-2">
                    {drug.overview.title}
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
                            drug.overview.status
                          )}
                        >
                          {drug.overview.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Endpoints met</span>
                        <Switch
                          checked={endpointsMet}
                          onCheckedChange={setEndpointsMet}
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
                          {drug.overview.therapeutic_area}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium mb-2 block">
                        Trial Identifier :
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(drug.overview.drug_identifier || []).map(
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
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {(drug.outcomes && drug.outcomes.length > 0 ? (drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null) : null)?.purpose_of_drug ||
                        "No scientific title available"}
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Summary
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.summary ||
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
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px] flex-shrink-0">
                            Disease Type :
                          </span>
                          <span className="text-sm text-gray-700 text-right">
                            {drug.overview.disease_type || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px] flex-shrink-0">
                            Patient Segment :
                          </span>
                          <span className="text-sm text-gray-700 text-right">
                            {drug.overview.patient_segment || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px] flex-shrink-0">
                            Primary Drug :
                          </span>
                          <span className="text-sm text-gray-700 text-right">
                            {drug.overview.primary_drugs || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px] flex-shrink-0">
                            Other Drugs :
                          </span>
                          <span className="text-sm text-gray-700 text-right">
                            {drug.overview.other_drugs || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px] flex-shrink-0">
                            Trial Phase :
                          </span>
                          <Badge className="bg-green-600 text-white">
                            Phase {drug.overview.drug_phase || "N/A"}
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
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">•</span>
                          <span className="text-sm font-medium text-gray-900">
                            2 – Second Line
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">•</span>
                          <span className="text-sm text-gray-600">
                            1 – First Line
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">•</span>
                          <span className="text-sm text-gray-600">
                            2+ – At least second line
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">•</span>
                          <span className="text-sm text-gray-600">
                            3+ – At least third line
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">•</span>
                          <span className="text-sm text-gray-600">
                            1+ – At least first line
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Countries Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Countries
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {countries.length > 0 ? (
                        countries.map((country, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-center bg-gray-100 text-gray-700"
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

                  {/* Additional Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Details */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Region :
                        </span>
                        <span className="text-sm text-gray-700 ml-2">
                          {drug.overview.region || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Sponsors & Collaborators :
                        </span>
                        <span className="text-sm text-gray-700 ml-2">
                          {drug.overview.sponsor_collaborators || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Sponsor Field of Activity :
                        </span>
                        <span className="text-sm text-gray-700 ml-2">
                          {drug.overview.sponsor_field_activity ||
                            "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Associated CRO :
                        </span>
                        <span className="text-sm text-gray-700 ml-2">
                          {drug.overview.associated_cro || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Trial Tags :
                        </span>
                        <span className="text-sm text-gray-700 ml-2">
                          {drug.overview.drug_tags || "N/A"}
                        </span>
                      </div>

                      {/* Source Links */}
                      <div className="pt-4">
                        <span className="text-sm font-medium text-gray-600 block mb-2">
                          Source Links :
                        </span>
                        <div className="space-y-1">
                          {drug.overview.reference_links &&
                            drug.overview.reference_links.length > 0 ? (
                            drug.overview.reference_links.map(
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
                          {drug.overview.drug_record_status || "N/A"}
                        </span>
                        <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>

                    {/* Right Column - Europe Map */}
                    <div className="flex justify-center items-center">
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
              <Card className="mt-6" ref={objectivesRef}>
                <div className="bg-sky-200 p-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Objectives
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {/* Purpose of the drug */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-base font-semibold text-gray-700 mb-4">
                        Purpose of the drug
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.purpose_of_drug ||
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
                            <p className="text-sm text-gray-700 mt-1">
                              {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)
                                ?.primary_outcome_measure ||
                                "No primary outcome measure available"}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Measure Description :
                            </span>
                            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                              {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.summary ||
                                "No measure description available"}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Other Outcome Measures :
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)
                                ?.other_outcome_measure ||
                                "No other outcome measures available"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Study Design */}
                      <div>
                        <h3 className="text-base font-semibold text-blue-700 mb-4">
                          Study Design
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Study Design :
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.study_design ||
                                "No study design available"}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Study Design Keywords :
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)
                                ?.study_design_keywords ||
                                "No study design keywords available"}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Number of Arms :
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.number_of_arms ||
                                "N/A"}
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
                      <div className="flex flex-wrap gap-2">
                        {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.study_design_keywords ? (
                          (drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null).study_design_keywords
                            .split(",")
                            .map((keyword, index) => (
                              <Badge
                                key={index}
                                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                          <span className="text-sm text-gray-700">
                            {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.study_design || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[120px] flex-shrink-0">
                            Keywords :
                          </span>
                          <span className="text-sm text-gray-700">
                            {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.study_design_keywords ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[120px] flex-shrink-0">
                            Number of Arms :
                          </span>
                          <span className="text-sm text-gray-700">
                            {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.number_of_arms || "N/A"}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-4 leading-relaxed">
                        {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.summary ||
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
                          <p className="text-sm text-gray-600 mt-1">
                            {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.treatment_regimen ||
                              "No treatment regimen description available"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">
                          Number of arms:{" "}
                          {(drug.outcomes && drug.outcomes.length > 0 ? drug.outcomes[0] : null)?.number_of_arms || "N/A"}
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
                        {(drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null)?.inclusion_criteria ? (
                          <div className="text-sm text-gray-700">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="whitespace-pre-wrap">
                              {(drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null).inclusion_criteria}
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
                        {(drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null)?.exclusion_criteria ? (
                          <div className="text-sm text-gray-700">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="whitespace-pre-wrap">
                              {(drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null).exclusion_criteria}
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
                          {(drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null)?.age_from || "N/A"} -{" "}
                          {(drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null)?.age_to || "N/A"} Years
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Sexes Eligible for Study
                        </h4>
                        <p className="text-sm text-gray-600">
                          {(drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null)?.sex || "N/A"}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Subject Type
                        </h4>
                        <p className="text-sm text-gray-600">
                          {(drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null)?.subject_type || "N/A"}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Healthy Volunteers
                        </h4>
                        <p className="text-sm text-gray-600">
                          {(drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null)?.healthy_volunteers ===
                            "false"
                            ? "No"
                            : (drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null)?.healthy_volunteers ===
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
                          {(drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null)?.target_no_volunteers ||
                            "N/A"}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Actual enrolled Volunteers
                        </h4>
                        <p className="text-sm text-gray-600">
                          {(drug.criteria && drug.criteria.length > 0 ? drug.criteria[0] : null)
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
                <div className="bg-sky-200 p-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Timing
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {/* Timing Table */}
                    <div className="overflow-hidden">
                      <table className="w-full border-collapse table-auto">
                        <thead>
                          <tr className="bg-slate-600 text-white">
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
                          <tr className="bg-white">
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              Actual
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {(drug.timing && drug.timing.length > 0 ? drug.timing[0] : null)?.start_date_estimated
                                ? new Date(
                                  (drug.timing && drug.timing.length > 0 ? drug.timing[0] : null).start_date_estimated
                                ).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              N/A
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              N/A
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              N/A
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              {(drug.timing && drug.timing.length > 0 ? drug.timing[0] : null)?.drug_end_date_estimated
                                ? new Date(
                                  (drug.timing && drug.timing.length > 0 ? drug.timing[0] : null).drug_end_date_estimated
                                ).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              N/A
                            </td>
                            <td className="border border-slate-300 px-4 py-3 text-sm">
                              N/A
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Statistics */}
                    <div className="flex items-center justify-center space-x-8">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          Start Date :
                        </span>
                        <Badge className="bg-green-600 text-white">
                          {(drug.timing && drug.timing.length > 0 ? drug.timing[0] : null)?.start_date_estimated
                            ? formatDateToMMDDYYYY((drug.timing && drug.timing.length > 0 ? drug.timing[0] : null)?.start_date_estimated)
                            : "N/A"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          End Date :
                        </span>
                        <Badge className="bg-green-600 text-white">
                          {(drug.timing && drug.timing.length > 0 ? drug.timing[0] : null)?.drug_end_date_estimated
                            ? formatDateToMMDDYYYY((drug.timing && drug.timing.length > 0 ? drug.timing[0] : null)?.drug_end_date_estimated)
                            : "N/A"}
                        </Badge>
                      </div>
                    </div>

                    {/* Reference Section */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 mb-4">
                        Reference
                      </h3>

                      {/* Reference Items */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              April 2, 2021
                            </p>
                            <p className="text-sm text-gray-600">CT.gov</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Jan 10, 2021
                            </p>
                            <p className="text-sm text-gray-600">EUCTR</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              April 2, 2021
                            </p>
                            <p className="text-sm text-gray-600">PubMed</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Study Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[150px] flex-shrink-0">
                            Study Start (Actual) :
                          </span>
                          <span className="text-sm text-gray-700">
                            {(drug.timing && drug.timing.length > 0 ? drug.timing[0] : null)?.start_date_estimated
                              ? new Date(
                                (drug.timing && drug.timing.length > 0 ? drug.timing[0] : null).start_date_estimated
                              ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[150px] flex-shrink-0">
                            Study Completion (Actual) :
                          </span>
                          <span className="text-sm text-gray-700">
                            {(drug.timing && drug.timing.length > 0 ? drug.timing[0] : null)?.drug_end_date_estimated
                              ? new Date(
                                (drug.timing && drug.timing.length > 0 ? drug.timing[0] : null).drug_end_date_estimated
                              ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-600 text-white hover:bg-slate-700"
                        >
                          View source
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-600 text-white hover:bg-slate-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Attachments
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
                </CardContent>
              </Card>
            )}

            {/* Outcome Section */}
            {isSectionVisible("outcome") && (
              <Card className="mt-6" ref={outcomeRef}>
                <div className="bg-sky-200 p-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Outcome
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Results Available Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">
                          Results available
                        </span>
                        <Switch checked={true} />
                      </div>
                    </div>

                    {/* Trial Outcome */}
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">
                        Trial Outcome :
                      </span>
                      <Badge className="bg-green-600 text-white px-3 py-1">
                        {(drug.results && drug.results.length > 0 ? drug.results[0] : null)?.drug_outcome ||
                          "No outcome available"}
                      </Badge>
                    </div>

                    {/* Trial Outcome Reference */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-800">
                          Trial Outcome Reference
                        </h3>
                        <span className="text-sm text-gray-600">
                          April 2, 2021
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 leading-relaxed mb-4">
                        {(drug.results && drug.results.length > 0 ? drug.results[0] : null)?.reference ||
                          "No reference information available"}
                      </p>

                      {(drug.results && drug.results.length > 0 ? drug.results[0] : null)?.drug_results &&
                        (drug.results && drug.results.length > 0 ? drug.results[0] : null).drug_results.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">
                              Trial Results:
                            </h4>
                            <ul className="space-y-1">
                              {(drug.results && drug.results.length > 0 ? drug.results[0] : null).drug_results.map(
                                (result, index) => (
                                  <li
                                    key={index}
                                    className="text-sm text-gray-700"
                                  >
                                    <span className="text-blue-600 mr-2">
                                      •
                                    </span>
                                    {result}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      {(drug.results && drug.results.length > 0 ? drug.results[0] : null)?.adverse_event_reported ===
                        "true" && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">
                              Adverse Events:
                            </h4>
                            <p className="text-sm text-gray-700">
                              Type:{" "}
                              {(drug.results && drug.results.length > 0 ? drug.results[0] : null)?.adverse_event_type ||
                                "Not specified"}
                            </p>
                            <p className="text-sm text-gray-700">
                              Treatment:{" "}
                              {(drug.results && drug.results.length > 0 ? drug.results[0] : null)
                                ?.treatment_for_adverse_events || "Not specified"}
                            </p>
                          </div>
                        )}

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-600 text-white hover:bg-slate-700"
                        >
                          View source
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-600 text-white hover:bg-slate-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Attachments
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
                </CardContent>
              </Card>
            )}

            {/* Published Results Section */}
            {isSectionVisible("publishedResults") && (
              <Card className="mt-6" ref={publishedResultsRef}>
                <div className="bg-sky-200 p-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Published Results
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* First Published Result - Expanded */}
                    <div className="bg-slate-700 rounded-lg overflow-hidden">
                      {/* Header */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge className="bg-white text-slate-700 hover:bg-gray-100">
                            Date : October 23, 2021
                          </Badge>
                          <Badge className="bg-white text-slate-700 hover:bg-gray-100">
                            Result Type : Full Results
                          </Badge>
                          <Badge className="bg-white text-slate-700 hover:bg-gray-100">
                            Source : PubMed
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-slate-600"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Title */}
                      <div className="px-4 pb-4">
                        <h3 className="text-white font-medium text-base leading-relaxed">
                          Efficacy and safety of long-acting pasireotide or
                          everolimus alone or in combination in patients with
                          advanced carcinoids of the lung and thymus (LUNA):
                        </h3>
                      </div>

                      {/* Content */}
                      <div className="bg-white p-6 space-y-4">
                        {/* Authors */}
                        <p className="text-sm text-gray-700 italic">
                          Piero Ferolla, Maria Pia Brizzi, Tim Meyer, Wasat
                          Mansoor, Julien Mazieres, Christine Do Cao, Hervé
                          Léna, Alfredo Berruti
                        </p>

                        {/* Results */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">
                            Results :
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            11 patients died during the core 12-month treatment
                            phase or up to 56 days after the last study
                            treatment exposure date: two (5%) of 41 in the
                            long-acting pasireotide group, six (14%) of 42 in
                            the everolimus group, and three (7%) of 41 in the
                            combination group. No deaths were suspected to be
                            related to long-acting pasireotide treatment. One
                            death in the everolimus group (acute kidney injury
                            associated with diarrhoea), and two deaths in the
                            combination group (diarrhoea and urinary sepsis in
                            one patient, and acute renal failure and respiratory
                            failure in one patient) were suspected to be related
                            to everolimus treatment. In the latter patient,
                            acute renal failure was not suspected to be related
                            to everolimus treatment, but respiratory failure was
                            suspected to be related.
                          </p>
                        </div>

                        {/* Conclusion */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">
                            Conclusion :
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            The study met the primary endpoint in all three
                            treatment groups. Safety profiles were consistent
                            with the known safety profiles of these agents.
                            Further studies are needed to confirm the antitumour
                            efficacy of the combination of a somatostatin
                            analogue with everolimus in lung and thymic
                            carcinoids
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-3 pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-600 text-white hover:bg-slate-700"
                          >
                            View source
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-600 text-white hover:bg-slate-700"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Full Text
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

                    {/* Second Published Result - Collapsed */}
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge
                            variant="outline"
                            className="bg-white text-gray-700"
                          >
                            Date : January 25, 2020
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-white text-gray-700"
                          >
                            Result Type : Interim Results
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-white text-gray-700"
                          >
                            Source : PubMed
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3">
                        <h3 className="text-gray-800 font-medium text-sm">
                          A Multicenter Randomized Phase III Study of Single
                          Agent Efficacy and Optimal Combination Sequence of
                          Everolimus and Pasireotide LAR in Advanced Thyroid
                          Cancer.
                        </h3>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sites Section */}
            {isSectionVisible("sites") && (
              <Card className="mt-6" ref={sitesRef}>
                <div className="bg-sky-200 p-4 rounded-t-lg flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Sites</h2>
                  <span className="text-sm font-medium text-gray-700">
                    Total No of Sites : {(drug.sites && drug.sites.length > 0 ? drug.sites[0] : null)?.total || "N/A"}
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

                      {(drug.sites && drug.sites.length > 0 ? drug.sites[0] : null)?.notes ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="space-y-2 mb-4">
                            <p className="text-sm font-medium text-gray-800">
                              Site Notes
                            </p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {(drug.sites && drug.sites.length > 0 ? drug.sites[0] : null).notes}
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
              <Card className="mt-6" ref={otherSourcesRef}>
                <div className="bg-sky-200 p-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Other Sources
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {drug.other && drug.other.length > 0 ? (
                      [...drug.other]
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
                        {drug?.logs && drug.logs.length > 0 && drug.logs[0].drug_added_date
                          ? formatDateToMMDDYYYY(drug.logs[0].drug_added_date)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#204B73]">Last Modified Date :</span>
                      <span className="text-[15px] text-gray-700">
                        {drug?.logs && drug.logs.length > 0 && drug.logs[0].last_modified_date
                          ? formatDateToMMDDYYYY(drug.logs[0].last_modified_date)
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
              Record History - Trial {drug?.drug_id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Trial Change Log */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Trial Change Log</h3>
              <div className="space-y-3">
                {drug?.logs &&
                  drug.logs.length > 0 ? (
                  drug.logs.map((log, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-800">
                          Change #{index + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.drug_added_date
                            ? new Date(
                              log.drug_added_date
                            ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                        {log.drug_changes_log}
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
                    No change history available for this drug
                  </div>
                )}
              </div>
            </div>

            {/* Trial Notes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Trial Notes</h3>
              <div className="space-y-3">
                {drug?.notes &&
                  drug.notes.length > 0 ? (
                  drug.notes.map((note, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-blue-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-800">
                          Note #{index + 1} - {note.date_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{note.notes}</p>
                      {note.link && (
                        <PreviewLink
                          href={note.link}
                          title="View Link"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View Link
                        </PreviewLink>
                      )}
                      {note.attachments && note.attachments.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-gray-600">
                            Attachments:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {note.attachments.map((attachment, attachIndex) => (
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
                    No notes available for this drug
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
                    drug_id: drug?.drug_id,
                    logs: drug?.logs || [],
                    notes: drug?.notes || [],
                    exported_at: new Date().toISOString(),
                  };

                  const dataStr = JSON.stringify(historyData, null, 2);
                  const dataBlob = new Blob([dataStr], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `drug_${drug?.drug_id}_history.json`;
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
                        "Complete drug document with all sections"
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
                      Raw drug data for integration or analysis
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
    </div>
  );
}

