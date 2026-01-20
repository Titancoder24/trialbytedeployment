"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { useDynamicDropdown } from '@/hooks/use-dynamic-dropdown';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, AlertCircle } from 'lucide-react';

// Static fallback options for each category
const FALLBACK_OPTIONS = {
  therapeutic_area: [
    { value: "autoimmune", label: "Autoimmune" },
    { value: "cardiovascular", label: "Cardiovascular" },
    { value: "endocrinology", label: "Endocrinology" },
    { value: "gastrointestinal", label: "Gastrointestinal" },
    { value: "infectious", label: "Infectious" },
    { value: "oncology", label: "Oncology" },
    { value: "gastroenterology", label: "Gastroenterology" },
    { value: "dermatology", label: "Dermatology" },
    { value: "vaccines", label: "Vaccines" },
    { value: "cns_neurology", label: "CNS/Neurology" },
    { value: "ophthalmology", label: "Ophthalmology" },
    { value: "immunology", label: "Immunology" },
    { value: "rheumatology", label: "Rheumatology" },
    { value: "haematology", label: "Haematology" },
    { value: "nephrology", label: "Nephrology" },
    { value: "urology", label: "Urology" },
  ],
  trial_phase: [
    { value: "phase_i", label: "Phase I" },
    { value: "phase_i_ii", label: "Phase I/II" },
    { value: "phase_ii", label: "Phase II" },
    { value: "phase_ii_iii", label: "Phase II/III" },
    { value: "phase_iii", label: "Phase III" },
    { value: "phase_iii_iv", label: "Phase III/IV" },
    { value: "phase_iv", label: "Phase IV" },
  ],
  trial_status: [
    { value: "planned", label: "Planned" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "completed", label: "Completed" },
    { value: "terminated", label: "Terminated" },
    { value: "suspended", label: "Suspended" },
    { value: "not_yet_recruiting", label: "Not yet recruiting" },
    { value: "recruiting", label: "Recruiting" },
    { value: "active", label: "Active" },
  ],
  disease_type: [
    { value: "acute_lymphocytic_leukemia", label: "Acute Lymphocytic Leukemia" },
    { value: "acute_myeloid_leukemia", label: "Acute Myeloid Leukemia" },
    { value: "breast_cancer", label: "Breast Cancer" },
    { value: "lung_cancer", label: "Lung Cancer" },
    { value: "colorectal_cancer", label: "Colorectal Cancer" },
    { value: "prostate_cancer", label: "Prostate Cancer" },
  ],
  patient_segment: [
    { value: "adult", label: "Adult" },
    { value: "pediatric", label: "Pediatric" },
    { value: "elderly", label: "Elderly" },
    { value: "all_ages", label: "All Ages" },
  ],
  line_of_therapy: [
    { value: "first_line", label: "First Line" },
    { value: "second_line", label: "Second Line" },
    { value: "third_line", label: "Third Line" },
    { value: "salvage", label: "Salvage" },
  ],
  sex: [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "both", label: "Both" },
  ],
  healthy_volunteers: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ],
  trial_record_status: [
    { value: "draft", label: "Draft" },
    { value: "pending_review", label: "Pending Review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ],
  study_design_keywords: [
    { value: "randomized", label: "Randomized" },
    { value: "double_blind", label: "Double Blind" },
    { value: "placebo_controlled", label: "Placebo Controlled" },
    { value: "open_label", label: "Open Label" },
    { value: "single_arm", label: "Single Arm" },
  ],
  registry_type: [
    { value: "clinicaltrials_gov", label: "ClinicalTrials.gov" },
    { value: "euctr", label: "EUCTR" },
    { value: "ctri", label: "CTRI" },
    { value: "anzctr", label: "ANZCTR" },
  ],
  trial_outcome: [
    { value: "positive", label: "Positive" },
    { value: "negative", label: "Negative" },
    { value: "inconclusive", label: "Inconclusive" },
    { value: "pending", label: "Pending" },
  ],
  result_type: [
    { value: "primary_endpoint", label: "Primary Endpoint" },
    { value: "secondary_endpoint", label: "Secondary Endpoint" },
    { value: "safety_endpoint", label: "Safety Endpoint" },
  ],
  adverse_event_reported: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "not_reported", label: "Not Reported" },
  ],
  adverse_event_type: [
    { value: "serious", label: "Serious" },
    { value: "non_serious", label: "Non-Serious" },
    { value: "severe", label: "Severe" },
  ],
  log_type: [
    { value: "creation", label: "Creation" },
    { value: "update", label: "Update" },
    { value: "deletion", label: "Deletion" },
    { value: "approval", label: "Approval" },
  ],
};

interface DynamicDropdownFieldProps {
  categoryName: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}

