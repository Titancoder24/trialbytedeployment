"use client"

import { formatDateToMMDDYYYY } from "@/lib/date-utils";
import { getUniqueFieldValues, normalizePhaseValue, arePhasesEquivalent } from "@/lib/search-utils";
import { formatDisplayValue } from "@/lib/format-utils";
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
    internal_note: string | null;
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
  editingQueryTitle?: string;
  editingQueryDescription?: string;
  onSaveQuerySuccess?: () => void;
  storageKey?: string;
  queryType?: string;
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
  { value: "sponsor_field_activity", label: "Sponsor Field of Activity" },
  { value: "associated_cro", label: "Associated CRO" },
  { value: "countries", label: "Countries" },
  { value: "regions", label: "Regions" },
  { value: "trial_record_status", label: "Trial Record Status" },
  { value: "trial_tags", label: "Trial Tags" },

  // Eligibility criteria dropdown fields (Step 5-3)
  { value: "subject_type", label: "Subject Type" }, // Changed to text - confirm in fieldOptions removal
  { value: "sex", label: "Sex" },
  { value: "healthy_volunteers", label: "Healthy Volunteers" },
  { value: "actual_enrolled_volunteers", label: "Actual Enrolled Volunteers" },
  { value: "target_enrolled_volunteers", label: "Target Enrolled Volunteers" },

  // Results dropdown fields (Step 5-5)
  { value: "results_available", label: "Results Available" },
  { value: "endpoints_met", label: "Endpoints Met" },
  { value: "trial_outcome", label: "Trial Outcome" },

  // Study design keywords (Step 5-2) - dropdown
  { value: "study_design_keywords", label: "Study Design Keywords" },

  // Date fields - Actual
  { value: "actual_start_date", label: "Actual Start Date" },
  { value: "actual_enrollment_closed_date", label: "Actual Enrollment Closed Date" },
  { value: "actual_trial_end_date", label: "Actual Trial End Date" },
  { value: "actual_result_published_date", label: "Actual Result Published Date" },

  // Date fields - Estimated
  { value: "estimated_start_date", label: "Estimated Start Date" },
  { value: "estimated_enrollment_closed_date", label: "Estimated Enrollment Closed Date" },
  { value: "estimated_trial_end_date", label: "Estimated Trial End Date" },
  { value: "estimated_result_published_date", label: "Estimated Result Published Date" },

  // Sites
  { value: "total_number_of_sites", label: "Total Number of Sites" },

  // Admin-only fields
  { value: "full_review_user", label: "Full Review User" },
  { value: "last_modified_user", label: "Last Modified User" },
  { value: "next_review_date", label: "Next Review Date" },
  { value: "internal_note", label: "Internal Note" },

  // Text fields that are commonly used for search
  { value: "title", label: "Title" },
  { value: "trial_id", label: "Trial ID" },
  // Missing text fields from User side
  { value: "reference_links", label: "Reference Links" },
  { value: "purpose_of_trial", label: "Purpose" },
  { value: "summary", label: "Summary" },
  { value: "primary_outcome_measure", label: "Primary Outcome" },
  { value: "other_outcome_measure", label: "Other Outcome" },
  { value: "treatment_regimen", label: "Treatment Regimen" },
  { value: "study_design", label: "Study Design" },
  { value: "number_of_arms", label: "Number of Arms" },
  { value: "inclusion_criteria", label: "Inclusion Criteria" },
  { value: "exclusion_criteria", label: "Exclusion Criteria" },
  { value: "age_from", label: "Age From" },
  { value: "age_to", label: "Age To" },
]

// Default text operators
const defaultTextOperators = [
  { value: "contains", label: "Contains" },
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
]

// Special text operators for long fields (contains / not contains)
const containsOperators = [
  { value: "contains", label: "Contains" },
  { value: "is_not", label: "not contains" }, // "is not" maps to !includes logic
]

// Numeric operators (for number fields)
const numericOperators = [
  { value: "equals", label: "=" },
  { value: "not_equals", label: "!=" },
  { value: "greater_than", label: ">" },
  { value: "greater_than_equal", label: ">=" },
  { value: "less_than", label: "<" },
  { value: "less_than_equal", label: "<=" },
]

