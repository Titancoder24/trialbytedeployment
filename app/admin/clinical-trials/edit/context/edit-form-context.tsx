"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const parseVolunteerNumber = (value: unknown): number | null => {
  console.log("[ClinicalTrialsEditFormContext] parseVolunteerNumber input:", value);
  if (value === null || value === undefined) {
    return null;
  }

  const normalized =
    typeof value === "string" ? value.replace(/,/g, "").trim() : value;

  if (normalized === "") {
    return null;
  }

  const parsed = Number(normalized);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return null;
};

const joinArrayToString = (
  values: unknown,
  separator: string,
  fallback = ""
): string => {
  const list = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? [values]
      : [];
  const joined = list
    .map((item) => (typeof item === "string" ? item.trim() : String(item || "")))
    .filter(Boolean)
    .join(separator);

  return joined || fallback;
};

const toNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const stringValue = typeof value === "string" ? value.trim() : String(value);
  return stringValue === "" ? null : stringValue;
};

const buildCriteriaPayload = (formData: EditTherapeuticFormData) => {
  console.log("[ClinicalTrialsEditFormContext] buildCriteriaPayload source:", {
    step5_3: formData.step5_3,
    step5_4: formData.step5_4,
  });

  const criteria = formData.step5_3;

  // Combine age value with unit (e.g., "18" + "years" -> "18 Years")
  const formatAgeWithUnit = (ageValue: string, unit: string): string | null => {
    if (!ageValue || ageValue.trim() === "") return null;
    const unitFormatted = unit ? unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase() : "Years";
    return `${ageValue} ${unitFormatted}`.trim();
  };

  const ageUnit = criteria.biomarker_requirements?.[0] || "years";

  const payload = {
    inclusion_criteria: toNullableString(joinArrayToString(criteria.inclusion_criteria, "; ")),
    exclusion_criteria: toNullableString(joinArrayToString(criteria.exclusion_criteria, "; ")),
    age_from: formatAgeWithUnit(criteria.age_min, ageUnit),
    age_to: formatAgeWithUnit(criteria.age_max, ageUnit),
    sex: toNullableString(criteria.gender),
    healthy_volunteers: toNullableString(criteria.healthy_volunteers?.[0]),
    subject_type: toNullableString(criteria.subject_type),
    target_no_volunteers: parseVolunteerNumber(
      criteria.target_no_volunteers ?? formData.step5_4.estimated_enrollment
    ),
    actual_enrolled_volunteers: parseVolunteerNumber(
      criteria.actual_enrolled_volunteers ?? formData.step5_4.actual_enrollment
    ),
    ecog_performance_status: toNullableString(criteria.ecog_performance_status),
    healthy_volunteers: toNullableString(joinArrayToString(criteria.healthy_volunteers, ", ")),
  };

  console.log("[ClinicalTrialsEditFormContext] buildCriteriaPayload output:", payload);

  return payload;
};

const parseOutcomeMeasureField = (rawValue: unknown): string[] => {
  console.log("[ClinicalTrialsEditFormContext] parseOutcomeMeasureField: raw value", rawValue);

  if (Array.isArray(rawValue)) {
    return rawValue.filter(Boolean).map((value) => (typeof value === "string" ? value.trim() : String(value)));
  }

  if (typeof rawValue !== "string") {
    return [];
  }

  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return [];
  }

  if (trimmedValue.includes("\n")) {
    return trimmedValue.split(/\n+/).map((value) => value.trim()).filter(Boolean);
  }

  if (!/[.!?]/.test(trimmedValue) && trimmedValue.includes(",")) {
    return trimmedValue.split(",").map((value) => value.trim()).filter(Boolean);
  }

  return [trimmedValue];
};

// Define the complete form structure for editing
export interface EditTherapeuticFormData {
  // Step 5-1: Trial Overview
  step5_1: {
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
  };

  // Step 5-2: Trial Purpose & Design
  step5_2: {
    purpose_of_trial: string;
    summary: string;
    primaryOutcomeMeasures: string[];
    otherOutcomeMeasures: string[];
    study_design_keywords: string[];
    study_design: string;
    treatment_regimen: string;
    number_of_arms: string;
  };

  // Step 5-3: Eligibility Criteria
  step5_3: {
    inclusion_criteria: string[];
    exclusion_criteria: string[];
    age_min: string;
    age_max: string;
    gender: string;
    ecog_performance_status: string;
    healthy_volunteers: string[];
    biomarker_requirements: string[];
    subject_type: string;
    target_no_volunteers: string;
    actual_enrolled_volunteers: string;
  };

  // Step 5-4: Patient Population
  step5_4: {
    estimated_enrollment: string;
    actual_enrollment: string;
    enrollment_status: string;
    recruitment_period: string;
    study_completion_date: string;
    primary_completion_date: string;
    population_description: string;
    // Timing fields - ensure they are mapped
    actual_start_date: string;
    actual_inclusion_period: string;
    actual_enrollment_closed_date: string;
    actual_primary_outcome_duration: string;
    actual_trial_end_date: string;
    actual_result_duration: string;
    actual_result_published_date: string;
    benchmark_start_date: string;
    benchmark_inclusion_period: string;
    benchmark_enrollment_closed_date: string;
    benchmark_primary_outcome_duration: string;
    benchmark_trial_end_date: string;
    benchmark_result_duration: string;
    benchmark_result_published_date: string;
    estimated_start_date: string;
    estimated_inclusion_period: string;
    estimated_enrollment_closed_date: string;
    estimated_primary_outcome_duration: string;
    estimated_trial_end_date: string;
    estimated_result_duration: string;
    estimated_result_published_date: string;
    overall_duration_complete: string;
    overall_duration_publish: string;
    references: Array<{
      id: string;
      date: string;
      registryType: string;
      content: string;
      viewSource: string;
      attachments: string[];
      isVisible: boolean;
    }>;
  };

  // Step 5-5: Results
  step5_5: {
    results_available: boolean;
    endpoints_met: boolean;
    adverse_events_reported: boolean;
    trial_outcome: string;
    trial_outcome_reference_date: string;
    trial_outcome_content: string;
    trial_outcome_link: string;
    trial_outcome_attachment: string; // or File
    trial_results: string[];
    adverse_event_reported: string;
    adverse_event_type: string;
    treatment_for_adverse_events: string;
    site_notes: any[];
  };

  // Step 5-6: Timeline & Milestones
  step5_6: {
    study_start_date: string;
    first_patient_in: string;
    last_patient_in: string;
    study_end_date: string;
    interim_analysis_dates: string[];
    final_analysis_date: string;
    regulatory_submission_date: string;
    // Separate notes/references for Sites/Timeline section
    references: Array<{
      id: string;
      date: string;
      registryType: string;
      content: string;
      viewSource: string;
      attachments: any[];
      isVisible: boolean;
    }>;
  };

  // Step 5-7: Results & Outcomes
  step5_7: {
    primary_endpoint_results: string;
    secondary_endpoint_results: string[];
    safety_results: string;
    efficacy_results: string;
    statistical_significance: string;
    adverse_events: string[];
    conclusion: string;
    pipeline_data: Array<{
      id: string;
      date: string;
      information: string;
      url: string;
      file: string;
      isVisible: boolean;
    }>;
    press_releases: Array<{
      id: string;
      date: string;
      title: string;
      url: string;
      file: string;
      isVisible: boolean;
    }>;
    publications: Array<{
      id: string;
      type: string;
      title: string;
      url: string;
      file: string;
      isVisible: boolean;
    }>;
    trial_registries: Array<{
      id: string;
      registry: string;
      identifier: string;
      url: string;
      file: string;
      isVisible: boolean;
    }>;
    associated_studies: Array<{
      id: string;
      type: string;
      title: string;
      url: string;
      file: string;
      isVisible: boolean;
    }>;
  };

  // Step 5-8: Additional Information
  step5_8: {
    notes: Array<{
      id: string;
      date: string;
      type: string;
      content: string;
      sourceLink?: string;
      attachments?: string[];
      isVisible: boolean;
    }>;
    attachments: string[];
    regulatory_links: string[];
    publication_links: string[];
    additional_resources: string[];
    date_type: string;
    link: string;
    fullReview: boolean;
    fullReviewUser: string;
    nextReviewDate: string;
    changesLog: Array<{
      id: string;
      timestamp: string;
      user: string;
      action: string;
      details: string;
      field?: string;
      oldValue?: string;
      newValue?: string;
      step?: string;
      changeType?: string;
    }>;
    creationInfo: {
      createdDate: string;
      createdUser: string;
    };
    modificationInfo: {
      lastModifiedDate: string;
      lastModifiedUser: string;
      modificationCount: number;
    };
  };
}

// Initial form data
const initialFormData: EditTherapeuticFormData = {
  step5_1: {
    therapeutic_area: "",
    trial_identifier: [],
    trial_phase: "",
    status: "",
    primary_drugs: "",
    other_drugs: "",
    title: "",
    disease_type: "",
    patient_segment: "",
    line_of_therapy: "",
    reference_links: [],
    trial_tags: "",
    sponsor_collaborators: "",
    sponsor_field_activity: "",
    associated_cro: "",
    countries: "",
    region: "",
    trial_record_status: "",
  },
  step5_2: {
    purpose_of_trial: "",
    summary: "",
    primaryOutcomeMeasures: [],
    otherOutcomeMeasures: [],
    study_design_keywords: [],
    study_design: "",
    treatment_regimen: "",
    number_of_arms: "",
  },
  step5_3: {
    inclusion_criteria: [],
    exclusion_criteria: [],
    age_min: "",
    age_max: "",
    gender: "",
    ecog_performance_status: "",
    healthy_volunteers: [],
    biomarker_requirements: [],
    subject_type: "",
    target_no_volunteers: "",
    actual_enrolled_volunteers: "",
  },
  step5_4: {
    estimated_enrollment: "",
    actual_enrollment: "",
    enrollment_status: "",
    recruitment_period: "",
    study_completion_date: "",
    primary_completion_date: "",
    population_description: "",
    // Timing fields - ensure they are mapped
    actual_start_date: "",
    actual_inclusion_period: "",
    actual_enrollment_closed_date: "",
    actual_primary_outcome_duration: "",
    actual_trial_end_date: "",
    actual_result_duration: "",
    actual_result_published_date: "",
    benchmark_start_date: "",
    benchmark_inclusion_period: "",
    benchmark_enrollment_closed_date: "",
    benchmark_primary_outcome_duration: "",
    benchmark_trial_end_date: "",
    benchmark_result_duration: "",
    benchmark_result_published_date: "",
    estimated_start_date: "",
    estimated_inclusion_period: "",
    estimated_enrollment_closed_date: "",
    estimated_primary_outcome_duration: "",
    estimated_trial_end_date: "",
    estimated_result_duration: "",
    estimated_result_published_date: "",
    overall_duration_complete: "",
    overall_duration_publish: "",
    references: [],
  },
  step5_5: {
    results_available: false,
    endpoints_met: false,
    adverse_events_reported: false,
    trial_outcome: '',
    trial_outcome_reference_date: '',
    trial_outcome_content: '',
    trial_outcome_link: '',
    trial_outcome_attachment: '',
    trial_results: [],
    adverse_event_reported: '',
    adverse_event_type: '',
    treatment_for_adverse_events: '',
    site_notes: [],
  },
  step5_6: {
    study_start_date: "",
    first_patient_in: "",
    last_patient_in: "",
    study_end_date: "",
    interim_analysis_dates: [],
    final_analysis_date: "",
    regulatory_submission_date: "",
    references: [{
      id: "1",
      date: "",
      registryType: "",
      content: "",
      viewSource: "",
      attachments: [],
      isVisible: true,
    }],
  },
  step5_7: {
    primary_endpoint_results: "",
    secondary_endpoint_results: [],
    safety_results: "",
    efficacy_results: "",
    statistical_significance: "",
    adverse_events: [],
    conclusion: "",
    pipeline_data: [],
    press_releases: [],
    publications: [],
    trial_registries: [],
    associated_studies: [],
  },
  step5_8: {
    notes: [],
    attachments: [],
    regulatory_links: [],
    publication_links: [],
    additional_resources: [],
    date_type: "",
    link: "",
    fullReview: false,
    fullReviewUser: "",
    nextReviewDate: "",
    changesLog: [],
    creationInfo: {
      createdDate: "",
      createdUser: "",
    },
    modificationInfo: {
      lastModifiedDate: "",
      lastModifiedUser: "",
      modificationCount: 0,
    },
  },
};