function DynamicDropdownField({ 
  categoryName, 
  label, 
  value, 
  onValueChange, 
  placeholder,
  description 
}: DynamicDropdownFieldProps) {
  const { options, loading, error, refetch } = useDynamicDropdown({
    categoryName,
    fallbackOptions: FALLBACK_OPTIONS[categoryName as keyof typeof FALLBACK_OPTIONS] || []
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={categoryName}>{label}</Label>
        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
          {error && <AlertCircle className="h-4 w-4 text-red-500" />}
          {!loading && !error && <Database className="h-4 w-4 text-green-500" />}
          <Badge variant={error ? "destructive" : "secondary"} className="text-xs">
            {error ? "Fallback" : "Dynamic"}
          </Badge>
        </div>
      </div>
      <SearchableSelect
        options={options}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder || `Select ${label.toLowerCase()}`}
        disabled={loading}
      />
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-600">
          Using fallback options. {error}
        </p>
      )}
    </div>
  );
}

export default function DynamicDropdownDemo() {
  const [formData, setFormData] = useState({
    therapeutic_area: '',
    trial_phase: '',
    trial_status: '',
    disease_type: '',
    patient_segment: '',
    line_of_therapy: '',
    sex: '',
    healthy_volunteers: '',
    trial_record_status: '',
    study_design_keywords: '',
    registry_type: '',
    trial_outcome: '',
    result_type: '',
    adverse_event_reported: '',
    adverse_event_type: '',
    log_type: '',
  });

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Dynamic Dropdown Demo</h1>
        <p className="text-gray-600 mt-2">
          This demo shows how dropdowns are dynamically loaded from the database with fallback options.
          The green database icon indicates dynamic loading, while red indicates fallback mode.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trial Overview Tab */}
        <Card>
          <CardHeader>
            <CardTitle>Trial Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DynamicDropdownField
              categoryName="therapeutic_area"
              label="Therapeutic Area"
              value={formData.therapeutic_area}
              onValueChange={(value) => handleFieldChange('therapeutic_area', value)}
              description="Select the therapeutic area for this trial"
            />
            
            <DynamicDropdownField
              categoryName="trial_phase"
              label="Trial Phase"
              value={formData.trial_phase}
              onValueChange={(value) => handleFieldChange('trial_phase', value)}
            />
            
            <DynamicDropdownField
              categoryName="trial_status"
              label="Status"
              value={formData.trial_status}
              onValueChange={(value) => handleFieldChange('trial_status', value)}
            />
            
            <DynamicDropdownField
              categoryName="disease_type"
              label="Disease Type"
              value={formData.disease_type}
              onValueChange={(value) => handleFieldChange('disease_type', value)}
            />
            
            <DynamicDropdownField
              categoryName="patient_segment"
              label="Patient Segment"
              value={formData.patient_segment}
              onValueChange={(value) => handleFieldChange('patient_segment', value)}
            />
            
            <DynamicDropdownField
              categoryName="line_of_therapy"
              label="Line of Therapy"
              value={formData.line_of_therapy}
              onValueChange={(value) => handleFieldChange('line_of_therapy', value)}
            />
            
            <DynamicDropdownField
              categoryName="trial_record_status"
              label="Trial Record Status"
              value={formData.trial_record_status}
              onValueChange={(value) => handleFieldChange('trial_record_status', value)}
            />
          </CardContent>
        </Card>

        {/* Other Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Other Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DynamicDropdownField
              categoryName="sex"
              label="Sex"
              value={formData.sex}
              onValueChange={(value) => handleFieldChange('sex', value)}
            />
            
            <DynamicDropdownField
              categoryName="healthy_volunteers"
              label="Healthy Volunteers"
              value={formData.healthy_volunteers}
              onValueChange={(value) => handleFieldChange('healthy_volunteers', value)}
            />
            
            <DynamicDropdownField
              categoryName="study_design_keywords"
              label="Study Design Keywords"
              value={formData.study_design_keywords}
              onValueChange={(value) => handleFieldChange('study_design_keywords', value)}
            />
            
            <DynamicDropdownField
              categoryName="registry_type"
              label="Registry Type"
              value={formData.registry_type}
              onValueChange={(value) => handleFieldChange('registry_type', value)}
            />
            
            <DynamicDropdownField
              categoryName="trial_outcome"
              label="Trial Outcome"
              value={formData.trial_outcome}
              onValueChange={(value) => handleFieldChange('trial_outcome', value)}
            />
            
            <DynamicDropdownField
              categoryName="result_type"
              label="Result Type"
              value={formData.result_type}
              onValueChange={(value) => handleFieldChange('result_type', value)}
            />
            
            <DynamicDropdownField
              categoryName="adverse_event_reported"
              label="Adverse Event Reported"
              value={formData.adverse_event_reported}
              onValueChange={(value) => handleFieldChange('adverse_event_reported', value)}
            />
            
            <DynamicDropdownField
              categoryName="adverse_event_type"
              label="Adverse Event Type"
              value={formData.adverse_event_type}
              onValueChange={(value) => handleFieldChange('adverse_event_type', value)}
            />
            
            <DynamicDropdownField
              categoryName="log_type"
              label="Log Type"
              value={formData.log_type}
              onValueChange={(value) => handleFieldChange('log_type', value)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Form Data Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Form Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
