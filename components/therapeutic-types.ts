export interface SearchableSelectOption {
    value: string
    label: string
}

export interface TherapeuticFilterState {
    // Basic Info Section
    therapeuticAreas: string[]
    statuses: string[]
    diseaseTypes: string[]
    primaryDrugs: string[]
    trialPhases: string[]
    patientSegments: string[]
    lineOfTherapy: string[]
    countries: string[]
    sponsorsCollaborators: string[]
    sponsorFieldActivity: string[]
    associatedCro: string[]
    trialTags: string[]
    otherDrugs: string[]
    regions: string[]
    trialRecordStatus: string[]

    // Eligibility Section
    inclusionCriteria: string[]
    exclusionCriteria: string[]
    ageFrom: string[]
    ageTo: string[]
    ageMin: string[]
    ageMax: string[]
    subjectType: string[]
    sex: string[]
    gender: string[]
    healthyVolunteers: string[]
    targetNoVolunteers: string[]
    actualEnrolledVolunteers: string[]
    ecogPerformanceStatus: string[]
    priorTreatments: string[]
    biomarkerRequirements: string[]

    // Enrollment Section
    estimatedEnrollment: string[]
    actualEnrollment: string[]
    enrollmentStatus: string[]
    recruitmentPeriod: string[]

    // Study Design Section
    purposeOfTrial: string[]
    summary: string[]
    primaryOutcomeMeasures: string[]
    otherOutcomeMeasures: string[]
    studyDesignKeywords: string[]
    studyDesign: string[]
    treatmentRegimen: string[]
    numberOfArms: string[]

    // Timing Section
    startDateEstimated: string[]
    trialEndDateEstimated: string[]
    studyCompletionDate: string[]
    primaryCompletionDate: string[]
    studyStartDate: string[]
    studyEndDate: string[]
    firstPatientIn: string[]
    lastPatientIn: string[]
    interimAnalysisDates: string[]
    finalAnalysisDate: string[]
    regulatorySubmissionDate: string[]

    // Results Section
    resultsAvailable: string[]
    endpointsMet: string[]
    adverseEventsReported: string[]
    trialOutcome: string[]
    trialOutcomeContent: string[]
    adverseEventReported: string[]
    adverseEventType: string[]
    treatmentForAdverseEvents: string[]
    trialResults: string[]

    // Sites Section
    totalSites: string[]
    siteNotes: string[]
    studySites: string[]
    siteStatus: string[]
    siteCountries: string[]
    siteRegions: string[]
    principalInvestigators: string[]
    siteContactInfo: string[]
    populationDescription: string[]

    // Other Sources Section
    publicationType: string[]
    registryName: string[]
    studyType: string[]
}

// Default empty filter state
export const DEFAULT_THERAPEUTIC_FILTERS: TherapeuticFilterState = {
    // Basic Info Section
    therapeuticAreas: [],
    statuses: [],
    diseaseTypes: [],
    primaryDrugs: [],
    trialPhases: [],
    patientSegments: [],
    lineOfTherapy: [],
    countries: [],
    sponsorsCollaborators: [],
    sponsorFieldActivity: [],
    associatedCro: [],
    trialTags: [],
    otherDrugs: [],
    regions: [],
    trialRecordStatus: [],

    // Eligibility Section
    inclusionCriteria: [],
    exclusionCriteria: [],
    ageFrom: [],
    ageTo: [],
    ageMin: [],
    ageMax: [],
    subjectType: [],
    sex: [],
    gender: [],
    healthyVolunteers: [],
    targetNoVolunteers: [],
    actualEnrolledVolunteers: [],
    ecogPerformanceStatus: [],
    priorTreatments: [],
    biomarkerRequirements: [],

    // Enrollment Section
    estimatedEnrollment: [],
    actualEnrollment: [],
    enrollmentStatus: [],
    recruitmentPeriod: [],

    // Study Design Section
    purposeOfTrial: [],
    summary: [],
    primaryOutcomeMeasures: [],
    otherOutcomeMeasures: [],
    studyDesignKeywords: [],
    studyDesign: [],
    treatmentRegimen: [],
    numberOfArms: [],

    // Timing Section
    startDateEstimated: [],
    trialEndDateEstimated: [],
    studyCompletionDate: [],
    primaryCompletionDate: [],
    studyStartDate: [],
    studyEndDate: [],
    firstPatientIn: [],
    lastPatientIn: [],
    interimAnalysisDates: [],
    finalAnalysisDate: [],
    regulatorySubmissionDate: [],

    // Results Section
    resultsAvailable: [],
    endpointsMet: [],
    adverseEventsReported: [],
    trialOutcome: [],
    trialOutcomeContent: [],
    adverseEventReported: [],
    adverseEventType: [],
    treatmentForAdverseEvents: [],
    trialResults: [],

    // Sites Section
    totalSites: [],
    siteNotes: [],
    studySites: [],
    siteStatus: [],
    siteCountries: [],
    siteRegions: [],
    principalInvestigators: [],
    siteContactInfo: [],
    populationDescription: [],

    // Other Sources Section
    publicationType: [],
    registryName: [],
    studyType: [],
}

export interface TherapeuticSearchCriteria {
    id: string
    field: string
    operator: string
    value: string | string[] // Support both single string and array of strings
    logic: "AND" | "OR"
}
