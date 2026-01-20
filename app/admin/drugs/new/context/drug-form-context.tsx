"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";

// Define the complete drug form structure
export interface DrugFormData {
  // Overview
  overview: {
    drug_name: string;
    generic_name: string;
    other_name: string;
    primary_name: string;
    global_status: string;
    development_status: string;
    drug_summary: string;
    originator: string;
    other_active_companies: string;
    therapeutic_area: string;
    disease_type: string;
    regulatory_designations: string;
    source_links: string;
    drug_record_status: string;
    attachments: string[];
    links: string[];
  };

  // Development Status
  devStatus: {
    entries: Array<{
      id: string;
      disease_type: string;
      therapeutic_class: string;
      originator: string;
      active_companies: string;
      countries: string;
      current_status: string;
      reference: string;
    }>;
  };

  // Drug Activity
  activity: {
    mechanism_of_action: string;
    biological_target: string;
    drug_technology: string;
    delivery_route: string;
    delivery_medium: string;
  };

  // Development
  development: {
    preclinical: string;
    status: string;
    sponsor: string;
  };

  // Other Sources
  otherSources: {
    data: string;
  };

  // Licensing & Marketing
  licencesMarketing: {
    agreement: string;
    marketing_approvals: string;
  };

  // Logs
  logs: {
    drug_changes_log: string;
    notes: Array<{
      id: string;
      date: string;
      type: string;
      content: string;
      sourceLink?: string;
      attachments?: string[];
      isVisible: boolean;
    }>;
  };
}

// Initial form state
const initialFormState: DrugFormData = {
  overview: {
    drug_name: "",
    generic_name: "",
    other_name: "",
    primary_name: "",
    global_status: "",
    development_status: "",
    drug_summary: "",
    originator: "",
    other_active_companies: "",
    therapeutic_area: "",
    disease_type: "",
    regulatory_designations: "",
    source_links: "",
    drug_record_status: "",
    attachments: [""],
    links: [""],
  },
  devStatus: {
    entries: [],
  },
  activity: {
    mechanism_of_action: "",
    biological_target: "",
    drug_technology: "",
    delivery_route: "",
    delivery_medium: "",
  },
  development: {
    preclinical: "",
    status: "",
    sponsor: "",
  },
  otherSources: {
    data: "",
  },
  licencesMarketing: {
    agreement: "",
    marketing_approvals: "",
  },
  logs: {
    drug_changes_log: "",
    notes: [],
  },
};

// Action types for the reducer
type FormAction =
  | {
      type: "UPDATE_STEP";
      step: keyof DrugFormData;
      data: Partial<DrugFormData[keyof DrugFormData]>;
    }
  | {
      type: "UPDATE_FIELD";
      step: keyof DrugFormData;
      field: string;
      value: any;
    }
  | { type: "ADD_ARRAY_ITEM"; step: keyof DrugFormData; field: string }
  | {
      type: "REMOVE_ARRAY_ITEM";
      step: keyof DrugFormData;
      field: string;
      index: number;
    }
  | {
      type: "UPDATE_ARRAY_ITEM";
      step: keyof DrugFormData;
      field: string;
      index: number;
      value: string;
    }
  | {
      type: "ADD_DEV_STATUS_ENTRY";
    }
  | {
      type: "REMOVE_DEV_STATUS_ENTRY";
      index: number;
    }
  | {
      type: "UPDATE_DEV_STATUS_ENTRY";
      index: number;
      field: string;
      value: string;
    }
  | { type: "RESET_FORM" }
  | { type: "LOAD_FORM"; data: DrugFormData };

// Form reducer
function formReducer(state: DrugFormData, action: FormAction): DrugFormData {
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
      const currentArray = state[action.step][action.field] as string[];
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: [...currentArray, ""],
        },
      };

    case "REMOVE_ARRAY_ITEM":
      const arrayToFilter = state[action.step][action.field] as string[];
      const filteredArray = arrayToFilter.filter(
        (_, index) => index !== action.index
      );
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: filteredArray.length > 0 ? filteredArray : [""],
        },
      };

    case "UPDATE_ARRAY_ITEM":
      const arrayToUpdate = state[action.step][action.field] as string[];
      const updatedArray = arrayToUpdate.map((item, index) =>
        index === action.index ? action.value : item
      );
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: updatedArray,
        },
      };

    case "RESET_FORM":
      return initialFormState;

    case "LOAD_FORM":
      return action.data;

    case "ADD_DEV_STATUS_ENTRY":
      const newEntry = {
        id: Date.now().toString(),
        disease_type: "",
        therapeutic_class: "",
        originator: "",
        active_companies: "",
        countries: "",
        current_status: "",
        reference: "",
      };
      return {
        ...state,
        devStatus: {
          ...state.devStatus,
          entries: [newEntry, ...state.devStatus.entries], // Latest entry first
        },
      };

    case "REMOVE_DEV_STATUS_ENTRY":
      const filteredEntries = state.devStatus.entries.filter(
        (_, index) => index !== action.index
      );
      return {
        ...state,
        devStatus: {
          ...state.devStatus,
          entries: filteredEntries,
        },
      };

    case "UPDATE_DEV_STATUS_ENTRY":
      const updatedEntries = state.devStatus.entries.map((entry, index) =>
        index === action.index
          ? { ...entry, [action.field]: action.value }
          : entry
      );
      return {
        ...state,
        devStatus: {
          ...state.devStatus,
          entries: updatedEntries,
        },
      };

    default:
      return state;
  }
}

