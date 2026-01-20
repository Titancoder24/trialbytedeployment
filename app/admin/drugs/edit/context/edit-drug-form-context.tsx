"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Define the complete form structure for editing drugs
export interface EditDrugFormData {
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
    regulator_designations: string;
    source_link: string;
    drug_record_status: string;
    is_approved: boolean;
    attachments: string[];
    links: string[];
    drug_development_status_rows: Array<{
      disease_type: string;
      therapeutic_class: string;
      company: string;
      company_type: string;
      country: string;
      development_status: string;
      reference: string;
    }>;
  };

  // Development Status
  devStatus: {
    disease_type: string;
    therapeutic_class: string;
    company: string;
    company_type: string;
    status: string;
    reference: string;
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
    trial_id: string;
    title: string;
    primary_drugs: string;
    reference: string;
    add_attachments: string[];
    add_links: string[];
  };

  // Other Sources
  otherSources: {
    pipelineData: string;
    pressReleases: string;
    publications: string;
    pressReleaseNotes?: Array<{
      id: string;
      date: string;
      type: string;
      content: string;
      sourceLink?: string;
      sourceType?: string;
      sourceUrl?: string;
      attachments?: Array<{ name: string; url: string; type: string }>;
      isVisible: boolean;
    }>;
    publicationNotes?: Array<{
      id: string;
      date: string;
      type: string;
      content: string;
      sourceLink?: string;
      sourceType?: string;
      sourceUrl?: string;
      attachments?: Array<{ name: string; url: string; type: string }>;
      isVisible: boolean;
    }>;
  };

  // Licensing & Marketing
  licencesMarketing: {
    agreement: string;
    marketing_approvals: string;
    licensing_availability: string;
    agreement_rows: string[];
    licensing_availability_rows: string[];
    marketing_approvals_rows: string[];
  };

  // Logs
  logs: {
    drug_changes_log: string;
    drug_added_date: string;
    last_modified_date: string;
    last_modified_user: string;
    full_review_user: string;
    full_review: boolean;
    next_review_date: string;
    notes: string;
  };
}

// Initial form state
const initialFormData: EditDrugFormData = {
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
    regulator_designations: "",
    source_link: "",
    drug_record_status: "",
    is_approved: false,
    attachments: [""],
    links: [""],
    drug_development_status_rows: [{
      disease_type: "",
      therapeutic_class: "",
      company: "",
      company_type: "",
      country: "",
      development_status: "",
      reference: "",
    }],
  },
  devStatus: {
    disease_type: "",
    therapeutic_class: "",
    company: "",
    company_type: "",
    status: "",
    reference: "",
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
    trial_id: "",
    title: "",
    primary_drugs: "",
    reference: "",
    add_attachments: [""],
    add_links: [""],
  },
  otherSources: {
    pipelineData: "",
    pressReleases: "",
    publications: "",
    pressReleaseNotes: [],
    publicationNotes: [],
  },
  licencesMarketing: {
    agreement: "",
    marketing_approvals: "",
    licensing_availability: "",
    agreement_rows: [""],
    licensing_availability_rows: [""],
    marketing_approvals_rows: [""],
  },
  logs: {
    drug_changes_log: "",
    drug_added_date: "",
    last_modified_date: "",
    last_modified_user: "",
    full_review_user: "",
    full_review: false,
    next_review_date: "",
    notes: "",
  },
};

// Action types
type EditFormAction =
  | { type: "SET_DRUG_DATA"; payload: EditDrugFormData }
  | { type: "UPDATE_FIELD"; step: keyof EditDrugFormData; field: string; value: any }
  | { type: "ADD_ARRAY_ITEM"; step: keyof EditDrugFormData; field: string; value: any }
  | { type: "REMOVE_ARRAY_ITEM"; step: keyof EditDrugFormData; field: string; index: number }
  | { type: "UPDATE_ARRAY_ITEM"; step: keyof EditDrugFormData; field: string; index: number; value: any }
  | { type: "RESET_FORM" };

// Reducer function
function editFormReducer(state: EditDrugFormData, action: EditFormAction): EditDrugFormData {
  switch (action.type) {
    case "SET_DRUG_DATA":
      return action.payload;
    case "UPDATE_FIELD":
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: action.value,
        },
      };
    case "ADD_ARRAY_ITEM":
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: [...(state[action.step] as any)[action.field], action.value],
        },
      };
    case "REMOVE_ARRAY_ITEM":
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: (state[action.step] as any)[action.field].filter(
            (_: any, index: number) => index !== action.index
          ),
        },
      };
    case "UPDATE_ARRAY_ITEM":
      return {
        ...state,
        [action.step]: {
          ...state[action.step],
          [action.field]: (state[action.step] as any)[action.field].map(
            (item: any, index: number) => (index === action.index ? action.value : item)
          ),
        },
      };
    case "RESET_FORM":
      return initialFormData;
    default:
      return state;
  }
}

