"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/app/_lib/api";

const parseVolunteerNumber = (value: unknown): string | null => {
  console.log("[EditTherapeuticFormContext] parseVolunteerNumber input:", value);
  if (value === null || value === undefined) {
    return null;
  }

  const normalized =
    typeof value === "string" ? value.replace(/,/g, "").trim() : String(value).trim();

  if (normalized === "") {
    return null;
  }

  // Return as string to match database TEXT type
  return normalized;
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

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : parseInt(String(value).trim(), 10);

  if (!Number.isFinite(parsed)) {
    console.log("[EditTherapeuticFormContext] toNullableNumber: Non-numeric input", { value, parsed });
    return null;
  }

  return parsed;
};

const parseAgeField = (value: unknown): string[] => {
  console.log('[parseAgeField] Input value:', value, 'Type:', typeof value);

  if (value === null || value === undefined) {
    console.log('[parseAgeField] Value is null/undefined, returning default');
    return ["", "Years"];
  }

  const str = String(value).trim();
  if (!str || str === "null" || str === "undefined") {
    console.log('[parseAgeField] String is empty or null-like, returning default');
    return ["", "Years"];
  }

  console.log('[parseAgeField] Processing string:', str);

  // Handle comma-separated format (e.g., "10,years" or "10, years")
  // Also handle space-separated format (e.g., "10 Years" or "10  Years")
  let parts: string[] = [];

  // First try comma separation (database format: "10,years")
  if (str.includes(',')) {
    parts = str.split(',').map(p => p.trim()).filter(Boolean);
    console.log('[parseAgeField] Split by comma:', parts);
  } else {
    // Try space separation (UI format: "10 Years")
    parts = str.split(/\s+/).filter(Boolean);
    console.log('[parseAgeField] Split by space:', parts);
  }

  if (parts.length >= 2) {
    // value is first part, unit is the rest (capitalize first letter of unit)
    const ageValue = parts[0];
    const ageUnit = parts.slice(1).join(" ").trim();
    // Capitalize first letter and lowercase the rest for consistency
    const formattedUnit = ageUnit
      ? ageUnit.charAt(0).toUpperCase() + ageUnit.slice(1).toLowerCase()
      : "Years";
    const result = [ageValue, formattedUnit];
    console.log('[parseAgeField] Returning parsed result:', result);
    return result;
  }

  // If only one part, check if it's a number
  if (parts.length === 1) {
    const singlePart = parts[0];
    // If it's a number, use it as the value with default "Years" unit
    if (/^\d+$/.test(singlePart)) {
      const result = [singlePart, "Years"];
      console.log('[parseAgeField] Returning number with default unit:', result);
      return result;
    }
    // Otherwise, treat the whole string as the value with default unit
    const result = [singlePart, "Years"];
    console.log('[parseAgeField] Returning single value with default unit:', result);
    return result;
  }

  // Fallback: return empty with default unit
  const result = ["", "Years"];
  console.log('[parseAgeField] Returning fallback default:', result);
  return result;
};

const joinAgeField = (value: string[] | string): string | null => {
  if (Array.isArray(value)) {
    if (!value[0]) return null;
    return `${value[0]} ${value[1] || "Years"}`.trim();
  }
  return toNullableString(value);
};

const buildCriteriaPayload = (formData: EditTherapeuticFormData) => {
  console.log("[EditTherapeuticFormContext] buildCriteriaPayload source:", {
    step5_3: formData.step5_3,
    step5_4: formData.step5_4,
  });

  const criteria = formData.step5_3;

  const payload = {
    inclusion_criteria: toNullableString(joinArrayToString(criteria.inclusion_criteria, "; ")),
    exclusion_criteria: toNullableString(joinArrayToString(criteria.exclusion_criteria, "; ")),
    age_from: joinAgeField(criteria.age_min),
    age_to: joinAgeField(criteria.age_max),
    sex: toNullableString(criteria.gender),
    healthy_volunteers: toNullableString(criteria.healthy_volunteers?.[0]),
    subject_type: toNullableString(criteria.subject_type),
    target_no_volunteers: (() => {
      const value = criteria.target_no_volunteers ?? formData.step5_4.estimated_enrollment;
      console.log('[buildCriteriaPayload] target_no_volunteers value:', value, 'Type:', typeof value);
      const result = parseVolunteerNumber(value);
      console.log('[buildCriteriaPayload] target_no_volunteers parsed:', result);
      return result;
    })(),
    actual_enrolled_volunteers: (() => {
      const value = criteria.actual_enrolled_volunteers ?? formData.step5_4.actual_enrollment;
      console.log('[buildCriteriaPayload] actual_enrolled_volunteers value:', value, 'Type:', typeof value);
      const result = parseVolunteerNumber(value);
      console.log('[buildCriteriaPayload] actual_enrolled_volunteers parsed:', result);
      return result;
    })(),
  };

  console.log("[EditTherapeuticFormContext] buildCriteriaPayload output:", payload);

  return payload;
};

const parseOutcomeMeasureField = (rawValue: unknown): string[] => {
  console.log("[EditTherapeuticFormContext] parseOutcomeMeasureField input:", rawValue);

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

  // Use ||| as delimiter to support newlines within a single item
  if (trimmedValue.includes("|||")) {
    return trimmedValue.split("|||").map((value) => value.trim()).filter(Boolean);
  }

  // Treat as single item even if it has newlines (User Request: "content even in para with /n should take as 1 div")
  return [trimmedValue];
};

const buildOutcomePayload = (formData: EditTherapeuticFormData) => {
  console.log("[EditTherapeuticFormContext] buildOutcomePayload source:", formData.step5_2);

  const outcome = formData.step5_2;
  // Ensure we join arrays with special delimiter ||| to allow newlines within items
  const primaryMeasure = Array.isArray(outcome.primaryOutcomeMeasures)
    ? outcome.primaryOutcomeMeasures.join("|||")
    : outcome.primaryOutcomeMeasures;

  // Ensure we join arrays with special delimiter ||| to allow newlines within items
  const otherMeasure = Array.isArray(outcome.otherOutcomeMeasures)
    ? outcome.otherOutcomeMeasures.join("|||")
    : outcome.otherOutcomeMeasures;


  const payload = {
    purpose_of_trial: toNullableString(outcome.purpose_of_trial),
    summary: toNullableString(outcome.summary),
    primary_outcome_measure: toNullableString(primaryMeasure),
    other_outcome_measure: toNullableString(otherMeasure),
    study_design_keywords: toNullableString(joinArrayToString(outcome.study_design_keywords, ", ")),
    study_design: toNullableString(outcome.study_design),
    treatment_regimen: toNullableString(outcome.treatment_regimen),
    number_of_arms: toNullableNumber(outcome.number_of_arms),
  };

  console.log("[EditTherapeuticFormContext] buildOutcomePayload output:", payload);

  return payload;
};

const clearTrialDrafts = (trialId: string) => {
  if (!trialId) return;
  try {
    console.log("[EditTherapeuticFormContext] Clearing localStorage drafts for trial:", trialId);
    localStorage.removeItem(`trial_timing_${trialId}`);
    localStorage.removeItem(`trial_results_${trialId}`);
    localStorage.removeItem(`trial_other_sources_${trialId}`);
    localStorage.removeItem(`trial_sites_${trialId}`);
    localStorage.removeItem(`trial_db_saved_${trialId}`);
    localStorage.removeItem(`trial_updated_${trialId}`);

    const existingTrials = JSON.parse(localStorage.getItem("therapeuticTrials") || "[]");
    if (Array.isArray(existingTrials) && existingTrials.length > 0) {
      const filtered = existingTrials.filter(
        (trial: any) =>
          trial.trial_id !== trialId &&
          trial.overview?.id !== trialId &&
          trial.id !== trialId
      );
      if (filtered.length !== existingTrials.length) {
        localStorage.setItem("therapeuticTrials", JSON.stringify(filtered));
      }
    }
  } catch (error) {
    console.warn("[EditTherapeuticFormContext] Failed to clear drafts:", error);
  }
};

