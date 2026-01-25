"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useMemo } from "react";
import { SearchableSelectOption } from "./drug-options";
import { formatDateToMMDDYYYY } from "@/lib/date-utils";
import { drugsApi } from "../../_lib/api";
import { Trash2, Eye, Plus, Search, Loader2, Filter, Clock, Edit, RefreshCw, ChevronDown, Settings, Download, Save, ExternalLink, Maximize2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DrugAdvancedSearchModal, DrugSearchCriteria } from "@/components/drug-advanced-search-modal";
import { DrugFilterModal, DrugFilterState } from "@/components/drug-filter-modal";
import { DrugSaveQueryModal } from "@/components/drug-save-query-modal";
import { QueryHistoryModal } from "@/components/query-history-modal";
import { DrugCustomizeColumnModal, DrugColumnSettings, DEFAULT_DRUG_COLUMN_SETTINGS, DRUG_COLUMN_OPTIONS } from "@/components/drug-customize-column-modal";
import { useToast } from "@/hooks/use-toast";

// Types based on the new API response
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
  original_drug_id?: string;
  is_updated_version?: boolean;
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
  country?: string | null;
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

export default function DrugsDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [drugs, setDrugs] = useState<DrugData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingDrugs, setDeletingDrugs] = useState<Record<string, boolean>>(
    {}
  );
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState<DrugSearchCriteria[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<DrugFilterState>({
    globalStatuses: [],
    developmentStatuses: [],
    therapeuticAreas: [],
    diseaseTypes: [],
    originators: [],
    otherActiveCompanies: [],
    regulatorDesignations: [],
    drugRecordStatus: [],
    isApproved: [],
    companyTypes: [],
    mechanismOfAction: [],
    biologicalTargets: [],
    drugTechnologies: [],
    deliveryRoutes: [],

    deliveryMediums: [],
    therapeuticClasses: [],
    countries: [],
    primaryNames: []
  });
  const [saveQueryModalOpen, setSaveQueryModalOpen] = useState(false);
  const [queryHistoryModalOpen, setQueryHistoryModalOpen] = useState(false);

  // Query editing state
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null);
  const [editingQueryTitle, setEditingQueryTitle] = useState<string>("");
  const [editingQueryDescription, setEditingQueryDescription] = useState<string>("");

  // Sorting state
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Multiple selection state
  const [selectedDrugs, setSelectedDrugs] = useState<Set<string>>(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);

  // Column customization state
  const [customizeColumnModalOpen, setCustomizeColumnModalOpen] = useState(false);
  const [columnSettings, setColumnSettings] = useState<DrugColumnSettings>(DEFAULT_DRUG_COLUMN_SETTINGS);



  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter function to show only the latest version of each record
  const filterLatestVersions = (drugs: DrugData[]) => {
    const drugMap = new Map<string, DrugData>();

    drugs.forEach(drug => {
      const key = drug.overview?.drug_name || drug.drug_over_id;

      // If this drug has an original_drug_id, it's an updated version
      if (drug.overview?.original_drug_id) {
        // This is an updated version, replace the original
        drugMap.set(key, drug);
      } else if (!drugMap.has(key)) {
        // This is an original version, add it if we don't have a newer version
        drugMap.set(key, drug);
      }
      // If we already have a newer version, skip this old one
    });

    return Array.from(drugMap.values());
  };

  // Fetch drugs data
  const fetchDrugs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Add cache-busting parameter for refresh
      const url = isRefresh
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/drugs/all-drugs-with-data?t=${Date.now()}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/drugs/all-drugs-with-data`;

      const response = await fetch(url);
      const data: ApiResponse = await response.json();
      const allDrugs = data.drugs || [];

      // Filter out old versions and only show the latest version of each record
      const filteredDrugs = filterLatestVersions(allDrugs);
      setDrugs(filteredDrugs);

      if (isRefresh) {
        console.log('Drugs data refreshed successfully');
      }
    } catch (error) {
      console.error("Error fetching drugs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch drugs data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Check for updated drugs and refresh if needed
  const checkForUpdates = () => {
    const updatedDrugs = localStorage.getItem('updatedDrugs');
    if (updatedDrugs) {
      try {
        const updatedDrugIds = JSON.parse(updatedDrugs);
        if (updatedDrugIds.length > 0) {
          console.log('Found updated drugs, refreshing table:', updatedDrugIds);
          fetchDrugs(true); // Use refresh mode
          // Clear the updated drugs list
          localStorage.removeItem('updatedDrugs');
        }
      } catch (error) {
        console.error('Error parsing updated drugs:', error);
        localStorage.removeItem('updatedDrugs');
      }
    }
  };

  // Handle edit click
  const handleEditClick = (drugId: string) => {
    router.push(`/admin/drugs/edit/${drugId}`);
  };

  // Delete drug
  const deleteDrug = async (drugId: string) => {
    if (!confirm("Are you sure you want to delete this drug?")) return;

    try {
      setDeletingDrugs((prev) => ({ ...prev, [drugId]: true }));

      const currentUserId = localStorage.getItem("userId");
      if (!currentUserId) {
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/drugs/${drugId}/${currentUserId}/delete-all`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Drug deleted successfully",
        });
        // Refresh the list
        fetchDrugs();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete drug",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting drug:", error);
      toast({
        title: "Error",
        description: "Failed to delete drug",
        variant: "destructive",
      });
    } finally {
      setDeletingDrugs((prev) => ({ ...prev, [drugId]: false }));
    }
  };


  // Handle advanced search
  const handleAdvancedSearch = (criteria: DrugSearchCriteria[]) => {
    setAdvancedSearchCriteria(criteria);
  };

  // Handle load query from history
  const handleLoadQuery = (queryData: any) => {
    // Load search criteria
    if (queryData.searchCriteria && Array.isArray(queryData.searchCriteria)) {
      setAdvancedSearchCriteria(queryData.searchCriteria);
    } else if (queryData.criteria && Array.isArray(queryData.criteria)) {
      setAdvancedSearchCriteria(queryData.criteria);
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
      title: "Query Loaded",
      description: `"${queryData.queryTitle || 'Query'}" has been applied to your current view`,
    });
  };

  // Handle edit query from history
  const handleEditQuery = (queryData: any) => {
    console.log('Editing query data:', queryData);

    // Store the query being edited
    setEditingQueryId(queryData.queryId);
    setEditingQueryTitle(queryData.queryTitle || "");
    setEditingQueryDescription(queryData.queryDescription || "");

    // Check if query has advanced search criteria
    const hasAdvancedCriteria = queryData.searchCriteria && Array.isArray(queryData.searchCriteria) && queryData.searchCriteria.length > 0;

    if (hasAdvancedCriteria) {
      // Load the criteria and open Advanced Search modal for editing
      setAdvancedSearchCriteria(queryData.searchCriteria);
      setIsAdvancedSearchOpen(true);
      toast({
        title: "Edit Query",
        description: `Opening Advanced Search with "${queryData.queryTitle}"`,
      });
    } else {
      // No advanced criteria, just open save query modal for editing title/description
      if (queryData.filters) {
        setAppliedFilters(queryData.filters);
      }
      if (queryData.searchTerm) {
        setSearchTerm(queryData.searchTerm);
      }
      setSaveQueryModalOpen(true);
      toast({
        title: "Edit Query",
        description: `Editing "${queryData.queryTitle}"`,
      });
    }
  };

  // Handle filter application
  const handleApplyFilters = (filters: DrugFilterState) => {
    setAppliedFilters(filters);
    const activeFilterCount = Object.values(filters).reduce((count, arr) => count + arr.length, 0);
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

  // Apply advanced search criteria to filter drugs
  const applyAdvancedSearchFilter = (drug: DrugData, criteria: DrugSearchCriteria[]): boolean => {
    if (criteria.length === 0) return true;

    const results = criteria.map((criterion) => {
      const { field, operator, value } = criterion;
      let fieldValue = "";

      // Get the field value from the drug data
      switch (field) {
        case "drug_name":
        case "generic_name":
        case "other_name":
          // Search across all three name fields for better discoverability
          // When user searches by any name field, check all three
          fieldValue = [
            drug.overview.drug_name || "",
            drug.overview.generic_name || "",
            drug.overview.other_name || ""
          ].filter(Boolean).join(" ");
          break;
        case "primary_name":
          fieldValue = drug.overview.primary_name || "";
          break;
        case "global_status":
          fieldValue = drug.overview.global_status || "";
          break;
        case "development_status":
          fieldValue = drug.overview.development_status || "";
          break;
        case "originator":
          fieldValue = drug.overview.originator || "";
          break;
        case "other_active_companies":
          fieldValue = drug.overview.other_active_companies || "";
          break;
        case "therapeutic_area":
          fieldValue = drug.overview.therapeutic_area || "";
          break;
        case "disease_type":
          fieldValue = drug.overview.disease_type || "";
          break;
        case "regulator_designations":
          fieldValue = drug.overview.regulator_designations || "";
          break;
        case "drug_record_status":
          fieldValue = drug.overview.drug_record_status || "";
          break;
        case "is_approved":
          fieldValue = drug.overview.is_approved ? "true" : "false";
          break;
        case "mechanism_of_action":
          fieldValue = drug.activity.map(a => a.mechanism_of_action).filter(Boolean).join(" ");
          break;
        case "biological_target":
          fieldValue = drug.activity.map(a => a.biological_target).filter(Boolean).join(" ");
          break;
        case "drug_technology":
          fieldValue = drug.activity.map(a => a.drug_technology).filter(Boolean).join(" ");
          break;
        case "delivery_route":
          fieldValue = drug.activity.map(a => a.delivery_route).filter(Boolean).join(" ");
          break;
        case "delivery_medium":
          fieldValue = drug.activity.map(a => a.delivery_medium).filter(Boolean).join(" ");
          break;
        case "company":
          fieldValue = drug.devStatus.map(d => d.company).filter(Boolean).join(" ");
          break;
        case "company_type":
          fieldValue = drug.devStatus.map(d => d.company_type).filter(Boolean).join(" ");
          break;
        case "status":
          fieldValue = drug.devStatus.map(d => d.status).filter(Boolean).join(" ");
          break;
        case "created_at":
          fieldValue = drug.overview.created_at || "";
          break;
        case "updated_at":
          fieldValue = drug.overview.updated_at || "";
          break;
        case "drug_summary":
          fieldValue = drug.overview.drug_summary || "";
          break;
        case "source_link":
          fieldValue = drug.overview.source_link || "";
          break;
        case "agreement":
          fieldValue = drug.licencesMarketing.map(l => l.agreement).filter(Boolean).join(" ");
          break;
        case "licensing_availability":
          fieldValue = drug.licencesMarketing.map(l => l.licensing_availability).filter(Boolean).join(" ");
          break;
        case "marketing_approvals":
          fieldValue = drug.licencesMarketing.map(l => l.marketing_approvals).filter(Boolean).join(" ");
          break;
        case "drug_changes_log":
          fieldValue = drug.logs.map(l => l.drug_changes_log).filter(Boolean).join(" ");
          break;
        case "last_modified_user":
          fieldValue = drug.logs.map(l => l.last_modified_user).filter(Boolean).join(" ");
          break;
        case "next_review_date":
          fieldValue = drug.logs.map(l => l.next_review_date).filter(Boolean).join(" ");
          break;
        case "notes":
          fieldValue = drug.logs.map(l => l.notes).filter(Boolean).join(" ");
          break;
        case "preclinical":
          fieldValue = drug.development.map(d => d.preclinical).filter(Boolean).join(" ");
          break;
        case "trial_id":
          fieldValue = drug.development.map(d => d.trial_id).filter(Boolean).join(" ");
          break;
        case "title":
          fieldValue = drug.development.map(d => d.title).filter(Boolean).join(" ");
          break;
        case "primary_drugs":
          fieldValue = drug.development.map(d => d.primary_drugs).filter(Boolean).join(" ");
          break;
        case "sponsor":
          fieldValue = drug.development.map(d => d.sponsor).filter(Boolean).join(" ");
          break;
        case "therapeutic_class":
          fieldValue = drug.devStatus.map(d => d.therapeutic_class).filter(Boolean).join(" ");
          break;
        case "reference":
          fieldValue = drug.devStatus.map(d => d.reference).filter(Boolean).join(" ");
          break;
        case "data":
          fieldValue = drug.otherSources.map(o => o.data).filter(Boolean).join(" ");
          break;
        case "full_review_user":
          fieldValue = drug.logs.map(l => l.full_review_user).filter(Boolean).join(" ");
          break;
        case "created_date":
          fieldValue = drug.logs.map(l => l.created_date).filter(Boolean).join(" ");
          break;
        default:
          fieldValue = "";
      }

      // Apply the operator
      const searchValue = value.toLowerCase();
      const targetValue = fieldValue.toLowerCase();

      switch (operator) {
        case "contains":
          return targetValue.includes(searchValue);
        case "is":
          return targetValue === searchValue;
        case "is_not":
          return targetValue !== searchValue;
        case "starts_with":
          return targetValue.startsWith(searchValue);
        case "ends_with":
          return targetValue.endsWith(searchValue);
        case "equals":
          return targetValue === searchValue;
        case "not_equals":
          return targetValue !== searchValue;
        case "greater_than":
          return parseFloat(fieldValue) > parseFloat(value);
        case "greater_than_or_equal":
          return parseFloat(fieldValue) >= parseFloat(value);
        case "less_than":
          return parseFloat(fieldValue) < parseFloat(value);
        case "less_than_or_equal":
          return parseFloat(fieldValue) <= parseFloat(value);
        default:
          return true;
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

    return finalResult;
  };

  // Sorting functions
  const getSortValue = (drug: DrugData, field: string): string | number => {
    switch (field) {
      case "drugId": return drug.drug_over_id;
      case "drugName": return drug.overview.drug_name || "";
      case "genericName": return drug.overview.generic_name || "";
      case "otherName": return drug.overview.other_name || "";
      case "primaryName": return drug.overview.primary_name || "";
      case "globalStatus": return drug.overview.global_status || "";
      case "developmentStatus": return drug.overview.development_status || "";
      case "drugSummary": return drug.overview.drug_summary || "";
      case "originator": return drug.overview.originator || "";
      case "otherActiveCompanies": return drug.overview.other_active_companies || "";
      case "therapeuticArea": return drug.overview.therapeutic_area || "";
      case "diseaseType": return drug.overview.disease_type || "";
      case "regulatorDesignations": return drug.overview.regulator_designations || "";
      case "sourceLink": return drug.overview.source_link || "";
      case "drugRecordStatus": return drug.overview.drug_record_status || "";
      case "createdAt": return drug.overview.created_at || "";
      case "updatedAt": return drug.overview.updated_at || "";
      case "mechanismOfAction": return drug.activity.map(a => a.mechanism_of_action).join(", ");
      case "biologicalTarget": return drug.activity.map(a => a.biological_target).join(", ");
      case "drugTechnology": return drug.activity.map(a => a.drug_technology).join(", ");
      case "deliveryRoute": return drug.activity.map(a => a.delivery_route).join(", ");
      case "deliveryMedium": return drug.activity.map(a => a.delivery_medium).join(", ");
      case "therapeuticClass": return drug.devStatus.map(d => d.therapeutic_class).join(", ");
      case "company": return drug.devStatus.map(d => d.company).join(", ");
      case "companyType": return drug.devStatus.map(d => d.company_type).join(", ");
      case "country": return drug.devStatus.map(d => d.country).join(", ");
      case "status": return drug.devStatus.map(d => d.status).join(", ");
      case "reference": return drug.devStatus.map(d => d.reference).join(", ");
      case "agreement": return drug.licencesMarketing.map(l => l.agreement).join(", ");
      case "marketingApprovals": return drug.licencesMarketing.map(l => l.marketing_approvals).join(", ");
      case "licensingAvailability": return drug.licencesMarketing.map(l => l.licensing_availability).join(", ");
      case "preclinical": return drug.development.map(d => d.preclinical).join(", ");
      case "trialId": return drug.development.map(d => d.trial_id).join(", ");
      case "title": return drug.development.map(d => d.title).join(", ");
      case "primaryDrugs": return drug.development.map(d => d.primary_drugs).join(", ");
      case "sponsor": return drug.development.map(d => d.sponsor).join(", ");
      default: return "";
    }
  };

  // Filter drugs based on search term, advanced search criteria, and filters
  const filteredDrugs = drugs.filter((drug) => {
    // Basic search term filter
    const matchesSearchTerm = searchTerm === "" ||
      (drug.overview.drug_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (drug.overview.generic_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (drug.overview.other_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (drug.overview.therapeutic_area || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (drug.overview.disease_type || "").toLowerCase().includes(searchTerm.toLowerCase());

    // Advanced search filter
    const matchesAdvancedSearch = applyAdvancedSearchFilter(drug, advancedSearchCriteria);

    // Apply filters
    const matchesFilters = (
      (appliedFilters.globalStatuses.length === 0 ||
        appliedFilters.globalStatuses.includes(drug.overview.global_status || "")) &&
      (appliedFilters.developmentStatuses.length === 0 ||
        appliedFilters.developmentStatuses.includes(drug.overview.development_status || "")) &&
      (appliedFilters.therapeuticAreas.length === 0 ||
        appliedFilters.therapeuticAreas.includes(drug.overview.therapeutic_area || "")) &&
      (appliedFilters.diseaseTypes.length === 0 ||
        appliedFilters.diseaseTypes.includes(drug.overview.disease_type || "")) &&
      (appliedFilters.originators.length === 0 ||
        appliedFilters.originators.includes(drug.overview.originator || "")) &&
      (appliedFilters.otherActiveCompanies.length === 0 ||
        appliedFilters.otherActiveCompanies.some(company =>
          (drug.overview.other_active_companies || "").toLowerCase().includes(company.toLowerCase()))) &&
      (appliedFilters.regulatorDesignations.length === 0 ||
        appliedFilters.regulatorDesignations.some(designation =>
          (drug.overview.regulator_designations || "").toLowerCase().includes(designation.toLowerCase()))) &&
      (appliedFilters.drugRecordStatus.length === 0 ||
        appliedFilters.drugRecordStatus.includes(drug.overview.drug_record_status || "")) &&
      (appliedFilters.isApproved.length === 0 ||
        appliedFilters.isApproved.includes(drug.overview.is_approved ? "Yes" : "No")) &&
      (appliedFilters.companyTypes.length === 0 ||
        drug.devStatus.length > 0 && appliedFilters.companyTypes.includes(drug.devStatus[0].company_type || "")) &&
      (appliedFilters.mechanismOfAction.length === 0 ||
        drug.activity.length > 0 && appliedFilters.mechanismOfAction.includes(drug.activity[0].mechanism_of_action || "")) &&
      (appliedFilters.biologicalTargets.length === 0 ||
        drug.activity.length > 0 && appliedFilters.biologicalTargets.includes(drug.activity[0].biological_target || "")) &&
      (appliedFilters.drugTechnologies.length === 0 ||
        drug.activity.length > 0 && appliedFilters.drugTechnologies.includes(drug.activity[0].drug_technology || "")) &&
      (appliedFilters.deliveryRoutes.length === 0 ||
        drug.activity.length > 0 && appliedFilters.deliveryRoutes.includes(drug.activity[0].delivery_route || "")) &&
      (appliedFilters.deliveryMediums.length === 0 ||
        drug.activity.length > 0 && appliedFilters.deliveryMediums.includes(drug.activity[0].delivery_medium || "")) &&
      (appliedFilters.therapeuticClasses.length === 0 ||
        drug.devStatus.length > 0 && appliedFilters.therapeuticClasses.some(tc => drug.devStatus.some(d => d.therapeutic_class === tc))) &&
      (appliedFilters.countries.length === 0 ||
        drug.devStatus.length > 0 && appliedFilters.countries.some(c => drug.devStatus.some(d => d.country === c))) &&
      (appliedFilters.primaryNames.length === 0 ||
        appliedFilters.primaryNames.includes(drug.overview.primary_name || ""))
    );

    return matchesSearchTerm && matchesAdvancedSearch && matchesFilters;
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

  // Pagination logic
  const totalItems = filteredDrugs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDrugs = filteredDrugs.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, advancedSearchCriteria, appliedFilters, itemsPerPage]);



  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle sort direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleColumnSettingsChange = (newSettings: DrugColumnSettings) => {
    setColumnSettings(newSettings);
    // Save to localStorage
    localStorage.setItem('adminDrugColumnSettings', JSON.stringify(newSettings));
  };

  // Multiple selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allDrugIds = new Set(paginatedDrugs.map(drug => drug.drug_over_id));
      setSelectedDrugs(allDrugIds);
      setIsSelectAllChecked(true);
    } else {
      setSelectedDrugs(new Set());
      setIsSelectAllChecked(false);
    }
  };

  const handleSelectDrug = (drugId: string, checked: boolean) => {
    const newSelectedDrugs = new Set(selectedDrugs);
    if (checked) {
      newSelectedDrugs.add(drugId);
    } else {
      newSelectedDrugs.delete(drugId);
    }
    setSelectedDrugs(newSelectedDrugs);

    // Update select all checkbox state
    setIsSelectAllChecked(newSelectedDrugs.size === paginatedDrugs.length);
  };

  const handleViewSelectedDrugs = (openInTabs: boolean = true) => {
    if (selectedDrugs.size === 0) {
      toast({
        title: "No drugs selected",
        description: "Please select at least one drug to view.",
        variant: "destructive",
      });
      return;
    }

    const selectedDrugIds = Array.from(selectedDrugs);

    if (openInTabs) {
      // Open in new tabs
      selectedDrugIds.forEach(drugId => {
        window.open(`/admin/drugs/${drugId}`, '_blank');
      });
    } else {
      // Open in popup windows
      selectedDrugIds.forEach((drugId, index) => {
        const popup = window.open(
          `/admin/drugs/${drugId}`,
          `drug_${drugId}`,
          `width=1200,height=800,scrollbars=yes,resizable=yes,left=${100 + (index * 50)},top=${100 + (index * 50)}`
        );
        if (!popup) {
          toast({
            title: "Popup blocked",
            description: "Please allow popups for this site to open multiple drugs.",
            variant: "destructive",
          });
        }
      });
    }

    toast({
      title: "Drugs opened",
      description: `Opened ${selectedDrugIds.length} drug${selectedDrugIds.length > 1 ? 's' : ''} successfully.`,
    });
  };

  const primaryNameOptions = useMemo(() => {
    const uniqueNames = new Set<string>();
    const options: SearchableSelectOption[] = [];
    drugs.forEach(d => {
      const name = d.overview.primary_name;
      if (name && !uniqueNames.has(name)) {
        uniqueNames.add(name);
        options.push({ value: name, label: name });
      }
    });
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [drugs]);

  const handleExportSelected = () => {
    if (selectedDrugs.size === 0) {
      toast({
        title: "No drugs selected",
        description: "Please select at least one drug to export.",
        variant: "destructive",
      });
      return;
    }

    const selectedDrugData = drugs.filter(drug => selectedDrugs.has(drug.drug_over_id));

    // Create CSV content
    const csvContent = [
      // Header
      ['Drug ID', 'Drug Name', 'Generic Name', 'Therapeutic Area', 'Disease Type', 'Global Status', 'Development Status', 'Originator', 'Created Date'].join(','),
      // Data rows
      ...selectedDrugData.map(drug => [
        drug.drug_over_id,
        `"${drug.overview.drug_name || 'Untitled'}"`,
        `"${drug.overview.generic_name || 'N/A'}"`,
        `"${drug.overview.therapeutic_area || 'N/A'}"`,
        `"${drug.overview.disease_type || 'N/A'}"`,
        `"${drug.overview.global_status || 'Unknown'}"`,
        `"${drug.overview.development_status || 'Unknown'}"`,
        `"${drug.overview.originator || 'N/A'}"`,
        `"${formatDate(drug.overview.created_at)}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `drugs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${selectedDrugData.length} drug${selectedDrugData.length > 1 ? 's' : ''} to CSV.`,
    });
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchDrugs();

    // Load column settings from localStorage
    const savedSettings = localStorage.getItem('adminDrugColumnSettings');
    if (savedSettings) {
      try {
        setColumnSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading column settings:', error);
      }
    }
  }, []);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check for URL refresh parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh') === 'true') {
      console.log('Refresh parameter detected, refreshing data...');
      fetchDrugs(true);
      // Remove the refresh parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Check for updates when component mounts or when user returns to page
  useEffect(() => {
    checkForUpdates();
  }, []);

  // Also check for updates when the page becomes visible (user returns from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    const handleFocus = () => {
      checkForUpdates();
    };

    const handleDrugUpdated = (event: CustomEvent) => {
      console.log('Drug updated event received:', event.detail);
      fetchDrugs(true);
      toast({
        title: "Data Refreshed",
        description: "Drug data has been updated and refreshed.",
        duration: 3000,
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('drugUpdated', handleDrugUpdated as EventListener);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('drugUpdated', handleDrugUpdated as EventListener);
    };
  }, []);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    return formatDateToMMDDYYYY(dateString);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      Approved: "bg-emerald-100 text-emerald-700",
      Pending: "bg-amber-100 text-amber-700",
      Rejected: "bg-red-100 text-red-700",
      Discontinued: "bg-gray-100 text-gray-700",
      "Under Review": "bg-blue-100 text-blue-700",
      "Phase I": "bg-purple-100 text-purple-700",
      "Phase II": "bg-indigo-100 text-indigo-700",
      "Phase III": "bg-blue-100 text-blue-700",
      "Phase IV": "bg-green-100 text-green-700",
    };
    return statusColors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Drugs</h1>
            <p className="text-sm text-muted-foreground">Loading drugs...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading drugs data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-0 min-w-full">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold">Drugs</h1>
          <p className="text-sm text-muted-foreground">
            Browse and manage all drugs. Total: {drugs.length}
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
            onClick={() => fetchDrugs(true)}
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
              "/admin/drugs/new",
              "add_new_drug",
              "width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no"
            );
            if (!popup) {
              toast({
                title: "Popup blocked",
                description: "Please allow popups for this site to add new drugs.",
                variant: "destructive",
              });
            }
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Drug
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search drugs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {(advancedSearchCriteria.length > 0 || Object.values(appliedFilters).some(arr => arr.length > 0)) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAdvancedSearchCriteria([]);
              setAppliedFilters({
                globalStatuses: [],
                developmentStatuses: [],
                therapeuticAreas: [],
                diseaseTypes: [],
                originators: [],
                otherActiveCompanies: [],
                regulatorDesignations: [],
                drugRecordStatus: [],
                isApproved: [],
                companyTypes: [],
                mechanismOfAction: [],
                biologicalTargets: [],
                drugTechnologies: [],
                deliveryRoutes: [],
                deliveryMediums: [],
                therapeuticClasses: [],
                countries: [],
                primaryNames: []
              });
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Selection Controls */}
      {selectedDrugs.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-800">
              {selectedDrugs.size} drug{selectedDrugs.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewSelectedDrugs(false)}
                className="bg-white hover:bg-gray-50 text-blue-700 border-blue-300"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Open in Popups
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
              setSelectedDrugs(new Set());
              setIsSelectAllChecked(false);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Sort By Dropdown */}
      {/* Sort By Dropdown and Query Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Sort By
              {sortField && (
                <span className="ml-2 text-xs">
                  {sortDirection === "asc" ? "↑" : "↓"}
                </span>
              )}
            </Button>
            {sortDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1 max-h-60 overflow-y-auto">
                  {DRUG_COLUMN_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        handleSort(option.key);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortField === option.key ? "bg-gray-100 font-semibold" : ""
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {sortField === option.key && (
                          <span className="text-xs">
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
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        {refreshing && (
          <div className="flex items-center justify-center py-2 bg-blue-50 border-b">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-blue-600">Refreshing data...</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-12">
                  <Checkbox
                    checked={isSelectAllChecked}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {DRUG_COLUMN_OPTIONS.map((option) => (
                  columnSettings[option.key] && (
                    <TableHead key={option.key} className="whitespace-nowrap">
                      {option.label}
                    </TableHead>
                  )
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDrugs.map((drug) => (
                <TableRow key={drug.drug_over_id} className="hover:bg-muted/40">
                  <TableCell>
                    <Checkbox
                      checked={selectedDrugs.has(drug.drug_over_id)}
                      onCheckedChange={(checked) => handleSelectDrug(drug.drug_over_id, checked as boolean)}
                    />
                  </TableCell>
                  {DRUG_COLUMN_OPTIONS.map((option) => {
                    if (!columnSettings[option.key]) return null;

                    let content: React.ReactNode = null;
                    const val = getSortValue(drug, option.key); // Use getSortValue to extract raw data

                    switch (option.key) {
                      case 'drugId':
                        content = <span className="font-mono text-sm">{String(val).slice(0, 8)}...</span>;
                        break;
                      case 'drugName':
                        content = <span className="font-medium">{val}</span>;
                        break;
                      case 'diseaseType':
                        content = val ? <Badge variant="outline">{val}</Badge> : null;
                        break;
                      case 'globalStatus':
                        // reuse getStatusColor logic if available or just render text
                        content = val ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(String(val))
                            }`}>
                            {val}
                          </span>
                        ) : null;
                        break;
                      case 'sourceLink':
                        content = val ? (
                          <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                            Link <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        ) : null;
                        break;
                      case 'createdAt':
                      case 'updatedAt':
                        content = val ? formatDateToMMDDYYYY(String(val)) : "";
                        break;
                      default:
                        content = val;
                    }

                    return (
                      <TableCell key={option.key} className="whitespace-nowrap max-w-[200px] truncate">
                        {content}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/drugs/${drug.drug_over_id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/drugs/edit/${drug.drug_over_id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDrug(drug.drug_over_id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} drugs
            </TableCaption>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {
        totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="items-per-page" className="text-sm font-medium">
                  Results per page:
                </Label>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}>
                  <SelectTrigger className="w-20">
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
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} results
              </div>
            </div>

            {totalPages > 1 && (
              <Pagination>
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
        )
      }

      {/* Advanced Search Modal */}
      <DrugAdvancedSearchModal
        open={isAdvancedSearchOpen}
        onOpenChange={(open) => {
          setIsAdvancedSearchOpen(open);
          if (!open) {
            // Reset editing state when modal closes
            setEditingQueryId(null);
            setEditingQueryTitle("");
            setEditingQueryDescription("");
          }
        }}
        onApplySearch={handleAdvancedSearch}
        initialCriteria={advancedSearchCriteria}
        currentFilters={appliedFilters}
        editingQueryId={editingQueryId}
        editingQueryTitle={editingQueryTitle}
        editingQueryDescription={editingQueryDescription}
        onSaveQuerySuccess={() => {
          // Reset editing state after successful save
          setEditingQueryId(null);
          setEditingQueryTitle("");
          setEditingQueryDescription("");
        }}
      />

      {/* Filter Modal */}
      <DrugFilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        onApplyFilters={handleApplyFilters}
        currentFilters={appliedFilters}
        primaryNameOptions={primaryNameOptions}
      />

      {/* Save Query Modal */}
      <DrugSaveQueryModal
        open={saveQueryModalOpen}
        onOpenChange={(open) => {
          setSaveQueryModalOpen(open);
          if (!open) {
            // Reset editing state when modal closes
            setEditingQueryId(null);
            setEditingQueryTitle("");
            setEditingQueryDescription("");
          }
        }}
        currentFilters={appliedFilters}
        currentSearchCriteria={advancedSearchCriteria}
        searchTerm={searchTerm}
        editingQueryId={editingQueryId}
        editingQueryTitle={editingQueryTitle}
        editingQueryDescription={editingQueryDescription}
      />

      {/* Query History Modal */}
      <QueryHistoryModal
        open={queryHistoryModalOpen}
        onOpenChange={setQueryHistoryModalOpen}
        onLoadQuery={handleLoadQuery}
        onEditQuery={handleEditQuery}
      />

      {/* Drug Customize Column Modal */}
      <DrugCustomizeColumnModal
        open={customizeColumnModalOpen}
        onOpenChange={setCustomizeColumnModalOpen}
        columnSettings={columnSettings}
        onColumnSettingsChange={handleColumnSettingsChange}
      />
    </div >
  );
}