// Action types
type EditFormAction =
  | { type: "SET_TRIAL_DATA"; payload: any }
  | { type: "UPDATE_FIELD"; step: keyof EditTherapeuticFormData; field: string; value: any }
  | { type: "ADD_ARRAY_ITEM"; step: keyof EditTherapeuticFormData; field: string; value: any }
  | { type: "REMOVE_ARRAY_ITEM"; step: keyof EditTherapeuticFormData; field: string; index: number }
  | { type: "UPDATE_ARRAY_ITEM"; step: keyof EditTherapeuticFormData; field: string; index: number; value: any }
  | { type: "RESET_FORM" };

// Reducer function
function editFormReducer(state: EditTherapeuticFormData, action: EditFormAction): EditTherapeuticFormData {
  let newState: EditTherapeuticFormData;
  
  switch (action.type) {
    case "SET_TRIAL_DATA":
      return action.payload;
    case "UPDATE_FIELD":
      newState = {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: action.value,
        },
      };
      
      // Save step5_5 (Results) to localStorage immediately for persistence
      if (action.step === "step5_5") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            const storageKey = `trial_results_${trialId}`;
            const resultsData = newState.step5_5;
            localStorage.setItem(storageKey, JSON.stringify({
              ...resultsData,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Results to localStorage:', storageKey, resultsData);
          } else {
            console.warn('Cannot save Results to localStorage: No trialId found');
          }
        } catch (e) {
          console.warn('Failed to save Results to localStorage:', e);
        }
      }
      
      // Save step5_7 (Other Sources) to localStorage immediately for persistence
      if (action.step === "step5_7") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            const storageKey = `trial_other_sources_${trialId}`;
            const otherSourcesData = newState.step5_7;
            localStorage.setItem(storageKey, JSON.stringify({
              ...otherSourcesData,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Other Sources to localStorage:', storageKey, otherSourcesData);
          } else {
            console.warn('Cannot save Other Sources to localStorage: No trialId found');
          }
        } catch (e) {
          console.warn('Failed to save Other Sources to localStorage:', e);
        }
      }
      
      // Save step5_4 (Timing) to localStorage immediately for persistence
      if (action.step === "step5_4") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            const storageKey = `trial_timing_${trialId}`;
            const timingData = newState.step5_4;
            localStorage.setItem(storageKey, JSON.stringify({
              ...timingData,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Timing to localStorage:', storageKey, timingData);
          } else {
            console.warn('Cannot save Timing to localStorage: No trialId found');
          }
        } catch (e) {
          console.warn('Failed to save Timing to localStorage:', e);
        }
      }
      
      return newState;
    case "ADD_ARRAY_ITEM":
      newState = {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: [...(state[action.step] as any)[action.field], action.value],
        },
      };
      
      // Save to localStorage for step5_5
      if (action.step === "step5_5") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            localStorage.setItem(`trial_results_${trialId}`, JSON.stringify({
              ...newState.step5_5,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Results array to localStorage (ADD)');
          }
        } catch (e) {}
      }
      
      // Save to localStorage for step5_7 (Other Sources)
      if (action.step === "step5_7") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            localStorage.setItem(`trial_other_sources_${trialId}`, JSON.stringify({
              ...newState.step5_7,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Other Sources array to localStorage (ADD)');
          }
        } catch (e) {}
      }
      
      // Save to localStorage for step5_4 (Timing)
      if (action.step === "step5_4") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            localStorage.setItem(`trial_timing_${trialId}`, JSON.stringify({
              ...newState.step5_4,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Timing array to localStorage (ADD)');
          }
        } catch (e) {}
      }
      
      return newState;
    case "REMOVE_ARRAY_ITEM":
      newState = {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: (state[action.step] as any)[action.field].filter(
            (_: any, index: number) => index !== action.index
          ),
        },
      };
      
      // Save to localStorage for step5_5
      if (action.step === "step5_5") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            localStorage.setItem(`trial_results_${trialId}`, JSON.stringify({
              ...newState.step5_5,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Results array to localStorage (ADD)');
          }
        } catch (e) {}
      }
      
      // Save to localStorage for step5_7 (Other Sources)
      if (action.step === "step5_7") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            localStorage.setItem(`trial_other_sources_${trialId}`, JSON.stringify({
              ...newState.step5_7,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Other Sources array to localStorage (ADD)');
          }
        } catch (e) {}
      }
      
      // Save to localStorage for step5_4 (Timing)
      if (action.step === "step5_4") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            localStorage.setItem(`trial_timing_${trialId}`, JSON.stringify({
              ...newState.step5_4,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Timing array to localStorage (ADD)');
          }
        } catch (e) {}
      }
      
      return newState;
    case "UPDATE_ARRAY_ITEM":
      newState = {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: (state[action.step] as any)[action.field].map(
            (item: any, index: number) => (index === action.index ? action.value : item)
          ),
        },
      };
      
      // Save to localStorage for step5_5
      if (action.step === "step5_5") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            localStorage.setItem(`trial_results_${trialId}`, JSON.stringify({
              ...newState.step5_5,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Results array to localStorage (ADD)');
          }
        } catch (e) {}
      }
      
      // Save to localStorage for step5_7 (Other Sources)
      if (action.step === "step5_7") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            localStorage.setItem(`trial_other_sources_${trialId}`, JSON.stringify({
              ...newState.step5_7,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Other Sources array to localStorage (ADD)');
          }
        } catch (e) {}
      }
      
      // Save to localStorage for step5_4 (Timing)
      if (action.step === "step5_4") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            localStorage.setItem(`trial_timing_${trialId}`, JSON.stringify({
              ...newState.step5_4,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Timing array to localStorage (ADD)');
          }
        } catch (e) {}
      }
      
      return newState;
    case "RESET_FORM":
      return initialFormData;
    default:
      return state;
  }
}

// Context type
interface EditTherapeuticFormContextType {
  formData: EditTherapeuticFormData;
  updateField: (step: keyof EditTherapeuticFormData, field: string, value: any) => void;
  addArrayItem: (step: keyof EditTherapeuticFormData, field: string, value: any) => void;
  removeArrayItem: (step: keyof EditTherapeuticFormData, field: string, index: number) => void;
  updateArrayItem: (step: keyof EditTherapeuticFormData, field: string, index: number, value: any) => void;
  addReference: (step: keyof EditTherapeuticFormData, field: string) => void;
  removeReference: (step: keyof EditTherapeuticFormData, field: string, index: number) => void;
  updateReference: (step: keyof EditTherapeuticFormData, field: string, index: number, updates: any) => void;
  addNote: (step: keyof EditTherapeuticFormData, field: string) => void;
  updateNote: (step: keyof EditTherapeuticFormData, field: string, index: number, updates: Partial<any>) => void;
  removeNote: (step: keyof EditTherapeuticFormData, field: string, index: number) => void;
  toggleNoteVisibility: (step: keyof EditTherapeuticFormData, field: string, index: number) => void;
  saveTrial: (trialId: string) => Promise<void>;
  loadTrialData: (trialId: string) => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
}

// Module-level variable to store current trialId for localStorage
let currentEditingTrialId: string | null = null;

// Helper function to get trialId from URL
const getTrialIdFromURL = (): string | null => {
  if (typeof window === 'undefined') return null;
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  // URL format: /admin/therapeutics/edit/[trialId]/5-5
  const editIndex = pathParts.indexOf('edit');
  if (editIndex !== -1 && pathParts[editIndex + 1]) {
    return pathParts[editIndex + 1];
  }
  return null;
};

// Create context
const EditTherapeuticFormContext = createContext<EditTherapeuticFormContextType | undefined>(undefined);

