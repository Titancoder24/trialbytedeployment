"use client"

import { formatDateToMMDDYYYY } from "@/lib/date-utils";
import { getUniqueFieldValues, normalizePhaseValue, arePhasesEquivalent } from "@/lib/search-utils";
import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { X, Plus, Minus, CalendarIcon, Search, Calendar as CalendarIcon2, Eye, Trash2, Loader2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import CustomDateInput from "@/components/ui/custom-date-input"
import { MultiTagInput } from "@/components/ui/multi-tag-input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { SaveQueryModal } from "@/components/save-query-modal"
import { TherapeuticFilterState, TherapeuticSearchCriteria, DEFAULT_THERAPEUTIC_FILTERS } from "@/components/therapeutic-types"
import { useMultipleDynamicDropdowns } from "@/hooks/use-dynamic-dropdown"
export type { TherapeuticSearchCriteria } // Re-export for compatibility
import { toast } from "@/hooks/use-toast"
import { useDrugNames } from "@/hooks/use-drug-names"

// Define TherapeuticTrial interface locally
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
  }>;
  notes: Array<{
    id: string;
    trial_id: string;
    notes: string;
  }>;
}

interface TherapeuticAdvancedSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplySearch: (criteria: TherapeuticSearchCriteria[]) => void
  trials?: TherapeuticTrial[] // Add trials data for dynamic dropdowns
  currentFilters?: TherapeuticFilterState // Add current filters for save query functionality
  initialCriteria?: TherapeuticSearchCriteria[] // Add initial criteria for editing
  editingQueryId?: string | null
  editingQueryTitle?: string
  editingQueryDescription?: string
  onSaveQuerySuccess?: () => void
}



const therapeuticSearchFields = [
  // Core dropdown fields from trial creation (Step 5-1)
  { value: "therapeutic_area", label: "Therapeutic Area" },
  { value: "trial_phase", label: "Trial Phase" },
  { value: "status", label: "Status" },
  { value: "primary_drugs", label: "Primary Drugs" },
  { value: "other_drugs", label: "Other Drugs" },
  { value: "disease_type", label: "Disease Type" },
  { value: "patient_segment", label: "Patient Segment" },
  { value: "line_of_therapy", label: "Line of Therapy" },
  { value: "sponsor_collaborators", label: "Sponsor Collaborators" },
  { value: "sponsor_field_activity", label: "Sponsor Field Activity" },
  { value: "associated_cro", label: "Associated CRO" },
  { value: "countries", label: "Countries" },
  { value: "region", label: "Region" },
  { value: "trial_record_status", label: "Trial Record Status" },

  // Eligibility criteria dropdown fields (Step 5-3)
  { value: "gender", label: "Gender" },
  { value: "healthy_volunteers", label: "Healthy Volunteers" },

  // Results dropdown fields (Step 5-5)
  { value: "trial_outcome", label: "Trial Outcome" },
  { value: "adverse_event_reported", label: "Adverse Event Reported" },
  { value: "adverse_event_type", label: "Adverse Event Type" },

  // Additional data dropdown fields (Step 5-7)
  { value: "publication_type", label: "Publication Type" },
  { value: "registry_name", label: "Registry Name" },
  { value: "study_type", label: "Study Type" },

  // Study design keywords (Step 5-2) - dropdown
  { value: "study_design_keywords", label: "Study Design Keywords" },

  // Text fields that are searchable (Step 5-1)
  { value: "title", label: "Title" },
  { value: "trial_identifier", label: "Trial Identifier" },
  { value: "reference_links", label: "Reference Links" },
  { value: "trial_tags", label: "Trial Tags" },
  { value: "study_design", label: "Study Design" },

  // Text fields from Step 5-2: Trial Purpose & Design
  { value: "purpose_of_trial", label: "Purpose of Trial" },
  { value: "summary", label: "Summary" },
  { value: "primaryOutcomeMeasures", label: "Primary Outcome Measures" },
  { value: "otherOutcomeMeasures", label: "Other Outcome Measures" },
  { value: "treatment_regimen", label: "Treatment Regimen" },

  // Text fields from Step 5-3: Eligibility Criteria
  { value: "inclusion_criteria", label: "Inclusion Criteria" },
  { value: "exclusion_criteria", label: "Exclusion Criteria" },

  // Text fields from Step 5-8: Notes
  { value: "notes", label: "Notes" },

  // Numeric fields
  { value: "number_of_arms", label: "Number of Arms" },
  { value: "age_min", label: "Age Minimum" },
  { value: "age_max", label: "Age Maximum" },

  // Date fields
  { value: "created_at", label: "Created Date" },
  { value: "updated_at", label: "Updated Date" },

  // Logs fields
  { value: "last_modified_date", label: "Last Modified Date" },
  { value: "last_modified_user", label: "Last Modified User" }
]

const operators = [
  { value: "contains", label: "Contains" },
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
  { value: "greater_than", label: ">" },
  { value: "greater_than_equal", label: ">=" },
  { value: "less_than", label: "<" },
  { value: "less_than_equal", label: "<=" },
  { value: "equals", label: "=" },
  { value: "not_equals", label: "!=" }
]

