"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Edit } from "lucide-react";

export interface ColumnSettings {
  // Core fields from Basic Info Section
  trialId: boolean;
  title: boolean;
  therapeuticArea: boolean;
  diseaseType: boolean;
  primaryDrug: boolean;
  trialPhase: boolean;
  patientSegment: boolean;
  lineOfTherapy: boolean;
  countries: boolean;
  sponsorsCollaborators: boolean;
  fieldOfActivity: boolean;
  associatedCro: boolean;
  trialTags: boolean;
  otherDrugs: boolean;
  regions: boolean;
  trialRecordStatus: boolean;
  // Eligibility Section
  inclusionCriteria: boolean;
  exclusionCriteria: boolean;
  ageFrom: boolean;
  ageTo: boolean;
  subjectType: boolean;
  sex: boolean;
  healthyVolunteers: boolean;
  targetNoVolunteers: boolean;
  actualEnrolledVolunteers: boolean;
  // Study Design Section
  purposeOfTrial: boolean;
  summary: boolean;
  primaryOutcomeMeasures: boolean;
  otherOutcomeMeasures: boolean;
  studyDesignKeywords: boolean;
  studyDesign: boolean;
  treatmentRegimen: boolean;
  numberOfArms: boolean;
  // Timing Section
  startDateEstimated: boolean;
  trialEndDateEstimated: boolean;
  // Results Section
  resultsAvailable: boolean;
  endpointsMet: boolean;
  adverseEventsReported: boolean;
  trialOutcome: boolean;
  trialOutcomeContent: boolean;
  adverseEventReported: boolean;
  adverseEventType: boolean;
  treatmentForAdverseEvents: boolean;
  // Sites Section
  totalSites: boolean;
  siteNotes: boolean;
}

interface CustomizeColumnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnSettings: ColumnSettings;
  onColumnSettingsChange: (settings: ColumnSettings) => void;
}

const DEFAULT_COLUMN_SETTINGS: ColumnSettings = {
  // Core fields from Basic Info Section - shown by default
  trialId: true,
  title: true,
  therapeuticArea: true,
  diseaseType: true,
  primaryDrug: true,
  trialPhase: true,
  patientSegment: true,
  lineOfTherapy: true,
  countries: true,
  sponsorsCollaborators: true,
  fieldOfActivity: true,
  associatedCro: true,
  trialTags: false,
  otherDrugs: false,
  regions: false,
  trialRecordStatus: true,
  // Eligibility Section
  inclusionCriteria: false,
  exclusionCriteria: false,
  ageFrom: false,
  ageTo: false,
  subjectType: false,
  sex: false,
  healthyVolunteers: false,
  targetNoVolunteers: false,
  actualEnrolledVolunteers: false,
  // Study Design Section
  purposeOfTrial: false,
  summary: false,
  primaryOutcomeMeasures: false,
  otherOutcomeMeasures: false,
  studyDesignKeywords: false,
  studyDesign: false,
  treatmentRegimen: false,
  numberOfArms: false,
  // Timing Section
  startDateEstimated: false,
  trialEndDateEstimated: false,
  // Results Section
  resultsAvailable: false,
  endpointsMet: false,
  adverseEventsReported: false,
  trialOutcome: false,
  trialOutcomeContent: false,
  adverseEventReported: false,
  adverseEventType: false,
  treatmentForAdverseEvents: false,
  // Sites Section
  totalSites: false,
  siteNotes: false,
};

