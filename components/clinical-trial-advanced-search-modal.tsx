"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { X, Plus, Minus, CalendarIcon } from "lucide-react"
import { FaBook, FaBookmark } from "react-icons/fa"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { SaveQueryModal } from "@/components/save-query-modal"
import { useDrugNames } from "@/hooks/use-drug-names"
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface ClinicalTrialAdvancedSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplySearch: (criteria: ClinicalTrialSearchCriteria[]) => void
  onOpenSavedQueries?: () => void
  currentSearchCriteria?: ClinicalTrialSearchCriteria[]
  editingQueryId?: string | null
  editingQueryTitle?: string
  editingQueryDescription?: string
  storageKey?: string
  queryType?: string
}

export interface ClinicalTrialSearchCriteria {
  id: string
  field: string
  operator: string
  value: string
  logic: "AND" | "OR"
}

const searchFields = [
  { value: "trial_id", label: "Trial ID", type: "text" },
  { value: "disease_type", label: "Disease Type", type: "dropdown" },
  { value: "enrollment", label: "Enrollment", type: "number" },
  { value: "therapeutic_area", label: "Therapeutic Area", type: "dropdown" },
  { value: "trial_phase", label: "Trial Phase", type: "dropdown" },
  { value: "primary_drugs", label: "Primary Drug", type: "dropdown" },
  { value: "secondary_drugs", label: "Other Drugs", type: "dropdown" },
  { value: "trial_status", label: "Status", type: "dropdown" },
  { value: "trial_record_status", label: "Trial Record Status", type: "dropdown" },
  { value: "sponsor_collaborators", label: "Sponsor", type: "dropdown" },
  { value: "countries", label: "Countries", type: "dropdown" },
  { value: "regions", label: "Regions", type: "dropdown" },
  { value: "patient_segment", label: "Patient Segment", type: "dropdown" },
  { value: "line_of_therapy", label: "Line of Therapy", type: "dropdown" },
  { value: "subject_type", label: "Subject Type", type: "text" },
  { value: "sex", label: "Sex", type: "dropdown" },
  { value: "actual_enrolled_volunteers", label: "Actual Enrolled Volunteers", type: "number" },
  { value: "target_enrolled_volunteers", label: "Target Enrolled Volunteers", type: "number" },
  { value: "total_number_of_sites", label: "Total Number of Sites", type: "number" },
  { value: "trial_identifier", label: "Trial Identifier", type: "text" },
  { value: "reference_links", label: "Reference Links", type: "text" },
  { value: "purpose_of_trial", label: "Purpose", type: "text" },
  { value: "summary", label: "Summary", type: "text" },
  { value: "primary_outcome_measure", label: "Primary Outcome", type: "text" },
  { value: "other_outcome_measure", label: "Other Outcome", type: "text" },
  { value: "treatment_regimen", label: "Treatment Regimen", type: "text" },
  { value: "study_design", label: "Study Design", type: "text" },
  { value: "number_of_arms", label: "Number of Arms", type: "number" },
  { value: "inclusion_criteria", label: "Inclusion Criteria", type: "text" },
  { value: "exclusion_criteria", label: "Exclusion Criteria", type: "text" },
  { value: "age_from", label: "Age From", type: "number" },
  { value: "age_to", label: "Age To", type: "number" },
  { value: "results_available", label: "Results Available", type: "dropdown" },
  { value: "endpoints_met", label: "Endpoints Met", type: "dropdown" },
  { value: "actual_start_date", label: "Actual Start Date", type: "date" },
  { value: "estimated_start_date", label: "Estimated Start Date", type: "date" },
  { value: "actual_enrollment_closed_date", label: "Actual Enrollment Closed Date", type: "date" },
  { value: "estimated_enrollment_closed_date", label: "Estimated Enrollment Closed Date", type: "date" },
  { value: "actual_trial_end_date", label: "Actual Trial End Date", type: "date" },
  { value: "estimated_trial_end_date", label: "Estimated Trial End Date", type: "date" },
  { value: "actual_result_published_date", label: "Actual Result Published Date", type: "date" },
  { value: "estimated_result_published_date", label: "Estimated Result Published Date", type: "date" },
  { value: "title", label: "Title", type: "text" }
]

