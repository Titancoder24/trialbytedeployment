import { useQuery } from "@tanstack/react-query";
import { therapeuticsApi, buildApiUrl } from "@/app/_lib/api";

export function useTherapeuticTrial(trialId: string) {
  return useQuery({
    queryKey: ["therapeutic-trial", trialId],
    queryFn: async () => {
      console.log("🔍 Fetching therapeutic trial data with react-query for trialId:", trialId);
      
      // Fetch all trials and find the one matching trialId
      const url = buildApiUrl(`/api/v1/therapeutic/all-trials-with-data?_t=${new Date().getTime()}`);
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
        throw new Error(`Failed to fetch therapeutic trials: ${response.status}`);
      }

      const data = await response.json();
      const trials = data?.trials || [];
      
      // Try multiple ways to find the trial
      let foundTrial = trials.find((trial: any) => 
        trial.trial_id === trialId || 
        trial.overview?.id === trialId || 
        trial.id === trialId ||
        trial.overview?.trial_id === trialId
      );

      if (!foundTrial) {
        console.error("❌ Trial not found. Available trial IDs:", trials.slice(0, 5).map((t: any) => ({
          trial_id: t.trial_id,
          overview_id: t.overview?.id,
          id: t.id
        })));
        throw new Error(`Trial with id ${trialId} not found`);
      }

      console.log("✅ Found trial data:", {
        id: foundTrial.trial_id || foundTrial.overview?.id,
        subject_type: foundTrial.criteria?.[0]?.subject_type,
        target_no_volunteers: foundTrial.criteria?.[0]?.target_no_volunteers,
        actual_enrolled_volunteers: foundTrial.criteria?.[0]?.actual_enrolled_volunteers,
        trial_outcome: foundTrial.results?.[0]?.trial_outcome,
        reference: foundTrial.results?.[0]?.reference,
        trial_outcome_link: foundTrial.results?.[0]?.trial_outcome_link,
        treatment_for_adverse_events: foundTrial.results?.[0]?.treatment_for_adverse_events,
        site_notes: foundTrial.results?.[0]?.site_notes,
      });

      return foundTrial;
    },
    enabled: !!trialId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