// Context type
interface EditDrugFormContextType {
  formData: EditDrugFormData;
  updateField: (step: keyof EditDrugFormData, field: string, value: any) => void;
  addArrayItem: (step: keyof EditDrugFormData, field: string, value: any) => void;
  removeArrayItem: (step: keyof EditDrugFormData, field: string, index: number) => void;
  updateArrayItem: (step: keyof EditDrugFormData, field: string, index: number, value: any) => void;
  saveDrug: (drugId: string) => Promise<void>;
  loadDrugData: (drugId: string) => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
}

// Create context
const EditDrugFormContext = createContext<EditDrugFormContextType | undefined>(undefined);

// Provider component
export function EditDrugFormProvider({ children, drugId }: { children: ReactNode; drugId: string }) {
  const [formData, dispatch] = useReducer(editFormReducer, initialFormData);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  // Store the original drug data for reference
  const [originalDrug, setOriginalDrug] = React.useState<any>(null);

  // Load drug data
  const loadDrugData = async (drugId: string) => {
    try {
      setIsLoading(true);
      
      // Try to fetch from API first
      let data = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        // Wrap fetch in a promise that never rejects
        const fetchPromise = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/drugs/drug/${drugId}/all-data`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: controller.signal,
        }).catch(() => null); // Convert rejection to null
        
        const response = await fetchPromise;
        clearTimeout(timeoutId);
        
        if (response && response.ok) {
          data = await response.json();
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
        try {
          const localData = localStorage.getItem(`drugData_${drugId}`);
          if (localData) {
            data = JSON.parse(localData);
            console.log('Loaded drug data from localStorage');
          }
        } catch (localError) {
          console.warn('localStorage fetch failed:', localError);
        }
      }
      
      if (data) {
        // Store original data for reference
        setOriginalDrug(data);
        
        // Transform API data to form structure
        const transformedData: EditDrugFormData = {
          overview: {
            drug_name: data.data?.overview?.drug_name || "",
            generic_name: data.data?.overview?.generic_name || "",
            other_name: data.data?.overview?.other_name || "",
            primary_name: data.data?.overview?.primary_name || "",
            global_status: data.data?.overview?.global_status || "",
            development_status: data.data?.overview?.development_status || "",
            drug_summary: data.data?.overview?.drug_summary || "",
            originator: data.data?.overview?.originator || "",
            other_active_companies: data.data?.overview?.other_active_companies || "",
            therapeutic_area: data.data?.overview?.therapeutic_area || "",
            disease_type: data.data?.overview?.disease_type || "",
            regulator_designations: data.data?.overview?.regulator_designations || "",
            source_link: data.data?.overview?.source_link || "",
            drug_record_status: data.data?.overview?.drug_record_status || "",
            is_approved: data.data?.overview?.is_approved || false,
            attachments: data.data?.overview?.attachments || [""],
            links: data.data?.overview?.links || [""],
            drug_development_status_rows: data.data?.overview?.drug_development_status_rows || [{
              disease_type: "",
              therapeutic_class: "",
              company: "",
              company_type: "",
              country: "",
              development_status: "",
              reference: "",
            }],
          },
          devStatus: {
            disease_type: data.data?.devStatus?.[0]?.disease_type || "",
            therapeutic_class: data.data?.devStatus?.[0]?.therapeutic_class || "",
            company: data.data?.devStatus?.[0]?.company || "",
            company_type: data.data?.devStatus?.[0]?.company_type || "",
            status: data.data?.devStatus?.[0]?.status || "",
            reference: data.data?.devStatus?.[0]?.reference || "",
          },
          activity: {
            mechanism_of_action: data.data?.activity?.[0]?.mechanism_of_action || "",
            biological_target: data.data?.activity?.[0]?.biological_target || "",
            drug_technology: data.data?.activity?.[0]?.drug_technology || "",
            delivery_route: data.data?.activity?.[0]?.delivery_route || "",
            delivery_medium: data.data?.activity?.[0]?.delivery_medium || "",
          },
          development: {
            preclinical: data.data?.development?.[0]?.preclinical || "",
            status: data.data?.development?.[0]?.status || "",
            sponsor: data.data?.development?.[0]?.sponsor || "",
            trial_id: data.data?.development?.[0]?.trial_id || "",
            title: data.data?.development?.[0]?.title || "",
            primary_drugs: data.data?.development?.[0]?.primary_drugs || "",
            reference: data.data?.development?.[0]?.reference || "",
            add_attachments: data.data?.development?.[0]?.add_attachments || [""],
            add_links: data.data?.development?.[0]?.add_links || [""],
          },
          otherSources: {
            pipelineData: data.data?.otherSources?.[0]?.pipelineData || "",
            pressReleases: data.data?.otherSources?.[0]?.pressReleases || "",
            publications: data.data?.otherSources?.[0]?.publications || "",
            pressReleaseNotes: data.data?.otherSources?.[0]?.pressReleaseNotes || [],
            publicationNotes: data.data?.otherSources?.[0]?.publicationNotes || [],
          },
          licencesMarketing: {
            agreement: data.data?.licencesMarketing?.[0]?.agreement || "",
            marketing_approvals: data.data?.licencesMarketing?.[0]?.marketing_approvals || "",
            licensing_availability: data.data?.licencesMarketing?.[0]?.licensing_availability || "",
            agreement_rows: data.data?.licencesMarketing?.[0]?.agreement_rows || [""],
            licensing_availability_rows: data.data?.licencesMarketing?.[0]?.licensing_availability_rows || [""],
            marketing_approvals_rows: data.data?.licencesMarketing?.[0]?.marketing_approvals_rows || [""],
          },
          logs: {
            drug_changes_log: data.data?.logs?.[0]?.drug_changes_log || "",
            drug_added_date: data.data?.logs?.[0]?.created_date || "",
            last_modified_date: data.data?.logs?.[0]?.last_modified_date || "",
            last_modified_user: data.data?.logs?.[0]?.last_modified_user || "",
            full_review_user: data.data?.logs?.[0]?.full_review_user || "",
            full_review: data.data?.logs?.[0]?.full_review || false,
            next_review_date: data.data?.logs?.[0]?.next_review_date || "",
            notes: data.data?.logs?.[0]?.notes || "",
          },
        };
        
        dispatch({ type: "SET_DRUG_DATA", payload: transformedData });
        
        // Also save to localStorage for offline access
        try {
          localStorage.setItem(`drugData_${drugId}`, JSON.stringify(data));
        } catch (localError) {
          console.warn('Failed to save to localStorage:', localError);
        }
      } else {
        console.warn('No drug data found from API or localStorage');
        toast({
          title: "Warning",
          description: "Could not load drug data. Using empty form.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading drug data:", error);
      toast({
        title: "Error",
        description: "Failed to load drug data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save drug data
  const saveDrug = async (drugId: string) => {
    try {
      setIsSaving(true);
      
      const currentUserId = localStorage.getItem("userId");
      if (!currentUserId) {
        throw new Error("User ID not found. Please log in again.");
      }

      // Transform form data back to API format
      const apiData = {
        user_id: currentUserId,
        overview: {
          drug_name: formData.overview.drug_name,
          generic_name: formData.overview.generic_name,
          other_name: formData.overview.other_name,
          primary_name: formData.overview.primary_name,
          global_status: formData.overview.global_status,
          development_status: formData.overview.development_status,
          drug_summary: formData.overview.drug_summary,
          originator: formData.overview.originator,
          other_active_companies: formData.overview.other_active_companies,
          therapeutic_area: formData.overview.therapeutic_area,
          disease_type: formData.overview.disease_type,
          regulator_designations: formData.overview.regulator_designations,
          source_link: formData.overview.source_link,
          drug_record_status: formData.overview.drug_record_status || "active",
          is_approved: formData.overview.is_approved,
          // Remove attachments and links as they don't exist in the database schema
        },
        devStatus: [formData.devStatus],
        activity: [formData.activity],
        development: [{
          preclinical: formData.development.preclinical,
          trial_id: formData.development.trial_id,
          title: formData.development.title,
          primary_drugs: formData.development.primary_drugs,
          status: formData.development.status,
          sponsor: formData.development.sponsor,
          // Remove add_attachments, add_links, and reference as they don't exist in the database schema
        }],
        otherSources: [formData.otherSources],
        licencesMarketing: [{
          agreement: formData.licencesMarketing.agreement,
          licensing_availability: formData.licencesMarketing.licensing_availability,
          marketing_approvals: formData.licencesMarketing.marketing_approvals,
          // Remove agreement_rows, licensing_availability_rows, and marketing_approvals_rows as they don't exist in the database schema
        }],
        logs: [{
          drug_changes_log: formData.logs.drug_changes_log,
          created_date: formData.logs.drug_added_date, // Map drug_added_date to created_date
          last_modified_user: formData.logs.last_modified_user,
          full_review_user: formData.logs.full_review_user,
          next_review_date: formData.logs.next_review_date,
          notes: formData.logs.notes,
          // Remove last_modified_date and full_review as they don't exist in the database schema
        }],
      };

      console.log('Sending API data:', JSON.stringify(apiData, null, 2));

      // Try API first
      let apiSuccess = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/drugs/drug/${drugId}/update-all-data`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
          credentials: 'include',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const responseData = await response.json();
          console.log('Drug updated successfully:', responseData);
          apiSuccess = true;
          
          // Mark this drug as updated for table refresh
          const updatedDrugs = JSON.parse(localStorage.getItem('updatedDrugs') || '[]');
          if (!updatedDrugs.includes(drugId)) {
            updatedDrugs.push(drugId);
            localStorage.setItem('updatedDrugs', JSON.stringify(updatedDrugs));
          }
          
          // Dispatch custom event for immediate refresh
          window.dispatchEvent(new CustomEvent('drugUpdated', { 
            detail: { drugId, timestamp: Date.now() } 
          }));
          
          toast({
            title: "Success",
            description: "Drug updated successfully!",
          });
        } else {
          const errorText = await response.text();
          console.error('API update failed:', response.status, errorText);
          throw new Error(`API update failed: ${response.status} - ${errorText}`);
        }
      } catch (apiError) {
        console.warn('API update failed, saving to localStorage:', apiError);
        
        // Save to localStorage as fallback
        const localData = {
          drugId,
          formData,
          timestamp: new Date().toISOString(),
          status: 'pending_api_update',
          originalDrug
        };
        
        const existingUpdates = JSON.parse(localStorage.getItem('pendingDrugUpdates') || '[]');
        const filteredUpdates = existingUpdates.filter((update: any) => update.drugId !== drugId);
        filteredUpdates.push(localData);
        localStorage.setItem('pendingDrugUpdates', JSON.stringify(filteredUpdates));
        localStorage.setItem(`drugUpdate_${drugId}`, JSON.stringify(localData));
        
        // Mark this drug as updated for table refresh
        const updatedDrugs = JSON.parse(localStorage.getItem('updatedDrugs') || '[]');
        if (!updatedDrugs.includes(drugId)) {
          updatedDrugs.push(drugId);
          localStorage.setItem('updatedDrugs', JSON.stringify(updatedDrugs));
        }
        
        // Dispatch custom event for immediate refresh
        window.dispatchEvent(new CustomEvent('drugUpdated', { 
          detail: { drugId, timestamp: Date.now() } 
        }));
        
        toast({
          title: "Changes Saved Locally",
          description: "Your changes have been saved locally. They will be synced when the backend is available.",
          variant: "default",
        });
      }
      
    } catch (error) {
      console.error("Error saving drug:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to save changes: ${errorMessage}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Safe wrapper for saveDrug to prevent any errors from breaking the app
  const safeSaveDrug = async (drugId: string) => {
    try {
      await saveDrug(drugId);
    } catch (error) {
      console.error("Unexpected error in saveDrug:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load drug data on mount
  useEffect(() => {
    if (drugId) {
      loadDrugData(drugId);
    }
  }, [drugId]);

  const updateField = (step: keyof EditDrugFormData, field: string, value: any) => {
    dispatch({ type: "UPDATE_FIELD", step, field, value });
  };

  const addArrayItem = (step: keyof EditDrugFormData, field: string, value: any) => {
    dispatch({ type: "ADD_ARRAY_ITEM", step, field, value });
  };

  const removeArrayItem = (step: keyof EditDrugFormData, field: string, index: number) => {
    dispatch({ type: "REMOVE_ARRAY_ITEM", step, field, index });
  };

  const updateArrayItem = (step: keyof EditDrugFormData, field: string, index: number, value: any) => {
    dispatch({ type: "UPDATE_ARRAY_ITEM", step, field, index, value });
  };

  const value: EditDrugFormContextType = {
    formData,
    updateField,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    saveDrug: safeSaveDrug,
    loadDrugData,
    isLoading,
    isSaving,
  };

  return (
    <EditDrugFormContext.Provider value={value}>
      {children}
    </EditDrugFormContext.Provider>
  );
}

// Hook to use the context
export function useEditDrugForm() {
  const context = useContext(EditDrugFormContext);
  if (context === undefined) {
    throw new Error("useEditDrugForm must be used within an EditDrugFormProvider");
  }
  return context;
}
