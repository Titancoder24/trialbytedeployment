"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X, Eye, EyeOff } from "lucide-react";
import NotesSection, { NoteItem } from "@/components/notes-section";
import { useToast } from "@/hooks/use-toast";
import { useEditDrugForm } from "../context/edit-drug-form-context";
import { useDrugNames } from "@/hooks/use-drug-names";
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown";

const steps = [
  { id: 1, title: "Overview", description: "Basic drug information" },
  { id: 2, title: "Drug Activity", description: "Mechanism and biological details" },
  { id: 3, title: "Development", description: "Development status and company info" },
  { id: 4, title: "Other Sources", description: "Additional data sources" },
  { id: 5, title: "Licensing & Marketing", description: "Commercial information" },
  { id: 6, title: "Logs", description: "Change logs and notes" },
];

export default function EditDrugPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { addDrugName, getPrimaryNameOptions } = useDrugNames();
  const { formData, updateField, addArrayItem, removeArrayItem, updateArrayItem, saveDrug, isLoading, isSaving } = useEditDrugForm();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState("pipeline_data");

  const drugId = params.id as string;

  // Dynamic dropdown options
  const { options: diseaseTypeOptions, loading: diseaseTypeLoading } = useDynamicDropdown({ categoryName: 'disease_type' });
  const { options: therapeuticAreaOptions, loading: therapeuticAreaLoading } = useDynamicDropdown({ categoryName: 'therapeutic_area' });
  const { options: developmentStatusOptions, loading: developmentStatusLoading } = useDynamicDropdown({ categoryName: 'development_status' });
  const { options: companyTypeOptions, loading: companyTypeLoading } = useDynamicDropdown({ categoryName: 'company_type' });

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

  // Dynamic dropdown for Originator (uses Sponsor and Collaborators from dropdown management)
  const { options: originatorOptions, loading: originatorLoading } = useDynamicDropdown({ categoryName: 'sponsor_collaborators' });

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

  const mechanismOfActionOptions: SearchableSelectOption[] = [
    { value: "enzyme_inhibitor", label: "Enzyme Inhibitor" },
    { value: "receptor_antagonist", label: "Receptor Antagonist" },
    { value: "receptor_agonist", label: "Receptor Agonist" },
    { value: "ion_channel_modulator", label: "Ion Channel Modulator" },
    { value: "monoclonal_antibody", label: "Monoclonal Antibody" },
    { value: "small_molecule", label: "Small Molecule" },
    { value: "gene_therapy", label: "Gene Therapy" },
    { value: "cell_therapy", label: "Cell Therapy" },
  ];

  const biologicalTargetOptions: SearchableSelectOption[] = [
    { value: "protein", label: "Protein" },
    { value: "enzyme", label: "Enzyme" },
    { value: "receptor", label: "Receptor" },
    { value: "ion_channel", label: "Ion Channel" },
    { value: "dna", label: "DNA" },
    { value: "rna", label: "RNA" },
    { value: "lipid", label: "Lipid" },
    { value: "carbohydrate", label: "Carbohydrate" },
  ];

  const deliveryRouteOptions: SearchableSelectOption[] = [
    { value: "oral", label: "Oral" },
    { value: "intravenous", label: "Intravenous" },
    { value: "subcutaneous", label: "Subcutaneous" },
    { value: "intramuscular", label: "Intramuscular" },
    { value: "topical", label: "Topical" },
    { value: "inhalation", label: "Inhalation" },
    { value: "transdermal", label: "Transdermal" },
    { value: "intranasal", label: "Intranasal" },
  ];

  const deliveryMediumOptions: SearchableSelectOption[] = [
    { value: "tablet", label: "Tablet" },
    { value: "capsule", label: "Capsule" },
    { value: "injection", label: "Injection" },
    { value: "cream", label: "Cream" },
    { value: "gel", label: "Gel" },
    { value: "patch", label: "Patch" },
    { value: "inhaler", label: "Inhaler" },
    { value: "spray", label: "Spray" },
  ];

  const handleSubmit = async () => {
    try {
      await saveDrug(drugId);
      toast({
        title: "Success",
        description: "Drug updated successfully",
        duration: 5000,
      });
      // Add refresh parameter to trigger table refresh
      router.push("/admin/drugs?refresh=true");
    } catch (error) {
      console.error("Error updating drug:", error);
      toast({
        title: "Error",
        description: "Failed to update drug",
        variant: "destructive",
      });
    }
  };

  // Drug Development Status Options
  const THERAPEUTIC_CLASS_OPTIONS: SearchableSelectOption[] = [
    { value: "kinase_inhibitor", label: "Kinase Inhibitor" },
    { value: "monoclonal_antibody", label: "Monoclonal Antibody" },
    { value: "small_molecule", label: "Small Molecule" },
    { value: "peptide", label: "Peptide" },
    { value: "protein", label: "Protein" },
    { value: "vaccine", label: "Vaccine" },
    { value: "gene_therapy", label: "Gene Therapy" },
    { value: "cell_therapy", label: "Cell Therapy" },
  ];

  const COMPANY_OPTIONS: SearchableSelectOption[] = [
    { value: "pfizer", label: "Pfizer" },
    { value: "novartis", label: "Novartis" },
    { value: "roche", label: "Roche" },
    { value: "merck", label: "Merck" },
    { value: "johnson_johnson", label: "Johnson & Johnson" },
    { value: "gilead", label: "Gilead" },
    { value: "biogen", label: "Biogen" },
  ];

  const COMPANY_TYPE_OPTIONS: SearchableSelectOption[] = [
    { value: "originator", label: "Originator" },
    { value: "licensee", label: "Licensee" },
  ];

  const COUNTRY_OPTIONS: SearchableSelectOption[] = [
    { value: "united_states", label: "United States" },
    { value: "canada", label: "Canada" },
    { value: "united_kingdom", label: "United Kingdom" },
    { value: "germany", label: "Germany" },
    { value: "france", label: "France" },
    { value: "italy", label: "Italy" },
    { value: "spain", label: "Spain" },
    { value: "japan", label: "Japan" },
    { value: "china", label: "China" },
    { value: "india", label: "India" },
    { value: "australia", label: "Australia" },
    { value: "brazil", label: "Brazil" },
    { value: "mexico", label: "Mexico" },
    { value: "south_korea", label: "South Korea" },
    { value: "switzerland", label: "Switzerland" },
    { value: "netherlands", label: "Netherlands" },
    { value: "belgium", label: "Belgium" },
    { value: "sweden", label: "Sweden" },
    { value: "norway", label: "Norway" },
    { value: "denmark", label: "Denmark" },
  ];

  const DEVELOPMENT_STATUS_OPTIONS_DETAILED: SearchableSelectOption[] = [
    { value: "launched", label: "Launched" },
    { value: "no_development_reported", label: "No Development Reported" },
    { value: "discontinued", label: "Discontinued" },
    { value: "clinical_phase_1", label: "Clinical Phase I" },
    { value: "clinical_phase_2", label: "Clinical Phase II" },
    { value: "clinical_phase_3", label: "Clinical Phase III" },
    { value: "clinical_phase_4", label: "Clinical Phase IV" },
    { value: "preclinical", label: "Preclinical" },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Overview Tab
        return (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
            {/* First Row: Drug Name, Generic Name, Other Name */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drug_name" className="text-sm font-medium text-gray-700">Drug Name</Label>
                <div className="relative">
                  <Textarea
                    id="drug_name"
                    value={formData.overview.drug_name}
                    onChange={(e) => updateField("overview", "drug_name", e.target.value)}
                    placeholder=""
                    rows={2}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  <Plus
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                    onClick={() => {
                      if (formData.overview.drug_name.trim()) {
                        addDrugName(formData.overview.drug_name, 'drug_name');
                        toast({
                          title: "Added to Primary Name",
                          description: `"${formData.overview.drug_name}" added to Primary Name dropdown`,
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="generic_name" className="text-sm font-medium text-gray-700">Generic Name</Label>
                <div className="relative">
                  <Textarea
                    id="generic_name"
                    value={formData.overview.generic_name}
                    onChange={(e) => updateField("overview", "generic_name", e.target.value)}
                    placeholder=""
                    rows={2}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  <Plus
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                    onClick={() => {
                      if (formData.overview.generic_name.trim()) {
                        addDrugName(formData.overview.generic_name, 'generic_name');
                        toast({
                          title: "Added to Primary Name",
                          description: `"${formData.overview.generic_name}" added to Primary Name dropdown`,
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_name" className="text-sm font-medium text-gray-700">Other Name</Label>
                <div className="relative">
                  <Textarea
                    id="other_name"
                    value={formData.overview.other_name}
                    onChange={(e) => updateField("overview", "other_name", e.target.value)}
                    placeholder=""
                    rows={2}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  <Plus
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                    onClick={() => {
                      if (formData.overview.other_name.trim()) {
                        addDrugName(formData.overview.other_name, 'other_name');
                        toast({
                          title: "Added to Primary Name",
                          description: `"${formData.overview.other_name}" added to Primary Name dropdown`,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Second Row: Primary Name, Global Status, Development Status */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_name" className="text-sm font-medium text-gray-700">Primary Name</Label>
                <SearchableSelect
                  options={primaryNameOptions}
                  value={formData.overview.primary_name}
                  onValueChange={(value) => updateField("overview", "primary_name", value)}
                  placeholder="Select or enter primary name"
                  searchPlaceholder="Search primary names..."
                  emptyMessage="No primary names found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="global_status" className="text-sm font-medium text-gray-700">Global Status</Label>
                <SearchableSelect
                  options={globalStatusOptions}
                  value={formData.overview.global_status}
                  onValueChange={(value) => updateField("overview", "global_status", value)}
                  placeholder="Select global status"
                  searchPlaceholder="Search global status..."
                  emptyMessage="No global status found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="development_status" className="text-sm font-medium text-gray-700">Development Status</Label>
                <SearchableSelect
                  options={developmentStatusOptions}
                  value={formData.overview.development_status}
                  onValueChange={(value) => updateField("overview", "development_status", value)}
                  placeholder="Select development status"
                  searchPlaceholder="Search development status..."
                  emptyMessage="No development status found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Third Row: Drug Summary */}
            <div className="space-y-2">
              <Label htmlFor="drug_summary" className="text-sm font-medium text-gray-700">Drug Summary</Label>
              <Textarea
                id="drug_summary"
                value={formData.overview.drug_summary}
                onChange={(e) => updateField("overview", "drug_summary", e.target.value)}
                placeholder="Enter drug summary"
                rows={3}
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>

            {/* Fourth Row: Originator, Other Active Companies, Therapeutic Area */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originator" className="text-sm font-medium text-gray-700">Originator</Label>
                <SearchableSelect
                  options={originatorOptions}
                  value={formData.overview.originator}
                  onValueChange={(value) => updateField("overview", "originator", value)}
                  placeholder="Select originator"
                  searchPlaceholder="Search originator..."
                  emptyMessage="No originator found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_active_companies" className="text-sm font-medium text-gray-700">Other Active Companies</Label>
                <Textarea
                  id="other_active_companies"
                  value={formData.overview.other_active_companies}
                  onChange={(e) => updateField("overview", "other_active_companies", e.target.value)}
                  placeholder="Enter other active companies"
                  rows={2}
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="therapeutic_area" className="text-sm font-medium text-gray-700">Therapeutic Area</Label>
                <SearchableSelect
                  options={therapeuticAreaOptions}
                  value={formData.overview.therapeutic_area}
                  onValueChange={(value) => updateField("overview", "therapeutic_area", value)}
                  placeholder="Select therapeutic area"
                  searchPlaceholder="Search therapeutic area..."
                  emptyMessage="No therapeutic area found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Fifth Row: Disease Type, Regulatory Designations */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="disease_type" className="text-sm font-medium text-gray-700">Disease Type</Label>
                <SearchableSelect
                  options={diseaseTypeOptions}
                  value={formData.overview.disease_type}
                  onValueChange={(value) => updateField("overview", "disease_type", value)}
                  placeholder="Select disease type"
                  searchPlaceholder="Search disease type..."
                  emptyMessage="No disease type found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regulator_designations" className="text-sm font-medium text-gray-700">Regulator Designations</Label>
                <SearchableSelect
                  options={regulatoryDesignationsOptions}
                  value={formData.overview.regulator_designations}
                  onValueChange={(value) => updateField("overview", "regulator_designations", value)}
                  placeholder="Select regulatory designations"
                  searchPlaceholder="Search regulatory designations..."
                  emptyMessage="No regulatory designations found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Drug Development Status Section */}
            <Card className="border border-gray-200 rounded-lg shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Drug Development Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* First Row: 6 Dropdown Fields */}
                <div className="grid grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Disease Type</Label>
                    <SearchableSelect
                      options={diseaseTypeOptions}
                      value={formData.overview.drug_development_status_rows?.[0]?.disease_type || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(formData.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].disease_type = value;
                        updateField("overview", "drug_development_status_rows", updatedRows);
                      }}
                      placeholder="disease type"
                      emptyMessage="No disease type found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Therapeutic Class</Label>
                    <SearchableSelect
                      options={THERAPEUTIC_CLASS_OPTIONS}
                      value={formData.overview.drug_development_status_rows?.[0]?.therapeutic_class || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(formData.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].therapeutic_class = value;
                        updateField("overview", "drug_development_status_rows", updatedRows);
                      }}
                      placeholder="therapeutic class"
                      searchPlaceholder="therapeutic class..."
                      emptyMessage="No therapeutic class found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Company</Label>
                    <SearchableSelect
                      options={COMPANY_OPTIONS}
                      value={formData.overview.drug_development_status_rows?.[0]?.company || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(formData.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].company = value;
                        updateField("overview", "drug_development_status_rows", updatedRows);
                      }}
                      placeholder="Select company"
                      searchPlaceholder="Search company..."
                      emptyMessage="No company found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Company Type</Label>
                    <SearchableSelect
                      options={COMPANY_TYPE_OPTIONS}
                      value={formData.overview.drug_development_status_rows?.[0]?.company_type || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(formData.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].company_type = value;
                        updateField("overview", "drug_development_status_rows", updatedRows);
                      }}
                      placeholder="company type"
                      searchPlaceholder="company type..."
                      emptyMessage="No company type found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Country</Label>
                    <SearchableSelect
                      options={COUNTRY_OPTIONS}
                      value={formData.overview.drug_development_status_rows?.[0]?.country || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(formData.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].country = value;
                        updateField("overview", "drug_development_status_rows", updatedRows);
                      }}
                      placeholder="Select country"
                      searchPlaceholder="Search country..."
                      emptyMessage="No country found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <SearchableSelect
                      options={DEVELOPMENT_STATUS_OPTIONS_DETAILED}
                      value={formData.overview.drug_development_status_rows?.[0]?.development_status || ""}
                      onValueChange={(value) => {
                        const updatedRows = [...(formData.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].development_status = value;
                        updateField("overview", "drug_development_status_rows", updatedRows);
                      }}
                      placeholder="Select status"
                      searchPlaceholder="Search status..."
                      emptyMessage="No status found."
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                </div>

                {/* Reference Section with Add Attachments and Add Links inside */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Reference</Label>
                  <div className="relative">
                    <Textarea
                      value={formData.overview.drug_development_status_rows?.[0]?.reference || ""}
                      onChange={(e) => {
                        const updatedRows = [...(formData.overview.drug_development_status_rows || [])];
                        if (updatedRows.length === 0) {
                          updatedRows.push({
                            disease_type: "",
                            therapeutic_class: "",
                            company: "",
                            company_type: "",
                            country: "",
                            development_status: "",
                            reference: "",
                          });
                        }
                        updatedRows[0].reference = e.target.value;
                        updateField("overview", "drug_development_status_rows", updatedRows);
                      }}
                      placeholder="Enter reference information"
                      rows={3}
                      className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800 pr-20"
                    />
                    {/* Add Attachments and Add Links positioned inside the textarea */}
                    <div className="absolute bottom-2 left-2 flex gap-2">
                      <div className="relative">
                        <Input
                          placeholder="Add attachments"
                          className="w-32 h-8 text-xs border-gray-600 focus:border-gray-800 focus:ring-gray-800 pr-8"
                        />
                        <Button
                          type="button"
                          size="icon"
                          className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full bg-gray-600 hover:bg-gray-700"
                        >
                          <Plus className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Add links"
                          className="w-32 h-8 text-xs border-gray-600 focus:border-gray-800 focus:ring-gray-800 pr-8"
                        />
                        <Button
                          type="button"
                          size="icon"
                          className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full bg-gray-600 hover:bg-gray-700"
                        >
                          <Plus className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Row Button */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      const newRow = {
                        disease_type: "",
                        therapeutic_class: "",
                        company: "",
                        company_type: "",
                        country: "",
                        development_status: "",
                        reference: "",
                      };
                      updateField("overview", "drug_development_status_rows", [...(formData.overview.drug_development_status_rows || []), newRow]);
                    }}
                    className="text-white"
                    style={{ backgroundColor: '#204B73' }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Row: Source Link, Drug Record Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source_link" className="text-sm font-medium text-gray-700">Source Link</Label>
                <div className="relative">
                  <Textarea
                    id="source_link"
                    value={formData.overview.source_link}
                    onChange={(e) => updateField("overview", "source_link", e.target.value)}
                    placeholder=""
                    rows={2}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  <Plus className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="drug_record_status" className="text-sm font-medium text-gray-700">Drug Record Status</Label>
                <SearchableSelect
                  options={drugRecordStatusOptions}
                  value={formData.overview.drug_record_status}
                  onValueChange={(value) => updateField("overview", "drug_record_status", value)}
                  placeholder="Select drug record status"
                  searchPlaceholder="Search drug record status..."
                  emptyMessage="No drug record status found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Drug Activity Tab
        return (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* First Row: Mechanism of Action, Biological Target */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Mechanism of action</Label>
                <SearchableSelect
                  options={mechanismOfActionOptions}
                  value={formData.activity.mechanism_of_action}
                  onValueChange={(value) => updateField("activity", "mechanism_of_action", value)}
                  placeholder="Select mechanism of action"
                  searchPlaceholder="Search mechanism of action..."
                  emptyMessage="No mechanism of action found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Biological target</Label>
                <SearchableSelect
                  options={biologicalTargetOptions}
                  value={formData.activity.biological_target}
                  onValueChange={(value) => updateField("activity", "biological_target", value)}
                  placeholder="Select biological target"
                  searchPlaceholder="Search biological target..."
                  emptyMessage="No biological target found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Second Row: Drug Technology (Full Width Textarea) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Drug Technology</Label>
              <Textarea
                value={formData.activity.drug_technology}
                onChange={(e) => updateField("activity", "drug_technology", e.target.value)}
                placeholder="Enter unique technology used in the drug"
                rows={4}
                className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>

            {/* Third Row: Delivery Route, Delivery Medium */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Delivery Route</Label>
                <SearchableSelect
                  options={deliveryRouteOptions}
                  value={formData.activity.delivery_route}
                  onValueChange={(value) => updateField("activity", "delivery_route", value)}
                  placeholder="Select delivery route"
                  searchPlaceholder="Search delivery route..."
                  emptyMessage="No delivery route found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Delivery Medium</Label>
                <SearchableSelect
                  options={deliveryMediumOptions}
                  value={formData.activity.delivery_medium}
                  onValueChange={(value) => updateField("activity", "delivery_medium", value)}
                  placeholder="Select delivery medium"
                  searchPlaceholder="Search delivery medium..."
                  emptyMessage="No delivery medium found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>
          </div>
        );

      case 3: // Development Tab
        return (
          <div className="space-y-6 p-6 border border-gray-200 rounded-lg bg-white">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Development Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800">Development</h3>

              {/* Preclinical Sub-section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-gray-900">Preclinical</h4>
                  <button type="button">
                    <Plus className="h-5 w-5 text-gray-400 cursor-pointer" />
                  </button>
                </div>
                <Textarea
                  value={formData.development.preclinical || ''}
                  onChange={(e) => updateField("development", "preclinical", e.target.value)}
                  rows={2}
                  className="w-full border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Clinical Section */}
            <div className="space-y-4">
              <h4 className="text-base font-semibold text-gray-900">Clinical</h4>

              {/* Clinical Trials Table */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-300">
                  <div className="p-3 text-sm font-medium text-gray-700 border-r border-gray-300">
                    Trial ID
                  </div>
                  <div className="p-3 text-sm font-medium text-gray-700 border-r border-gray-300">
                    Title
                  </div>
                  <div className="p-3 text-sm font-medium text-gray-700 border-r border-gray-300">
                    Primary Drugs
                  </div>
                  <div className="p-3 text-sm font-medium text-gray-700 border-r border-gray-300">
                    Status
                  </div>
                  <div className="p-3 text-sm font-medium text-gray-700">Sponsor</div>
                </div>

                {/* Table Row */}
                <div className="grid grid-cols-5">
                  <div className="p-3 border-r border-gray-300">
                    <Textarea
                      value={formData.development.trial_id || ''}
                      onChange={(e) => updateField("development", "trial_id", e.target.value)}
                      rows={2}
                      className="w-full border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                  </div>
                  <div className="p-3 border-r border-gray-300">
                    <Textarea
                      value={formData.development.title || ''}
                      onChange={(e) => updateField("development", "title", e.target.value)}
                      rows={2}
                      className="w-full border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                  </div>
                  <div className="p-3 border-r border-gray-300">
                    <Textarea
                      value={formData.development.primary_drugs || ''}
                      onChange={(e) => updateField("development", "primary_drugs", e.target.value)}
                      rows={2}
                      className="w-full border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                  </div>
                  <div className="p-3 border-r border-gray-300">
                    <Textarea
                      value={formData.development.status || ''}
                      onChange={(e) => updateField("development", "status", e.target.value)}
                      rows={2}
                      className="w-full border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                  </div>
                  <div className="p-3">
                    <Textarea
                      value={formData.development.sponsor || ''}
                      onChange={(e) => updateField("development", "sponsor", e.target.value)}
                      rows={2}
                      className="w-full border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Other Sources Tab
        return (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Other Sources Card with Tabs */}
            <Card className="border rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Other sources</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Tab Navigation */}
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("pipeline_data")}
                    className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "pipeline_data"
                        ? "text-white"
                        : "text-gray-600 bg-gray-200 hover:bg-gray-300"
                      }`}
                    style={activeTab === "pipeline_data" ? { backgroundColor: '#204B73' } : {}}
                  >
                    Pipeline Data
                  </button>
                  <button
                    onClick={() => setActiveTab("press_releases")}
                    className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "press_releases"
                        ? "text-white"
                        : "text-gray-600 bg-gray-200 hover:bg-gray-300"
                      }`}
                    style={activeTab === "press_releases" ? { backgroundColor: '#204B73' } : {}}
                  >
                    Press Releases
                  </button>
                  <button
                    onClick={() => setActiveTab("publications")}
                    className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "publications"
                        ? "text-white"
                        : "text-gray-600 bg-gray-200 hover:bg-gray-300"
                      }`}
                    style={activeTab === "publications" ? { backgroundColor: '#204B73' } : {}}
                  >
                    Publications
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "pipeline_data" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Pipeline Data</Label>
                      <div className="relative">
                        <Textarea
                          value={formData.otherSources.pipelineData}
                          onChange={(e) => updateField("otherSources", "pipelineData", e.target.value)}
                          placeholder="Enter pipeline data information..."
                          rows={6}
                          className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800 pr-10"
                        />
                        <Button
                          type="button"
                          size="icon"
                          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-700"
                        >
                          <Plus className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeTab === "press_releases" && (
                    <NotesSection
                      title="Press Release Notes"
                      notes={formData.otherSources?.pressReleaseNotes ? (Array.isArray(formData.otherSources.pressReleaseNotes) ? formData.otherSources.pressReleaseNotes : [{
                        id: "1",
                        date: new Date().toISOString().split("T")[0],
                        type: "Press Release",
                        content: formData.otherSources.pressReleases || "",
                        sourceLink: "",
                        sourceType: "",
                        sourceUrl: "",
                        attachments: [],
                        isVisible: true
                      }]) : []}
                      onAddNote={() => {
                        const newNote = {
                          id: Date.now().toString(),
                          date: new Date().toISOString().split("T")[0],
                          type: "Press Release",
                          content: "",
                          sourceLink: "",
                          attachments: [],
                          isVisible: true
                        };
                        const currentNotes = Array.isArray(formData.otherSources?.pressReleaseNotes) ? formData.otherSources.pressReleaseNotes : [];
                        updateField("otherSources", "pressReleaseNotes", [...currentNotes, newNote]);
                      }}
                      onUpdateNote={(index, updatedNote) => {
                        const currentNotes = Array.isArray(formData.otherSources?.pressReleaseNotes) ? formData.otherSources.pressReleaseNotes : [];
                        const updatedNotes = currentNotes.map((note, i) =>
                          i === index ? { ...note, ...updatedNote } : note
                        );
                        updateField("otherSources", "pressReleaseNotes", updatedNotes);
                      }}
                      onRemoveNote={(index) => {
                        const currentNotes = Array.isArray(formData.otherSources?.pressReleaseNotes) ? formData.otherSources.pressReleaseNotes : [];
                        const updatedNotes = currentNotes.filter((_, i) => i !== index);
                        updateField("otherSources", "pressReleaseNotes", updatedNotes);
                      }}
                      noteTypes={[
                        "Press Release",
                        "Announcement",
                        "Media Coverage",
                        "News Article",
                        "Other"
                      ]}
                    />
                  )}

                  {activeTab === "publications" && (
                    <NotesSection
                      title="Publication Notes"
                      notes={formData.otherSources?.publicationNotes ? (Array.isArray(formData.otherSources.publicationNotes) ? formData.otherSources.publicationNotes : [{
                        id: "1",
                        date: new Date().toISOString().split("T")[0],
                        type: "Publication",
                        content: formData.otherSources.publications || "",
                        sourceLink: "",
                        sourceType: "",
                        sourceUrl: "",
                        attachments: [],
                        isVisible: true
                      }]) : []}
                      onAddNote={() => {
                        const newNote = {
                          id: Date.now().toString(),
                          date: new Date().toISOString().split("T")[0],
                          type: "Publication",
                          content: "",
                          sourceLink: "",
                          attachments: [],
                          isVisible: true
                        };
                        const currentNotes = Array.isArray(formData.otherSources?.publicationNotes) ? formData.otherSources.publicationNotes : [];
                        updateField("otherSources", "publicationNotes", [...currentNotes, newNote]);
                      }}
                      onUpdateNote={(index, updatedNote) => {
                        const currentNotes = Array.isArray(formData.otherSources?.publicationNotes) ? formData.otherSources.publicationNotes : [];
                        const updatedNotes = currentNotes.map((note, i) =>
                          i === index ? { ...note, ...updatedNote } : note
                        );
                        updateField("otherSources", "publicationNotes", updatedNotes);
                      }}
                      onRemoveNote={(index) => {
                        const currentNotes = Array.isArray(formData.otherSources?.publicationNotes) ? formData.otherSources.publicationNotes : [];
                        const updatedNotes = currentNotes.filter((_, i) => i !== index);
                        updateField("otherSources", "publicationNotes", updatedNotes);
                      }}
                      noteTypes={[
                        "Publication",
                        "Research Paper",
                        "Journal Article",
                        "Conference Paper",
                        "Patent",
                        "Other"
                      ]}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5: // Licensing & Marketing Tab
        return (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Agreement */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Agreement</Label>
              {formData.licencesMarketing.agreement_rows?.map((row, index) => (
                <div key={index} className="relative">
                  <Textarea
                    value={row}
                    onChange={(e) => updateArrayItem("licencesMarketing", "agreement_rows", index, e.target.value)}
                    placeholder="Enter agreement details"
                    rows={2}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrayItem("licencesMarketing", "agreement_rows", index)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem("licencesMarketing", "agreement_rows", "")}
                className="text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Agreement
              </Button>
            </div>

            {/* Marketing Approvals */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Marketing Approvals</Label>
              {formData.licencesMarketing.marketing_approvals_rows?.map((row, index) => (
                <div key={index} className="relative">
                  <Textarea
                    value={row}
                    onChange={(e) => updateArrayItem("licencesMarketing", "marketing_approvals_rows", index, e.target.value)}
                    placeholder="Enter marketing approval details"
                    rows={2}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrayItem("licencesMarketing", "marketing_approvals_rows", index)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem("licencesMarketing", "marketing_approvals_rows", "")}
                className="text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Marketing Approval
              </Button>
            </div>

            {/* Licensing Availability */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Licensing Availability</Label>
              {formData.licencesMarketing.licensing_availability_rows?.map((row, index) => (
                <div key={index} className="relative">
                  <Textarea
                    value={row}
                    onChange={(e) => updateArrayItem("licencesMarketing", "licensing_availability_rows", index, e.target.value)}
                    placeholder="Enter licensing availability details"
                    rows={2}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrayItem("licencesMarketing", "licensing_availability_rows", index)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem("licencesMarketing", "licensing_availability_rows", "")}
                className="text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Licensing Availability
              </Button>
            </div>
          </div>
        );

      case 6: // Logs Tab
        return (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/drugs")}
              >
                Cancel
              </Button>
              <Button
                className="text-white font-medium px-6 py-2"
                style={{ backgroundColor: '#204B73' }}
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Drug Changes Log */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Drug Changes Log</Label>
              <Input
                value={formData.logs.drug_changes_log}
                onChange={(e) => updateField("logs", "drug_changes_log", e.target.value)}
                placeholder="Enter drug changes log"
                className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>

            {/* First Row: Created Date, Last Modified Date, Last Modified User */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Drug Added Date</Label>
                <Input
                  type="date"
                  value={formData.logs.drug_added_date}
                  onChange={(e) => updateField("logs", "drug_added_date", e.target.value)}
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Last Modified Date</Label>
                <Input
                  type="date"
                  value={formData.logs.last_modified_date}
                  onChange={(e) => updateField("logs", "last_modified_date", e.target.value)}
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Last Modified User</Label>
                <Input
                  value={formData.logs.last_modified_user}
                  onChange={(e) => updateField("logs", "last_modified_user", e.target.value)}
                  placeholder="Enter last modified user"
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Second Row: Full Review User, Full Review Checkbox, Next Review Date */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Full Review User</Label>
                <Input
                  value={formData.logs.full_review_user}
                  onChange={(e) => updateField("logs", "full_review_user", e.target.value)}
                  placeholder="Enter full review user"
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Full Review</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="full_review"
                    checked={formData.logs.full_review}
                    onCheckedChange={(checked) => updateField("logs", "full_review", checked)}
                  />
                  <Label htmlFor="full_review" className="text-sm">Mark as fully reviewed</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Next Review Date</Label>
                <Input
                  type="date"
                  value={formData.logs.next_review_date}
                  onChange={(e) => updateField("logs", "next_review_date", e.target.value)}
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Notes</Label>
              <Textarea
                value={formData.logs.notes}
                onChange={(e) => updateField("logs", "notes", e.target.value)}
                placeholder="Enter additional notes"
                rows={4}
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>
          </div>
        );

      default:
        return null;
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Drug</h1>
            <p className="text-sm text-gray-600">Modify drug information across all sections</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/drugs")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drugs
          </Button>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center space-x-2">
          {steps.map((step) => (
            <Button
              key={step.id}
              variant={currentStep === step.id ? "default" : "outline"}
              onClick={() => setCurrentStep(step.id)}
              className="flex-1"
            >
              {step.title}
            </Button>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <p className="text-sm text-gray-600">{steps[currentStep - 1].description}</p>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
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
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            {currentStep < steps.length && (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {currentStep === steps.length && (
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating Drug...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update Drug
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}