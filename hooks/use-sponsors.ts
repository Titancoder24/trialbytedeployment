"use client";

import { useState, useEffect, useCallback } from 'react';
import { therapeuticsApi } from '@/app/_lib/api';
import { SearchableSelectOption } from '@/components/ui/searchable-select';

interface UseSponsorReturn {
    sponsors: SearchableSelectOption[];
    isLoading: boolean;
    error: string | null;
    refreshFromAPI: () => Promise<void>;
}

/**
 * Hook to fetch unique sponsor/collaborator values from all therapeutics data.
 * This extracts all unique sponsor_collaborators values from the trials database.
 */
export const useSponsors = (): UseSponsorReturn => {
    const [sponsors, setSponsors] = useState<SearchableSelectOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const extractUniqueSponsors = (trials: any[]): SearchableSelectOption[] => {
        const sponsorSet = new Set<string>();

        trials.forEach((trial) => {
            // Get sponsor_collaborators from overview
            const sponsorValue = trial.overview?.sponsor_collaborators;

            if (sponsorValue && sponsorValue !== '' && sponsorValue !== null && sponsorValue !== undefined) {
                const stringValue = String(sponsorValue);

                // Handle arrays
                if (Array.isArray(sponsorValue)) {
                    sponsorValue.forEach((item: any) => {
                        if (item && String(item).trim()) {
                            sponsorSet.add(String(item).trim());
                        }
                    });
                }
                // Handle newline-separated values
                else if (stringValue.includes('\n')) {
                    stringValue.split(/\n+/).forEach((v: string) => {
                        const trimmed = v.trim();
                        if (trimmed) sponsorSet.add(trimmed);
                    });
                }
                // Handle comma-separated values
                else if (stringValue.includes(',')) {
                    stringValue.split(',').forEach((v: string) => {
                        const trimmed = v.trim();
                        if (trimmed) sponsorSet.add(trimmed);
                    });
                }
                // Single value
                else if (stringValue.trim()) {
                    sponsorSet.add(stringValue.trim());
                }
            }
        });

        // Convert to SearchableSelectOption format and sort
        return Array.from(sponsorSet)
            .sort((a, b) => a.localeCompare(b))
            .map(sponsor => ({
                value: sponsor,
                label: sponsor
            }));
    };

    const refreshFromAPI = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch all therapeutics (trial overviews)
            const response = await therapeuticsApi.getAllOverviews();

            if (response && Array.isArray(response)) {
                // Wrap each overview in a trial-like structure for consistency
                const trials = response.map((overview: any) => ({ overview }));
                const uniqueSponsors = extractUniqueSponsors(trials);

                console.log('[useSponsors] Extracted sponsors from trials:', uniqueSponsors.length);
                if (uniqueSponsors.length > 0) {
                    console.log('[useSponsors] Sample sponsors:', uniqueSponsors.slice(0, 5));
                }

                setSponsors(uniqueSponsors);
            } else {
                console.warn('[useSponsors] No trials data found in API response');
                setError('No trials data available');
            }
        } catch (err) {
            console.error('[useSponsors] Error fetching sponsors:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch sponsors');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        refreshFromAPI();
    }, [refreshFromAPI]);

    return {
        sponsors,
        isLoading,
        error,
        refreshFromAPI
    };
};

export default useSponsors;
