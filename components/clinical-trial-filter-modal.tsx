"use client"

import { formatDateToMMDDYYYY } from "@/lib/date-utils";
import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"
import { FaBookmark } from "react-icons/fa"
import { useDrugNames } from "@/hooks/use-drug-names"
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown"
import { SaveQueryModal } from "@/components/save-query-modal"

interface ClinicalTrialFilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyFilters: (filters: ClinicalTrialFilterState) => void
  currentFilters: ClinicalTrialFilterState
  editingQueryId?: string | null
  editingQueryTitle?: string
  editingQueryDescription?: string
  storageKey?: string
  queryType?: string
}

export interface ClinicalTrialFilterState {
  therapeuticAreas: string[]
  statuses: string[]
  diseaseTypes: string[]
  primaryDrugs: string[]
  otherDrugs: string[]
  trialPhases: string[]
  patientSegments: string[]
  lineOfTherapy: string[]
  countries: string[]
  sponsorsCollaborators: string[]
  sponsorFieldActivity: string[]
  associatedCro: string[]
  trialTags: string[]
  trialRecordStatus: string[]
  sex: string[]
  healthyVolunteers: string[]
  trialOutcome: string[]
  studyDesignKeywords: string[]
}

// Static filter options that match the add trial form
const staticFilterCategories = {
  therapeuticAreas: [
    "Autoimmune", "Cardiovascular", "Endocrinology", "Gastrointestinal", "Infectious",
    "Oncology", "Gastroenterology", "Dermatology", "Vaccines", "CNS/Neurology",
    "Ophthalmology", "Immunology", "Rheumatology", "Haematology", "Nephrology", "Urology"
  ],
  statuses: ["Planned", "Open", "Closed", "Completed", "Terminated"],
  diseaseTypes: [
    "Acute Lymphocytic Leukemia", "Acute Myelogenous Leukemia", "Anal", "Appendiceal",
    "Basal Skin Cell Carcinoma", "Bladder", "Breast", "Cervical", "Cholangiocarcinoma (Bile duct)",
    "Chronic Lymphocytic Leukemia", "Chronic Myelomonositic Leukemia", "Astrocytoma",
    "Brain Stem Glioma", "Craniopharyngioma", "Choroid Plexus Tumors", "Embryonal Tumors",
    "Epedymoma", "Germ Cell Tumors", "Glioblastoma", "Hemangioblastoma", "Medulloblastoma",
    "Meningioma", "Oligodendroglioma", "Pineal Tumor", "Pituitary Tumor", "Colorectal",
    "Endometrial", "Esophageal", "Fallopian Tube", "Gall Bladder", "Gastric", "GIST",
    "Head/Neck", "Hodgkin's Lymphoma", "Leukemia, Chronic Myelogenous", "Liver",
    "Lung Non-small cell", "Lung Small Cell", "Melanoma", "Mesothelioma", "Metastatic Cancer",
    "Multiple Myeloma", "Myelodysplastic Syndrome", "Myeloproliferative Neoplasms",
    "Neuroblastoma", "Neuroendocrine", "Non-Hodgkin's Lymphoma", "Osteosarcoma", "Ovarian",
    "Pancreas", "Penile", "Primary Peritoneal", "Prostate", "Renal", "Small Intestine",
    "Soft Tissue Carcinoma", "Solid Tumor, Unspecified", "Squamous Skin Cell Carcinoma",
    "Supportive care", "Tenosynovial Giant Cell Tumor", "Testicular", "Thymus", "Thyroid",
    "Unspecified Cancer", "Unspecified Haematological Cancer", "Vaginal", "Vulvar"
  ],
  trialPhases: ["Phase I", "Phase I/II", "Phase II", "Phase II/III", "Phase III", "Phase III/IV", "Phase IV"],
  patientSegments: [
    "HER2+ Breast Cancer",
    "HER2- Breast Cancer",
    "HR+ Breast Cancer (ER+ And/or PR+)",
    "Triple-negative Breast Cancer (TNBC)",
    "Early-stage Breast Cancer",
    "Locally Advanced Breast Cancer",
    "Metastatic Breast Cancer",
    "Recurrent Breast Cancer",
    "Advanced Breast Cancer (non-metastatic)",
    "Premenopausal Breast Cancer Patients",
    "Postmenopausal Breast Cancer Patients",
    "Breast Cancer (NOS)"
  ],
  lineOfTherapy: [
    "1 - First Line", "2 - Second Line", "Unknown", "2+ - At least second line",
    "3+ - At least third line", "Neo-Adjuvant", "Adjuvant", "Maintenance/Consolidation",
    "1+ - At least first line"
  ],
  countries: [
    "United States", "Canada", "United Kingdom", "Germany", "France", "Italy", "Spain",
    "Japan", "China", "India", "Australia", "Brazil", "Mexico", "South Korea",
    "Switzerland", "Netherlands", "Belgium", "Sweden", "Norway", "Denmark"
  ],
  sponsorsCollaborators: ["Pfizer", "Novartis", "AstraZeneca"],
  sponsorFieldActivity: ["Pharmaceutical Company", "University/Academy", "Investigator", "CRO", "Hospital"],
  associatedCro: ["IQVIA", "Syneos", "PPD"],
  trialTags: [
    "Biomarker-Efficacy", "Biomarker-Toxicity", "Expanded Access", "Expanded Indication",
    "First in Human", "Investigator-Initiated", "IO/Cytotoxic Combination", "IO/Hormonal Combination",
    "IO/IO Combination", "IO/Other Combination", "IO/Radiotherapy Combination", "IO/Targeted Combination",
    "Microdosing", "PGX-Biomarker Identification/Evaluation", "PGX-Pathogen",
    "PGX-Patient Preselection/Stratification", "Post-Marketing Commitment", "Registration"
  ],
  trialRecordStatus: ["Development In Progress (DIP)", "In Production (IP)", "Update In Progress (UIP)"],
  sex: ["Male", "Female", "Both", "Unknown"],
  healthyVolunteers: ["Yes", "No", "Unknown"],
  trialOutcome: [
    "Completed – Outcome Indeterminate",
    "Completed – Outcome Unknown",
    "Completed – Primary Endpoints Met",
    "Completed – Primary Endpoints Not Met",
    "Terminated - Business Decision, Other",
    "Terminated - Business Decision, Pipeline Reprioritization",
    "Terminated – Business Decision, Drug Strategy Shift",
    "Terminated – Insufficient Enrolment",
    "Terminated – Lack Of Efficacy",
    "Terminated – Lack Of Funding",
    "Terminated – Other",
    "Terminated – Planned But Never Initiated",
    "Terminated – Safety/adverse Effects",
    "Terminated – Unknown"
  ],
  studyDesignKeywords: [
    "Active control", "Cohort", "Cross over", "Double-Blinded", "Efficacy",
    "Interventional", "Multi-centre", "Non-Randomized", "Observational", "Open",
    "Parallel Assignment", "Pharmacodynamics", "Pharmacokinetics", "Placebo-control",
    "Prospective", "Randomized", "Safety", "Single group assignment", "Single-Blinded",
    "Tolerability", "Treatment"
  ]
}

