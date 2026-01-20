"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTherapeuticForm } from "../context/therapeutic-form-context";
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

export default function NewTherapeuticsConsolidated() {
  const {
    formData,
    saveTrial,
  } = useTherapeuticForm();
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("basic_info");

  // Warn user before accidentally closing or reloading the window during creation
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Show browser-native confirmation dialog
      event.preventDefault();
      event.returnValue = "Are you sure you want to close the window? Unsaved changes will be lost.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

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

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const result = await saveTrial();
      
      if (result.success) {
        const trialId = result.trialId || result.trialIdentifier || "Trial";
        console.log("Trial created successfully - Trial ID:", trialId);
        toast({
          title: "Success",
          description: `${trialId} created successfully`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = async () => {
    try {
      setIsSaving(true);
      const result = await saveTrial();
      
      if (result.success) {
        const trialId = result.trialId || result.trialIdentifier || "Trial";
        console.log("Trial created successfully - Trial ID:", trialId);
        toast({
          title: "Success",
          description: `${trialId} created successfully`,
        });
        router.push("/admin/therapeutics");
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to finish creating trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const ActiveSectionComponent = sections.find(s => s.key === activeSection)?.component;

  return (
    <div className="space-y-4">
      {/* Section Navigation Tabs - Matching image 1 style - Fixed Header */}
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
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all h-full flex flex-col items-center justify-center ${
                isLast ? 'rounded-r-lg' : ''
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
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            className="text-white font-medium px-6 py-2"
            style={{ backgroundColor: "#059669" }}
            onClick={handleFinish}
            disabled={isSaving}
          >
            {isSaving ? "Creating..." : "Create Trial"}
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