// Define the complete form structure for editing
export interface EditTherapeuticFormData {
  // Step 5-1: Trial Overview
  step5_1: {
    therapeutic_area: string | string[];
    trial_identifier: string[];
    trial_phase: string;
    status: string;
    primary_drugs: string | string[];
    other_drugs: string | string[];
    title: string;
    disease_type: string | string[];
    patient_segment: string | string[];
    line_of_therapy: string | string[];
    reference_links: string[];
    trial_tags: string | string[];
    sponsor_collaborators: string | string[];
    sponsor_field_activity: string | string[];
    associated_cro: string | string[];
    countries: string | string[];
    region: string | string[];
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
    age_min: string[];
    age_max: string[];
    gender: string;
    healthy_volunteers: string[]; // Used for healthy_volunteers (healthy_volunteers[0])
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
    // Calculator data fields
    durationConverterData: {
      duration: string;
      frequency: string;
      outputMonths: string;
    };
    enhancedCalculatorData: {
      date: string;
      duration: string;
      frequency: string;
      outputDate: string;
    };
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
    total_sites: string;
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
      fileUrl?: string; // New field for attachment URL
      isVisible: boolean;
    }>;
    press_releases: Array<{
      id: string;
      date: string;
      title: string;
      description: string;
      url: string;
      file: string;
      fileUrl?: string;
      isVisible: boolean;
    }>;
    publications: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      url: string;
      file: string;
      fileUrl?: string;
      isVisible: boolean;
    }>;
    trial_registries: Array<{
      id: string;
      registry: string;
      identifier: string;
      description: string;
      url: string;
      file: string;
      fileUrl?: string;
      isVisible: boolean;
    }>;
    associated_studies: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      url: string;
      file: string;
      fileUrl?: string;
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
      sourceType?: string;
      sourceUrl?: string;
      attachments?: Array<{
        name: string;
        url: string;
        type: string;
      }>;
      isVisible: boolean;
    }>;
    attachments: string[];
    regulatory_links: string[];
    publication_links: string[];
    additional_resources: string[];
    date_type: string;
    link: string;
    internalNote?: string;
    logsAttachments?: Array<{
      name: string;
      url: string;
      fileUrl?: string; // New field for attachment URL
      type: string;
    }>;
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
    therapeutic_area: [],
    trial_identifier: [],
    trial_phase: "",
    status: "",
    primary_drugs: [],
    other_drugs: [],
    title: "",
    disease_type: [],
    patient_segment: [],
    line_of_therapy: [],
    reference_links: [],
    trial_tags: [],
    sponsor_collaborators: [],
    sponsor_field_activity: [],
    associated_cro: [],
    countries: [],
    region: [],
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
    age_min: ["", "Years"],
    age_max: ["", "Years"],
    gender: "",
    healthy_volunteers: [],
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
    durationConverterData: {
      duration: "",
      frequency: "months",
      outputMonths: "",
    },
    enhancedCalculatorData: {
      date: "",
      duration: "",
      frequency: "months",
      outputDate: "",
    },
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
    total_sites: "",
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
    internalNote: "",
    logsAttachments: [],
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

      // Save step5_6 (Sites) to localStorage immediately for persistence
      if (action.step === "step5_6") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            const storageKey = `trial_sites_${trialId}`;
            const sitesData = newState.step5_6;
            localStorage.setItem(storageKey, JSON.stringify({
              ...sitesData,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Sites to localStorage:', storageKey, sitesData);
          } else {
            console.warn('Cannot save Sites to localStorage: No trialId found');
          }
        } catch (e) {
          console.warn('Failed to save Sites to localStorage:', e);
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
        } catch (e) { }
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
        } catch (e) { }
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
        } catch (e) { }
      }

      // Save to localStorage for step5_6 (Sites)
      if (action.step === "step5_6") {
        try {
          const trialId = currentEditingTrialId || getTrialIdFromURL();
          if (trialId) {
            localStorage.setItem(`trial_sites_${trialId}`, JSON.stringify({
              ...newState.step5_6,
              timestamp: new Date().toISOString(),
            }));
            console.log('💾 Saved Sites array to localStorage (ADD)');
          }
        } catch (e) { }
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
        } catch (e) { }
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
        } catch (e) { }
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
        } catch (e) { }
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
        } catch (e) { }
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
        } catch (e) { }
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
        } catch (e) { }
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
  addSiteNote: (step: keyof EditTherapeuticFormData, field: string) => void;
  updateSiteNote: (step: keyof EditTherapeuticFormData, field: string, index: number, updates: Partial<any>) => void;
  removeSiteNote: (step: keyof EditTherapeuticFormData, field: string, index: number) => void;
  toggleSiteNoteVisibility: (step: keyof EditTherapeuticFormData, field: string, index: number) => void;
  addComplexArrayItem: (step: keyof EditTherapeuticFormData, field: string, template: any) => void;
  updateComplexArrayItem: (step: keyof EditTherapeuticFormData, field: string, index: number, updates: any) => void;
  toggleArrayItemVisibility: (step: keyof EditTherapeuticFormData, field: string, index: number) => void;
  saveTrial: (trialId: string) => Promise<void>;
  loadTrialData: (trialId: string, skipLocalStorage?: boolean) => Promise<void>;
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
  const loadTrialData = async (trialId: string, skipLocalStorage: boolean = false) => {
    try {
      // Set the module-level trialId for localStorage access
      currentEditingTrialId = trialId;
      console.log('🔑 Set currentEditingTrialId in loadTrialData:', trialId);

      // If skipLocalStorage is true (after save), clear localStorage to ensure fresh DB data is used
      if (skipLocalStorage) {
        console.log('🗑️ Clearing localStorage before loading fresh DB data');
        clearTrialDrafts(trialId);
      }

      setIsLoading(true);

      // Try to fetch from API first
      let data = null;

      // Helper function to fetch with retry
      const fetchWithRetry = async (url: string, options: RequestInit, retries = 2): Promise<Response | null> => {
        for (let i = 0; i <= retries; i++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout (increased from 5s)

            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              return response;
            }
            console.warn(`API attempt ${i + 1} failed with status:`, response.status);
          } catch (error) {
            console.warn(`API attempt ${i + 1} failed:`, error);
          }

          // Wait before retry (exponential backoff)
          if (i < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
        return null;
      };

      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();

        // Try the all-trials endpoint first
        let response = await fetchWithRetry(
          buildApiUrl(`/api/v1/therapeutic/all-trials-with-data?_t=${timestamp}`),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (response) {
          data = await response.json().catch(() => null);
        }

        // If all-trials endpoint fails, try the single trial endpoint as fallback
        if (!data || !data.trials || data.trials.length === 0) {
          console.log('All-trials endpoint failed, trying single trial endpoint...');
          response = await fetchWithRetry(
            buildApiUrl(`/api/v1/therapeutic/trials/${trialId}?_t=${timestamp}`),
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              },
              credentials: 'include',
              cache: 'no-store',
            }
          );

          if (response) {
            const singleTrialData = await response.json().catch(() => null);
            if (singleTrialData) {
              // Convert single trial response to the expected format
              data = { trials: [singleTrialData.data || singleTrialData] };
              console.log('Successfully fetched single trial data');
            }
          }
        }
      } catch (apiError) {
        console.warn('API fetch failed, trying localStorage:', apiError);
      }

      // If API failed, try localStorage
      if (!data || !data.trials || data.trials.length === 0) {
        console.log('Trying localStorage fallback...');
        const localTrials = JSON.parse(localStorage.getItem('therapeuticTrials') || '[]');
        if (localTrials.length > 0) {
          data = { trials: localTrials };
          console.log('Using localStorage data with', localTrials.length, 'trials');
        }
      }

      if (data && data.trials && data.trials.length > 0) {
        // First, check if we have localStorage data that might be more recent
        const localTrials = JSON.parse(localStorage.getItem('therapeuticTrials') || '[]');
        const localTrial = localTrials.find((t: any) => t.trial_id === trialId);
        const recentlyUpdated = localStorage.getItem(`trial_updated_${trialId}`);

        const trialIdStr = String(trialId);
        let foundTrial = data.trials.find((t: any) =>
          String(t.trial_id) === trialIdStr ||
          String(t.overview?.id) === trialIdStr ||
          String(t.id) === trialIdStr
        );

        // Debug: Log all trial IDs to help identify the issue
        console.log('=== TRIAL ID MATCHING DEBUG ===');
        console.log('Looking for trialId:', trialId);
        console.log('Total trials found:', data.trials.length);
        console.log('First few trial IDs:', data.trials.slice(0, 3).map((t: any) => ({
          trial_id: t.trial_id,
          overview_id: t.overview?.id,
          id: t.id
        })));

        // Always prefer API data when available (it's the source of truth)
        if (foundTrial) {
          console.log('✅ Found trial using API data:', {
            trial_id: foundTrial.trial_id,
            overview_id: foundTrial.overview?.id,
            has_results: !!foundTrial.results?.length,
            results_count: foundTrial.results?.length || 0
          });
        } else if (localTrial) {
          // Only use localStorage as fallback when API data is not available
          console.log('⚠️ API data not found, using localStorage for trial:', trialId);
          foundTrial = localTrial;
        } else {
          console.error('❌ Trial not found in API or localStorage:', trialId);
        }

        if (foundTrial) {
          // Store original trial data for reference
          setOriginalTrial(foundTrial);
          console.log("[EditTherapeuticFormContext] Raw outcome payload from API:", foundTrial.outcomes?.[0]);

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

          // Helper to convert comma-separated string to array
          const stringToArray = (value: unknown): string[] => {
            if (value === null || value === undefined || value === "") return [];

            // Handle actual arrays
            if (Array.isArray(value)) {
              return value.flat().filter(Boolean).map(item => {
                if (typeof item === 'object') {
                  // Attempt to extract meaningful value from object
                  return item.value || item.label || item.drug_name || item.name || JSON.stringify(item);
                }
                return String(item).trim();
              });
            }

            // Handle strings
            let str = typeof value === "string" ? value.trim() : String(value).trim();
            if (!str) return [];

            // Detect and parse JSON strings (arrays or objects)
            if ((str.startsWith("[") && str.endsWith("]")) || (str.startsWith("{") && str.endsWith("}"))) {
              try {
                const parsed = JSON.parse(str);

                // If it's an array, flatten and map to strings
                if (Array.isArray(parsed)) {
                  return parsed.flat().filter(Boolean).map(item => {
                    if (typeof item === 'object') {
                      return item.value || item.label || item.drug_name || item.name || JSON.stringify(item);
                    }
                    return String(item).trim();
                  });
                }

                // If it's an object, try to extract meaningful value
                if (typeof parsed === 'object' && parsed !== null) {
                  // Check for common field names based on the screenshot/issue
                  if (parsed.value) return [String(parsed.value).trim()];
                  if (parsed.label) return [String(parsed.label).trim()];
                  if (parsed.drug_name) return [String(parsed.drug_name).trim()];

                  // If it's a map-like object (e.g. from a bug), try to extract values
                  // But safe fallback is to return the original string if we can't understand it,
                  // OR return nothing to 'clean' it. User wants to fix it.
                  // Let's return the stringified object for transparency, OR try to clean it.
                  // Given the user wants to remove symbols, let's try to be smart.

                  // If it looks like the specific corruption {"\"solid_tumor...": ...}
                  // We might want to just keys? No.

                  // Safe fallback: treat as single string, but cleaned of outer quotes if possible
                  return [str];
                }
              } catch (e) {
                console.warn("Failed to parse JSON string in stringToArray:", str, e);
                // Fallthrough to comma split
              }
            }

            // Standard comma-separated split
            return str.split(",").map(s => {
              const trimmed = s.trim();

              // Clean up double-escaped JSON strings if they survived
              if (trimmed.startsWith('"{') && trimmed.endsWith('}"')) {
                try {
                  const inner = JSON.parse(trimmed); // Unescape quotes
                  return inner; // This might be the JSON string itself e.g. "{\"Key\":...}"
                } catch (e) { }
              }

              return trimmed;
            }).filter(Boolean);
          };

          // Special helper for drug fields - uses ||| delimiter for new data
          // For backward compatibility, also splits by ", " (comma followed by space)
          // This preserves drug names like "Cyclophosphamide, BMS" if saved with ||| delimiter
          const stringToArrayForDrugs = (value: unknown): string[] => {
            if (value === null || value === undefined || value === "") return [];

            // Handle actual arrays
            if (Array.isArray(value)) {
              return value.flat().filter(Boolean).map(item => {
                if (typeof item === 'object') {
                  return (item as any).value || (item as any).label || (item as any).drug_name || (item as any).generic_name || JSON.stringify(item);
                }
                return String(item).trim();
              });
            }

            // Handle strings
            let str = typeof value === "string" ? value.trim() : String(value).trim();
            if (!str) return [];

            // If it contains ||| delimiter, split by that (new format - preserves commas in names)
            if (str.includes("|||")) {
              return str.split("|||").map(s => s.trim()).filter(Boolean);
            }

            // For backward compatibility with existing comma-separated data:
            // Split by ", " (comma followed by space) which is the standard separator
            // This allows drug names with commas but no space after (like internal commas) to be preserved
            // Most drug entries are separated by ", " so this should work for existing data
            return str.split(", ").map(s => s.trim()).filter(Boolean);
          };

          const mappedData: EditTherapeuticFormData = {
            step5_1: {
              therapeutic_area: stringToArray(foundTrial.overview?.therapeutic_area),
              trial_identifier: (() => {
                const normalizeId = (value: any) =>
                  typeof value === "string" ? value.trim() : "";
                const isAutoGeneratedId = (value: string) =>
                  /^TB-\d{6}$/.test(value);

                const rawIdentifiers = Array.isArray(foundTrial.overview?.trial_identifier)
                  ? foundTrial.overview.trial_identifier
                    .map(normalizeId)
                    .filter(Boolean)
                  : [];

                const candidateIds = [
                  normalizeId(foundTrial.trial_id),
                  normalizeId(foundTrial.overview?.trial_id),
                  ...rawIdentifiers,
                ].filter(Boolean);

                let autoGeneratedId =
                  candidateIds.find((id: string) => isAutoGeneratedId(id)) || "";

                if (!autoGeneratedId) {
                  const sourceForHash =
                    normalizeId(foundTrial.overview?.id) ||
                    normalizeId(foundTrial.trial_id) ||
                    normalizeId(trialId);

                  if (sourceForHash) {
                    let hash = 0;
                    for (let i = 0; i < sourceForHash.length; i++) {
                      hash = (hash * 31 + sourceForHash.charCodeAt(i)) >>> 0;
                    }
                    const numeric = (hash % 1_000_000)
                      .toString()
                      .padStart(6, "0");
                    autoGeneratedId = `TB-${numeric}`;
                  } else {
                    autoGeneratedId = "TB-000000";
                  }
                }

                const otherIdentifiers = rawIdentifiers.filter(
                  (id: string) => id !== autoGeneratedId
                );

                return [autoGeneratedId, ...otherIdentifiers];
              })(),
              trial_phase: foundTrial.overview?.trial_phase || "",
              status: foundTrial.overview?.status || "",
              primary_drugs: stringToArrayForDrugs(foundTrial.overview?.primary_drugs),
              other_drugs: stringToArrayForDrugs(foundTrial.overview?.other_drugs),
              title: foundTrial.overview?.title || "",
              disease_type: stringToArray(foundTrial.overview?.disease_type),
              patient_segment: stringToArray(foundTrial.overview?.patient_segment),
              line_of_therapy: stringToArray(foundTrial.overview?.line_of_therapy),
              reference_links: foundTrial.overview?.reference_links || [],
              trial_tags: stringToArray(foundTrial.overview?.trial_tags),
              sponsor_collaborators: stringToArray(foundTrial.overview?.sponsor_collaborators),
              sponsor_field_activity: stringToArray(foundTrial.overview?.sponsor_field_activity),
              associated_cro: (() => {
                const croValue = foundTrial.overview?.associated_cro;
                console.log('=== LOADING ASSOCIATED CRO ===');
                console.log('Raw associated_cro from API:', croValue);
                console.log('Type:', typeof croValue);
                const result = stringToArray(croValue);
                console.log('Mapped associated_cro:', result);
                return result;
              })(),
              countries: stringToArray(foundTrial.overview?.countries),
              region: stringToArray(foundTrial.overview?.region),
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
            step5_3: (() => {
              const criteria = foundTrial.criteria?.[0];
              console.log('=== LOADING ELIGIBILITY DATA ===');
              console.log('Raw criteria data:', criteria);
              console.log('criteria?.age_from:', criteria?.age_from, 'Type:', typeof criteria?.age_from);
              console.log('criteria?.age_to:', criteria?.age_to, 'Type:', typeof criteria?.age_to);
              console.log('sex:', criteria?.sex);
              console.log('target_no_volunteers:', criteria?.target_no_volunteers);
              console.log('actual_enrolled_volunteers:', criteria?.actual_enrolled_volunteers);

              // Parse age fields with detailed logging
              const ageMinParsed = parseAgeField(criteria?.age_from);
              const ageMaxParsed = parseAgeField(criteria?.age_to);

              console.log('Parsed age_min:', ageMinParsed);
              console.log('Parsed age_max:', ageMaxParsed);

              const eligibilityData = {
                inclusion_criteria: criteria?.inclusion_criteria
                  ? Array.isArray(criteria.inclusion_criteria)
                    ? criteria.inclusion_criteria.filter(Boolean)
                    : typeof criteria.inclusion_criteria === 'string'
                      ? criteria.inclusion_criteria.split("; ").filter(Boolean)
                      : [criteria.inclusion_criteria].filter(Boolean)
                  : [],
                exclusion_criteria: criteria?.exclusion_criteria
                  ? Array.isArray(criteria.exclusion_criteria)
                    ? criteria.exclusion_criteria.filter(Boolean)
                    : typeof criteria.exclusion_criteria === 'string'
                      ? criteria.exclusion_criteria.split("; ").filter(Boolean)
                      : [criteria.exclusion_criteria].filter(Boolean)
                  : [],
                age_min: ageMinParsed,
                age_max: ageMaxParsed,
                gender: (() => {
                  const value = criteria?.sex;
                  console.log('Loading gender/sex:', value, 'Type:', typeof value);
                  if (value === null || value === undefined || value === "") return "";
                  return typeof value === "string" ? value.trim() : String(value).trim();
                })(),
                healthy_volunteers: criteria?.healthy_volunteers
                  ? [toStringOrEmpty(criteria.healthy_volunteers)]
                  : [],
                subject_type: (() => {
                  const value = criteria?.subject_type;
                  console.log('Loading subject_type:', value, 'Type:', typeof value);
                  if (value === null || value === undefined || value === "") return "";
                  return typeof value === "string" ? value.trim() : String(value).trim();
                })(),
                target_no_volunteers: (() => {
                  const value = criteria?.target_no_volunteers;
                  console.log('Loading target_no_volunteers:', value, 'Type:', typeof value, 'Raw:', JSON.stringify(value));
                  if (value === null || value === undefined || value === "") return "";
                  // Handle both string and number types
                  const str = typeof value === "string" ? value.trim() : String(value).trim();
                  // Remove any commas that might be in the value
                  return str.replace(/,/g, "") || "";
                })(),
                actual_enrolled_volunteers: (() => {
                  const value = criteria?.actual_enrolled_volunteers;
                  console.log('Loading actual_enrolled_volunteers:', value, 'Type:', typeof value, 'Raw:', JSON.stringify(value));
                  if (value === null || value === undefined || value === "") return "";
                  // Handle both string and number types
                  const str = typeof value === "string" ? value.trim() : String(value).trim();
                  // Remove any commas that might be in the value
                  return str.replace(/,/g, "") || "";
                })(),
              };

              console.log('✅ Final mapped eligibility data:', eligibilityData);
              console.log('Age min value:', eligibilityData.age_min[0], 'Age min unit:', eligibilityData.age_min[1]);
              console.log('Age max value:', eligibilityData.age_max[0], 'Age max unit:', eligibilityData.age_max[1]);
              return eligibilityData;
            })(),
            step5_4: (() => {
              console.log('=== LOADING TIMING DATA ===');

              // CHECK LOCALSTORAGE FIRST for recent changes (only if not skipping localStorage)
              if (!skipLocalStorage) {
                try {
                  // Check if data was saved to DB more recently than localStorage
                  const dbSavedTime = localStorage.getItem(`trial_db_saved_${trialId}`);
                  const storageKey = `trial_timing_${trialId}`;
                  const storedData = localStorage.getItem(storageKey);

                  if (storedData && !dbSavedTime) {
                    // No DB save timestamp, use localStorage (draft data)
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
                  } else if (storedData && dbSavedTime) {
                    // Compare timestamps: if localStorage is older than DB save, prefer DB
                    const localStorageData = JSON.parse(storedData);
                    const localStorageTime = new Date(localStorageData.timestamp);
                    const dbSaveTime = new Date(dbSavedTime);

                    if (localStorageTime > dbSaveTime) {
                      // localStorage is newer (unsaved changes), use it
                      console.log('✅ Using localStorage data for Timing (has unsaved changes)');
                      const { timestamp: _, ...dataWithoutTimestamp } = localStorageData;
                      return dataWithoutTimestamp;
                    } else {
                      // DB save is newer, skip localStorage and use DB data
                      console.log('⏭️ DB save is newer than localStorage, using DB data');
                    }
                  }
                } catch (e) {
                  console.warn('Error loading Timing from localStorage:', e);
                }
              } else {
                console.log('⏭️ Skipping localStorage check for Timing (skipLocalStorage=true)');
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
                // Note: durationConverterData and enhancedCalculatorData are UI-only calculator state
                // They are NOT stored in the database - just use default values
                durationConverterData: {
                  duration: "",
                  frequency: "days",
                  outputMonths: "",
                },
                enhancedCalculatorData: {
                  date: "",
                  duration: "",
                  frequency: "months",
                  outputDate: "",
                },
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
                      isSaved: true, // Mark references loaded from database as saved
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

              // CHECK LOCALSTORAGE FIRST for recent changes (only if not skipping localStorage)
              let localStorageData = null;
              if (!skipLocalStorage) {
                try {
                  // Check if data was saved to DB more recently than localStorage
                  const dbSavedTime = localStorage.getItem(`trial_db_saved_${trialId}`);
                  const storageKey = `trial_results_${trialId}`;
                  const storedData = localStorage.getItem(storageKey);

                  if (storedData && !dbSavedTime) {
                    // No DB save timestamp, use localStorage (draft data)
                    localStorageData = JSON.parse(storedData);
                    console.log('📂 Found Results in localStorage:', localStorageData);

                    // Check if localStorage data is recent (within last 24 hours)
                    const timestamp = new Date(localStorageData.timestamp);
                    const now = new Date();
                    const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
                    console.log('localStorage data age:', hoursDiff, 'hours');

                    // Use localStorage data if it exists
                    if (localStorageData) {
                      console.log('✅ Using localStorage data for Results (has recent changes)');
                      // Remove timestamp before returning
                      const { timestamp: _, ...dataWithoutTimestamp } = localStorageData;
                      return dataWithoutTimestamp;
                    }
                  } else if (storedData && dbSavedTime) {
                    // Compare timestamps: if localStorage is older than DB save, prefer DB
                    localStorageData = JSON.parse(storedData);
                    const localStorageTime = new Date(localStorageData.timestamp);
                    const dbSaveTime = new Date(dbSavedTime);

                    if (localStorageTime > dbSaveTime) {
                      // localStorage is newer (unsaved changes), use it
                      console.log('✅ Using localStorage data for Results (has unsaved changes)');
                      const { timestamp: _, ...dataWithoutTimestamp } = localStorageData;
                      return dataWithoutTimestamp;
                    } else {
                      // DB save is newer, skip localStorage and use DB data
                      console.log('⏭️ DB save is newer than localStorage, using DB data');
                    }
                  }
                } catch (e) {
                  console.warn('Error loading Results from localStorage:', e);
                }
              } else {
                console.log('⏭️ Skipping localStorage check for Results (skipLocalStorage=true)');
              }

              console.log('Loading Results from API...');
              console.log('foundTrial.results:', foundTrial.results);
              console.log('foundTrial.results[0]:', foundTrial.results?.[0]);

              const resultsData = foundTrial.results?.[0];
              console.log('=== RESULTS DATA DEBUG ===');
              console.log('Results Available raw:', resultsData?.results_available);
              console.log('Endpoints met raw:', resultsData?.endpoints_met);
              console.log('Adverse Event Reported raw:', resultsData?.adverse_event_reported);
              console.log('Trial Outcome raw:', resultsData?.trial_outcome);
              console.log('Trial Outcome Reference raw:', resultsData?.reference);
              console.log('Trial Outcome Link raw:', resultsData?.trial_outcome_link);
              console.log('Trial Outcome Content raw:', resultsData?.trial_outcome_content);
              console.log('Treatment for Adverse Events raw:', resultsData?.treatment_for_adverse_events);
              console.log('Site Notes raw:', resultsData?.site_notes);
              console.log('Full resultsData object:', JSON.stringify(resultsData, null, 2));

              // Helper to format date for CustomDateInput (MM-DD-YYYY format)
              const formatDateForInput = (dateStr: string): string => {
                if (!dateStr) return "";
                try {
                  console.log('Formatting date for input:', dateStr);
                  // Handle YYYY-MM-DD format (from database)
                  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    const [year, month, day] = dateStr.split('-');
                    return `${month}-${day}-${year}`;
                  }
                  // Handle MM-DD-YYYY format (already formatted)
                  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
                    return dateStr;
                  }
                  // Try to parse as Date object
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${month}-${day}-${year}`;
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
                results_available: resultsData?.results_available === 'Yes' || resultsData?.results_available === true,
                endpoints_met: resultsData?.endpoints_met === 'Yes' || resultsData?.endpoints_met === true,
                adverse_events_reported: resultsData?.adverse_event_reported === 'Yes' || resultsData?.adverse_event_reported === true,
                trial_outcome: resultsData?.trial_outcome || "",
                trial_outcome_reference_date: formattedDate,
              };

              console.log('Loaded Results Data from API (toggles and date):', loadedData);

              const resultsMapped = {
                ...loadedData,
                trial_outcome_content: resultsData?.trial_outcome_content || "",
                trial_outcome_link: (() => {
                  const linkValue = resultsData?.trial_outcome_link;
                  console.log('=== LOADING TRIAL OUTCOME LINK ===');
                  console.log('Raw trial_outcome_link from API:', linkValue);
                  console.log('Type:', typeof linkValue);
                  const result = linkValue || "";
                  console.log('Mapped trial_outcome_link:', result);
                  return result;
                })(),
                trial_outcome_attachment: resultsData?.trial_outcome_attachment || "",
                trial_results: Array.isArray(resultsData?.trial_results)
                  ? resultsData.trial_results
                  : (resultsData?.trial_results ? [resultsData.trial_results] : []),
                adverse_event_reported: resultsData?.adverse_event_reported || "",
                adverse_event_type: resultsData?.adverse_event_type || "",
                treatment_for_adverse_events: resultsData?.treatment_for_adverse_events || "",
              };

              console.log('Final mapped results data:', resultsMapped);

              return {
                ...resultsMapped,
                site_notes: (() => {
                  let siteNotes = resultsData?.site_notes || foundTrial.results?.[0]?.site_notes;
                  console.log('=== SITE NOTES DEBUG ===');
                  console.log('Raw site_notes from resultsData:', resultsData?.site_notes);
                  console.log('Raw site_notes from foundTrial:', foundTrial.results?.[0]?.site_notes);
                  console.log('site_notes type:', typeof siteNotes);

                  if (typeof siteNotes === 'string') {
                    try {
                      siteNotes = JSON.parse(siteNotes);
                      console.log('Parsed site_notes from string:', siteNotes);
                    } catch (e) {
                      console.warn('Failed to parse site_notes:', e);
                      siteNotes = [];
                    }
                  }
                  console.log('Final site_notes after parsing:', siteNotes);
                  console.log('Is array?', Array.isArray(siteNotes));

                  if (siteNotes && Array.isArray(siteNotes) && siteNotes.length > 0) {
                    const mappedNotes = siteNotes.map((note: any, index: number) => {
                      const mapped = {
                        id: note.id || `${index + 1}`,
                        date: note.date ? formatDateForInput(note.date) : "",
                        noteType: note.noteType || note.type || "", // Support both noteType and type
                        content: note.content || "",
                        sourceLink: note.sourceLink || note.source_link || "", // Add sourceLink mapping
                        sourceType: note.sourceType || note.source || "",
                        attachments: note.attachments || [],
                        isVisible: note.isVisible !== false,
                      };
                      console.log(`Mapped note ${index}:`, mapped);
                      return mapped;
                    });
                    console.log('All mapped notes:', mappedNotes);
                    return mappedNotes;
                  }
                  console.log('No valid site_notes found, returning default empty note');
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
              total_sites: foundTrial.sites?.[0]?.total?.toString() || "",
              study_start_date: "",
              first_patient_in: "",
              last_patient_in: "",
              study_end_date: foundTrial.timing?.[0]?.trial_end_date_estimated || "",
              interim_analysis_dates: [],
              final_analysis_date: "",
              regulatory_submission_date: "",
              references: (() => {
                const normalizeSiteAttachments = (attachments: any): Array<Record<string, any>> => {
                  console.log("🔧 Normalizing site attachments:", attachments);

                  const toArray = (value: any): any[] => {
                    if (!value) {
                      return [];
                    }

                    if (Array.isArray(value)) {
                      console.log("📦 Attachments already array:", value.length);
                      return value;
                    }

                    if (typeof value === "string") {
                      const trimmed = value.trim();
                      if (!trimmed) {
                        return [];
                      }

                      if (trimmed.startsWith("[")) {
                        try {
                          const parsed = JSON.parse(trimmed);
                          console.log("✅ Parsed attachments JSON string:", parsed);
                          return Array.isArray(parsed) ? parsed : [];
                        } catch (error) {
                          console.warn("⚠️ Failed to parse attachments JSON string:", trimmed, error);
                          return [];
                        }
                      }

                      if (trimmed.startsWith("{")) {
                        try {
                          const parsedObject = JSON.parse(trimmed);
                          console.log("✅ Parsed single attachment JSON:", parsedObject);
                          return [parsedObject];
                        } catch (error) {
                          console.warn("⚠️ Failed to parse attachment JSON object:", trimmed, error);
                        }
                      }

                      return [trimmed];
                    }

                    if (typeof value === "object") {
                      return [value];
                    }

                    return [];
                  };

                  const attachmentsArray = toArray(attachments);

                  return attachmentsArray
                    .map((item: any, index: number) => {
                      console.log(`🧩 Normalizing attachment #${index}:`, item);

                      if (!item) {
                        return null;
                      }

                      if (typeof item === "string") {
                        const trimmed = item.trim();
                        if (!trimmed) {
                          return null;
                        }

                        const isUrl = /^https?:\/\//i.test(trimmed);
                        const derivedName = (() => {
                          if (isUrl) {
                            try {
                              const url = new URL(trimmed);
                              return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "Attachment");
                            } catch {
                              const segments = trimmed.split("/");
                              return segments[segments.length - 1] || "Attachment";
                            }
                          }
                          return trimmed;
                        })();

                        return {
                          name: derivedName,
                          url: isUrl ? trimmed : "",
                          type: "application/octet-stream",
                        };
                      }

                      if (typeof item === "object") {
                        const possibleUrl =
                          typeof item.url === "string"
                            ? item.url
                            : typeof item.href === "string"
                              ? item.href
                              : typeof item.link === "string"
                                ? item.link
                                : "";
                        const derivedName =
                          typeof item.name === "string" && item.name
                            ? item.name
                            : possibleUrl
                              ? (() => {
                                try {
                                  const url = new URL(possibleUrl);
                                  return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "Attachment");
                                } catch {
                                  const segments = possibleUrl.split("/");
                                  return segments[segments.length - 1] || "Attachment";
                                }
                              })()
                              : "Attachment";

                        return {
                          name: derivedName,
                          url: possibleUrl,
                          type: typeof item.type === "string" && item.type ? item.type : "application/octet-stream",
                          size: typeof item.size === "number" ? item.size : undefined,
                          lastModified: typeof item.lastModified === "number" ? item.lastModified : undefined,
                        };
                      }

                      return null;
                    })
                    .filter(Boolean) as Array<Record<string, any>>;
                };

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
                    attachments: normalizeSiteAttachments(note.attachments),
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

              // CHECK LOCALSTORAGE FIRST for recent changes (only if not skipping localStorage)
              if (!skipLocalStorage) {
                try {
                  // Check if data was saved to DB more recently than localStorage
                  const dbSavedTime = localStorage.getItem(`trial_db_saved_${trialId}`);
                  const storageKey = `trial_other_sources_${trialId}`;
                  const storedData = localStorage.getItem(storageKey);

                  if (storedData && !dbSavedTime) {
                    // No DB save timestamp, use localStorage (draft data)
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
                  } else if (storedData && dbSavedTime) {
                    // Compare timestamps: if localStorage is older than DB save, prefer DB
                    const localStorageData = JSON.parse(storedData);
                    const localStorageTime = new Date(localStorageData.timestamp);
                    const dbSaveTime = new Date(dbSavedTime);

                    if (localStorageTime > dbSaveTime) {
                      // localStorage is newer (unsaved changes), use it
                      console.log('✅ Using localStorage data for Other Sources (has unsaved changes)');
                      const { timestamp: _, ...dataWithoutTimestamp } = localStorageData;
                      return dataWithoutTimestamp;
                    } else {
                      // DB save is newer, skip localStorage and use DB data
                      console.log('⏭️ DB save is newer than localStorage, using DB data');
                    }
                  }
                } catch (e) {
                  console.warn('Error loading Other Sources from localStorage:', e);
                }
              } else {
                console.log('⏭️ Skipping localStorage check for Other Sources (skipLocalStorage=true)');
              }

              console.log('Loading Other Sources from API...');

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

              const deriveOtherSourceFileName = (rawUrl: string) => {
                if (!rawUrl) {
                  return "Attachment";
                }

                try {
                  const parsedUrl = new URL(rawUrl);
                  const segments = parsedUrl.pathname.split("/").filter(Boolean);
                  const lastSegment = segments.pop();
                  if (lastSegment) {
                    return decodeURIComponent(lastSegment);
                  }
                } catch (error) {
                  console.warn("Failed to parse URL for filename:", rawUrl, error);
                  const fallbackSegments = rawUrl.split("/").filter(Boolean);
                  const fallback = fallbackSegments.pop();
                  if (fallback) {
                    return decodeURIComponent(fallback);
                  }
                }

                return "Attachment";
              };

              const collectOtherSourceAttachments = (value: any): any[] => {
                if (!value) {
                  return [];
                }

                if (Array.isArray(value)) {
                  return value;
                }

                if (typeof value === "string") {
                  const trimmed = value.trim();
                  if (!trimmed) {
                    return [];
                  }

                  if (
                    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
                    (trimmed.startsWith("{") && trimmed.endsWith("}"))
                  ) {
                    try {
                      const parsed = JSON.parse(trimmed);
                      if (Array.isArray(parsed)) {
                        return parsed;
                      }
                      if (parsed) {
                        return [parsed];
                      }
                    } catch (error) {
                      console.warn("⚠️ Failed to parse other source attachments JSON:", trimmed, error);
                    }
                    return [];
                  }

                  return [trimmed];
                }

                if (typeof value === "object") {
                  return [value];
                }

                return [];
              };

              const normalizeOtherSourceFileFields = (
                fileValue: any,
                urlValue: any,
                attachmentsValue: any
              ): { fileName: string; fileUrl: string } => {
                console.log("🔗 Normalizing Other Sources file fields:", {
                  fileValue,
                  urlValue,
                  attachmentsValue,
                });

                let fileName = "";
                let fileUrl = "";

                // Check if a URL is from EdgeStore (file attachment) vs regular web link
                const isFileUrl = (candidateUrl: string): boolean => {
                  if (!candidateUrl || typeof candidateUrl !== "string") return false;
                  const trimmed = candidateUrl.trim();
                  // EdgeStore URLs typically contain 'edgestore' or are from the file upload service
                  // Regular web links should not be treated as file attachments
                  return trimmed.includes('edgestore') ||
                    trimmed.includes('/api/edgestore') ||
                    trimmed.includes('file') && (trimmed.endsWith('.pdf') || trimmed.endsWith('.doc') || trimmed.endsWith('.docx') || trimmed.endsWith('.xls') || trimmed.endsWith('.xlsx') || trimmed.endsWith('.csv') || trimmed.endsWith('.png') || trimmed.endsWith('.jpg') || trimmed.endsWith('.jpeg'));
                };

                const considerFileUrl = (candidateUrl: string | undefined | null) => {
                  if (typeof candidateUrl === "string" && candidateUrl.trim()) {
                    const trimmed = candidateUrl.trim();
                    // Only treat as file if it's a file URL, not a regular web link
                    if (isFileUrl(trimmed)) {
                      if (!fileUrl) {
                        fileUrl = trimmed;
                      }
                      if (!fileName) {
                        fileName = deriveOtherSourceFileName(trimmed);
                      }
                    }
                  }
                };

                const considerString = (value: string, isFromFileField: boolean = false) => {
                  const trimmed = value.trim();
                  if (!trimmed) {
                    return;
                  }

                  if (
                    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                    (trimmed.startsWith("[") && trimmed.endsWith("]"))
                  ) {
                    try {
                      const parsed = JSON.parse(trimmed);
                      const candidates = Array.isArray(parsed) ? parsed : [parsed];
                      candidates.forEach((candidate) => considerUnknown(candidate, isFromFileField));
                      return;
                    } catch (error) {
                      console.warn("⚠️ Failed to parse JSON string when normalizing file:", trimmed, error);
                    }
                  }

                  // Only treat URLs as files if they're from file fields or are file URLs
                  if (/^https?:\/\//i.test(trimmed)) {
                    if (isFromFileField || isFileUrl(trimmed)) {
                      considerFileUrl(trimmed);
                    }
                  } else if (!fileName && isFromFileField) {
                    // Only use as filename if it's from a file field
                    fileName = trimmed;
                  }
                };

                const considerObject = (obj: Record<string, any>, isFromFileField: boolean = false) => {
                  if (!obj) {
                    return;
                  }

                  const possibleUrl =
                    typeof obj.url === "string"
                      ? obj.url
                      : typeof obj.href === "string"
                        ? obj.href
                        : typeof obj.link === "string"
                          ? obj.link
                          : "";
                  const possibleName =
                    typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : "";

                  // Only treat URL as file if it's from file field or is a file URL
                  if (possibleUrl && (isFromFileField || isFileUrl(possibleUrl))) {
                    considerFileUrl(possibleUrl);
                  }

                  if (possibleName && !fileName && isFromFileField) {
                    fileName = possibleName;
                  }
                };

                const considerUnknown = (value: any, isFromFileField: boolean = false) => {
                  if (!value) {
                    return;
                  }

                  if (typeof value === "string") {
                    considerString(value, isFromFileField);
                  } else if (typeof value === "object") {
                    considerObject(value as Record<string, any>, isFromFileField);
                  }
                };

                // Only process urlValue if it's a file URL (EdgeStore), not a regular web link
                if (urlValue && isFileUrl(String(urlValue))) {
                  considerUnknown(urlValue, false);
                }

                // Process fileValue - this is definitely a file field
                considerUnknown(fileValue, true);

                // Process attachmentsValue - these are file attachments
                const attachmentCandidates = collectOtherSourceAttachments(attachmentsValue);
                attachmentCandidates.forEach((candidate) => considerUnknown(candidate, true));

                if (!fileName && fileUrl) {
                  fileName = deriveOtherSourceFileName(fileUrl);
                }

                console.log("✅ Normalized Other Sources file metadata:", {
                  fileName,
                  fileUrl,
                });

                return {
                  fileName,
                  fileUrl,
                };
              };

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
                      try {
                        parsedData = JSON.parse(parsedData);
                        console.log(`Item ${index} parsed data:`, parsedData);
                        console.log(`Item ${index} parsed data description:`, parsedData.description);
                      } catch (parseError) {
                        console.error(`Failed to parse item ${index} data:`, parseError);
                        return; // Skip this item if parsing fails
                      }
                    }
                    itemType = parsedData.type;
                  }

                  console.log(`Item ${index} type: ${itemType}, parsed data:`, parsedData);
                  console.log(`Item ${index} description field:`, parsedData?.description);
                  console.log(`Item ${index} date field (raw):`, parsedData?.date, 'Type:', typeof parsedData?.date);
                  console.log(`Item ${index} all keys:`, parsedData ? Object.keys(parsedData) : []);

                  if (!parsedData || !itemType) {
                    console.warn(`Item ${index} has unknown format, skipping`);
                    return;
                  }

                  // Group by type
                  if (itemType === 'pipeline_data') {
                    // Only pass fileUrl (not url) to avoid treating web links as file attachments
                    const normalizedFile = normalizeOtherSourceFileFields(parsedData.file, parsedData.fileUrl || null, parsedData.attachments);
                    pipeline_data.push({
                      id: item.id || parsedData.id || Date.now().toString(),
                      date: parsedData.date || "",
                      information: parsedData.information || "",
                      url: parsedData.url || "",
                      file: normalizedFile.fileName || "",
                      fileUrl: parsedData.fileUrl || normalizedFile.fileUrl || "",
                      isVisible: parsedData.isVisible !== false
                    });
                  } else if (itemType === 'press_releases') {
                    console.log(`📄 Loading press release ${index}:`, parsedData);
                    console.log(`📄 Description value:`, parsedData.description);
                    // Only pass fileUrl (not url) to avoid treating web links as file attachments
                    const normalizedFile = normalizeOtherSourceFileFields(parsedData.file, parsedData.fileUrl || null, parsedData.attachments);
                    press_releases.push({
                      id: item.id || parsedData.id || Date.now().toString(),
                      date: parsedData.date || "",
                      title: parsedData.title || "",
                      description: parsedData.description || parsedData.content || "",
                      url: parsedData.url || "",
                      file: normalizedFile.fileName || "",
                      fileUrl: parsedData.fileUrl || normalizedFile.fileUrl || "",
                      isVisible: parsedData.isVisible !== false
                    });
                  } else if (itemType === 'publications') {
                    console.log(`📄 Loading publication ${index}:`, parsedData);
                    console.log(`📄 Description value:`, parsedData.description);
                    console.log(`📄 Date value (raw):`, parsedData.date, 'Type:', typeof parsedData.date);
                    // Only pass fileUrl (not url) to avoid treating web links as file attachments
                    const normalizedFile = normalizeOtherSourceFileFields(parsedData.file, parsedData.fileUrl || null, parsedData.attachments);
                    const publicationDate = parsedData.date || parsedData.publication_date || "";
                    console.log(`📄 Date value (after fallback):`, publicationDate);
                    const formattedDate = formatDateForUI(publicationDate);
                    console.log(`📄 Date value (formatted):`, formattedDate);
                    publications.push({
                      id: item.id || parsedData.id || Date.now().toString(),
                      date: formattedDate, // Format date from YYYY-MM-DD to MM-DD-YYYY
                      type: parsedData.publicationType || parsedData.type || "",
                      title: parsedData.title || "",
                      description: parsedData.description || parsedData.content || "",
                      url: parsedData.url || "",
                      file: normalizedFile.fileName || "",
                      fileUrl: parsedData.fileUrl || normalizedFile.fileUrl || "",
                      isVisible: parsedData.isVisible !== false // Default to true if not explicitly false
                    });
                  } else if (itemType === 'trial_registries') {
                    console.log(`📄 Loading trial registry ${index}:`, parsedData);
                    console.log(`📄 Description value:`, parsedData.description);
                    console.log(`📄 Date value (raw):`, parsedData.date, 'Type:', typeof parsedData.date);
                    // Only pass fileUrl (not url) to avoid treating web links as file attachments
                    const normalizedFile = normalizeOtherSourceFileFields(parsedData.file, parsedData.fileUrl || null, parsedData.attachments);
                    const registryDate = parsedData.date || parsedData.registry_date || "";
                    console.log(`📄 Date value (after fallback):`, registryDate);
                    const formattedDate = formatDateForUI(registryDate);
                    console.log(`📄 Date value (formatted):`, formattedDate);
                    trial_registries.push({
                      id: item.id || parsedData.id || Date.now().toString(),
                      date: formattedDate, // Format date from YYYY-MM-DD to MM-DD-YYYY
                      registry: parsedData.registry || "",
                      identifier: parsedData.identifier || "",
                      description: parsedData.description || parsedData.content || "",
                      url: parsedData.url || "",
                      file: normalizedFile.fileName || "",
                      fileUrl: parsedData.fileUrl || normalizedFile.fileUrl || "",
                      isVisible: parsedData.isVisible !== false // Default to true if not explicitly false
                    });
                  } else if (itemType === 'associated_studies') {
                    console.log(`📄 Loading associated study ${index}:`, parsedData);
                    console.log(`📄 Description value:`, parsedData.description);
                    console.log(`📄 Date value (raw):`, parsedData.date, 'Type:', typeof parsedData.date);
                    // Only pass fileUrl (not url) to avoid treating web links as file attachments
                    const normalizedFile = normalizeOtherSourceFileFields(parsedData.file, parsedData.fileUrl || null, parsedData.attachments);
                    const studyDate = parsedData.date || parsedData.study_date || "";
                    console.log(`📄 Date value (after fallback):`, studyDate);
                    const formattedDate = formatDateForUI(studyDate);
                    console.log(`📄 Date value (formatted):`, formattedDate);
                    associated_studies.push({
                      id: item.id || parsedData.id || Date.now().toString(),
                      date: formattedDate, // Format date from YYYY-MM-DD to MM-DD-YYYY
                      type: parsedData.studyType || parsedData.type || "",
                      title: parsedData.title || "",
                      description: parsedData.description || parsedData.content || "",
                      url: parsedData.url || "",
                      file: normalizedFile.fileName || "",
                      fileUrl: parsedData.fileUrl || normalizedFile.fileUrl || "",
                      isVisible: parsedData.isVisible !== false // Default to true if not explicitly false
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
              // Parse notes - new schema: notes stored as JSONB in notes field
              const notesData = foundTrial.notes?.[0];
              console.log('[EditFormContext] Loading notes data (new schema):', {
                rawNotes: notesData,
                notesField: notesData?.notes,
                notesType: typeof notesData?.notes
              });

              let parsedNotes: any[] = [];

              // New schema: notes field is JSONB containing all note data
              if (notesData && notesData.notes) {
                const ensureAttachmentsArray = (attachments: any) => {
                  if (!attachments) return [];
                  if (typeof attachments === "string") {
                    try {
                      const parsed = JSON.parse(attachments);
                      if (Array.isArray(parsed)) {
                        return parsed.map((attachment: any) => ({
                          name: String(attachment?.name || ""),
                          url: String(attachment?.url || ""),
                          type: String(attachment?.type || "application/octet-stream"),
                        }));
                      }
                    } catch {
                      return [];
                    }
                  }
                  if (Array.isArray(attachments)) {
                    return attachments.map((attachment: any) => ({
                      name: String(attachment?.name || ""),
                      url: String(attachment?.url || ""),
                      type: String(attachment?.type || "application/octet-stream"),
                    }));
                  }
                  return [];
                };

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

                const parseNoteDateForUI = (value: string) => {
                  if (!value) return "";
                  return formatDateForUI(value);
                };

                const buildParsedNote = (note: any, index: number) => ({
                  id: String(note?.id || `${index + 1}`),
                  date: parseNoteDateForUI(String(note?.date || "")),
                  type: String(note?.type || "General"),
                  content:
                    typeof note?.content === "string"
                      ? note.content
                      : note?.content && typeof note.content === "object"
                        ? note.content.text || note.content.content || JSON.stringify(note.content)
                        : "",
                  sourceLink: String(note?.sourceLink || note?.sourceUrl || ""),
                  sourceType: String(note?.sourceType || ""),
                  sourceUrl: String(note?.sourceUrl || ""),
                  attachments: ensureAttachmentsArray(note?.attachments),
                  isVisible: note?.isVisible !== false,
                });

                // New schema: All note data is in the JSONB notes field
                // Parse notes - can be string (JSON) or already parsed object/array
                let notesArray: any[] = [];

                if (typeof notesData.notes === "string") {
                  const notesString = notesData.notes.trim();
                  if (!notesString || notesString === "No notes available") {
                    notesArray = [];
                  } else if (notesString.startsWith("[") || notesString.startsWith("{")) {
                    try {
                      const parsed = JSON.parse(notesString);
                      if (Array.isArray(parsed)) {
                        notesArray = parsed;
                      } else if (parsed && typeof parsed === 'object') {
                        // If it's an object, wrap it in an array
                        notesArray = [parsed];
                      }
                    } catch {
                      // Fallback parsing for old format
                      const noteParts = notesString.split("; ");
                      notesArray = noteParts.map((notePart: string, index: number) => {
                        const sourceMatch = notePart.match(/\s+-\s+Source:\s+(.+)$/);
                        let sourceLink = "";
                        let contentPart = notePart;
                        if (sourceMatch) {
                          sourceLink = String(sourceMatch[1] || "").trim();
                          contentPart = notePart.substring(0, notePart.lastIndexOf(" - Source:"));
                        }
                        const match = contentPart.match(/^(.+?)\s+\((.+?)\):\s+(.+)$/);
                        if (match && match.length >= 4) {
                          const date = String(match[1] || "").trim();
                          const type = String(match[2] || "General").trim();
                          const content = String(match[3] || "").trim();
                          return {
                            id: `${index + 1}`,
                            date: parseNoteDateForUI(date),
                            type,
                            content,
                            sourceLink,
                            sourceType: "",
                            sourceUrl: "",
                            attachments: [],
                            isVisible: true,
                          };
                        }
                        const colonIndex = contentPart.indexOf(":");
                        if (colonIndex > 0) {
                          const beforeColon = contentPart.substring(0, colonIndex).trim();
                          const afterColon = contentPart.substring(colonIndex + 1).trim();
                          const parenMatch = beforeColon.match(/^(.+?)\s+\((.+?)\)$/);
                          if (parenMatch) {
                            return {
                              id: `${index + 1}`,
                              date: parseNoteDateForUI(String(parenMatch[1] || "").trim()),
                              type: String(parenMatch[2] || "General").trim(),
                              content: String(afterColon || "").trim(),
                              sourceLink,
                              sourceType: "",
                              sourceUrl: "",
                              attachments: [],
                              isVisible: true,
                            };
                          }
                        }
                        return {
                          id: `${index + 1}`,
                          date: new Date().toISOString().split("T")[0],
                          type: "General",
                          content: String(notePart || "").trim(),
                          sourceLink: "",
                          sourceType: "",
                          sourceUrl: "",
                          attachments: [],
                          isVisible: true,
                        };
                      });
                    }
                  } else {
                    // Fallback: treat as plain text, split by semicolon
                    const noteParts = notesString.split("; ");
                    notesArray = noteParts.map((notePart: string, index: number) => {
                      const sourceMatch = notePart.match(/\s+-\s+Source:\s+(.+)$/);
                      let sourceLink = "";
                      let contentPart = notePart;
                      if (sourceMatch) {
                        sourceLink = String(sourceMatch[1] || "").trim();
                        contentPart = notePart.substring(0, notePart.lastIndexOf(" - Source:"));
                      }
                      const match = contentPart.match(/^(.+?)\s+\((.+?)\):\s+(.+)$/);
                      if (match && match.length >= 4) {
                        const date = String(match[1] || "").trim();
                        const type = String(match[2] || "General").trim();
                        const content = String(match[3] || "").trim();
                        return {
                          id: `${index + 1}`,
                          date: parseNoteDateForUI(date),
                          type,
                          content,
                          sourceLink,
                          sourceType: "",
                          sourceUrl: "",
                          attachments: [],
                          isVisible: true,
                        };
                      }
                      const colonIndex = contentPart.indexOf(":");
                      if (colonIndex > 0) {
                        const beforeColon = contentPart.substring(0, colonIndex).trim();
                        const afterColon = contentPart.substring(colonIndex + 1).trim();
                        const parenMatch = beforeColon.match(/^(.+?)\s+\((.+?)\)$/);
                        if (parenMatch) {
                          return {
                            id: `${index + 1}`,
                            date: parseNoteDateForUI(String(parenMatch[1] || "").trim()),
                            type: String(parenMatch[2] || "General").trim(),
                            content: String(afterColon || "").trim(),
                            sourceLink,
                            sourceType: "",
                            sourceUrl: "",
                            attachments: [],
                            isVisible: true,
                          };
                        }
                      }
                      return {
                        id: `${index + 1}`,
                        date: new Date().toISOString().split("T")[0],
                        type: "General",
                        content: String(notePart || "").trim(),
                        sourceLink: "",
                        sourceType: "",
                        sourceUrl: "",
                        attachments: [],
                        isVisible: true,
                      };
                    });
                  }
                } else if (Array.isArray(notesData.notes)) {
                  // Already an array, use directly
                  notesArray = notesData.notes;
                } else if (notesData.notes && typeof notesData.notes === 'object') {
                  // Single object, wrap in array
                  notesArray = [notesData.notes];
                }

                // Convert notesArray to parsedNotes format
                parsedNotes = notesArray.map((note: any, index: number) => buildParsedNote(note, index));
              }

              console.log('[EditFormContext] Parsed notes (new schema):', parsedNotes);

              // Load Full Review data from logs
              const logsData = foundTrial.logs?.[0];
              const fullReviewUser = logsData?.full_review_user || "";
              const nextReviewDate = logsData?.next_review_date || "";
              const fullReview = !!(fullReviewUser || nextReviewDate);

              // Parse logs attachments
              let logsAttachments: Array<{ name: string; url: string; type: string }> = [];
              if (logsData?.attachment) {
                try {
                  const parsed = typeof logsData.attachment === 'string'
                    ? JSON.parse(logsData.attachment)
                    : logsData.attachment;
                  logsAttachments = Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                  console.warn('Failed to parse logs attachments:', e);
                  logsAttachments = [];
                }
              }

              const formattedDateType = formatDateForUI(notesData?.date_type || "");

              return {
                notes: parsedNotes,
                attachments: [],
                regulatory_links: [],
                publication_links: [],
                additional_resources: [],
                date_type: formattedDateType,
                link: notesData?.link || "",
                fullReview: fullReview,
                fullReviewUser: fullReviewUser,
                nextReviewDate: formatDateForUI(nextReviewDate),
                internalNote: logsData?.internal_note ? String(logsData.internal_note) : "",
                logsAttachments: logsAttachments,
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

          console.log("[EditTherapeuticFormContext] Parsed outcome measures:", {
            primary_raw: foundTrial.outcomes?.[0]?.primary_outcome_measure,
            primary_parsed: mappedData.step5_2.primaryOutcomeMeasures,
            other_raw: foundTrial.outcomes?.[0]?.other_outcome_measure,
            other_parsed: mappedData.step5_2.otherOutcomeMeasures,
          });

          console.log('🔄 Dispatching SET_TRIAL_DATA with mapped eligibility data:', {
            age_min: mappedData.step5_3.age_min,
            age_max: mappedData.step5_3.age_max,
            gender: mappedData.step5_3.gender,
            target_no_volunteers: mappedData.step5_3.target_no_volunteers,
            actual_enrolled_volunteers: mappedData.step5_3.actual_enrolled_volunteers,
            subject_type: mappedData.step5_3.subject_type,
          });
          dispatch({ type: "SET_TRIAL_DATA", payload: mappedData });
          console.log('✅ Form state updated with new trial data');

          // Save all form sections to localStorage after loading from DB for auto-fill
          // This ensures that when revisiting the trial, the updated values are available
          try {
            console.log('💾 Saving all form sections to localStorage after loading from DB');
            localStorage.setItem(`trial_timing_${trialId}`, JSON.stringify({
              ...mappedData.step5_4,
              timestamp: new Date().toISOString(),
            }));
            localStorage.setItem(`trial_results_${trialId}`, JSON.stringify({
              ...mappedData.step5_5,
              timestamp: new Date().toISOString(),
            }));
            localStorage.setItem(`trial_other_sources_${trialId}`, JSON.stringify({
              ...mappedData.step5_7,
              timestamp: new Date().toISOString(),
            }));
            console.log('✅ Successfully saved all form sections to localStorage');
          } catch (e) {
            console.warn('Failed to save form sections to localStorage:', e);
          }
        } else {
          console.warn("[EditTherapeuticFormContext] Trial not found for ID:", trialId);
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

      // Get user ID from localStorage or use default admin UUID
      const currentUserId = typeof window !== 'undefined'
        ? localStorage.getItem("userId") || "2be97b5e-5bf3-43f2-b84a-4db4a138e497"
        : "2be97b5e-5bf3-43f2-b84a-4db4a138e497";

      console.log("👤 Current User ID:", currentUserId);

      // Check if we have original trial data
      if (!originalTrial) {
        throw new Error("No trial data available for saving.");
      }

      // Helper to convert array to comma-separated string for API
      const arrayToString = (value: string | string[]): string => {
        if (Array.isArray(value)) {
          // Flatten and clean items
          return value
            .flat()
            .map(item => {
              if (item === null || item === undefined) return "";
              if (typeof item === 'object') {
                // Prevent saving [object Object]
                return (item as any).value || (item as any).label || (item as any).drug_name || JSON.stringify(item);
              }
              return String(item).trim();
            })
            .filter(Boolean)
            .join(", ");
        }

        // Handle single object passed as value
        if (typeof value === 'object' && value !== null) {
          return (value as any).value || (value as any).label || (value as any).drug_name || JSON.stringify(value);
        }

        return String(value || "").trim();
      };

      // Special helper for drug fields - uses comma-space as delimiter for backward compatibility
      // If a drug name contains comma-space, use ||| delimiter
      const arrayToStringForDrugs = (value: string | string[]): string => {
        if (Array.isArray(value)) {
          const cleanedItems = value
            .flat()
            .map(item => {
              if (item === null || item === undefined) return "";
              if (typeof item === 'object') {
                return (item as any).value || (item as any).label || (item as any).drug_name || (item as any).generic_name || JSON.stringify(item);
              }
              return String(item).trim();
            })
            .filter(Boolean);

          // Check if any drug name contains ", " - if so, use ||| delimiter
          const hasCommaSpace = cleanedItems.some(item => item.includes(", "));
          return cleanedItems.join(hasCommaSpace ? "|||" : ", ");
        }

        if (typeof value === 'object' && value !== null) {
          return (value as any).value || (value as any).label || (value as any).drug_name || (value as any).generic_name || JSON.stringify(value);
        }

        return String(value || "").trim();
      };

      // Prepare the update data for the overview (step5_1)
      // Convert array fields to comma-separated strings as expected by the backend
      const updateData = {
        user_id: currentUserId,
        therapeutic_area: arrayToString(formData.step5_1.therapeutic_area),
        trial_identifier: formData.step5_1.trial_identifier, // Keep as array
        trial_phase: formData.step5_1.trial_phase,
        status: formData.step5_1.status,
        primary_drugs: arrayToStringForDrugs(formData.step5_1.primary_drugs),
        other_drugs: arrayToStringForDrugs(formData.step5_1.other_drugs),
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
      };

      console.log('Saving trial with data:', updateData);

      // Get the overview ID from the original trial
      const overviewId = originalTrial.overview?.id;
      // CRITICAL FIX: Use the actual database trial ID (UUID) for all API calls
      // The URL param 'trialId' might be a display ID, but the DB operations need the UUID
      const dbTrialId = originalTrial.trial_id || originalTrial.overview?.id || trialId;
      console.log('[EditTherapeuticFormContext] Using dbTrialId for API calls:', dbTrialId, '(URL trialId:', trialId, ')');

      if (!overviewId) {
        console.warn('No overview ID found, skipping API update and using localStorage only');
      }

      // Check if backend is reachable first
      let backendAvailable = false;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for health check

        // Wrap health check in a promise that never rejects
        const healthCheckPromise = fetch(buildApiUrl('/api/v1/therapeutic/overview'), {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        }).catch(() => null); // Convert rejection to null

        const healthCheck = await healthCheckPromise;
        clearTimeout(timeoutId);

        if (healthCheck && healthCheck.ok) {
          console.log("[EditTherapeuticFormContext] Backend health check succeeded");
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
          const fetchPromise = fetch(buildApiUrl(`/api/v1/therapeutic/overview/${overviewId}/update`), {
            method: 'POST',
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
            console.log("[EditTherapeuticFormContext] Overview update response:", response.status);
            try {
              console.log("=== SAVING OUTCOME DATA ===");
              const outcomePayload = {
                user_id: currentUserId,
                trial_id: dbTrialId,
                ...buildOutcomePayload(formData),
              };
              console.log("Outcome payload to be saved:", outcomePayload);

              const outcomeResponse = await fetch(buildApiUrl(`/api/v1/therapeutic/outcome/trial/${dbTrialId}/update`), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(outcomePayload),
                credentials: "include",
              }).catch(() => null);

              if (outcomeResponse && outcomeResponse.ok) {
                const outcomeData = await outcomeResponse.json().catch(() => null);
                console.log("Outcome updated successfully. Response:", outcomeData);
              } else {
                console.warn("Outcome update failed");
                if (outcomeResponse) {
                  const errorText = await outcomeResponse.text().catch(() => "Unknown error");
                  console.error("Outcome update error:", outcomeResponse.status, errorText);
                }
              }
            } catch (outcomeError) {
              console.warn("Outcome update failed:", outcomeError);
            }

            // Update participation criteria via API
            try {
              console.log("=== SAVING PARTICIPATION CRITERIA DATA ===");
              const criteriaPayload = {
                ...buildCriteriaPayload(formData),
                user_id: currentUserId
              };
              console.log("Participation criteria payload:", criteriaPayload);

              const criteriaResponse = await fetch(buildApiUrl(`/api/v1/therapeutic/criteria/trial/${dbTrialId}/update`), {
                method: "POST",
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

            // Also update the sites data if we have a trial_id
            // FIXED: Include references with attachments, not just date/content
            const filteredReferences = formData.step5_6.references.filter((ref: any) =>
              ref.isVisible && (ref.date || ref.content || (ref.attachments && ref.attachments.length > 0))
            );
            const sitesData = {
              total: formData.step5_6.total_sites ? parseInt(String(formData.step5_6.total_sites)) : 0,
              site_notes: filteredReferences.length > 0 ? JSON.stringify(filteredReferences) : null,
            };

            console.log('Updating sites with data:', sitesData);
            console.log('Filtered references count:', filteredReferences.length);
            filteredReferences.forEach((ref: any, idx: number) => {
              console.log(`Reference ${idx}:`, {
                hasDate: !!ref.date,
                hasContent: !!ref.content,
                hasAttachments: ref.attachments?.length > 0,
                attachments: ref.attachments
              });
            });

            // Update sites section via API
            try {
              const sitesResponse = await fetch(buildApiUrl(`/api/v1/therapeutic/sites/trial/${dbTrialId}/update`), {
                method: 'POST',
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
                // Note: durationConverterData and enhancedCalculatorData are UI-only calculator state
                // and are NOT saved to the database - they are stored in localStorage only
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

              const timingResponse = await fetch(buildApiUrl(`/api/v1/therapeutic/timing/trial/${dbTrialId}/update`), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(timingData),
                credentials: 'include',
              }).catch(() => null);

              if (timingResponse && timingResponse.ok) {
                const responseData = await timingResponse.json().catch(() => null);
                console.log('Timing updated successfully. Response:', responseData);

                // Dispatch custom event to notify view page to refresh
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('trial-data-updated', {
                    detail: { trialId, section: 'timing' }
                  }));
                  console.log('📢 Dispatched trial-data-updated event for timing section');
                }
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

              // Helper function to convert date from MM-DD-YYYY to YYYY-MM-DD for database
              const formatDateForDB = (dateStr: string): string | null => {
                if (!dateStr) return null;
                try {
                  // Handle MM-DD-YYYY format (from CustomDateInput)
                  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
                    const [month, day, year] = dateStr.split('-');
                    return `${year}-${month}-${day}`;
                  }
                  // Handle YYYY-MM-DD format (already in DB format)
                  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    return dateStr;
                  }
                  // Try to parse as Date object
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  }
                  return dateStr;
                } catch (e) {
                  console.warn('Error formatting date for DB:', dateStr, e);
                  return dateStr;
                }
              };

              const filteredSiteNotes = formData.step5_5.site_notes.filter((note: any) => note.isVisible && (note.date || note.content));

              // Format site notes dates for database
              // Ensure sourceLink is included in the saved data
              const formattedSiteNotes = filteredSiteNotes.map((note: any) => ({
                date: note.date ? formatDateForDB(note.date) : note.date,
                type: note.noteType || note.type || "",
                content: note.content || "",
                sourceLink: note.sourceLink || "", // Explicitly include sourceLink
                sourceType: note.sourceType || "",
                attachments: note.attachments || [],
              }));

              const resultsData = {
                results_available: formData.step5_5.results_available ? 'Yes' : 'No',
                endpoints_met: formData.step5_5.endpoints_met ? 'Yes' : 'No',
                trial_outcome: formData.step5_5.trial_outcome || null,
                reference: formatDateForDB(formData.step5_5.trial_outcome_reference_date || ""),
                trial_outcome_content: formData.step5_5.trial_outcome_content || null,
                trial_outcome_link: formData.step5_5.trial_outcome_link || null,
                trial_outcome_attachment: typeof formData.step5_5.trial_outcome_attachment === 'object' && formData.step5_5.trial_outcome_attachment !== null
                  ? (formData.step5_5.trial_outcome_attachment as any).url
                  : formData.step5_5.trial_outcome_attachment || null,
                trial_results: formData.step5_5.trial_results.length > 0 ? formData.step5_5.trial_results : null,
                adverse_event_reported: formData.step5_5.adverse_event_reported || null,
                adverse_event_type: formData.step5_5.adverse_event_type || null,
                treatment_for_adverse_events: formData.step5_5.treatment_for_adverse_events || null,
                site_notes: formattedSiteNotes.length > 0 ? JSON.stringify(formattedSiteNotes) : null,
              };

              console.log('Results data to be saved to API:', resultsData);

              const resultsResponse = await fetch(buildApiUrl(`/api/v1/therapeutic/results/trial/${dbTrialId}/update`), {
                method: 'POST',
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

            // IMPORTANT: Save other_sources BEFORE reloading data, as reload might overwrite formData
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

                return null;
              } catch (e) {
                console.warn('Error formatting date for DB:', dateStr, e);
                return null;
              }
            };

            // Update other_sources section via API
            try {
              console.log('=== OTHER SOURCES SAVE DEBUG ===');
              console.log('⚠️ Saving other sources BEFORE reload to preserve formData');
              console.log('step5_7 data:', {
                pipeline_data: formData.step5_7.pipeline_data,
                press_releases: formData.step5_7.press_releases,
                publications: formData.step5_7.publications,
                trial_registries: formData.step5_7.trial_registries,
                associated_studies: formData.step5_7.associated_studies
              });
              console.log('step5_7 pipeline_data count:', formData.step5_7.pipeline_data?.length || 0);
              console.log('step5_7 press_releases count:', formData.step5_7.press_releases?.length || 0);
              console.log('step5_7 publications count:', formData.step5_7.publications?.length || 0);
              console.log('step5_7 trial_registries count:', formData.step5_7.trial_registries?.length || 0);
              console.log('step5_7 associated_studies count:', formData.step5_7.associated_studies?.length || 0);

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
              const deleteResponse = await fetch(buildApiUrl(`/api/v1/therapeutic/other/trial/${dbTrialId}`), {
                method: 'DELETE',
                credentials: 'include',
              }).catch(() => null);

              console.log('Deleted existing other_sources, response:', deleteResponse?.status);

              // Create new entries for each category with visible items
              const otherSourcesPromises: Promise<Response | null>[] = [];

              if (formData.step5_7.pipeline_data && formData.step5_7.pipeline_data.length > 0) {
                console.log('Raw pipeline_data array:', formData.step5_7.pipeline_data);
                const filteredItems = formData.step5_7.pipeline_data
                  .filter((item: any) => {
                    const isVisible = item.isVisible !== false;
                    const hasDate = item.date && String(item.date).trim() !== "";
                    const hasInformation = item.information && String(item.information).trim() !== "";
                    const hasUrl = item.url && String(item.url).trim() !== "";
                    const hasFile = item.file && String(item.file).trim() !== "";
                    const hasData = hasDate || hasInformation || hasUrl || hasFile;
                    const shouldInclude = isVisible && hasData;

                    if (!shouldInclude) {
                      console.log('❌ Filtering out pipeline_data item:', item);
                    }
                    return shouldInclude;
                  });

                console.log('Pipeline data to save:', filteredItems);

                filteredItems.forEach((item: any) => {
                  const sourceData = {
                    type: 'pipeline_data',
                    date: formatDateForDB(item.date) || "", // Format date from MM-DD-YYYY to YYYY-MM-DD
                    information: item.information,
                    url: item.url,
                    file: item.file,
                    fileUrl: item.fileUrl
                  };

                  console.log('Creating pipeline_data entry:', sourceData);

                  otherSourcesPromises.push(
                    fetch(buildApiUrl('/api/v1/therapeutic/other'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        trial_id: dbTrialId,
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
                console.log('Raw press_releases array:', formData.step5_7.press_releases);
                const filteredItems = formData.step5_7.press_releases
                  .filter((item: any) => {
                    const isVisible = item.isVisible !== false;
                    const hasDate = item.date && String(item.date).trim() !== "";
                    const hasTitle = item.title && String(item.title).trim() !== "";
                    const hasUrl = item.url && String(item.url).trim() !== "";
                    const hasFile = item.file && String(item.file).trim() !== "";
                    const hasDescription = item.description && String(item.description).trim() !== "";
                    const hasData = hasDate || hasTitle || hasUrl || hasFile || hasDescription;
                    const shouldInclude = isVisible && hasData;

                    if (!shouldInclude) {
                      console.log('❌ Filtering out press_releases item:', item);
                    }
                    return shouldInclude;
                  });

                console.log('Press releases to save:', filteredItems);

                filteredItems.forEach((item: any) => {
                  const sourceData = {
                    type: 'press_releases',
                    date: formatDateForDB(item.date) || "", // Format date from MM-DD-YYYY to YYYY-MM-DD
                    title: item.title,
                    description: item.description,
                    url: item.url,
                    file: item.file,
                    fileUrl: item.fileUrl
                  };

                  console.log('Creating press_releases entry:', sourceData);

                  otherSourcesPromises.push(
                    fetch(buildApiUrl('/api/v1/therapeutic/other'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        trial_id: dbTrialId,
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
                console.log('Raw publications array:', formData.step5_7.publications);
                const filteredItems = formData.step5_7.publications
                  .filter((item: any) => {
                    // Default isVisible to true if not set
                    const isVisible = item.isVisible !== false;
                    // Include item if it's visible and has at least one field filled (including date)
                    const hasDate = item.date && String(item.date).trim() !== "";
                    const hasType = item.type && String(item.type).trim() !== "";
                    const hasTitle = item.title && String(item.title).trim() !== "";
                    const hasUrl = item.url && String(item.url).trim() !== "";
                    const hasFile = item.file && String(item.file).trim() !== "";
                    const hasDescription = item.description && String(item.description).trim() !== "";

                    const hasData = hasDate || hasType || hasTitle || hasUrl || hasFile || hasDescription;
                    const shouldInclude = isVisible && hasData;

                    console.log('Publication item check:', {
                      id: item.id,
                      isVisible,
                      hasDate,
                      hasType,
                      hasTitle,
                      hasUrl,
                      hasFile,
                      hasDescription,
                      hasData,
                      shouldInclude,
                      item
                    });

                    if (!shouldInclude) {
                      console.log('❌ Filtering out publication item (no data or not visible):', item);
                    }
                    return shouldInclude;
                  });

                console.log('Publications to save:', filteredItems);

                filteredItems.forEach((item: any) => {
                  const sourceData = {
                    type: 'publications',
                    date: formatDateForDB(item.date) || "", // Format date from MM-DD-YYYY to YYYY-MM-DD
                    publicationType: item.type,
                    title: item.title,
                    description: item.description,
                    url: item.url,
                    file: item.file,
                    fileUrl: item.fileUrl
                  };

                  console.log('Creating publications entry:', sourceData);

                  otherSourcesPromises.push(
                    fetch(buildApiUrl('/api/v1/therapeutic/other'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        trial_id: dbTrialId,
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
                console.log('Raw trial_registries array:', formData.step5_7.trial_registries);
                const filteredItems = formData.step5_7.trial_registries
                  .filter((item: any) => {
                    // Default isVisible to true if not set
                    const isVisible = item.isVisible !== false;
                    // Include item if it's visible and has at least one field filled (including date)
                    const hasDate = item.date && String(item.date).trim() !== "";
                    const hasRegistry = item.registry && String(item.registry).trim() !== "";
                    const hasIdentifier = item.identifier && String(item.identifier).trim() !== "";
                    const hasUrl = item.url && String(item.url).trim() !== "";
                    const hasFile = item.file && String(item.file).trim() !== "";
                    const hasDescription = item.description && String(item.description).trim() !== "";

                    const hasData = hasDate || hasRegistry || hasIdentifier || hasUrl || hasFile || hasDescription;
                    const shouldInclude = isVisible && hasData;

                    console.log('Trial registry item check:', {
                      id: item.id,
                      isVisible,
                      hasDate,
                      hasRegistry,
                      hasIdentifier,
                      hasUrl,
                      hasFile,
                      hasDescription,
                      hasData,
                      shouldInclude,
                      item
                    });

                    if (!shouldInclude) {
                      console.log('❌ Filtering out trial registry item (no data or not visible):', item);
                    }
                    return shouldInclude;
                  });

                console.log('Trial registries to save:', filteredItems);

                filteredItems.forEach((item: any) => {
                  const sourceData = {
                    type: 'trial_registries',
                    date: formatDateForDB(item.date) || "", // Format date from MM-DD-YYYY to YYYY-MM-DD
                    registry: item.registry,
                    identifier: item.identifier,
                    description: item.description,
                    url: item.url,
                    file: item.file,
                    fileUrl: item.fileUrl
                  };

                  console.log('Creating trial_registries entry:', sourceData);

                  otherSourcesPromises.push(
                    fetch(buildApiUrl('/api/v1/therapeutic/other'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        trial_id: dbTrialId,
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
                console.log('Raw associated_studies array:', formData.step5_7.associated_studies);
                const filteredItems = formData.step5_7.associated_studies
                  .filter((item: any) => {
                    // Default isVisible to true if not set
                    const isVisible = item.isVisible !== false;
                    // Include item if it's visible and has at least one field filled (including date)
                    const hasDate = item.date && String(item.date).trim() !== "";
                    const hasType = item.type && String(item.type).trim() !== "";
                    const hasTitle = item.title && String(item.title).trim() !== "";
                    const hasUrl = item.url && String(item.url).trim() !== "";
                    const hasFile = item.file && String(item.file).trim() !== "";
                    const hasDescription = item.description && String(item.description).trim() !== "";

                    const hasData = hasDate || hasType || hasTitle || hasUrl || hasFile || hasDescription;
                    const shouldInclude = isVisible && hasData;

                    console.log('Associated study item check:', {
                      id: item.id,
                      isVisible,
                      hasDate,
                      hasType,
                      hasTitle,
                      hasUrl,
                      hasFile,
                      hasDescription,
                      hasData,
                      shouldInclude,
                      item
                    });

                    if (!shouldInclude) {
                      console.log('❌ Filtering out associated study item (no data or not visible):', item);
                    }
                    return shouldInclude;
                  });

                console.log('Associated studies to save:', filteredItems);

                filteredItems.forEach((item: any) => {
                  const sourceData = {
                    type: 'associated_studies',
                    date: formatDateForDB(item.date) || "", // Format date from MM-DD-YYYY to YYYY-MM-DD
                    studyType: item.type,
                    title: item.title,
                    description: item.description,
                    url: item.url,
                    file: item.file,
                    fileUrl: item.fileUrl
                  };

                  console.log('Creating associated_studies entry:', sourceData);

                  otherSourcesPromises.push(
                    fetch(buildApiUrl('/api/v1/therapeutic/other'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        trial_id: dbTrialId,
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
              if (otherSourcesPromises.length === 0) {
                console.warn('⚠️ No other sources requests to process! This means all arrays were empty or filtered out.');
                console.log('Check if items have data and isVisible is set correctly.');
              } else {
                const results = await Promise.all(otherSourcesPromises);
                const successCount = results.filter(r => r && r.ok).length;
                const failedCount = results.filter(r => !r || !r.ok).length;
                console.log(`Other sources updated: ${successCount}/${otherSourcesPromises.length} successful, ${failedCount} failed`);

                // Log failed responses
                results.forEach((result, index) => {
                  if (!result || !result.ok) {
                    console.error(`Failed request ${index}:`, result?.status, result?.statusText);
                  }
                });
              }
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

              // Get current user ID or use default admin UUID
              const currentUserId = typeof window !== 'undefined'
                ? localStorage.getItem("userId") || "2be97b5e-5bf3-43f2-b84a-4db4a138e497"
                : "2be97b5e-5bf3-43f2-b84a-4db4a138e497";

              // Prepare logs data
              const internalNoteValue = formData.step5_8.internalNote;
              const logsData = {
                last_modified_date: new Date().toISOString(),
                last_modified_user: currentUserId,
                full_review_user: formData.step5_8.fullReviewUser || null,
                next_review_date: formatDateForDB(formData.step5_8.nextReviewDate),
                internal_note: internalNoteValue === undefined ? null : internalNoteValue,
                attachment: formData.step5_8.logsAttachments && formData.step5_8.logsAttachments.length > 0
                  ? JSON.stringify(formData.step5_8.logsAttachments)
                  : null,
              };

              console.log('Updating logs with data:', logsData);

              const logsResponse = await fetch(buildApiUrl(`/api/v1/therapeutic/logs/trial/${dbTrialId}/update`), {
                method: 'POST',
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
              await fetch(buildApiUrl(`/api/v1/therapeutic/notes/trial/${dbTrialId}`), {
                method: 'DELETE',
                credentials: 'include',
              }).catch(() => console.log('No existing notes to delete'));

              // Then create new notes if there are any visible notes
              const visibleNotes = formData.step5_8.notes.filter((note: any) => {
                const rawContent =
                  typeof note.content === "string"
                    ? note.content
                    : note.content && typeof note.content === "object"
                      ? note.content.text || note.content.content
                      : "";
                const hasContent = Boolean(rawContent && String(rawContent).trim());
                const hasSource =
                  Boolean(note.sourceLink && String(note.sourceLink).trim()) ||
                  Boolean(note.sourceType && String(note.sourceType).trim()) ||
                  Boolean(note.sourceUrl && String(note.sourceUrl).trim());
                const hasAttachments = Array.isArray(note.attachments) && note.attachments.length > 0;
                return note.isVisible && (hasContent || hasSource || hasAttachments);
              });

              if (visibleNotes.length > 0) {
                const convertDateForDB = (dateStr: string): string | null => {
                  if (!dateStr) return null;
                  try {
                    if (dateStr.includes("-") && dateStr.length === 10) {
                      const parts = dateStr.split("-");
                      if (parts.length === 3) {
                        if (parts[0].length === 4) {
                          return dateStr;
                        }
                        const [month, day, year] = parts;
                        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
                      }
                    }
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      return `${year}-${month}-${day}`;
                    }
                    return null;
                  } catch {
                    return null;
                  }
                };

                const formattedNotes = visibleNotes.map((note: any) => {
                  const rawContent =
                    typeof note.content === "string"
                      ? note.content
                      : note.content && typeof note.content === "object"
                        ? note.content.text || note.content.content
                        : "";
                  const attachments = Array.isArray(note.attachments)
                    ? note.attachments.map((attachment: any) => ({
                      name: String(attachment?.name || ""),
                      url: String(attachment?.url || ""),
                      type: String(attachment?.type || "application/octet-stream"),
                    }))
                    : [];
                  return {
                    id: note.id,
                    date: convertDateForDB(String(note.date || "")),
                    type: String(note.type || "General"),
                    content: String(rawContent || ""),
                    sourceLink: String(note.sourceLink || ""),
                    sourceType: String(note.sourceType || ""),
                    sourceUrl: String(note.sourceUrl || ""),
                    attachments,
                    isVisible: true,
                  };
                });

                const attachmentsArray = formattedNotes
                  .flatMap((note: any) => note.attachments)
                  .filter((attachment: any) => attachment && (attachment.name || attachment.url));

                const sourceArray = formattedNotes
                  .map((note: any) => ({
                    id: note.id,
                    sourceLink: note.sourceLink,
                    sourceType: note.sourceType,
                    sourceUrl: note.sourceUrl,
                  }))
                  .filter(
                    (source: any) =>
                      (source.sourceLink && source.sourceLink.trim() !== "") ||
                      (source.sourceType && source.sourceType.trim() !== "") ||
                      (source.sourceUrl && source.sourceUrl.trim() !== "")
                  );

                // New schema: Store all note data in the JSONB notes field
                const notesPayload = {
                  trial_id: dbTrialId,
                  notes: formattedNotes.length > 0 ? formattedNotes : [], // Store all note data in JSONB field
                };

                console.log('[EditFormContext] Creating new notes with simplified schema:', {
                  trial_id: notesPayload.trial_id,
                  notesCount: Array.isArray(notesPayload.notes) ? notesPayload.notes.length : 0,
                  notes: typeof notesPayload.notes
                });

                await fetch(buildApiUrl('/api/v1/therapeutic/notes'), {
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

            // Longer delay to ensure database transaction completes and data is committed
            console.log('⏳ Waiting for database to commit changes before reloading...');
            await new Promise(resolve => setTimeout(resolve, 1500)); // Increased to 1.5 seconds

            // Force reload the trial data to show the updated values
            // Pass skipLocalStorage=true to ensure fresh DB data is used
            console.log('🔄 Reloading trial data after save...');
            await loadTrialData(trialId, true);
            console.log('✅ Trial data reloaded after save');

            // Trigger refresh event for the main page
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('refreshFromEdit'));
            }
            return true; // Return success indicator
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
          therapeutic_area: arrayToString(formData.step5_1.therapeutic_area),
          trial_identifier: formData.step5_1.trial_identifier,
          trial_phase: formData.step5_1.trial_phase,
          status: formData.step5_1.status,
          primary_drugs: arrayToStringForDrugs(formData.step5_1.primary_drugs),
          other_drugs: arrayToStringForDrugs(formData.step5_1.other_drugs),
          title: formData.step5_1.title,
          disease_type: arrayToString(formData.step5_1.disease_type),
          patient_segment: arrayToString(formData.step5_1.patient_segment),
          line_of_therapy: arrayToString(formData.step5_1.line_of_therapy),
          reference_links: formData.step5_1.reference_links,
          trial_tags: arrayToString(formData.step5_1.trial_tags),
          sponsor_collaborators: arrayToString(formData.step5_1.sponsor_collaborators),
          sponsor_field_activity: arrayToString(formData.step5_1.sponsor_field_activity),
          associated_cro: arrayToString(formData.step5_1.associated_cro),
          countries: arrayToString(formData.step5_1.countries),
          region: arrayToString(formData.step5_1.region),
          trial_record_status: formData.step5_1.trial_record_status,
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
          total: formData.step5_6.total_sites ? parseInt(String(formData.step5_6.total_sites)) : 0,
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
      throw error; // Re-throw to allow component to handle the failure
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

  // Helper function to get tab name from step
  const getTabName = (step: keyof EditTherapeuticFormData): string => {
    const stepToTabMap: Record<string, string> = {
      step5_1: "Trial Overview",
      step5_2: "Outcome Measured",
      step5_3: "Participation Criteria",
      step5_4: "Timing",
      step5_5: "Results",
      step5_6: "Sites",
      step5_7: "Other Sources",
      step5_8: "Logs",
    };
    return stepToTabMap[step] || "Trial Overview";
  };

  const updateField = (step: keyof EditTherapeuticFormData, field: string, value: any) => {
    const oldValue = (formData[step] as any)[field];

    dispatch({ type: "UPDATE_FIELD", step, field, value });

    // Log the field update
    setTimeout(() => {
      const tabName = getTabName(step);
      const newLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: "admin",
        action: "changed",
        details: `${tabName} updated`,
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
      const tabName = getTabName(step);
      const newLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: "admin",
        action: "added",
        details: `${tabName} updated`,
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
      const tabName = getTabName(step);
      const newLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: "admin",
        action: "removed",
        details: `${tabName} updated`,
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
      const tabName = getTabName(step);
      const newLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: "admin",
        action: "changed",
        details: `${tabName} updated`,
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

  const addSiteNote = (step: keyof EditTherapeuticFormData, field: string) => {
    console.log(`[EditTherapeuticFormContext] addSiteNote called for ${String(step)}.${field}`);
    const currentArray = ((formData[step] as any)[field] as any[]) || [];
    const newSiteNote = {
      id: Date.now().toString(),
      date: "",
      noteType: "",
      content: "",
      sourceType: "",
      viewSource: "",
      attachments: [],
      isVisible: true,
    };
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: [...currentArray, newSiteNote],
    });
  };

  const updateSiteNote = (
    step: keyof EditTherapeuticFormData,
    field: string,
    index: number,
    updates: Partial<any>
  ) => {
    console.log(
      `[EditTherapeuticFormContext] updateSiteNote called for ${String(step)}.${field} index ${index}`,
      updates
    );
    const currentArray = ((formData[step] as any)[field] as any[]) || [];
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

  const removeSiteNote = (
    step: keyof EditTherapeuticFormData,
    field: string,
    index: number
  ) => {
    console.log(
      `[EditTherapeuticFormContext] removeSiteNote called for ${String(step)}.${field} index ${index}`
    );
    const currentArray = ((formData[step] as any)[field] as any[]) || [];
    const updatedArray = currentArray.filter((_, idx) => idx !== index);
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: updatedArray,
    });
  };

  const toggleSiteNoteVisibility = (
    step: keyof EditTherapeuticFormData,
    field: string,
    index: number
  ) => {
    console.log(
      `[EditTherapeuticFormContext] toggleSiteNoteVisibility called for ${String(step)}.${field} index ${index}`
    );
    const currentArray = ((formData[step] as any)[field] as any[]) || [];
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

  // Note management functions
  const addNote = (step: keyof EditTherapeuticFormData, field: string) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const newNote = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      type: "General",
      content: "",
      sourceLink: "",
      sourceType: "",
      sourceUrl: "",
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

  // Complex array item management functions (for Other Sources, etc.)
  const addComplexArrayItem = (
    step: keyof EditTherapeuticFormData,
    field: string,
    template: any
  ) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const newItem = {
      ...template,
      id: template.id || Date.now().toString(),
    };
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: [...currentArray, newItem],
    });
  };

  const updateComplexArrayItem = (
    step: keyof EditTherapeuticFormData,
    field: string,
    index: number,
    updates: any
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

  const toggleArrayItemVisibility = (
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
    addSiteNote,
    updateSiteNote,
    removeSiteNote,
    toggleSiteNoteVisibility,
    addNote,
    updateNote,
    removeNote,
    toggleNoteVisibility,
    addComplexArrayItem,
    updateComplexArrayItem,
    toggleArrayItemVisibility,
    saveTrial,
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
