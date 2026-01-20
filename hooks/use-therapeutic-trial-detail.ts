import { useQuery } from "@tanstack/react-query";
import { buildApiUrl } from "@/app/_lib/api";

export function useTherapeuticTrialDetail(trialId: string) {
  return useQuery({
    queryKey: ["therapeutic-trial-detail", trialId],
    queryFn: async () => {
      console.log("🔍 Fetching therapeutic trial detail with react-query for trialId:", trialId);
      
      const url = buildApiUrl(`/api/v1/therapeutic/trial/${trialId}/all-data?_t=${new Date().getTime()}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Trial with id ${trialId} not found`);
        }
        throw new Error(`Failed to fetch therapeutic trial: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Fetched trial detail data:", data);
      return data;
    },
    enabled: !!trialId,
    staleTime: 0, // Always consider data stale, so it refetches when needed
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
    refetchOnMount: true, // Refetch when component mounts
    refetchInterval: false, // Don't auto-refetch on interval
  });
}

