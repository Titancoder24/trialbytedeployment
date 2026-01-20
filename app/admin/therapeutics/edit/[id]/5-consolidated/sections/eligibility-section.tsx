"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { useEditTherapeuticForm } from "../../../context/edit-form-context";
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown";
import { useParams } from "next/navigation";
import { useTherapeuticTrial } from "@/hooks/use-therapeutic-trial";
import { useEffect, useRef } from "react";

const volunteerFieldCandidates: Record<"target" | "actual", string[]> = {
  target: [
    "target_no_volunteers",
    "targetNoVolunteers",
    "target_no_of_volunteers",
    "target_number_of_volunteers",
    "target_volunteers",
    "targetVolunteers",
    "estimated_enrollment",
    "enrollment_target",
  ],
  actual: [
    "actual_enrolled_volunteers",
    "actualEnrolledVolunteers",
    "actual_no_of_volunteers",
    "actual_number_of_volunteers",
    "enrolled_volunteers",
    "enrolledVolunteers",
    "actual_enrollment",
  ],
};

const normalizeVolunteerValue = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : null;
  }

  const stringValue = String(value).trim();
  return stringValue ? stringValue : null;
};

const resolveVolunteerValue = (trial: any, type: "target" | "actual"): string => {
  const sources: any[] = [];

  if (trial?.criteria) {
    if (Array.isArray(trial.criteria)) {
      sources.push(...trial.criteria);
    } else {
      sources.push(trial.criteria);
    }
  }

  if (trial?.participationCriteria) {
    if (Array.isArray(trial.participationCriteria)) {
      sources.push(...trial.participationCriteria);
    } else {
      sources.push(trial.participationCriteria);
    }
  }

  if (trial?.participation) {
    sources.push(trial.participation);
  }

  if (trial?.timing) {
    if (Array.isArray(trial.timing)) {
      sources.push(...trial.timing);
    } else {
      sources.push(trial.timing);
    }
  }

  if (trial?.overview) {
    sources.push(trial.overview);
  }

  if (trial?.population) {
    sources.push(trial.population);
  }

  for (const source of sources) {
    if (!source) continue;
    for (const key of volunteerFieldCandidates[type]) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const resolved = normalizeVolunteerValue(source[key]);
        if (resolved !== null) {
          return resolved;
        }
      }
    }
  }

  return "";
};

