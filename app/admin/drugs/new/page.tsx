"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X, Eye, EyeOff } from "lucide-react";
import NotesSection, { NoteItem } from "@/components/notes-section";
import CustomDateInput from "@/components/ui/custom-date-input";
import { useToast } from "@/hooks/use-toast";
import { useContent } from "@/hooks/use-content";
import { useDrugNames } from "@/hooks/use-drug-names";
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown";

interface DrugFormData {
  overview: {
    drug_name: string;
    generic_name: string;
    other_name: string;
    primary_name: string;
    global_status: string;
    development_status: string;
    drug_summary: string;
    originator: string;
    other_active_companies: string;
    therapeutic_area: string;
    disease_type: string;
    regulator_designations: string;
    source_link: string;
    drug_record_status: string;
    attachments: string[];
    links: string[];
    drug_development_status_rows: Array<{
      disease_type: string;
      therapeutic_class: string;
      company: string;
      company_type: string;
      country: string;
      development_status: string;
      reference: string;
    }>;
  };
  drugActivity: {
    mechanism_of_action: string;
    biological_target: string;
    delivery_route: string;
    drug_technology: string;
    delivery_medium: string;
    therapeutic_class_development_rows: Array<{
      therapeutic_class: string;
      development_status: string;
    }>;
  };
  development: {
    disease_type: string;
    therapeutic_class: string;
    company: string;
    company_type: string;
    status: string;
    reference: string;
    add_attachments: string[];
    add_links: string[];
  };
  otherSources: {
    pipelineData: string;
    pressReleases: string;
    publications: string;
  };
  licensingMarketing: {
    agreement: string;
    marketing_approvals: string;
    licensing_availability: string;
    agreement_rows: Array<{ value: string; enabled: boolean }>;
    licensing_availability_rows: Array<{ value: string; enabled: boolean }>;
    marketing_approvals_rows: Array<{ value: string; enabled: boolean }>;
  };
  logs: {
    drug_changes_log: string;
    drug_added_date: string;
    last_modified_date: string;
    last_modified_user: string;
    full_review_user: string;
    full_review: boolean;
    next_review_date: string;
    notes: string;
  };
}

const steps = [
  { id: 1, title: "Overview", description: "Basic drug information" },
  { id: 2, title: "Drug Activity", description: "Mechanism and biological details" },
  { id: 3, title: "Development", description: "Development status and company info" },
  { id: 4, title: "Other Sources", description: "Additional data sources" },
  { id: 5, title: "Licensing & Marketing", description: "Commercial information" },
  { id: 6, title: "Logs", description: "Change logs and notes" },
];

