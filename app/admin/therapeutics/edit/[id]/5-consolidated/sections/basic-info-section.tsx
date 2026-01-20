"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { MultiSelectSearchable } from "@/components/ui/multi-select-searchable";
import { Plus, X } from "lucide-react";
import { useEditTherapeuticForm } from "../../../context/edit-form-context";
import { Textarea } from "@/components/ui/textarea";
import { useDrugNames } from "@/hooks/use-drug-names";
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown";

export default function BasicInfoSection() {
  const {
    formData,
    updateField,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
  } = useEditTherapeuticForm();
  const { getPrimaryDrugsOptions } = useDrugNames();
  const form = formData.step5_1;

  console.log("BasicInfoSection (Edit) - Current form data:", form);

  // Helper functions for hierarchical dropdowns
  const getDiseaseTypeOptions = (): SearchableSelectOption[] => {
    const therapeuticAreas = Array.isArray(form.therapeutic_area) ? form.therapeutic_area : (form.therapeutic_area ? [form.therapeutic_area] : []);
    if (therapeuticAreas.length === 0) {
      return diseaseTypeOptions; // Return all options if no therapeutic area selected
    }

    // For multiple therapeutic areas, return all disease types
    return diseaseTypeOptions;
  };

  const getPatientSegmentOptions = (): SearchableSelectOption[] => {
    // Get current disease type value(s)
    const diseaseType = form.disease_type;
    const diseaseTypeArray = Array.isArray(diseaseType) ? diseaseType : (diseaseType ? [diseaseType] : []);
    
    // Check if "breast" is selected (case-insensitive)
    const isBreastSelected = diseaseTypeArray.some(dt => 
      dt && typeof dt === 'string' && dt.toLowerCase().includes('breast')
    );

    // Options to exclude when breast is selected
    const optionsToExclude = ['children', 'adults', 'healthy_volunteers', 'unknown', 'first_line', 'second_line', 'adjuvant'];
    
    if (isBreastSelected) {
      // Filter out the excluded options when breast is selected
      return patientSegmentOptions.filter(option => !optionsToExclude.includes(option.value));
    }

    // Return all options if breast is not selected
    return patientSegmentOptions;
  };

  // Handle therapeutic area change
  const handleTherapeuticAreaChange = (value: string[]) => {
    console.log("Therapeutic area changed to:", value);
    updateField("step5_1", "therapeutic_area", value);
    // Clear dependent fields when therapeutic area changes
    updateField("step5_1", "disease_type", []);
    updateField("step5_1", "patient_segment", []);
  };

  // Handle disease type change
  const handleDiseaseTypeChange = (value: string[]) => {
    console.log("Disease type changed to:", value);
    updateField("step5_1", "disease_type", value);
    // Clear patient segment when disease type changes
    updateField("step5_1", "patient_segment", []);
  };

  // Filter out excluded patient segment options when breast is selected
  useEffect(() => {
    const diseaseType = form.disease_type;
    const diseaseTypeArray = Array.isArray(diseaseType) ? diseaseType : (diseaseType ? [diseaseType] : []);
    const isBreastSelected = diseaseTypeArray.some(dt => 
      dt && typeof dt === 'string' && dt.toLowerCase().includes('breast')
    );

    if (isBreastSelected) {
      const optionsToExclude = ['children', 'adults', 'healthy_volunteers', 'unknown', 'first_line', 'second_line', 'adjuvant'];
      const currentPatientSegment = form.patient_segment;
      const patientSegmentArray = Array.isArray(currentPatientSegment) ? currentPatientSegment : (currentPatientSegment ? [currentPatientSegment] : []);
      
      // Filter out excluded options from current selection
      const filteredPatientSegment = patientSegmentArray.filter(ps => 
        ps && !optionsToExclude.includes(ps)
      );

      // Update if any excluded options were removed
      if (filteredPatientSegment.length !== patientSegmentArray.length) {
        updateField("step5_1", "patient_segment", filteredPatientSegment.length > 0 ? filteredPatientSegment : []);
      }
    }
  }, [form.disease_type, form.patient_segment, updateField]);

  // Hierarchical data structure for cascading dropdowns
  const hierarchicalData = {
    oncology: {
      diseaseTypes: [
        { value: "breast", label: "Breast" },
        { value: "lung_non_small_cell", label: "Lung Non-small cell" },
        { value: "lung_small_cell", label: "Lung Small Cell" },
        { value: "colorectal", label: "Colorectal" },
        { value: "prostate", label: "Prostate" },
        { value: "ovarian", label: "Ovarian" },
        { value: "pancreas", label: "Pancreas" },
        { value: "liver", label: "Liver" },
        { value: "gastric", label: "Gastric" },
        { value: "bladder", label: "Bladder" },
        { value: "renal", label: "Renal" },
        { value: "melanoma", label: "Melanoma" },
        { value: "cervical", label: "Cervical" },
        { value: "endometrial", label: "Endometrial" },
        { value: "head_neck", label: "Head/Neck" },
        { value: "thyroid", label: "Thyroid" },
        { value: "brain_tumors", label: "Brain Tumors" },
        { value: "leukemia", label: "Leukemia" },
        { value: "lymphoma", label: "Lymphoma" },
        { value: "multiple_myeloma", label: "Multiple Myeloma" },
      ],
      patientSegments: {
        breast: [
          { value: "early_stage", label: "Early Stage" },
          { value: "locally_advanced", label: "Locally Advanced" },
          { value: "metastatic", label: "Metastatic" },
          { value: "triple_negative", label: "Triple Negative" },
          { value: "her2_positive", label: "HER2 Positive" },
          { value: "hormone_receptor_positive", label: "Hormone Receptor Positive" },
        ],
        lung_non_small_cell: [
          { value: "stage_i", label: "Stage I" },
          { value: "stage_ii", label: "Stage II" },
          { value: "stage_iii", label: "Stage III" },
          { value: "stage_iv", label: "Stage IV" },
          { value: "squamous", label: "Squamous" },
          { value: "adenocarcinoma", label: "Adenocarcinoma" },
        ],
        colorectal: [
          { value: "stage_i", label: "Stage I" },
          { value: "stage_ii", label: "Stage II" },
          { value: "stage_iii", label: "Stage III" },
          { value: "stage_iv", label: "Stage IV" },
          { value: "msi_high", label: "MSI-High" },
          { value: "msi_stable", label: "MSI-Stable" },
        ],
        prostate: [
          { value: "localized", label: "Localized" },
          { value: "locally_advanced", label: "Locally Advanced" },
          { value: "metastatic", label: "Metastatic" },
          { value: "castration_sensitive", label: "Castration Sensitive" },
          { value: "castration_resistant", label: "Castration Resistant" },
        ],
        ovarian: [
          { value: "stage_i", label: "Stage I" },
          { value: "stage_ii", label: "Stage II" },
          { value: "stage_iii", label: "Stage III" },
          { value: "stage_iv", label: "Stage IV" },
          { value: "platinum_sensitive", label: "Platinum Sensitive" },
          { value: "platinum_resistant", label: "Platinum Resistant" },
        ],
        // Default oncology segments
        default: [
          { value: "early_stage", label: "Early Stage" },
          { value: "locally_advanced", label: "Locally Advanced" },
          { value: "metastatic", label: "Metastatic" },
          { value: "first_line", label: "First Line" },
          { value: "second_line", label: "Second Line" },
          { value: "adjuvant", label: "Adjuvant" },
        ],
      },
    },
    cardiovascular: {
      diseaseTypes: [
        { value: "heart_failure", label: "Heart Failure" },
        { value: "coronary_artery_disease", label: "Coronary Artery Disease" },
        { value: "hypertension", label: "Hypertension" },
        { value: "atrial_fibrillation", label: "Atrial Fibrillation" },
        { value: "stroke", label: "Stroke" },
        { value: "peripheral_artery_disease", label: "Peripheral Artery Disease" },
      ],
      patientSegments: {
        heart_failure: [
          { value: "hfref", label: "HFrEF (Reduced Ejection Fraction)" },
          { value: "hfpef", label: "HFpEF (Preserved Ejection Fraction)" },
          { value: "acute_decompensated", label: "Acute Decompensated" },
          { value: "chronic_stable", label: "Chronic Stable" },
        ],
        coronary_artery_disease: [
          { value: "stable_angina", label: "Stable Angina" },
          { value: "unstable_angina", label: "Unstable Angina" },
          { value: "mi", label: "Myocardial Infarction" },
          { value: "post_pci", label: "Post-PCI" },
        ],
        default: [
          { value: "mild", label: "Mild" },
          { value: "moderate", label: "Moderate" },
          { value: "severe", label: "Severe" },
          { value: "acute", label: "Acute" },
          { value: "chronic", label: "Chronic" },
        ],
      },
    },
    autoimmune: {
      diseaseTypes: [
        { value: "rheumatoid_arthritis", label: "Rheumatoid Arthritis" },
        { value: "lupus", label: "Systemic Lupus Erythematosus" },
        { value: "crohns", label: "Crohn's Disease" },
        { value: "ulcerative_colitis", label: "Ulcerative Colitis" },
        { value: "psoriasis", label: "Psoriasis" },
        { value: "multiple_sclerosis", label: "Multiple Sclerosis" },
      ],
      patientSegments: {
        rheumatoid_arthritis: [
          { value: "early_ra", label: "Early RA" },
          { value: "established_ra", label: "Established RA" },
          { value: "seropositive", label: "Seropositive" },
          { value: "seronegative", label: "Seronegative" },
        ],
        lupus: [
          { value: "mild_moderate", label: "Mild-Moderate" },
          { value: "severe", label: "Severe" },
          { value: "lupus_nephritis", label: "Lupus Nephritis" },
          { value: "cutaneous_lupus", label: "Cutaneous Lupus" },
        ],
        default: [
          { value: "mild", label: "Mild" },
          { value: "moderate", label: "Moderate" },
          { value: "severe", label: "Severe" },
          { value: "refractory", label: "Refractory" },
        ],
      },
    },
    // Add more therapeutic areas as needed
  };

  // Dynamic dropdown options
  const { options: therapeuticAreaOptions } = useDynamicDropdown({
    categoryName: 'therapeutic_area',
    fallbackOptions: [
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
      { value: "urology", label: "Urology" },
    ]
  });

  const { options: trialPhaseOptions } = useDynamicDropdown({
    categoryName: 'trial_phase',
    fallbackOptions: [
      { value: "phase_i", label: "Phase I" },
      { value: "phase_i_ii", label: "Phase I/II" },
      { value: "phase_ii", label: "Phase II" },
      { value: "phase_ii_iii", label: "Phase II/III" },
      { value: "phase_iii", label: "Phase III" },
      { value: "phase_iii_iv", label: "Phase III/IV" },
      { value: "phase_iv", label: "Phase IV" },
    ]
  });

  const { options: statusOptions } = useDynamicDropdown({
    categoryName: 'trial_status',
    fallbackOptions: [
      { value: "planned", label: "Planned" },
      { value: "open", label: "Open" },
      { value: "closed", label: "Closed" },
      { value: "completed", label: "Completed" },
      { value: "terminated", label: "Terminated" },
    ]
  });

  const primaryDrugsOptions: SearchableSelectOption[] = [
    ...getPrimaryDrugsOptions().map(drug => ({
      value: drug.value,
      label: drug.label
    }))
  ];

  const otherDrugsOptions: SearchableSelectOption[] = [
    ...getPrimaryDrugsOptions().map(drug => ({
      value: drug.value,
      label: drug.label
    }))
  ];

  const { options: diseaseTypeOptions } = useDynamicDropdown({
    categoryName: 'disease_type',
    fallbackOptions: [
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
      { value: "vulvar", label: "Vulvar" },
    ]
  });

  const { options: patientSegmentOptions } = useDynamicDropdown({
    categoryName: 'patient_segment',
    fallbackOptions: [
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
      { value: "breast_cancer_nos", label: "Breast Cancer (NOS)" },
    ]
  });

  const { options: lineOfTherapyOptions } = useDynamicDropdown({
    categoryName: 'line_of_therapy',
    fallbackOptions: [
      { value: "second_line", label: "2 – Second Line" },
      { value: "unknown", label: "Unknown" },
      { value: "first_line", label: "1 – First Line" },
      { value: "at_least_second_line", label: "2+ - At least second line" },
      { value: "at_least_third_line", label: "3+ - At least third line" },
      { value: "neo_adjuvant", label: "Neo-Adjuvant" },
      { value: "adjuvant", label: "Adjuvant" },
      { value: "maintenance_consolidation", label: "Maintenance/Consolidation" },
      { value: "at_least_first_line", label: "1+ - At least first line" },
    ]
  });

  const { options: trialTagsOptions } = useDynamicDropdown({
    categoryName: 'trial_tags',
    fallbackOptions: [
      { value: "biomarker_efficacy", label: "Biomarker-Efficacy" },
      { value: "biomarker_toxicity", label: "Biomarker-Toxicity" },
      { value: "expanded_access", label: "Expanded Access" },
      { value: "expanded_indication", label: "Expanded Indication" },
      { value: "first_in_human", label: "First in Human" },
      { value: "investigator_initiated", label: "Investigator-Initiated" },
      { value: "io_cytotoxic_combination", label: "IO/Cytotoxic Combination" },
      { value: "io_hormonal_combination", label: "IO/Hormonal Combination" },
      { value: "io_io_combination", label: "IO/IO Combination" },
      { value: "io_other_combination", label: "IO/Other Combination" },
      { value: "io_radiotherapy_combination", label: "IO/Radiotherapy Combination" },
      { value: "io_targeted_combination", label: "IO/Targeted Combination" },
      { value: "microdosing", label: "Microdosing" },
      { value: "pgx_biomarker_identification", label: "PGX-Biomarker Identification/Evaluation" },
      { value: "pgx_pathogen", label: "PGX-Pathogen" },
      { value: "pgx_patient_preselection", label: "PGX-Patient Preselection/Stratification" },
      { value: "post_marketing_commitment", label: "Post-Marketing Commitment" },
      { value: "registration", label: "Registration" },
    ]
  });

  const { options: sponsorOptions } = useDynamicDropdown({
    categoryName: 'sponsor_collaborators',
    fallbackOptions: [
      { value: "Pfizer", label: "Pfizer" },
      { value: "Novartis", label: "Novartis" },
      { value: "AstraZeneca", label: "AstraZeneca" },
    ]
  });

  const { options: sponsorFieldOptions } = useDynamicDropdown({
    categoryName: 'sponsor_field_activity',
    fallbackOptions: [
      { value: "pharmaceutical_company", label: "Pharmaceutical Company" },
      { value: "university_academy", label: "University/Academy" },
      { value: "investigator", label: "Investigator" },
      { value: "cro", label: "CRO" },
      { value: "hospital", label: "Hospital" },
    ]
  });

  const { options: croOptions } = useDynamicDropdown({
    categoryName: 'associated_cro',
    fallbackOptions: [
      { value: "IQVIA", label: "IQVIA" },
      { value: "Syneos", label: "Syneos" },
      { value: "PPD", label: "PPD" },
    ]
  });

  const { options: countriesOptions } = useDynamicDropdown({
    categoryName: 'country',
    fallbackOptions: [
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
    ]
  });

  const { options: regionOptions } = useDynamicDropdown({
    categoryName: 'region',
    fallbackOptions: [
      { value: "north_america", label: "North America" },
      { value: "europe", label: "Europe" },
      { value: "asia_pacific", label: "Asia Pacific" },
      { value: "latin_america", label: "Latin America" },
      { value: "africa", label: "Africa" },
      { value: "middle_east", label: "Middle East" },
    ]
  });

  const { options: trialRecordStatusOptions } = useDynamicDropdown({
    categoryName: 'trial_record_status',
    fallbackOptions: [
      { value: "development_in_progress", label: "Development In Progress (DIP)" },
      { value: "in_production", label: "In Production (IP)" },
      { value: "update_in_progress", label: "Update In Progress (UIP)" },
    ]
  });

  // Helpers for multi-input fields
  const addTrialIdentifierField = () => addArrayItem("step5_1", "trial_identifier", "");
  const removeTrialIdentifier = (index: number) => {
    if (index === 0) return;
    removeArrayItem("step5_1", "trial_identifier", index);
  };
  const updateTrialIdentifier = (index: number, value: string) => {
    if (index === 0) return;
    updateArrayItem("step5_1", "trial_identifier", index, value);
  };

  const addReferenceLinkField = () => addArrayItem("step5_1", "reference_links", "");
  const removeReferenceLink = (index: number) => removeArrayItem("step5_1", "reference_links", index);
  const updateReferenceLink = (index: number, value: string) => updateArrayItem("step5_1", "reference_links", index, value);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Trial Overview</h3>

      {/* Row 1: therapeutic area / trial identifier / phase */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Therapeutic Area</Label>
          <MultiSelectSearchable
            options={therapeuticAreaOptions}
            value={Array.isArray(form.therapeutic_area) ? form.therapeutic_area : (form.therapeutic_area ? [form.therapeutic_area] : [])}
            onValueChange={handleTherapeuticAreaChange}
            placeholder="Select Therapeutic Area"
            searchPlaceholder="Search therapeutic areas..."
            emptyMessage="No therapeutic area found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Trial Identifier</Label>
          <div className="space-y-2">
            {form.trial_identifier.length > 0 ? (
              form.trial_identifier.map((val, idx) => {
                const isPrimaryIdentifier = idx === 0;
                return (
                  <div key={idx} className="flex gap-2">
                    {isPrimaryIdentifier ? (
                      <Input
                        value={val}
                        readOnly
                        placeholder="Auto-generated (e.g., TB-000171)"
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 h-10 bg-gray-100 cursor-not-allowed"
                      />
                    ) : (
                      <Textarea
                        value={val}
                        onChange={(e) => updateTrialIdentifier(idx, e.target.value)}
                        placeholder="Additional identifier"
                        rows={1}
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 min-h-[32px] h-10"
                      />
                    )}
                    {isPrimaryIdentifier ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTrialIdentifierField}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeTrialIdentifier(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex gap-2">
                <Textarea
                  value=""
                  placeholder="Auto-generated (e.g., TB-000171)"
                  rows={1}
                  disabled={true}
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 min-h-[32px] h-10 bg-gray-100 cursor-not-allowed"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTrialIdentifierField}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Trial Phase</Label>
          <SearchableSelect
            options={trialPhaseOptions}
            value={form.trial_phase}
            onValueChange={(v) => updateField("step5_1", "trial_phase", v)}
            placeholder="Select Phase"
            searchPlaceholder="Search trial phases..."
            emptyMessage="No trial phase found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
      </div>

      {/* Row 2: status / primary drugs / other drugs */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Status</Label>
          <SearchableSelect
            options={statusOptions}
            value={form.status}
            onValueChange={(v) => updateField("step5_1", "status", v)}
            placeholder="Select status"
            searchPlaceholder="Search status..."
            emptyMessage="No status found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Primary Drugs</Label>
          <MultiSelectSearchable
            options={primaryDrugsOptions}
            value={Array.isArray(form.primary_drugs) ? form.primary_drugs : (form.primary_drugs ? [form.primary_drugs] : [])}
            onValueChange={(v) => updateField("step5_1", "primary_drugs", v)}
            placeholder="Select primary drug"
            searchPlaceholder="Search primary drugs..."
            emptyMessage="No primary drug found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Other Drugs</Label>
          <MultiSelectSearchable
            options={otherDrugsOptions}
            value={Array.isArray(form.other_drugs) ? form.other_drugs : (form.other_drugs ? [form.other_drugs] : [])}
            onValueChange={(v) => updateField("step5_1", "other_drugs", v)}
            placeholder="Select other drug"
            searchPlaceholder="Search other drugs..."
            emptyMessage="No other drug found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label>Title</Label>
        <Textarea
          value={form.title}
          onChange={(e) => updateField("step5_1", "title", e.target.value)}
          className="resize-y min-h-[40px] border-gray-600 focus:border-gray-800 focus:ring-gray-800"
        />
      </div>

      {/* Row 3: disease type / patient segment / line of therapy */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Disease Type</Label>
          <MultiSelectSearchable
            options={getDiseaseTypeOptions()}
            value={Array.isArray(form.disease_type) ? form.disease_type : (form.disease_type ? [form.disease_type] : [])}
            onValueChange={handleDiseaseTypeChange}
            placeholder="Select disease type"
            searchPlaceholder="Search disease types..."
            emptyMessage="No disease type found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Patient Segment</Label>
          <MultiSelectSearchable
            options={getPatientSegmentOptions()}
            value={Array.isArray(form.patient_segment) ? form.patient_segment : (form.patient_segment ? [form.patient_segment] : [])}
            onValueChange={(v) => updateField("step5_1", "patient_segment", v)}
            placeholder="Select segment"
            searchPlaceholder="Search patient segments..."
            emptyMessage="No patient segment found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Line Of Therapy</Label>
          <MultiSelectSearchable
            options={lineOfTherapyOptions}
            value={Array.isArray(form.line_of_therapy) ? form.line_of_therapy : (form.line_of_therapy ? [form.line_of_therapy] : [])}
            onValueChange={(v) => updateField("step5_1", "line_of_therapy", v)}
            placeholder="Select line of therapy"
            searchPlaceholder="Search lines of therapy..."
            emptyMessage="No line of therapy found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
      </div>

      {/* Row 4: reference links / trial tags */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label>Reference Links</Label>
          <div className="space-y-2">
            {(form.reference_links.length > 0 ? form.reference_links : [""]).map((val, idx) => (
              <div key={idx} className="flex gap-2">
                <Textarea
                  value={val}
                  onChange={(e) => {
                    if (form.reference_links.length === 0) {
                      addArrayItem("step5_1", "reference_links", e.target.value);
                    } else {
                      updateReferenceLink(idx, e.target.value);
                    }
                  }}
                  placeholder="https://..."
                  rows={1}
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 min-h-[32px] h-10"
                />
                {idx === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (form.reference_links.length === 0) {
                        addArrayItem("step5_1", "reference_links", "");
                      } else {
                        addReferenceLinkField();
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeReferenceLink(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Trial Tags</Label>
          <MultiSelectSearchable
            options={trialTagsOptions}
            value={Array.isArray(form.trial_tags) ? form.trial_tags : (form.trial_tags ? [form.trial_tags] : [])}
            onValueChange={(v) => updateField("step5_1", "trial_tags", v)}
            placeholder="Select trial tags"
            searchPlaceholder="Search trial tags..."
            emptyMessage="No trial tag found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
      </div>

      {/* Row 5: sponsor fields */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Sponsor & Collaborators</Label>
          <MultiSelectSearchable
            options={sponsorOptions}
            value={Array.isArray(form.sponsor_collaborators) ? form.sponsor_collaborators : (form.sponsor_collaborators ? [form.sponsor_collaborators] : [])}
            onValueChange={(v) => updateField("step5_1", "sponsor_collaborators", v)}
            placeholder="Select sponsor"
            searchPlaceholder="Search sponsors..."
            emptyMessage="No sponsor found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Sponsor Field of Activity</Label>
          <MultiSelectSearchable
            options={sponsorFieldOptions}
            value={Array.isArray(form.sponsor_field_activity) ? form.sponsor_field_activity : (form.sponsor_field_activity ? [form.sponsor_field_activity] : [])}
            onValueChange={(v) => updateField("step5_1", "sponsor_field_activity", v)}
            placeholder="Select field"
            searchPlaceholder="Search sponsor fields..."
            emptyMessage="No sponsor field found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Associated CRO</Label>
          <MultiSelectSearchable
            options={croOptions}
            value={Array.isArray(form.associated_cro) ? form.associated_cro : (form.associated_cro ? [form.associated_cro] : [])}
            onValueChange={(v) => updateField("step5_1", "associated_cro", v)}
            placeholder="Select CROs"
            searchPlaceholder="Search CROs..."
            emptyMessage="No CRO found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
      </div>

      {/* Row 6: countries / region / record status */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Countries</Label>
          <MultiSelectSearchable
            options={countriesOptions}
            value={Array.isArray(form.countries) ? form.countries : (form.countries ? [form.countries] : [])}
            onValueChange={(v) => updateField("step5_1", "countries", v)}
            placeholder="Select countries"
            searchPlaceholder="Search countries..."
            emptyMessage="No country found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Region</Label>
          <MultiSelectSearchable
            options={regionOptions}
            value={Array.isArray(form.region) ? form.region : (form.region ? [form.region] : [])}
            onValueChange={(v) => updateField("step5_1", "region", v)}
            placeholder="Select region"
            searchPlaceholder="Search regions..."
            emptyMessage="No region found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Trial Record Status</Label>
          <SearchableSelect
            options={trialRecordStatusOptions}
            value={form.trial_record_status}
            onValueChange={(v) => updateField("step5_1", "trial_record_status", v)}
            placeholder="Select status"
            searchPlaceholder="Search trial record status..."
            emptyMessage="No trial record status found."
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
      </div>
    </div>
  );
}