export default function EligibilitySection() {
  const params = useParams();
  const trialId = params.id as string;
  const {
    formData,
    updateField,
  } = useEditTherapeuticForm();
  const form = formData.step5_3;
  const hasAutoFilledRef = useRef(false);

  // Use react-query to fetch trial data
  const { data: trialData, isLoading: isTrialLoading } = useTherapeuticTrial(trialId);

  // Auto-fill fields from fetched data - only run once when data is first loaded and form is empty
  // This is a backup in case the form context didn't load the data properly
  useEffect(() => {
    if (!trialData || hasAutoFilledRef.current || isTrialLoading) {
      return;
    }

    // Only auto-fill if form fields are actually empty (not just initialized)
    // This prevents overriding data that was already loaded by the form context
    const hasAnyData = form.subject_type || 
                      form.target_no_volunteers || 
                      form.actual_enrolled_volunteers ||
                      (form.age_min && form.age_min[0]) ||
                      (form.age_max && form.age_max[0]) ||
                      form.gender ||
                      (form.healthy_volunteers && form.healthy_volunteers[0]);

    if (hasAnyData) {
      console.log("✅ Eligibility form already has data, skipping auto-fill");
      hasAutoFilledRef.current = true;
      return;
    }

    const criteria = Array.isArray(trialData.criteria) ? trialData.criteria[0] : trialData.criteria;
    if (!criteria) {
      console.log("⚠️ No criteria data found in trialData");
      hasAutoFilledRef.current = true;
      return;
    }

    const asString = (value: unknown): string => {
      if (value === null || value === undefined) return "";
      return typeof value === "string" ? value : String(value);
    };

    const parseAgeToTuple = (value: unknown): string[] => {
      if (!value) return ["", "Years"];
      const str = String(value).trim();
      if (!str) return ["", "Years"];
      const parts = str.split(/\s+/);
      if (parts.length >= 2) {
        return [parts[0], parts.slice(1).join(" ")];
      }
      return [str, "Years"];
    };

    const targetVolunteers = resolveVolunteerValue(trialData, "target");
    const actualVolunteers = resolveVolunteerValue(trialData, "actual");

    console.log("🔄 Auto-filling eligibility fields from react-query data (form was empty):", {
      subject_type: criteria.subject_type,
      age_from: criteria.age_from,
      age_to: criteria.age_to,
      sex: criteria.sex,
      target_no_volunteers: targetVolunteers,
      actual_enrolled_volunteers: actualVolunteers,
    });

    // Only update if field is empty or not set
    if (criteria.subject_type && (!form.subject_type || form.subject_type === "")) {
      updateField("step5_3", "subject_type", criteria.subject_type);
    }
    if (targetVolunteers !== "" && (!form.target_no_volunteers || form.target_no_volunteers === "")) {
      updateField("step5_3", "target_no_volunteers", targetVolunteers);
    }
    if (actualVolunteers !== "" && (!form.actual_enrolled_volunteers || form.actual_enrolled_volunteers === "")) {
      updateField("step5_3", "actual_enrolled_volunteers", actualVolunteers);
    }

    // Handle Age fields which are now arrays [value, unit]
    // Only update if current is empty
    if (criteria.age_from && (!form.age_min || !form.age_min[0] || form.age_min[0] === "")) {
      const parsed = parseAgeToTuple(criteria.age_from);
      updateField("step5_3", "age_min", parsed);
    }
    if (criteria.age_to && (!form.age_max || !form.age_max[0] || form.age_max[0] === "")) {
      const parsed = parseAgeToTuple(criteria.age_to);
      updateField("step5_3", "age_max", parsed);
    }

    // Only update gender if it's empty or not set
    if (criteria.sex && (!form.gender || form.gender === "")) {
      updateField("step5_3", "gender", criteria.sex);
    }

    const healthyVolunteers = asString(criteria.healthy_volunteers);
    if (healthyVolunteers !== "" && (!form.healthy_volunteers || !form.healthy_volunteers[0] || form.healthy_volunteers[0] === "")) {
      updateField("step5_3", "healthy_volunteers", [healthyVolunteers]);
    }

    hasAutoFilledRef.current = true;
  }, [trialData, isTrialLoading]); // Only depend on trialData and loading state

  const ageNumberOptions: SearchableSelectOption[] = Array.from({ length: 151 }, (_, i) => ({
    value: i.toString(),
    label: i.toString()
  }));

  const ageUnitOptions: SearchableSelectOption[] = [
    { value: "Years", label: "Years" },
    { value: "Months", label: "Months" },
    { value: "Weeks", label: "Weeks" },
    { value: "Days", label: "Days" },
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

  // Helper to safely get age parts
  const getAgeValue = (field: string | string[]) => Array.isArray(field) ? field[0] : "";
  const getAgeUnit = (field: string | string[]) => Array.isArray(field) ? (field[1] || "Years") : "Years";

  // Debug logging for age fields
  console.log('🔍 EligibilitySection - Current form age values:', {
    age_min: form.age_min,
    age_max: form.age_max,
    age_min_value: getAgeValue(form.age_min),
    age_min_unit: getAgeUnit(form.age_min),
    age_max_value: getAgeValue(form.age_max),
    age_max_unit: getAgeUnit(form.age_max),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Inclusion Criteria</Label>
          <Textarea
            rows={5}
            placeholder="Enter inclusion criteria (one per line)"
            value={form.inclusion_criteria?.join("\n") || ""}
            onChange={(e) => updateField("step5_3", "inclusion_criteria", e.target.value.split("\n"))}
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Exclusion Criteria</Label>
          <Textarea
            rows={5}
            placeholder="Enter exclusion criteria (one per line)"
            value={form.exclusion_criteria?.join("\n") || ""}
            onChange={(e) => updateField("step5_3", "exclusion_criteria", e.target.value.split("\n"))}
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
              placeholder="e.g., 18"
              value={getAgeValue(form.age_min)}
              onChange={(e) => {
                const currentUnit = getAgeUnit(form.age_min);
                updateField("step5_3", "age_min", [e.target.value, currentUnit]);
              }}
              className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <SearchableSelect
              options={ageUnitOptions}
              value={getAgeUnit(form.age_min)}
              onValueChange={(value) => {
                const currentValue = getAgeValue(form.age_min);
                updateField("step5_3", "age_min", [currentValue, value]);
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
              placeholder="e.g., 65"
              value={getAgeValue(form.age_max)}
              onChange={(e) => {
                const currentUnit = getAgeUnit(form.age_max);
                updateField("step5_3", "age_max", [e.target.value, currentUnit]);
              }}
              className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <SearchableSelect
              options={ageUnitOptions}
              value={getAgeUnit(form.age_max)}
              onValueChange={(value) => {
                const currentValue = getAgeValue(form.age_max);
                updateField("step5_3", "age_max", [currentValue, value]);
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
      </div>

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
    </div>
  );
}
