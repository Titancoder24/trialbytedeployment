"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface DrugColumnSettings {
  // Overview
  drugId: boolean;
  drugName: boolean;
  genericName: boolean;
  otherName: boolean;
  primaryName: boolean;
  globalStatus: boolean;
  developmentStatus: boolean;
  drugSummary: boolean;
  originator: boolean;
  otherActiveCompanies: boolean;
  therapeuticArea: boolean;
  diseaseType: boolean;
  regulatorDesignations: boolean;
  sourceLink: boolean;
  drugRecordStatus: boolean;
  createdAt: boolean;
  updatedAt: boolean;

  // Activity
  mechanismOfAction: boolean;
  biologicalTarget: boolean;
  drugTechnology: boolean;
  deliveryRoute: boolean;
  deliveryMedium: boolean;

  // Dev Status
  therapeuticClass: boolean;
  company: boolean;
  companyType: boolean;
  country: boolean;
  status: boolean;
  reference: boolean;

  // Licensing
  agreement: boolean;
  marketingApprovals: boolean;
  licensingAvailability: boolean;

  // Development
  preclinical: boolean;
  trialId: boolean;
  title: boolean;
  primaryDrugs: boolean;
  sponsor: boolean;
}

interface DrugCustomizeColumnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnSettings: DrugColumnSettings;
  onColumnSettingsChange: (settings: DrugColumnSettings) => void;
}

export const DEFAULT_DRUG_COLUMN_SETTINGS: DrugColumnSettings = {
  drugId: true,
  drugName: true,
  genericName: true,
  otherName: false,
  primaryName: false,
  globalStatus: true,
  developmentStatus: true,
  drugSummary: false,
  originator: true,
  otherActiveCompanies: false,
  therapeuticArea: true,
  diseaseType: true,
  regulatorDesignations: false,
  sourceLink: false,
  drugRecordStatus: false,
  createdAt: true,
  updatedAt: false,
  mechanismOfAction: false,
  biologicalTarget: false,
  drugTechnology: false,
  deliveryRoute: false,
  deliveryMedium: false,
  therapeuticClass: false,
  company: false,
  companyType: false,
  country: false,
  status: false,
  reference: false,
  agreement: false,
  marketingApprovals: false,
  licensingAvailability: false,
  preclinical: false,
  trialId: false,
  title: false,
  primaryDrugs: false,
  sponsor: false,
};

export const DRUG_COLUMN_OPTIONS: { key: keyof DrugColumnSettings; label: string }[] = [
  { key: 'drugId', label: 'Drug ID' },
  { key: 'drugName', label: 'Drug Name' },
  { key: 'genericName', label: 'Generic Name' },
  { key: 'otherName', label: 'Other Name' },
  { key: 'primaryName', label: 'Primary Name' },
  { key: 'globalStatus', label: 'Global Status' },
  { key: 'developmentStatus', label: 'Development Status' },
  { key: 'drugSummary', label: 'Drug Summary' },
  { key: 'originator', label: 'Originator' },
  { key: 'otherActiveCompanies', label: 'Other Active Companies' },
  { key: 'therapeuticArea', label: 'Therapeutic Area' },
  { key: 'diseaseType', label: 'Disease Type' },
  { key: 'regulatorDesignations', label: 'Regulator Designations' },
  { key: 'sourceLink', label: 'Source Link' },
  { key: 'drugRecordStatus', label: 'Drug Record Status' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'updatedAt', label: 'Updated At' },
  { key: 'mechanismOfAction', label: 'Mechanism of Action' },
  { key: 'biologicalTarget', label: 'Biological Target' },
  { key: 'drugTechnology', label: 'Drug Technology' },
  { key: 'deliveryRoute', label: 'Delivery Route' },
  { key: 'deliveryMedium', label: 'Delivery Medium' },
  { key: 'therapeuticClass', label: 'Therapeutic Class' },
  { key: 'company', label: 'Company' },
  { key: 'companyType', label: 'Company Type' },
  { key: 'country', label: 'Country' },
  { key: 'status', label: 'Status' },
  { key: 'reference', label: 'Reference' },
  { key: 'agreement', label: 'Agreement' },
  { key: 'marketingApprovals', label: 'Marketing Approvals' },
  { key: 'licensingAvailability', label: 'Licensing Availability' },
  { key: 'preclinical', label: 'Preclinical' },
  { key: 'trialId', label: 'Trial ID' },
  { key: 'title', label: 'Title' },
  { key: 'primaryDrugs', label: 'Primary Drugs' },
  { key: 'sponsor', label: 'Sponsor' },
];

const MAX_COLUMNS = 15;

export function DrugCustomizeColumnModal({
  open,
  onOpenChange,
  columnSettings,
  onColumnSettingsChange,
}: DrugCustomizeColumnModalProps) {
  const [localSettings, setLocalSettings] = useState<DrugColumnSettings>(columnSettings);

  useEffect(() => {
    setLocalSettings(columnSettings);
  }, [columnSettings]);

  const selectedCount = Object.values(localSettings).filter(Boolean).length;

  const handleColumnToggle = (column: keyof DrugColumnSettings) => {
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
    onColumnSettingsChange(localSettings);
    onOpenChange(false);
  };

  const handleClose = () => {
    setLocalSettings(columnSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Customize column view
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 flex-1 overflow-hidden flex flex-col">
          <div className="mb-4">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-700 text-white rounded">
              <h3 className="text-sm font-medium">
                Select columns (Maximum: {MAX_COLUMNS})
              </h3>
              <span className={`text-sm font-bold ${selectedCount > MAX_COLUMNS ? 'text-red-300' : 'text-green-300'}`}>
                {selectedCount} / {MAX_COLUMNS} selected
              </span>
            </div>
          </div>

          {selectedCount >= MAX_COLUMNS && (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Maximum of {MAX_COLUMNS} columns reached. Deselect a column to select another.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 overflow-y-auto flex-1 pr-2">
            {DRUG_COLUMN_OPTIONS.map((option) => {
              const isSelected = localSettings[option.key];
              const isDisabled = !isSelected && selectedCount >= MAX_COLUMNS;

              return (
                <div
                  key={option.key}
                  className={`flex items-center space-x-3 px-1 py-1 rounded ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  <Checkbox
                    id={option.key}
                    checked={isSelected}
                    onCheckedChange={() => handleColumnToggle(option.key)}
                    disabled={isDisabled}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label
                    htmlFor={option.key}
                    className={`text-sm text-gray-700 flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                  >
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t pt-4">
          <Button
            onClick={handleModifyColumns}
            disabled={selectedCount === 0 || selectedCount > MAX_COLUMNS}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Modify columns
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