// Field-specific dropdown options
const fieldOptions: Record<string, { value: string; label: string }[]> = {
  therapeutic_area: [
    { value: "Autoimmune", label: "Autoimmune" },
    { value: "Cardiovascular", label: "Cardiovascular" },
    { value: "Endocrinology", label: "Endocrinology" },
    { value: "Gastrointestinal", label: "Gastrointestinal" },
    { value: "Infectious", label: "Infectious" },
    { value: "Oncology", label: "Oncology" },
    { value: "Gastroenterology", label: "Gastroenterology" },
    { value: "Dermatology", label: "Dermatology" },
    { value: "Vaccines", label: "Vaccines" },
    { value: "CNS/Neurology", label: "CNS/Neurology" },
    { value: "Ophthalmology", label: "Ophthalmology" },
    { value: "Immunology", label: "Immunology" },
    { value: "Rheumatology", label: "Rheumatology" },
    { value: "Haematology", label: "Haematology" },
    { value: "Nephrology", label: "Nephrology" },
    { value: "Urology", label: "Urology" }
  ],
  trial_phase: [
    { value: "Phase I", label: "Phase I" },
    { value: "Phase I/II", label: "Phase I/II" },
    { value: "Phase II", label: "Phase II" },
    { value: "Phase II/III", label: "Phase II/III" },
    { value: "Phase III", label: "Phase III" },
    { value: "Phase III/IV", label: "Phase III/IV" },
    { value: "Phase IV", label: "Phase IV" }
  ],
  trial_status: [
    { value: "Planned", label: "Planned" },
    { value: "Open", label: "Open" },
    { value: "Closed", label: "Closed" },
    { value: "Completed", label: "Completed" },
    { value: "Terminated", label: "Terminated" }
  ],
  trial_record_status: [
    { value: "Development In Progress (DIP)", label: "Development In Progress (DIP)" },
    { value: "In Production (IP)", label: "In Production (IP)" },
    { value: "Update In Progress (UIP)", label: "Update In Progress (UIP)" }
  ],
  disease_type: [
    { value: "Acute Lymphocytic Leukemia", label: "Acute Lymphocytic Leukemia" },
    { value: "Acute Myelogenous Leukemia", label: "Acute Myelogenous Leukemia" },
    { value: "Anal", label: "Anal" },
    { value: "Appendiceal", label: "Appendiceal" },
    { value: "Basal Skin Cell Carcinoma", label: "Basal Skin Cell Carcinoma" },
    { value: "Bladder", label: "Bladder" },
    { value: "Breast", label: "Breast" },
    { value: "Cervical", label: "Cervical" },
    { value: "Cholangiocarcinoma (Bile duct)", label: "Cholangiocarcinoma (Bile duct)" },
    { value: "Chronic Lymphocytic Leukemia", label: "Chronic Lymphocytic Leukemia" },
    { value: "Chronic Myelomonositic Leukemia", label: "Chronic Myelomonositic Leukemia" },
    { value: "Astrocytoma", label: "Astrocytoma" },
    { value: "Brain Stem Glioma", label: "Brain Stem Glioma" },
    { value: "Craniopharyngioma", label: "Craniopharyngioma" },
    { value: "Choroid Plexus Tumors", label: "Choroid Plexus Tumors" },
    { value: "Embryonal Tumors", label: "Embryonal Tumors" },
    { value: "Epedymoma", label: "Epedymoma" },
    { value: "Germ Cell Tumors", label: "Germ Cell Tumors" },
    { value: "Glioblastoma", label: "Glioblastoma" },
    { value: "Hemangioblastoma", label: "Hemangioblastoma" },
    { value: "Medulloblastoma", label: "Medulloblastoma" },
    { value: "Meningioma", label: "Meningioma" },
    { value: "Oligodendroglioma", label: "Oligodendroglioma" },
    { value: "Pineal Tumor", label: "Pineal Tumor" },
    { value: "Pituitary Tumor", label: "Pituitary Tumor" },
    { value: "Colorectal", label: "Colorectal" },
    { value: "Endometrial", label: "Endometrial" },
    { value: "Esophageal", label: "Esophageal" },
    { value: "Fallopian Tube", label: "Fallopian Tube" },
    { value: "Gall Bladder", label: "Gall Bladder" },
    { value: "Gastric", label: "Gastric" },
    { value: "GIST", label: "GIST" },
    { value: "Head/Neck", label: "Head/Neck" },
    { value: "Hodgkin's Lymphoma", label: "Hodgkin's Lymphoma" },
    { value: "Leukemia, Chronic Myelogenous", label: "Leukemia, Chronic Myelogenous" },
    { value: "Liver", label: "Liver" },
    { value: "Lung Non-small cell", label: "Lung Non-small cell" },
    { value: "Lung Small Cell", label: "Lung Small Cell" },
    { value: "Melanoma", label: "Melanoma" },
    { value: "Mesothelioma", label: "Mesothelioma" },
    { value: "Metastatic Cancer", label: "Metastatic Cancer" },
    { value: "Multiple Myeloma", label: "Multiple Myeloma" },
    { value: "Myelodysplastic Syndrome", label: "Myelodysplastic Syndrome" },
    { value: "Myeloproliferative Neoplasms", label: "Myeloproliferative Neoplasms" },
    { value: "Neuroblastoma", label: "Neuroblastoma" },
    { value: "Neuroendocrine", label: "Neuroendocrine" },
    { value: "Non-Hodgkin's Lymphoma", label: "Non-Hodgkin's Lymphoma" },
    { value: "Osteosarcoma", label: "Osteosarcoma" },
    { value: "Ovarian", label: "Ovarian" },
    { value: "Pancreas", label: "Pancreas" },
    { value: "Penile", label: "Penile" },
    { value: "Primary Peritoneal", label: "Primary Peritoneal" },
    { value: "Prostate", label: "Prostate" },
    { value: "Renal", label: "Renal" },
    { value: "Small Intestine", label: "Small Intestine" },
    { value: "Soft Tissue Carcinoma", label: "Soft Tissue Carcinoma" },
    { value: "Solid Tumor, Unspecified", label: "Solid Tumor, Unspecified" },
    { value: "Squamous Skin Cell Carcinoma", label: "Squamous Skin Cell Carcinoma" },
    { value: "Supportive care", label: "Supportive care" },
    { value: "Tenosynovial Giant Cell Tumor", label: "Tenosynovial Giant Cell Tumor" },
    { value: "Testicular", label: "Testicular" },
    { value: "Thymus", label: "Thymus" },
    { value: "Thyroid", label: "Thyroid" },
    { value: "Unspecified Cancer", label: "Unspecified Cancer" },
    { value: "Unspecified Haematological Cancer", label: "Unspecified Haematological Cancer" },
    { value: "Vaginal", label: "Vaginal" },
    { value: "Vulvar", label: "Vulvar" }
  ],
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
    { value: "breast_cancer_nos", label: "Breast Cancer (NOS)" }
  ],
  line_of_therapy: [
    { value: "1 – First Line", label: "1 – First Line" },
    { value: "2 – Second Line", label: "2 – Second Line" },
    { value: "Unknown", label: "Unknown" },
    { value: "Neo-Adjuvant", label: "Neo-Adjuvant" },
    { value: "Adjuvant", label: "Adjuvant" }
  ],
  countries: [
    { value: "United States", label: "United States" },
    { value: "Canada", label: "Canada" },
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "Germany", label: "Germany" },
    { value: "France", label: "France" },
    { value: "Japan", label: "Japan" },
    { value: "China", label: "China" },
    { value: "India", label: "India" }
  ],
  sponsor_collaborators: [
    { value: "Pfizer", label: "Pfizer" },
    { value: "Novartis", label: "Novartis" },
    { value: "AstraZeneca", label: "AstraZeneca" },
    { value: "Roche", label: "Roche" },
    { value: "Bristol-Myers Squibb", label: "Bristol-Myers Squibb" }
  ],
  regions: [
    { value: "North America", label: "North America" },
    { value: "Europe", label: "Europe" },
    { value: "Asia Pacific", label: "Asia Pacific" },
    { value: "Latin America", label: "Latin America" },
    { value: "Africa", label: "Africa" },
    { value: "Middle East", label: "Middle East" }
  ],
  sex: [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Both", label: "Both" }
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

// Default text operators (for non-numeric fields)
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
  const field = searchFields.find(f => f.value === fieldValue)
  if (!field) return defaultTextOperators

  // Binary yes/no fields - only allow "is" and "is not"
  const binaryFields = ["results_available", "endpoints_met"]
  const binaryOperators = [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" }
  ]
  if (binaryFields.includes(fieldValue)) return binaryOperators

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

  if (containsOnlyFields.includes(fieldValue)) return containsOperators
  if (fieldValue === "trial_id") return trialIdOperators

  switch (field.type) {
    case "number":
      return numericOperators
    case "date":
      return dateOperators
    default:
      return defaultTextOperators
  }
}

