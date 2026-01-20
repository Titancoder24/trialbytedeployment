"use client";

import { useState, useEffect, useCallback } from "react";
import { drugsApi } from "@/app/_lib/api";

export interface DrugNameOption {
  value: string;
  label: string;
  source: 'drug_name' | 'generic_name' | 'other_name' | 'custom';
}

export const useDrugNames = () => {
  const [drugNames, setDrugNames] = useState<DrugNameOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Fetch drug names from API
  const fetchDrugNamesFromAPI = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching drug names from API...');

      const data = await drugsApi.getAllDrugsWithData();
      console.log('API response received:', data);
      const drugs = data.drugs || [];
      console.log('Total drugs from API:', drugs.length);

      // Extract all unique drug names from drug_name, generic_name, and other_name
      const allDrugNames = new Set<string>();
      const drugNameMap = new Map<string, DrugNameOption>();

      let drugsProcessed = 0;
      let namesExtracted = 0;

      drugs.forEach((drug: any) => {
        drugsProcessed++;
        const overview = drug.overview || {};
        let drugName = (overview.drug_name || "").trim();
        let genericName = (overview.generic_name || "").trim();
        let otherName = (overview.other_name || "").trim();

        // Helper to clean potential JSON strings
        const cleanName = (name: string): string => {
          if ((name.startsWith("{") && name.endsWith("}")) || (name.startsWith("[") && name.endsWith("]"))) {
            try {
              const parsed = JSON.parse(name);
              if (typeof parsed === 'string') return parsed;
              if (parsed.value) return String(parsed.value);
              if (parsed.label) return String(parsed.label);
              if (parsed.drug_name) return String(parsed.drug_name);
              return name; // Return original if structure is unknown
            } catch (e) {
              return name;
            }
          }
          return name;
        };

        drugName = cleanName(drugName);
        genericName = cleanName(genericName);
        otherName = cleanName(otherName);

        // Add drug_name
        if (drugName && !allDrugNames.has(drugName.toLowerCase())) {
          allDrugNames.add(drugName.toLowerCase());
          drugNameMap.set(drugName.toLowerCase(), {
            value: drugName,
            label: drugName,
            source: 'drug_name'
          });
          namesExtracted++;
        }

        // Add generic_name
        if (genericName && !allDrugNames.has(genericName.toLowerCase())) {
          allDrugNames.add(genericName.toLowerCase());
          drugNameMap.set(genericName.toLowerCase(), {
            value: genericName,
            label: genericName,
            source: 'generic_name'
          });
          namesExtracted++;
        }

        // Add other_name
        if (otherName && !allDrugNames.has(otherName.toLowerCase())) {
          allDrugNames.add(otherName.toLowerCase());
          drugNameMap.set(otherName.toLowerCase(), {
            value: otherName,
            label: otherName,
            source: 'other_name'
          });
          namesExtracted++;
        }
      });

      console.log('Drugs processed:', drugsProcessed, 'Names extracted:', namesExtracted);

      // Convert map to array (preserve original case from first occurrence)
      const uniqueDrugNames = Array.from(drugNameMap.values());

      console.log('Unique drug names extracted:', uniqueDrugNames.length);
      if (uniqueDrugNames.length > 0) {
        console.log('Sample drug names:', uniqueDrugNames.slice(0, 5).map(d => d.value));
      }

      setDrugNames(uniqueDrugNames);
      setHasLoaded(true);

      // Also save to localStorage for offline access
      if (uniqueDrugNames.length > 0) {
        localStorage.setItem('drugNames', JSON.stringify(uniqueDrugNames));
        console.log('Fetched and saved drug names from API:', uniqueDrugNames.length, 'unique names');
      } else {
        console.warn('No drug names extracted from API response. Check if drugs have drug_name, generic_name, or other_name fields populated.');
        // Still try localStorage as fallback
        try {
          const stored = localStorage.getItem('drugNames');
          if (stored) {
            const parsed = JSON.parse(stored);
            setDrugNames(parsed);
            console.log('Using cached drug names from localStorage:', parsed.length);
          }
        } catch (localError) {
          console.error('Error loading from localStorage:', localError);
        }
      }
    } catch (error: any) {
      console.error('Error fetching drug names from API:', error);
      setHasLoaded(true);
      // Fallback to localStorage if API fails
      try {
        const stored = localStorage.getItem('drugNames');
        if (stored) {
          const parsed = JSON.parse(stored);
          setDrugNames(parsed);
          console.log('Fell back to localStorage drug names:', parsed.length);
        } else {
          console.warn('No drugs available in API or localStorage. Please add drugs in the drug module first.');
          // Set empty array to ensure component knows loading is complete
          setDrugNames([]);
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
        setDrugNames([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load drug names from API on mount
  useEffect(() => {
    fetchDrugNamesFromAPI();
  }, [fetchDrugNamesFromAPI]);

  // Save drug names to localStorage whenever they change
  useEffect(() => {
    if (drugNames.length > 0) {
      try {
        localStorage.setItem('drugNames', JSON.stringify(drugNames));
        console.log('Saved drug names to localStorage:', drugNames);
      } catch (error) {
        console.error('Error saving drug names to localStorage:', error);
      }
    }
  }, [drugNames]);

  const addDrugName = useCallback((name: string, source: DrugNameOption['source']) => {
    if (!name.trim()) return;

    const trimmedName = name.trim();

    // Check if drug name already exists
    const exists = drugNames.some(drug =>
      drug.value.toLowerCase() === trimmedName.toLowerCase()
    );

    if (!exists) {
      const newDrug: DrugNameOption = {
        value: trimmedName,
        label: trimmedName,
        source
      };

      setDrugNames(prev => {
        const updated = [...prev, newDrug];
        console.log('Added new drug name:', newDrug, 'Total drugs:', updated.length);
        return updated;
      });
    } else {
      console.log('Drug name already exists:', trimmedName);
    }
  }, [drugNames]);

  const getPrimaryNameOptions = useCallback(() => {
    return drugNames.map(drug => ({
      value: drug.value,
      label: drug.label
    }));
  }, [drugNames]);

  const getPrimaryDrugsOptions = useCallback(() => {
    return drugNames.map(drug => ({
      value: drug.value,
      label: drug.label
    }));
  }, [drugNames]);

  const clearAllDrugNames = useCallback(() => {
    setDrugNames([]);
    localStorage.removeItem('drugNames');
    console.log('Cleared all drug names');
  }, []);

  const logCurrentDrugNames = useCallback(() => {
    console.log('Current drug names:', drugNames);
  }, [drugNames]);

  const refreshFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('drugNames');
      if (stored) {
        const parsed = JSON.parse(stored);
        setDrugNames(parsed);
        console.log('Refreshed drug names from localStorage:', parsed);
      }
    } catch (error) {
      console.error('Error refreshing drug names from localStorage:', error);
    }
  }, []);

  const refreshFromAPI = useCallback(() => {
    fetchDrugNamesFromAPI();
  }, [fetchDrugNamesFromAPI]);

  return {
    drugNames,
    isLoading,
    hasLoaded,
    addDrugName,
    getPrimaryNameOptions,
    getPrimaryDrugsOptions,
    clearAllDrugNames,
    logCurrentDrugNames,
    refreshFromLocalStorage,
    refreshFromAPI
  };
};
