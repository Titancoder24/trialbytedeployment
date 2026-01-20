"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { useEditTherapeuticForm } from "../../context/edit-form-context";
import FormProgress from "../../components/form-progress";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditTherapeuticsStep5_3() {
  const {
    formData,
    updateField,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    saveTrial,
    isLoading,
    isSaving,
  } = useEditTherapeuticForm();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const [isSavingStep, setIsSavingStep] = useState(false);
  const form = formData.step5_3;

  // Age From/To Options (0-150)
  const ageNumberOptions: SearchableSelectOption[] = Array.from({ length: 151 }, (_, i) => ({
    value: i.toString(),
    label: i.toString()
  }));

  // Age Unit Options
  const ageUnitOptions: SearchableSelectOption[] = [
    { value: "years", label: "Years" },
    { value: "months", label: "Months" },
    { value: "weeks", label: "Weeks" },
    { value: "days", label: "Days" },
  ];

  // Sex Options
  const genderOptions: SearchableSelectOption[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "both", label: "Both" },
  ];

  // Healthy Volunteers Options
  const healthyVolunteersOptions: SearchableSelectOption[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "no_information", label: "No Information" },
  ];

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
      <FormProgress currentStep={3} />

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
        <CardContent className="space-y-6">
          {/* Top section: Inclusion & Exclusion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Inclusion Criteria</Label>
              <Textarea
                rows={5}
                placeholder="Enter inclusion criteria"
                value={form.inclusion_criteria?.[0] || ""}
                onChange={(e) =>
                  updateField("step5_3", "inclusion_criteria", [e.target.value])
                }
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Exclusion Criteria</Label>
              <Textarea
                rows={5}
                placeholder="Enter exclusion criteria"
                value={form.exclusion_criteria?.[0] || ""}
                onChange={(e) =>
                  updateField("step5_3", "exclusion_criteria", [e.target.value])
                }
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>
          </div>

          {/* Bottom section: Form fields */}

          {/* Row 1: Age From + Subject Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Age From</Label>
              <div className="flex gap-2">
                <SearchableSelect
                  options={ageNumberOptions}
                  value={form.age_min || ""}
                  onValueChange={(value) =>
                    updateField("step5_3", "age_min", value)
                  }
                  placeholder="0"
                  searchPlaceholder="Search age..."
                  emptyMessage="No age found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
                <SearchableSelect
                  options={ageUnitOptions}
                  value={form.biomarker_requirements[0] || ""}
                  onValueChange={(value) => {
                    const current = form.biomarker_requirements || [""];
                    const updated = [...current];
                    updated[0] = value;
                    updateField("step5_3", "biomarker_requirements", updated);
                  }}
                  placeholder="Years"
                  searchPlaceholder="Search unit..."
                  emptyMessage="No unit found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject Type</Label>
              <Input
                placeholder="Enter subject type..."
                value={form.subject_type || ""}
                onChange={(e) =>
                  updateField("step5_3", "subject_type", e.target.value)
                }
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>
          </div>

          {/* Row 2: Age To + Sex + Healthy Volunteers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Age To</Label>
              <div className="flex gap-2">
                <SearchableSelect
                  options={ageNumberOptions}
                  value={form.age_max || ""}
                  onValueChange={(value) =>
                    updateField("step5_3", "age_max", value)
                  }
                  placeholder="150"
                  searchPlaceholder="Search age..."
                  emptyMessage="No age found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
                <SearchableSelect
                  options={ageUnitOptions}
                  value={form.biomarker_requirements[1] || ""}
                  onValueChange={(value) => {
                    const current = form.biomarker_requirements || [""];
                    const updated = [...current];
                    updated[1] = value;
                    updateField("step5_3", "biomarker_requirements", updated);
                  }}
                  placeholder="Years"
                  searchPlaceholder="Search unit..."
                  emptyMessage="No unit found."
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sex</Label>
              <SearchableSelect
                options={genderOptions}
                value={form.gender || ""}
                onValueChange={(v) => updateField("step5_3", "gender", v)}
                placeholder="Select sex"
                searchPlaceholder="Search sex..."
                emptyMessage="No option found."
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
              </div>
              <div className="space-y-2">
                <Label>Healthy Volunteers</Label>
               <SearchableSelect
                 options={healthyVolunteersOptions}
                 value={form.healthy_volunteers[0] || ""}
                 onValueChange={(v) =>
                   updateField("step5_3", "healthy_volunteers", [v])
                 }
                 placeholder="Select"
                 searchPlaceholder="Search..."
                 emptyMessage="No option found."
                 className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
               />
              </div>
            </div>
          </div>

          {/* Row 3: Target Volunteers + Actual Enrolled + Next Button */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
             <div className="space-y-2">
               <Label>Target No Of Volunteers</Label>
               <Input
                 type="number"
                 placeholder="e.g., 50"
                 value={form.target_no_volunteers || ""}
                 onChange={(e) =>
                   updateField("step5_3", "target_no_volunteers", e.target.value)
                 }
                 className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
               />
             </div>
             <div className="space-y-2">
               <Label>Actual Enrolled Volunteers</Label>
               <Input
                 type="number"
                 placeholder="e.g., 40"
                 value={form.actual_enrolled_volunteers || ""}
                 onChange={(e) =>
                   updateField("step5_3", "actual_enrolled_volunteers", e.target.value)
                 }
                 className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
               />
             </div>
          </div>

          {/* Next Button Row */}
          <div className="flex justify-end">
            <Button className="mt-6" asChild>
              <Link href={`/admin/therapeutics/edit/${params.id}/5-4`}>Next</Link>
            </Button>
          </div>

          {/* Previous button below */}
          <div className="flex justify-start">
            <Button variant="ghost" asChild>
              <Link href={`/admin/therapeutics/edit/${params.id}/5-2`}>Previous</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}