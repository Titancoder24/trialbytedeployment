"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar, 
  MapPin, 
  Users, 
  Target, 
  Clock, 
  FileText, 
  ExternalLink,
  User,
  ChevronDown,
  LogOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Filter,
  Upload,
  Activity,
  Building,
  Globe
} from "lucide-react";

// Types based on the API response
interface DrugData {
  drug_over_id: string;
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
  }>;
  sites: Array<{
    id: string;
    trial_id: string;
    site_name: string;
    site_address: string;
    site_country: string;
    site_region: string;
    principal_investigator: string;
    site_contact: string;
    site_phone: string;
    site_email: string;
  }>;
  other_sources: Array<{
    id: string;
    trial_id: string;
    source_type: string;
    source_data: string;
    source_date: string;
    source_reference: string;
  }>;
}

export default function DrugDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [drug, setDrug] = useState<DrugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
  const [endpointsMet, setEndpointsMet] = useState(true);
  const [resultPosted, setResultPosted] = useState({ yes: true, no: false });
  const [filteredSections, setFilteredSections] = useState<string[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Refs for navigation
  const overviewRef = useRef<HTMLDivElement>(null);
  const devStatusRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const developmentRef = useRef<HTMLDivElement>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);
  const licensingRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const objectivesRef = useRef<HTMLDivElement>(null);
  const criteriaRef = useRef<HTMLDivElement>(null);
  const timingRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const sitesRef = useRef<HTMLDivElement>(null);
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

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Completed: "bg-blue-600 text-white",
      Active: "bg-green-600 text-white",
      Planned: "bg-yellow-600 text-white",
      Suspended: "bg-red-600 text-white",
    };
    return colors[status] || "bg-gray-600 text-white";
  };

  const isSectionVisible = (sectionId: string) => {
    return filteredSections.length === 0 || filteredSections.includes(sectionId);
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    setIsMaximized(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFilter = () => {
    // Filter functionality - can be implemented later
    toast({
      title: "Filter",
      description: "Filter functionality will be available soon.",
    });
  };

  const handleLogout = () => {
    router.push("/admin/login");
  };

  // Navigation sections
  const sections = [
    { id: "overview", label: "Overview", ref: overviewRef, icon: FileText },
    { id: "dev_status", label: "Development Status", ref: devStatusRef, icon: Target },
    { id: "activity", label: "Drug Activity", ref: activityRef, icon: Activity },
    { id: "development", label: "Development", ref: developmentRef, icon: Building },
    { id: "sources", label: "Other Sources", ref: sourcesRef, icon: ExternalLink },
    { id: "licensing", label: "Licensing & Marketing", ref: licensingRef, icon: Globe },
    { id: "logs", label: "Logs", ref: logsRef, icon: Clock },
  ];

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLogoutDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section?.ref.current) {
      section.ref.current.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading trial details...</p>
        </div>
      </div>
    );
  }

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
    <div className={`min-h-screen bg-gray-50 ${isMaximized ? "fixed inset-0 z-50 overflow-auto" : ""}`}>
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
              onClick={() => router.push("/admin")}
              variant="ghost"
              className="text-gray-600"
            >
              Dashboard
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <FileText className="h-4 w-4 mr-2" />
              Therapeutics
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-blue-500 font-medium">TrialByte Admin</span>
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
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      showLogoutDropdown ? "rotate-180" : ""
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
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                onClick={() => scrollToSection(section.id)}
                className={`w-full justify-start ${
                  activeSection === section.id
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <section.icon className="h-4 w-4 mr-2" />
                {section.label}
              </Button>
            ))}
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
                    description: "Associated Studies functionality will be available in the next update.",
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
                  toast({
                    title: "Trial Logs",
                    description: "Log functionality will be available soon.",
                  });
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
          <div className="bg-white border-b">
            <div className={`${isMinimized ? "px-2 py-1" : "px-6 py-2"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 overflow-x-auto flex-1">
                  <div className="flex items-center">
                    <div className="relative flex items-center">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-gray-600 text-white pr-8"
                      >
                        <span>
                          {drug.overview.trial_identifier?.[0] || drug.drug_over_id}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 mt-2">
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
                    className={`${
                      filteredSections.length > 0 ? "bg-blue-100 text-blue-600" : ""
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
          </div>

          {/* Trial Content */}
          <div className={`${isMinimized ? "p-2" : "p-6"}`}>
            {/* Trial Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="text-red-400 text-3xl">🎯</div>
                <div className="flex-1">
                  <h1 className="text-xl font-semibold mb-2">
                    {drug?.overview?.title || 'N/A'}
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
                            drug?.overview?.status || 'Unknown'
                          )}
                        >
                          {drug?.overview?.status || 'Unknown'}
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
                      <h3 className="text-lg font-semibold text-gray-900">Trial Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold text-gray-700">Therapeutic Area</Label>
                        <p className="text-sm text-gray-600 mt-1">{drug?.overview?.therapeutic_area || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="font-semibold text-gray-700">Trial Phase</Label>
                        <Badge variant="secondary">{drug?.overview?.trial_phase || "N/A"}</Badge>
                      </div>
                      <div>
                        <Label className="font-semibold text-gray-700">Trial ID</Label>
                        <p className="text-sm text-gray-600 mt-1">{drug?.drug_over_id || 'N/A'}</p>
                      </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Disease Type</Label>
                      <p className="text-sm text-gray-600 mt-1">{drug?.overview?.disease_type || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Primary Drugs</Label>
                      <p className="text-sm text-gray-600 mt-1">{drug?.overview?.primary_drugs || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Other Drugs</Label>
                      <p className="text-sm text-gray-600 mt-1">{drug?.overview?.other_drugs || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Patient Segment</Label>
                      <p className="text-sm text-gray-600 mt-1">{drug?.overview?.patient_segment || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Line of Therapy</Label>
                      <p className="text-sm text-gray-600 mt-1">{drug?.overview?.line_of_therapy || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Countries</Label>
                      <p className="text-sm text-gray-600 mt-1">{drug?.overview?.countries || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Region</Label>
                      <p className="text-sm text-gray-600 mt-1">{drug?.overview?.region || "N/A"}</p>
                    </div>
                  </div>
                  
                  {drug?.overview?.trial_tags && (
                    <div>
                      <Label className="font-semibold text-gray-700">Trial Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {drug?.overview?.trial_tags?.split(',').map((tag, index) => (
                          <Badge key={index} variant="outline">{tag?.trim() || ''}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {drug?.overview?.reference_links && drug.overview.reference_links.length > 0 && (
                    <div>
                      <Label className="font-semibold text-gray-700">Reference Links</Label>
                      <div className="space-y-1 mt-2">
                        {drug?.overview?.reference_links?.map((link, index) => (
                          <a
                            key={index}
                            href={link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>{link || 'N/A'}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="font-semibold text-gray-700">Created</Label>
                      <p className="text-sm text-gray-600 mt-1">{formatDate(drug?.overview?.created_at)}</p>
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Last Updated</Label>
                      <p className="text-sm text-gray-600 mt-1">{formatDate(drug?.overview?.updated_at)}</p>
                    </div>
                  </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Objectives Section */}
            {drug?.outcomes && drug.outcomes.length > 0 && (
              <div ref={objectivesRef} className="scroll-mt-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Objectives & Study Design</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {drug.outcomes.map((outcome, index) => (
                      <div key={outcome.id} className="border rounded-lg p-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="font-semibold text-gray-700">Purpose of Trial</Label>
                            <p className="text-sm text-gray-600 mt-1">{outcome.purpose_of_trial || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-700">Summary</Label>
                            <p className="text-sm text-gray-600 mt-1">{outcome.summary || "N/A"}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold text-gray-700">Primary Outcome</Label>
                              <p className="text-sm text-gray-600 mt-1">{outcome.primary_outcome_measure || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-gray-700">Other Outcomes</Label>
                              <p className="text-sm text-gray-600 mt-1">{outcome.other_outcome_measure || "N/A"}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold text-gray-700">Study Design</Label>
                              <p className="text-sm text-gray-600 mt-1">{outcome.study_design || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-gray-700">Treatment Regimen</Label>
                              <p className="text-sm text-gray-600 mt-1">{outcome.treatment_regimen || "N/A"}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-700">Number of Arms</Label>
                            <p className="text-sm text-gray-600 mt-1">{outcome.number_of_arms || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Patient Criteria Section */}
            {drug?.criteria && drug.criteria.length > 0 && (
              <div ref={criteriaRef} className="scroll-mt-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Patient Criteria</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {drug.criteria.map((criterion, index) => (
                      <div key={criterion.id} className="border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold text-gray-700">Age Range</Label>
                              <p className="text-sm text-gray-600 mt-1">
                                {criterion.age_from || "N/A"} - {criterion.age_to || "N/A"}
                              </p>
                            </div>
                            <div>
                              <Label className="font-semibold text-gray-700">Sex</Label>
                              <p className="text-sm text-gray-600 mt-1">{criterion.sex || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-gray-700">Subject Type</Label>
                              <p className="text-sm text-gray-600 mt-1">{criterion.subject_type || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-gray-700">Healthy Volunteers</Label>
                              <p className="text-sm text-gray-600 mt-1">{criterion.healthy_volunteers || "N/A"}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-700">Inclusion Criteria</Label>
                            <p className="text-sm text-gray-600 mt-1">{criterion.inclusion_criteria || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-700">Exclusion Criteria</Label>
                            <p className="text-sm text-gray-600 mt-1">{criterion.exclusion_criteria || "N/A"}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold text-gray-700">Target Volunteers</Label>
                              <p className="text-sm text-gray-600 mt-1">{criterion.target_no_volunteers || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-gray-700">Actual Enrolled</Label>
                              <p className="text-sm text-gray-600 mt-1">{criterion.actual_enrolled_volunteers || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Timing Section */}
            {drug?.timing && drug.timing.length > 0 && (
              <div ref={timingRef} className="scroll-mt-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Timing</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {drug.timing.map((time, index) => (
                      <div key={time.id} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="font-semibold text-gray-700">Start Date (Estimated)</Label>
                            <p className="text-sm text-gray-600 mt-1">{formatDate(time.start_date_estimated)}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-700">End Date (Estimated)</Label>
                            <p className="text-sm text-gray-600 mt-1">{formatDate(time.trial_end_date_estimated)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Results Section */}
            {drug?.results && drug.results.length > 0 && (
              <div ref={resultsRef} className="scroll-mt-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Results</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {drug.results.map((result, index) => (
                      <div key={result.id} className="border rounded-lg p-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="font-semibold text-gray-700">Trial Outcome</Label>
                            <p className="text-sm text-gray-600 mt-1">{result.trial_outcome || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-700">Reference</Label>
                            <p className="text-sm text-gray-600 mt-1">{result.reference || "N/A"}</p>
                          </div>
                          {result.trial_results && result.trial_results.length > 0 && (
                            <div>
                              <Label className="font-semibold text-gray-700">Trial Results</Label>
                              <div className="space-y-1 mt-1">
                                {result.trial_results.map((res, idx) => (
                                  <p key={idx} className="text-sm text-gray-600">{res || 'N/A'}</p>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold text-gray-700">Adverse Events Reported</Label>
                              <p className="text-sm text-gray-600 mt-1">{result.adverse_event_reported || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-gray-700">Adverse Event Type</Label>
                              <p className="text-sm text-gray-600 mt-1">{result.adverse_event_type || "N/A"}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-700">Treatment for Adverse Events</Label>
                            <p className="text-sm text-gray-600 mt-1">{result.treatment_for_adverse_events || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sites Section */}
            {drug?.sites && drug.sites.length > 0 && (
              <div ref={sitesRef} className="scroll-mt-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Sites</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {drug.sites.map((site, index) => (
                      <div key={site.id} className="border rounded-lg p-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="font-semibold text-gray-700">Site Name</Label>
                            <p className="text-sm text-gray-600 mt-1">{site.site_name || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-700">Address</Label>
                            <p className="text-sm text-gray-600 mt-1">{site.site_address || "N/A"}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold text-gray-700">Country</Label>
                              <p className="text-sm text-gray-600 mt-1">{site.site_country || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-gray-700">Region</Label>
                              <p className="text-sm text-gray-600 mt-1">{site.site_region || "N/A"}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-700">Principal Investigator</Label>
                            <p className="text-sm text-gray-600 mt-1">{site.principal_investigator || "N/A"}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold text-gray-700">Contact</Label>
                              <p className="text-sm text-gray-600 mt-1">{site.site_contact || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-gray-700">Phone</Label>
                              <p className="text-sm text-gray-600 mt-1">{site.site_phone || "N/A"}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-700">Email</Label>
                            <p className="text-sm text-gray-600 mt-1">{site.site_email || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Other Sources Section */}
            {drug?.other_sources && drug.other_sources.length > 0 && (
              <div ref={sourcesRef} className="scroll-mt-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ExternalLink className="h-5 w-5" />
                      <span>Other Sources</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {drug.other_sources.map((source, index) => (
                      <div key={source.id} className="border rounded-lg p-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="font-semibold text-gray-700">Source Type</Label>
                            <p className="text-sm text-gray-600 mt-1">{source.source_type || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-700">Source Data</Label>
                            <p className="text-sm text-gray-600 mt-1">{source.source_data || "N/A"}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold text-gray-700">Source Date</Label>
                              <p className="text-sm text-gray-600 mt-1">{formatDate(source.source_date)}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-gray-700">Reference</Label>
                              <p className="text-sm text-gray-600 mt-1">{source.source_reference || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