export default function NewDrugPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addDrugName, getPrimaryNameOptions } = useDrugNames();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("pipeline_data");

  // Dynamic dropdown for Originator (uses Sponsor and Collaborators from dropdown management)
  const { options: originatorOptions, loading: originatorLoading } = useDynamicDropdown({
    categoryName: 'sponsor_collaborators',
  });

  // State for attachment and link inputs
  const [attachmentInput, setAttachmentInput] = useState("");
  const [linkInput, setLinkInput] = useState("");

  // Options for searchable dropdowns
  const primaryNameOptions: SearchableSelectOption[] = [
    ...getPrimaryNameOptions().map(drug => ({
      value: drug.value,
      label: drug.label
    }))
  ];

  const globalStatusOptions: SearchableSelectOption[] = [
    { value: "clinical_phase_1", label: "Clinical Phase I" },
    { value: "clinical_phase_2", label: "Clinical Phase II" },
    { value: "clinical_phase_3", label: "Clinical Phase III" },
    { value: "clinical_phase_4", label: "Clinical Phase IV" },
    { value: "discontinued", label: "Discontinued" },
    { value: "launched", label: "Launched" },
    { value: "no_development_reported", label: "No Development Reported" },
    { value: "preclinical", label: "Preclinical" },
  ];

  const developmentStatusOptions: SearchableSelectOption[] = [
    { value: "active_development", label: "Active development" },
    { value: "discontinued", label: "Discontinued" },
    { value: "marketed", label: "Marketed" },
  ];

  // originatorOptions is now loaded dynamically via useDynamicDropdown hook above

  const therapeuticAreaOptions: SearchableSelectOption[] = [
    { value: "oncology", label: "Oncology" },
    { value: "cardiology", label: "Cardiology" },
    { value: "neurology", label: "Neurology" },
    { value: "immunology", label: "Immunology" },
    { value: "endocrinology", label: "Endocrinology" },
  ];

  const diseaseTypeOptions: SearchableSelectOption[] = [
    { value: "lung_cancer", label: "Lung Cancer" },
    { value: "breast_cancer", label: "Breast Cancer" },
    { value: "diabetes", label: "Diabetes" },
    { value: "hypertension", label: "Hypertension" },
    { value: "alzheimers", label: "Alzheimer's Disease" },
  ];

  const regulatoryDesignationsOptions: SearchableSelectOption[] = [
    { value: "breakthrough_therapy", label: "Breakthrough Therapy" },
    { value: "fast_track", label: "Fast Track" },
    { value: "orphan_drug", label: "Orphan Drug" },
    { value: "priority_review", label: "Priority Review" },
  ];

  const drugRecordStatusOptions: SearchableSelectOption[] = [
    { value: "development_in_progress", label: "Development In Progress (DIP)" },
    { value: "in_production", label: "In Production (IP)" },
    { value: "update_in_progress", label: "Update In Progress (UIP)" },
  ];

  const drugTechnologyOptions: SearchableSelectOption[] = [
    { value: "proprietary", label: "Proprietary" },
    { value: "licensed", label: "Licensed" },
    { value: "partnership", label: "Partnership" },
    { value: "open_source", label: "Open Source" },
  ];

  // Options for Drug Activity Tab
  const mechanismOfActionOptions: SearchableSelectOption[] = [
    { value: "alkylating_agents", label: "Alkylating Agents" },
    { value: "antimetabolites", label: "Antimetabolites" },
    { value: "topoisomerase_inhibitors", label: "Topoisomerase Inhibitors" },
    { value: "mitotic_inhibitors", label: "Mitotic Inhibitors" },
    { value: "monoclonal_antibodies", label: "Monoclonal Antibodies (mAbs)" },
    { value: "tyrosine_kinase_inhibitors", label: "Tyrosine Kinase Inhibitors (TKIs)" },
    { value: "proteasome_inhibitors", label: "Proteasome Inhibitors" },
    { value: "mtor_inhibitors", label: "mTOR Inhibitors" },
    { value: "parp_inhibitors", label: "PARP Inhibitors" },
    { value: "aromatase_inhibitors", label: "Aromatase Inhibitors" },
  ];

  const biologicalTargetOptions: SearchableSelectOption[] = [
    { value: "egfr", label: "EGFR (Epidermal Growth Factor Receptor)" },
    { value: "her2", label: "HER2 (Human Epidermal Growth Factor Receptor 2)" },
    { value: "vegf", label: "VEGF (Vascular Endothelial Growth Factor)" },
    { value: "met", label: "MET (Hepatocyte Growth Factor Receptor, c-MET)" },
    { value: "alk", label: "ALK (Anaplastic Lymphoma Kinase)" },
    { value: "pd1", label: "PD-1 (Programmed Death-1)" },
    { value: "pdl1", label: "PD-L1 (Programmed Death-Ligand 1)" },
    { value: "ctla4", label: "CTLA-4 (Cytotoxic T-Lymphocyte-Associated Protein 4)" },
    { value: "cdk46", label: "CDK4/6 (Cyclin-Dependent Kinases 4/6)" },
    { value: "aurora_kinases", label: "Aurora Kinases" },
    { value: "parp", label: "PARP (Poly ADP-Ribose Polymerase)" },
    { value: "hdacs", label: "Histone Deacetylases (HDACs)" },
    { value: "dnmts", label: "DNA Methyltransferases (DNMTs)" },
  ];

  const deliveryRouteOptions: SearchableSelectOption[] = [
    { value: "oral", label: "Oral" },
    { value: "injectable", label: "Injectable" },
    { value: "topical", label: "Topical" },
    { value: "inhalation", label: "Inhalation" },
    { value: "ophthalmic", label: "Ophthalmic" },
    { value: "nasal", label: "Nasal" },
    { value: "otic", label: "Otic" },
    { value: "rectal", label: "Rectal" },
    { value: "vaginal", label: "Vaginal" },
  ];

  const deliveryMediumOptions: SearchableSelectOption[] = [
    { value: "tablet", label: "Tablet" },
    { value: "capsule", label: "Capsule" },
    { value: "injection", label: "Injection" },
    { value: "infusion", label: "Infusion" },
    { value: "cream", label: "Cream" },
    { value: "ointment", label: "Ointment" },
    { value: "gel", label: "Gel" },
    { value: "patch", label: "Patch" },
    { value: "inhaler", label: "Inhaler" },
    { value: "spray", label: "Spray" },
    { value: "drops", label: "Drops" },
    { value: "suppository", label: "Suppository" },
  ];

  // Drug Development Status Options
  const THERAPEUTIC_CLASS_OPTIONS: SearchableSelectOption[] = [
    { value: "alkylating_agents", label: "Alkylating Agents" },
    { value: "antimetabolites", label: "Antimetabolites" },
    { value: "topoisomerase_inhibitors", label: "Topoisomerase Inhibitors" },
    { value: "mitotic_inhibitors", label: "Mitotic Inhibitors" },
    { value: "monoclonal_antibodies", label: "Monoclonal Antibodies (mAbs)" },
    { value: "tyrosine_kinase_inhibitors", label: "Tyrosine Kinase Inhibitors (TKIs)" },
    { value: "proteasome_inhibitors", label: "Proteasome Inhibitors" },
    { value: "mtor_inhibitors", label: "mTOR Inhibitors" },
    { value: "parp_inhibitors", label: "PARP Inhibitors" },
    { value: "aromatase_inhibitors", label: "Aromatase Inhibitors" },
  ];

  const COMPANY_OPTIONS: SearchableSelectOption[] = [
    { value: "pfizer", label: "Pfizer" },
    { value: "novartis", label: "Novartis" },
    { value: "roche", label: "Roche" },
    { value: "merck", label: "Merck" },
    { value: "johnson_johnson", label: "Johnson & Johnson" },
    { value: "bristol_myers_squibb", label: "Bristol Myers Squibb" },
    { value: "gilead", label: "Gilead Sciences" },
    { value: "abbvie", label: "AbbVie" },
    { value: "amgen", label: "Amgen" },
    { value: "biogen", label: "Biogen" },
  ];

  const COMPANY_TYPE_OPTIONS: SearchableSelectOption[] = [
    { value: "originator", label: "Originator" },
    { value: "licensee", label: "Licensee" },
  ];

  const COUNTRY_OPTIONS: SearchableSelectOption[] = [
    { value: "united_states", label: "United States" },
    { value: "canada", label: "Canada" },
    { value: "united_kingdom", label: "United Kingdom" },
    { value: "germany", label: "Germany" },
    { value: "france", label: "France" },
    { value: "italy", label: "Italy" },
    { value: "spain", label: "Spain" },
    { value: "japan", label: "Japan" },
    { value: "china", label: "China" },
    { value: "india", label: "India" },
    { value: "australia", label: "Australia" },
    { value: "brazil", label: "Brazil" },
    { value: "mexico", label: "Mexico" },
    { value: "south_korea", label: "South Korea" },
    { value: "switzerland", label: "Switzerland" },
    { value: "netherlands", label: "Netherlands" },
    { value: "belgium", label: "Belgium" },
    { value: "sweden", label: "Sweden" },
    { value: "norway", label: "Norway" },
    { value: "denmark", label: "Denmark" },
  ];

  const DEVELOPMENT_STATUS_OPTIONS_DETAILED: SearchableSelectOption[] = [
    { value: "launched", label: "Launched" },
    { value: "no_development_reported", label: "No Development Reported" },
    { value: "discontinued", label: "Discontinued" },
    { value: "clinical_phase_1", label: "Clinical Phase I" },
    { value: "clinical_phase_2", label: "Clinical Phase II" },
    { value: "clinical_phase_3", label: "Clinical Phase III" },
    { value: "clinical_phase_4", label: "Clinical Phase IV" },
    { value: "preclinical", label: "Preclinical" },
  ];

  // Therapeutic Class Development Status Options
  const THERAPEUTIC_CLASS_DEVELOPMENT_STATUS_OPTIONS: SearchableSelectOption[] = [
    { value: "launched", label: "Launched" },
    { value: "no_development_reported", label: "No Development Reported" },
    { value: "discontinued", label: "Discontinued" },
    { value: "clinical_phase_1", label: "Clinical Phase I" },
    { value: "clinical_phase_2", label: "Clinical Phase II" },
    { value: "clinical_phase_3", label: "Clinical Phase III" },
    { value: "clinical_phase_4", label: "Clinical Phase IV" },
    { value: "preclinical", label: "Preclinical" },
  ];

  const { content, updateContent, resetContent } = useContent<DrugFormData>({
    overview: {
      drug_name: "",
      generic_name: "",
      other_name: "",
      primary_name: "",
      global_status: "",
      development_status: "",
      drug_summary: "",
      originator: "",
      other_active_companies: "",
      therapeutic_area: "",
      disease_type: "",
      regulator_designations: "",
      source_link: "",
      drug_record_status: "",
      attachments: [],
      links: [],
      drug_development_status_rows: [],
    },
    drugActivity: {
      mechanism_of_action: "",
      biological_target: "",
      delivery_route: "",
      drug_technology: "",
      delivery_medium: "",
      therapeutic_class_development_rows: [],
    },
    development: {
      disease_type: "",
      therapeutic_class: "",
      company: "",
      company_type: "",
      status: "",
      reference: "",
      add_attachments: [],
      add_links: [],
    },
    otherSources: {
      pipelineData: "",
      pressReleases: "",
      publications: ""
    },
    licensingMarketing: {
      agreement: "",
      marketing_approvals: "",
      licensing_availability: "",
      agreement_rows: [{ value: "", enabled: true }],
      licensing_availability_rows: [{ value: "", enabled: true }],
      marketing_approvals_rows: [{ value: "", enabled: true }],
    },
    logs: {
      drug_changes_log: "Initial creation",
      drug_added_date: "",
      last_modified_date: "",
      last_modified_user: "",
      full_review_user: "",
      full_review: false,
      next_review_date: "",
      notes: "",
    },
  });

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return content.overview.drug_name.trim() !== "";
      case 2:
        return content.drugActivity.mechanism_of_action.trim() !== "";
      case 3:
        return (
          content.development.company.trim() !== "" &&
          content.development.therapeutic_class.trim() !== ""
        );
      case 4:
        return true; // Optional step
      case 5:
        return true; // Optional step
      case 6:
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const currentUserId = localStorage.getItem("userId");

      if (!currentUserId) {
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        });
        return;
      }

      console.log("Submitting drug data:", content);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/drugs/create-drug`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: currentUserId,
            ...content,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Drug created successfully",
        });
        resetContent();
        router.push("/admin/drugs");
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to create drug",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating drug:", error);
      toast({
        title: "Error",
        description: "Failed to create drug",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Overview Tab
        return (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
            {/* First Row: Drug Name, Generic Name, Other Name */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drug_name" className="text-sm font-medium text-gray-700">Drug Name</Label>
                <div className="relative">
                  <Textarea
                    id="drug_name"
                    value={content.overview.drug_name}
                    onChange={(e) =>
                      updateContent("overview", {
                        ...content.overview,
                        drug_name: e.target.value
                      })
                    }
                    placeholder=""
                    rows={2}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  <Plus
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                    onClick={() => {
                      if (content.overview.drug_name.trim()) {
                        addDrugName(content.overview.drug_name, 'drug_name');
                        toast({
                          title: "Added to Primary Name",
                          description: `"${content.overview.drug_name}" added to Primary Name dropdown`,
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="generic_name" className="text-sm font-medium text-gray-700">Generic Name</Label>
                <div className="relative">
                  <Textarea
                    id="generic_name"
                    value={content.overview.generic_name}
                    onChange={(e) =>
                      updateContent("overview", {
                        ...content.overview,
                        generic_name: e.target.value,
                      })
                    }
                    placeholder=""
                    rows={2}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  <Plus
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                    onClick={() => {
                      if (content.overview.generic_name.trim()) {
                        addDrugName(content.overview.generic_name, 'generic_name');
                        toast({
                          title: "Added to Primary Name",
                          description: `"${content.overview.generic_name}" added to Primary Name dropdown`,
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_name" className="text-sm font-medium text-gray-700">Other Name</Label>
                <div className="relative">
                  <Textarea
                    id="other_name"
                    value={content.overview.other_name}
                    onChange={(e) =>
                      updateContent("overview", {
                        ...content.overview,
                        other_name: e.target.value,
                      })
                    }
                    placeholder=""
                    rows={2}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  <Plus
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                    onClick={() => {
                      if (content.overview.other_name.trim()) {
                        addDrugName(content.overview.other_name, 'other_name');
                        toast({
                          title: "Added to Primary Name",
                          description: `"${content.overview.other_name}" added to Primary Name dropdown`,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Second Row: Primary Name, Global Status, Development Status */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_name" className="text-sm font-medium text-gray-700">Primary Name</Label>
                <SearchableSelect
                  options={primaryNameOptions}
                  value={content.overview.primary_name}
                  onValueChange={(value) =>
                    updateContent("overview", {
                      ...content.overview,
                      primary_name: value,
                    })
                  }
                  placeholder="Select primary name"
                  searchPlaceholder="Search primary name..."
                  emptyMessage="No primary name found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="global_status" className="text-sm font-medium text-gray-700">Global Status</Label>
                <SearchableSelect
                  options={globalStatusOptions}
                  value={content.overview.global_status}
                  onValueChange={(value) =>
                    updateContent("overview", {
                      ...content.overview,
                      global_status: value,
                    })
                  }
                  placeholder="Select global status"
                  searchPlaceholder="Search global status..."
                  emptyMessage="No global status found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="development_status" className="text-sm font-medium text-gray-700">Development status</Label>
                <SearchableSelect
                  options={developmentStatusOptions}
                  value={content.overview.development_status}
                  onValueChange={(value) =>
                    updateContent("overview", {
                      ...content.overview,
                      development_status: value,
                    })
                  }
                  placeholder="Select development status"
                  searchPlaceholder="Search development status..."
                  emptyMessage="No development status found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Drug Summary */}
            <div className="space-y-2">
              <Label htmlFor="drug_summary" className="text-sm font-medium text-gray-700">Drug Summary</Label>
              <div className="relative">
                <Textarea
                  id="drug_summary"
                  value={content.overview.drug_summary}
                  onChange={(e) =>
                    updateContent("overview", {
                      ...content.overview,
                      drug_summary: e.target.value,
                    })
                  }
                  placeholder=""
                  rows={4}
                  className="min-h-[120px] border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Third Row: Originator, Other Active Companies */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originator" className="text-sm font-medium text-gray-700">Originator</Label>
                <SearchableSelect
                  options={originatorOptions}
                  value={content.overview.originator}
                  onValueChange={(value) =>
                    updateContent("overview", {
                      ...content.overview,
                      originator: value,
                    })
                  }
                  placeholder="Select originator"
                  searchPlaceholder="Search originator..."
                  emptyMessage="No originator found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_active_companies" className="text-sm font-medium text-gray-700">Other Active Companies</Label>
                <SearchableSelect
                  options={originatorOptions}
                  value={content.overview.other_active_companies}
                  onValueChange={(value) =>
                    updateContent("overview", {
                      ...content.overview,
                      other_active_companies: value,
                    })
                  }
                  placeholder="Select other active companies"
                  searchPlaceholder="Search companies..."
                  emptyMessage="No companies found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Fourth Row: Therapeutic Area, Disease Type, Regulatory Designations */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="therapeutic_area" className="text-sm font-medium text-gray-700">Therapeutics Area</Label>
                <SearchableSelect
                  options={therapeuticAreaOptions}
                  value={content.overview.therapeutic_area}
                  onValueChange={(value) =>
                    updateContent("overview", {
                      ...content.overview,
                      therapeutic_area: value,
                    })
                  }
                  placeholder="therapeutic area"
                  searchPlaceholder="therapeutic area..."
                  emptyMessage="No therapeutic area found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disease_type" className="text-sm font-medium text-gray-700">Disease Type</Label>
                <SearchableSelect
                  options={diseaseTypeOptions}
                  value={content.overview.disease_type}
                  onValueChange={(value) =>
                    updateContent("overview", {
                      ...content.overview,
                      disease_type: value,
                    })
                  }
                  placeholder="Select disease type"
                  searchPlaceholder="Search disease type..."
                  emptyMessage="No disease type found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regulator_designations" className="text-sm font-medium text-gray-700">Regulator Designations</Label>
                <SearchableSelect
                  options={regulatoryDesignationsOptions}
                  value={content.overview.regulator_designations}
                  onValueChange={(value) =>
                    updateContent("overview", {
                      ...content.overview,
                      regulator_designations: value,
                    })
                  }
                  placeholder="Select regulatory designations"
                  searchPlaceholder="Search regulatory designations..."
                  emptyMessage="No regulatory designations found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Drug Development Status Section */}
            <Card className="border border-gray-200 rounded-lg shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Drug Development Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* First Row: 6 Dropdown Fields */}
                <div className="grid grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Disease Type</Label>
                    <SearchableSelect
                      options={diseaseTypeOptions}
                      value={content.overview.drug_development_status_rows?.[0]?.disease_type || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(content.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].disease_type = value;
                        updateContent("overview", {
                          ...content.overview,
                          drug_development_status_rows: updatedRows,
                        });
                      }}
                      placeholder="disease type"
                      emptyMessage="No disease type found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Therapeutic Class</Label>
                    <SearchableSelect
                      options={THERAPEUTIC_CLASS_OPTIONS}
                      value={content.overview.drug_development_status_rows?.[0]?.therapeutic_class || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(content.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].therapeutic_class = value;
                        updateContent("overview", {
                          ...content.overview,
                          drug_development_status_rows: updatedRows,
                        });
                      }}
                      placeholder="therapeutic class"
                      searchPlaceholder="therapeutic class..."
                      emptyMessage="No therapeutic class found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Company</Label>
                    <SearchableSelect
                      options={COMPANY_OPTIONS}
                      value={content.overview.drug_development_status_rows?.[0]?.company || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(content.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].company = value;
                        updateContent("overview", {
                          ...content.overview,
                          drug_development_status_rows: updatedRows,
                        });
                      }}
                      placeholder="Select company"
                      searchPlaceholder="Search company..."
                      emptyMessage="No company found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Company Type</Label>
                    <SearchableSelect
                      options={COMPANY_TYPE_OPTIONS}
                      value={content.overview.drug_development_status_rows?.[0]?.company_type || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(content.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].company_type = value;
                        updateContent("overview", {
                          ...content.overview,
                          drug_development_status_rows: updatedRows,
                        });
                      }}
                      placeholder="company type"
                      searchPlaceholder="company type..."
                      emptyMessage="No company type found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Country</Label>
                    <SearchableSelect
                      options={COUNTRY_OPTIONS}
                      value={content.overview.drug_development_status_rows?.[0]?.country || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(content.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].country = value;
                        updateContent("overview", {
                          ...content.overview,
                          drug_development_status_rows: updatedRows,
                        });
                      }}
                      placeholder="Select country"
                      searchPlaceholder="Search country..."
                      emptyMessage="No country found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <SearchableSelect
                      options={DEVELOPMENT_STATUS_OPTIONS_DETAILED}
                      value={content.overview.drug_development_status_rows?.[0]?.development_status || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(content.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].development_status = value;
                        updateContent("overview", {
                          ...content.overview,
                          drug_development_status_rows: updatedRows,
                        });
                      }}
                      placeholder="Select status"
                      searchPlaceholder="Search status..."
                      emptyMessage="No status found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                </div>

                {/* Reference Section with Add Attachments and Add Links inside */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Reference</Label>
                  <div className="relative">
                    <Textarea
                      value={content.overview.drug_development_status_rows?.[0]?.reference || ""}
                      onChange={(e) => {
                        const updatedRows = [...(content.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].reference = e.target.value;
                        updateContent("overview", {
                          ...content.overview,
                          drug_development_status_rows: updatedRows,
                        });
                      }}
                      placeholder="Enter reference information"
                      rows={3}
                      className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800 pr-20"
                    />
                    {/* Add Attachments and Add Links positioned outside the textarea */}
                    <div className="mt-2 flex gap-2">
                      <div className="relative">
                        <Input
                          placeholder="Add attachments"
                          value={attachmentInput}
                          onChange={(e) => setAttachmentInput(e.target.value)}
                          className="w-40 h-8 text-xs border-gray-600 focus:border-gray-800 focus:ring-gray-800 pr-8"
                        />
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => {
                            console.log("Add attachment clicked, value:", attachmentInput);
                            if (attachmentInput.trim()) {
                              updateContent("overview", {
                                ...content.overview,
                                attachments: [...(content.overview.attachments || []), attachmentInput.trim()],
                              });
                              setAttachmentInput("");
                              console.log("Attachment added successfully");
                            }
                          }}
                          className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full bg-gray-600 hover:bg-gray-700 z-10"
                        >
                          <Plus className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Add links"
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          className="w-40 h-8 text-xs border-gray-600 focus:border-gray-800 focus:ring-gray-800 pr-8"
                        />
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => {
                            console.log("Add link clicked, value:", linkInput);
                            if (linkInput.trim()) {
                              updateContent("overview", {
                                ...content.overview,
                                links: [...(content.overview.links || []), linkInput.trim()],
                              });
                              setLinkInput("");
                              console.log("Link added successfully");
                            }
                          }}
                          className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full bg-gray-600 hover:bg-gray-700 z-10"
                        >
                          <Plus className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                    </div>

                    {/* Display added attachments and links */}
                    {(content.overview.attachments && content.overview.attachments.length > 0) || (content.overview.links && content.overview.links.length > 0) ? (
                      <div className="mt-2 p-2 bg-gray-50 rounded border">
                        <div className="text-xs text-gray-600 mb-1">Added items:</div>
                        {content.overview.attachments && content.overview.attachments.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">Attachments:</span> {content.overview.attachments.join(", ")}
                          </div>
                        )}
                        {content.overview.links && content.overview.links.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">Links:</span> {content.overview.links.join(", ")}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Add Row Button */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      console.log("Add row clicked");
                      const newRow = {
                        disease_type: "",
                        therapeutic_class: "",
                        company: "",
                        company_type: "",
                        country: "",
                        development_status: "",
                        reference: "",
                      };
                      updateContent("overview", {
                        ...content.overview,
                        drug_development_status_rows: [...(content.overview.drug_development_status_rows || []), newRow],
                      });
                      console.log("Row added successfully");
                    }}
                    className="text-white"
                    style={{ backgroundColor: '#204B73' }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Row: Source Links, Drug Record Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source_link" className="text-sm font-medium text-gray-700">Source Link</Label>
                <div className="relative">
                  <Textarea
                    id="source_link"
                    value={content.overview.source_link}
                    onChange={(e) =>
                      updateContent("overview", {
                        ...content.overview,
                        source_link: e.target.value,
                      })
                    }
                    placeholder=""
                    rows={2}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  <Plus className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="drug_record_status" className="text-sm font-medium text-gray-700">Drug Record Status</Label>
                <SearchableSelect
                  options={drugRecordStatusOptions}
                  value={content.overview.drug_record_status}
                  onValueChange={(value) =>
                    updateContent("overview", {
                      ...content.overview,
                      drug_record_status: value,
                    })
                  }
                  placeholder="Select drug record status"
                  searchPlaceholder="Search drug record status..."
                  emptyMessage="No drug record status found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Drug Activity Tab
        return (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* First Row: Mechanism of Action, Biological Target */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Mechanism of action</Label>
                <SearchableSelect
                  options={mechanismOfActionOptions}
                  value={content.drugActivity.mechanism_of_action}
                  onValueChange={(value) =>
                    updateContent("drugActivity", {
                      ...content.drugActivity,
                      mechanism_of_action: value,
                    })
                  }
                  placeholder="Select mechanism of action"
                  searchPlaceholder="Search mechanism of action..."
                  emptyMessage="No mechanism of action found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Biological target</Label>
                <SearchableSelect
                  options={biologicalTargetOptions}
                  value={content.drugActivity.biological_target}
                  onValueChange={(value) =>
                    updateContent("drugActivity", {
                      ...content.drugActivity,
                      biological_target: value,
                    })
                  }
                  placeholder="Select biological target"
                  searchPlaceholder="Search biological target..."
                  emptyMessage="No biological target found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Full Width: Drug Technology */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Drug Technology</Label>
              <Textarea
                value={content.drugActivity.drug_technology}
                onChange={(e) =>
                  updateContent("drugActivity", {
                    ...content.drugActivity,
                    drug_technology: e.target.value,
                  })
                }
                placeholder="Enter unique technology used in the drug"
                rows={4}
                className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>

            {/* Second Row: Delivery Route, Delivery Medium */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Delivery Route</Label>
                <SearchableSelect
                  options={deliveryRouteOptions}
                  value={content.drugActivity.delivery_route}
                  onValueChange={(value) =>
                    updateContent("drugActivity", {
                      ...content.drugActivity,
                      delivery_route: value,
                    })
                  }
                  placeholder="Select delivery route"
                  searchPlaceholder="Search delivery route..."
                  emptyMessage="No delivery route found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Delivery Medium</Label>
                <SearchableSelect
                  options={deliveryMediumOptions}
                  value={content.drugActivity.delivery_medium}
                  onValueChange={(value) =>
                    updateContent("drugActivity", {
                      ...content.drugActivity,
                      delivery_medium: value,
                    })
                  }
                  placeholder="Select delivery medium"
                  searchPlaceholder="Search delivery medium..."
                  emptyMessage="No delivery medium found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Therapeutic Class and its Development Section */}

          </div>
        );

      case 3: // Development Tab
        return (
          <div className="space-y-6 p-6 border border-gray-200 rounded-lg bg-white">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Development</h3>

            {/* Preclinical Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-base font-semibold text-gray-900">
                  Preclinical
                </label>
                <button type="button">
                  <Plus className="h-5 w-5 text-gray-400 cursor-pointer" />
                </button>
              </div>
              <Textarea
                value={content.development.reference || ''}
                onChange={(e) => updateContent("development", {
                  ...content.development,
                  reference: e.target.value,
                })}
                rows={2}
                className="w-full border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>

            {/* Clinical Section */}
            <div className="space-y-4">
              <label className="text-base font-semibold text-gray-900">
                Clinical
              </label>

              {/* Clinical Trials Table */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-300">
                  <div className="p-3 text-sm font-medium text-gray-700 border-r border-gray-300">
                    Trial ID
                  </div>
                  <div className="p-3 text-sm font-medium text-gray-700 border-r border-gray-300">
                    Title
                  </div>
                  <div className="p-3 text-sm font-medium text-gray-700 border-r border-gray-300">
                    Primary Drugs
                  </div>
                  <div className="p-3 text-sm font-medium text-gray-700 border-r border-gray-300">
                    Status
                  </div>
                  <div className="p-3 text-sm font-medium text-gray-700">Sponsor</div>
                </div>

                {/* Table Row */}
                <div className="grid grid-cols-5">
                  <div className="p-3 border-r border-gray-300">
                    <Textarea
                      value={content.development.disease_type || ''}
                      onChange={(e) => updateContent("development", {
                        ...content.development,
                        disease_type: e.target.value,
                      })}
                      rows={2}
                      className="w-full border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                  </div>
                  <div className="p-3 border-r border-gray-300">
                    <Textarea
                      value={content.development.therapeutic_class || ''}
                      onChange={(e) => updateContent("development", {
                        ...content.development,
                        therapeutic_class: e.target.value,
                      })}
                      rows={2}
                      className="w-full border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                  </div>
                  <div className="p-3 border-r border-gray-300">
                    <Textarea
                      value={content.development.company || ''}
                      onChange={(e) => updateContent("development", {
                        ...content.development,
                        company: e.target.value,
                      })}
                      rows={2}
                      className="w-full border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                  </div>
                  <div className="p-3 border-r border-gray-300">
                    <Textarea
                      value={content.development.company_type || ''}
                      onChange={(e) => updateContent("development", {
                        ...content.development,
                        company_type: e.target.value,
                      })}
                      rows={2}
                      className="w-full border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                  </div>
                  <div className="p-3">
                    <Textarea
                      value={content.development.status || ''}
                      onChange={(e) => updateContent("development", {
                        ...content.development,
                        status: e.target.value,
                      })}
                      rows={2}
                      className="w-full border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        );

      case 4: // Other Sources Tab
        return (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Other Sources Card with Tabs */}
            <Card className="border rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Other sources</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Tab Navigation */}
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("pipeline_data")}
                    className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "pipeline_data"
                      ? "text-white"
                      : "text-gray-600 bg-gray-200 hover:bg-gray-300"
                      }`}
                    style={activeTab === "pipeline_data" ? { backgroundColor: '#204B73' } : {}}
                  >
                    Pipeline Data
                  </button>
                  <button
                    onClick={() => setActiveTab("press_releases")}
                    className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "press_releases"
                      ? "text-white"
                      : "text-gray-600 bg-gray-200 hover:bg-gray-300"
                      }`}
                    style={activeTab === "press_releases" ? { backgroundColor: '#204B73' } : {}}
                  >
                    Press Releases
                  </button>
                  <button
                    onClick={() => setActiveTab("publications")}
                    className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "publications"
                      ? "text-white"
                      : "text-gray-600 bg-gray-200 hover:bg-gray-300"
                      }`}
                    style={activeTab === "publications" ? { backgroundColor: '#204B73' } : {}}
                  >
                    Publications
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "pipeline_data" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Pipeline Data</Label>
                      <div className="relative">
                        <Textarea
                          value={content.otherSources.pipelineData}
                          onChange={(e) =>
                            updateContent("otherSources", {
                              ...content.otherSources,
                              pipelineData: e.target.value,
                            })
                          }
                          placeholder="Enter pipeline data information..."
                          rows={6}
                          className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800 pr-10"
                        />
                        <Button
                          type="button"
                          size="icon"
                          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-700"
                        >
                          <Plus className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeTab === "press_releases" && (
                    <NotesSection
                      title="Press Release Notes"
                      notes={content.otherSources?.pressReleaseNotes ? (Array.isArray(content.otherSources.pressReleaseNotes) ? content.otherSources.pressReleaseNotes : [{
                        id: "1",
                        date: new Date().toISOString().split("T")[0],
                        type: "Press Release",
                        content: content.otherSources.pressReleases || "",
                        sourceLink: "",
                        sourceType: "",
                        sourceUrl: "",
                        attachments: [],
                        isVisible: true
                      }]) : []}
                      onAddNote={() => {
                        const newNote = {
                          id: Date.now().toString(),
                          date: new Date().toISOString().split("T")[0],
                          type: "Press Release",
                          content: "",
                          sourceLink: "",
                          attachments: [],
                          isVisible: true
                        };
                        const currentNotes = Array.isArray(content.otherSources?.pressReleaseNotes) ? content.otherSources.pressReleaseNotes : [];
                        updateContent("otherSources", {
                          ...content.otherSources,
                          pressReleaseNotes: [...currentNotes, newNote]
                        });
                      }}
                      onUpdateNote={(index, updatedNote) => {
                        const currentNotes = Array.isArray(content.otherSources?.pressReleaseNotes) ? content.otherSources.pressReleaseNotes : [];
                        const updatedNotes = currentNotes.map((note, i) =>
                          i === index ? { ...note, ...updatedNote } : note
                        );
                        updateContent("otherSources", {
                          ...content.otherSources,
                          pressReleaseNotes: updatedNotes
                        });
                      }}
                      onRemoveNote={(index) => {
                        const currentNotes = Array.isArray(content.otherSources?.pressReleaseNotes) ? content.otherSources.pressReleaseNotes : [];
                        const updatedNotes = currentNotes.filter((_, i) => i !== index);
                        updateContent("otherSources", {
                          ...content.otherSources,
                          pressReleaseNotes: updatedNotes
                        });
                      }}
                      noteTypes={[
                        "Press Release",
                        "Announcement",
                        "Media Coverage",
                        "News Article",
                        "Other"
                      ]}
                    />
                  )}

                  {activeTab === "publications" && (
                    <NotesSection
                      title="Publication Notes"
                      notes={content.otherSources?.publicationNotes ? (Array.isArray(content.otherSources.publicationNotes) ? content.otherSources.publicationNotes : [{
                        id: "1",
                        date: new Date().toISOString().split("T")[0],
                        type: "Publication",
                        content: content.otherSources.publications || "",
                        sourceLink: "",
                        sourceType: "",
                        sourceUrl: "",
                        attachments: [],
                        isVisible: true
                      }]) : []}
                      onAddNote={() => {
                        const newNote = {
                          id: Date.now().toString(),
                          date: new Date().toISOString().split("T")[0],
                          type: "Publication",
                          content: "",
                          sourceLink: "",
                          attachments: [],
                          isVisible: true
                        };
                        const currentNotes = Array.isArray(content.otherSources?.publicationNotes) ? content.otherSources.publicationNotes : [];
                        updateContent("otherSources", {
                          ...content.otherSources,
                          publicationNotes: [...currentNotes, newNote]
                        });
                      }}
                      onUpdateNote={(index, updatedNote) => {
                        const currentNotes = Array.isArray(content.otherSources?.publicationNotes) ? content.otherSources.publicationNotes : [];
                        const updatedNotes = currentNotes.map((note, i) =>
                          i === index ? { ...note, ...updatedNote } : note
                        );
                        updateContent("otherSources", {
                          ...content.otherSources,
                          publicationNotes: updatedNotes
                        });
                      }}
                      onRemoveNote={(index) => {
                        const currentNotes = Array.isArray(content.otherSources?.publicationNotes) ? content.otherSources.publicationNotes : [];
                        const updatedNotes = currentNotes.filter((_, i) => i !== index);
                        updateContent("otherSources", {
                          ...content.otherSources,
                          publicationNotes: updatedNotes
                        });
                      }}
                      noteTypes={[
                        "Publication",
                        "Research Paper",
                        "Journal Article",
                        "Conference Paper",
                        "Patent",
                        "Other"
                      ]}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );


      case 5: // Licensing & Marketing Tab
        return (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Agreement */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Agreement</Label>
              {content.licensingMarketing.agreement_rows?.map((row, index) => (
                <div key={index} className="relative">
                  <Textarea
                    value={row.value}
                    onChange={(e) => {
                      const updatedRows = [...(content.licensingMarketing.agreement_rows || [])];
                      updatedRows[index] = { ...updatedRows[index], value: e.target.value };
                      updateContent("licensingMarketing", {
                        ...content.licensingMarketing,
                        agreement_rows: updatedRows,
                      });
                    }}
                    placeholder="Enter agreement information"
                    rows={4}
                    className={`w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800 pr-20 ${!row.enabled ? 'opacity-50 bg-gray-100' : ''}`}
                    disabled={!row.enabled}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-700"
                    onClick={() => {
                      const updatedRows = [...(content.licensingMarketing.agreement_rows || [])];
                      updatedRows.splice(index + 1, 0, { value: "", enabled: true });
                      updateContent("licensingMarketing", {
                        ...content.licensingMarketing,
                        agreement_rows: updatedRows,
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    className={`absolute bottom-2 right-12 h-8 w-8 rounded-full ${row.enabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'}`}
                    onClick={() => {
                      const updatedRows = [...(content.licensingMarketing.agreement_rows || [])];
                      updatedRows[index] = { ...updatedRows[index], enabled: !updatedRows[index].enabled };
                      updateContent("licensingMarketing", {
                        ...content.licensingMarketing,
                        agreement_rows: updatedRows,
                      });
                    }}
                    title={row.enabled ? "Disable this row" : "Enable this row"}
                  >
                    {row.enabled ? <Eye className="h-4 w-4 text-white" /> : <EyeOff className="h-4 w-4 text-white" />}
                  </Button>
                </div>
              ))}
            </div>

            {/* Licensing Availability */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Licensing Availability</Label>
              {content.licensingMarketing.licensing_availability_rows?.map((row, index) => (
                <div key={index} className="relative">
                  <Textarea
                    value={row.value}
                    onChange={(e) => {
                      const updatedRows = [...(content.licensingMarketing.licensing_availability_rows || [])];
                      updatedRows[index] = { ...updatedRows[index], value: e.target.value };
                      updateContent("licensingMarketing", {
                        ...content.licensingMarketing,
                        licensing_availability_rows: updatedRows,
                      });
                    }}
                    placeholder="Enter licensing availability information"
                    rows={4}
                    className={`w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800 pr-20 ${!row.enabled ? 'opacity-50 bg-gray-100' : ''}`}
                    disabled={!row.enabled}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-700"
                    onClick={() => {
                      const updatedRows = [...(content.licensingMarketing.licensing_availability_rows || [])];
                      updatedRows.splice(index + 1, 0, { value: "", enabled: true });
                      updateContent("licensingMarketing", {
                        ...content.licensingMarketing,
                        licensing_availability_rows: updatedRows,
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    className={`absolute bottom-2 right-12 h-8 w-8 rounded-full ${row.enabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'}`}
                    onClick={() => {
                      const updatedRows = [...(content.licensingMarketing.licensing_availability_rows || [])];
                      updatedRows[index] = { ...updatedRows[index], enabled: !updatedRows[index].enabled };
                      updateContent("licensingMarketing", {
                        ...content.licensingMarketing,
                        licensing_availability_rows: updatedRows,
                      });
                    }}
                    title={row.enabled ? "Disable this row" : "Enable this row"}
                  >
                    {row.enabled ? <Eye className="h-4 w-4 text-white" /> : <EyeOff className="h-4 w-4 text-white" />}
                  </Button>
                </div>
              ))}
            </div>

            {/* Marketing Approvals */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Marketing Approvals</Label>
              {content.licensingMarketing.marketing_approvals_rows?.map((row, index) => (
                <div key={index} className="relative">
                  <Textarea
                    value={row.value}
                    onChange={(e) => {
                      const updatedRows = [...(content.licensingMarketing.marketing_approvals_rows || [])];
                      updatedRows[index] = { ...updatedRows[index], value: e.target.value };
                      updateContent("licensingMarketing", {
                        ...content.licensingMarketing,
                        marketing_approvals_rows: updatedRows,
                      });
                    }}
                    placeholder="Enter marketing approvals information"
                    rows={4}
                    className={`w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800 pr-20 ${!row.enabled ? 'opacity-50 bg-gray-100' : ''}`}
                    disabled={!row.enabled}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-700"
                    onClick={() => {
                      const updatedRows = [...(content.licensingMarketing.marketing_approvals_rows || [])];
                      updatedRows.splice(index + 1, 0, { value: "", enabled: true });
                      updateContent("licensingMarketing", {
                        ...content.licensingMarketing,
                        marketing_approvals_rows: updatedRows,
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    className={`absolute bottom-2 right-12 h-8 w-8 rounded-full ${row.enabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'}`}
                    onClick={() => {
                      const updatedRows = [...(content.licensingMarketing.marketing_approvals_rows || [])];
                      updatedRows[index] = { ...updatedRows[index], enabled: !updatedRows[index].enabled };
                      updateContent("licensingMarketing", {
                        ...content.licensingMarketing,
                        marketing_approvals_rows: updatedRows,
                      });
                    }}
                    title={row.enabled ? "Disable this row" : "Enable this row"}
                  >
                    {row.enabled ? <Eye className="h-4 w-4 text-white" /> : <EyeOff className="h-4 w-4 text-white" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 6: // Logs Tab
        return (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Drug Changes Log */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Drug Changes Log</Label>
              <Input
                value={content.logs?.drug_changes_log || ""}
                onChange={(e) =>
                  updateContent("logs", {
                    ...content.logs,
                    drug_changes_log: e.target.value,
                  })
                }
                placeholder="Enter drug changes log"
                className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>

            {/* First Row: Created Date, Last Modified Date, Last Modified User */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Created Date</Label>
                <CustomDateInput
                  value={content.logs?.drug_added_date || ""}
                  onChange={(value) =>
                    updateContent("logs", {
                      ...content.logs,
                      drug_added_date: value,
                    })
                  }
                  placeholder="Month Day Year"
                  className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Last Modified Date</Label>
                <CustomDateInput
                  value={content.logs?.last_modified_date || ""}
                  onChange={(value) =>
                    updateContent("logs", {
                      ...content.logs,
                      last_modified_date: value,
                    })
                  }
                  placeholder="Month Day Year"
                  className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Last Modified User</Label>
                <Input
                  value={content.logs?.last_modified_user || ""}
                  onChange={(e) =>
                    updateContent("logs", {
                      ...content.logs,
                      last_modified_user: e.target.value,
                    })
                  }
                  placeholder="Enter user ID"
                  className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Second Row: Full Review User, Full Review, Next Review Date */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Full Review User</Label>
                <Input
                  value={content.logs?.full_review_user || ""}
                  onChange={(e) =>
                    updateContent("logs", {
                      ...content.logs,
                      full_review_user: e.target.value,
                    })
                  }
                  placeholder="Enter user ID"
                  className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Full Review</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="full_review"
                    checked={content.logs?.full_review || false}
                    onCheckedChange={(checked) =>
                      updateContent("logs", {
                        ...content.logs,
                        full_review: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="full_review" className="text-sm font-medium text-gray-700">Full Review</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Next Review Date</Label>
                <CustomDateInput
                  value={content.logs?.next_review_date || ""}
                  onChange={(value) =>
                    updateContent("logs", {
                      ...content.logs,
                      next_review_date: value,
                    })
                  }
                  placeholder="Month Day Year"
                  className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Notes */}
            <NotesSection
              title="Drug Notes & Documentation"
              notes={content.logs?.notes ? (Array.isArray(content.logs.notes) ? content.logs.notes : [{
                id: "1",
                date: new Date().toISOString().split("T")[0],
                type: "General",
                content: content.logs.notes,
                sourceLink: "",
                sourceType: "",
                sourceUrl: "",
                attachments: [],
                isVisible: true
              }]) : []}
              onAddNote={() => {
                const newNote = {
                  id: Date.now().toString(),
                  date: new Date().toISOString().split("T")[0],
                  type: "General",
                  content: "",
                  sourceLink: "",
                  attachments: [],
                  isVisible: true
                };
                const currentNotes = Array.isArray(content.logs?.notes) ? content.logs.notes : [];
                updateContent("logs", {
                  ...content.logs,
                  notes: [...currentNotes, newNote]
                });
              }}
              onUpdateNote={(index, updatedNote) => {
                const currentNotes = Array.isArray(content.logs?.notes) ? content.logs.notes : [];
                const updatedNotes = currentNotes.map((note, i) =>
                  i === index ? { ...note, ...updatedNote } : note
                );
                updateContent("logs", {
                  ...content.logs,
                  notes: updatedNotes
                });
              }}
              onRemoveNote={(index) => {
                const currentNotes = Array.isArray(content.logs?.notes) ? content.logs.notes : [];
                const updatedNotes = currentNotes.filter((_, i) => i !== index);
                updateContent("logs", {
                  ...content.logs,
                  notes: updatedNotes
                });
              }}
              noteTypes={[
                "General",
                "Development",
                "Regulatory",
                "Safety",
                "Efficacy",
                "Clinical",
                "Manufacturing",
                "Marketing",
                "Other"
              ]}
            />
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Header content can be added here if needed */}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-lg" style={{ backgroundColor: '#61CCFA66' }}>
        <div className="flex">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all border-b-2 ${currentStep === step.id
                ? "text-white border-b-transparent"
                : "text-gray-700 border-b-transparent hover:bg-white hover:bg-opacity-20"
                }`}
              style={{
                backgroundColor: currentStep === step.id ? '#204B73' : 'transparent'
              }}
            >
              {step.title}
            </button>
          ))}
        </div>
      </div>


      {/* Step Content */}
      <div className="min-h-[500px]">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-2">
          {currentStep < steps.length ? (
            <Button onClick={nextStep} disabled={!isStepComplete(currentStep)}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Drug...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Drug
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

