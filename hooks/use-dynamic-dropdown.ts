import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { dropdownManagementAPI, DropdownOption, convertToSearchableSelectOptions } from '@/lib/dropdown-management-api';
import { SearchableSelectOption } from '@/components/ui/searchable-select';

interface UseDynamicDropdownOptions {
  categoryName: string;
  fallbackOptions?: SearchableSelectOption[];
}

interface UseDynamicDropdownReturn {
  options: SearchableSelectOption[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to dynamically load dropdown options from the database
 * Falls back to static options if the API fails
 */
export const useDynamicDropdown = ({
  categoryName,
  fallbackOptions = []
}: UseDynamicDropdownOptions): UseDynamicDropdownReturn => {
  // Start with empty array while loading - fallback is only used if API fails
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to store current fallback options to avoid stale closure
  const fallbackOptionsRef = useRef(fallbackOptions);
  fallbackOptionsRef.current = fallbackOptions;

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[useDynamicDropdown] Fetching options for category: ${categoryName}`);
      const response = await dropdownManagementAPI.getOptions(categoryName);
      console.log(`[useDynamicDropdown] Response for ${categoryName}:`, response);

      if (response.success && response.data && response.data.length > 0) {
        const dynamicOptions = convertToSearchableSelectOptions(response.data);
        console.log(`[useDynamicDropdown] Loaded ${dynamicOptions.length} options for ${categoryName}`);
        setOptions(dynamicOptions);
      } else {
        // Fall back to static options if API fails or returns empty data
        console.log(`[useDynamicDropdown] Using fallback options for ${categoryName}. Response:`, response);
        setOptions(fallbackOptionsRef.current);
        setError(response.error || 'No options available from API, using fallback options');
      }
    } catch (err) {
      // Fall back to static options if API fails
      console.error(`[useDynamicDropdown] Error fetching ${categoryName}:`, err);
      setOptions(fallbackOptionsRef.current);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [categoryName]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    loading,
    error,
    refetch: fetchOptions,
  };
};

/**
 * Hook to load multiple dropdown categories at once
 */
export const useMultipleDynamicDropdowns = (
  categoryConfigs: Array<{
    categoryName: string;
    fallbackOptions?: SearchableSelectOption[];
  }>
) => {
  const [results, setResults] = useState<Record<string, UseDynamicDropdownReturn>>({});
  const [loading, setLoading] = useState(true);

  // Create a stable dependency key from categoryConfigs to prevent infinite loops
  // This compares the actual content, not the array reference
  const configsKey = useMemo(() => {
    return JSON.stringify(
      categoryConfigs.map(config => ({
        categoryName: config.categoryName,
        fallbackCount: config.fallbackOptions?.length || 0
      }))
    );
  }, [categoryConfigs]);

  // Use a ref to track if we've already loaded for this config
  const lastConfigsKeyRef = useRef<string>('');

  useEffect(() => {
    // Only load if the configs actually changed
    if (configsKey === lastConfigsKeyRef.current) {
      return;
    }

    lastConfigsKeyRef.current = configsKey;

    const loadAllOptions = async () => {
      setLoading(true);
      const newResults: Record<string, UseDynamicDropdownReturn> = {};

      await Promise.all(
        categoryConfigs.map(async (config) => {
          try {
            const response = await dropdownManagementAPI.getOptions(config.categoryName);

            if (response.success && response.data && response.data.length > 0) {
              const dynamicOptions = convertToSearchableSelectOptions(response.data);
              newResults[config.categoryName] = {
                options: dynamicOptions,
                loading: false,
                error: null,
                refetch: async () => {
                  const refetchResponse = await dropdownManagementAPI.getOptions(config.categoryName);
                  if (refetchResponse.success && refetchResponse.data && refetchResponse.data.length > 0) {
                    const refetchOptions = convertToSearchableSelectOptions(refetchResponse.data);
                    setResults(prev => ({
                      ...prev,
                      [config.categoryName]: {
                        ...prev[config.categoryName],
                        options: refetchOptions,
                        loading: false,
                        error: null,
                      }
                    }));
                  }
                }
              };
            } else {
              // API failed or returned empty data, use fallback options
              newResults[config.categoryName] = {
                options: config.fallbackOptions || [],
                loading: false,
                error: response.error || 'No options available from API, using fallback options',
                refetch: async () => {
                  const refetchResponse = await dropdownManagementAPI.getOptions(config.categoryName);
                  if (refetchResponse.success && refetchResponse.data && refetchResponse.data.length > 0) {
                    const refetchOptions = convertToSearchableSelectOptions(refetchResponse.data);
                    setResults(prev => ({
                      ...prev,
                      [config.categoryName]: {
                        ...prev[config.categoryName],
                        options: refetchOptions,
                        loading: false,
                        error: null,
                      }
                    }));
                  }
                }
              };
            }
          } catch (err) {
            // Network error or other exception, use fallback options
            console.warn(`Failed to fetch dropdown options for ${config.categoryName}:`, err);
            newResults[config.categoryName] = {
              options: config.fallbackOptions || [],
              loading: false,
              error: err instanceof Error ? err.message : 'Unknown error',
              refetch: async () => {
                try {
                  const refetchResponse = await dropdownManagementAPI.getOptions(config.categoryName);
                  if (refetchResponse.success && refetchResponse.data && refetchResponse.data.length > 0) {
                    const refetchOptions = convertToSearchableSelectOptions(refetchResponse.data);
                    setResults(prev => ({
                      ...prev,
                      [config.categoryName]: {
                        ...prev[config.categoryName],
                        options: refetchOptions,
                        loading: false,
                        error: null,
                      }
                    }));
                  }
                } catch (refetchErr) {
                  console.warn(`Failed to refetch dropdown options for ${config.categoryName}:`, refetchErr);
                }
              }
            };
          }
        })
      );

      setResults(newResults);
      setLoading(false);
    };

    loadAllOptions();
  }, [configsKey, categoryConfigs]);

  return {
    results,
    loading,
  };
};

/**
 * Utility function to get dropdown options for a specific category
 * This can be used in components that need to get options synchronously
 */
export const getDropdownOptions = async (
  categoryName: string,
  fallbackOptions: SearchableSelectOption[] = []
): Promise<SearchableSelectOption[]> => {
  try {
    const response = await dropdownManagementAPI.getOptions(categoryName);

    if (response.success && response.data && response.data.length > 0) {
      return convertToSearchableSelectOptions(response.data);
    } else {
      return fallbackOptions;
    }
  } catch (error) {
    console.error(`Failed to fetch options for ${categoryName}:`, error);
    return fallbackOptions;
  }
};