// Provider component
export function EditTherapeuticFormProvider({ children, trialId }: { children: ReactNode; trialId: string }) {
  const [formData, dispatch] = useReducer(editFormReducer, initialFormData);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Set the module-level trialId for localStorage access
  React.useEffect(() => {
    currentEditingTrialId = trialId;
    console.log('🔑 Set currentEditingTrialId:', trialId);
  }, [trialId]);
  const { toast } = useToast();

  // Store the original trial data for reference
  const [originalTrial, setOriginalTrial] = React.useState<any>(null);

  // Load trial data
  const loadTrialData = async (trialId: string) => {
    try {
      // Set the module-level trialId for localStorage access
      currentEditingTrialId = trialId;
      console.log('🔑 Set currentEditingTrialId in loadTrialData:', trialId);
      
      setIsLoading(true);
      
      // Try to fetch from API first
      let data = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        // Wrap fetch in a promise that never rejects
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const fetchPromise = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/therapeutic/all-trials-with-data?_t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-store',
        }).catch(() => null); // Convert rejection to null
        
        const response = await fetchPromise;
        clearTimeout(timeoutId);
        
        if (response && response.ok) {
          data = await response.json().catch(() => null);
        } else if (response) {
          console.warn('API response not ok:', response.status);
        } else {
          console.warn('API fetch failed, trying localStorage');
        }
      } catch (apiError) {
        console.warn('API fetch failed, trying localStorage:', apiError);
      }
      
      // If API failed, try localStorage
      if (!data) {
        const localTrials = JSON.parse(localStorage.getItem('therapeuticTrials') || '[]');
        if (localTrials.length > 0) {
          data = { trials: localTrials };
        }
      }
      
      if (data.trials && data.trials.length > 0) {
        // First, check if we have localStorage data that might be more recent
        const localTrials = JSON.parse(localStorage.getItem('therapeuticTrials') || '[]');
        const localTrial = localTrials.find((t: any) => t.trial_id === trialId);
        const recentlyUpdated = localStorage.getItem(`trial_updated_${trialId}`);
        
        let foundTrial = data.trials.find((t: any) => t.trial_id === trialId);
        
        // Always prefer API data when available (it's the source of truth)
        if (foundTrial) {
          console.log('Using API data for trial:', trialId);
        } else if (localTrial) {
          // Only use localStorage as fallback when API data is not available
          console.log('API data not found, using localStorage for trial:', trialId);
          foundTrial = localTrial;
        }
        
        if (foundTrial) {
          // Store original trial data for reference
          setOriginalTrial(foundTrial);
          
          // Helper function to format date from database (YYYY-MM-DD) to UI (MM-DD-YYYY)
          const formatDateForUI = (dateStr: string): string => {
            if (!dateStr) return "";
            
            try {
              // Handle YYYY-MM-DD format (from database)
              if (dateStr.includes('-') && dateStr.length === 10) {
                const parts = dateStr.split('-');
                if (parts.length === 3 && parts[0].length === 4) {
                  // Convert YYYY-MM-DD to MM-DD-YYYY
                  const [year, month, day] = parts;
                  return `${month}-${day}-${year}`;
                }
              }
              
              // Try to parse as Date object
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const year = date.getFullYear();
                return `${month}-${day}-${year}`;
              }
              
              return dateStr; // Return as-is if can't parse
            } catch (e) {
              console.warn('Error formatting date for UI:', dateStr, e);
              return dateStr;
            }
          };
          
          // Map trial data to form structure
          const toStringOrEmpty = (value: unknown): string => {
            if (value === null || value === undefined) return "";
            return typeof value === "string" ? value : String(value);
          };

          // Parse age field to extract just the number (e.g., "18 Years" -> "18")
          const parseAgeValue = (value: unknown): string => {
            if (value === null || value === undefined) return "";
            const str = String(value).trim();
            if (!str) return "";
            // Extract just the numeric part
            const parts = str.split(/\s+/);
            return parts[0] || "";
          };

          // Parse age field to extract just the unit (e.g., "18 Years" -> "years")
          const parseAgeUnit = (value: unknown): string => {
            if (value === null || value === undefined) return "";
            const str = String(value).trim();
            if (!str) return "";
            const parts = str.split(/\s+/);
            if (parts.length >= 2) {
              return parts[1].toLowerCase() || "";
            }
            return "";
          };

          const mappedData: EditTherapeuticFormData = {
            step5_1: {
              therapeutic_area: foundTrial.overview?.therapeutic_area || "",
              trial_identifier: foundTrial.overview?.trial_identifier || [],
              trial_phase: foundTrial.overview?.trial_phase || "",
              status: foundTrial.overview?.status || "",
              primary_drugs: foundTrial.overview?.primary_drugs || "",
              other_drugs: foundTrial.overview?.other_drugs || "",
              title: foundTrial.overview?.title || "",
              disease_type: foundTrial.overview?.disease_type || "",
              patient_segment: foundTrial.overview?.patient_segment || "",
              line_of_therapy: foundTrial.overview?.line_of_therapy || "",
              reference_links: foundTrial.overview?.reference_links || [],
              trial_tags: foundTrial.overview?.trial_tags || "",
              sponsor_collaborators: foundTrial.overview?.sponsor_collaborators || "",
              sponsor_field_activity: foundTrial.overview?.sponsor_field_activity || "",
              associated_cro: foundTrial.overview?.associated_cro || "",
              countries: foundTrial.overview?.countries || "",
              region: foundTrial.overview?.region || "",
              trial_record_status: foundTrial.overview?.trial_record_status || "",
            },
            step5_2: {
              purpose_of_trial: foundTrial.outcomes?.[0]?.purpose_of_trial || "",
              summary: foundTrial.outcomes?.[0]?.summary || "",
              primaryOutcomeMeasures: parseOutcomeMeasureField(foundTrial.outcomes?.[0]?.primary_outcome_measure),
              otherOutcomeMeasures: parseOutcomeMeasureField(foundTrial.outcomes?.[0]?.other_outcome_measure),
              study_design_keywords: foundTrial.outcomes?.[0]?.study_design_keywords 
                ? Array.isArray(foundTrial.outcomes[0].study_design_keywords)
                  ? foundTrial.outcomes[0].study_design_keywords.filter(Boolean)
                  : typeof foundTrial.outcomes[0].study_design_keywords === 'string'
                    ? foundTrial.outcomes[0].study_design_keywords.split(", ").filter(Boolean)
                    : []
                : [],
              study_design: foundTrial.outcomes?.[0]?.study_design || "",
              treatment_regimen: foundTrial.outcomes?.[0]?.treatment_regimen || "",
              number_of_arms: foundTrial.outcomes?.[0]?.number_of_arms?.toString() || "",
            },
            step5_3: {
              inclusion_criteria: foundTrial.criteria?.[0]?.inclusion_criteria 
                ? Array.isArray(foundTrial.criteria[0].inclusion_criteria)
                  ? foundTrial.criteria[0].inclusion_criteria.filter(Boolean)
                  : typeof foundTrial.criteria[0].inclusion_criteria === 'string'
                    ? foundTrial.criteria[0].inclusion_criteria.split("; ").filter(Boolean)
                    : [foundTrial.criteria[0].inclusion_criteria].filter(Boolean)
                : [],
              exclusion_criteria: foundTrial.criteria?.[0]?.exclusion_criteria 
                ? Array.isArray(foundTrial.criteria[0].exclusion_criteria)
                  ? foundTrial.criteria[0].exclusion_criteria.filter(Boolean)
                  : typeof foundTrial.criteria[0].exclusion_criteria === 'string'
                    ? foundTrial.criteria[0].exclusion_criteria.split("; ").filter(Boolean)
                    : [foundTrial.criteria[0].exclusion_criteria].filter(Boolean)
                : [],
              age_min: parseAgeValue(foundTrial.criteria?.[0]?.age_from),
              age_max: parseAgeValue(foundTrial.criteria?.[0]?.age_to),
              gender: toStringOrEmpty(foundTrial.criteria?.[0]?.sex),
              ecog_performance_status: toStringOrEmpty(foundTrial.criteria?.[0]?.ecog_performance_status),
              healthy_volunteers: foundTrial.criteria?.[0]?.healthy_volunteers
                ? [toStringOrEmpty(foundTrial.criteria[0].healthy_volunteers)]
                : [],
              biomarker_requirements: [parseAgeUnit(foundTrial.criteria?.[0]?.age_from) || "years"],
              subject_type: toStringOrEmpty(foundTrial.criteria?.[0]?.subject_type),
              target_no_volunteers: toStringOrEmpty(foundTrial.criteria?.[0]?.target_no_volunteers),
              actual_enrolled_volunteers: toStringOrEmpty(foundTrial.criteria?.[0]?.actual_enrolled_volunteers),
            },
            step5_4: (() => {
              console.log('=== LOADING TIMING DATA ===');
              
              // CHECK LOCALSTORAGE FIRST for recent changes
              try {
                const storageKey = `trial_timing_${trialId}`;
                const storedData = localStorage.getItem(storageKey);
                if (storedData) {
                  const localStorageData = JSON.parse(storedData);
                  console.log('📂 Found Timing in localStorage:', localStorageData);
                  
                  // Check if localStorage data is recent
                  const timestamp = new Date(localStorageData.timestamp);
                  const now = new Date();
                  const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
                  console.log('localStorage data age:', hoursDiff, 'hours');
                  
                  // Use localStorage data if it exists
                  if (localStorageData) {
                    console.log('✅ Using localStorage data for Timing (has recent changes)');
                    // Remove timestamp before returning
                    const { timestamp: _, ...dataWithoutTimestamp } = localStorageData;
                    return dataWithoutTimestamp;
                  }
                }
              } catch (e) {
                console.warn('Error loading Timing from localStorage:', e);
              }
              
              console.log('Loading Timing from API...');
              
              return {
              estimated_enrollment: foundTrial.criteria?.[0]?.target_no_volunteers?.toString() || "",
              actual_enrollment: foundTrial.criteria?.[0]?.actual_enrolled_volunteers?.toString() || "",
              enrollment_status: "",
              recruitment_period: "",
              study_completion_date: "",
              primary_completion_date: "",
              population_description: "",
              // Timing fields - ensure they are mapped with proper date formatting
              actual_start_date: formatDateForUI(foundTrial.timing?.[0]?.start_date_actual),
              actual_inclusion_period: foundTrial.timing?.[0]?.inclusion_period_actual || "",
              actual_enrollment_closed_date: formatDateForUI(foundTrial.timing?.[0]?.enrollment_closed_actual),
              actual_primary_outcome_duration: foundTrial.timing?.[0]?.primary_outcome_duration_actual || "",
              actual_trial_end_date: formatDateForUI(foundTrial.timing?.[0]?.trial_end_date_actual),
              actual_result_duration: foundTrial.timing?.[0]?.result_duration_actual || "",
              actual_result_published_date: formatDateForUI(foundTrial.timing?.[0]?.result_published_date_actual),
              benchmark_start_date: formatDateForUI(foundTrial.timing?.[0]?.start_date_benchmark),
              benchmark_inclusion_period: foundTrial.timing?.[0]?.inclusion_period_benchmark || "",
              benchmark_enrollment_closed_date: formatDateForUI(foundTrial.timing?.[0]?.enrollment_closed_benchmark),
              benchmark_primary_outcome_duration: foundTrial.timing?.[0]?.primary_outcome_duration_benchmark || "",
              benchmark_trial_end_date: formatDateForUI(foundTrial.timing?.[0]?.trial_end_date_benchmark),
              benchmark_result_duration: foundTrial.timing?.[0]?.result_duration_benchmark || "",
              benchmark_result_published_date: formatDateForUI(foundTrial.timing?.[0]?.result_published_date_benchmark),
              estimated_start_date: formatDateForUI(foundTrial.timing?.[0]?.start_date_estimated),
              estimated_inclusion_period: foundTrial.timing?.[0]?.inclusion_period_estimated || "",
              estimated_enrollment_closed_date: formatDateForUI(foundTrial.timing?.[0]?.enrollment_closed_estimated),
              estimated_primary_outcome_duration: foundTrial.timing?.[0]?.primary_outcome_duration_estimated || "",
              estimated_trial_end_date: formatDateForUI(foundTrial.timing?.[0]?.trial_end_date_estimated),
              estimated_result_duration: foundTrial.timing?.[0]?.result_duration_estimated || "",
              estimated_result_published_date: formatDateForUI(foundTrial.timing?.[0]?.result_published_date_estimated),
              overall_duration_complete: foundTrial.timing?.[0]?.overall_duration_complete || "",
              overall_duration_publish: foundTrial.timing?.[0]?.overall_duration_publish || "",
              references: (() => {
                // Log timing data being loaded
                console.log('Loading timing data from database:', {
                  raw_dates: {
                    actual_start: foundTrial.timing?.[0]?.start_date_actual,
                    benchmark_start: foundTrial.timing?.[0]?.start_date_benchmark,
                  },
                  formatted_dates: {
                    actual_start: formatDateForUI(foundTrial.timing?.[0]?.start_date_actual),
                    benchmark_start: formatDateForUI(foundTrial.timing?.[0]?.start_date_benchmark),
                  },
                  durations: {
                    actual_inclusion_period: foundTrial.timing?.[0]?.inclusion_period_actual,
                    benchmark_inclusion_period: foundTrial.timing?.[0]?.inclusion_period_benchmark,
                    estimated_inclusion_period: foundTrial.timing?.[0]?.inclusion_period_estimated,
                    overall_duration_complete: foundTrial.timing?.[0]?.overall_duration_complete,
                    overall_duration_publish: foundTrial.timing?.[0]?.overall_duration_publish,
                  }
                });
                // Parse timing_references if it's a string, or use it directly if it's an array
                let timingReferences = foundTrial.timing?.[0]?.timing_references;
                
                console.log('Loading timing_references:', {
                  rawTimingReferences: timingReferences,
                  type: typeof timingReferences,
                  isArray: Array.isArray(timingReferences)
                });
                
                // If timing_references is a string, try to parse it
                if (typeof timingReferences === 'string') {
                  try {
                    timingReferences = JSON.parse(timingReferences);
                    console.log('Parsed timing_references:', timingReferences);
                  } catch (e) {
                    console.warn('Failed to parse timing_references:', e);
                    timingReferences = null;
                  }
                }
                
                // If we have valid timing_references array, map it
                if (timingReferences && Array.isArray(timingReferences) && timingReferences.length > 0) {
                  const mappedReferences = timingReferences.map((ref: any, index: number) => ({
                    id: ref.id || `${index + 1}`,
                    date: ref.date || "",
                    registryType: ref.registryType || "",
                    content: ref.content || "",
                    viewSource: ref.viewSource || "",
                    attachments: ref.attachments || [],
                    isVisible: ref.isVisible !== false,
                  }));
                  console.log('Mapped timing references:', mappedReferences);
                  return mappedReferences;
                }
                
                console.log('No valid timing_references found, using default empty reference');
                // Default: return a single empty reference
                return [{
                  id: "1",
                  date: "",
                  registryType: "",
                  content: "",
                  viewSource: "",
                  attachments: [],
                  isVisible: true,
                }];
              })(),
              };
            })(),
            step5_5: (() => {
              console.log('=== LOADING RESULTS DATA ===');
              
              // CHECK LOCALSTORAGE FIRST for recent changes
              let localStorageData = null;
              try {
                const storageKey = `trial_results_${trialId}`;
                const storedData = localStorage.getItem(storageKey);
                if (storedData) {
                  localStorageData = JSON.parse(storedData);
                  console.log('📂 Found Results in localStorage:', localStorageData);
                  
                  // Check if localStorage data is recent (within last 24 hours)
                  const timestamp = new Date(localStorageData.timestamp);
                  const now = new Date();
                  const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
                  console.log('localStorage data age:', hoursDiff, 'hours');
                  
                  // Use localStorage data if it exists, regardless of age
                  // This ensures recent changes are always shown
                  if (localStorageData) {
                    console.log('✅ Using localStorage data for Results (has recent changes)');
                    // Remove timestamp before returning
                    const { timestamp: _, ...dataWithoutTimestamp } = localStorageData;
                    return dataWithoutTimestamp;
                  }
                }
              } catch (e) {
                console.warn('Error loading Results from localStorage:', e);
              }
              
              console.log('Loading Results from API...');
              console.log('foundTrial.results:', foundTrial.results);
              console.log('foundTrial.results[0]:', foundTrial.results?.[0]);
              
              const resultsData = foundTrial.results?.[0];
              console.log('Results Available raw:', resultsData?.results_available);
              console.log('Endpoints met raw:', resultsData?.endpoints_met);
              console.log('Adverse Event Reported raw:', resultsData?.adverse_event_reported);
              console.log('Trial Outcome Reference raw:', resultsData?.reference);
              
              // Helper to format date for HTML date input (YYYY-MM-DD)
              const formatDateForInput = (dateStr: string): string => {
                if (!dateStr) return "";
                try {
                  // If already in YYYY-MM-DD format, return as-is
                  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    return dateStr;
                  }
                  // Try to parse and format
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  }
                  return dateStr;
                } catch (e) {
                  console.warn('Error formatting date for input:', dateStr, e);
                  return "";
                }
              };
              
              const formattedDate = formatDateForInput(resultsData?.reference || "");
              console.log('Formatted Trial Outcome Reference date:', formattedDate);
              
              const loadedData = {
                results_available: resultsData?.results_available === 'Yes',
                endpoints_met: resultsData?.endpoints_met === 'Yes',
                adverse_events_reported: resultsData?.adverse_event_reported === 'Yes',
                trial_outcome: resultsData?.trial_outcome || "",
                trial_outcome_reference_date: formattedDate,
              };
              
              console.log('Loaded Results Data from API (toggles and date):', loadedData);
              
              return {
              ...loadedData,
              trial_outcome_content: resultsData?.trial_outcome_content || "",
              trial_outcome_link: resultsData?.trial_outcome_link || "",
              trial_outcome_attachment: resultsData?.trial_outcome_attachment || "",
              trial_results: Array.isArray(resultsData?.trial_results) 
                ? resultsData.trial_results 
                : (resultsData?.trial_results ? [resultsData.trial_results] : []),
              adverse_event_reported: resultsData?.adverse_event_reported || "",
              adverse_event_type: resultsData?.adverse_event_type || "",
              treatment_for_adverse_events: resultsData?.treatment_for_adverse_events || "",
              site_notes: (() => {
                let siteNotes = foundTrial.results?.[0]?.site_notes;
                if (typeof siteNotes === 'string') {
                  try {
                    siteNotes = JSON.parse(siteNotes);
                  } catch (e) {
                    console.warn('Failed to parse site_notes:', e);
                    siteNotes = [];
                  }
                }
                if (siteNotes && Array.isArray(siteNotes) && siteNotes.length > 0) {
                  return siteNotes.map((note: any, index: number) => ({
                    id: note.id || `${index + 1}`,
                    date: note.date || "",
                    noteType: note.noteType || "",
                    content: note.content || "",
                    sourceLink: note.sourceLink || note.source_link || "", // Add sourceLink mapping
                    sourceType: note.sourceType || "",
                    attachments: note.attachments || [],
                    isVisible: note.isVisible !== false,
                  }));
                }
                return [{
                  id: "1",
                  date: "",
                  noteType: "",
                  content: "",
                  sourceLink: "",
                  sourceType: "",
                  attachments: [],
                  isVisible: true,
                }];
              })(),
              };
            })(),
            step5_6: {
              study_start_date: foundTrial.sites?.[0]?.total?.toString() || "",
              first_patient_in: "",
              last_patient_in: "",
              study_end_date: foundTrial.timing?.[0]?.trial_end_date_estimated || "",
              interim_analysis_dates: [],
              final_analysis_date: "",
              regulatory_submission_date: "",
              references: (() => {
                // Parse site_notes if it's a string, or use it directly if it's an array
                let siteNotes = foundTrial.sites?.[0]?.site_notes;
                
                console.log('Loading site_notes:', {
                  rawSiteNotes: siteNotes,
                  type: typeof siteNotes,
                  isArray: Array.isArray(siteNotes)
                });
                
                // If site_notes is a string, try to parse it
                if (typeof siteNotes === 'string') {
                  try {
                    siteNotes = JSON.parse(siteNotes);
                    console.log('Parsed site_notes:', siteNotes);
                  } catch (e) {
                    console.warn('Failed to parse site_notes:', e);
                    siteNotes = null;
                  }
                }
                
                // If we have valid site_notes array, map it
                if (siteNotes && Array.isArray(siteNotes) && siteNotes.length > 0) {
                  const mappedReferences = siteNotes.map((note: any, index: number) => ({
                    id: note.id || `${index + 1}`,
                    date: note.date || "",
                    registryType: note.registryType || note.sourceType || "",
                    content: note.content || "",
                    viewSource: note.viewSource || note.sourceLink || "",
                    attachments: note.attachments || [],
                    isVisible: note.isVisible !== false,
                  }));
                  console.log('Mapped references:', mappedReferences);
                  return mappedReferences;
                }
                
                console.log('No valid site_notes found, using default empty reference');
                // Default: return a single empty reference
                return [{
                  id: "1",
                  date: "",
                  registryType: "",
                  content: "",
                  viewSource: "",
                  attachments: [],
                  isVisible: true,
                }];
              })(),
            },
            step5_7: (() => {
              console.log('=== LOADING OTHER SOURCES ===');
              
              // CHECK LOCALSTORAGE FIRST for recent changes
              try {
                const storageKey = `trial_other_sources_${trialId}`;
                const storedData = localStorage.getItem(storageKey);
                if (storedData) {
                  const localStorageData = JSON.parse(storedData);
                  console.log('📂 Found Other Sources in localStorage:', localStorageData);
                  
                  // Check if localStorage data is recent
                  const timestamp = new Date(localStorageData.timestamp);
                  const now = new Date();
                  const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
                  console.log('localStorage data age:', hoursDiff, 'hours');
                  
                  // Use localStorage data if it exists
                  if (localStorageData) {
                    console.log('✅ Using localStorage data for Other Sources (has recent changes)');
                    // Remove timestamp before returning
                    const { timestamp: _, ...dataWithoutTimestamp } = localStorageData;
                    return dataWithoutTimestamp;
                  }
                }
              } catch (e) {
                console.warn('Error loading Other Sources from localStorage:', e);
              }
              
              console.log('Loading Other Sources from API...');
              
              // Parse other_sources data
              // API returns it as 'other', localStorage returns it as 'other_sources'
              // Each item from API has a 'data' field with JSON string
              // Each item from localStorage is already in the correct format with category names
              let otherSources = foundTrial.other || foundTrial.other_sources || [];
              
              console.log('foundTrial keys:', Object.keys(foundTrial));
              console.log('foundTrial.other:', foundTrial.other);
              console.log('foundTrial.other_sources:', foundTrial.other_sources);
              console.log('otherSources array:', otherSources);
              console.log('otherSources count:', otherSources.length);
              console.log('First item sample:', otherSources[0]);
              
              const pipeline_data: any[] = [];
              const press_releases: any[] = [];
              const publications: any[] = [];
              const trial_registries: any[] = [];
              const associated_studies: any[] = [];
              
              otherSources.forEach((item: any, index: number) => {
                try {
                  console.log(`Processing item ${index}:`, item);
                  
                  // Handle two different formats:
                  // 1. API format: { id, trial_id, data: '{"type":"pipeline_data",...}' }
                  // 2. localStorage format: { pipeline_data: {...} } or { press_releases: {...} }, etc.
                  
                  let parsedData = null;
                  let itemType = null;
                  
                  // Check if this is localStorage format (has category key)
                  if (item.pipeline_data) {
                    itemType = 'pipeline_data';
                    parsedData = { type: 'pipeline_data', ...item.pipeline_data };
                  } else if (item.press_releases) {
                    itemType = 'press_releases';
                    parsedData = { type: 'press_releases', ...item.press_releases };
                  } else if (item.publications) {
                    itemType = 'publications';
                    parsedData = { type: 'publications', publicationType: item.publications.type, ...item.publications };
                  } else if (item.trial_registries) {
                    itemType = 'trial_registries';
                    parsedData = { type: 'trial_registries', ...item.trial_registries };
                  } else if (item.associated_studies) {
                    itemType = 'associated_studies';
                    parsedData = { type: 'associated_studies', studyType: item.associated_studies.type, ...item.associated_studies };
                  } else if (item.data) {
                    // API format - parse the data field
                    parsedData = item.data;
                    console.log(`Item ${index} data field (type: ${typeof parsedData}):`, parsedData);
                    
                    if (typeof parsedData === 'string') {
                      parsedData = JSON.parse(parsedData);
                      console.log(`Item ${index} parsed data:`, parsedData);
                    }
                    itemType = parsedData.type;
                  }
                  
                  console.log(`Item ${index} type: ${itemType}, parsed data:`, parsedData);
                  
                  if (!parsedData || !itemType) {
                    console.warn(`Item ${index} has unknown format, skipping`);
                    return;
                  }
                  
                  // Group by type
                  if (itemType === 'pipeline_data') {
                    pipeline_data.push({
                      id: item.id || parsedData.id || Date.now().toString(),
                      date: parsedData.date || "",
                      information: parsedData.information || "",
                      url: parsedData.url || "",
                      file: parsedData.file || "",
                      isVisible: parsedData.isVisible !== false
                    });
                  } else if (itemType === 'press_releases') {
                    press_releases.push({
                      id: item.id || parsedData.id || Date.now().toString(),
                      date: parsedData.date || "",
                      title: parsedData.title || "",
                      description: parsedData.description || "",
                      url: parsedData.url || "",
                      file: parsedData.file || "",
                      isVisible: parsedData.isVisible !== false
                    });
                  } else if (itemType === 'publications') {
                    publications.push({
                      id: item.id || parsedData.id || Date.now().toString(),
                      date: parsedData.date || "", // Add date field for Publication Date
                      type: parsedData.publicationType || parsedData.type || "",
                      title: parsedData.title || "",
                      description: parsedData.description || "",
                      url: parsedData.url || "",
                      file: parsedData.file || "",
                      isVisible: parsedData.isVisible !== false
                    });
                  } else if (itemType === 'trial_registries') {
                    trial_registries.push({
                      id: item.id || parsedData.id || Date.now().toString(),
                      date: parsedData.date || "", // Add date field for Registry Date
                      registry: parsedData.registry || "",
                      identifier: parsedData.identifier || "",
                      description: parsedData.description || "",
                      url: parsedData.url || "",
                      file: parsedData.file || "",
                      isVisible: parsedData.isVisible !== false
                    });
                  } else if (itemType === 'associated_studies') {
                    associated_studies.push({
                      id: item.id || parsedData.id || Date.now().toString(),
                      date: parsedData.date || "", // Add date field for Study Date
                      type: parsedData.studyType || parsedData.type || "",
                      title: parsedData.title || "",
                      description: parsedData.description || "",
                      url: parsedData.url || "",
                      file: parsedData.file || "",
                      isVisible: parsedData.isVisible !== false
                    });
                  }
                } catch (e) {
                  console.warn('Failed to parse other_source item:', e, item);
                }
              });
              
              console.log('Mapped other_sources:', {
                pipeline_data_count: pipeline_data.length,
                press_releases_count: press_releases.length,
                publications_count: publications.length,
                trial_registries_count: trial_registries.length,
                associated_studies_count: associated_studies.length
              });
              
              return {
              primary_endpoint_results: foundTrial.results?.[0]?.trial_outcome || "",
              secondary_endpoint_results: foundTrial.results?.[0]?.trial_results || [],
              safety_results: foundTrial.results?.[0]?.adverse_event_reported || "",
              efficacy_results: "",
              statistical_significance: "",
              adverse_events: foundTrial.results?.[0]?.adverse_event_type ? [foundTrial.results[0].adverse_event_type] : [],
              conclusion: "",
                pipeline_data,
                press_releases,
                publications,
                trial_registries,
                associated_studies,
              };
            })(),
            step5_8: (() => {
              // Parse notes - backend stores it as a single record with concatenated string
              const notesData = foundTrial.notes?.[0];
              console.log('Loading notes data:', {
                rawNotes: notesData,
                notesField: notesData?.notes
              });
              
              let parsedNotes: any[] = [];
              
              if (notesData && notesData.notes) {
                // Handle both string (from database) and array (from localStorage or already parsed) formats
                if (typeof notesData.notes === 'string') {
                  // Parse the concatenated string back into individual notes
                  // Format: "2024-01-01 (General): Note content - Source: http://...; 2024-01-02 (Update): ..."
                  const notesString = notesData.notes;
                  
                  if (notesString !== "No notes available") {
                    const noteParts = notesString.split('; ');
                    parsedNotes = noteParts.map((notePart: string, index: number) => {
                      // Improved parsing: split by " - Source: " first to separate content from source
                      const sourceMatch = notePart.match(/\s+-\s+Source:\s+(.+)$/);
                      let sourceLink = "";
                      let contentPart = notePart;
                      
                      if (sourceMatch) {
                        sourceLink = String(sourceMatch[1] || "").trim();
                        // Remove the source part from the notePart
                        contentPart = notePart.substring(0, notePart.lastIndexOf(' - Source:'));
                      }
                      
                      // Now extract date, type, and content
                      // Format: "DATE (TYPE): CONTENT"
                      // Use greedy match for content since we've already removed the source part
                      const match = contentPart.match(/^(.+?)\s+\((.+?)\):\s+(.+)$/);
                      
                      if (match && match.length >= 4) {
                        // Ensure all fields are strings
                        const date = String(match[1] || "").trim();
                        const type = String(match[2] || "General").trim();
                        const content = String(match[3] || "").trim();
                        
                        return {
                          id: `${index + 1}`,
                          date: date,
                          type: type,
                          content: content, // Content is already a string from match
                          sourceLink: sourceLink,
                          attachments: [],
                          isVisible: true
                        };
                      }
                      
                      // Fallback if regex doesn't match - try to parse manually
                      // Look for pattern: "DATE (TYPE): CONTENT"
                      const colonIndex = contentPart.indexOf(':');
                      if (colonIndex > 0) {
                        const beforeColon = contentPart.substring(0, colonIndex).trim();
                        const afterColon = contentPart.substring(colonIndex + 1).trim();
                        
                        const parenMatch = beforeColon.match(/^(.+?)\s+\((.+?)\)$/);
                        if (parenMatch) {
                          return {
                            id: `${index + 1}`,
                            date: String(parenMatch[1] || "").trim(),
                            type: String(parenMatch[2] || "General").trim(),
                            content: String(afterColon || "").trim(),
                            sourceLink: sourceLink,
                            attachments: [],
                            isVisible: true
                          };
                        }
                      }
                      
                      // Final fallback - treat entire notePart as content
                      return {
                        id: `${index + 1}`,
                        date: new Date().toISOString().split("T")[0],
                        type: "General",
                        content: String(notePart || "").trim(),
                        sourceLink: "",
                        attachments: [],
                        isVisible: true
                      };
                    });
                  }
                } else if (Array.isArray(notesData.notes)) {
                  // Notes are already in array format
                  parsedNotes = notesData.notes.map((note: any, index: number) => ({
                    id: note.id || `${index + 1}`,
                    date: String(note.date || new Date().toISOString().split("T")[0]),
                    type: String(note.type || "General"),
                    content: typeof note.content === 'string' ? note.content : (typeof note.content === 'object' ? JSON.stringify(note.content) : String(note.content || "")),
                    sourceLink: String(note.sourceLink || note.sourceUrl || ""),
                    attachments: Array.isArray(note.attachments) ? note.attachments : [],
                    isVisible: note.isVisible !== false
                  }));
                }
              }
              
              console.log('Parsed notes:', parsedNotes);
              
              // Load Full Review data from logs
              const logsData = foundTrial.logs?.[0];
              const fullReviewUser = logsData?.full_review_user || "";
              const nextReviewDate = logsData?.next_review_date || "";
              const fullReview = !!(fullReviewUser || nextReviewDate);
              
              // Helper function to format date from database (YYYY-MM-DD) to UI (MM-DD-YYYY)
              const formatDateForUI = (dateStr: string): string => {
                if (!dateStr) return "";
                
                try {
                  // Handle YYYY-MM-DD format (from database)
                  if (dateStr.includes('-') && dateStr.length === 10) {
                    const parts = dateStr.split('-');
                    if (parts.length === 3 && parts[0].length === 4) {
                      // Convert YYYY-MM-DD to MM-DD-YYYY
                      const [year, month, day] = parts;
                      return `${month}-${day}-${year}`;
                    }
                  }
                  
                  // Try to parse as Date object
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${month}-${day}-${year}`;
                  }
                  
                  return dateStr; // Return as-is if can't parse
                } catch (e) {
                  console.warn('Error formatting date for UI:', dateStr, e);
                  return dateStr;
                }
              };
              
              return {
                notes: parsedNotes,
              attachments: [],
              regulatory_links: [],
              publication_links: [],
              additional_resources: [],
                date_type: notesData?.date_type || "",
                link: notesData?.link || "",
                fullReview: fullReview,
                fullReviewUser: fullReviewUser,
                nextReviewDate: formatDateForUI(nextReviewDate),
              changesLog: [{
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                user: "admin",
                action: "loaded",
                details: "Trial loaded for editing",
                field: "trial",
                oldValue: "",
                newValue: "edit_mode",
                step: "step5_1",
                changeType: "creation"
              }],
              creationInfo: {
                createdDate: foundTrial.created_at || new Date().toISOString(),
                createdUser: foundTrial.created_by || "admin",
              },
              modificationInfo: {
                lastModifiedDate: foundTrial.updated_at || new Date().toISOString(),
                lastModifiedUser: foundTrial.updated_by || "admin",
                modificationCount: 0,
            },
              };
            })(),
          };
          
          dispatch({ type: "SET_TRIAL_DATA", payload: mappedData });
        } else {
          toast({
            title: "Trial Not Found",
            description: "The requested clinical trial could not be found.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "No Data Available",
          description: "No clinical trials data available.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading trial data:", error);
      toast({
        title: "Error",
        description: "Failed to load trial data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save trial function
  const saveTrial = async (trialId: string) => {
    try {
      setIsSaving(true);
      
      // Get user ID from localStorage
      const currentUserId = localStorage.getItem("userId");
      if (!currentUserId) {
        throw new Error("User ID not found. Please log in again.");
      }

      // Check if we have original trial data
      if (!originalTrial) {
        throw new Error("No trial data available for saving.");
      }

      // Helper to convert array to comma-separated string for API
      const arrayToString = (value: string | string[]): string => {
        if (Array.isArray(value)) {
          return value.filter(Boolean).join(", ");
        }
        return value || "";
      };

      // Prepare the update data for the overview (step5_1)
      // Convert array fields to comma-separated strings as expected by the backend
      const updateData = {
        user_id: currentUserId,
        therapeutic_area: arrayToString(formData.step5_1.therapeutic_area),
        trial_identifier: formData.step5_1.trial_identifier, // Keep as array
        trial_phase: formData.step5_1.trial_phase,
        status: formData.step5_1.status,
        primary_drugs: arrayToString(formData.step5_1.primary_drugs),
        other_drugs: arrayToString(formData.step5_1.other_drugs),
        title: formData.step5_1.title,
        disease_type: arrayToString(formData.step5_1.disease_type),
        patient_segment: arrayToString(formData.step5_1.patient_segment),
        line_of_therapy: arrayToString(formData.step5_1.line_of_therapy),
        reference_links: formData.step5_1.reference_links, // Keep as array
        trial_tags: arrayToString(formData.step5_1.trial_tags),
        sponsor_collaborators: arrayToString(formData.step5_1.sponsor_collaborators),
        sponsor_field_activity: arrayToString(formData.step5_1.sponsor_field_activity),
        associated_cro: arrayToString(formData.step5_1.associated_cro),
        countries: arrayToString(formData.step5_1.countries),
        region: arrayToString(formData.step5_1.region),
        trial_record_status: formData.step5_1.trial_record_status,
        updated_at: new Date().toISOString(),
      };

      console.log('Saving trial with data:', updateData);

      // Get the overview ID from the original trial
      const overviewId = originalTrial.overview?.id;
      if (!overviewId) {
        console.warn('No overview ID found, skipping API update and using localStorage only');
      }

      // Check if backend is reachable first
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      let backendAvailable = false;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for health check
        
        // Wrap health check in a promise that never rejects
        const healthCheckPromise = fetch(`${baseUrl}/api/v1/therapeutic/overview`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        }).catch(() => null); // Convert rejection to null
        
        const healthCheck = await healthCheckPromise;
        clearTimeout(timeoutId);
        
        if (healthCheck && healthCheck.ok) {
          backendAvailable = true;
        } else {
          console.warn('Backend health check failed, using localStorage only');
          backendAvailable = false;
        }
      } catch (healthError) {
        console.warn('Backend health check failed:', healthError);
        backendAvailable = false;
      }

      // Try API update if backend is available and we have an overview ID
      if (backendAvailable && overviewId) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          // Wrap fetch in a promise that never rejects
          const fetchPromise = fetch(`${baseUrl}/api/v1/therapeutic/overview/${overviewId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
            credentials: 'include',
            signal: controller.signal,
          }).catch(() => null); // Convert rejection to null

          const response = await fetchPromise;
          clearTimeout(timeoutId);

          if (response && response.ok) {
            // Update participation criteria via API
            try {
              console.log("=== SAVING PARTICIPATION CRITERIA DATA ===");
              const criteriaPayload = buildCriteriaPayload(formData);
              console.log("Participation criteria payload:", criteriaPayload);

              const criteriaResponse = await fetch(`${baseUrl}/api/v1/therapeutic/criteria/trial/${trialId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(criteriaPayload),
                credentials: "include",
              }).catch(() => null);

              if (criteriaResponse && criteriaResponse.ok) {
                console.log("Participation criteria updated successfully");
              } else {
                console.warn("Participation criteria update failed");
                if (criteriaResponse) {
                  const errorText = await criteriaResponse.text().catch(() => "Unknown error");
                  console.error("Criteria update error:", criteriaResponse.status, errorText);
                }
              }
            } catch (criteriaError) {
              console.warn("Participation criteria update threw error:", criteriaError);
            }

            // Update outcomes (step5_2) via API
            try {
              console.log("=== SAVING OUTCOMES DATA (step5_2) ===");
              console.log("formData.step5_2:", formData.step5_2);
              
              // Helper to convert array to proper format for API
              const arrayToJoinedString = (arr: string[]): string | null => {
                if (!arr || arr.length === 0) return null;
                const filtered = arr.filter(Boolean);
                return filtered.length > 0 ? filtered.join("\n") : null;
              };
              
              const outcomesPayload = {
                purpose_of_trial: formData.step5_2.purpose_of_trial || null,
                summary: formData.step5_2.summary || null,
                primary_outcome_measure: arrayToJoinedString(formData.step5_2.primaryOutcomeMeasures),
                other_outcome_measure: arrayToJoinedString(formData.step5_2.otherOutcomeMeasures),
                study_design_keywords: formData.step5_2.study_design_keywords && formData.step5_2.study_design_keywords.length > 0 
                  ? formData.step5_2.study_design_keywords.join(", ") 
                  : null,
                study_design: formData.step5_2.study_design || null,
                treatment_regimen: formData.step5_2.treatment_regimen || null,
                number_of_arms: formData.step5_2.number_of_arms ? parseInt(formData.step5_2.number_of_arms) : null,
              };
              
              console.log("Outcomes payload:", outcomesPayload);

              const outcomesResponse = await fetch(`${baseUrl}/api/v1/therapeutic/outcome/trial/${trialId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(outcomesPayload),
                credentials: "include",
              }).catch(() => null);

              if (outcomesResponse && outcomesResponse.ok) {
                console.log("Outcomes updated successfully");
              } else {
                console.warn("Outcomes update failed");
                if (outcomesResponse) {
                  const errorText = await outcomesResponse.text().catch(() => "Unknown error");
                  console.error("Outcomes update error:", outcomesResponse.status, errorText);
                }
              }
            } catch (outcomesError) {
              console.warn("Outcomes update threw error:", outcomesError);
            }

            // Also update the sites data if we have a trial_id
            const filteredReferences = formData.step5_6.references.filter((ref: any) => ref.isVisible && (ref.date || ref.content));
            const sitesData = {
              total: formData.step5_6.study_start_date ? parseInt(formData.step5_6.study_start_date) : 0,
              site_notes: filteredReferences.length > 0 ? JSON.stringify(filteredReferences) : null,
            };

            console.log('Updating sites with data:', sitesData);

            // Update sites section via API
            try {
              const sitesResponse = await fetch(`${baseUrl}/api/v1/therapeutic/sites/trial/${trialId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(sitesData),
                credentials: 'include',
              }).catch(() => null);
              
              if (sitesResponse && sitesResponse.ok) {
                console.log('Sites updated successfully');
              } else {
                console.warn('Sites update failed, but overview updated successfully');
              }
            } catch (sitesError) {
              console.warn('Sites update failed, but overview updated successfully');
            }

            // Update timing section via API
            try {
              console.log('=== SAVING TIMING DATA ===');
              console.log('formData.step5_4:', formData.step5_4);
              
              // SAVE TO LOCALSTORAGE FIRST (for immediate persistence)
              try {
                const storageKey = `trial_timing_${trialId}`;
                localStorage.setItem(storageKey, JSON.stringify({
                  ...formData.step5_4,
                  timestamp: new Date().toISOString(),
                }));
                console.log('💾 Saved Timing to localStorage during save:', storageKey);
              } catch (e) {
                console.warn('Failed to save Timing to localStorage:', e);
              }
              
              // Helper function to format date to YYYY-MM-DD for database
              const formatDateForDB = (dateStr: string): string | null => {
                if (!dateStr) return null;
                
                try {
                  // Handle MM-DD-YYYY format (from UI)
                  if (dateStr.includes('-') && dateStr.length === 10) {
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                      // Check if it's MM-DD-YYYY or YYYY-MM-DD
                      if (parts[0].length === 4) {
                        // Already YYYY-MM-DD
                        return dateStr;
                      } else {
                        // Convert MM-DD-YYYY to YYYY-MM-DD
                        const [month, day, year] = parts;
                        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                      }
                    }
                  }
                  
                  // Try to parse as Date object
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  }
                  
                  return dateStr; // Return as-is if can't parse
                } catch (e) {
                  console.warn('Error formatting date:', dateStr, e);
                  return dateStr;
                }
              };
              
              const filteredTimingReferences = formData.step5_4.references.filter((ref: any) => ref.isVisible && (ref.date || ref.content));
              const timingData = {
                start_date_actual: formatDateForDB(formData.step5_4.actual_start_date),
                start_date_benchmark: formatDateForDB(formData.step5_4.benchmark_start_date),
                start_date_estimated: formatDateForDB(formData.step5_4.estimated_start_date),
                inclusion_period_actual: formData.step5_4.actual_inclusion_period || null,
                inclusion_period_benchmark: formData.step5_4.benchmark_inclusion_period || null,
                inclusion_period_estimated: formData.step5_4.estimated_inclusion_period || null,
                enrollment_closed_actual: formatDateForDB(formData.step5_4.actual_enrollment_closed_date),
                enrollment_closed_benchmark: formatDateForDB(formData.step5_4.benchmark_enrollment_closed_date),
                enrollment_closed_estimated: formatDateForDB(formData.step5_4.estimated_enrollment_closed_date),
                primary_outcome_duration_actual: formData.step5_4.actual_primary_outcome_duration || null,
                primary_outcome_duration_benchmark: formData.step5_4.benchmark_primary_outcome_duration || null,
                primary_outcome_duration_estimated: formData.step5_4.estimated_primary_outcome_duration || null,
                trial_end_date_actual: formatDateForDB(formData.step5_4.actual_trial_end_date),
                trial_end_date_benchmark: formatDateForDB(formData.step5_4.benchmark_trial_end_date),
                trial_end_date_estimated: formatDateForDB(formData.step5_4.estimated_trial_end_date),
                result_duration_actual: formData.step5_4.actual_result_duration || null,
                result_duration_benchmark: formData.step5_4.benchmark_result_duration || null,
                result_duration_estimated: formData.step5_4.estimated_result_duration || null,
                result_published_date_actual: formatDateForDB(formData.step5_4.actual_result_published_date),
                result_published_date_benchmark: formatDateForDB(formData.step5_4.benchmark_result_published_date),
                result_published_date_estimated: formatDateForDB(formData.step5_4.estimated_result_published_date),
                overall_duration_complete: formData.step5_4.overall_duration_complete || null,
                overall_duration_publish: formData.step5_4.overall_duration_publish || null,
                timing_references: filteredTimingReferences.length > 0 ? filteredTimingReferences : null,
              };

              console.log('Updating timing with data:', timingData);
              console.log('Timing values to save:', {
                actual_inclusion_period: timingData.inclusion_period_actual,
                benchmark_inclusion_period: timingData.inclusion_period_benchmark,
                estimated_inclusion_period: timingData.inclusion_period_estimated,
                overall_duration_complete: timingData.overall_duration_complete,
                overall_duration_publish: timingData.overall_duration_publish,
              });

              const timingResponse = await fetch(`${baseUrl}/api/v1/therapeutic/timing/trial/${trialId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(timingData),
                credentials: 'include',
              }).catch(() => null);
              
              if (timingResponse && timingResponse.ok) {
                const responseData = await timingResponse.json().catch(() => null);
                console.log('Timing updated successfully. Response:', responseData);
              } else {
                console.warn('Timing update failed, but overview updated successfully');
                if (timingResponse) {
                  const errorText = await timingResponse.text().catch(() => 'Unknown error');
                  console.error('Timing update error:', timingResponse.status, errorText);
                }
              }
            } catch (timingError) {
              console.warn('Timing update failed:', timingError);
            }

            // Update results section via API
            try {
              console.log('=== SAVING RESULTS DATA ===');
              console.log('formData.step5_5:', formData.step5_5);
              console.log('Results Available:', formData.step5_5.results_available);
              console.log('Endpoints met:', formData.step5_5.endpoints_met);
              console.log('Adverse Events Reported:', formData.step5_5.adverse_events_reported);
              console.log('Trial Outcome Reference Date:', formData.step5_5.trial_outcome_reference_date);
              
              // SAVE TO LOCALSTORAGE FIRST (for immediate persistence)
              try {
                const storageKey = `trial_results_${trialId}`;
                localStorage.setItem(storageKey, JSON.stringify({
                  ...formData.step5_5,
                  timestamp: new Date().toISOString(),
                }));
                console.log('💾 Saved Results to localStorage during save:', storageKey);
              } catch (e) {
                console.warn('Failed to save to localStorage:', e);
              }
              
              const filteredSiteNotes = formData.step5_5.site_notes.filter((note: any) => note.isVisible && (note.date || note.content));
              const resultsData = {
                results_available: formData.step5_5.results_available ? 'Yes' : 'No',
                endpoints_met: formData.step5_5.endpoints_met ? 'Yes' : 'No',
                trial_outcome: formData.step5_5.trial_outcome || null,
                reference: formData.step5_5.trial_outcome_reference_date || null,
                trial_outcome_content: formData.step5_5.trial_outcome_content || null,
                trial_outcome_link: formData.step5_5.trial_outcome_link || null,
                trial_outcome_attachment: formData.step5_5.trial_outcome_attachment || null,
                trial_results: formData.step5_5.trial_results.length > 0 ? formData.step5_5.trial_results : null,
                adverse_event_reported: formData.step5_5.adverse_event_reported || null,
                adverse_event_type: formData.step5_5.adverse_event_type || null,
                treatment_for_adverse_events: formData.step5_5.treatment_for_adverse_events || null,
                site_notes: filteredSiteNotes.length > 0 ? JSON.stringify(filteredSiteNotes) : null,
              };

              console.log('Results data to be saved to API:', resultsData);

              const resultsResponse = await fetch(`${baseUrl}/api/v1/therapeutic/results/trial/${trialId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(resultsData),
                credentials: 'include',
              }).catch(() => null);
              
              if (resultsResponse && resultsResponse.ok) {
                const responseData = await resultsResponse.json().catch(() => null);
                console.log('Results updated successfully. Response:', responseData);
              } else {
                console.warn('Results update failed, but overview updated successfully');
                if (resultsResponse) {
                  const errorText = await resultsResponse.text().catch(() => 'Unknown error');
                  console.error('Results update error:', resultsResponse.status, errorText);
                }
              }
            } catch (resultsError) {
              console.warn('Results update failed:', resultsError);
            }

            // Small delay to ensure database transaction completes
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Force reload trial data to show updated results
            await loadTrialData(trialId);

            // Update other_sources section via API
            try {
              console.log('=== OTHER SOURCES SAVE DEBUG ===');
              console.log('step5_7 data:', {
                pipeline_data: formData.step5_7.pipeline_data,
                press_releases: formData.step5_7.press_releases,
                publications: formData.step5_7.publications,
                trial_registries: formData.step5_7.trial_registries,
                associated_studies: formData.step5_7.associated_studies
              });
              
              // SAVE TO LOCALSTORAGE FIRST (for immediate persistence)
              try {
                const storageKey = `trial_other_sources_${trialId}`;
                localStorage.setItem(storageKey, JSON.stringify({
                  ...formData.step5_7,
                  timestamp: new Date().toISOString(),
                }));
                console.log('💾 Saved Other Sources to localStorage during save:', storageKey);
              } catch (e) {
                console.warn('Failed to save Other Sources to localStorage:', e);
              }
              
              // Delete existing other_sources entries
              const deleteResponse = await fetch(`${baseUrl}/api/v1/therapeutic/other/trial/${trialId}`, {
                method: 'DELETE',
                credentials: 'include',
              }).catch(() => null);
              
              console.log('Deleted existing other_sources, response:', deleteResponse?.status);

              // Create new entries for each category with visible items
              const otherSourcesPromises: Promise<Response | null>[] = [];
              
              if (formData.step5_7.pipeline_data && formData.step5_7.pipeline_data.length > 0) {
                const filteredItems = formData.step5_7.pipeline_data
                  .filter((item: any) => item.isVisible && (item.date || item.information || item.url || item.file));
                
                console.log('Pipeline data to save:', filteredItems);
                
                filteredItems.forEach((item: any) => {
                    const sourceData = {
                      type: 'pipeline_data',
                      date: item.date,
                      information: item.information,
                      url: item.url,
                      file: item.file
                    };
                    
                    console.log('Creating pipeline_data entry:', sourceData);
                    
                    otherSourcesPromises.push(
                      fetch(`${baseUrl}/api/v1/therapeutic/other`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          trial_id: trialId,
                          data: JSON.stringify(sourceData)
                        }),
                        credentials: 'include',
                      }).then(res => {
                        console.log('Pipeline data POST response:', res?.status);
                        return res;
                      }).catch(err => {
                        console.error('Pipeline data POST error:', err);
                        return null;
                      })
                    );
                  });
              }

              if (formData.step5_7.press_releases && formData.step5_7.press_releases.length > 0) {
                const filteredItems = formData.step5_7.press_releases
                  .filter((item: any) => item.isVisible && (item.date || item.title || item.url || item.file));
                
                console.log('Press releases to save:', filteredItems);
                
                filteredItems.forEach((item: any) => {
                    const sourceData = {
                      type: 'press_releases',
                      date: item.date,
                      title: item.title,
                      description: item.description,
                      url: item.url,
                      file: item.file
                    };
                    
                    console.log('Creating press_releases entry:', sourceData);
                    
                    otherSourcesPromises.push(
                      fetch(`${baseUrl}/api/v1/therapeutic/other`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          trial_id: trialId,
                          data: JSON.stringify(sourceData)
                        }),
                        credentials: 'include',
                      }).then(res => {
                        console.log('Press releases POST response:', res?.status);
                        return res;
                      }).catch(err => {
                        console.error('Press releases POST error:', err);
                        return null;
                      })
                    );
                  });
              }

              if (formData.step5_7.publications && formData.step5_7.publications.length > 0) {
                const filteredItems = formData.step5_7.publications
                  .filter((item: any) => item.isVisible && (item.type || item.title || item.url || item.file));
                
                console.log('Publications to save:', filteredItems);
                
                filteredItems.forEach((item: any) => {
                    const sourceData = {
                      type: 'publications',
                      date: item.date,
                      publicationType: item.type,
                      title: item.title,
                      description: item.description,
                      url: item.url,
                      file: item.file
                    };
                    
                    console.log('Creating publications entry:', sourceData);
                    
                    otherSourcesPromises.push(
                      fetch(`${baseUrl}/api/v1/therapeutic/other`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          trial_id: trialId,
                          data: JSON.stringify(sourceData)
                        }),
                        credentials: 'include',
                      }).then(res => {
                        console.log('Publications POST response:', res?.status);
                        return res;
                      }).catch(err => {
                        console.error('Publications POST error:', err);
                        return null;
                      })
                    );
                  });
              }

              if (formData.step5_7.trial_registries && formData.step5_7.trial_registries.length > 0) {
                const filteredItems = formData.step5_7.trial_registries
                  .filter((item: any) => item.isVisible && (item.registry || item.identifier || item.url || item.file));
                
                console.log('Trial registries to save:', filteredItems);
                
                filteredItems.forEach((item: any) => {
                    const sourceData = {
                      type: 'trial_registries',
                      date: item.date,
                      registry: item.registry,
                      identifier: item.identifier,
                      description: item.description,
                      url: item.url,
                      file: item.file
                    };
                    
                    console.log('Creating trial_registries entry:', sourceData);
                    
                    otherSourcesPromises.push(
                      fetch(`${baseUrl}/api/v1/therapeutic/other`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          trial_id: trialId,
                          data: JSON.stringify(sourceData)
                        }),
                        credentials: 'include',
                      }).then(res => {
                        console.log('Trial registries POST response:', res?.status);
                        return res;
                      }).catch(err => {
                        console.error('Trial registries POST error:', err);
                        return null;
                      })
                    );
                  });
              }

              if (formData.step5_7.associated_studies && formData.step5_7.associated_studies.length > 0) {
                const filteredItems = formData.step5_7.associated_studies
                  .filter((item: any) => item.isVisible && (item.type || item.title || item.url || item.file));
                
                console.log('Associated studies to save:', filteredItems);
                
                filteredItems.forEach((item: any) => {
                    const sourceData = {
                      type: 'associated_studies',
                      date: item.date,
                      studyType: item.type,
                      title: item.title,
                      description: item.description,
                      url: item.url,
                      file: item.file
                    };
                    
                    console.log('Creating associated_studies entry:', sourceData);
                    
                    otherSourcesPromises.push(
                      fetch(`${baseUrl}/api/v1/therapeutic/other`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          trial_id: trialId,
                          data: JSON.stringify(sourceData)
                        }),
                        credentials: 'include',
                      }).then(res => {
                        console.log('Associated studies POST response:', res?.status);
                        return res;
                      }).catch(err => {
                        console.error('Associated studies POST error:', err);
                        return null;
                      })
                    );
                  });
              }

              // Wait for all other_sources updates to complete
              console.log(`Total other_sources requests to process: ${otherSourcesPromises.length}`);
              const results = await Promise.all(otherSourcesPromises);
              const successCount = results.filter(r => r && r.ok).length;
              console.log(`Other sources updated: ${successCount}/${otherSourcesPromises.length} successful`);
              console.log('=== END OTHER SOURCES SAVE DEBUG ===');
            } catch (otherError) {
              console.warn('Other sources update failed, but overview updated successfully');
            }

            // Update logs (Full Review data)
            try {
              console.log('Updating logs for trial:', trialId);
              
              // Helper function to format date from MM-DD-YYYY to YYYY-MM-DD for database
              const formatDateForDB = (dateStr: string): string | null => {
                if (!dateStr) return null;
                
                try {
                  // Handle MM-DD-YYYY format (from UI)
                  if (dateStr.includes('-') && dateStr.length === 10) {
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                      // Check if it's MM-DD-YYYY or YYYY-MM-DD
                      if (parts[0].length === 4) {
                        // Already YYYY-MM-DD
                        return dateStr;
                      } else {
                        // Convert MM-DD-YYYY to YYYY-MM-DD
                        const [month, day, year] = parts;
                        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                      }
                    }
                  }
                  
                  // Try to parse as Date object
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  }
                  
                  return dateStr; // Return as-is if can't parse
                } catch (e) {
                  console.warn('Error formatting date:', dateStr, e);
                  return dateStr;
                }
              };
              
              // Get current user ID
              const currentUserId = localStorage.getItem("userId") || "admin";
              
              // Prepare logs data
              const logsData = {
                last_modified_date: new Date().toISOString(),
                last_modified_user: currentUserId,
                full_review_user: formData.step5_8.fullReviewUser || null,
                next_review_date: formatDateForDB(formData.step5_8.nextReviewDate),
              };
              
              console.log('Updating logs with data:', logsData);
              
              const logsResponse = await fetch(`${baseUrl}/api/v1/therapeutic/logs/trial/${trialId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logsData),
                credentials: 'include',
              }).catch(() => null);
              
              if (logsResponse && logsResponse.ok) {
                console.log('Logs updated successfully');
              } else {
                console.warn('Logs update failed, but other updates succeeded');
                if (logsResponse) {
                  const errorText = await logsResponse.text().catch(() => 'Unknown error');
                  console.error('Logs update error:', logsResponse.status, errorText);
                }
              }
            } catch (logsError) {
              console.warn('Logs update failed:', logsError);
            }

            // Update notes
            try {
              console.log('Updating notes for trial:', trialId);
              
              // First, delete existing notes
              await fetch(`${baseUrl}/api/v1/therapeutic/notes/trial/${trialId}`, {
                method: 'DELETE',
                credentials: 'include',
              }).catch(() => console.log('No existing notes to delete'));

              // Then create new notes if there are any visible notes
              const visibleNotes = formData.step5_8.notes.filter((note: any) => {
                // Ensure content is a string and not empty
                const content = typeof note.content === 'string' ? note.content : 
                  (note.content && typeof note.content === 'object' ? JSON.stringify(note.content) : String(note.content || ""));
                return note.isVisible && content && content.trim().length > 0;
              });
              
              if (visibleNotes.length > 0) {
                // Convert notes array into a single concatenated string (like in create form)
                const notesString = visibleNotes
                  .map(note => {
                    // Ensure content is always a string
                    const content = typeof note.content === 'string' ? note.content : 
                      (note.content && typeof note.content === 'object' ? JSON.stringify(note.content) : String(note.content || ""));
                    const date = String(note.date || "");
                    const type = String(note.type || "General");
                    const sourceLink = String(note.sourceLink || "");
                    return `${date} (${type}): ${content}${sourceLink ? ` - Source: ${sourceLink}` : ""}`;
                  })
                  .join("; ");
                
                const attachmentsArray = visibleNotes
                  .filter((note: any) => note.attachments && note.attachments.length > 0)
                  .flatMap((note: any) => note.attachments);
                
                const notesPayload = {
                  trial_id: trialId,
                  date_type: formData.step5_8.date_type || null,
                  notes: notesString,
                  link: formData.step5_8.link || null,
                  attachments: attachmentsArray.length > 0 ? JSON.stringify(attachmentsArray) : null
                };
                
                console.log('Creating new notes:', notesPayload);
                
                await fetch(`${baseUrl}/api/v1/therapeutic/notes`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(notesPayload),
                  credentials: 'include',
                });
                
                console.log('Notes updated successfully');
              } else {
                console.log('No visible notes to save');
              }
            } catch (notesError) {
              console.warn('Notes update failed:', notesError);
            }

            // Clear the localStorage update flag to ensure fresh data on next load
            localStorage.removeItem(`trial_updated_${trialId}`);
            
            // Small delay to ensure database transaction completes
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Force reload the trial data to show the updated values
            await loadTrialData(trialId);
            
            toast({
              title: "Success",
              description: "Clinical trial updated successfully! Changes have been saved to the database.",
            });
            
            // Trigger refresh event for the main page
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('refreshFromEdit'));
            }
            return;
          } else if (response) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.warn('API update failed:', response.status, errorText);
            console.warn('API update failed, falling back to localStorage');
          } else {
            console.warn('API request failed, falling back to localStorage');
          }
        } catch (error) {
          // This should never happen now, but just in case
          console.warn('API update failed, falling back to localStorage');
        }
      }

      // Fallback: Update localStorage
      const filteredReferencesForLocalStorage = formData.step5_6.references.filter((ref: any) => ref.isVisible && (ref.date || ref.content));
      
      // Prepare other_sources data for localStorage
      const otherSourcesForLocalStorage: any[] = [];
      if (formData.step5_7.pipeline_data) {
        formData.step5_7.pipeline_data
          .filter((item: any) => item.isVisible && (item.date || item.information || item.url))
          .forEach((item: any) => {
            otherSourcesForLocalStorage.push({ pipeline_data: item });
          });
      }
      if (formData.step5_7.press_releases) {
        formData.step5_7.press_releases
          .filter((item: any) => item.isVisible && (item.date || item.title || item.url))
          .forEach((item: any) => {
            otherSourcesForLocalStorage.push({ press_releases: item });
          });
      }
      if (formData.step5_7.publications) {
        formData.step5_7.publications
          .filter((item: any) => item.isVisible && (item.type || item.title || item.url))
          .forEach((item: any) => {
            otherSourcesForLocalStorage.push({ publications: item });
          });
      }
      if (formData.step5_7.trial_registries) {
        formData.step5_7.trial_registries
          .filter((item: any) => item.isVisible && (item.registry || item.identifier || item.url))
          .forEach((item: any) => {
            otherSourcesForLocalStorage.push({ trial_registries: item });
          });
      }
      if (formData.step5_7.associated_studies) {
        formData.step5_7.associated_studies
          .filter((item: any) => item.isVisible && (item.type || item.title || item.url))
          .forEach((item: any) => {
            otherSourcesForLocalStorage.push({ associated_studies: item });
          });
      }
      
      // Prepare notes for localStorage (convert to concatenated string format)
      const visibleNotes = formData.step5_8.notes.filter((note: any) => note.isVisible && note.content);
      const notesString = visibleNotes.length > 0
        ? visibleNotes.map(note => `${note.date} (${note.type}): ${note.content}${note.sourceLink ? ` - Source: ${note.sourceLink}` : ""}`).join("; ")
        : "No notes available";
      
      // Prepare timing references for localStorage
      const filteredTimingReferences = formData.step5_4.references.filter((ref: any) => ref.isVisible && (ref.date || ref.content));
      
      const updatedTrial = {
        ...originalTrial,
        overview: {
          ...originalTrial.overview,
          ...formData.step5_1,
          updated_at: new Date().toISOString(),
        },
        outcomes: [formData.step5_2],
        criteria: [formData.step5_3],
        timing: [{
          ...formData.step5_4,
          timing_references: filteredTimingReferences,
        }],
        results: [{
          ...formData.step5_5,
          site_notes: formData.step5_5.site_notes.filter((note: any) => note.isVisible && (note.date || note.content)),
        }],
        sites: [{
          total: formData.step5_6.study_start_date ? parseInt(formData.step5_6.study_start_date) : 0,
          site_notes: filteredReferencesForLocalStorage,
        }],
        other_sources: otherSourcesForLocalStorage,
        notes: [{
          date_type: formData.step5_8.date_type,
          notes: notesString,
          link: formData.step5_8.link,
          attachments: visibleNotes
            .filter((note: any) => note.attachments && note.attachments.length > 0)
            .flatMap((note: any) => note.attachments)
        }],
      };
      
      console.log('Updating localStorage with trial data:', updatedTrial);

      // Update localStorage safely
      try {
        const existingTrials = JSON.parse(localStorage.getItem('therapeuticTrials') || '[]');
        const updatedTrials = existingTrials.map((t: any) => 
          t.trial_id === trialId ? updatedTrial : t
        );
        localStorage.setItem('therapeuticTrials', JSON.stringify(updatedTrials));
        
        // Store update flag
        localStorage.setItem(`trial_updated_${trialId}`, new Date().toISOString());
      } catch (localStorageError) {
        console.error('Error updating localStorage:', localStorageError);
        // Continue anyway, the main functionality should still work
      }
      
      toast({
        title: "Success",
        description: "Clinical trial updated successfully! Changes are saved locally and visible immediately.",
      });

      // Trigger refresh event for the main page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshFromEdit'));
      }

    } catch (error) {
      console.error("Error saving trial:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to save changes: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Safe wrapper for saveTrial to prevent any errors from breaking the app
  const safeSaveTrial = async (trialId: string) => {
    try {
      await saveTrial(trialId);
    } catch (error) {
      console.error("Unexpected error in saveTrial:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load trial data on mount
  useEffect(() => {
    if (trialId) {
      loadTrialData(trialId);
    }
  }, [trialId]);

  const updateField = (step: keyof EditTherapeuticFormData, field: string, value: any) => {
    const oldValue = (formData[step] as any)[field];
    
    dispatch({ type: "UPDATE_FIELD", step, field, value });
    
    // Log the field update
    setTimeout(() => {
      const newLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: "admin",
        action: "changed",
        details: `Updated ${field}`,
        field,
        oldValue: typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue),
        newValue: typeof value === 'string' ? value : JSON.stringify(value),
        step,
        changeType: "field_change" as const,
      };
      
      const changesArray = (formData.step5_8 as any).changesLog || [];
      dispatch({
        type: "UPDATE_FIELD",
        step: "step5_8",
        field: "changesLog",
        value: [...changesArray, newLogEntry],
      });
    }, 0);
  };

  const addArrayItem = (step: keyof EditTherapeuticFormData, field: string, value: any) => {
    dispatch({ type: "ADD_ARRAY_ITEM", step, field, value });
    
    // Log the array addition
    setTimeout(() => {
      const currentArray = (formData[step] as any)[field] as any[];
      const newLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: "admin",
        action: "added",
        details: `Added item to ${field}`,
        field,
        oldValue: "",
        newValue: typeof value === 'string' ? value : JSON.stringify(value),
        step,
        changeType: "content_addition" as const,
      };
      
      const changesArray = (formData.step5_8 as any).changesLog || [];
      dispatch({
        type: "UPDATE_FIELD",
        step: "step5_8",
        field: "changesLog",
        value: [...changesArray, newLogEntry],
      });
    }, 0);
  };

  const removeArrayItem = (step: keyof EditTherapeuticFormData, field: string, index: number) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const removedItem = currentArray[index];
    
    dispatch({ type: "REMOVE_ARRAY_ITEM", step, field, index });
    
    // Log the array removal
    setTimeout(() => {
      const newLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: "admin",
        action: "removed",
        details: `Removed item from ${field}`,
        field,
        oldValue: typeof removedItem === 'string' ? removedItem : JSON.stringify(removedItem),
        newValue: "",
        step,
        changeType: "content_removal" as const,
      };
      
      const changesArray = (formData.step5_8 as any).changesLog || [];
      dispatch({
        type: "UPDATE_FIELD",
        step: "step5_8",
        field: "changesLog",
        value: [...changesArray, newLogEntry],
      });
    }, 0);
  };

  const updateArrayItem = (step: keyof EditTherapeuticFormData, field: string, index: number, value: any) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const oldValue = currentArray[index];
    
    dispatch({ type: "UPDATE_ARRAY_ITEM", step, field, index, value });
    
    // Log the array update
    setTimeout(() => {
      const newLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: "admin",
        action: "changed",
        details: `Updated item in ${field}`,
        field,
        oldValue: typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue),
        newValue: typeof value === 'string' ? value : JSON.stringify(value),
        step,
        changeType: "field_change" as const,
      };
      
      const changesArray = (formData.step5_8 as any).changesLog || [];
      dispatch({
        type: "UPDATE_FIELD",
        step: "step5_8",
        field: "changesLog",
        value: [...changesArray, newLogEntry],
      });
    }, 0);
  };

  // Reference management functions
  const addReference = (step: keyof EditTherapeuticFormData, field: string) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const newReference = {
      id: Date.now().toString(),
      date: "",
      registryType: "",
      content: "",
      viewSource: "",
      attachments: [],
      isVisible: true,
    };
    dispatch({ type: "ADD_ARRAY_ITEM", step, field, value: newReference });
  };

  const removeReference = (step: keyof EditTherapeuticFormData, field: string, index: number) => {
    dispatch({ type: "REMOVE_ARRAY_ITEM", step, field, index });
  };

  const updateReference = (step: keyof EditTherapeuticFormData, field: string, index: number, updates: any) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const updatedReference = { ...currentArray[index], ...updates };
    dispatch({ type: "UPDATE_ARRAY_ITEM", step, field, index, value: updatedReference });
  };

  // Note management functions
  const addNote = (step: keyof EditTherapeuticFormData, field: string) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const newNote = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      type: "General",
      content: "",
      sourceLink: "",
      attachments: [],
      isVisible: true,
    };
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: [...currentArray, newNote],
    });
  };

  const updateNote = (
    step: keyof EditTherapeuticFormData,
    field: string,
    index: number,
    updates: Partial<any>
  ) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const updatedArray = currentArray.map((item, idx) =>
      idx === index ? { ...item, ...updates } : item
    );
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: updatedArray,
    });
  };

  const removeNote = (
    step: keyof EditTherapeuticFormData,
    field: string,
    index: number
  ) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const updatedArray = currentArray.filter((_, idx) => idx !== index);
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: updatedArray,
    });
  };

  const toggleNoteVisibility = (
    step: keyof EditTherapeuticFormData,
    field: string,
    index: number
  ) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const updatedArray = currentArray.map((item, idx) =>
      idx === index ? { ...item, isVisible: !item.isVisible } : item
    );
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: updatedArray,
    });
  };

  const value: EditTherapeuticFormContextType = {
    formData,
    updateField,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    addReference,
    removeReference,
    updateReference,
    addNote,
    updateNote,
    removeNote,
    toggleNoteVisibility,
    saveTrial: safeSaveTrial,
    loadTrialData,
    isLoading,
    isSaving,
  };

  return (
    <EditTherapeuticFormContext.Provider value={value}>
      {children}
    </EditTherapeuticFormContext.Provider>
  );
}

// Hook to use the context
export function useEditTherapeuticForm() {
  const context = useContext(EditTherapeuticFormContext);
  if (context === undefined) {
    throw new Error("useEditTherapeuticForm must be used within an EditTherapeuticFormProvider");
  }
  return context;
}