// Field-specific options for dropdowns - matching exactly what's available in trial creation
const fieldOptions: Record<string, { value: string; label: string }[]> = {
  // Step 5-1: Trial Overview dropdowns
  therapeutic_area: [
    { value: "autoimmune", label: "Autoimmune" },
    { value: "cardiovascular", label: "Cardiovascular" },
    { value: "endocrinology", label: "Endocrinology" },
    { value: "gastrointestinal", label: "Gastrointestinal" },
    { value: "infectious", label: "Infectious" },
    { value: "oncology", label: "Oncology" },
    { value: "gastroenterology", label: "Gastroenterology" },
    { value: "dermatology", label: "Dermatology" },
    { value: "vaccines", label: "Vaccines" },
    { value: "cns_neurology", label: "CNS/Neurology" },
    { value: "ophthalmology", label: "Ophthalmology" },
    { value: "immunology", label: "Immunology" },
    { value: "rheumatology", label: "Rheumatology" },
    { value: "haematology", label: "Haematology" },
    { value: "nephrology", label: "Nephrology" },
    { value: "urology", label: "Urology" }
  ],
  trial_phase: [
    { value: "phase_i", label: "Phase I" },
    { value: "phase_i_ii", label: "Phase I/II" },
    { value: "phase_ii", label: "Phase II" },
    { value: "phase_ii_iii", label: "Phase II/III" },
    { value: "phase_iii", label: "Phase III" },
    { value: "phase_iii_iv", label: "Phase III/IV" },
    { value: "phase_iv", label: "Phase IV" }
  ],
  status: [
    { value: "planned", label: "Planned" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "completed", label: "Completed" },
    { value: "terminated", label: "Terminated" }
  ],
  // Disease Type - Exact options from creation phase
  disease_type: [
    { value: "acute_lymphocytic_leukemia", label: "Acute Lymphocytic Leukemia" },
    { value: "acute_myelogenous_leukemia", label: "Acute Myelogenous Leukemia" },
    { value: "anal", label: "Anal" },
    { value: "appendiceal", label: "Appendiceal" },
    { value: "basal_skin_cell_carcinoma", label: "Basal Skin Cell Carcinoma" },
    { value: "bladder", label: "Bladder" },
    { value: "breast", label: "Breast" },
    { value: "cervical", label: "Cervical" },
    { value: "cholangiocarcinoma", label: "Cholangiocarcinoma (Bile duct)" },
    { value: "chronic_lymphocytic_leukemia", label: "Chronic Lymphocytic Leukemia" },
    { value: "chronic_myelomonositic_leukemia", label: "Chronic Myelomonositic Leukemia" },
    { value: "astrocytoma", label: "Astrocytoma" },
    { value: "brain_stem_glioma", label: "Brain Stem Giloma" },
    { value: "craniopharyngioma", label: "Carniopharyngioma" },
    { value: "choroid_plexus_tumors", label: "Choroid Plexus Tumors" },
    { value: "embryonal_tumors", label: "Embryonal Tumors" },
    { value: "epedymoma", label: "Epedymoma" },
    { value: "germ_cell_tumors", label: "Germ Cell Tumors" },
    { value: "glioblastoma", label: "Giloblastoma" },
    { value: "hemangioblastoma", label: "Hemangioblastoma" },
    { value: "medulloblastoma", label: "Medulloblastoma" },
    { value: "meningioma", label: "Meningioma" },
    { value: "oligodendroglioma", label: "Oligodendrogiloma" },
    { value: "pineal_tumor", label: "Pineal Tumor" },
    { value: "pituitary_tumor", label: "Pituatory Tumor" },
    { value: "colorectal", label: "Colorectal" },
    { value: "endometrial", label: "Endometrial" },
    { value: "esophageal", label: "Esophageal" },
    { value: "fallopian_tube", label: "Fallopian Tube" },
    { value: "gall_bladder", label: "Gall Bladder" },
    { value: "gastric", label: "Gastirc" },
    { value: "gist", label: "GIST" },
    { value: "head_neck", label: "Head/Neck" },
    { value: "hodgkins_lymphoma", label: "Hodgkin's Lymphoma" },
    { value: "leukemia_chronic_myelogenous", label: "Leukemia, Chronic Myelogenous" },
    { value: "liver", label: "Liver" },
    { value: "lung_non_small_cell", label: "Lung Non-small cell" },
    { value: "lung_small_cell", label: "Lung Small Cell" },
    { value: "melanoma", label: "Melanoma" },
    { value: "mesothelioma", label: "Mesothelioma" },
    { value: "metastatic_cancer", label: "Metastatic Cancer" },
    { value: "multiple_myeloma", label: "Multiple Myeloma" },
    { value: "myelodysplastic_syndrome", label: "Myelodysplastic Syndrome" },
    { value: "myeloproliferative_neoplasms", label: "Myeloproliferative Neoplasms" },
    { value: "neuroblastoma", label: "Neuroblastoma" },
    { value: "neuroendocrine", label: "Neuroendocrine" },
    { value: "non_hodgkins_lymphoma", label: "Non-Hodgkin's Lymphoma" },
    { value: "osteosarcoma", label: "Osteosarcoma" },
    { value: "ovarian", label: "Ovarian" },
    { value: "pancreas", label: "Pancreas" },
    { value: "penile", label: "Penile" },
    { value: "primary_peritoneal", label: "Primary Peritoneal" },
    { value: "prostate", label: "Prostate" },
    { value: "renal", label: "Renal" },
    { value: "small_intestine", label: "Small Intestine" },
    { value: "soft_tissue_carcinoma", label: "Soft Tissue Carcinoma" },
    { value: "solid_tumor_unspecified", label: "Solid Tumor, Unspecified" },
    { value: "squamous_skin_cell_carcinoma", label: "Squamous Skin Cell Carcinoma" },
    { value: "supportive_care", label: "Supportive care" },
    { value: "tenosynovial_giant_cell_tumor", label: "Tenosynovial Giant Cell Tumor" },
    { value: "testicular", label: "Testicular" },
    { value: "thymus", label: "Thymus" },
    { value: "thyroid", label: "Thyroid" },
    { value: "unspecified_cancer", label: "Unspecified Cancer" },
    { value: "unspecified_haematological_cancer", label: "Unspecified Haematological Cancer" },
    { value: "vaginal", label: "Vaginal" },
    { value: "vulvar", label: "Vulvar" }
  ],
  // Patient Segment - Includes general options plus disease-specific options
  patient_segment: [
    // General patient segments
    { value: "children", label: "Children" },
    { value: "adults", label: "Adults" },
    { value: "healthy_volunteers", label: "Healthy Volunteers" },
    { value: "unknown", label: "Unknown" },
    { value: "first_line", label: "First Line" },
    { value: "second_line", label: "Second Line" },
    { value: "adjuvant", label: "Adjuvant" },
    // Breast Cancer specific patient segments
    { value: "her2_positive_breast_cancer", label: "HER2+ Breast Cancer" },
    { value: "her2_negative_breast_cancer", label: "HER2− Breast Cancer" },
    { value: "hr_positive_breast_cancer", label: "HR+ Breast Cancer (ER+ and/or PR+)" },
    { value: "triple_negative_breast_cancer", label: "Triple-Negative Breast Cancer (TNBC)" },
    { value: "early_stage_breast_cancer", label: "Early-Stage Breast Cancer" },
    { value: "locally_advanced_breast_cancer", label: "Locally Advanced Breast Cancer" },
    { value: "metastatic_breast_cancer", label: "Metastatic Breast Cancer" },
    { value: "recurrent_breast_cancer", label: "Recurrent Breast Cancer" },
    { value: "advanced_breast_cancer", label: "Advanced Breast Cancer (Non-Metastatic)" },
    { value: "premenopausal_breast_cancer", label: "Premenopausal Breast Cancer Patients" },
    { value: "postmenopausal_breast_cancer", label: "Postmenopausal Breast Cancer Patients" },
    { value: "breast_cancer_nos", label: "Breast Cancer (NOS)" }
  ],
  // Line of Therapy - Exact options from creation phase
  line_of_therapy: [
    { value: "second_line", label: "2 – Second Line" },
    { value: "unknown", label: "Unknown" },
    { value: "first_line", label: "1 – First Line" },
    { value: "at_least_second_line", label: "2+ - At least second line" },
    { value: "at_least_third_line", label: "3+ - At least third line" },
    { value: "neo_adjuvant", label: "Neo-Adjuvant" },
    { value: "adjuvant", label: "Adjuvant" },
    { value: "maintenance_consolidation", label: "Maintenance/Consolidation" },
    { value: "at_least_first_line", label: "1+ - At least first line" }
  ],
  // Sponsor Collaborators - Exact options from creation phase
  sponsor_collaborators: [
    { value: "Pfizer", label: "Pfizer" },
    { value: "Novartis", label: "Novartis" },
    { value: "AstraZeneca", label: "AstraZeneca" }
  ],
  // Sponsor Field Activity - Exact options from creation phase
  sponsor_field_activity: [
    { value: "pharmaceutical_company", label: "Pharmaceutical Company" },
    { value: "university_academy", label: "University/Academy" },
    { value: "investigator", label: "Investigator" },
    { value: "cro", label: "CRO" },
    { value: "hospital", label: "Hospital" }
  ],
  // Associated CRO - Exact options from creation phase
  associated_cro: [
    { value: "IQVIA", label: "IQVIA" },
    { value: "Syneos", label: "Syneos" },
    { value: "PPD", label: "PPD" }
  ],
  // Countries - Exact options from creation phase
  countries: [
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
    { value: "denmark", label: "Denmark" }
  ],
  // Region - Exact options from creation phase
  region: [
    { value: "north_america", label: "North America" },
    { value: "europe", label: "Europe" },
    { value: "asia_pacific", label: "Asia Pacific" },
    { value: "latin_america", label: "Latin America" },
    { value: "africa", label: "Africa" },
    { value: "middle_east", label: "Middle East" }
  ],
  // Trial Record Status - Exact options from creation phase
  trial_record_status: [
    { value: "development_in_progress", label: "Development In Progress (DIP)" },
    { value: "in_production", label: "In Production (IP)" },
    { value: "update_in_progress", label: "Update In Progress (UIP)" }
  ],
  // Step 5-3: Eligibility Criteria dropdowns
  gender: [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "both", label: "Both" }
  ],
  healthy_volunteers: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "no_information", label: "No Information" }
  ],
  // Step 5-5: Results dropdowns
  trial_outcome: [
    { value: "Completed – Primary endpoints met.", label: "Completed – Primary endpoints met." },
    { value: "Completed – Primary endpoints not met.", label: "Completed – Primary endpoints not met." },
    { value: "Completed – Outcome unknown", label: "Completed – Outcome unknown" },
    { value: "Completed – Outcome indeterminate", label: "Completed – Outcome indeterminate" },
    { value: "Terminated – Safety/adverse effects", label: "Terminated – Safety/adverse effects" },
    { value: "Terminated – Lack of efficacy", label: "Terminated – Lack of efficacy" },
    { value: "Terminated – Insufficient enrolment", label: "Terminated – Insufficient enrolment" },
    { value: "Terminated – Business Decision, Drug strategy shift", label: "Terminated – Business Decision, Drug strategy shift" },
    { value: "Terminated - Business Decision, Pipeline Reprioritization", label: "Terminated - Business Decision, Pipeline Reprioritization" },
    { value: "Terminated - Business Decision, Other", label: "Terminated - Business Decision, Other" },
    { value: "Terminated – Lack of funding", label: "Terminated – Lack of funding" },
    { value: "Terminated – Planned but never initiated", label: "Terminated – Planned but never initiated" },
    { value: "Terminated – Other", label: "Terminated – Other" },
    { value: "Terminated – Unknown", label: "Terminated – Unknown" }
  ],
  adverse_event_reported: [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" }
  ],
  adverse_event_type: [
    { value: "Mild", label: "Mild" },
    { value: "Moderate", label: "Moderate" },
    { value: "Severe", label: "Severe" }
  ],
  // Step 5-7: Additional Data dropdowns
  publication_type: [
    { value: "company_presentation", label: "Company Presentation" },
    { value: "sec_filing", label: "SEC Filing" },
    { value: "company_conference_report", label: "Company Conference Report" },
    { value: "revenue_reports", label: "Revenue Reports" },
    { value: "others", label: "Others" }
  ],
  registry_name: [
    { value: "euctr", label: "EUCTR" },
    { value: "ctri", label: "CTRI" },
    { value: "anzctr", label: "ANZCTR" },
    { value: "slctr", label: "SLCTR" },
    { value: "chictr", label: "ChiCTR" },
    { value: "chinese_fda", label: "Chinese FDA" },
    { value: "canadian_cancer_trials", label: "Canadian Cancer Trials" },
    { value: "health_canada", label: "Health Canada" },
    { value: "brazil_ctr", label: "Brazil CTR" },
    { value: "german_ctr", label: "German CTR" },
    { value: "cuban_ctr", label: "Cuban CTR" },
    { value: "iran_ctr", label: "Iran CTR" },
    { value: "lebanon_ctr", label: "Lebanon CTR" },
    { value: "pactr", label: "PACTR" },
    { value: "umin", label: "UMIN" }
  ],
  study_type: [
    { value: "follow_up_study", label: "Follow up Study" },
    { value: "observational_study", label: "Observational study" },
    { value: "other_study", label: "Other Study" }
  ],
  // Step 5-2: Study Design Keywords
  study_design_keywords: [
    { value: "Placebo-control", label: "Placebo-control" },
    { value: "Active control", label: "Active control" },
    { value: "Randomized", label: "Randomized" },
    { value: "Non-Randomized", label: "Non-Randomized" },
    { value: "Multiple-Blinded", label: "Multiple-Blinded" },
    { value: "Single-Blinded", label: "Single-Blinded" },
    { value: "Open", label: "Open" },
    { value: "Multi-centre", label: "Multi-centre" },
    { value: "Safety", label: "Safety" },
    { value: "Efficacy", label: "Efficacy" },
    { value: "Tolerability", label: "Tolerability" },
    { value: "Pharmacokinetics", label: "Pharmacokinetics" },
    { value: "Pharmacodynamics", label: "Pharmacodynamics" },
    { value: "Interventional", label: "Interventional" },
    { value: "Treatment", label: "Treatment" },
    { value: "Parallel Assignment", label: "Parallel Assignment" },
    { value: "Single group assignment", label: "Single group assignment" },
    { value: "Prospective", label: "Prospective" },
    { value: "Cohort", label: "Cohort" }
  ],
  // Logs fields - Last Modified User
  last_modified_user: [
    { value: "Admin", label: "Admin" }
  ]
}

