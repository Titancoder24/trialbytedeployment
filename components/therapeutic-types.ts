export interface SearchableSelectOption {
    value: string
    label: string
}

export interface TherapeuticFilterState {
    // Core filter fields (to match user clinical trial filter)
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
    regions: string[]
    trialRecordStatus: string[]
    // Allow dynamic access for other fields used in filter mapping
    [key: string]: string[]
}

// Default empty filter state
export const DEFAULT_THERAPEUTIC_FILTERS: TherapeuticFilterState = {
    therapeuticAreas: [],
    statuses: [],
    diseaseTypes: [],
    primaryDrugs: [],
    otherDrugs: [],
    trialPhases: [],
    patientSegments: [],
    lineOfTherapy: [],
    countries: [],
    sponsorsCollaborators: [],
    sponsorFieldActivity: [],
    associatedCro: [],
    trialTags: [],
    regions: [],
    trialRecordStatus: [],
}

export interface TherapeuticSearchCriteria {
    id: string
    field: string
    operator: string
    value: string | string[] // Support both single string and array of strings
    logic: "AND" | "OR"
}
