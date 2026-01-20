"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { buildApiUrl } from "@/app/_lib/api";

// Define the complete form structure
export interface TherapeuticFormData {
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
    age_min: string;
    age_max: string;
    gender: string;
    subject_type: string;
    healthy_volunteers: string;
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
    // Timing table fields
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
    // Trial Duration Calculator fields
    trialDuration: {
      startDate: string;
      enrollmentCloseDate: string;
      resultPublishDate: string;
      trialEndDate: string;
      inclusionPeriod: number;
      resultDuration: number;
      overallDurationToComplete: number;
      confidenceTypes: {
        startDate: "Estimated" | "Benchmark" | "Actual";
        enrollmentCloseDate: "Estimated" | "Benchmark" | "Actual";
        resultPublishDate: "Estimated" | "Benchmark" | "Actual";
        trialEndDate: "Estimated" | "Benchmark" | "Actual";
      };
    };
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

  // Step 5-5: Study Sites
  step5_5: {
    study_sites: string[];
    principal_investigators: string[];
    site_status: string;
    site_countries: string[];
    site_regions: string[];
    site_contact_info: string[];
    trial_results: string[];
    trial_outcome: string;
    trial_outcome_content: string;
    trial_outcome_reference_date: string;
    trial_outcome_link: string;
    trial_outcome_attachment: any;
    adverse_event_reported: string;
    adverse_event_type: string;
    treatment_for_adverse_events: string;
    site_notes: Array<{
      id: string;
      date: string;
      noteType: string;
      content: string;
      viewSource: string;
      sourceLink?: string; // Also support sourceLink for consistency with edit form
      sourceType: string;
      attachments: (string | { url: string; name: string; size: number; type: string })[];
      isVisible: boolean;
    }>;
    results_available: boolean;
    endpoints_met: boolean;
    adverse_events_reported: boolean;
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
      attachments: (string | { url: string; name: string; size: number; type: string })[];
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
    additional_notes: string;
    pipeline_data: Array<{
      id: string;
      date: string;
      information: string;
      url: string;
      fileUrl?: string;
      attachments: any[];
      isVisible: boolean;
    }>;
    press_releases: Array<{
      id: string;
      date: string;
      title: string;
      description: string;
      url: string;
      fileUrl?: string;
      attachments: any[];
      isVisible: boolean;
    }>;
    publications: Array<{
      id: string;
      date: string;
      type: string;
      title: string;
      description: string;
      url: string;
      fileUrl?: string;
      attachments: any[];
      isVisible: boolean;
    }>;
    trial_registries: Array<{
      id: string;
      date: string;
      registry: string;
      identifier: string;
      description: string;
      url: string;
      fileUrl?: string;
      attachments: any[];
      isVisible: boolean;
    }>;
    associated_studies: Array<{
      id: string;
      date: string;
      type: string;
      title: string;
      description: string;
      url: string;
      fileUrl?: string;
      attachments: any[];
      isVisible: boolean;
    }>;
  };

