"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Eye, EyeOff, Upload, FileText, Image, Calculator } from "lucide-react";
import CustomDateInput from "@/components/ui/custom-date-input";
import { useEditTherapeuticForm } from "../../context/edit-form-context";
import FormProgress from "../../components/form-progress";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditTherapeuticsStep5_4() {
  const {
    formData,
    updateField,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    addReference,
    removeReference,
    updateReference,
    saveTrial,
    isLoading,
    isSaving,
  } = useEditTherapeuticForm();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    startDate: "",
    enrollmentClosedDate: "",
    trialEndDate: "",
    resultPublishedDate: "",
    inclusionPeriod: "",
    resultDuration: "",
    overallDurationComplete: "",
    overallDurationPublish: ""
  });
  const form = formData.step5_4;

  // Auto-calculation utility functions
  const calculateDateDifference = (date1: string, date2: string): number => {
    if (!date1 || !date2) return 0;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average days per month - keep as decimal
    return diffMonths;
  };

  const calculateBackwardDate = (endDate: string, durationMonths: number): string => {
    if (!endDate || !durationMonths) return "";
    
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return "";
    
    const start = new Date(end);
    start.setMonth(start.getMonth() - durationMonths);
    
    return start.toISOString().split('T')[0];
  };

  const calculateForwardDate = (startDate: string, durationMonths: number): string => {
    if (!startDate || !durationMonths) return "";
    
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return "";
    
    const end = new Date(start);
    end.setMonth(end.getMonth() + durationMonths);
    
    return end.toISOString().split('T')[0];
  };

  // Auto-calculation logic based on confidence levels
  const performAutoCalculations = (row: string, column: string, value: string) => {
    const confidenceLevels = { "actual": 3, "benchmark": 2, "estimated": 1 };
    const currentLevel = confidenceLevels[row.toLowerCase() as keyof typeof confidenceLevels];
    
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
        updateTableValue(row, "Result Duration", resultDuration.toFixed(2));
      }
    }

    // Auto-calculate Overall Duration to Complete
    if (column === "Start Date" || column === "Trial End Date") {
      const startDate = column === "Start Date" ? value : getValue(row, "Start Date");
      const trialEndDate = column === "Trial End Date" ? value : getValue(row, "Trial End Date");
      
      if (startDate && trialEndDate) {
        const overallDurationComplete = calculateDateDifference(startDate, trialEndDate);
        updateField("step5_4", "overall_duration_complete", overallDurationComplete.toFixed(2));
      }
    }

    // Auto-calculate Overall Duration to Publish Results
    if (column === "Start Date" || column === "Result Published Date") {
      const startDate = column === "Start Date" ? value : getValue(row, "Start Date");
      const resultPublishedDate = column === "Result Published Date" ? value : getValue(row, "Result Published Date");
      
      if (startDate && resultPublishedDate) {
        const overallDurationPublish = calculateDateDifference(startDate, resultPublishedDate);
        updateField("step5_4", "overall_duration_publish", overallDurationPublish.toFixed(2));
      }
    }

    // Back-calculation logic (as per the scenario in the image)
    if (column === "Trial End Date" && row.toLowerCase() === "estimated") {
      const trialEndDate = value;
      const primaryOutcomeDuration = getValue("actual", "Primary Outcome Duration");
      
      if (trialEndDate && primaryOutcomeDuration) {
        // Calculate enrollment closed date by subtracting duration from trial end date
        const end = new Date(trialEndDate);
        if (!isNaN(end.getTime())) {
          const start = new Date(end);
          start.setMonth(start.getMonth() - parseInt(primaryOutcomeDuration));
          const enrollmentClosedDate = start.toISOString().split('T')[0];
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

  // Manual calculator functions
  const calculateManualValues = () => {
    const { startDate, enrollmentClosedDate, trialEndDate, resultPublishedDate } = calculatorData;
    
    if (startDate && enrollmentClosedDate) {
      const inclusionPeriod = calculateDateDifference(startDate, enrollmentClosedDate);
      setCalculatorData(prev => ({ ...prev, inclusionPeriod: inclusionPeriod.toString() }));
    }
    
    if (trialEndDate && resultPublishedDate) {
      const resultDuration = calculateDateDifference(trialEndDate, resultPublishedDate);
      setCalculatorData(prev => ({ ...prev, resultDuration: resultDuration.toString() }));
    }
    
    if (startDate && trialEndDate) {
      const overallDurationComplete = calculateDateDifference(startDate, trialEndDate);
      setCalculatorData(prev => ({ ...prev, overallDurationComplete: overallDurationComplete.toString() }));
    }
    
    if (startDate && resultPublishedDate) {
      const overallDurationPublish = calculateDateDifference(startDate, resultPublishedDate);
      setCalculatorData(prev => ({ ...prev, overallDurationPublish: overallDurationPublish.toString() }));
    }
  };

  const applyCalculatorValues = () => {
    if (calculatorData.inclusionPeriod) {
      updateTableValue("estimated", "Inclusion Period", calculatorData.inclusionPeriod);
    }
    if (calculatorData.resultDuration) {
      updateTableValue("estimated", "Result Duration", calculatorData.resultDuration);
    }
    if (calculatorData.overallDurationComplete) {
      updateField("step5_4", "estimated_enrollment", calculatorData.overallDurationComplete);
    }
    if (calculatorData.overallDurationPublish) {
      updateField("step5_4", "actual_enrollment", calculatorData.overallDurationPublish);
    }
    
    setShowCalculator(false);
    toast({
      title: "Success",
      description: "Calculated values have been applied to the form",
    });
  };

  // Create a state structure for the table data
  const getTableValue = (row: string, col: string) => {
    const key = `${row.toLowerCase()}_${col.replace(/\s+/g, "_").toLowerCase()}`;
    return (form as any)[key] || "";
  };

  const updateTableValue = (row: string, col: string, value: string) => {
    const key = `${row.toLowerCase()}_${col.replace(/\s+/g, "_").toLowerCase()}`;
    updateField("step5_4", key as any, value);
    
    // Trigger auto-calculations after updating the value
    performAutoCalculations(row, col, value);
  };

  // Columns for the top table
  const columns = [
    "Start Date",
    "Inclusion Period",
    "Enrollment Closed Date",
    "Primary Outcome Duration",
    "Trial End Date",
    "Result Duration",
    "Result Published Date",
  ];

  // Rows (labels at the start)
  const rows = ["Actual", "Benchmark", "Estimated"];

  // Registry type options
  const registryTypes = [
    "ClinicalTrials.gov",
    "EU Clinical Trials Database",
    "WHO ICTRP",
    "ISRCTN",
    "JPRN",
    "ANZCTR",
    "CTRI",
    "DRKS",
    "Other"
  ];

  // Helper functions for references
  const handleAddReference = () => addReference("step5_4", "references");
  const handleRemoveReference = (index: number) => removeReference("step5_4", "references", index);
  const handleUpdateReference = (index: number, field: string, value: any) => {
    updateReference("step5_4", "references", index, { [field]: value });
  };

  // Handle file upload for attachments
  const handleFileUpload = (index: number, files: FileList | null) => {
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      const currentAttachments = (form.references || [])[index]?.attachments || [];
      handleUpdateReference(index, "attachments", [...currentAttachments, ...fileNames]);
    }
  };



  const handleSaveChanges = async () => {
    try {
      setIsSavingStep(true);
      await saveTrial(params.id as string);
      
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

  return (
    <div className="space-y-4">
      <FormProgress currentStep={4} />

      {/* Header Buttons */}
      <div className="flex justify-end w-full gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/therapeutics")}
            >
          Cancel
            </Button>
            <Button
          className="text-white font-medium px-6 py-2"
          style={{ backgroundColor: "#204B73" }}
          onClick={handleSaveChanges}
              disabled={isSavingStep || isSaving}
        >
          {isSavingStep || isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

      <Card>
        <CardContent className="space-y-8">
          {/* Top Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Timing</h3>
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

            {/* Manual Calculator */}
            {showCalculator && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold text-blue-800">Date Calculator</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Input Dates */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-gray-700">Input Dates</h5>
                      
                      <div className="space-y-3">
                        <div>
                          <Label>Start Date</Label>
                          <CustomDateInput
                            value={calculatorData.startDate}
                            onChange={(value) => setCalculatorData(prev => ({ ...prev, startDate: value }))}
                            placeholder="Select start date"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <Label>Enrollment Closed Date</Label>
                          <CustomDateInput
                            value={calculatorData.enrollmentClosedDate}
                            onChange={(value) => setCalculatorData(prev => ({ ...prev, enrollmentClosedDate: value }))}
                            placeholder="Select enrollment closed date"
                            className="w-full"
                          />
        </div>

                        <div>
                          <Label>Trial End Date</Label>
                          <CustomDateInput
                            value={calculatorData.trialEndDate}
                            onChange={(value) => setCalculatorData(prev => ({ ...prev, trialEndDate: value }))}
                            placeholder="Select trial end date"
                            className="w-full"
                />
              </div>
                        
                        <div>
                          <Label>Result Published Date</Label>
                          <CustomDateInput
                            value={calculatorData.resultPublishedDate}
                            onChange={(value) => setCalculatorData(prev => ({ ...prev, resultPublishedDate: value }))}
                            placeholder="Select result published date"
                            className="w-full"
                />
              </div>
            </div>
                    </div>

                    {/* Calculated Durations */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-gray-700">Calculated Durations (Months)</h5>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="calc-inclusion-period">Inclusion Period</Label>
                          <Input
                            id="calc-inclusion-period"
                            value={calculatorData.inclusionPeriod}
                            readOnly
                            className="w-full bg-gray-100"
                            placeholder="Auto-calculated"
                          />
                          <p className="text-xs text-gray-500 mt-1">Difference between start date and enrollment closed date</p>
                        </div>
                        
                        <div>
                          <Label htmlFor="calc-result-duration">Result Duration</Label>
                          <Input
                            id="calc-result-duration"
                            value={calculatorData.resultDuration}
                            readOnly
                            className="w-full bg-gray-100"
                            placeholder="Auto-calculated"
                          />
                          <p className="text-xs text-gray-500 mt-1">Difference between trial end date and result published date</p>
                        </div>
                        
                        <div>
                          <Label htmlFor="calc-overall-complete">Overall Duration to Complete</Label>
                          <Input
                            id="calc-overall-complete"
                            value={calculatorData.overallDurationComplete}
                            readOnly
                            className="w-full bg-gray-100"
                            placeholder="Auto-calculated"
                          />
                          <p className="text-xs text-gray-500 mt-1">Difference between start date and trial end date</p>
                        </div>
                        
                        <div>
                          <Label htmlFor="calc-overall-publish">Overall Duration to Publish Results</Label>
                          <Input
                            id="calc-overall-publish"
                            value={calculatorData.overallDurationPublish}
                            readOnly
                            className="w-full bg-gray-100"
                            placeholder="Auto-calculated"
                          />
                          <p className="text-xs text-gray-500 mt-1">Difference between start date and result published date</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      onClick={calculateManualValues}
                      className="flex items-center gap-2"
                    >
                      <Calculator className="h-4 w-4" />
                      Calculate Durations
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={applyCalculatorValues}
                      disabled={!calculatorData.inclusionPeriod && !calculatorData.resultDuration && !calculatorData.overallDurationComplete && !calculatorData.overallDurationPublish}
                    >
                      Apply to Form
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCalculatorData({
                        startDate: "",
                        enrollmentClosedDate: "",
                        trialEndDate: "",
                        resultPublishedDate: "",
                        inclusionPeriod: "",
                        resultDuration: "",
                        overallDurationComplete: "",
                        overallDurationPublish: ""
                      })}
                    >
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Overall Duration Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">
                Overall duration to Complete
              </Label>
              <Input
                type="number"
                className="w-24 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                placeholder="Months"
                value={form.overall_duration_complete || ""}
                onChange={(e) =>
                  updateField("step5_4", "overall_duration_complete", e.target.value)
                }
              />
              <span className="text-sm text-gray-500">(months)</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">
                Overall duration to publish result
              </Label>
              <Input
                type="number"
                className="w-24 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                placeholder="Months"
                value={form.overall_duration_publish || ""}
                onChange={(e) =>
                  updateField("step5_4", "overall_duration_publish", e.target.value)
                }
              />
              <span className="text-sm text-gray-500">(months)</span>
            </div>
          </div>

          {/* References */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">References</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddReference}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Reference
              </Button>
            </div>

            <div className="space-y-6">
              {(form.references || []).map((reference, index) => (
                <Card key={reference.id} className="border border-gray-200">
                  <CardContent className="p-6 space-y-4">
                    {/* Reference Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Reference {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateReference(index, "isVisible", !reference.isVisible)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {reference.isVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        {(form.references || []).length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveReference(index)}
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
                          value={reference.date}
                          onChange={(value) => handleUpdateReference(index, "date", value)}
                          placeholder="Select date"
                          className="w-full"
                />
              </div>

                      {/* Registry Type */}
              <div className="space-y-2">
                        <Label htmlFor={`ref-registry-${index}`}>Registry Type</Label>
                        <Select
                          value={reference.registryType}
                          onValueChange={(value) => handleUpdateReference(index, "registryType", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select registry type" />
                          </SelectTrigger>
                          <SelectContent>
                            {registryTypes.map((type) => (
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
                        value={reference.content}
                        onChange={(e) => handleUpdateReference(index, "content", e.target.value)}
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
                        value={reference.viewSource}
                        onChange={(e) => handleUpdateReference(index, "viewSource", e.target.value)}
                        className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>

                    {/* Attachments */}
                    <div className="space-y-2">
                      <Label htmlFor={`ref-attachments-${index}`}>Attachments</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id={`ref-attachments-${index}`}
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                          onChange={(e) => handleFileUpload(index, e.target.files)}
                          className="flex-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </Button>
                      </div>
                      
                      {/* Display uploaded files */}
                      {reference.attachments && reference.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {reference.attachments.map((attachment, attIndex) => (
                            <div key={attIndex} className="flex items-center gap-2 text-sm text-gray-600">
                              {attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <Image className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                              <span>{attachment}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const updatedAttachments = reference.attachments.filter((_, i) => i !== attIndex);
                                  handleUpdateReference(index, "attachments", updatedAttachments);
                                }}
                                className="text-red-500 hover:text-red-700 p-0 h-auto"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Preview Section */}
                    {reference.content && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview</Label>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-800 whitespace-pre-wrap">{reference.content}</p>
                          {reference.viewSource && (
                            <div className="mt-2">
                              <a
                                href={reference.viewSource}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                              >
                                View Source →
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button variant="ghost" asChild>
              <Link href={`/admin/therapeutics/edit/${params.id}/5-3`}>Previous</Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/therapeutics/edit/${params.id}/5-5`}>Next</Link>
            </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}