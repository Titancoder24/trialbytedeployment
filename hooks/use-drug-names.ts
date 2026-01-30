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
  const [drugAliasesMap, setDrugAliasesMap] = useState<Record<string, string[]>>({});
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

      // Extract all unique drug names and map aliases
      const allDrugNames = new Set<string>();
      const drugNameMap = new Map<string, DrugNameOption>();
      const aliasesMap: Record<string, string[]> = {};

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

        // Collect all non-empty name variants for this drug
        const allNames = [drugName, genericName, otherName].filter(n => n);

        // Skip if no name fields are set at all
        if (allNames.length === 0) {
          return;
        }

        // Build bidirectional alias mapping: each name maps to ALL other names for this drug
        // This ensures filtering works regardless of which name variant is selected
        allNames.forEach(name => {
          const lowerName = name.toLowerCase();
          const currentAliases = aliasesMap[lowerName] || [];

          // Add all OTHER names from this drug as aliases
          allNames.forEach(otherNameVariant => {
            const lowerOther = otherNameVariant.toLowerCase();
            if (lowerOther !== lowerName && !currentAliases.includes(lowerOther)) {
              currentAliases.push(lowerOther);
            }
          });

          aliasesMap[lowerName] = currentAliases;
        });

        // Add each non-empty name field to the dropdown options
        // Add drug_name if present
        if (drugName) {
          const lowerName = drugName.toLowerCase();
          if (!allDrugNames.has(lowerName)) {
            allDrugNames.add(lowerName);
            drugNameMap.set(lowerName, {
              value: drugName,
              label: drugName,
              source: 'drug_name'
            });
            namesExtracted++;
          }
        }

        // Add generic_name if present and not already added
        if (genericName) {
          const lowerName = genericName.toLowerCase();
          if (!allDrugNames.has(lowerName)) {
            allDrugNames.add(lowerName);
            drugNameMap.set(lowerName, {
              value: genericName,
              label: genericName,
              source: 'generic_name'
            });
            namesExtracted++;
          }
        }

        // Add other_name if present and not already added
        if (otherName) {
          const lowerName = otherName.toLowerCase();
          if (!allDrugNames.has(lowerName)) {
            allDrugNames.add(lowerName);
            drugNameMap.set(lowerName, {
              value: otherName,
              label: otherName,
              source: 'other_name'
            });
            namesExtracted++;
          }
        }
      });

      console.log('Drugs processed:', drugsProcessed, 'Names extracted:', namesExtracted);

      // Convert map to array (preserve original case from first occurrence)
      const uniqueDrugNames = Array.from(drugNameMap.values());

      setDrugNames(uniqueDrugNames);
      setDrugAliasesMap(aliasesMap);
      setHasLoaded(true);

      // Also save to localStorage for offline access
      if (uniqueDrugNames.length > 0) {
        localStorage.setItem('drugNames', JSON.stringify(uniqueDrugNames));
        localStorage.setItem('drugAliasesMap', JSON.stringify(aliasesMap));
        console.log('Fetched and saved drug names/aliases from API');
      } else {
        // Fallback load
        try {
          const storedNames = localStorage.getItem('drugNames');
          const storedAliases = localStorage.getItem('drugAliasesMap');
          if (storedNames) setDrugNames(JSON.parse(storedNames));
          if (storedAliases) setDrugAliasesMap(JSON.parse(storedAliases));
        } catch (e) { console.error(e); }
      }
    } catch (error: any) {
      console.error('Error fetching drug names from API:', error);
      setHasLoaded(true);
      // Fallback
      try {
        const storedNames = localStorage.getItem('drugNames');
        const storedAliases = localStorage.getItem('drugAliasesMap');
        if (storedNames) setDrugNames(JSON.parse(storedNames));
        else setDrugNames([]);
        if (storedAliases) setDrugAliasesMap(JSON.parse(storedAliases));
        else setDrugAliasesMap({});
      } catch (e) {
        setDrugNames([]);
        setDrugAliasesMap({});
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
    setDrugAliasesMap({});
    localStorage.removeItem('drugNames');
    localStorage.removeItem('drugAliasesMap');
    console.log('Cleared all drug names');
  }, []);

  const logCurrentDrugNames = useCallback(() => {
    console.log('Current drug names:', drugNames);
  }, [drugNames]);

  const refreshFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('drugNames');
      const storedAliases = localStorage.getItem('drugAliasesMap');
      if (stored) {
        const parsed = JSON.parse(stored);
        setDrugNames(parsed);
      }
      if (storedAliases) {
        setDrugAliasesMap(JSON.parse(storedAliases));
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
    drugAliasesMap,
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
