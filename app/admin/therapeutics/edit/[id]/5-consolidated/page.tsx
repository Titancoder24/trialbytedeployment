"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEditTherapeuticForm } from "../../context/edit-form-context";
import { useToast } from "@/hooks/use-toast";

// Import section components
import BasicInfoSection from "./sections/basic-info-section";
import StudyDesignSection from "./sections/study-design-section";
import EligibilitySection from "./sections/eligibility-section";
import TimingSection from "./sections/timing-section";
import ResultsSection from "./sections/results-section";
import SitesSection from "./sections/sites-section";
import AdditionalInfoSection from "./sections/additional-info-section";
import ReviewNotesSection from "./sections/review-notes-section";

export default function EditTherapeuticsConsolidated() {
  const {
    formData,
    saveTrial,
    isLoading,
    isSaving,
  } = useEditTherapeuticForm();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [activeSection, setActiveSection] = useState("basic_info");

  const sections = [
    { key: "basic_info", label: "Trial Overview", component: BasicInfoSection },
    { key: "study_design", label: "Outcome Measured", component: StudyDesignSection },
    { key: "eligibility", label: "Participation Criteria", component: EligibilitySection },
    { key: "timing", label: "Timing", component: TimingSection },
    { key: "results", label: "Results", component: ResultsSection },
    { key: "sites", label: "Sites", component: SitesSection },
    { key: "additional_info", label: "Other Sources", component: AdditionalInfoSection },
    { key: "review_notes", label: "Logs", component: ReviewNotesSection },
  ];

  // Helper function to clear all localStorage items for this trial
  const clearTrialLocalStorage = (trialId: string) => {
    try {
      // Clear known section-specific keys
      const keysToRemove = [
        `trial_timing_${trialId}`,           // Step 5-4: Timing
        `trial_results_${trialId}`,        // Step 5-5: Results
        `trial_other_sources_${trialId}`,  // Step 5-7: Other Sources
        `trial_updated_${trialId}`,         // Update flag
        // Clear potential keys for all sections (step5_1 through step5_8)
        `trial_step5_1_${trialId}`,         // Basic Info
        `trial_step5_2_${trialId}`,         // Study Design
        `trial_step5_3_${trialId}`,         // Eligibility
        `trial_step5_4_${trialId}`,         // Timing (alternative key)
        `trial_step5_5_${trialId}`,         // Results (alternative key)
        `trial_step5_6_${trialId}`,         // Sites
        `trial_step5_7_${trialId}`,         // Other Sources (alternative key)
        `trial_step5_8_${trialId}`,         // Review Notes
        // Clear any section-specific keys
        `trial_basic_info_${trialId}`,
        `trial_study_design_${trialId}`,
        `trial_eligibility_${trialId}`,
        `trial_sites_${trialId}`,
        `trial_additional_info_${trialId}`,
        `trial_review_notes_${trialId}`,
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('🗑️ Cleared all localStorage items for trial:', trialId);
      console.log('🗑️ Removed keys:', keysToRemove);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSavingStep(true);
      await saveTrial(params.id as string);

      // Note: localStorage is now repopulated with fresh data inside saveTrial/loadTrialData
      // No need to clear it - keeping it ensures auto-fill works when revisiting

      toast({
        title: "Success",
        description: "Trial updated successfully",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingStep(false);
    }
  };

  const handleFinish = async () => {
    try {
      setIsSavingStep(true);
      await saveTrial(params.id as string);

      toast({
        title: "Success",
        description: "Clinical trial updated successfully!",
      });

      // Delay redirect slightly to ensure backend state is consistent 
      // and user has time to see the success toast
      setTimeout(() => {
        router.push("/admin/therapeutics");
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to finish editing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingStep(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading trial data...</span>
        </div>
      </div>
    );
  }

  const ActiveSectionComponent = sections.find(s => s.key === activeSection)?.component;

  return (
    <div className="space-y-4">
      {/* Section Navigation Tabs - Matching creation form style - Fixed Header */}
      <div
        className="flex overflow-x-auto rounded-r-lg sticky top-0 z-50 shadow-md"
        style={{
          backgroundColor: '#D0EEF9',
          height: '50px'
        }}
      >
        {sections.map((section, index) => {
          const isActive = activeSection === section.key;
          const isLast = index === sections.length - 1;

          // Split multi-word labels into two lines
          const labelParts = section.label.split(' ');
          const hasMultipleWords = labelParts.length > 1;
          const firstLine = hasMultipleWords ? labelParts.slice(0, Math.ceil(labelParts.length / 2)).join(' ') : section.label;
          const secondLine = hasMultipleWords ? labelParts.slice(Math.ceil(labelParts.length / 2)).join(' ') : null;

          return (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all h-full flex flex-col items-center justify-center ${isLast ? 'rounded-r-lg' : ''
                }`}
              style={{
                backgroundColor: isActive ? '#284A70' : 'transparent',
                color: isActive ? 'white' : '#4A5568',
                fontWeight: isActive ? 'bold' : 'normal'
              }}
            >
              {hasMultipleWords ? (
                <>
                  <span>{firstLine}</span>
                  {secondLine && <span>{secondLine}</span>}
                </>
              ) : (
                <span>{section.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Top Buttons */}
      <div className="flex justify-between w-full gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/therapeutics")}
        >
          Cancel
        </Button>
        <div className="flex gap-3">
          <Button
            className="text-white font-medium px-6 py-2"
            style={{ backgroundColor: "#204B73" }}
            onClick={handleSaveChanges}
            disabled={isSavingStep || isSaving}
          >
            {isSavingStep || isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            className="text-white font-medium px-6 py-2"
            style={{ backgroundColor: "#059669" }}
            onClick={handleFinish}
            disabled={isSavingStep || isSaving}
          >
            {isSavingStep || isSaving ? "Saving..." : "Save & Close"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6">
          {/* Active Section Content */}
          <div className="min-h-[400px]">
            {ActiveSectionComponent && <ActiveSectionComponent />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
