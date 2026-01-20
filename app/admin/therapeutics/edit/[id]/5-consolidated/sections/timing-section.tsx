"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import CustomDateInput from "@/components/ui/custom-date-input";
import { useEditTherapeuticForm } from "../../../context/edit-form-context";
import { Calculator, Plus, X, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, Upload, FileText, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEdgeStore } from "@/lib/edgestore";

export default function TimingSection() {
  const {
    formData,
    updateField,
    addReference,
    removeReference,
    updateReference,
  } = useEditTherapeuticForm();
  const { toast } = useToast();
  const { edgestore } = useEdgeStore();
  const form = formData.step5_4;

  const [uploadingNoteAttachment, setUploadingNoteAttachment] = useState<{ [key: number]: boolean }>({});

  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    date: "",
    duration: "",
    frequency: "days",
    outputDate: ""
  });
  // Use form context for calculator data instead of local state
  const durationConverterData = form.durationConverterData || {
    duration: "",
    frequency: "days",
    outputMonths: ""
  };
  const enhancedCalculatorData = form.enhancedCalculatorData || {
    date: "",
    duration: "",
    frequency: "months",
    outputDate: ""
  };

  // State for Difference Calculator (Calculation)
  const [diffCalculatorData, setDiffCalculatorData] = useState({
    startDate: "",
    endDate: "",
    resultMonths: ""
  });

  console.log("TimingSection - Current form data:", form);

  // Auto-calculation utility functions
  const calculateDateDifference = (date1: string, date2: string): number => {
    if (!date1 || !date2) return 0;

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
    console.log(`Date difference calculation: ${date1} to ${date2} = ${diffMonths.toFixed(2)} months`);
    return diffMonths;
  };

  const getTableValue = (row: string, col: string) => {
    const key = `${row.toLowerCase()}_${col.replace(/\s+/g, "_").toLowerCase()}`;
    return (form as any)[key] || "";
  };

  // Auto-calculation logic based on confidence levels
  const performAutoCalculations = (row: string, column: string, value: string) => {
    console.log(`Auto-calculation triggered: row=${row}, column=${column}, value=${value}`);

    // Get all current values for calculations
    const getValue = (r: string, c: string) => {
      const key = `${r.toLowerCase()}_${c.replace(/\s+/g, "_").toLowerCase()}`;
      return (form as any)[key] || "";
    };

    // Auto-calculate Inclusion Period
    if (column === "Start Date" || column === "Enrollment Closed Date") {
      const startDate = column === "Start Date" ? value : getValue(row, "Start Date");
      const enrollmentClosedDate = column === "Enrollment Closed Date" ? value : getValue(row, "Enrollment Closed Date");

      if (startDate && enrollmentClosedDate) {
        // Validate that start date is not greater than enrollment closed date
        const start = new Date(startDate);
        const enrollment = new Date(enrollmentClosedDate);

        if (start > enrollment) {
          toast({
            title: "Date Validation Error",
            description: `Start date (${startDate}) cannot be greater than enrollment closure date (${enrollmentClosedDate})`,
            variant: "destructive",
          });
          return;
        }

        const inclusionPeriod = calculateDateDifference(startDate, enrollmentClosedDate);
        console.log(`Calculated Inclusion Period for ${row}: ${inclusionPeriod.toFixed(2)}`);
        updateTableValue(row, "Inclusion Period", inclusionPeriod.toFixed(2));
      }
    }

    // Auto-calculate Result Duration
    if (column === "Trial End Date" || column === "Result Published Date") {
      const trialEndDate = column === "Trial End Date" ? value : getValue(row, "Trial End Date");
      const resultPublishedDate = column === "Result Published Date" ? value : getValue(row, "Result Published Date");

      if (trialEndDate && resultPublishedDate) {
        // Validate that trial end date is not greater than result published date
        const trialEnd = new Date(trialEndDate);
        const resultPublished = new Date(resultPublishedDate);

        if (trialEnd > resultPublished) {
          toast({
            title: "Date Validation Error",
            description: `Trial end date (${trialEndDate}) cannot be greater than result published date (${resultPublishedDate})`,
            variant: "destructive",
          });
          return;
        }

        const resultDuration = calculateDateDifference(trialEndDate, resultPublishedDate);
        console.log(`Calculated Result Duration for ${row}: ${resultDuration.toFixed(2)}`);
        updateTableValue(row, "Result Duration", resultDuration.toFixed(2));
      }
    }

    // Auto-calculate Overall Duration to Complete
    if (column === "Start Date" || column === "Trial End Date") {
      const startDate = column === "Start Date" ? value : getValue(row, "Start Date");
      const trialEndDate = column === "Trial End Date" ? value : getValue(row, "Trial End Date");

      if (startDate && trialEndDate) {
        const overallDurationComplete = calculateDateDifference(startDate, trialEndDate);
        console.log(`Calculated Overall Duration to Complete: ${overallDurationComplete.toFixed(2)}`);
        updateField("step5_4", "overall_duration_complete", overallDurationComplete.toFixed(2));
      }
    }

    // Auto-calculate Overall Duration to Publish Results
    if (column === "Start Date" || column === "Result Published Date") {
      const startDate = column === "Start Date" ? value : getValue(row, "Start Date");
      const resultPublishedDate = column === "Result Published Date" ? value : getValue(row, "Result Published Date");

      if (startDate && resultPublishedDate) {
        const overallDurationPublish = calculateDateDifference(startDate, resultPublishedDate);
        console.log(`Calculated Overall Duration to Publish: ${overallDurationPublish.toFixed(2)}`);
        updateField("step5_4", "overall_duration_publish", overallDurationPublish.toFixed(2));
      }
    }

    // Back-calculation logic for Estimated row
    if (column === "Trial End Date" && row.toLowerCase() === "estimated") {
      const trialEndDate = value;
      const primaryOutcomeDuration = getValue("actual", "Primary Outcome Duration");

      if (trialEndDate && primaryOutcomeDuration) {
        const end = new Date(trialEndDate);
        if (!isNaN(end.getTime())) {
          const start = new Date(end);
          start.setMonth(start.getMonth() - parseInt(primaryOutcomeDuration));
          const enrollmentClosedDate = start.toISOString().split('T')[0];
          console.log(`Back-calculated Enrollment Closed Date: ${enrollmentClosedDate}`);
          updateTableValue("estimated", "Enrollment Closed Date", enrollmentClosedDate);

          // Calculate inclusion period for estimated row
          const startDate = getValue("estimated", "Start Date");
          if (startDate) {
            const inclusionPeriod = calculateDateDifference(startDate, enrollmentClosedDate);
            updateTableValue("estimated", "Inclusion Period", inclusionPeriod.toFixed(2));
          }
        }
      }
    }
  };

  const updateTableValue = (row: string, col: string, value: string) => {
    const key = `${row.toLowerCase()}_${col.replace(/\s+/g, "_").toLowerCase()}`;
    console.log(`Updating table value: ${key} = ${value}`);
    updateField("step5_4", key as any, value);

    // Trigger auto-calculations after updating the value
    performAutoCalculations(row, col, value);
  };

  // New calculator functions for forward/backward date calculation
  const calculateForwardDate = () => {
    console.log("Calculating date forward:", calculatorData);
    if (!calculatorData.date || !calculatorData.duration) return;
    const startDate = new Date(calculatorData.date);
    if (isNaN(startDate.getTime())) return;
    const duration = parseFloat(calculatorData.duration);
    if (isNaN(duration)) return;
    const resultDate = new Date(startDate);
    // Add duration based on frequency
    if (calculatorData.frequency === "days") {
      resultDate.setDate(resultDate.getDate() + duration);
    } else if (calculatorData.frequency === "weeks") {
      resultDate.setDate(resultDate.getDate() + duration * 7);
    } else if (calculatorData.frequency === "months") {
      // Handle decimal months: add whole months first, then fractional part as days
      const wholeMonths = Math.floor(duration);
      const fractionalMonths = duration - wholeMonths;
      resultDate.setMonth(resultDate.getMonth() + wholeMonths);
      const fractionalDays = Math.round(fractionalMonths * 30.44);
      resultDate.setDate(resultDate.getDate() + fractionalDays);
    }
    // Format as MM-DD-YYYY
    const month = String(resultDate.getMonth() + 1).padStart(2, '0');
    const day = String(resultDate.getDate()).padStart(2, '0');
    const year = resultDate.getFullYear();
    const formattedDate = `${month}-${day}-${year}`;
    setCalculatorData(prev => ({
      ...prev,
      outputDate: formattedDate
    }));
    console.log("Date forward calculated:", formattedDate);
  };

  const calculateBackwardDate = () => {
    console.log("Calculating date backward:", calculatorData);
    if (!calculatorData.date || !calculatorData.duration) return;
    const startDate = new Date(calculatorData.date);
    if (isNaN(startDate.getTime())) return;
    const duration = parseFloat(calculatorData.duration);
    if (isNaN(duration)) return;
    const resultDate = new Date(startDate);
    // Subtract duration based on frequency
    if (calculatorData.frequency === "days") {
      resultDate.setDate(resultDate.getDate() - duration);
    } else if (calculatorData.frequency === "weeks") {
      resultDate.setDate(resultDate.getDate() - duration * 7);
    } else if (calculatorData.frequency === "months") {
      // Handle decimal months: subtract whole months first, then fractional part as days
      const wholeMonths = Math.floor(duration);
      const fractionalMonths = duration - wholeMonths;
      resultDate.setMonth(resultDate.getMonth() - wholeMonths);
      const fractionalDays = Math.round(fractionalMonths * 30.44);
      resultDate.setDate(resultDate.getDate() - fractionalDays);
    }
    // Format as MM-DD-YYYY
    const month = String(resultDate.getMonth() + 1).padStart(2, '0');
    const day = String(resultDate.getDate()).padStart(2, '0');
    const year = resultDate.getFullYear();
    const formattedDate = `${month}-${day}-${year}`;
    setCalculatorData(prev => ({
      ...prev,
      outputDate: formattedDate
    }));
    console.log("Date backward calculated:", formattedDate);
  };

  const clearCalculator = () => {
    setCalculatorData({
      date: "",
      duration: "",
      frequency: "days",
      outputDate: ""
    });
  };

  // Duration to Months Converter functions
  const calculateDurationToMonths = () => {
    console.log("Converting duration to months:", durationConverterData);
    if (!durationConverterData.duration) return;
    const duration = parseFloat(durationConverterData.duration);
    if (isNaN(duration)) return;
    let months = 0;
    if (durationConverterData.frequency === "days") {
      months = duration / 30;
    } else if (durationConverterData.frequency === "weeks") {
      months = duration / 4;
    }
    const outputMonths = months.toFixed(2);
    updateField("step5_4", "durationConverterData", {
      ...durationConverterData,
      outputMonths
    });
    console.log("Duration converted to months:", outputMonths);
  };

  const clearDurationConverter = () => {
    updateField("step5_4", "durationConverterData", {
      duration: "",
      frequency: "days",
      outputMonths: ""
    });
  };

  const handleUpdateReference = (index: number, field: string, value: any) => {
    updateReference("step5_4", "references", index, { [field]: value });
  };

  // Handle file upload for note attachments using Edge Store
  const handleNoteAttachmentUpload = async (file: File, noteIndex: number) => {
    if (!file) return;

    try {
      setUploadingNoteAttachment(prev => ({ ...prev, [noteIndex]: true }));
      console.log(`Uploading file to Edge Store for note ${noteIndex}:`, file.name);

      const res = await edgestore.trialOutcomeAttachments.upload({
        file,
        onProgressChange: (progress) => {
          console.log(`Upload progress for note ${noteIndex}:`, progress);
        },
      });

      console.log("File uploaded successfully:", res.url);

      // Get current attachments and add the new one
      const currentNote = form.references[noteIndex];
      const currentAttachments = currentNote?.attachments || [];
      const newAttachment = {
        url: res.url,
        name: file.name,
        size: file.size,
        type: file.type,
      };

      handleUpdateReference(noteIndex, "attachments", [...currentAttachments, newAttachment]);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingNoteAttachment(prev => ({ ...prev, [noteIndex]: false }));
    }
  };

  // Handle removing a specific attachment from a note
  const handleRemoveNoteAttachment = async (noteIndex: number, attachmentIndex: number) => {
    const currentNote = form.references[noteIndex];
    const attachment = currentNote?.attachments[attachmentIndex];

    // Check if attachment is an object with a url property
    if (attachment && typeof attachment === 'object' && 'url' in attachment) {
      const fileUrl = attachment.url;

      // Optimistically update UI first
      const updatedAttachments = currentNote.attachments.filter((_: any, i: number) => i !== attachmentIndex);
      handleUpdateReference(noteIndex, "attachments", updatedAttachments);

      try {
        await edgestore.trialOutcomeAttachments.delete({
          url: fileUrl?.trim() || '',
        });

        toast({
          title: "Success",
          description: "File removed successfully",
        });
      } catch (error: any) {
        console.error("Error removing file from Edge Store:", error);

        const errorMessage = error?.message || String(error) || '';
        const errorString = errorMessage.toLowerCase();

        const isNotFoundError = errorString.includes('404') ||
          errorString.includes('not found') ||
          errorString.includes('does not exist') ||
          errorString.includes('no such key');

        const isServerError = errorString.includes('internal server error') ||
          errorString.includes('500') ||
          errorString.includes('server error');

        if (isNotFoundError || isServerError) {
          // Already removed from UI, silently succeed
          return;
        } else {
          console.warn("Edge Store deletion error (file removed from form):", error);
          toast({
            title: "File removed",
            description: "File has been removed from the form.",
          });
        }
      }
    } else {
      // If it's just a string (old format), just remove it from the array
      const updatedAttachments = currentNote.attachments.filter((_: any, i: number) => i !== attachmentIndex);
      handleUpdateReference(noteIndex, "attachments", updatedAttachments);
    }
  };


  // Enhanced Date Calculator functions
  const calculateEnhancedForwardDate = () => {
    console.log("Calculating enhanced date forward:", enhancedCalculatorData);
    if (!enhancedCalculatorData.date || !enhancedCalculatorData.duration) return;
    const startDate = new Date(enhancedCalculatorData.date);
    if (isNaN(startDate.getTime())) return;
    const duration = parseFloat(enhancedCalculatorData.duration);
    if (isNaN(duration)) return;
    const resultDate = new Date(startDate);
    // Add duration based on frequency
    if (enhancedCalculatorData.frequency === "days") {
      resultDate.setDate(resultDate.getDate() + duration);
    } else if (enhancedCalculatorData.frequency === "weeks") {
      resultDate.setDate(resultDate.getDate() + (duration * 7));
    } else if (enhancedCalculatorData.frequency === "months") {
      // Handle decimal months: add whole months first, then fractional part as days
      const wholeMonths = Math.floor(duration);
      const fractionalMonths = duration - wholeMonths;
      // Add whole months
      resultDate.setMonth(resultDate.getMonth() + wholeMonths);
      // Add fractional part as days (using average days per month: 30.44)
      const fractionalDays = Math.round(fractionalMonths * 30.44);
      resultDate.setDate(resultDate.getDate() + fractionalDays);
    }
    // Format as MM-DD-YYYY
    const month = String(resultDate.getMonth() + 1).padStart(2, '0');
    const day = String(resultDate.getDate()).padStart(2, '0');
    const year = resultDate.getFullYear();
    const formattedDate = `${month}-${day}-${year}`;
    updateField("step5_4", "enhancedCalculatorData", {
      ...enhancedCalculatorData,
      outputDate: formattedDate
    });
    console.log("Enhanced date forward calculated:", formattedDate);
  };

  const calculateEnhancedBackwardDate = () => {
    console.log("Calculating enhanced date backward:", enhancedCalculatorData);
    if (!enhancedCalculatorData.date || !enhancedCalculatorData.duration) return;
    const startDate = new Date(enhancedCalculatorData.date);
    if (isNaN(startDate.getTime())) return;
    const duration = parseFloat(enhancedCalculatorData.duration);
    if (isNaN(duration)) return;
    const resultDate = new Date(startDate);
    // Subtract duration based on frequency
    if (enhancedCalculatorData.frequency === "days") {
      resultDate.setDate(resultDate.getDate() - duration);
    } else if (enhancedCalculatorData.frequency === "weeks") {
      resultDate.setDate(resultDate.getDate() - (duration * 7));
    } else if (enhancedCalculatorData.frequency === "months") {
      // Handle decimal months: subtract whole months first, then fractional part as days
      const wholeMonths = Math.floor(duration);
      const fractionalMonths = duration - wholeMonths;
      // Subtract whole months
      resultDate.setMonth(resultDate.getMonth() - wholeMonths);
      // Subtract fractional part as days (using average days per month: 30.44)
      const fractionalDays = Math.round(fractionalMonths * 30.44);
      resultDate.setDate(resultDate.getDate() - fractionalDays);
    }
    // Format as MM-DD-YYYY
    const month = String(resultDate.getMonth() + 1).padStart(2, '0');
    const day = String(resultDate.getDate()).padStart(2, '0');
    const year = resultDate.getFullYear();
    const formattedDate = `${month}-${day}-${year}`;
    updateField("step5_4", "enhancedCalculatorData", {
      ...enhancedCalculatorData,
      outputDate: formattedDate
    });
    console.log("Enhanced date backward calculated:", formattedDate);
  };

  const clearEnhancedCalculator = () => {
    updateField("step5_4", "enhancedCalculatorData", {
      date: "",
      duration: "",
      frequency: "months",
      outputDate: ""
    });
  };

  // Difference Calculator functions
  const calculateDifferenceInMonths = () => {
    console.log("Calculating date difference:", diffCalculatorData);
    if (!diffCalculatorData.startDate || !diffCalculatorData.endDate) return;

    const start = new Date(diffCalculatorData.startDate);
    const end = new Date(diffCalculatorData.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast({
        title: "Invalid Dates",
        description: "Please enter valid start and end dates.",
        variant: "destructive"
      });
      return;
    }

    // Calculate difference in milliseconds
    const diffTime = Math.abs(end.getTime() - start.getTime());
    // Convert to months (using average days per month: 30.44)
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);

    setDiffCalculatorData(prev => ({
      ...prev,
      resultMonths: diffMonths.toFixed(2)
    }));
    console.log("Difference calculated:", diffMonths.toFixed(2));
  };

  const clearDiffCalculator = () => {
    setDiffCalculatorData({
      startDate: "",
      endDate: "",
      resultMonths: ""
    });
  };

  const columns = [
    "Start Date",
    "Inclusion Period",
    "Enrollment Closed Date",
    "Primary Outcome Duration",
    "Trial End Date",
    "Result Duration",
    "Result Published Date",
  ];

  const rows = ["Actual", "Benchmark", "Estimated"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Timing Information</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCalculator(!showCalculator)}
          className="flex items-center gap-2"
        >
          <Calculator className="h-4 w-4" />
          {showCalculator ? "Hide Calculator" : "Show Calculator"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2"></th>
              {columns.map((col) => (
                <th key={col} className="text-left p-2 text-sm font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <td className="p-2 font-medium">{row}</td>
                {columns.map((col, i) => (
                  <td key={i} className="p-2">
                    {col.includes("Date") ? (
                      <CustomDateInput
                        value={getTableValue(row, col)}
                        onChange={(value) => updateTableValue(row, col, value)}
                        placeholder="Month Day Year"
                        className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    ) : (
                      <Input
                        type="text"
                        className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                        value={getTableValue(row, col)}
                        onChange={(e) => updateTableValue(row, col, e.target.value)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Date Calculator */}
      {showCalculator && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-blue-800">Date Calculator</h4>
            </div>
            <div className="space-y-6">
              {/* Calculator Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Date Input */}
                <div className="space-y-2">
                  <Label>Date</Label>
                  <CustomDateInput
                    value={calculatorData.date}
                    onChange={(value) => setCalculatorData(prev => ({ ...prev, date: value }))}
                    placeholder="Select date"
                    className="w-full"
                  />
                </div>
                {/* Duration Input */}
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    type="number"
                    value={calculatorData.duration}
                    onChange={(e) => setCalculatorData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="Enter duration"
                    className="w-full"
                  />
                </div>
                {/* Frequency Select */}
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={calculatorData.frequency}
                    onValueChange={(value) => setCalculatorData(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Output Date */}
                <div className="space-y-2">
                  <Label>Output Date</Label>
                  <Input
                    value={calculatorData.outputDate}
                    readOnly
                    className="w-full bg-gray-100"
                    placeholder="Calculated date"
                  />
                </div>
              </div>
              {/* Calculation Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  type="button"
                  onClick={calculateBackwardDate}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700"
                  disabled={!calculatorData.date || !calculatorData.duration}
                >
                  <ArrowLeft className="h-4 w-4" />
                  BW Calculate
                </Button>
                <Button
                  type="button"
                  onClick={calculateForwardDate}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700"
                  disabled={!calculatorData.date || !calculatorData.duration}
                >
                  <ArrowRight className="h-4 w-4" />
                  FW Calculate
                </Button>
              </div>
              {/* Clear Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearCalculator}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Overall Duration Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">Overall duration to Complete</Label>
          <Input
            type="number"
            className="w-24 border-gray-600 focus:border-gray-800 focus:ring-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Months"
            value={form.overall_duration_complete || ""}
            onChange={(e) => updateField("step5_4", "overall_duration_complete", e.target.value)}
          />
          <span className="text-sm text-gray-500">(months)</span>
        </div>
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">Overall duration to publish result</Label>
          <Input
            type="number"
            className="w-24 border-gray-600 focus:border-gray-800 focus:ring-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Months"
            value={form.overall_duration_publish || ""}
            onChange={(e) => updateField("step5_4", "overall_duration_publish", e.target.value)}
          />
          <span className="text-sm text-gray-500">(months)</span>
        </div>
      </div>
      {/* Duration to Months Converter */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-green-600" />
            <h4 className="text-lg font-semibold text-green-800">Duration to Months Converter</h4>
          </div>
          <div className="space-y-4">
            {/* Converter Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Duration Input */}
              <div className="space-y-2">
                <Label>Enter Duration</Label>
                <Input
                  type="number"
                  value={durationConverterData.duration}
                  onChange={(e) => updateField("step5_4", "durationConverterData", { ...durationConverterData, duration: e.target.value })}
                  placeholder="Enter duration"
                  className="w-full"
                />
              </div>
              {/* Frequency Select */}
              <div className="space-y-2">
                <Label>Select Frequency</Label>
                <Select
                  value={durationConverterData.frequency}
                  onValueChange={(value) => updateField("step5_4", "durationConverterData", { ...durationConverterData, frequency: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Output Months */}
              <div className="space-y-2">
                <Label>Output (in Months)</Label>
                <Input
                  value={durationConverterData.outputMonths}
                  readOnly
                  className="w-full bg-gray-100"
                  placeholder="Calculated months"
                />
              </div>
            </div>
            {/* Calculate Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={calculateDurationToMonths}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                disabled={!durationConverterData.duration}
              >
                <ArrowRight className="h-4 w-4" />
                Calculate
              </Button>
            </div>
            {/* Clear Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={clearDurationConverter}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Enhanced Forward/Backward Date Calculator */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-purple-600" />
            <h4 className="text-lg font-semibold text-purple-800">Enhanced Forward/Backward Date Calculator</h4>
          </div>
          <div className="space-y-4">
            {/* Enhanced Calculator Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Date Input */}
              <div className="space-y-2">
                <Label>Date</Label>
                <CustomDateInput
                  value={enhancedCalculatorData.date}
                  onChange={(value) => updateField("step5_4", "enhancedCalculatorData", { ...enhancedCalculatorData, date: value })}
                  placeholder="Select date"
                  className="w-full"
                />
              </div>
              {/* Duration Input */}
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  type="number"
                  value={enhancedCalculatorData.duration}
                  onChange={(e) => updateField("step5_4", "enhancedCalculatorData", { ...enhancedCalculatorData, duration: e.target.value })}
                  placeholder="Enter duration"
                  className="w-full"
                />
              </div>
              {/* Frequency Select */}
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={enhancedCalculatorData.frequency}
                  onValueChange={(value) => updateField("step5_4", "enhancedCalculatorData", { ...enhancedCalculatorData, frequency: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Output Date */}
              <div className="space-y-2">
                <Label>Output Date</Label>
                <Input
                  value={enhancedCalculatorData.outputDate}
                  readOnly
                  className="w-full bg-gray-100"
                  placeholder="Calculated date"
                />
              </div>
            </div>
            {/* Calculation Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                type="button"
                onClick={calculateEnhancedBackwardDate}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                disabled={!enhancedCalculatorData.date || !enhancedCalculatorData.duration}
              >
                <ArrowLeft className="h-4 w-4" />
                BW Calculate
              </Button>
              <Button
                type="button"
                onClick={calculateEnhancedForwardDate}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                disabled={!enhancedCalculatorData.date || !enhancedCalculatorData.duration}
              >
                <ArrowRight className="h-4 w-4" />
                FW Calculate
              </Button>
            </div>
            {/* Clear Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={clearEnhancedCalculator}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation (Difference Calculator) */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-orange-600" />
            <h4 className="text-lg font-semibold text-orange-800">Calculation</h4>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <CustomDateInput
                  value={diffCalculatorData.startDate}
                  onChange={(value) => setDiffCalculatorData(prev => ({ ...prev, startDate: value }))}
                  placeholder="Select start date"
                  className="w-full"
                />
              </div>
              {/* End Date */}
              <div className="space-y-2">
                <Label>End Date</Label>
                <CustomDateInput
                  value={diffCalculatorData.endDate}
                  onChange={(value) => setDiffCalculatorData(prev => ({ ...prev, endDate: value }))}
                  placeholder="Select end date"
                  className="w-full"
                />
              </div>
              {/* Output */}
              <div className="space-y-2">
                <Label>Output (in decimal in months)</Label>
                <Input
                  value={diffCalculatorData.resultMonths}
                  readOnly
                  className="w-full bg-gray-100"
                  placeholder="Calculated months"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                type="button"
                onClick={calculateDifferenceInMonths}
                className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px]"
                disabled={!diffCalculatorData.startDate || !diffCalculatorData.endDate}
              >
                Calculate
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearDiffCalculator}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* References Section */}
      <div className="space-y-4 pt-6 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">References</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Adding reference to step5_4");
              addReference("step5_4", "references");
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Reference
          </Button>
        </div>

        <div className="space-y-6">
          {(form.references || []).map((reference: any, index: number) => (
            <Card key={reference.id} className="border border-gray-200">
              <CardContent className="p-6 space-y-4">
                {/* Reference Header */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Timing Info {index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log("Toggling visibility for reference:", index);
                        updateReference("step5_4", "references", index, { isVisible: !reference.isVisible });
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {reference.isVisible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    {(form.references || []).length > 1 && !reference.isSaved && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log("Removing reference from step5_4:", index);
                          removeReference("step5_4", "references", index);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Reference Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor={`ref-date-${index}`}>Date</Label>
                    <CustomDateInput
                      value={reference.date || ""}
                      onChange={(value) => {
                        console.log("Updating reference date:", index, value);
                        updateReference("step5_4", "references", index, { date: value });
                      }}
                      placeholder="Select date"
                      className="w-full"
                    />
                  </div>

                  {/* Registry Type */}
                  <div className="space-y-2">
                    <Label htmlFor={`ref-registry-${index}`}>Registry Type</Label>
                    <Select
                      value={reference.registryType || ""}
                      onValueChange={(value) => {
                        console.log("Updating registry type:", index, value);
                        updateReference("step5_4", "references", index, { registryType: value });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select registry type" />
                      </SelectTrigger>
                      <SelectContent>
                        {["ClinicalTrials.gov", "EU Clinical Trials Database", "WHO ICTRP", "ISRCTN", "JPRN", "ANZCTR", "CTRI", "DRKS", "Other"].map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor={`ref-content-${index}`}>Content</Label>
                  <Textarea
                    id={`ref-content-${index}`}
                    rows={4}
                    placeholder="Enter reference content here..."
                    value={reference.content || ""}
                    onChange={(e) => {
                      console.log("Updating reference content:", index);
                      updateReference("step5_4", "references", index, { content: e.target.value });
                    }}
                    className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>

                {/* View Source URL */}
                <div className="space-y-2">
                  <Label htmlFor={`ref-source-${index}`}>View Source (URL)</Label>
                  <Input
                    id={`ref-source-${index}`}
                    type="url"
                    placeholder="https://example.com"
                    value={reference.viewSource || ""}
                    onChange={(e) => {
                      console.log("Updating reference source:", index);
                      updateReference("step5_4", "references", index, { viewSource: e.target.value });
                    }}
                    className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`ref-attachments-${index}`}>Attachments</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`ref-attachments-${index}`}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.zip,.rar"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleNoteAttachmentUpload(file, index);
                          e.target.value = '';
                        }
                      }}
                      disabled={uploadingNoteAttachment[index]}
                      className="flex-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={uploadingNoteAttachment[index]}
                    >
                      {uploadingNoteAttachment[index] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {reference.attachments && reference.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {reference.attachments.map((attachment: any, attachIndex: number) => {
                        // Handle both string and object attachments
                        const attachmentName = typeof attachment === 'string'
                          ? attachment
                          : (attachment?.name || attachment?.url || `Attachment ${attachIndex + 1}`);

                        const fileUrl = typeof attachment === 'string'
                          ? (attachment.startsWith('http') ? attachment : null)
                          : (attachment?.url || null);

                        const isImage = attachmentName?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);

                        return (
                          <div
                            key={attachIndex}
                            className="flex items-center gap-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                          >
                            {isImage ? (
                              <Image className="h-4 w-4 text-blue-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-600" />
                            )}
                            <span className="truncate max-w-[200px]">{attachmentName}</span>
                            {fileUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  window.open(fileUrl, '_blank');
                                }}
                                className="text-blue-600 hover:text-blue-800 p-0 h-auto text-xs"
                              >
                                View
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveNoteAttachment(index, attachIndex)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