// Date operators
const dateOperators = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "greater_than", label: ">" },
  { value: "greater_than_equal", label: ">=" },
  { value: "less_than", label: "<" },
  { value: "less_than_equal", label: "<=" },
]

// Trial ID operators (is, is not, contains)
const trialIdOperators = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "contains", label: "contains" }
]

// Helper function to get operators based on field type
const getOperatorsForField = (fieldValue: string) => {
  // Numeric fields
  const numericFields = [
    "actual_enrolled_volunteers", "target_enrolled_volunteers", "total_number_of_sites", "number_of_arms", "age_from", "age_to"
  ]
  // Date fields
  const dateFieldsList = [
    "actual_start_date", "estimated_start_date", "actual_enrollment_closed_date",
    "estimated_enrollment_closed_date", "actual_trial_end_date", "estimated_trial_end_date",
    "actual_result_published_date", "estimated_result_published_date", "next_review_date"
  ]
  // Binary yes/no fields - only allow "is" and "is not"
  const binaryFields = ["results_available", "endpoints_met"]
  const binaryOperators = [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" }
  ]

  // Fields that should only have "Contains" and "not contains"
  const containsOnlyFields = [
    "primary_outcome_measure",
    "other_outcome_measure",
    "treatment_regimen",
    "study_design",
    "purpose_of_trial",
    "summary",
    "inclusion_criteria",
    "exclusion_criteria",
    "internal_note"
  ]

  if (numericFields.includes(fieldValue)) return numericOperators
  if (dateFieldsList.includes(fieldValue)) return dateOperators
  if (binaryFields.includes(fieldValue)) return binaryOperators
  if (containsOnlyFields.includes(fieldValue)) return containsOperators
  if (fieldValue === "trial_id") return trialIdOperators

  return defaultTextOperators
}

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
    { value: "brain_stem_glioma", label: "Brain Stem Glioma" },
    { value: "craniopharyngioma", label: "Craniopharyngioma" },
    { value: "choroid_plexus_tumors", label: "Choroid Plexus Tumors" },
    { value: "embryonal_tumors", label: "Embryonal Tumors" },
    { value: "epedymoma", label: "Epedymoma" },
    { value: "germ_cell_tumors", label: "Germ Cell Tumors" },
    { value: "glioblastoma", label: "Glioblastoma" },
    { value: "hemangioblastoma", label: "Hemangioblastoma" },
    { value: "medulloblastoma", label: "Medulloblastoma" },
    { value: "meningioma", label: "Meningioma" },
    { value: "oligodendroglioma", label: "Oligodendroglioma" },
    { value: "pineal_tumor", label: "Pineal Tumor" },
    { value: "pituitary_tumor", label: "Pituitary Tumor" },
    { value: "colorectal", label: "Colorectal" },
    { value: "endometrial", label: "Endometrial" },
    { value: "esophageal", label: "Esophageal" },
    { value: "fallopian_tube", label: "Fallopian Tube" },
    { value: "gall_bladder", label: "Gall Bladder" },
    { value: "gastric", label: "Gastric" },
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
  // Patient Segment - Breast Cancer specific patient segments only
  patient_segment: [
    { value: "her2_positive_breast_cancer", label: "HER2+ Breast Cancer" },
    { value: "her2_negative_breast_cancer", label: "HER2- Breast Cancer" },
    { value: "hr_positive_breast_cancer", label: "HR+ Breast Cancer (ER+ and/or PR+)" },
    { value: "triple_negative_breast_cancer", label: "Triple-Negative Breast Cancer (TNBC)" },
    { value: "early_stage_breast_cancer", label: "Early-Stage Breast Cancer" },
    { value: "locally_advanced_breast_cancer", label: "Locally Advanced Breast Cancer" },
    { value: "metastatic_breast_cancer", label: "Metastatic Breast Cancer" },
    { value: "recurrent_breast_cancer", label: "Recurrent Breast Cancer" },
    { value: "advanced_breast_cancer_non_metastatic", label: "Advanced Breast Cancer (Non-Metastatic)" },
    { value: "premenopausal_breast_cancer", label: "Premenopausal Breast Cancer Patients" },
    { value: "postmenopausal_breast_cancer", label: "Postmenopausal Breast Cancer Patients" },
    { value: "breast_cancer_nos", label: "Breast Cancer (NOS)" },
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
  // Regions - Exact options from creation phase

  // Trial Record Status - Exact options from creation phase
  trial_record_status: [
    { value: "DIP", label: "Development In Progress (DIP)" },
    { value: "IP", label: "In Production (IP)" },
    { value: "UIP", label: "Update In Progress (UIP)" }
  ],
  // Step 5-3: Eligibility Criteria dropdowns
  sex: [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Both", label: "Both" }
  ],
  healthy_volunteers: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "unknown", label: "Unknown" }
  ],
  // Step 5-5: Results dropdowns
  trial_outcome: [
    { value: "Completed – Outcome Indeterminate", label: "Completed – Outcome Indeterminate" },
    { value: "Completed – Outcome Unknown", label: "Completed – Outcome Unknown" },
    { value: "Completed – Primary Endpoints Met", label: "Completed – Primary Endpoints Met" },
    { value: "Completed – Primary Endpoints Not Met", label: "Completed – Primary Endpoints Not Met" },
    { value: "Terminated - Business Decision, Other", label: "Terminated - Business Decision, Other" },
    { value: "Terminated - Business Decision, Pipeline Reprioritization", label: "Terminated - Business Decision, Pipeline Reprioritization" },
    { value: "Terminated – Business Decision, Drug Strategy Shift", label: "Terminated – Business Decision, Drug Strategy Shift" },
    { value: "Terminated – Insufficient Enrolment", label: "Terminated – Insufficient Enrolment" },
    { value: "Terminated – Lack Of Efficacy", label: "Terminated – Lack Of Efficacy" },
    { value: "Terminated – Lack Of Funding", label: "Terminated – Lack Of Funding" },
    { value: "Terminated – Other", label: "Terminated – Other" },
    { value: "Terminated – Planned But Never Initiated", label: "Terminated – Planned But Never Initiated" },
    { value: "Terminated – Safety/adverse Effects", label: "Terminated – Safety/adverse Effects" },
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
  // Logs fields - Last Modified User and Full Review User
  last_modified_user: [
    { value: "Admin", label: "Admin" }
  ],
  full_review_user: [
    { value: "Admin", label: "Admin" }
  ],

  results_available: [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" }
  ],
  endpoints_met: [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" }
  ]
}

