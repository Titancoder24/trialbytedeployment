"use client";

import React, { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Search,
  Mail,
  User,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  X,
  Edit,
  Bookmark,
  Share,
  Plus,
  Minus,
  FileText,
  Activity,
  Settings,
  File,
  CreditCard,
  ScrollText,
  LogOut,
  Upload,
  ChevronLeft,
  Maximize2,
  Minimize2,
  RotateCcw,
  Filter,
  Download,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Types based on the API response
interface DrugOverview {
  id: string;
  drug_name: string;
  generic_name: string;
  other_name: string | null;
  primary_name: string | null;
  global_status: string | null;
  development_status: string | null;
  drug_summary: string | null;
  originator: string | null;
  other_active_companies: string | null;
  therapeutic_area: string | null;
  disease_type: string | null;
  regulator_designations: string | null;
  source_link: string | null;
  drug_record_status: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

interface DevStatus {
  id: string;
  drug_over_id: string;
  disease_type: string | null;
  therapeutic_class: string | null;
  company: string | null;
  company_type: string | null;
  status: string | null;
  reference: string | null;
}

interface Activity {
  id: string;
  drug_over_id: string;
  mechanism_of_action: string | null;
  biological_target: string | null;
  drug_technology: string | null;
  delivery_route: string | null;
  delivery_medium: string | null;
}

interface Development {
  id: string;
  drug_over_id: string;
  preclinical: string | null;
  trial_id: string | null;
  title: string | null;
  primary_drugs: string | null;
  status: string | null;
  sponsor: string | null;
}

interface OtherSources {
  id: string;
  drug_over_id: string;
  data: string | null;
}

interface LicencesMarketing {
  id: string;
  drug_over_id: string;
  agreement: string | null;
  licensing_availability: string | null;
  marketing_approvals: string | null;
}

interface Logs {
  id: string;
  drug_over_id: string;
  drug_changes_log: string | null;
  created_date: string | null;
  last_modified_user: string | null;
  full_review_user: string | null;
  next_review_date: string | null;
  notes: string | null;
}

interface DrugData {
  drug_over_id: string;
  overview: DrugOverview;
  devStatus: DevStatus[];
  activity: Activity[];
  development: Development[];
  otherSources: OtherSources[];
  licencesMarketing: LicencesMarketing[];
  logs: Logs[];
}

interface ApiResponse {
  message: string;
  total_drugs: number;
  drugs: DrugData[];
}

export default function DrugsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
  const [currentDrugIndex, setCurrentDrugIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [filteredSections, setFilteredSections] = useState<string[]>([]);
  const [isTableExpanded, setIsTableExpanded] = useState(true);
  const [isNewsExpanded, setIsNewsExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // API Data state
  const [allDrugs, setAllDrugs] = useState<DrugData[]>([]); // Store all drugs for filtering
  const [drugs, setDrugs] = useState<DrugData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drug codes data (will be generated from API data)
  const [drugCodes, setDrugCodes] = useState<Array<{ code: string, id: string, active: boolean }>>([]);

  // Get current drug from API data
  const currentDrug = drugs.length > 0 ? drugs[currentDrugIndex] : null;

  const sidebarItems = [
    { icon: FileText, label: "Overview", id: "overview" },
    { icon: Activity, label: "Drug Activity", id: "drug-activity" },
    { icon: Settings, label: "Development", id: "development" },
    { icon: File, label: "Other Sources", id: "other-sources" },
    { icon: CreditCard, label: "Licensing & Marketing", id: "licensing-marketing" },
    { icon: ScrollText, label: "Logs", id: "logs" },
  ];

  // Fetch drugs data from API
  const fetchDrugs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/drugs/all-drugs-with-data`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      const fetchedDrugs = data.drugs || [];
      setAllDrugs(fetchedDrugs);
      setDrugs(fetchedDrugs);

      // Generate drug codes from API data using unique IDs
      const codes = fetchedDrugs.map((drug, index) => ({
        code: drug.overview.drug_name || `Drug-${index + 1}`,
        id: drug.overview.id, // Use unique drug ID
        active: index === 0 // First drug is active by default
      }));
      setDrugCodes(codes);

    } catch (error) {
      console.error("Error fetching drugs:", error);
      setError("Failed to fetch drugs data");
      toast({
        title: "Error",
        description: "Failed to fetch drugs data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load drugs data on component mount
  useEffect(() => {
    fetchDrugs();
  }, []);

  // Filter drugs when search term changes
  useEffect(() => {
    if (allDrugs.length === 0) return;

    let filtered = allDrugs;
    const term = searchTerm.toLowerCase().trim();

    if (term) {
      filtered = allDrugs.filter(drug => {
        const drugName = (drug.overview.drug_name || "").toLowerCase();
        const genericName = (drug.overview.generic_name || "").toLowerCase();
        const otherName = (drug.overview.other_name || "").toLowerCase();
        const primaryName = (drug.overview.primary_name || "").toLowerCase();

        return drugName.includes(term) ||
          genericName.includes(term) ||
          otherName.includes(term) ||
          primaryName.includes(term);
      });
    }

    setDrugs(filtered);

    // Regenerate drug codes for filtered list
    const codes = filtered.map((drug, index) => ({
      code: drug.overview.drug_name || `Drug-${index + 1}`,
      id: drug.overview.id,
      active: index === 0
    }));
    setDrugCodes(codes);
    setCurrentDrugIndex(0); // Reset to first result
  }, [searchTerm, allDrugs]);

  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'drug-activity', 'development', 'other-sources', 'licensing-marketing', 'logs'];
      const scrollPosition = window.scrollY + 100; // Offset for better UX

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    router.push("/");
  };

  // Handler functions
  const handleCloseDrug = (index: number) => {
    const newDrugCodes = drugCodes.filter((_, i) => i !== index);
    const newDrugs = drugs.filter((_, i) => i !== index);

    setDrugCodes(newDrugCodes);
    setDrugs(newDrugs);

    if (index === currentDrugIndex && newDrugs.length > 0) {
      const newIndex = Math.min(currentDrugIndex, newDrugs.length - 1);
      setCurrentDrugIndex(newIndex);
    } else if (newDrugs.length === 0) {
      setCurrentDrugIndex(0);
    }
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
    // Refresh drug data from API
    fetchDrugs();
  };

  const handleFilter = () => {
    // Toggle filter functionality
    console.log("Filter clicked");
  };

  // Format date for display (from admin page)
  const formatDate = (dateString: string | null) => {
    return formatDateToMMDDYYYY(dateString);
  };

  // Get formatted date with full month name
  const formatDateWithMonth = (dateString: string | null) => {
    return formatDateToMMDDYYYY(dateString);
  };

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      setActiveSection(sectionId);
    }
  };

  // Export functions
  const exportToJSON = () => {
    if (!currentDrug) {
      toast({
        title: "Error",
        description: "No drug data to export",
        variant: "destructive",
      });
      return;
    }

    const dataStr = JSON.stringify(currentDrug, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDrug.overview.drug_name || 'drug'}_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Drug data exported as JSON",
    });
    setShowExportModal(false);
  };

  const exportToPDF = async () => {
    if (!currentDrug) {
      toast({
        title: "Error",
        description: "No drug data to export",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);

      // Hide the export modal first to get a clean screenshot
      setShowExportModal(false);

      // Wait a bit for the modal to close
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get the main content area (excluding the sidebar and top navigation)
      const element = document.querySelector('main') || document.body;

      // Configure html2canvas options for better quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate dimensions to fit A4
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`${currentDrug.overview.drug_name || 'drug'}_report.pdf`);

      toast({
        title: "Success",
        description: "Drug data exported as PDF",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading drugs data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDrugs}>Retry</Button>
        </div>
      </div>
    );
  }

  // Show empty state (different from error state)
  if (!loading && drugs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No drugs available</p>
          <Button onClick={fetchDrugs}>Refresh</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <FileText className="h-4 w-4 mr-2" />
              Drugs
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by drug name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">✉</span>
              <div className="relative">
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

      {/* Drugs Tabs */}
      <div
        className={`bg-white border-b ${isMinimized ? "px-2 py-1" : "px-6 py-2"
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 overflow-x-auto flex-1">
            {drugCodes.map((trial, index) => (
              <div key={trial.id || `drug-${index}`} className="flex items-center">
                <div className="relative flex items-center">
                  <Button
                    variant={index === currentDrugIndex ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setCurrentDrugIndex(index);
                      // Update URL with new drug ID
                      router.push(`/user/drugs?drugId=${trial.id}`, {
                        scroll: false,
                      });
                    }}
                    className={`flex items-center ${index === currentDrugIndex
                      ? "bg-gray-600 text-white pr-8"
                      : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    <span>{trial.code}</span>
                  </Button>
                  {index === currentDrugIndex && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleCloseDrug(index);
                      }}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-4 w-4 flex items-center justify-center hover:bg-red-500 hover:text-white rounded cursor-pointer transition-colors"
                      title="Close this drug tab"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {index < drugCodes.length - 1 && (
                  <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center mx-1">
                    <span className="text-gray-500 text-xs">×</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Close All Other Tabs Button */}
          {drugCodes.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const currentDrug = drugCodes[currentDrugIndex];
                setDrugCodes([currentDrug]);
                setCurrentDrugIndex(0);
                router.push(`/user/drugs?drugId=${currentDrug.id}`, {
                  scroll: false,
                });
                toast({
                  title: "Tabs Closed",
                  description: "All other tabs have been closed",
                });
              }}
              className="text-gray-500 hover:text-red-600 ml-2 px-2"
              title="Close all other tabs (Ctrl+Shift+W)"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
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
            title="Refresh drug data"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>


      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="py-4">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={index}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* Overview Header */}
          <div id="overview" className="bg-blue-100 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-blue-900">Overview</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-blue-700">
                  {drugs.length > 0 && `${currentDrugIndex + 1} of ${drugs.length} drugs`}
                </span>
                {drugs.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (currentDrugIndex > 0) {
                          const newIndex = currentDrugIndex - 1;
                          setCurrentDrugIndex(newIndex);
                          // Update the active tab
                          setDrugCodes(prev => prev.map((drug, index) => ({
                            ...drug,
                            active: index === newIndex
                          })));
                        }
                      }}
                      disabled={currentDrugIndex === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (currentDrugIndex < drugs.length - 1) {
                          const newIndex = currentDrugIndex + 1;
                          setCurrentDrugIndex(newIndex);
                          // Update the active tab
                          setDrugCodes(prev => prev.map((drug, index) => ({
                            ...drug,
                            active: index === newIndex
                          })));
                        }
                      }}
                      disabled={currentDrugIndex === drugs.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-8">
                {/* Drug Name Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    Drug Name
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 font-medium text-sm">
                        Lab code :
                      </span>
                      <span className="font-semibold text-gray-900">
                        {currentDrug?.overview.drug_name || "N/A"}
                      </span>
                    </div>
                    <div className="ml-5 space-y-2">
                      <div className="flex items-start space-x-3">
                        <span className="text-gray-600 font-medium text-sm min-w-[120px]">
                          Generic Name :
                        </span>
                        <span className="font-semibold text-gray-900">
                          {currentDrug?.overview.generic_name || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-gray-600 font-medium text-sm min-w-[120px]">
                          Other Name :
                        </span>
                        <span className="font-semibold text-gray-900">
                          {currentDrug?.overview.other_name || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drug Status and Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600 font-medium text-sm min-w-[150px]">
                      Global Status :
                    </span>
                    <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
                      {currentDrug?.overview.global_status || "Clinical Phase III"}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600 font-medium text-sm min-w-[150px]">
                      Development status :
                    </span>
                    <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
                      {currentDrug?.overview.development_status || "Active development"}
                    </Badge>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-gray-600 font-medium text-sm min-w-[150px]">
                      Drug Summary :
                    </span>
                    <span className="text-gray-900 text-sm">
                      {currentDrug?.overview.drug_summary || "Bomedernstat is an investigational lysine-specific demethylase-1 (LSD1) inhibitor."}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600 font-medium text-sm min-w-[150px]">
                      Latest Changes :
                    </span>
                    <span className="text-gray-900 text-sm">
                      {formatDateWithMonth(currentDrug?.overview.updated_at || null) !== "N/A"
                        ? formatDateWithMonth(currentDrug?.overview.updated_at || null)
                        : "24, July 2024"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600 font-medium text-sm min-w-[150px]">
                      Originator :
                    </span>
                    <span className="text-gray-900 text-sm">
                      {currentDrug?.overview.originator || "Imago Biosciences"}
                    </span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-gray-600 font-medium text-sm min-w-[150px]">
                      Other active companies :
                    </span>
                    <span className="text-gray-900 text-sm">
                      {currentDrug?.overview.other_active_companies || "Merck"}
                    </span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-gray-600 font-medium text-sm min-w-[150px]">
                      Therapeutic Area :
                    </span>
                    <span className="text-gray-900 text-sm">
                      {currentDrug?.overview.therapeutic_area || "Oncology, Cardiovascular"}
                    </span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-gray-600 font-medium text-sm min-w-[150px]">
                      Disease Type :
                    </span>
                    <span className="text-gray-900 text-sm">
                      {currentDrug?.overview.disease_type || "Prostate cancer, Melanoma, Colorectal cancer"}
                    </span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-gray-600 font-medium text-sm min-w-[150px]">
                      Regulatory Designations :
                    </span>
                    <span className="text-gray-900 text-sm">
                      {currentDrug?.overview.regulator_designations || "Fast Track Approval"}
                    </span>
                  </div>
                </div>

                {/* Drug Development Status Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    Drug Development Status
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-gray-600 font-medium text-sm min-w-[120px]">
                          Disease Type :
                        </span>
                        <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
                          {currentDrug?.devStatus?.[0]?.disease_type || "Thrombocythemia"}
                        </Badge>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-gray-600 font-medium text-sm min-w-[120px]">
                          Therapeutic Class :
                        </span>
                        <span className="text-gray-900 text-sm">
                          {currentDrug?.devStatus?.[0]?.therapeutic_class || "Antithrombotic"}
                        </span>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-gray-600 font-medium text-sm min-w-[120px]">
                          Disease Type :
                        </span>
                        <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
                          {currentDrug?.devStatus?.[1]?.disease_type || "Myeloproliferative Neoplasm"}
                        </Badge>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-gray-600 font-medium text-sm min-w-[120px]">
                          Therapeutic Class :
                        </span>
                        <span className="text-gray-900 text-sm">
                          {currentDrug?.devStatus?.[1]?.therapeutic_class || "Anticancer"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Drug Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-base font-semibold text-gray-800 mb-4">
                    Additional Information
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Therapeutic Area :
                        </span>
                        <span className="text-sm text-gray-700 text-right">
                          {currentDrug?.overview.therapeutic_area || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Disease Type :
                        </span>
                        <span className="text-sm text-gray-700 text-right">
                          {currentDrug?.overview.disease_type || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Regulator Designations :
                        </span>
                        <span className="text-sm text-gray-700 text-right">
                          {currentDrug?.overview.regulator_designations || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Approved :
                        </span>
                        <Badge className={`${currentDrug?.overview.is_approved ? "bg-green-600" : "bg-gray-600"} text-white`}>
                          {currentDrug?.overview.is_approved ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Other Companies :
                        </span>
                        <span className="text-sm text-gray-700 text-right">
                          {currentDrug?.overview.other_active_companies || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Source Link :
                        </span>
                        <span className="text-sm text-gray-700 text-right">
                          {currentDrug?.overview.source_link ? (
                            <a href={currentDrug.overview.source_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              View Source
                            </a>
                          ) : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Created Date :
                        </span>
                        <span className="text-sm text-gray-700 text-right">
                          {formatDate(currentDrug?.overview.created_at || null)}
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Record Status :
                        </span>
                        <span className="text-sm text-gray-700 text-right">
                          {currentDrug?.overview.drug_record_status || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DevStatus Section */}
                {currentDrug?.devStatus && currentDrug.devStatus.length > 0 && (
                  <div className="mt-8">
                    <div className="bg-sky-200 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Drug Development Status</h3>
                    </div>
                    <div className="space-y-4">
                      {currentDrug.devStatus.map((status, index) => (
                        <div key={status.id} className="bg-white border rounded-lg p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                  Disease Type :
                                </span>
                                <span className="text-sm text-gray-800 font-medium">
                                  {status.disease_type || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                  Therapeutic Class :
                                </span>
                                <span className="text-sm text-gray-800 font-medium">
                                  {status.therapeutic_class || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                  Company :
                                </span>
                                <span className="text-sm text-gray-800 font-medium">
                                  {status.company || "N/A"}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                  Company Type :
                                </span>
                                <span className="text-sm text-gray-800 font-medium">
                                  {status.company_type || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                  Status :
                                </span>
                                <Badge className="bg-green-600 text-white">
                                  {status.status || "N/A"}
                                </Badge>
                              </div>
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                  Reference :
                                </span>
                                <span className="text-sm text-gray-800 font-medium">
                                  {status.reference || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drug Activity Section */}
                <div id="drug-activity" className="mt-8">
                  <div className="bg-blue-100 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-blue-900">Drug Activity</h2>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Share className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center space-x-1 border border-gray-300 rounded px-2 py-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium px-1">Aa</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {/* Mechanism of Action */}
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-600 font-medium text-sm">
                            Mechanism of action :
                          </span>
                          <Badge className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            {currentDrug?.activity?.[0]?.mechanism_of_action || "LSD1 Inhibitor"}
                          </Badge>
                        </div>

                        {/* Biological Target */}
                        <div className="flex items-start space-x-3">
                          <span className="text-gray-600 font-medium text-sm min-w-[120px]">
                            Biological target :
                          </span>
                          <span className="text-gray-900 text-sm">
                            {currentDrug?.activity?.[0]?.biological_target || "Lysine-specific demethylase 1 (LSD1) enzyme"}
                          </span>
                        </div>

                        {/* Drug Technology */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">Drug Technology</h3>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {currentDrug?.activity?.[0]?.drug_technology || "LSD1 inhibitors target the lysine-specific demethylase 1 (LSD1) enzyme, a transcriptional modulator that regulates gene expression by removing methyl groups from histone H3 lysine 4 (H3K4) and H3K9, and are being explored for cancer treatment."}
                          </p>
                        </div>

                        {/* Delivery Route and Medium */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                          {/* Delivery Route */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-slate-600 text-white px-4 py-3">
                              <h4 className="text-sm font-semibold">Delivery Route</h4>
                            </div>
                            <div className="bg-gray-50 p-4 space-y-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-sm text-gray-700">Oral</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-sm text-gray-700">Injectable</span>
                              </div>
                            </div>
                          </div>

                          {/* Delivery Medium */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-slate-600 text-white px-4 py-3">
                              <h4 className="text-sm font-semibold">Delivery Medium</h4>
                            </div>
                            <div className="bg-gray-50 p-4 space-y-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-sm text-gray-700">Tablets</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-sm text-gray-700">Intravenous (IV)</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-sm text-gray-700">Intramuscular (IM)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Development Section */}
                <div id="development" className="mt-8">
                  <div className="bg-blue-100 rounded-lg p-4 mb-6">
                    <h2 className="text-xl font-semibold text-blue-900">Development</h2>
                  </div>

                  {/* Preclinical Section */}
                  <Card className="shadow-sm mb-6">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Preclinical</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {currentDrug?.development?.[0]?.preclinical || "Characterization of structural, biochemical, pharmacokinetic, and pharmacodynamic properties of the LSD1 inhibitor bomedernstat in preclinical models"}
                        </p>
                        <div className="flex items-center space-x-3 pt-2">
                          <Button
                            size="sm"
                            className="bg-slate-600 hover:bg-slate-700 text-white text-xs px-4 py-2"
                          >
                            View source
                          </Button>
                          <Button
                            size="sm"
                            className="bg-slate-600 hover:bg-slate-700 text-white text-xs px-4 py-2 flex items-center space-x-2"
                          >
                            <span>Attachments</span>
                            <FileText className="h-3 w-3" />
                            <ArrowRight className="h-3 w-3 rotate-90" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Clinical Trials Table - Only show if development data exists */}
                  {currentDrug?.development && currentDrug.development.length > 0 && (
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="bg-slate-600 px-6 py-3">
                        <h4 className="text-base font-semibold text-white">Clinical</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-white">Trial ID</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-white">Title</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-white">Primary Drugs</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-white">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-white">Sponsor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentDrug.development.map((dev, index) => (
                              <tr key={dev.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                <td className="px-4 py-3 text-sm text-gray-800">{dev.trial_id || "N/A"}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">{dev.title || "N/A"}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">{dev.primary_drugs || "N/A"}</td>
                                <td className="px-4 py-3 text-sm">
                                  {dev.status ? (
                                    <Badge className="bg-green-600 text-white text-xs">
                                      {dev.status}
                                    </Badge>
                                  ) : "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800">{dev.sponsor || "N/A"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Other Sources Section */}
                <div id="other-sources" className="mt-8">
                  <div className="bg-blue-100 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-blue-900">Other Sources</h2>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Share className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center space-x-1 border border-gray-300 rounded px-2 py-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium px-1">Aa</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Data Table */}
                  <Card className="shadow-sm mb-6">
                    <CardContent className="p-0">
                      {/* Date Header */}
                      <div className="bg-gray-100 border-b px-6 py-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900">April 03, 2024</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsTableExpanded(!isTableExpanded)}
                          className="h-8 w-8 p-0"
                        >
                          {isTableExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Data Table */}
                      {isTableExpanded && (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Primary Focus
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Generic name Code No. (Brand name)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Classification
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Target disease
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Phase
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Licensor
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {/* Immuno-oncology Row */}
                              <tr className="bg-red-50">
                                <td className="px-4 py-4">
                                  <div className="bg-red-600 text-white px-3 py-2 rounded text-xs font-medium text-center">
                                    Immuno-oncology
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">ASP1570</td>
                                <td className="px-4 py-4 text-sm text-gray-900">DGKα inhibitor</td>
                                <td className="px-4 py-4 text-sm text-gray-900">Cancer</td>
                                <td className="px-4 py-4">
                                  <div className="flex space-x-1">
                                    <span className="inline-block w-6 h-6 bg-pink-200 rounded text-xs text-center leading-6">1</span>
                                    <span className="inline-block w-6 h-6 bg-pink-200 rounded text-xs text-center leading-6">2</span>
                                    <span className="inline-block w-6 h-6 bg-pink-200 rounded text-xs text-center leading-6">3</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">P</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">A</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">In-house</td>
                              </tr>

                              {/* Additional Immuno-oncology Rows */}
                              <tr className="bg-red-50">
                                <td className="px-4 py-4"></td>
                                <td className="px-4 py-4 text-sm text-gray-900">ASP2138</td>
                                <td className="px-4 py-4 text-sm text-gray-900">Anti-Claudin 18.2 and anti-CD3 bispecific antibody</td>
                                <td className="px-4 py-4 text-sm text-gray-900">Gastric and gastroesophageal junction adenocarcinoma, pancreatic adenocarcinoma</td>
                                <td className="px-4 py-4">
                                  <div className="flex space-x-1">
                                    <span className="inline-block w-6 h-6 bg-pink-200 rounded text-xs text-center leading-6">1</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">2</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">3</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">P</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">A</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">Xencor (Discovered through collaborative research)</td>
                              </tr>

                              <tr className="bg-red-50">
                                <td className="px-4 py-4"></td>
                                <td className="px-4 py-4 text-sm text-gray-900">ASP1002</td>
                                <td className="px-4 py-4 text-sm text-gray-900">Anti-Claudin 4 and anti-CD137 bispecific antibody</td>
                                <td className="px-4 py-4 text-sm text-gray-900">Cancer</td>
                                <td className="px-4 py-4">
                                  <div className="flex space-x-1">
                                    <span className="inline-block w-6 h-6 bg-pink-200 rounded text-xs text-center leading-6">1</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">2</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">3</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">P</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">A</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">In-house</td>
                              </tr>

                              <tr className="bg-red-50">
                                <td className="px-4 py-4"></td>
                                <td className="px-4 py-4 text-sm text-gray-900">ASP1012</td>
                                <td className="px-4 py-4 text-sm text-gray-900">Oncolytic virus encoding leptin-IL-2</td>
                                <td className="px-4 py-4 text-sm text-gray-900">Cancer</td>
                                <td className="px-4 py-4">
                                  <div className="flex space-x-1">
                                    <span className="inline-block w-6 h-6 bg-pink-200 rounded text-xs text-center leading-6">1</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">2</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">3</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">P</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">A</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">KalVir</td>
                              </tr>

                              {/* Targeted Protein Degradation Rows */}
                              <tr className="bg-blue-50">
                                <td className="px-4 py-4">
                                  <div className="bg-blue-600 text-white px-3 py-2 rounded text-xs font-medium text-center">
                                    Targeted Protein Degradation
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">ASP3082</td>
                                <td className="px-4 py-4 text-sm text-gray-900">KRAS G12D degrader</td>
                                <td className="px-4 py-4 text-sm text-gray-900">Cancer</td>
                                <td className="px-4 py-4">
                                  <div className="flex space-x-1">
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">1</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">2</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">3</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">P</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">A</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">In-house</td>
                              </tr>

                              <tr className="bg-blue-50">
                                <td className="px-4 py-4"></td>
                                <td className="px-4 py-4 text-sm text-gray-900">ASP4396</td>
                                <td className="px-4 py-4 text-sm text-gray-900">KRAS G12D degrader</td>
                                <td className="px-4 py-4 text-sm text-gray-900">Cancer</td>
                                <td className="px-4 py-4">
                                  <div className="flex space-x-1">
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">1</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">2</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">3</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">P</span>
                                    <span className="inline-block w-6 h-6 bg-gray-200 rounded text-xs text-center leading-6">A</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">In-house</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {isTableExpanded && (
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
                          <Button
                            size="sm"
                            className="bg-slate-600 hover:bg-slate-700 text-white"
                          >
                            View Pipeline
                          </Button>
                          <Button
                            size="sm"
                            className="bg-slate-600 hover:bg-slate-700 text-white flex items-center space-x-2"
                          >
                            <span>Attachments</span>
                            <FileText className="h-4 w-4" />
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* News Article Section */}
                  <Card className="shadow-sm">
                    <CardContent className="p-0">
                      {/* News Header */}
                      <div className="bg-slate-600 text-white px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">03-April-2024:</span>
                          <span className="text-sm">
                            New Phase 3 data evaluating everolimus (RAD0001), an investigational TROP2-directed antibody-drug conjugate, in previously treated locally recurrent neuroendocrine cancer.
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsNewsExpanded(!isNewsExpanded)}
                          className="h-8 w-8 p-0 text-white hover:bg-slate-700"
                        >
                          {isNewsExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* News Content */}
                      {isNewsExpanded && (
                        <div className="p-6">
                          <p className="text-sm text-gray-700 leading-relaxed mb-6">
                            Merck (NYSE: MRK), known as MSD outside of the United States and Canada, today announced that new data for four
                            approved oncology medicines and four pipeline candidates in more than 25 types of cancer will be presented at the
                            2024 American Society of Clinical Oncology (ASCO) Annual Meeting in Chicago from May 31-June 4. New data being
                            shared at the meeting showcase the company's continued progress to advance clinical research for Merck's broad
                            portfolio and diverse pipeline of investigational candidates.
                          </p>

                          <div className="flex items-center space-x-3">
                            <Button
                              size="sm"
                              className="bg-slate-600 hover:bg-slate-700 text-white"
                            >
                              View source
                            </Button>
                            <Button
                              size="sm"
                              className="bg-slate-600 hover:bg-slate-700 text-white flex items-center space-x-2"
                            >
                              <span>Attachments</span>
                              <FileText className="h-4 w-4" />
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Licensing & Marketing Section */}
                <div id="licensing-marketing" className="mt-8">
                  {currentDrug?.licencesMarketing && currentDrug.licencesMarketing.length > 0 && (
                    <>
                      <div className="bg-sky-200 rounded-lg p-4 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Licensing & Marketing</h3>
                      </div>
                      <div className="space-y-4">
                        {currentDrug.licencesMarketing.map((license, index) => (
                          <div key={license.id} className="bg-white border rounded-lg p-6">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-base font-semibold text-gray-800 mb-3">Licensing availability</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {license.licensing_availability || "No licensing availability information available"}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-base font-semibold text-gray-800 mb-3">Marketing approvals</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {license.marketing_approvals || "No marketing approvals information available"}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-base font-semibold text-gray-800 mb-3">Agreement</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {license.agreement || "No agreement information available"}
                                </p>
                              </div>
                              <div className="flex space-x-2 pt-4">
                                <Button
                                  size="sm"
                                  className="bg-slate-600 hover:bg-slate-700 text-white text-xs"
                                >
                                  View source
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-slate-600 hover:bg-slate-700 text-white text-xs"
                                >
                                  📎 Attachments
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Logs Section */}
                <div id="logs" className="mt-8">
                  {currentDrug?.logs && currentDrug.logs.length > 0 && (
                    <>
                      <div className="bg-sky-200 rounded-lg p-4 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Logs</h3>
                      </div>
                      <div className="space-y-4">
                        {currentDrug.logs.map((log, index) => (
                          <div key={log.id} className="bg-white border rounded-lg p-6">
                            <div className="space-y-4">
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                  Drug Changes Log :
                                </span>
                                <span className="text-sm text-gray-800 font-medium">
                                  {log.drug_changes_log || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                  Created Date :
                                </span>
                                <span className="text-sm text-gray-800 font-medium">
                                  {log.created_date || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                  Last Modified User :
                                </span>
                                <span className="text-sm text-gray-800 font-medium">
                                  {log.last_modified_user || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                  Full Review User :
                                </span>
                                <span className="text-sm text-gray-800 font-medium">
                                  {log.full_review_user || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                  Next Review Date :
                                </span>
                                <span className="text-sm text-gray-800 font-medium">
                                  {log.next_review_date || "N/A"}
                                </span>
                              </div>
                              {log.notes && (
                                <div className="flex items-start">
                                  <span className="text-sm font-medium text-gray-600 min-w-[140px]">
                                    Notes :
                                  </span>
                                  <span className="text-sm text-gray-800 font-medium whitespace-pre-wrap">
                                    {log.notes}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Record History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record History - {currentDrug?.overview.drug_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Track all changes and updates made to this drug record over time.
            </div>

            {/* Drug Overview Changes */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{formatDate(currentDrug?.overview.created_at || null)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{formatDate(currentDrug?.overview.updated_at || null)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Record Status:</span>
                    <Badge className={currentDrug?.overview.is_approved ? "bg-green-600" : "bg-gray-600"}>
                      {currentDrug?.overview.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logs History */}
            {currentDrug?.logs && currentDrug.logs.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Change Logs</h3>
                  <div className="space-y-3">
                    {currentDrug.logs.map((log, index) => (
                      <div key={log.id} className="border-l-2 border-blue-200 pl-4 py-2">
                        <div className="text-sm font-medium">{log.drug_changes_log || "No description"}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {log.created_date && `Date: ${log.created_date}`}
                          {log.last_modified_user && ` | Modified by: ${log.last_modified_user}`}
                        </div>
                        {log.notes && (
                          <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">Notes: {log.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Development History */}
            {currentDrug?.development && currentDrug.development.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Development Progress</h3>
                  <div className="space-y-2">
                    {currentDrug.development.map((dev, index) => (
                      <div key={dev.id} className="flex justify-between items-center text-sm">
                        <span>{dev.title || dev.trial_id || `Development ${index + 1}`}</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          {dev.status || "Active"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Drug Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Choose your preferred export format for {currentDrug?.overview.drug_name}
            </div>

            <div className="space-y-3">
              <Button
                onClick={exportToPDF}
                className="w-full justify-start"
                variant="outline"
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                    <span className="ml-auto text-xs text-gray-500">Page screenshot</span>
                  </>
                )}
              </Button>

              <Button
                onClick={exportToJSON}
                className="w-full justify-start"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
                <span className="ml-auto text-xs text-gray-500">Raw data</span>
              </Button>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              <div><strong>PDF:</strong> Screenshot of the current page as PDF</div>
              <div><strong>JSON:</strong> Complete data structure for developers</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