  // Step 5-8: Notes & Documentation
  step5_8: {
    date_type: string;
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
    link: string;
    internalNote: string;
    logsAttachments?: Array<{
      name: string;
      url: string;
      fileUrl?: string; // Added for consistency
      type: string;
    }>;
    fullReview?: boolean;
    fullReviewUser?: string;
    nextReviewDate?: string;
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
      changeType?: 'field_change' | 'content_addition' | 'content_removal' | 'visibility_change' | 'creation';
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

// Initial form state
const initialFormState: TherapeuticFormData = {
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
    reference_links: [""],
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
    primaryOutcomeMeasures: [""],
    otherOutcomeMeasures: [""],
    study_design_keywords: [],
    study_design: "",
    treatment_regimen: "",
    number_of_arms: "",
  },
  step5_3: {
    inclusion_criteria: [""],
    exclusion_criteria: [""],
    age_min: "",
    age_max: "",
    gender: "",
    healthy_volunteers: "",
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
    // Timing table fields
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
    trialDuration: {
      startDate: "",
      enrollmentCloseDate: "",
      resultPublishDate: "",
      trialEndDate: "",
      inclusionPeriod: 0,
      resultDuration: 0,
      overallDurationToComplete: 0,
      confidenceTypes: {
        startDate: "Estimated",
        enrollmentCloseDate: "Estimated",
        resultPublishDate: "Estimated",
        trialEndDate: "Estimated",
      },
    },
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
  step5_5: {
    study_sites: [""],
    principal_investigators: [""],
    site_status: "",
    site_countries: [""],
    site_regions: [""],
    site_contact_info: [""],
    trial_results: [""],
    trial_outcome: "",
    trial_outcome_content: "",
    trial_outcome_reference_date: "",
    trial_outcome_link: "",
    trial_outcome_attachment: null,
    adverse_event_reported: "",
    adverse_event_type: "",
    treatment_for_adverse_events: "",
    site_notes: [{
      id: "1",
      date: "",
      noteType: "",
      content: "",
      viewSource: "",
      sourceType: "",
      attachments: [],
      isVisible: true,
    }],
    results_available: false,
    endpoints_met: false,
    adverse_events_reported: false,
  },
  step5_6: {
    total_sites: "",
    study_start_date: "",
    first_patient_in: "",
    last_patient_in: "",
    study_end_date: "",
    interim_analysis_dates: [""],
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
    secondary_endpoint_results: [""],
    safety_results: "",
    efficacy_results: "",
    statistical_significance: "",
    adverse_events: [""],
    conclusion: "",
    additional_notes: "",
    pipeline_data: [{
      id: "1",
      date: "",
      information: "",
      url: "",
      fileUrl: "",
      attachments: [],
      isVisible: true,
    }],
    press_releases: [{
      id: "1",
      date: "",
      title: "",
      description: "",
      url: "",
      fileUrl: "",
      attachments: [],
      isVisible: true,
    }],
    publications: [{
      id: "1",
      date: "",
      type: "",
      title: "",
      description: "",
      url: "",
      fileUrl: "",
      attachments: [],
      isVisible: true,
    }],
    trial_registries: [{
      id: "1",
      date: "",
      registry: "",
      identifier: "",
      description: "",
      url: "",
      fileUrl: "",
      attachments: [],
      isVisible: true,
    }],
    associated_studies: [{
      id: "1",
      date: "",
      type: "",
      title: "",
      description: "",
      url: "",
      fileUrl: "",
      attachments: [],
      isVisible: true,
    }],
  },
  step5_8: {
    date_type: "",
    notes: [],
    link: "",
    internalNote: "",
    logsAttachments: [],
    changesLog: [{
      id: "1",
      timestamp: new Date().toISOString(),
      user: "admin",
      action: "created",
      details: "Created trial",
      field: "trial",
      oldValue: "",
      newValue: "new",
      step: "step5_1",
      changeType: "creation"
    }],
    creationInfo: {
      createdDate: new Date().toISOString(),
      createdUser: "admin",
    },
    modificationInfo: {
      lastModifiedDate: new Date().toISOString(),
      lastModifiedUser: "admin",
      modificationCount: 0,
    },
  },
};

// Action types for the reducer
type FormAction =
  | {
    type: "UPDATE_STEP";
    step: keyof TherapeuticFormData;
    data: Partial<TherapeuticFormData[keyof TherapeuticFormData]>;
  }
  | {
    type: "UPDATE_FIELD";
    step: keyof TherapeuticFormData;
    field: string;
    value: any;
  }
  | { type: "ADD_ARRAY_ITEM"; step: keyof TherapeuticFormData; field: string }
  | {
    type: "REMOVE_ARRAY_ITEM";
    step: keyof TherapeuticFormData;
    field: string;
    index: number;
  }
  | {
    type: "UPDATE_ARRAY_ITEM";
    step: keyof TherapeuticFormData;
    field: string;
    index: number;
    value: any;
  }
  | { type: "RESET_FORM" }
  | { type: "LOAD_FORM"; data: TherapeuticFormData };

// Reducer function
function formReducer(
  state: TherapeuticFormData,
  action: FormAction
): TherapeuticFormData {
  switch (action.type) {
    case "UPDATE_STEP":
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          ...action.data,
        },
      };

    case "UPDATE_FIELD":
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: action.value,
        },
      };

    case "ADD_ARRAY_ITEM":
      const currentArray = state[action.step][
        action.field as keyof (typeof state)[typeof action.step]
      ] as string[];
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: [...currentArray, ""],
        },
      };

    case "REMOVE_ARRAY_ITEM":
      const arrayToRemove = state[action.step][
        action.field as keyof (typeof state)[typeof action.step]
      ] as string[];
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: arrayToRemove.filter(
            (_, index) => index !== action.index
          ),
        },
      };

    case "UPDATE_ARRAY_ITEM":
      const arrayToUpdate = state[action.step][
        action.field as keyof (typeof state)[typeof action.step]
      ] as string[];
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: arrayToUpdate.map((item, index) =>
            index === action.index ? action.value : item
          ),
        },
      };

    case "RESET_FORM":
      return initialFormState;

    case "LOAD_FORM":
      return action.data;

    default:
      return state;
  }
}

// Context interface
interface TherapeuticFormContextType {
  formData: TherapeuticFormData;
  updateStep: (
    step: keyof TherapeuticFormData,
    data: Partial<TherapeuticFormData[keyof TherapeuticFormData]>
  ) => void;
  updateField: (
    step: keyof TherapeuticFormData,
    field: string,
    value: any
  ) => void;
  addArrayItem: (step: keyof TherapeuticFormData, field: string) => void;
  removeArrayItem: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number
  ) => void;
  updateArrayItem: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number,
    value: any
  ) => void;
  addComplexArrayItem: (step: keyof TherapeuticFormData, field: string, template: any) => void;
  updateComplexArrayItem: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number,
    updates: any
  ) => void;
  toggleArrayItemVisibility: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number
  ) => void;
  addNote: (step: keyof TherapeuticFormData, field: string) => void;
  updateNote: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number,
    updates: Partial<any>
  ) => void;
  removeNote: (step: keyof TherapeuticFormData, field: string, index: number) => void;
  toggleNoteVisibility: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number
  ) => void;
  addReference: (step: keyof TherapeuticFormData, field: string) => void;
  updateReference: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number,
    updates: Partial<any>
  ) => void;
  removeReference: (step: keyof TherapeuticFormData, field: string, index: number) => void;
  toggleReferenceVisibility: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number
  ) => void;
  addSiteNote: (step: keyof TherapeuticFormData, field: string) => void;
  updateSiteNote: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number,
    updates: Partial<any>
  ) => void;
  removeSiteNote: (step: keyof TherapeuticFormData, field: string, index: number) => void;
  toggleSiteNoteVisibility: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number
  ) => void;
  addInterimAnalysisNote: (step: keyof TherapeuticFormData, field: string) => void;
  updateInterimAnalysisNote: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number,
    updates: Partial<any>
  ) => void;
  removeInterimAnalysisNote: (step: keyof TherapeuticFormData, field: string, index: number) => void;
  toggleInterimAnalysisNoteVisibility: (
    step: keyof TherapeuticFormData,
    field: string,
    index: number
  ) => void;
  addChangeLog: (
    step: keyof TherapeuticFormData,
    field: string,
    action: string,
    details: string,
    fieldName?: string,
    oldValue?: string,
    newValue?: string
  ) => void;
  resetForm: () => void;
  loadForm: (data: TherapeuticFormData) => void;
  getFormData: () => TherapeuticFormData;
  saveTrial: () => Promise<{ success: boolean; message: string; trialId?: string; trialIdentifier?: string }>;
}

// Create the context
const TherapeuticFormContext = createContext<
  TherapeuticFormContextType | undefined
>(undefined);