// Date fields that should show calendar input
const dateFields = [
  "created_at",
  "updated_at",
  "last_modified_date",
  "actual_start_date",
  "estimated_start_date",
  "actual_enrollment_closed_date",
  "estimated_enrollment_closed_date",
  "actual_trial_end_date",
  "estimated_trial_end_date",
  "actual_result_published_date",
  "estimated_result_published_date",
  "next_review_date"
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
  onSaveQuerySuccess,
  storageKey = "unifiedSavedQueries",
  queryType = "dashboard"
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
    'adverse_event_reported', 'adverse_event_type', 'study_design_keywords', 'trial_tags',
    'sponsor_collaborators', 'sponsor_field_activity', 'associated_cro', 'country', 'region',
    'full_review_user', 'last_modified_user', 'results_available', 'endpoints_met'
  ]

  // Map category names to field names for fallback options lookup
  const categoryToFieldMap: Record<string, string> = {
    'trial_status': 'status',
    'country': 'countries',
    'region': 'regions'
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
          case 'regions':
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
      'region': 'region',
      'regions': 'region'
    };
    const categoryName = fieldToCategoryMap[criterion.field] || criterion.field;

    // Use dynamic options if available, fallback to static fieldOptions
    let fieldOptionsForField = fieldOptions[criterion.field]
    if (dynamicDropdowns[categoryName] && dynamicDropdowns[categoryName].options.length > 0) {
      fieldOptionsForField = dynamicDropdowns[categoryName].options
    }
    const isDateField = dateFields.includes(criterion.field)
    // Exclude text-only fields and regions from getting dynamic values - they should use dropdown options only
    const textOnlyFields = ['title', 'trial_identifier', 'purpose_of_trial', 'summary', 'treatment_regimen',
      'primaryOutcomeMeasures', 'otherOutcomeMeasures', 'inclusion_criteria',
      'exclusion_criteria', 'notes', 'study_design', 'reference_links', 'regions', 'region']
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

    // Special handling for trial_tags - use dropdown with dynamic values from dropdown management API
    if (criterion.field === "trial_tags") {
      // Use dynamic dropdown values from API if available, otherwise empty array
      const tagOptions = dynamicDropdowns['trial_tags']?.options || [];

      return (
        <Select
          value={Array.isArray(criterion.value) ? criterion.value[0] || "" : criterion.value}
          onValueChange={(value) => updateCriteria(criterion.id, "value", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select trial tag" />
          </SelectTrigger>
          <SelectContent>
            {tagOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Date field with calendar popup and month/year dropdown navigation
    if (isDateField) {
      const dateValue = Array.isArray(criterion.value) ? criterion.value[0] || "" : criterion.value;
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal border border-gray-300 rounded-lg",
                !dateValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? format(new Date(dateValue), "MM-dd-yyyy") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue ? new Date(dateValue) : undefined}
              onSelect={(date: Date | undefined) => {
                if (date) {
                  // Store as YYYY-MM-DD to avoid timezone issues
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  updateCriteria(criterion.id, "value", `${year}-${month}-${day}`)
                }
              }}
              initialFocus
              captionLayout="dropdown"
              fromYear={1900}
              toYear={2100}
            />
          </PopoverContent>
        </Popover>
      )
    }

    // Dropdown for fields with specific options (hardcoded)
    if (fieldOptionsForField) {
      return (
        <Select
          value={Array.isArray(criterion.value) ? criterion.value[0] || "" : (criterion.value || "")}
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
          value={Array.isArray(criterion.value) ? criterion.value[0] || "" : (criterion.value as string || "")}
          onValueChange={(value) => updateCriteria(criterion.id, "value", value)}
          options={dynamicValues.map(v => ({ value: v, label: formatDisplayValue(v) }))}
          placeholder="Select option"
          searchPlaceholder={`Search ${criterion.field.replace(/_/g, ' ')}...`}
          className="w-full"
        />
      )
    }

    // Integer input for number_of_arms, actual_enrolled_volunteers, target_enrolled_volunteers, total_number_of_sites
    if (["number_of_arms", "actual_enrolled_volunteers", "target_enrolled_volunteers", "total_number_of_sites"].includes(criterion.field)) {
      const placeholders: Record<string, string> = {
        "number_of_arms": "Enter number of arms (e.g., 2)",
        "actual_enrolled_volunteers": "Enter actual enrolled volunteers",
        "target_enrolled_volunteers": "Enter target enrolled volunteers",
        "total_number_of_sites": "Enter total number of sites"
      };

      return (
        <Input
          type="number"
          min="0"
          placeholder={placeholders[criterion.field] || "Enter number"}
          value={Array.isArray(criterion.value) ? criterion.value[0] || "" : (criterion.value || "")}
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

    // Text input for internal_note
    if (criterion.field === "internal_note") {
      return (
        <Input
          placeholder="Enter internal note"
          value={Array.isArray(criterion.value) ? criterion.value[0] || "" : (criterion.value || "")}
          onChange={(e) => updateCriteria(criterion.id, "value", e.target.value)}
        />
      )
    }

    // Default to text input for fields without specific options or dynamic data
    return (
      <Input
        placeholder="Enter the search term"
        value={Array.isArray(criterion.value) ? criterion.value[0] || "" : (criterion.value || "")}
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
        <DialogContent className="max-w-4xl max-h-[85vh] h-[800px] p-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b bg-blue-50">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">Advanced Therapeutic Search</DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4 flex-1 overflow-y-auto min-h-0 bg-white">
            {criteria.map((criterion, index) => (
              <div key={criterion.id} className="space-y-3">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4">
                    <SearchableSelect
                      options={therapeuticSearchFields}
                      value={criterion.field}
                      onValueChange={(value) => updateCriteria(criterion.id, "field", value)}
                      placeholder="Select field"
                      searchPlaceholder="Search field..."
                      className="w-full"
                    />
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
                        {getOperatorsForField(criterion.field).map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    {renderValueInput(criterion)}
                  </div>

                  <div className="col-span-1">
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
        storageKey={storageKey}
        queryType={queryType}
        sourceModal="advanced"
      />
    </>
  )
}