export const COLUMN_OPTIONS = [
  // Basic Info Section
  { key: 'trialId' as keyof ColumnSettings, label: 'Trial ID' },
  { key: 'therapeuticArea' as keyof ColumnSettings, label: 'Therapeutic Area' },
  { key: 'diseaseType' as keyof ColumnSettings, label: 'Disease Type' },
  { key: 'primaryDrug' as keyof ColumnSettings, label: 'Primary Drug' },
  { key: 'trialRecordStatus' as keyof ColumnSettings, label: 'Trial status' },
  { key: 'sponsorsCollaborators' as keyof ColumnSettings, label: 'Sponsor' },
  { key: 'trialPhase' as keyof ColumnSettings, label: 'Phase' },
  { key: 'title' as keyof ColumnSettings, label: 'Title' },
  { key: 'patientSegment' as keyof ColumnSettings, label: 'Patient Segment' },
  { key: 'lineOfTherapy' as keyof ColumnSettings, label: 'Line of Therapy' },
  { key: 'countries' as keyof ColumnSettings, label: 'Countries' },
  { key: 'fieldOfActivity' as keyof ColumnSettings, label: 'Field of Activity' },
  { key: 'associatedCro' as keyof ColumnSettings, label: 'Associated CRO' },
  { key: 'trialTags' as keyof ColumnSettings, label: 'Trial Tags' },
  { key: 'otherDrugs' as keyof ColumnSettings, label: 'Other Drugs' },
  { key: 'regions' as keyof ColumnSettings, label: 'Regions' },
  // Eligibility Section
  { key: 'inclusionCriteria' as keyof ColumnSettings, label: 'Inclusion Criteria' },
  { key: 'exclusionCriteria' as keyof ColumnSettings, label: 'Exclusion Criteria' },
  { key: 'ageFrom' as keyof ColumnSettings, label: 'Age From' },
  { key: 'ageTo' as keyof ColumnSettings, label: 'Age To' },
  { key: 'subjectType' as keyof ColumnSettings, label: 'Subject Type' },
  { key: 'sex' as keyof ColumnSettings, label: 'Sex' },
  { key: 'healthyVolunteers' as keyof ColumnSettings, label: 'Healthy Volunteers' },
  { key: 'targetNoVolunteers' as keyof ColumnSettings, label: 'Target No. of Volunteers' },
  { key: 'actualEnrolledVolunteers' as keyof ColumnSettings, label: 'Actual Enrolled Volunteers' },
  // Study Design Section
  { key: 'purposeOfTrial' as keyof ColumnSettings, label: 'Purpose of Trial' },
  { key: 'summary' as keyof ColumnSettings, label: 'Summary' },
  { key: 'primaryOutcomeMeasures' as keyof ColumnSettings, label: 'Primary Outcome Measures' },
  { key: 'otherOutcomeMeasures' as keyof ColumnSettings, label: 'Other Outcome Measures' },
  { key: 'studyDesignKeywords' as keyof ColumnSettings, label: 'Study Design Keywords' },
  { key: 'studyDesign' as keyof ColumnSettings, label: 'Study Design' },
  { key: 'treatmentRegimen' as keyof ColumnSettings, label: 'Treatment Regimen' },
  { key: 'numberOfArms' as keyof ColumnSettings, label: 'Number of Arms' },
  // Timing Section
  { key: 'startDateEstimated' as keyof ColumnSettings, label: 'Start Date (Estimated)' },
  { key: 'trialEndDateEstimated' as keyof ColumnSettings, label: 'Trial End Date (Estimated)' },
  // Results Section
  { key: 'resultsAvailable' as keyof ColumnSettings, label: 'Results Available' },
  { key: 'endpointsMet' as keyof ColumnSettings, label: 'Endpoints Met' },
  { key: 'adverseEventsReported' as keyof ColumnSettings, label: 'Adverse Events Reported' },
  { key: 'trialOutcome' as keyof ColumnSettings, label: 'Trial Outcome' },
  { key: 'trialOutcomeContent' as keyof ColumnSettings, label: 'Trial Outcome Content' },
  { key: 'adverseEventReported' as keyof ColumnSettings, label: 'Adverse Event Reported' },
  { key: 'adverseEventType' as keyof ColumnSettings, label: 'Adverse Event Type' },
  { key: 'treatmentForAdverseEvents' as keyof ColumnSettings, label: 'Treatment for Adverse Events' },
  // Sites Section
  { key: 'totalSites' as keyof ColumnSettings, label: 'Total Sites' },
  { key: 'siteNotes' as keyof ColumnSettings, label: 'Site Notes' },
];

export function CustomizeColumnModal({
  open,
  onOpenChange,
  columnSettings,
  onColumnSettingsChange,
}: CustomizeColumnModalProps) {
  const [localSettings, setLocalSettings] = useState<ColumnSettings>(columnSettings);
  const MAX_COLUMNS = 15;

  useEffect(() => {
    setLocalSettings(columnSettings);
  }, [columnSettings]);

  const selectedCount = Object.values(localSettings).filter(Boolean).length;

  const handleColumnToggle = (column: keyof ColumnSettings) => {
    const isCurrentlySelected = localSettings[column];

    // If trying to select and already at max, don't allow
    if (!isCurrentlySelected && selectedCount >= MAX_COLUMNS) {
      return;
    }

    setLocalSettings(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handleModifyColumns = () => {
    if (selectedCount === 0) {
      alert("Please select at least one column");
      return;
    }
    if (selectedCount > MAX_COLUMNS) {
      alert(`Maximum ${MAX_COLUMNS} columns allowed`);
      return;
    }
    onColumnSettingsChange(localSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm max-h-[85vh] p-0 rounded-lg overflow-hidden flex flex-col [&>button]:hidden"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {/* Header - Light Blue */}
        <DialogHeader
          className="px-5 py-4 border-b relative"
          style={{ backgroundColor: "#C3E9FB" }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle
              className="text-base font-semibold"
              style={{ fontFamily: "Poppins, sans-serif", color: "#204B73" }}
            >
              Customize column view
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-full p-1 hover:opacity-80"
              style={{ backgroundColor: "#204B73" }}
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </DialogHeader>

        {/* Select Columns Header */}
        <div className="mx-4 mt-4">
          <div
            className="px-4 py-3 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: "#204B73" }}
          >
            <span className="text-white text-sm font-medium">Select columns</span>
            <span className={`text-sm font-medium ${selectedCount >= MAX_COLUMNS ? 'text-red-300' : 'text-green-300'}`}>
              {selectedCount}/{MAX_COLUMNS}
            </span>
          </div>
        </div>

        {/* Warning when max reached */}
        {selectedCount >= MAX_COLUMNS && (
          <div className="mx-4 mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
            Maximum {MAX_COLUMNS} columns reached. Deselect a column to select another.
          </div>
        )}

        {/* Checkbox List */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-1">
            {COLUMN_OPTIONS.map((option) => {
              const isSelected = localSettings[option.key];
              const isDisabled = !isSelected && selectedCount >= MAX_COLUMNS;

              return (
                <label
                  key={option.key}
                  className={`flex items-center gap-3 py-2 rounded px-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleColumnToggle(option.key)}
                    disabled={isDisabled}
                    className="w-4 h-4 rounded border-gray-400 accent-gray-700 disabled:cursor-not-allowed"
                    style={{ accentColor: "#204B73" }}
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer Button */}
        <div className="px-4 py-4 flex justify-end">
          <Button
            onClick={handleModifyColumns}
            className="px-5 py-2 rounded-lg text-white hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif" }}
          >
            <Edit className="h-4 w-4" />
            Modify columns
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { DEFAULT_COLUMN_SETTINGS };