// Provider component
export function TherapeuticFormProvider({ children }: { children: ReactNode }) {
  const [formData, dispatch] = useReducer(formReducer, initialFormState);

  // Helper function to get tab name from step
  const getTabName = (step: keyof TherapeuticFormData): string => {
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

  const updateStep = (
    step: keyof TherapeuticFormData,
    data: Partial<TherapeuticFormData[keyof TherapeuticFormData]>
  ) => {
    dispatch({ type: "UPDATE_STEP", step, data });
  };

  const updateField = (
    step: keyof TherapeuticFormData,
    field: string,
    value: any
  ) => {
    // Get the current value for change tracking
    const currentValue = (formData[step] as any)[field];

    // Dispatch the update
    dispatch({ type: "UPDATE_FIELD", step, field, value });

    // Enhanced audit logging
    if (field !== "changesLog" && field !== "creationInfo" && field !== "modificationInfo" && currentValue !== value) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const tabName = getTabName(step);

      // Determine change type and action
      let changeType: 'field_change' | 'content_addition' | 'content_removal' | 'visibility_change' | 'creation' = 'field_change';
      let action = "changed";
      let details = "";

      if (currentValue === "" || currentValue === undefined || currentValue === null) {
        changeType = 'content_addition';
        action = "added";
        details = `${tabName} updated`;
      } else if (value === "" || value === undefined || value === null) {
        changeType = 'content_removal';
        action = "removed";
        details = `${tabName} updated`;
      } else {
        changeType = 'field_change';
        action = "changed";
        details = `${tabName} updated`;
      }

      // Check if we should consolidate with existing changes from today
      const existingChanges = (formData.step5_8 as any).changesLog || [];
      const todayChanges = existingChanges.filter((change: any) =>
        change.timestamp.startsWith(today) && change.user === "admin"
      );

      let shouldConsolidate = todayChanges.length > 0 && todayChanges.some((change: any) =>
        change.step === step && change.changeType === changeType
      );

      // Add to changes log
      setTimeout(() => {
        const currentArray = (formData.step5_8 as any).changesLog || [];

        if (shouldConsolidate) {
          // Find the existing entry to consolidate with
          const existingEntryIndex = currentArray.findIndex((change: any) =>
            change.timestamp.startsWith(today) &&
            change.user === "admin" &&
            change.step === step &&
            change.changeType === changeType
          );

          if (existingEntryIndex !== -1) {
            // Update existing entry timestamp (details remain the same since all messages are simplified)
            const updatedArray = [...currentArray];
            const tabName = getTabName(step);
            updatedArray[existingEntryIndex] = {
              ...updatedArray[existingEntryIndex],
              details: `${tabName} updated`,
              timestamp: now.toISOString(), // Update to latest time
            };

            dispatch({
              type: "UPDATE_FIELD",
              step: "step5_8",
              field: "changesLog",
              value: updatedArray,
            });
          }
        } else {
          // Create new entry
          const newLogEntry = {
            id: Date.now().toString(),
            timestamp: now.toISOString(),
            user: "admin",
            action,
            details,
            field,
            oldValue: currentValue,
            newValue: value,
            step,
            changeType,
          };

          dispatch({
            type: "UPDATE_FIELD",
            step: "step5_8",
            field: "changesLog",
            value: [...currentArray, newLogEntry],
          });
        }

        // Update modification info
        dispatch({
          type: "UPDATE_FIELD",
          step: "step5_8",
          field: "modificationInfo",
          value: {
            lastModifiedDate: now.toISOString(),
            lastModifiedUser: "admin",
            modificationCount: (formData.step5_8 as any).modificationInfo.modificationCount + 1,
          },
        });
      }, 0);
    }
  };

  const addArrayItem = (step: keyof TherapeuticFormData, field: string) => {
    dispatch({ type: "ADD_ARRAY_ITEM", step, field });

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
        newValue: "new item",
      };
      dispatch({
        type: "UPDATE_FIELD",
        step,
        field: "changesLog",
        value: [...currentArray, newLogEntry],
      });
    }, 0);
  };

  const removeArrayItem = (
    step: keyof TherapeuticFormData,
    field: string,
    index: number
  ) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const removedItem = currentArray[index];

    dispatch({ type: "REMOVE_ARRAY_ITEM", step, field, index });

    // Log the array removal
    setTimeout(() => {
      const changesArray = (formData[step] as any).changesLog || [];
      const tabName = getTabName(step);
      const newLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: "admin",
        action: "removed",
        details: `${tabName} updated`,
        field,
        oldValue: removedItem || "item",
        newValue: "",
      };
      dispatch({
        type: "UPDATE_FIELD",
        step,
        field: "changesLog",
        value: [...changesArray, newLogEntry],
      });
    }, 0);
  };

  const updateArrayItem = (
    step: keyof TherapeuticFormData,
    field: string,
    index: number,
    value: any
  ) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const oldValue = currentArray[index];

    dispatch({ type: "UPDATE_ARRAY_ITEM", step, field, index, value });

    // Log the array item update
    setTimeout(() => {
      const changesArray = (formData[step] as any).changesLog || [];
      const tabName = getTabName(step);
      const newLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: "admin",
        action: "updated",
        details: `${tabName} updated`,
        field,
        oldValue: oldValue || "",
        newValue: value,
      };
      dispatch({
        type: "UPDATE_FIELD",
        step,
        field: "changesLog",
        value: [...changesArray, newLogEntry],
      });
    }, 0);
  };

  const addComplexArrayItem = (
    step: keyof TherapeuticFormData,
    field: string,
    template: any
  ) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const newItem = {
      ...template,
      id: Date.now().toString(),
    };
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: [...currentArray, newItem],
    });
  };

  const updateComplexArrayItem = (
    step: keyof TherapeuticFormData,
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
    step: keyof TherapeuticFormData,
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

  // Note management functions
  const addNote = (step: keyof TherapeuticFormData, field: string) => {
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
    step: keyof TherapeuticFormData,
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
    step: keyof TherapeuticFormData,
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
    step: keyof TherapeuticFormData,
    field: string,
    index: number
  ) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const item = currentArray[index];
    const updatedArray = currentArray.map((item, idx) =>
      idx === index ? { ...item, isVisible: !item.isVisible } : item
    );
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: updatedArray,
    });

    // Log the visibility change with simplified details
    const action = item.isVisible ? "hidden" : "shown";
    const tabName = getTabName(step);
    const details = `${tabName} updated`;

    setTimeout(() => {
      const currentLogArray = (formData.step5_8 as any).changesLog || [];
      const newLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: "admin",
        action,
        details,
        field: `${field}[${index}]`,
        oldValue: item.isVisible ? "show" : "hide",
        newValue: item.isVisible ? "hide" : "show",
        step,
        changeType: "visibility_change" as const,
      };
      dispatch({
        type: "UPDATE_FIELD",
        step: "step5_8",
        field: "changesLog",
        value: [...currentLogArray, newLogEntry],
      });

      // Update modification info
      dispatch({
        type: "UPDATE_FIELD",
        step: "step5_8",
        field: "modificationInfo",
        value: {
          lastModifiedDate: new Date().toISOString(),
          lastModifiedUser: "admin",
          modificationCount: (formData.step5_8 as any).modificationInfo.modificationCount + 1,
        },
      });
    }, 0);
  };

  // Reference management functions
  const addReference = (step: keyof TherapeuticFormData, field: string) => {
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
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: [...currentArray, newReference],
    });
  };

  const updateReference = (
    step: keyof TherapeuticFormData,
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

  const removeReference = (
    step: keyof TherapeuticFormData,
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

  const toggleReferenceVisibility = (
    step: keyof TherapeuticFormData,
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

  // Site note management functions
  const addSiteNote = (step: keyof TherapeuticFormData, field: string) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const newSiteNote = {
      id: Date.now().toString(),
      date: "",
      noteType: "",
      content: "",
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
    step: keyof TherapeuticFormData,
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

  const removeSiteNote = (
    step: keyof TherapeuticFormData,
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

  const toggleSiteNoteVisibility = (
    step: keyof TherapeuticFormData,
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

  // Interim analysis note management functions
  const addInterimAnalysisNote = (step: keyof TherapeuticFormData, field: string) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const newInterimAnalysisNote = {
      id: Date.now().toString(),
      date: "",
      noteType: "Analysis",
      content: "",
      viewSource: "",
      attachments: [],
      isVisible: true,
    };
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: [...currentArray, newInterimAnalysisNote],
    });
  };

  const updateInterimAnalysisNote = (
    step: keyof TherapeuticFormData,
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

  const removeInterimAnalysisNote = (
    step: keyof TherapeuticFormData,
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

  const toggleInterimAnalysisNoteVisibility = (
    step: keyof TherapeuticFormData,
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

  // Change log management function
  const addChangeLog = (
    step: keyof TherapeuticFormData,
    field: string,
    action: string,
    details: string,
    fieldName?: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const currentArray = (formData[step] as any)[field] as any[];
    const newLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: "admin", // This could be dynamic based on current user
      action,
      details,
      field: fieldName,
      oldValue,
      newValue,
    };
    dispatch({
      type: "UPDATE_FIELD",
      step,
      field,
      value: [...currentArray, newLogEntry],
    });
  };

  const resetForm = () => {
    dispatch({ type: "RESET_FORM" });
  };

  const loadForm = (data: TherapeuticFormData) => {
    dispatch({ type: "LOAD_FORM", data });
  };

  const getFormData = () => formData;

  // Helper functions for data transformation
  const ensureString = (value: any): string => {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    const stringValue = String(value).trim();
    return stringValue === "" ? "" : stringValue;
  };

  const ensureNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || value === "") {
      return defaultValue;
    }
    const num = parseInt(String(value));
    return isNaN(num) ? defaultValue : num;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      // Handle MM-DD-YYYY format (from CustomDateInput)
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [month, day, year] = dateString.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // Otherwise, try to parse and format
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const saveTrial = async (): Promise<{ success: boolean; message: string; trialId?: string; trialIdentifier?: string }> => {
    try {
      const allFormData = getFormData();

      console.log("🚀 ============ SAVING NEW TRIAL - START ============");
      console.log("📋 All Form Data Being Saved:", JSON.stringify(allFormData, null, 2));
      console.log("📊 Form Data Structure Check:", {
        step5_1_keys: Object.keys(allFormData.step5_1),
        step5_2_keys: Object.keys(allFormData.step5_2),
        step5_3_keys: Object.keys(allFormData.step5_3),
        step5_4_keys: Object.keys(allFormData.step5_4),
        step5_5_keys: Object.keys(allFormData.step5_5),
        step5_6_keys: Object.keys(allFormData.step5_6),
        step5_7_keys: Object.keys(allFormData.step5_7),
        step5_8_keys: Object.keys(allFormData.step5_8),
      });

      // Get user ID from localStorage or use default admin UUID
      const currentUserId = typeof window !== 'undefined' ? localStorage.getItem("userId") || "2be97b5e-5bf3-43f2-b84a-4db4a138e497" : "2be97b5e-5bf3-43f2-b84a-4db4a138e497";

      console.log("👤 Current User ID:", currentUserId);

      // Transform the form data to match the API structure
      const therapeuticPayload = {
        user_id: currentUserId, // Use valid UUID from localStorage or default admin UUID
        overview: {
          therapeutic_area: Array.isArray(allFormData.step5_1.therapeutic_area)
            ? allFormData.step5_1.therapeutic_area.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.therapeutic_area),
          trial_identifier: allFormData.step5_1.trial_identifier.filter(Boolean).length > 0 ? allFormData.step5_1.trial_identifier.filter(Boolean) : [],
          trial_phase: ensureString(allFormData.step5_1.trial_phase),
          status: ensureString(allFormData.step5_1.status),
          primary_drugs: Array.isArray(allFormData.step5_1.primary_drugs)
            ? allFormData.step5_1.primary_drugs.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.primary_drugs),
          other_drugs: Array.isArray(allFormData.step5_1.other_drugs)
            ? allFormData.step5_1.other_drugs.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.other_drugs),
          title: ensureString(allFormData.step5_1.title),
          disease_type: Array.isArray(allFormData.step5_1.disease_type)
            ? allFormData.step5_1.disease_type.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.disease_type),
          patient_segment: Array.isArray(allFormData.step5_1.patient_segment)
            ? allFormData.step5_1.patient_segment.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.patient_segment),
          line_of_therapy: Array.isArray(allFormData.step5_1.line_of_therapy)
            ? allFormData.step5_1.line_of_therapy.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.line_of_therapy),
          reference_links: allFormData.step5_1.reference_links.filter(Boolean).length > 0 ? allFormData.step5_1.reference_links.filter(Boolean) : [],
          trial_tags: Array.isArray(allFormData.step5_1.trial_tags)
            ? allFormData.step5_1.trial_tags.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.trial_tags),
          sponsor_collaborators: Array.isArray(allFormData.step5_1.sponsor_collaborators)
            ? allFormData.step5_1.sponsor_collaborators.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.sponsor_collaborators),
          sponsor_field_activity: Array.isArray(allFormData.step5_1.sponsor_field_activity)
            ? allFormData.step5_1.sponsor_field_activity.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.sponsor_field_activity),
          associated_cro: Array.isArray(allFormData.step5_1.associated_cro)
            ? allFormData.step5_1.associated_cro.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.associated_cro),
          countries: Array.isArray(allFormData.step5_1.countries)
            ? allFormData.step5_1.countries.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.countries),
          region: Array.isArray(allFormData.step5_1.region)
            ? allFormData.step5_1.region.filter(Boolean).join(", ")
            : ensureString(allFormData.step5_1.region),
          trial_record_status: ensureString(allFormData.step5_1.trial_record_status),
        },
        outcome: {
          purpose_of_trial: ensureString(allFormData.step5_2.purpose_of_trial),
          summary: ensureString(allFormData.step5_2.summary),
          primary_outcome_measure: allFormData.step5_2.primaryOutcomeMeasures.filter(Boolean).join("|||") || "",
          other_outcome_measure: allFormData.step5_2.otherOutcomeMeasures.filter(Boolean).join("|||") || "",
          study_design_keywords: allFormData.step5_2.study_design_keywords.filter(Boolean).join(", ") || "",
          study_design: ensureString(allFormData.step5_2.study_design),
          treatment_regimen: ensureString(allFormData.step5_2.treatment_regimen),
          number_of_arms: ensureNumber(allFormData.step5_2.number_of_arms, 1),
        },
        criteria: {
          inclusion_criteria: allFormData.step5_3.inclusion_criteria.filter(Boolean).join("; ") || "",
          exclusion_criteria: allFormData.step5_3.exclusion_criteria.filter(Boolean).join("; ") || "",
          age_from: ensureString(allFormData.step5_3.age_min),
          age_to: ensureString(allFormData.step5_3.age_max),
          sex: ensureString(allFormData.step5_3.gender),
          healthy_volunteers: allFormData.step5_3.healthy_volunteers[0] || "",
          subject_type: ensureString(allFormData.step5_3.subject_type),
          target_no_volunteers: ensureString(allFormData.step5_3.target_no_volunteers || allFormData.step5_4.estimated_enrollment),
          actual_enrolled_volunteers: ensureString(allFormData.step5_3.actual_enrolled_volunteers || allFormData.step5_4.actual_enrollment),
        },
        timing: (() => {
          const timingData = {
            start_date_actual: formatDate(allFormData.step5_4.actual_start_date),
            start_date_benchmark: formatDate(allFormData.step5_4.benchmark_start_date),
            start_date_estimated: formatDate(allFormData.step5_4.estimated_start_date),
            inclusion_period_actual: ensureString(allFormData.step5_4.actual_inclusion_period),
            inclusion_period_benchmark: ensureString(allFormData.step5_4.benchmark_inclusion_period),
            inclusion_period_estimated: ensureString(allFormData.step5_4.estimated_inclusion_period),
            enrollment_closed_actual: formatDate(allFormData.step5_4.actual_enrollment_closed_date),
            enrollment_closed_benchmark: formatDate(allFormData.step5_4.benchmark_enrollment_closed_date),
            enrollment_closed_estimated: formatDate(allFormData.step5_4.estimated_enrollment_closed_date),
            primary_outcome_duration_actual: ensureString(allFormData.step5_4.actual_primary_outcome_duration),
            primary_outcome_duration_benchmark: ensureString(allFormData.step5_4.benchmark_primary_outcome_duration),
            primary_outcome_duration_estimated: ensureString(allFormData.step5_4.estimated_primary_outcome_duration),
            trial_end_date_actual: formatDate(allFormData.step5_4.actual_trial_end_date),
            trial_end_date_benchmark: formatDate(allFormData.step5_4.benchmark_trial_end_date),
            trial_end_date_estimated: formatDate(allFormData.step5_4.estimated_trial_end_date),
            result_duration_actual: ensureString(allFormData.step5_4.actual_result_duration),
            result_duration_benchmark: ensureString(allFormData.step5_4.benchmark_result_duration),
            result_duration_estimated: ensureString(allFormData.step5_4.estimated_result_duration),
            result_published_date_actual: formatDate(allFormData.step5_4.actual_result_published_date),
            result_published_date_benchmark: formatDate(allFormData.step5_4.benchmark_result_published_date),
            result_published_date_estimated: formatDate(allFormData.step5_4.estimated_result_published_date),
            overall_duration_complete: ensureString(allFormData.step5_4.overall_duration_complete),
            overall_duration_publish: ensureString(allFormData.step5_4.overall_duration_publish),
            duration_converter_data: allFormData.step5_4.durationConverterData ? JSON.stringify(allFormData.step5_4.durationConverterData) : null,
            enhanced_calculator_data: allFormData.step5_4.enhancedCalculatorData ? JSON.stringify(allFormData.step5_4.enhancedCalculatorData) : null,
            timing_references: allFormData.step5_4.references.filter(ref => ref.isVisible && (ref.date || ref.content)).map(ref => ({
              id: ref.id,
              date: formatDate(ref.date),
              registryType: ref.registryType,
              content: ref.content,
              viewSource: ref.viewSource,
              attachments: ref.attachments,
              isVisible: ref.isVisible
            }))
          };

          console.log('📊 TIMING DATA BEING SAVED:', {
            rawFormData: allFormData.step5_4,
            formattedTimingData: timingData
          });

          return timingData;
        })(),
        results: {
          results_available: allFormData.step5_5.results_available ? "Yes" : "No",
          endpoints_met: allFormData.step5_5.endpoints_met ? "Yes" : "No",
          trial_outcome: ensureString(allFormData.step5_5.trial_outcome) || ensureString(allFormData.step5_7.primary_endpoint_results) || null,
          reference: formatDate(allFormData.step5_5.trial_outcome_reference_date) || null,
          trial_outcome_content: ensureString(allFormData.step5_5.trial_outcome_content) || null,
          trial_outcome_link: ensureString(allFormData.step5_5.trial_outcome_link) || null,
          trial_outcome_attachment: allFormData.step5_5.trial_outcome_attachment?.url || (allFormData.step5_5.trial_outcome_attachment ? "Yes" : null),
          trial_results: allFormData.step5_5.trial_results.filter(Boolean).length > 0
            ? allFormData.step5_5.trial_results.filter(Boolean)
            : (allFormData.step5_7.secondary_endpoint_results.filter(Boolean).length > 0 ? allFormData.step5_7.secondary_endpoint_results.filter(Boolean) : null),
          adverse_event_reported: allFormData.step5_5.adverse_events_reported ? "Yes" : "No",
          adverse_event_type: ensureString(allFormData.step5_5.adverse_event_type) || (allFormData.step5_7.adverse_events.filter(Boolean).join(", ") || null),
          treatment_for_adverse_events: ensureString(allFormData.step5_5.treatment_for_adverse_events) || ensureString(allFormData.step5_7.safety_results) || null,
          site_notes: allFormData.step5_5.site_notes.filter(note => note.isVisible && (note.date || note.content)).length > 0
            ? allFormData.step5_5.site_notes.filter(note => note.isVisible && (note.date || note.content)).map(note => {
                // Debug logging
                console.log('Mapping site note for save:', {
                  id: note.id,
                  viewSource: note.viewSource,
                  sourceLink: note.sourceLink,
                  source: note.source,
                  finalSourceLink: note.sourceLink || note.viewSource || note.source || ""
                });
                
                return {
                  date: formatDate(note.date),
                  type: note.noteType,
                  content: note.content,
                  sourceLink: note.sourceLink || note.viewSource || note.source || "", // Check all possible field names: sourceLink, viewSource, source
                  sourceType: note.sourceType,
                  attachments: (note.attachments || []).map((att: any) =>
                    typeof att === 'string' ? att : (att.url || att.name || att)
                  )
                };
              })
            : null
        },
        sites: {
          total: ensureNumber(allFormData.step5_6.total_sites, 0),
          // Save references as JSON stringified array in notes field (same as edit form expects)
          notes: (() => {
            const filteredReferences = allFormData.step5_6.references.filter(ref => ref.isVisible && (ref.date || ref.content));
            console.log('📝 Sites - Saving references:', {
              total_references: allFormData.step5_6.references?.length || 0,
              filtered_references: filteredReferences.length,
              references_data: filteredReferences
            });

            if (filteredReferences.length > 0) {
              const mappedReferences = filteredReferences.map(ref => ({
                id: ref.id,
                date: formatDate(ref.date),
                registryType: ref.registryType,
                content: ref.content,
                viewSource: ref.viewSource,
                attachments: (ref.attachments || []).map((att: any) =>
                  typeof att === 'string' ? att : (att.url || att.name || att)
                ),
                isVisible: ref.isVisible
              }));
              const jsonString = JSON.stringify(mappedReferences);
              console.log('📝 Sites - Notes JSON stringified:', jsonString);
              return jsonString;
            }
            console.log('📝 Sites - No references to save');
            return null;
          })(),
          study_sites: allFormData.step5_5.study_sites.filter(Boolean),
          principal_investigators: allFormData.step5_5.principal_investigators.filter(Boolean),
          site_status: allFormData.step5_5.site_status || "",
          site_countries: allFormData.step5_5.site_countries.filter(Boolean),
          site_regions: allFormData.step5_5.site_regions.filter(Boolean),
          site_contact_info: allFormData.step5_5.site_contact_info.filter(Boolean),
          // Keep site_notes for backward compatibility (but notes field is the primary one)
          site_notes: allFormData.step5_6.references.filter(ref => ref.isVisible && (ref.date || ref.content)).map(ref => ({
            id: ref.id,
            date: formatDate(ref.date),
            registryType: ref.registryType,
            content: ref.content,
            viewSource: ref.viewSource,
            attachments: (ref.attachments || []).map((att: any) =>
              typeof att === 'string' ? att : (att.url || att.name || att)
            ),
            isVisible: ref.isVisible
          }))
        },
        other_sources: {
          pipeline_data: (allFormData.step5_7.pipeline_data || []).filter(item => {
            const isVisible = item.isVisible !== false;
            return isVisible && (item.date || item.information || item.url || item.fileUrl);
          }).map(item => ({
            ...item,
            date: formatDate(item.date) // Format date from MM-DD-YYYY to YYYY-MM-DD
          })),
          press_releases: (allFormData.step5_7.press_releases || []).filter(item => {
            const isVisible = item.isVisible !== false;
            return isVisible && (item.date || item.title || item.url || item.fileUrl);
          }).map(item => ({
            ...item,
            date: formatDate(item.date) // Format date from MM-DD-YYYY to YYYY-MM-DD
          })),
          publications: (allFormData.step5_7.publications || []).filter(item => {
            // Default isVisible to true if not set
            const isVisible = item.isVisible !== false;
            // Include item if it's visible and has at least one field filled (including date)
            const hasData = isVisible && (
              (item.date && item.date.trim() !== "") || 
              (item.type && item.type.trim() !== "") || 
              (item.title && item.title.trim() !== "") || 
              (item.url && item.url.trim() !== "") || 
              (item.fileUrl && item.fileUrl.trim() !== "") ||
              (item.file && item.file.trim() !== "")
            );
            if (!hasData) {
              console.log('Filtering out publication item (no data):', item);
            }
            return hasData;
          }).map(item => ({
            ...item,
            date: formatDate(item.date) // Format date from MM-DD-YYYY to YYYY-MM-DD
          })),
          trial_registries: (allFormData.step5_7.trial_registries || []).filter(item => {
            // Default isVisible to true if not set
            const isVisible = item.isVisible !== false;
            // Include item if it's visible and has at least one field filled (including date)
            const hasData = isVisible && (
              (item.date && item.date.trim() !== "") || 
              (item.registry && item.registry.trim() !== "") || 
              (item.identifier && item.identifier.trim() !== "") || 
              (item.url && item.url.trim() !== "") || 
              (item.fileUrl && item.fileUrl.trim() !== "") ||
              (item.file && item.file.trim() !== "")
            );
            if (!hasData) {
              console.log('Filtering out trial registry item (no data):', item);
            }
            return hasData;
          }).map(item => ({
            ...item,
            date: formatDate(item.date) // Format date from MM-DD-YYYY to YYYY-MM-DD
          })),
          associated_studies: (allFormData.step5_7.associated_studies || []).filter(item => {
            // Default isVisible to true if not set
            const isVisible = item.isVisible !== false;
            // Include item if it's visible and has at least one field filled (including date)
            const hasData = isVisible && (
              (item.date && item.date.trim() !== "") || 
              (item.type && item.type.trim() !== "") || 
              (item.title && item.title.trim() !== "") || 
              (item.url && item.url.trim() !== "") || 
              (item.fileUrl && item.fileUrl.trim() !== "") ||
              (item.file && item.file.trim() !== "")
            );
            if (!hasData) {
              console.log('Filtering out associated study item (no data):', item);
            }
            return hasData;
          }).map(item => ({
            ...item,
            date: formatDate(item.date) // Format date from MM-DD-YYYY to YYYY-MM-DD
          })),
        },
        logs: {
          trial_changes_log: allFormData.step5_8.changesLog.length > 0
            ? allFormData.step5_8.changesLog.map(change =>
              `${change.timestamp}: ${change.user} ${change.action} - ${change.details}`
            ).join("; ")
            : "Trial created",
          trial_added_date: new Date().toISOString(),
          last_modified_date: new Date().toISOString(),
          last_modified_user: currentUserId, // Use valid UUID instead of "admin"
          full_review_user: (allFormData.step5_8 as any).fullReviewUser || null, // Can be null, not "admin"
          next_review_date: (allFormData.step5_8 as any).nextReviewDate
            ? formatDate((allFormData.step5_8 as any).nextReviewDate)
            : null,
          internal_note: (allFormData.step5_8 as any).internalNote || null,
          attachment: (allFormData.step5_8 as any).logsAttachments && (allFormData.step5_8 as any).logsAttachments.length > 0
            ? JSON.stringify((allFormData.step5_8 as any).logsAttachments)
            : null,
        },
        notes: (() => {
          const rawNotes = allFormData.step5_8.notes || [];
          const visibleNotes = rawNotes.filter((note: any) => {
            const content =
              typeof note.content === "string"
                ? note.content
                : note.content && typeof note.content === "object"
                  ? (note.content as any).text || (note.content as any).content
                  : "";
            const hasContent = Boolean(content && String(content).trim());
            const hasSource =
              Boolean(note.sourceLink && String(note.sourceLink).trim()) ||
              Boolean((note as any).sourceType && String((note as any).sourceType).trim()) ||
              Boolean((note as any).sourceUrl && String((note as any).sourceUrl).trim());
            const hasAttachments = Array.isArray(note.attachments) && note.attachments.length > 0;
            return note.isVisible !== false && (hasContent || hasSource || hasAttachments);
          });

          const formattedNotes = visibleNotes.map((note: any) => {
            const rawContent =
              typeof note.content === "string"
                ? note.content
                : note.content && typeof note.content === "object"
                  ? (note.content as any).text || (note.content as any).content
                  : "";
            const attachments = Array.isArray(note.attachments)
              ? note.attachments.map((attachment: any) => ({
                name: attachment?.name || "",
                url: attachment?.url || "",
                type: attachment?.type || "application/octet-stream",
              }))
              : [];

            return {
              id: note.id,
              date: formatDate(note.date),
              type: ensureString(note.type) || "General",
              content: ensureString(rawContent),
              sourceLink: ensureString(note.sourceLink),
              sourceType: ensureString((note as any).sourceType),
              sourceUrl: ensureString((note as any).sourceUrl),
              attachments,
              isVisible: true,
            };
          });

          const attachmentsList = formattedNotes
            .flatMap((note) => note.attachments)
            .filter((attachment) => attachment && (attachment.name || attachment.url));

          const sourceList = formattedNotes
            .map((note) => ({
              id: note.id,
              sourceLink: note.sourceLink,
              sourceType: note.sourceType,
              sourceUrl: note.sourceUrl,
            }))
            .filter(
              (source) =>
                (source.sourceLink && source.sourceLink.trim() !== "") ||
                (source.sourceType && source.sourceType.trim() !== "") ||
                (source.sourceUrl && source.sourceUrl.trim() !== "")
            );

          // New schema: Store all note data in the JSONB notes field
          const notesPayload = formattedNotes.length > 0 ? formattedNotes : [];

          console.log('[TherapeuticFormContext] Notes payload:', {
            notesCount: notesPayload.length,
            notes: typeof notesPayload
          });

          return {
            notes: notesPayload, // Store all note data in JSONB field
          };
        })(),
      };

      const fullUrl = buildApiUrl("/api/v1/therapeutic/create-therapeutic");
      console.log("📤 Making POST request to:", fullUrl);
      console.log("📦 Complete Payload Being Sent:", JSON.stringify(therapeuticPayload, null, 2));
      console.log("📏 Payload size:", JSON.stringify(therapeuticPayload).length, "characters");
      console.log("🔍 Individual Sections Check:");
      console.log("  - Overview:", therapeuticPayload.overview ? "✅ Present" : "❌ Missing");
      console.log("  - Outcome:", therapeuticPayload.outcome ? "✅ Present" : "❌ Missing");
      console.log("  - Other Sources:", therapeuticPayload.other_sources ? "✅ Present" : "❌ Missing");
      if (therapeuticPayload.other_sources) {
        console.log("  - Other Sources Details:", {
          pipeline_data: therapeuticPayload.other_sources.pipeline_data?.length || 0,
          press_releases: therapeuticPayload.other_sources.press_releases?.length || 0,
          publications: therapeuticPayload.other_sources.publications?.length || 0,
          trial_registries: therapeuticPayload.other_sources.trial_registries?.length || 0,
          associated_studies: therapeuticPayload.other_sources.associated_studies?.length || 0,
        });
        console.log("  - Publications sample:", therapeuticPayload.other_sources.publications?.[0]);
        console.log("  - Trial Registries sample:", therapeuticPayload.other_sources.trial_registries?.[0]);
        console.log("  - Associated Studies sample:", therapeuticPayload.other_sources.associated_studies?.[0]);
        console.log("  - Full Other Sources payload:", JSON.stringify(therapeuticPayload.other_sources, null, 2));
      } else {
        console.log("  - ⚠️ Other Sources is missing from payload!");
      }
      
      // Log raw form data before filtering
      console.log("  - Raw form step5_7 data:", {
        publications_count: allFormData.step5_7.publications?.length || 0,
        trial_registries_count: allFormData.step5_7.trial_registries?.length || 0,
        associated_studies_count: allFormData.step5_7.associated_studies?.length || 0,
        publications_sample: allFormData.step5_7.publications?.[0],
        trial_registries_sample: allFormData.step5_7.trial_registries?.[0],
        associated_studies_sample: allFormData.step5_7.associated_studies?.[0],
      });
      console.log("  - Criteria:", therapeuticPayload.criteria ? "✅ Present" : "❌ Missing");
      console.log("  - Timing:", therapeuticPayload.timing ? "✅ Present" : "❌ Missing");
      console.log("  - Results:", therapeuticPayload.results ? "✅ Present" : "❌ Missing");
      console.log("  - Sites:", therapeuticPayload.sites ? "✅ Present" : "❌ Missing");
      console.log("  - Other Sources:", therapeuticPayload.other_sources ? "✅ Present" : "❌ Missing");
      console.log("  - Logs:", therapeuticPayload.logs ? "✅ Present" : "❌ Missing");
      console.log("  - Notes:", therapeuticPayload.notes ? "✅ Present" : "❌ Missing");
      console.log("📊 Timing data specifically:", JSON.stringify(therapeuticPayload.timing, null, 2));
      console.log("📊 Other Sources data:", JSON.stringify(therapeuticPayload.other_sources, null, 2));

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(therapeuticPayload),
        credentials: 'include',
      });

      console.log("📨 Response Status:", response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = "Failed to create therapeutic trial";
        try {
          const errorData = await response.json();
          console.error("API Error Response:", errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ` - Details: ${errorData.details}`;
          }
        } catch (jsonError) {
          // If response is not JSON (e.g., HTML error page), get text
          const errorText = await response.text();
          console.error("Non-JSON error response:", errorText);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
        console.log("✅ Response Data Received:", result);
        console.log("🆔 Created Trial ID:", result.trial_id);
        console.log("🏷️ Created Trial Identifier:", result.trial_identifier);
      } catch (jsonError) {
        console.error("❌ Failed to parse JSON response:", jsonError);
        throw new Error("Invalid response format from server");
      }

      console.log("🎉 ============ SAVING NEW TRIAL - SUCCESS ============");

      return {
        success: true,
        message: "Therapeutic trial created successfully!",
        trialId: result.trial_id,
        trialIdentifier: result.trial_identifier,
      };
    } catch (error) {
      console.error("❌ ============ SAVING NEW TRIAL - ERROR ============");
      console.error("❌ Error Details:", error);
      if (error instanceof Error) {
        console.error("❌ Error Message:", error.message);
        console.error("❌ Error Stack:", error.stack);
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create therapeutic trial",
      };
    }
  };

  const value: TherapeuticFormContextType = {
    formData,
    updateStep,
    updateField,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    addComplexArrayItem,
    updateComplexArrayItem,
    toggleArrayItemVisibility,
    addNote,
    updateNote,
    removeNote,
    toggleNoteVisibility,
    addReference,
    updateReference,
    removeReference,
    toggleReferenceVisibility,
    addSiteNote,
    updateSiteNote,
    removeSiteNote,
    toggleSiteNoteVisibility,
    addInterimAnalysisNote,
    updateInterimAnalysisNote,
    removeInterimAnalysisNote,
    toggleInterimAnalysisNoteVisibility,
    addChangeLog,
    resetForm,
    loadForm,
    getFormData,
    saveTrial,
  };

  return (
    <TherapeuticFormContext.Provider value={value}>
      {children}
    </TherapeuticFormContext.Provider>
  );
}

// Custom hook to use the context
export function useTherapeuticForm() {
  const context = useContext(TherapeuticFormContext);
  if (context === undefined) {
    throw new Error(
      "useTherapeuticForm must be used within a TherapeuticFormProvider"
    );
  }
  return context;
}