// Context interface
interface DrugFormContextType {
  formData: DrugFormData;
  updateStep: (
    step: keyof DrugFormData,
    data: Partial<DrugFormData[keyof DrugFormData]>
  ) => void;
  updateField: (step: keyof DrugFormData, field: string, value: any) => void;
  addArrayItem: (step: keyof DrugFormData, field: string) => void;
  removeArrayItem: (
    step: keyof DrugFormData,
    field: string,
    index: number
  ) => void;
  updateArrayItem: (
    step: keyof DrugFormData,
    field: string,
    index: number,
    value: string
  ) => void;
  addNote: (step: keyof DrugFormData, field: string) => void;
  updateNote: (step: keyof DrugFormData, field: string, index: number, updates: Partial<any>) => void;
  removeNote: (step: keyof DrugFormData, field: string, index: number) => void;
  toggleNoteVisibility: (step: keyof DrugFormData, field: string, index: number) => void;
  addDevStatusEntry: () => void;
  removeDevStatusEntry: (index: number) => void;
  updateDevStatusEntry: (index: number, field: string, value: string) => void;
  resetForm: () => void;
  loadForm: (data: DrugFormData) => void;
  getFormData: () => DrugFormData;
}

// Create context
const DrugFormContext = createContext<DrugFormContextType | undefined>(
  undefined
);

// Provider component
export function DrugFormProvider({ children }: { children: ReactNode }) {
  const [formData, dispatch] = useReducer(formReducer, initialFormState);

  const updateStep = (
    step: keyof DrugFormData,
    data: Partial<DrugFormData[keyof DrugFormData]>
  ) => {
    dispatch({ type: "UPDATE_STEP", step, data });
  };

  const updateField = (step: keyof DrugFormData, field: string, value: any) => {
    dispatch({ type: "UPDATE_FIELD", step, field, value });
  };

  const addArrayItem = (step: keyof DrugFormData, field: string) => {
    dispatch({ type: "ADD_ARRAY_ITEM", step, field });
  };

  const removeArrayItem = (
    step: keyof DrugFormData,
    field: string,
    index: number
  ) => {
    dispatch({ type: "REMOVE_ARRAY_ITEM", step, field, index });
  };

  const updateArrayItem = (
    step: keyof DrugFormData,
    field: string,
    index: number,
    value: string
  ) => {
    dispatch({ type: "UPDATE_ARRAY_ITEM", step, field, index, value });
  };

  // Note management functions
  const addNote = (step: keyof DrugFormData, field: string) => {
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
    step: keyof DrugFormData,
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
    step: keyof DrugFormData,
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
    step: keyof DrugFormData,
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

  const resetForm = () => {
    dispatch({ type: "RESET_FORM" });
  };

  const loadForm = (data: DrugFormData) => {
    dispatch({ type: "LOAD_FORM", data });
  };

  const getFormData = () => formData;

  const addDevStatusEntry = () => {
    dispatch({ type: "ADD_DEV_STATUS_ENTRY" });
  };

  const removeDevStatusEntry = (index: number) => {
    dispatch({ type: "REMOVE_DEV_STATUS_ENTRY", index });
  };

  const updateDevStatusEntry = (index: number, field: string, value: string) => {
    dispatch({ type: "UPDATE_DEV_STATUS_ENTRY", index, field, value });
  };

  const value: DrugFormContextType = {
    formData,
    updateStep,
    updateField,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    addNote,
    updateNote,
    removeNote,
    toggleNoteVisibility,
    addDevStatusEntry,
    removeDevStatusEntry,
    updateDevStatusEntry,
    resetForm,
    loadForm,
    getFormData,
  };

  return (
    <DrugFormContext.Provider value={value}>
      {children}
    </DrugFormContext.Provider>
  );
}

// Custom hook
export function useDrugForm() {
  const context = useContext(DrugFormContext);
  if (context === undefined) {
    throw new Error("useDrugForm must be used within a DrugFormProvider");
  }
  return context;
}

