
export interface SearchableSelectOption {
    value: string;
    label: string;
}

export const GLOBAL_STATUS_OPTIONS: SearchableSelectOption[] = [
    { value: "clinical_phase_1", label: "Clinical Phase I" },
    { value: "clinical_phase_2", label: "Clinical Phase II" },
    { value: "clinical_phase_3", label: "Clinical Phase III" },
    { value: "clinical_phase_4", label: "Clinical Phase IV" },
    { value: "discontinued", label: "Discontinued" },
    { value: "launched", label: "Launched" },
    { value: "no_development_reported", label: "No Development Reported" },
    { value: "preclinical", label: "Preclinical" },
];

export const DEVELOPMENT_STATUS_OPTIONS: SearchableSelectOption[] = [
    { value: "active_development", label: "Active development" },
    { value: "discontinued", label: "Discontinued" },
    { value: "marketed", label: "Marketed" },
];

export const DEVELOPMENT_STATUS_OPTIONS_DETAILED: SearchableSelectOption[] = [
    { value: "launched", label: "Launched" },
    { value: "no_development_reported", label: "No Development Reported" },
    { value: "discontinued", label: "Discontinued" },
    { value: "clinical_phase_1", label: "Clinical Phase I" },
    { value: "clinical_phase_2", label: "Clinical Phase II" },
    { value: "clinical_phase_3", label: "Clinical Phase III" },
    { value: "clinical_phase_4", label: "Clinical Phase IV" },
    { value: "preclinical", label: "Preclinical" },
];

export const ORIGINATOR_OPTIONS: SearchableSelectOption[] = [
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

export const THERAPEUTIC_AREA_OPTIONS: SearchableSelectOption[] = [
    { value: "oncology", label: "Oncology" },
    { value: "cardiology", label: "Cardiology" },
    { value: "neurology", label: "Neurology" },
    { value: "immunology", label: "Immunology" },
    { value: "endocrinology", label: "Endocrinology" },
];

export const DISEASE_TYPE_OPTIONS: SearchableSelectOption[] = [
    { value: "lung_cancer", label: "Lung Cancer" },
    { value: "breast_cancer", label: "Breast Cancer" },
    { value: "diabetes", label: "Diabetes" },
    { value: "hypertension", label: "Hypertension" },
    { value: "alzheimers", label: "Alzheimer's Disease" },
];

export const REGULATORY_DESIGNATIONS_OPTIONS: SearchableSelectOption[] = [
    { value: "breakthrough_therapy", label: "Breakthrough Therapy" },
    { value: "fast_track", label: "Fast Track" },
    { value: "orphan_drug", label: "Orphan Drug" },
    { value: "priority_review", label: "Priority Review" },
];

export const DRUG_RECORD_STATUS_OPTIONS: SearchableSelectOption[] = [
    { value: "development_in_progress", label: "Development In Progress (DIP)" },
    { value: "in_production", label: "In Production (IP)" },
    { value: "update_in_progress", label: "Update In Progress (UIP)" },
];

export const DRUG_TECHNOLOGY_OPTIONS: SearchableSelectOption[] = [
    { value: "proprietary", label: "Proprietary" },
    { value: "licensed", label: "Licensed" },
    { value: "partnership", label: "Partnership" },
    { value: "open_source", label: "Open Source" },
];

export const MECHANISM_OF_ACTION_OPTIONS: SearchableSelectOption[] = [
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

export const BIOLOGICAL_TARGET_OPTIONS: SearchableSelectOption[] = [
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

export const DELIVERY_ROUTE_OPTIONS: SearchableSelectOption[] = [
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

export const DELIVERY_MEDIUM_OPTIONS: SearchableSelectOption[] = [
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

export const THERAPEUTIC_CLASS_OPTIONS: SearchableSelectOption[] = [
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

export const COMPANY_OPTIONS: SearchableSelectOption[] = [
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

export const COMPANY_TYPE_OPTIONS: SearchableSelectOption[] = [
    { value: "originator", label: "Originator" },
    { value: "licensee", label: "Licensee" },
];

export const COUNTRY_OPTIONS: SearchableSelectOption[] = [
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

export const IS_APPROVED_OPTIONS: SearchableSelectOption[] = [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
];
