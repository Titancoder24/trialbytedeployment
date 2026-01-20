"use client";

import React, { useState, useEffect, useMemo } from "react";
import { differenceInDays, parseISO, isValid, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomDateInput from "@/components/ui/custom-date-input";
import { Badge } from "@/components/ui/badge";

export interface TrialDurationData {
  startDate: string;
  enrollmentCloseDate: string;
  resultPublishDate: string;
  trialEndDate: string;
  inclusionPeriod: number;
  resultDuration: number;
  overallDurationToComplete: number;
  confidenceTypes: {
    startDate: "Estimated" | "Benchmark" | "Actual";
    enrollmentCloseDate: "Estimated" | "Benchmark" | "Actual";
    resultPublishDate: "Estimated" | "Benchmark" | "Actual";
    trialEndDate: "Estimated" | "Benchmark" | "Actual";
  };
}

interface TrialDurationCalculatorProps {
  data: TrialDurationData;
  onDataChange: (data: TrialDurationData) => void;
  className?: string;
}

export default function TrialDurationCalculator({
  data,
  onDataChange,
  className = "",
}: TrialDurationCalculatorProps) {
  const [localData, setLocalData] = useState<TrialDurationData>(data);

  // Helper function to parse date string
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    try {
      const parsed = parseISO(dateString);
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  // Helper function to calculate days between dates
  const calculateDays = (startDate: string, endDate: string): number => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    
    if (!start || !end) return 0;
    
    const days = differenceInDays(end, start);
    return Math.max(0, days); // Ensure non-negative
  };

  // Calculate durations using useMemo for optimization
  const calculatedDurations = useMemo(() => {
    const startDate = localData.startDate;
    const enrollmentCloseDate = localData.enrollmentCloseDate;
    const resultPublishDate = localData.resultPublishDate;
    const trialEndDate = localData.trialEndDate;

    return {
      inclusionPeriod: calculateDays(startDate, enrollmentCloseDate),
      resultDuration: calculateDays(startDate, resultPublishDate),
      overallDurationToComplete: calculateDays(startDate, trialEndDate),
    };
  }, [localData.startDate, localData.enrollmentCloseDate, localData.resultPublishDate, localData.trialEndDate]);

  // Auto-update confidence types based on current date and trial progress
  useEffect(() => {
    const today = new Date();
    const startDate = parseDate(localData.startDate);
    const trialEndDate = parseDate(localData.trialEndDate);
    const enrollmentCloseDate = parseDate(localData.enrollmentCloseDate);
    const resultPublishDate = parseDate(localData.resultPublishDate);

    const updateConfidenceTypes = () => {
      const newConfidenceTypes = { ...localData.confidenceTypes };

      // Update startDate confidence
      if (startDate) {
        if (today >= startDate) {
          newConfidenceTypes.startDate = "Actual";
        } else {
          newConfidenceTypes.startDate = "Estimated";
        }
      }

      // Update trialEndDate confidence
      if (trialEndDate) {
        if (today >= trialEndDate) {
          newConfidenceTypes.trialEndDate = "Actual";
        } else if (startDate && today >= startDate) {
          newConfidenceTypes.trialEndDate = "Benchmark";
        } else {
          newConfidenceTypes.trialEndDate = "Estimated";
        }
      }

      // Update enrollmentCloseDate confidence
      if (enrollmentCloseDate) {
        if (today >= enrollmentCloseDate) {
          newConfidenceTypes.enrollmentCloseDate = "Actual";
        } else if (startDate && today >= startDate) {
          newConfidenceTypes.enrollmentCloseDate = "Benchmark";
        } else {
          newConfidenceTypes.enrollmentCloseDate = "Estimated";
        }
      }

      // Update resultPublishDate confidence
      if (resultPublishDate) {
        if (today >= resultPublishDate) {
          newConfidenceTypes.resultPublishDate = "Actual";
        } else if (trialEndDate && today >= trialEndDate) {
          newConfidenceTypes.resultPublishDate = "Benchmark";
        } else {
          newConfidenceTypes.resultPublishDate = "Estimated";
        }
      }

      return newConfidenceTypes;
    };

    const newConfidenceTypes = updateConfidenceTypes();
    
    // Only update if confidence types have changed
    if (JSON.stringify(newConfidenceTypes) !== JSON.stringify(localData.confidenceTypes)) {
      setLocalData(prev => ({
        ...prev,
        confidenceTypes: newConfidenceTypes,
      }));
    }
  }, [localData.startDate, localData.trialEndDate, localData.enrollmentCloseDate, localData.resultPublishDate]);

  // Update local data and notify parent
  const updateData = (updates: Partial<TrialDurationData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    onDataChange(newData);
  };

  // Handle date field changes
  const handleDateChange = (field: keyof TrialDurationData, value: string) => {
    updateData({ [field]: value });
  };

  // Handle confidence type changes (manual override)
  const handleConfidenceChange = (field: keyof TrialDurationData["confidenceTypes"], value: "Estimated" | "Benchmark" | "Actual") => {
    updateData({
      confidenceTypes: {
        ...localData.confidenceTypes,
        [field]: value,
      },
    });
  };

  // Get badge variant based on confidence type
  const getBadgeVariant = (confidenceType: "Estimated" | "Benchmark" | "Actual") => {
    switch (confidenceType) {
      case "Estimated":
        return "secondary";
      case "Benchmark":
        return "default";
      case "Actual":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Trial Duration Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Date Input Fields */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700">Date Input Fields</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Badge variant={getBadgeVariant(localData.confidenceTypes.startDate)}>
                  {localData.confidenceTypes.startDate}
                </Badge>
              </div>
              <CustomDateInput
                value={localData.startDate}
                onChange={(value) => handleDateChange("startDate", value)}
                placeholder="Month Day Year"
                className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>

            {/* Enrollment Close Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="enrollmentCloseDate">Enrollment Close Date</Label>
                <Badge variant={getBadgeVariant(localData.confidenceTypes.enrollmentCloseDate)}>
                  {localData.confidenceTypes.enrollmentCloseDate}
                </Badge>
              </div>
              <CustomDateInput
                value={localData.enrollmentCloseDate}
                onChange={(value) => handleDateChange("enrollmentCloseDate", value)}
                placeholder="Month Day Year"
                className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>

            {/* Result Publish Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="resultPublishDate">Result Publish Date</Label>
                <Badge variant={getBadgeVariant(localData.confidenceTypes.resultPublishDate)}>
                  {localData.confidenceTypes.resultPublishDate}
                </Badge>
              </div>
              <CustomDateInput
                value={localData.resultPublishDate}
                onChange={(value) => handleDateChange("resultPublishDate", value)}
                placeholder="Month Day Year"
                className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>

            {/* Trial End Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="trialEndDate">Trial End Date</Label>
                <Badge variant={getBadgeVariant(localData.confidenceTypes.trialEndDate)}>
                  {localData.confidenceTypes.trialEndDate}
                </Badge>
              </div>
              <CustomDateInput
                value={localData.trialEndDate}
                onChange={(value) => handleDateChange("trialEndDate", value)}
                placeholder="Month Day Year"
                className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Auto-Populated Duration Fields */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700">Auto-Calculated Durations (in days)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inclusion Period */}
            <div className="space-y-2">
              <Label>Inclusion Period</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={calculatedDurations.inclusionPeriod}
                  readOnly
                  className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800 bg-gray-50"
                  placeholder="Auto-calculated"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
              <p className="text-xs text-gray-500">
                Enrollment Close Date - Start Date
              </p>
            </div>

            {/* Result Duration */}
            <div className="space-y-2">
              <Label>Result Duration</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={calculatedDurations.resultDuration}
                  readOnly
                  className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800 bg-gray-50"
                  placeholder="Auto-calculated"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
              <p className="text-xs text-gray-500">
                Result Publish Date - Start Date
              </p>
            </div>

            {/* Overall Duration to Complete */}
            <div className="space-y-2">
              <Label>Overall Duration to Complete</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={calculatedDurations.overallDurationToComplete}
                  readOnly
                  className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800 bg-gray-50"
                  placeholder="Auto-calculated"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
              <p className="text-xs text-gray-500">
                Trial End Date - Start Date
              </p>
            </div>
          </div>
        </div>

        {/* Confidence Type Legend */}
        <div className="space-y-2">
          <h3 className="text-md font-medium text-gray-700">Confidence Type Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Estimated</Badge>
              <span className="text-gray-600">Before trial starts</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Benchmark</Badge>
              <span className="text-gray-600">During trial (after start but before end)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Actual</Badge>
              <span className="text-gray-600">Once date is reached or confirmed</span>
            </div>
          </div>
        </div>

        {/* Manual Confidence Override */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700">Manual Confidence Override</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(localData.confidenceTypes).map(([field, confidenceType]) => (
              <div key={field} className="space-y-2">
                <Label>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                <Select
                  value={confidenceType}
                  onValueChange={(value: "Estimated" | "Benchmark" | "Actual") => 
                    handleConfidenceChange(field as keyof TrialDurationData["confidenceTypes"], value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estimated">Estimated</SelectItem>
                    <SelectItem value="Benchmark">Benchmark</SelectItem>
                    <SelectItem value="Actual">Actual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