export function ClinicalTrialAdvancedSearchModal({
  open,
  onOpenChange,
  onApplySearch,
  onOpenSavedQueries,
  currentSearchCriteria,
  editingQueryId,
  editingQueryTitle,
  editingQueryDescription,
  storageKey = "unifiedSavedQueries",
  queryType = "dashboard"
}: ClinicalTrialAdvancedSearchModalProps) {
  // Start with a single empty criteria row - NO default selections
  const [criteria, setCriteria] = useState<ClinicalTrialSearchCriteria[]>([
    {
      id: "1",
      field: "",
      operator: "",
      value: "",
      logic: "AND",
    }
  ])
  const [saveQueryModalOpen, setSaveQueryModalOpen] = useState(false)

  // Get drug names from API
  const { getPrimaryDrugsOptions, isLoading: isDrugsLoading } = useDrugNames()

  // Get regions dynamically from dropdown management
  const { options: dynamicRegions, loading: isRegionsLoading } = useDynamicDropdown({
    categoryName: 'region',
    fallbackOptions: fieldOptions.regions
  })

  // Get sponsor_collaborators dynamically from dropdown management
  const { options: dynamicSponsors, loading: isSponsorsLoading } = useDynamicDropdown({
    categoryName: 'sponsor_collaborators',
  })

  // Get line_of_therapy dynamically from dropdown management
  const { options: dynamicLineOfTherapy, loading: isLineOfTherapyLoading } = useDynamicDropdown({
    categoryName: 'line_of_therapy',
    fallbackOptions: fieldOptions.line_of_therapy
  })

  // Get trial_status dynamically from dropdown management
  const { options: dynamicStatuses, loading: isStatusesLoading } = useDynamicDropdown({
    categoryName: 'trial_status',
    fallbackOptions: fieldOptions.trial_status
  })

  // Build dynamic field options with drug, region, and sponsor data
  const dynamicFieldOptions = useMemo((): Record<string, { value: string; label: string }[]> => {
    const drugOptions = getPrimaryDrugsOptions()
    return {
      ...fieldOptions,
      primary_drugs: drugOptions.length > 0
        ? drugOptions
        : [{ value: "no_drugs", label: "No drugs available" }],
      secondary_drugs: drugOptions.length > 0
        ? drugOptions
        : [{ value: "no_drugs", label: "No drugs available" }],
      regions: dynamicRegions.length > 0
        ? dynamicRegions
        : fieldOptions.regions,
      sponsor_collaborators: dynamicSponsors.length > 0
        ? dynamicSponsors
        : fieldOptions.sponsor_collaborators,
      line_of_therapy: dynamicLineOfTherapy.length > 0
        ? dynamicLineOfTherapy
        : fieldOptions.line_of_therapy,
      trial_status: dynamicStatuses.length > 0
        ? dynamicStatuses
        : fieldOptions.trial_status,
    }
  }, [getPrimaryDrugsOptions, dynamicRegions, dynamicSponsors, dynamicLineOfTherapy, dynamicStatuses])

  // Sync internal state with props when modal opens or currentSearchCriteria change
  useEffect(() => {
    if (open && currentSearchCriteria && currentSearchCriteria.length > 0) {
      setCriteria(currentSearchCriteria)
    } else if (open && (!currentSearchCriteria || currentSearchCriteria.length === 0)) {
      // Reset to empty if no criteria provided
      setCriteria([{
        id: "1",
        field: "",
        operator: "",
        value: "",
        logic: "AND",
      }])
    }
  }, [open, currentSearchCriteria])

  const addCriteria = () => {
    const newCriteria: ClinicalTrialSearchCriteria = {
      id: Date.now().toString(),
      field: "",
      operator: "",
      value: "",
      logic: "AND",
    }
    setCriteria((prev) => [...prev, newCriteria])
  }

  const removeCriteria = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id))
  }

  const updateCriteria = (id: string, field: keyof ClinicalTrialSearchCriteria, value: string) => {
    setCriteria((prev) => prev.map((c) => {
      if (c.id === id) {
        // If field changes, reset value and operator
        if (field === "field" && c.field !== value) {
          return { ...c, field: value, operator: "", value: "" }
        }
        return { ...c, [field]: value }
      }
      return c
    }))
  }

  const handleApply = () => {
    onApplySearch(criteria.filter((c) => c.field && c.value.trim() !== ""))
    onOpenChange(false)
  }

  const handleOpenSavedQueries = () => {
    if (onOpenSavedQueries) {
      onOpenChange(false); // Close advanced search modal
      onOpenSavedQueries(); // Open saved queries modal
    }
  }

  const handleSaveQuery = () => {
    setSaveQueryModalOpen(true)
  }

  // Get field type for determining input type
  const getFieldType = (fieldValue: string): string => {
    const field = searchFields.find(f => f.value === fieldValue)
    return field?.type || "text"
  }

  // Render value input based on field type
  const renderValueInput = (criterion: ClinicalTrialSearchCriteria) => {
    const fieldType = getFieldType(criterion.field)
    const options = dynamicFieldOptions[criterion.field]

    // Date field - show date picker with month/year dropdowns in calendar header
    if (fieldType === "date") {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal border border-gray-300 rounded-lg",
                !criterion.value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {criterion.value ? format(new Date(criterion.value), "MM-dd-yyyy") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={criterion.value ? new Date(criterion.value) : undefined}
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

    // Dropdown field - show select with options
    if (fieldType === "dropdown" && options) {
      // Use SearchableSelect for drug fields to provide search capability
      if (criterion.field === "primary_drugs" || criterion.field === "secondary_drugs") {
        return (
          <SearchableSelect
            value={criterion.value}
            onValueChange={(value) => updateCriteria(criterion.id, "value", value)}
            options={options}
            placeholder="Select drug"
            searchPlaceholder="Search drugs..."
            className="w-full"
          />
        )
      }

      return (
        <Select
          value={criterion.value}
          onValueChange={(value) => updateCriteria(criterion.id, "value", value)}
        >
          <SelectTrigger
            className="bg-white border border-gray-300 rounded-lg"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" style={{ fontFamily: "Poppins, sans-serif" }}>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Number field - show number input
    if (fieldType === "number") {
      return (
        <Input
          type="number"
          placeholder="Enter number"
          value={criterion.value || ""}
          onChange={(e) => updateCriteria(criterion.id, "value", e.target.value)}
          className="border border-gray-300 rounded-lg text-center"
          style={{ fontFamily: "Poppins, sans-serif" }}
        />
      )
    }

    // Default - text input
    return (
      <Input
        placeholder="Enter the search term"
        value={criterion.value || ""}
        onChange={(e) => updateCriteria(criterion.id, "value", e.target.value)}
        className="border border-gray-300 rounded-lg text-center"
        style={{ fontFamily: "Poppins, sans-serif" }}
      />
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl max-h-[85vh] p-0 rounded-lg overflow-hidden [&>button]:hidden flex flex-col"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {/* Header - Light Blue Background */}
          <DialogHeader
            className="px-6 py-4 border-b relative"
            style={{ backgroundColor: "#C3E9FB" }}
          >
            <div className="flex items-center justify-between">
              <DialogTitle
                className="text-lg font-semibold"
                style={{ fontFamily: "Poppins, sans-serif", color: "#204B73" }}
              >
                Advanced search
              </DialogTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-200"
                style={{ backgroundColor: "#204B73" }}
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </DialogHeader>

          {/* Search Criteria Rows */}
          <div className="p-6 space-y-4 flex-1 overflow-y-auto bg-white min-h-0">
            {criteria.map((criterion, index) => (
              <div key={criterion.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  {/* Field Dropdown */}
                  <div className="w-[230px]">
                    <SearchableSelect
                      options={searchFields}
                      value={criterion.field}
                      onValueChange={(value) => updateCriteria(criterion.id, "field", value)}
                      placeholder="Choose Field"
                      searchPlaceholder="Search field..."
                      className="bg-white border-gray-300 rounded-lg justify-start"
                    />
                  </div>

                  {/* Operator Dropdown - Teal Color #208B8B */}
                  <div className="w-[110px]">
                    <Select
                      value={criterion.operator}
                      onValueChange={(value) => updateCriteria(criterion.id, "operator", value)}
                      disabled={!criterion.field}
                    >
                      <SelectTrigger
                        className="text-white border-0 rounded-lg text-center justify-center disabled:opacity-50"
                        style={{ backgroundColor: "#208B8B", fontFamily: "Poppins, sans-serif" }}
                      >
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" style={{ fontFamily: "Poppins, sans-serif" }}>
                        {getOperatorsForField(criterion.field).map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search Term Input - Dynamic based on field type */}
                  <div className="flex-1">
                    {criterion.field ? (
                      renderValueInput(criterion)
                    ) : (
                      <Input
                        placeholder="Select a field first"
                        disabled
                        value=""
                        className="border border-gray-300 rounded-lg text-center"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      />
                    )}
                  </div>

                  {/* Boolean Dropdown - Orange #FFB547 */}
                  <div className="w-[100px]">
                    <Select
                      value={criterion.logic}
                      onValueChange={(value) => updateCriteria(criterion.id, "logic", value as "AND" | "OR")}
                    >
                      <SelectTrigger
                        className="text-white border-0 rounded-lg text-center justify-center"
                        style={{ backgroundColor: "#FFB547", fontFamily: "Poppins, sans-serif" }}
                      >
                        <SelectValue placeholder="Boolean" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" style={{ fontFamily: "Poppins, sans-serif" }}>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Plus/Minus Buttons */}
                  <div className="flex gap-1">
                    {/* Plus Button - Green #4FD09D */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCriteria}
                      className="border-0 h-8 w-8 p-0 rounded"
                      style={{ backgroundColor: "#4FD09D" }}
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </Button>
                    {/* Minus Button - Red/Coral #F67F77 */}
                    {criteria.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCriteria(criterion.id)}
                        className="border-0 h-8 w-8 p-0 rounded"
                        style={{ backgroundColor: "#F67F77" }}
                      >
                        <Minus className="h-4 w-4 text-white" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Divider line between rows */}
                {index < criteria.length - 1 && (
                  <div style={{ borderBottom: "1px solid #DFE1E7", marginTop: "16px" }}></div>
                )}
              </div>
            ))}
          </div>

          {/* Footer with Action Buttons */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          >
            {/* Open Saved Queries Button */}
            <Button
              variant="outline"
              onClick={handleOpenSavedQueries}
              className="border-0 rounded-lg px-4 py-2 flex items-center gap-2 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif", color: "white" }}
            >
              <FaBook className="h-4 w-4" />
              Open saved queries
            </Button>

            {/* Save This Query Button */}
            <Button
              variant="outline"
              onClick={handleSaveQuery}
              className="border-0 rounded-lg px-4 py-2 flex items-center gap-2 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif", color: "white" }}
            >
              <FaBookmark className="h-4 w-4" />
              Save this Query
            </Button>

            {/* Run Button */}
            <Button
              onClick={handleApply}
              className="border-0 rounded-lg px-6 py-2 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif", color: "white" }}
            >
              Run
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Query Modal */}
      <SaveQueryModal
        open={saveQueryModalOpen}
        onOpenChange={setSaveQueryModalOpen}
        currentFilters={{}}
        currentSearchCriteria={criteria}
        searchTerm=""
        editingQueryId={editingQueryId}
        editingQueryTitle={editingQueryTitle}
        editingQueryDescription={editingQueryDescription}
        storageKey={storageKey}
        queryType={queryType}
        sourceModal="advanced"
      />
    </>
  )
}