export function ClinicalTrialFilterModal({
  open,
  onOpenChange,
  onApplyFilters,
  currentFilters,
  editingQueryId,
  editingQueryTitle,
  editingQueryDescription,
  storageKey = "unifiedSavedQueries",
  queryType = "dashboard"
}: ClinicalTrialFilterModalProps) {
  const [filters, setFilters] = useState<ClinicalTrialFilterState>(currentFilters)
  const [activeCategory, setActiveCategory] = useState<keyof ClinicalTrialFilterState>("trialPhases")
  const [saveQueryModalOpen, setSaveQueryModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { getPrimaryDrugsOptions, isLoading: isDrugsLoading } = useDrugNames()

  // Fetch countries dynamically from the dropdown management database
  const { options: dynamicCountries, loading: isCountriesLoading } = useDynamicDropdown({
    categoryName: 'country',
    fallbackOptions: staticFilterCategories.countries.map(c => ({ value: c, label: c }))
  })

  // Fetch trial status dynamically
  const { options: dynamicStatuses } = useDynamicDropdown({
    categoryName: 'trial_status',
    fallbackOptions: staticFilterCategories.statuses.map(s => ({ value: s, label: s }))
  })

  // Fetch sponsors dynamically from the dropdown management database
  const { options: dynamicSponsors, loading: isSponsorsLoading } = useDynamicDropdown({
    categoryName: 'sponsor_collaborators',
    fallbackOptions: []
  })

  // Fetch sponsor field activity dynamically
  const { options: dynamicSponsorFieldActivity, loading: isSponsorFieldActivityLoading } = useDynamicDropdown({
    categoryName: 'sponsor_field_activity',
    fallbackOptions: []
  })

  // Fetch associated CRO dynamically
  const { options: dynamicAssociatedCro, loading: isAssociatedCroLoading } = useDynamicDropdown({
    categoryName: 'associated_cro',
    fallbackOptions: []
  })

  // Fetch line of therapy dynamically
  const { options: dynamicLineOfTherapy, loading: isLineOfTherapyLoading } = useDynamicDropdown({
    categoryName: 'line_of_therapy',
    fallbackOptions: staticFilterCategories.lineOfTherapy.map(l => ({ value: l, label: l }))
  })

  // Build filter categories with dynamic drug and country data from API
  const filterCategories = useMemo(() => {
    const drugOptions = getPrimaryDrugsOptions()
    const drugLabels = drugOptions.map(drug => drug.label)
    const statusLabels = dynamicStatuses.length > 0 ? dynamicStatuses.map(s => s.label) : staticFilterCategories.statuses
    const countryLabels = dynamicCountries.map(country => country.label)
    const sponsorLabels = dynamicSponsors.map(sponsor => sponsor.label)
    const sponsorFieldActivityLabels = dynamicSponsorFieldActivity.map(item => item.label)
    const associatedCroLabels = dynamicAssociatedCro.map(cro => cro.label)
    const lineOfTherapyLabels = dynamicLineOfTherapy.map(item => item.label)

    return {
      ...staticFilterCategories,
      primaryDrugs: drugLabels.length > 0 ? drugLabels : ["No drugs available - add drugs in the drug module"],
      otherDrugs: drugLabels.length > 0 ? drugLabels : ["No drugs available - add drugs in the drug module"],
      statuses: statusLabels,
      countries: countryLabels.length > 0 ? countryLabels : staticFilterCategories.countries,
      sponsorsCollaborators: sponsorLabels.length > 0 ? sponsorLabels : [],
      sponsorFieldActivity: sponsorFieldActivityLabels.length > 0 ? sponsorFieldActivityLabels : [],
      associatedCro: associatedCroLabels.length > 0 ? associatedCroLabels : [],
      lineOfTherapy: lineOfTherapyLabels.length > 0 ? lineOfTherapyLabels : staticFilterCategories.lineOfTherapy,
    }
  }, [getPrimaryDrugsOptions, dynamicCountries, dynamicStatuses, dynamicSponsors, dynamicSponsorFieldActivity, dynamicAssociatedCro, dynamicLineOfTherapy])

  // Sync internal state with props when modal opens or currentFilters change
  useEffect(() => {
    if (open) {
      setFilters(currentFilters)
      setSearchTerm("")
    }
  }, [open, currentFilters])

  const handleSelectAll = (category: keyof ClinicalTrialFilterState) => {
    setFilters((prev) => ({
      ...prev,
      [category]: filterCategories[category],
    }))
  }

  const handleDeselectAll = (category: keyof ClinicalTrialFilterState) => {
    setFilters((prev) => ({
      ...prev,
      [category]: [],
    }))
  }

  const handleToggleSelectAll = (category: keyof ClinicalTrialFilterState) => {
    if (filters[category].length === filterCategories[category].length) {
      handleDeselectAll(category)
    } else {
      handleSelectAll(category)
    }
  }

  const handleItemToggle = (category: keyof ClinicalTrialFilterState, item: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(item)
        ? prev[category].filter((i) => i !== item)
        : [...prev[category], item],
    }))
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onOpenChange(false)
  }

  const handleSaveQuery = () => {
    setSaveQueryModalOpen(true)
  }

  const categoryLabels: Record<keyof ClinicalTrialFilterState, string> = {
    therapeuticAreas: "Therapeutic Area",
    statuses: "Status",
    diseaseTypes: "Disease Type",
    patientSegments: "Patient Segment",
    lineOfTherapy: "Line of Therapy",
    primaryDrugs: "Primary Drug",
    otherDrugs: "Other Drugs",
    trialPhases: "Trial Phase",
    countries: "Countries",
    sponsorsCollaborators: "Sponsors & Collaborators",
    sponsorFieldActivity: "Sponsor Field of Activity",
    associatedCro: "Associated CRO",
    trialTags: "Trial Tags",
    trialRecordStatus: "Trial Record Status",
    sex: "Sex",
    healthyVolunteers: "Healthy Volunteers",
    trialOutcome: "Trial Outcome",
    studyDesignKeywords: "Study Design Keywords"
  }

  // Order of categories as shown in the image
  const categoryOrder: (keyof ClinicalTrialFilterState)[] = [
    "therapeuticAreas",
    "statuses",
    "diseaseTypes",
    "patientSegments",
    "lineOfTherapy",
    "primaryDrugs",
    "otherDrugs",
    "trialPhases",
    "countries",
    "sponsorsCollaborators",
    "sponsorFieldActivity",
    "associatedCro",
    "trialTags",
    "trialRecordStatus",
    "sex",
    "healthyVolunteers",
    "trialOutcome",
    "studyDesignKeywords"
  ]

  const filteredItems = filterCategories[activeCategory].filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] p-0 rounded-lg overflow-hidden [&>button]:hidden"
          style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px" }}
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
                Filters
              </DialogTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 rounded-full p-1 hover:opacity-80"
                style={{ backgroundColor: "#204B73" }}
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </DialogHeader>

          <div className="flex h-[370px]"
            style={{ marginTop: "-15px", marginBottom: "-10px" }}>
            {/* Left sidebar with filter categories */}
            <div
              className="w-56 p-4 overflow-y-auto"
              style={{ borderRight: "3px solid #204B73" }}
            >
              <div className="space-y-1">
                {categoryOrder.map((category) => {
                  const selectedCount = filters[category].length;
                  const isActive = activeCategory === category;
                  const hasSelection = selectedCount > 0;

                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setActiveCategory(category);
                        setSearchTerm("");
                      }}
                      className={`w-full text-left px-3 py-1.5 transition-colors rounded-md flex items-center justify-between ${isActive
                        ? "bg-[#204B73] text-white font-medium"
                        : hasSelection
                          ? "bg-[#E3F2FD] text-[#204B73] font-medium border border-[#204B73]"
                          : "text-gray-700 hover:bg-gray-100"
                        }`}
                      style={{ fontFamily: "Poppins, sans-serif", fontSize: "11px" }}
                    >
                      <span>{categoryLabels[category]}</span>
                      {hasSelection && (
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-semibold ${isActive
                            ? "bg-white text-[#204B73]"
                            : "bg-[#204B73] text-white"
                            }`}
                        >
                          {selectedCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right content area */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="text"
                  placeholder={`Search ${categoryLabels[activeCategory]}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#204B73]"
                />
              </div>

              {/* Select All/Deselect All Header */}
              <div
                className="flex items-center gap-3 p-3 rounded-lg mb-4"
                style={{ backgroundColor: "#204B73" }}
              >
                <Checkbox
                  id="select-all"
                  checked={filters[activeCategory].length === filterCategories[activeCategory].length}
                  onCheckedChange={() => handleToggleSelectAll(activeCategory)}
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#204B73]"
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium text-white cursor-pointer"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Select All/Deselect All
                </label>
              </div>

              {/* Filter Options */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {filteredItems.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Checkbox
                      id={`${activeCategory}-${item}`}
                      checked={filters[activeCategory].includes(item)}
                      onCheckedChange={() => handleItemToggle(activeCategory, item)}
                      className="border-gray-400"
                    />
                    <label
                      htmlFor={`${activeCategory}-${item}`}
                      className="cursor-pointer"
                      style={{ fontFamily: "Poppins, sans-serif", color: "#333", fontSize: "11px" }}
                    >
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer with Action Buttons */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-2 border-t"
          >
            <Button
              variant="outline"
              onClick={handleSaveQuery}
              className="border-0 rounded-lg px-4 py-2 flex items-center gap-2 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif", color: "white" }}
            >
              <FaBookmark className="h-4 w-4" />
              Save this Query
            </Button>
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
        currentFilters={filters as unknown as Record<string, string[]>}
        currentSearchCriteria={[]}
        searchTerm=""
        editingQueryId={editingQueryId}
        editingQueryTitle={editingQueryTitle}
        editingQueryDescription={editingQueryDescription}
        storageKey={storageKey}
        queryType={queryType}
        sourceModal="filter"
      />
    </>
  )
}
