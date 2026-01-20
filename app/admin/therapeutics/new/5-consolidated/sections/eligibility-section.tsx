"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { useTherapeuticForm } from "../../context/therapeutic-form-context";
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown";

export default function EligibilitySection() {
  const {
    formData,
    updateField,
  } = useTherapeuticForm();
  const form = formData.step5_3;



  const ageUnitOptions: SearchableSelectOption[] = [
    { value: "years", label: "Years" },
    { value: "months", label: "Months" },
    { value: "weeks", label: "Weeks" },
    { value: "days", label: "Days" },
  ];

  // Fallback options for sex
  const fallbackSexOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "both", label: "Both" },
  ];

  // Fallback options for healthy volunteers
  const fallbackHealthyVolunteersOptions = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "no_information", label: "No Information" },
  ];

  // Fetch sex options dynamically from API
  const { options: sexOptions, loading: sexLoading } = useDynamicDropdown({
    categoryName: 'sex',
    fallbackOptions: fallbackSexOptions
  });

  // Fetch healthy volunteers options dynamically from API
  const { options: healthyVolunteersOptions, loading: healthyVolunteersLoading } = useDynamicDropdown({
    categoryName: 'healthy_volunteers',
    fallbackOptions: fallbackHealthyVolunteersOptions
  });

  // Debug logging
  console.log('Sex Options:', sexOptions);
  console.log('Healthy Volunteers Options:', healthyVolunteersOptions);
  console.log('Current Form Gender:', form.gender);
  console.log('Current Form Prior Treatments (Healthy Volunteers):', form.healthy_volunteers);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Inclusion Criteria</Label>
          <Textarea
            rows={5}
            placeholder="Enter inclusion criteria"
            value={form.inclusion_criteria?.[0] || ""}
            onChange={(e) => updateField("step5_3", "inclusion_criteria", [e.target.value])}
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Exclusion Criteria</Label>
          <Textarea
            rows={5}
            placeholder="Enter exclusion criteria"
            value={form.exclusion_criteria?.[0] || ""}
            onChange={(e) => updateField("step5_3", "exclusion_criteria", [e.target.value])}
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Age From</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              max="150"
              placeholder="e.g., 0"
              value={form.age_min?.[0] || ""}
              onChange={(e) => {
                const current = form.age_min || ["", "years"];
                const updated = [...current];
                updated[0] = e.target.value;
                updateField("step5_3", "age_min", updated);
              }}
              className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <SearchableSelect
              options={ageUnitOptions}
              value={form.age_min?.[1] || "years"}
              onValueChange={(value) => {
                const current = form.age_min || ["", "years"];
                const updated = [...current];
                updated[1] = value;
                updateField("step5_3", "age_min", updated);
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
            onChange={(e) => updateField("step5_3", "subject_type", e.target.value)}
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Age To</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              max="150"
              placeholder="e.g., 150"
              value={form.age_max?.[0] || ""}
              onChange={(e) => {
                const current = form.age_max || ["", "years"];
                const updated = [...current];
                updated[0] = e.target.value;
                updateField("step5_3", "age_max", updated);
              }}
              className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <SearchableSelect
              options={ageUnitOptions}
              value={form.age_max?.[1] || "years"}
              onValueChange={(value) => {
                const current = form.age_max || ["", "years"];
                const updated = [...current];
                updated[1] = value;
                updateField("step5_3", "age_max", updated);
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
              options={sexOptions}
              value={form.gender || ""}
              onValueChange={(v) => {
                console.log('Sex selected:', v);
                updateField("step5_3", "gender", v);
              }}
              placeholder="Select sex"
              searchPlaceholder="Search sex..."
              emptyMessage={sexLoading ? "Loading options..." : "No option found."}
              className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
            />
          </div>
          <div className="space-y-2">
            <Label>Healthy Volunteers</Label>
            <SearchableSelect
              options={healthyVolunteersOptions}
              value={form.healthy_volunteers[0] || ""}
              onValueChange={(v) => {
                console.log('Healthy Volunteers selected:', v);
                updateField("step5_3", "healthy_volunteers", [v]);
              }}
              placeholder="Select"
              searchPlaceholder="Search..."
              emptyMessage={healthyVolunteersLoading ? "Loading options..." : "No option found."}
              className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
            />
          </div>
        </div>
      </div >

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Target No Of Volunteers</Label>
          <Input
            type="number"
            placeholder="e.g., 50"
            value={form.target_no_volunteers || ""}
            onChange={(e) => updateField("step5_3", "target_no_volunteers", e.target.value)}
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="space-y-2">
          <Label>Actual Enrolled Volunteers</Label>
          <Input
            type="number"
            placeholder="e.g., 40"
            value={form.actual_enrolled_volunteers || ""}
            onChange={(e) => updateField("step5_3", "actual_enrolled_volunteers", e.target.value)}
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>
    </div >
  );
}
