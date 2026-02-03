"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { useEditDrugForm } from "../../context/edit-drug-form-context";
import { useDrugNames } from "@/hooks/use-drug-names";
import { useToast } from "@/hooks/use-toast";
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown";

export default function EditDrugOverview() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { formData, updateField, addArrayItem, removeArrayItem, updateArrayItem, saveDrug, isLoading, isSaving } = useEditDrugForm();
  const { addDrugName, getPrimaryNameOptions } = useDrugNames();
  const drugId = params.id as string;

  const [isSavingStep, setIsSavingStep] = useState(false);

  // Options for searchable dropdowns
  const primaryNameOptions: SearchableSelectOption[] = [
    ...getPrimaryNameOptions().map(drug => ({
      value: drug.value,
      label: drug.label
    }))
  ];

  const globalStatusOptions: SearchableSelectOption[] = [
    { value: "clinical_phase_1", label: "Clinical Phase I" },
    { value: "clinical_phase_2", label: "Clinical Phase II" },
    { value: "clinical_phase_3", label: "Clinical Phase III" },
    { value: "clinical_phase_4", label: "Clinical Phase IV" },
    { value: "discontinued", label: "Discontinued" },
    { value: "launched", label: "Launched" },
    { value: "no_development_reported", label: "No Development Reported" },
    { value: "preclinical", label: "Preclinical" },
  ];

  const developmentStatusOptions: SearchableSelectOption[] = [
    { value: "active_development", label: "Active development" },
    { value: "discontinued", label: "Discontinued" },
    { value: "marketed", label: "Marketed" },
  ];


  // Dynamic dropdown for Originator (uses Sponsor and Collaborators from dropdown management)
  const { options: originatorOptions, loading: originatorLoading, error: originatorError } = useDynamicDropdown({
    categoryName: 'sponsor_collaborators',
  });

  // Debug logging for dynamic dropdown
  useEffect(() => {
    console.log('[Edit Drug Form] Originator dropdown loading:', originatorLoading);
    console.log('[Edit Drug Form] Originator dropdown error:', originatorError);
    console.log('[Edit Drug Form] Originator options count:', originatorOptions.length);
    if (originatorOptions.length > 0) {
      console.log('[Edit Drug Form] Sample originator options:', originatorOptions.slice(0, 5));
    }
  }, [originatorOptions, originatorLoading, originatorError]);

  const therapeuticAreaOptions: SearchableSelectOption[] = [
    { value: "oncology", label: "Oncology" },
    { value: "cardiology", label: "Cardiology" },
    { value: "neurology", label: "Neurology" },
    { value: "immunology", label: "Immunology" },
    { value: "infectious_diseases", label: "Infectious Diseases" },
    { value: "metabolic_disorders", label: "Metabolic Disorders" },
    { value: "respiratory", label: "Respiratory" },
    { value: "gastroenterology", label: "Gastroenterology" },
    { value: "dermatology", label: "Dermatology" },
    { value: "ophthalmology", label: "Ophthalmology" },
  ];

  const diseaseTypeOptions: SearchableSelectOption[] = [
    { value: "cancer", label: "Cancer" },
    { value: "diabetes", label: "Diabetes" },
    { value: "alzheimers", label: "Alzheimer's Disease" },
    { value: "parkinsons", label: "Parkinson's Disease" },
    { value: "multiple_sclerosis", label: "Multiple Sclerosis" },
    { value: "rheumatoid_arthritis", label: "Rheumatoid Arthritis" },
    { value: "lupus", label: "Lupus" },
    { value: "crohns_disease", label: "Crohn's Disease" },
    { value: "ulcerative_colitis", label: "Ulcerative Colitis" },
    { value: "psoriasis", label: "Psoriasis" },
  ];

  const regulatoryDesignationsOptions: SearchableSelectOption[] = [
    { value: "orphan_drug", label: "Orphan Drug" },
    { value: "breakthrough_therapy", label: "Breakthrough Therapy" },
    { value: "fast_track", label: "Fast Track" },
    { value: "priority_review", label: "Priority Review" },
    { value: "accelerated_approval", label: "Accelerated Approval" },
    { value: "conditional_approval", label: "Conditional Approval" },
    { value: "emergency_use_authorization", label: "Emergency Use Authorization" },
  ];

  const drugRecordStatusOptions: SearchableSelectOption[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" },
    { value: "archived", label: "Archived" },
  ];

  const form = formData.overview;

  const handleSaveAndContinue = async () => {
    try {
      setIsSavingStep(true);
      await saveDrug(drugId);
      router.push(`/admin/drugs/edit/${drugId}/dev-status`);
    } catch (error) {
      console.error("Error saving drug:", error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingStep(false);
    }
  };

  const handleSaveAndExit = async () => {
    try {
      setIsSavingStep(true);
      await saveDrug(drugId);
      // Add refresh parameter to trigger table refresh
      router.push("/admin/drugs?refresh=true");
    } catch (error) {
      console.error("Error saving drug:", error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingStep(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EAF8FF] to-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading drug data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF8FF] to-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Drug - Overview</h1>
            <p className="text-sm text-gray-600">Step 1 of 6: Basic drug information</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/drugs")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drugs
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 1
                ? "bg-blue-600 text-white"
                : step < 1
                  ? "bg-gray-200 text-gray-600"
                  : "bg-gray-100 text-gray-400"
                }`}
            >
              {step}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>Drug Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="drug_name">Drug Name *</Label>
                  <Input
                    id="drug_name"
                    value={form.drug_name}
                    onChange={(e) => updateField("overview", "drug_name", e.target.value)}
                    placeholder="Enter drug name"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generic_name">Generic Name</Label>
                  <Input
                    id="generic_name"
                    value={form.generic_name}
                    onChange={(e) => updateField("overview", "generic_name", e.target.value)}
                    placeholder="Enter generic name"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="other_name">Other Name</Label>
                  <Input
                    id="other_name"
                    value={form.other_name}
                    onChange={(e) => updateField("overview", "other_name", e.target.value)}
                    placeholder="Enter other name"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary_name">Primary Name</Label>
                  <SearchableSelect
                    options={primaryNameOptions}
                    value={form.primary_name}
                    onValueChange={(value) => {
                      updateField("overview", "primary_name", value);
                      if (value) {
                        addDrugName(value);
                      }
                    }}
                    placeholder="Select or enter primary name"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Status Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="global_status">Global Status</Label>
                  <SearchableSelect
                    options={globalStatusOptions}
                    value={form.global_status}
                    onValueChange={(value) => updateField("overview", "global_status", value)}
                    placeholder="Select global status"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="development_status">Development Status</Label>
                  <SearchableSelect
                    options={developmentStatusOptions}
                    value={form.development_status}
                    onValueChange={(value) => updateField("overview", "development_status", value)}
                    placeholder="Select development status"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drug_record_status">Drug Record Status</Label>
                  <SearchableSelect
                    options={drugRecordStatusOptions}
                    value={form.drug_record_status}
                    onValueChange={(value) => updateField("overview", "drug_record_status", value)}
                    placeholder="Select record status"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_approved">Approval Status</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_approved"
                      checked={form.is_approved}
                      onChange={(e) => updateField("overview", "is_approved", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="is_approved">Is Approved</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Therapeutic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Therapeutic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="therapeutic_area">Therapeutic Area</Label>
                  <SearchableSelect
                    options={therapeuticAreaOptions}
                    value={form.therapeutic_area}
                    onValueChange={(value) => updateField("overview", "therapeutic_area", value)}
                    placeholder="Select therapeutic area"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disease_type">Disease Type</Label>
                  <SearchableSelect
                    options={diseaseTypeOptions}
                    value={form.disease_type}
                    onValueChange={(value) => updateField("overview", "disease_type", value)}
                    placeholder="Select disease type"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originator">Originator</Label>
                  <SearchableSelect
                    options={originatorOptions}
                    value={form.originator}
                    onValueChange={(value) => updateField("overview", "originator", value)}
                    placeholder="Select originator"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    loading={originatorLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="other_active_companies">Other Active Companies</Label>
                  <Input
                    id="other_active_companies"
                    value={form.other_active_companies}
                    onChange={(e) => updateField("overview", "other_active_companies", e.target.value)}
                    placeholder="Enter other active companies"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Additional Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="drug_summary">Drug Summary</Label>
                  <Textarea
                    id="drug_summary"
                    value={form.drug_summary}
                    onChange={(e) => updateField("overview", "drug_summary", e.target.value)}
                    placeholder="Enter drug summary"
                    rows={4}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="regulatory_designations">Regulatory Designations</Label>
                    <SearchableSelect
                      options={regulatoryDesignationsOptions}
                      value={form.regulatory_designations}
                      onValueChange={(value) => updateField("overview", "regulatory_designations", value)}
                      placeholder="Select regulatory designations"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source_links">Source Links</Label>
                    <Input
                      id="source_links"
                      value={form.source_links}
                      onChange={(e) => updateField("overview", "source_links", e.target.value)}
                      placeholder="Enter source links"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments and Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Attachments & Links</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Attachments</Label>
                  {form.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={attachment}
                        onChange={(e) => updateArrayItem("overview", "attachments", index, e.target.value)}
                        placeholder="Enter attachment URL"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem("overview", "attachments", index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("overview", "attachments", "")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Add Attachment
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Links</Label>
                  {form.links.map((link, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={link}
                        onChange={(e) => updateArrayItem("overview", "links", index, e.target.value)}
                        placeholder="Enter link URL"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem("overview", "links", index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("overview", "links", "")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Add Link
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/drugs")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleSaveAndExit}
              disabled={isSavingStep || isSaving}
            >
              {isSavingStep ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save & Exit
                </>
              )}
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              disabled={isSavingStep || isSaving || !form.drug_name}
            >
              {isSavingStep ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