// Date fields that should show calendar input
const dateFields = [
  "created_at",
  "updated_at",
  "last_modified_date"
]

export function TherapeuticAdvancedSearchModal({
  open,
  onOpenChange,
  onApplySearch,
  trials = [],
  currentFilters,
  initialCriteria,
  editingQueryId = null,
  editingQueryTitle = "",
  editingQueryDescription = "",
  onSaveQuerySuccess
}: TherapeuticAdvancedSearchModalProps) {
  const [criteria, setCriteria] = useState<TherapeuticSearchCriteria[]>([
    {
      id: "1",
      field: "title",
      operator: "contains",
      value: "",
      logic: "AND",
    }
  ])
  const [savedQueriesOpen, setSavedQueriesOpen] = useState(false)
  const [saveQueryModalOpen, setSaveQueryModalOpen] = useState(false)
  const [savedQueries, setSavedQueries] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingQueries, setLoadingQueries] = useState(false)
  const [therapeuticData, setTherapeuticData] = useState<TherapeuticTrial[]>([])
  const [loading, setLoading] = useState(false)
  const { getPrimaryDrugsOptions, refreshFromAPI, isLoading: isDrugsLoading } = useDrugNames()
  
  // List of all dropdown categories that should use dynamic options
  const dropdownCategories = [
    'therapeutic_area', 'trial_phase', 'trial_status', 'disease_type', 'patient_segment',
    'line_of_therapy', 'trial_record_status', 'sex', 'healthy_volunteers', 'trial_outcome',
    'adverse_event_reported', 'adverse_event_type', 'publication_type', 'registry_name',
    'study_type', 'study_design_keywords', 'trial_tags', 'sponsor_collaborators',
    'sponsor_field_activity', 'associated_cro', 'country', 'region'
  ]

  // Map category names to field names for fallback options lookup
  const categoryToFieldMap: Record<string, string> = {
    'trial_status': 'status',
    'sex': 'gender',
    'country': 'countries',
  };

  // Memoize category configs to prevent infinite loops
  const categoryConfigs = useMemo(() => {
    return dropdownCategories.map(categoryName => ({
      categoryName,
      fallbackOptions: fieldOptions[categoryToFieldMap[categoryName] || categoryName] || []
    }));
  }, []); // Empty deps since dropdownCategories, categoryToFieldMap, and fieldOptions are stable

  // Fetch all dynamic dropdown options
  const { results: dynamicDropdowns, loading: dropdownsLoading } = useMultipleDynamicDropdowns(categoryConfigs)

  // Fetch therapeutic data when modal opens
  useEffect(() => {
    if (open) {
      fetchTherapeuticData()
      // Refresh drug names from API to ensure we have the latest data
      refreshFromAPI()
      // Refetch all dynamic dropdowns
      Object.values(dynamicDropdowns).forEach(dropdown => {
        if (dropdown?.refetch) {
          dropdown.refetch()
        }
      })
      // Load initial criteria if provided
      if (initialCriteria && initialCriteria.length > 0) {
        setCriteria(initialCriteria)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCriteria, refreshFromAPI])

  const fetchTherapeuticData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/therapeutic/all-trials-with-data`)
      if (response.ok) {
        const data = await response.json()
        setTherapeuticData(data.trials || [])
      }
    } catch (error) {
      console.error('Error fetching therapeutic data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique values for a specific field from the therapeutic data
  const getFieldValues = (field: string): string[] => {
    const values = new Set<string>()

    // Use passed trials data or fallback to fetched data
    const dataToUse = trials.length > 0 ? trials : therapeuticData;

    dataToUse.forEach(trial => {
      // Handle different field paths
      let fieldValue = ''

      if (field.includes('.')) {
        // Handle nested fields like 'overview.therapeutic_area'
        const [parent, child] = field.split('.')
        if (parent === 'overview' && trial.overview) {
          fieldValue = trial.overview[child as keyof typeof trial.overview] as string
        }
      } else {
        // Handle direct fields
        switch (field) {
          case 'therapeutic_area':
            fieldValue = trial.overview?.therapeutic_area || ''
            break
          case 'disease_type':
            fieldValue = trial.overview?.disease_type || ''
            break
          case 'trial_phase':
            fieldValue = trial.overview?.trial_phase || ''
            break
          case 'status':
            fieldValue = trial.overview?.status || ''
            break
          case 'primary_drugs':
            fieldValue = trial.overview?.primary_drugs || ''
            break
          case 'other_drugs':
            fieldValue = trial.overview?.other_drugs || ''
            break
          case 'title':
            fieldValue = trial.overview?.title || ''
            break
          case 'patient_segment':
            fieldValue = trial.overview?.patient_segment || ''
            break
          case 'line_of_therapy':
            fieldValue = trial.overview?.line_of_therapy || ''
            break
          case 'sponsor_collaborators':
            fieldValue = trial.overview?.sponsor_collaborators || ''
            break
          case 'associated_cro':
            fieldValue = trial.overview?.associated_cro || ''
            break
          case 'countries':
            fieldValue = trial.overview?.countries || ''
            break
          case 'region':
            fieldValue = trial.overview?.region || ''
            break
          case 'trial_record_status':
            fieldValue = trial.overview?.trial_record_status || ''
            break
          // Handle Step 5-2 fields (outcome measures)
          case 'purpose_of_trial':
            fieldValue = trial.outcomes?.[0]?.purpose_of_trial || ''
            break
          case 'summary':
            fieldValue = trial.outcomes?.[0]?.summary || ''
            break
          case 'treatment_regimen':
            fieldValue = trial.outcomes?.[0]?.treatment_regimen || ''
            break
          case 'study_design':
            fieldValue = trial.outcomes?.[0]?.study_design || ''
            break
          // Handle array fields
          case 'trial_identifier':
            if (trial.overview?.trial_identifier) {
              trial.overview.trial_identifier.forEach(id => values.add(id))
            }
            break
          case 'reference_links':
            if (trial.overview?.reference_links) {
              trial.overview.reference_links.forEach(link => values.add(link))
            }
            break
          case 'last_modified_date':
            if (trial.logs && trial.logs.length > 0) {
              trial.logs.forEach(log => {
                if (log.last_modified_date && log.last_modified_date.trim()) {
                  values.add(log.last_modified_date.trim())
                }
              })
            }
            break
          // Handle Step 5-2 fields (outcome measures)
          case 'primaryOutcomeMeasures':
            if (trial.outcomes) {
              trial.outcomes.forEach(outcome => {
                if (outcome.primary_outcome_measure && outcome.primary_outcome_measure.trim()) {
                  values.add(outcome.primary_outcome_measure.trim())
                }
              })
            }
            break
          case 'otherOutcomeMeasures':
            if (trial.outcomes) {
              trial.outcomes.forEach(outcome => {
                if (outcome.other_outcome_measure && outcome.other_outcome_measure.trim()) {
                  values.add(outcome.other_outcome_measure.trim())
                }
              })
            }
            break
          case 'study_design_keywords':
            if (trial.outcomes) {
              trial.outcomes.forEach(outcome => {
                if (outcome.study_design_keywords && outcome.study_design_keywords.trim()) {
                  values.add(outcome.study_design_keywords.trim())
                }
              })
            }
            break
          // Handle Step 5-3 fields (eligibility criteria)
          case 'inclusion_criteria':
            if (trial.criteria) {
              trial.criteria.forEach(criterion => {
                if (criterion.inclusion_criteria && criterion.inclusion_criteria.trim()) {
                  values.add(criterion.inclusion_criteria.trim())
                }
              })
            }
            break
          case 'exclusion_criteria':
            if (trial.criteria) {
              trial.criteria.forEach(criterion => {
                if (criterion.exclusion_criteria && criterion.exclusion_criteria.trim()) {
                  values.add(criterion.exclusion_criteria.trim())
                }
              })
            }
            break
          // Handle Step 5-8 fields (notes)
          case 'notes':
            if (trial.notes && Array.isArray(trial.notes)) {
              trial.notes.forEach(note => {
                if (note && note.notes && note.notes.trim()) {
                  values.add(note.notes.trim())
                }
              })
            }
            break
          // Don't add dynamic values for last_modified_user - only use hardcoded "Admin"
          // Don't add dynamic values for text fields: purpose_of_trial, summary, treatment_regimen
        }
      }

      // Only add fieldValue if it's not a text field that should be excluded from dropdowns
      const textOnlyFields = ['purpose_of_trial', 'summary', 'treatment_regimen', 'primaryOutcomeMeasures',
        'otherOutcomeMeasures', 'inclusion_criteria', 'exclusion_criteria', 'notes'];
      if (fieldValue && fieldValue.trim() && !textOnlyFields.includes(field)) {
        values.add(fieldValue.trim())
      }
    })

    return Array.from(values).sort()
  }

  // Function to render the appropriate input type based on field
  const renderValueInput = (criterion: TherapeuticSearchCriteria) => {
    // Map field names to dropdown category names (some fields have different names)
    const fieldToCategoryMap: Record<string, string> = {
      'status': 'trial_status',
      'gender': 'sex',
      'countries': 'country',
    };
    const categoryName = fieldToCategoryMap[criterion.field] || criterion.field;
    
    // Use dynamic options if available, fallback to static fieldOptions
    let fieldOptionsForField = fieldOptions[criterion.field]
    if (dynamicDropdowns[categoryName] && dynamicDropdowns[categoryName].options.length > 0) {
      fieldOptionsForField = dynamicDropdowns[categoryName].options
    }
    const isDateField = dateFields.includes(criterion.field)
    // Exclude text-only fields from getting dynamic values - they should be text inputs
    const textOnlyFields = ['title', 'trial_identifier', 'purpose_of_trial', 'summary', 'treatment_regimen',
      'primaryOutcomeMeasures', 'otherOutcomeMeasures', 'inclusion_criteria',
      'exclusion_criteria', 'notes', 'study_design', 'reference_links']
    const dynamicValues = textOnlyFields.includes(criterion.field) ? [] : getFieldValues(criterion.field)

    // Special handling for primary_drugs and other_drugs - use SearchableSelect with drug names from hook
    if (criterion.field === "primary_drugs" || criterion.field === "other_drugs") {
      const drugOptions = getPrimaryDrugsOptions().map(drug => ({
        value: drug.value,
        label: drug.label
      }))

      // Get the current value and normalize it
      const currentValue = Array.isArray(criterion.value) ? criterion.value[0] || "" : (criterion.value as string || "");
      const normalizedValue = currentValue.trim();

      // Debug logging
      console.log('Drug options for', criterion.field, ':', drugOptions.length, 'options');
      console.log('Current value:', normalizedValue);
      console.log('Value in options?', drugOptions.some(opt => opt.value === normalizedValue || opt.value.toLowerCase() === normalizedValue.toLowerCase()));

      // If no options, show a message
      if (drugOptions.length === 0) {
        console.warn('No drug options available. Make sure drugs are loaded from the API.');
      }

      // Find matching value (case-insensitive fallback)
      let matchingValue = normalizedValue;
      if (normalizedValue && !drugOptions.some(opt => opt.value === normalizedValue)) {
        // Try case-insensitive match
        const caseInsensitiveMatch = drugOptions.find(opt =>
          opt.value.toLowerCase() === normalizedValue.toLowerCase()
        );
        if (caseInsensitiveMatch) {
          matchingValue = caseInsensitiveMatch.value;
          console.log('Found case-insensitive match:', matchingValue);
        }
      }

      return (
        <SearchableSelect
          value={matchingValue}
          onValueChange={(value) => {
            console.log('Drug selected:', value);
            updateCriteria(criterion.id, "value", value);
          }}
          options={drugOptions}
          placeholder={criterion.field === "primary_drugs" ? "Select primary drug" : "Select other drug"}
          searchPlaceholder={criterion.field === "primary_drugs" ? "Search primary drugs..." : "Search other drugs..."}
          emptyMessage={criterion.field === "primary_drugs" ? "No primary drug found." : "No other drug found."}
          className="w-full"
          loading={isDrugsLoading}
        />
      )
    }

    // Special handling for trial_tags - use multi-tag input
    if (criterion.field === "trial_tags") {
      const tags = Array.isArray(criterion.value) ? criterion.value :
        criterion.value ? [criterion.value] : [];
      return (
        <MultiTagInput
          value={tags}
          onChange={(tags) => updateCriteria(criterion.id, "value", tags)}
          placeholder="Enter tags like 'Cancer', 'Fever' and press Enter"
          className="w-full"
        />
      )
    }

    // Date field with custom input
    if (isDateField) {
      return (
        <CustomDateInput
          value={Array.isArray(criterion.value) ? criterion.value[0] || "" : criterion.value}
          onChange={(value) => updateCriteria(criterion.id, "value", value)}
          placeholder="MM-DD-YYYY"
          className="w-full"
        />
      )
    }

    // Dropdown for fields with specific options (hardcoded)
    if (fieldOptionsForField) {
      return (
        <Select
          value={Array.isArray(criterion.value) ? criterion.value[0] || "" : criterion.value}
          onValueChange={(value) => updateCriteria(criterion.id, "value", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            {fieldOptionsForField.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Dynamic dropdown for fields with data from database
    if (dynamicValues.length > 0) {
      return (
        <SearchableSelect
          value={Array.isArray(criterion.value) ? criterion.value[0] || "" : (criterion.value as string)}
          onValueChange={(value) => updateCriteria(criterion.id, "value", value)}
          options={dynamicValues.map(v => ({ value: v, label: v }))}
          placeholder="Select option"
          searchPlaceholder={`Search ${criterion.field.replace(/_/g, ' ')}...`}
          className="w-full"
        />
      )
    }

    // Integer input for number_of_arms field
    if (criterion.field === "number_of_arms") {
      return (
        <Input
          type="number"
          min="1"
          placeholder="Enter number of arms (e.g., 2)"
          value={Array.isArray(criterion.value) ? criterion.value[0] || "" : criterion.value}
          onChange={(e) => {
            const value = e.target.value;
            // Only allow positive integers
            if (value === "" || /^\d+$/.test(value)) {
              updateCriteria(criterion.id, "value", value);
            }
          }}
          onKeyDown={(e) => {
            // Prevent non-numeric characters except backspace, delete, arrow keys
            if (!/[\d\b\ArrowLeft\ArrowRight\ArrowUp\ArrowDown\Delete]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
            }
          }}
        />
      )
    }

    // Default to text input for fields without specific options or dynamic data
    return (
      <Input
        placeholder="Enter the search term"
        value={Array.isArray(criterion.value) ? criterion.value[0] || "" : criterion.value}
        onChange={(e) => updateCriteria(criterion.id, "value", e.target.value)}
      />
    )
  }

  const addCriteria = () => {
    const dropdownFields = [
      'therapeutic_area', 'trial_phase', 'status', 'primary_drugs', 'other_drugs',
      'disease_type', 'patient_segment', 'line_of_therapy', 'sponsor_collaborators',
      'sponsor_field_activity', 'associated_cro', 'countries', 'region', 'trial_record_status',
      'gender', 'healthy_volunteers', 'trial_outcome', 'adverse_event_reported', 'adverse_event_type',
      'publication_type', 'registry_name', 'study_type', 'study_design_keywords'
    ];

    // Set default operator based on field type
    let defaultOperator = "contains";
    if (dropdownFields.includes(criteria[criteria.length - 1]?.field)) {
      defaultOperator = "is";
    } else if (criteria[criteria.length - 1]?.field === "number_of_arms") {
      defaultOperator = "equals";
    }

    const newCriteria: TherapeuticSearchCriteria = {
      id: Date.now().toString(),
      field: "title",
      operator: defaultOperator,
      value: "",
      logic: "AND",
    }
    setCriteria((prev) => [...prev, newCriteria])
  }

  const removeCriteria = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id))
  }

  const updateCriteria = (id: string, field: keyof TherapeuticSearchCriteria, value: string | string[]) => {
    setCriteria((prev) => prev.map((c) => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };

        // Set default operator based on field type
        if (field === "field") {
          const dropdownFields = [
            'therapeutic_area', 'trial_phase', 'status', 'primary_drugs', 'other_drugs',
            'disease_type', 'patient_segment', 'line_of_therapy', 'sponsor_collaborators',
            'sponsor_field_activity', 'associated_cro', 'countries', 'region', 'trial_record_status',
            'gender', 'healthy_volunteers', 'trial_outcome', 'adverse_event_reported', 'adverse_event_type',
            'publication_type', 'registry_name', 'study_type', 'study_design_keywords'
          ];

          if (dropdownFields.includes(value as string)) {
            updated.operator = "is";
            updated.value = "";
          } else if (value === "number_of_arms") {
            updated.operator = "equals";
            updated.value = "";
          } else {
            updated.operator = "contains";
            updated.value = "";
          }
        }

        return updated;
      }
      return c;
    }))
  }

  const handleApply = () => {
    const filteredCriteria = criteria.filter((c) => {
      if (Array.isArray(c.value)) {
        return c.value.length > 0 && c.value.some(v => v.trim() !== "");
      }
      return c.value.trim() !== "";
    });
    onApplySearch(filteredCriteria);
    onOpenChange(false);
  }

  const handleClear = () => {
    setCriteria([{
      id: "1",
      field: "title",
      operator: "contains",
      value: "",
      logic: "AND",
    }])
  }

  // Load saved queries from localStorage
  const loadSavedQueries = async () => {
    setLoadingQueries(true)

    try {
      // Try to fetch from API first
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved/user/dashboard-queries`

      if (searchTerm.trim()) {
        url += `?search=${encodeURIComponent(searchTerm.trim())}`
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()

        // If API returns empty data, fallback to localStorage
        if (!data.data || data.data.length === 0) {
          const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
          setSavedQueries(localQueries)
        } else {
          setSavedQueries(data.data || [])
        }
        return
      }

      // If API fails, fallback to localStorage
      const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
      setSavedQueries(localQueries)

    } catch (error) {
      console.error("Error fetching saved queries:", error)

      // Fallback to localStorage
      try {
        const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
        setSavedQueries(localQueries)
      } catch (localError) {
        console.error("Failed to load from localStorage:", localError)
      }
    } finally {
      setLoadingQueries(false)
    }
  }

  const handleOpenSavedQueries = () => {
    setSearchTerm("")
    loadSavedQueries()
    setSavedQueriesOpen(true)
  }

  const handleLoadQuery = (query: any) => {
    if (query.query_data && query.query_data.searchCriteria) {
      setCriteria(query.query_data.searchCriteria)
      toast({
        title: "Query Loaded",
        description: `"${query.title}" has been applied to your search`,
      })
      setSavedQueriesOpen(false)
    }
  }

  const handleDeleteQuery = async (queryId: string) => {
    try {
      // Try API first
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved/${queryId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Query deleted successfully",
        })
        // Refresh the list
        await loadSavedQueries()
        return
      }

      // If API fails, use localStorage fallback
      const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
      const updatedQueries = localQueries.filter((q: any) => q.id !== queryId)
      localStorage.setItem('unifiedSavedQueries', JSON.stringify(updatedQueries))

      toast({
        title: "Success",
        description: "Query deleted successfully",
      })

      // Refresh the list
      await loadSavedQueries()

    } catch (error) {
      console.error("Error deleting query:", error)

      // Still try localStorage fallback
      try {
        const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
        const updatedQueries = localQueries.filter((q: any) => q.id !== queryId)
        localStorage.setItem('unifiedSavedQueries', JSON.stringify(updatedQueries))

        toast({
          title: "Success",
          description: "Query deleted successfully",
        })

        // Refresh the list
        await loadSavedQueries()
      } catch (localError) {
        console.error("Failed to delete from localStorage:", localError)
        toast({
          title: "Error",
          description: "Failed to delete query",
          variant: "destructive",
        })
      }
    }
  }

  const handleSaveQuery = () => {
    setSaveQueryModalOpen(true)
  }

  // Format date similar to QueryHistoryModal
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get filter summary
  const getFilterSummary = (queryData: any) => {
    if (!queryData) return "No filters"

    const filterCount = Object.values(queryData.filters || {})
      .reduce((count: number, filter: any) => count + (filter?.length || 0), 0)
    const criteriaCount = queryData.searchCriteria?.length || 0
    const hasSearch = queryData.searchTerm?.trim() ? 1 : 0

    const total = filterCount + criteriaCount + hasSearch
    if (total === 0) return "No filters"

    const parts = []
    if (filterCount > 0) parts.push(`${filterCount} filters`)
    if (criteriaCount > 0) parts.push(`${criteriaCount} criteria`)
    if (hasSearch) parts.push("search term")

    return parts.join(", ")
  }

  // Debounced search effect
  useEffect(() => {
    if (savedQueriesOpen) {
      const timeoutId = setTimeout(() => {
        loadSavedQueries()
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, savedQueriesOpen])

  // Filter saved queries
  const filteredSavedQueries = savedQueries.filter(query => {
    if (!searchTerm.trim()) return true
    const search = searchTerm.toLowerCase()
    return (
      query.title?.toLowerCase().includes(search) ||
      query.description?.toLowerCase().includes(search)
    )
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0">
          <DialogHeader className="px-6 py-4 border-b bg-blue-50">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">Advanced Therapeutic Search</DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {criteria.map((criterion, index) => (
              <div key={criterion.id} className="space-y-3">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2">
                    <Select
                      value={criterion.field}
                      onValueChange={(value) => updateCriteria(criterion.id, "field", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {therapeuticSearchFields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Select
                      value={criterion.operator}
                      onValueChange={(value) => updateCriteria(criterion.id, "operator", value)}
                    >
                      <SelectTrigger className="bg-teal-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          // Define dropdown fields that should use exact matching
                          const dropdownFields = [
                            'therapeutic_area', 'trial_phase', 'status', 'primary_drugs', 'other_drugs',
                            'disease_type', 'patient_segment', 'line_of_therapy', 'sponsor_collaborators',
                            'sponsor_field_activity', 'associated_cro', 'countries', 'region', 'trial_record_status',
                            'gender', 'healthy_volunteers', 'trial_outcome', 'adverse_event_reported', 'adverse_event_type',
                            'publication_type', 'registry_name', 'study_type', 'study_design_keywords',
                            'last_modified_user'
                          ];

                          // For dropdown fields, suggest exact matching operators
                          if (dropdownFields.includes(criterion.field)) {
                            return [
                              { value: "is", label: "is" },
                              { value: "is_not", label: "is not" },
                              { value: "contains", label: "contains" },
                              { value: "equals", label: "=" },
                              { value: "not_equals", label: "!=" }
                            ].map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ));
                          }

                          // For date fields, show date comparison operators
                          if (dateFields.includes(criterion.field)) {
                            return operators.filter(op => ["equals", "is", "is_not", "not_equals", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "contains"].includes(op.value))
                              .map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ));
                          }

                          // For numeric fields, show numeric operators
                          if (criterion.field === "number_of_arms" || criterion.field === "age_min" || criterion.field === "age_max") {
                            return operators.filter(op => ["equals", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "not_equals"].includes(op.value))
                              .map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ));
                          }

                          // For all other fields, show all operators
                          return operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-4">
                    {renderValueInput(criterion)}
                  </div>

                  <div className="col-span-2">
                    <Select
                      value={criterion.logic}
                      onValueChange={(value) => updateCriteria(criterion.id, "logic", value as "AND" | "OR")}
                    >
                      <SelectTrigger className="bg-orange-500 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCriteria}
                      className="bg-green-500 text-white hover:bg-green-600 h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    {criteria.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCriteria(criterion.id)}
                        className="bg-red-500 text-white hover:bg-red-600 h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {/* Remove logic connector line for the last item */}
                {index < criteria.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-8 h-4 flex items-center justify-center">
                      <div className="w-px h-4 bg-gray-300"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleOpenSavedQueries}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <span className="mr-2">📁</span>
                Open saved queries
              </Button>
              <Button variant="outline" onClick={handleSaveQuery} className="bg-gray-600 text-white hover:bg-gray-700">
                <span className="mr-2">💾</span>
                Save this Query
              </Button>
              <Button variant="outline" onClick={handleClear} className="bg-yellow-600 text-white hover:bg-yellow-700">
                <span className="mr-2">🔄</span>
                Clear All
              </Button>
            </div>
            <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700">
              Run Search
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Queries Modal */}
      <Dialog open={savedQueriesOpen} onOpenChange={setSavedQueriesOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Saved Queries</DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search saved queries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Loading */}
            {loadingQueries && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading saved queries...</span>
              </div>
            )}

            {/* Results */}
            {!loadingQueries && (
              <div className="flex-1 overflow-auto">
                {filteredSavedQueries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "No queries found matching your search" : "No saved queries yet"}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Filters</TableHead>
                        <TableHead>Saved</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSavedQueries.map((query) => (
                        <TableRow key={query.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <span>{query.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {query.query_type || "dashboard"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate text-sm text-gray-600">
                              {query.description || "No description"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {getFilterSummary(query.query_data)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-500">
                              <CalendarIcon2 className="h-3 w-3 mr-1" />
                              {formatDate(query.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLoadQuery(query)}
                                title="Load this query"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteQuery(query.id)}
                                title="Delete this query"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setSavedQueriesOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Query Modal */}
      <SaveQueryModal
        open={saveQueryModalOpen}
        onOpenChange={setSaveQueryModalOpen}
        currentFilters={currentFilters || DEFAULT_THERAPEUTIC_FILTERS}
        currentSearchCriteria={criteria}
        searchTerm=""
        editingQueryId={editingQueryId}
        editingQueryTitle={editingQueryTitle}
        editingQueryDescription={editingQueryDescription}
        onSaveSuccess={onSaveQuerySuccess}
      />
    </>
  )
}
