"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, X, Check, ChevronsUpDown } from "lucide-react";
import { useTherapeuticForm } from "../../context/therapeutic-form-context";
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown";

export default function StudyDesignSection() {
  const {
    formData,
    updateField,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
  } = useTherapeuticForm();
  const form = formData.step5_2;

  // Fallback options in case API fails
  const fallbackKeywords = [
    "Placebo-control",
    "Active control",
    "Randomized",
    "Non-Randomized",
    "Multiple-Blinded",
    "Single-Blinded",
    "Open",
    "Multi-centre",
    "Safety",
    "Efficacy",
    "Tolerability",
    "Pharmacokinetics",
    "Pharmacodynamics",
    "Interventional",
    "Treatment",
    "Parallel Assignment",
    "Single group assignment",
    "Prospective",
    "Cohort"
  ];

  // Fetch study design keywords dynamically from API
  const { options: studyDesignKeywordOptions, loading: keywordsLoading, refetch: refetchKeywords } = useDynamicDropdown({
    categoryName: 'study_design_keywords',
    fallbackOptions: fallbackKeywords.map(keyword => ({ value: keyword, label: keyword }))
  });

  // Extract labels from options for display and comparison
  const studyDesignKeywords = studyDesignKeywordOptions.map(opt => opt.label);

  // Debug logging
  console.log('Study Design Keywords Options:', studyDesignKeywordOptions);
  console.log('Study Design Keywords Labels:', studyDesignKeywords);
  console.log('Current Form Keywords:', form.study_design_keywords);

  const handleKeywordToggle = (keyword: string) => {
    const currentKeywords = form.study_design_keywords || [];
    const isSelected = currentKeywords.includes(keyword);
    
    console.log('Toggling keyword:', keyword, 'Currently selected:', isSelected);
    
    if (isSelected) {
      const updatedKeywords = currentKeywords.filter(k => k !== keyword);
      console.log('Removing keyword, updated keywords:', updatedKeywords);
      updateField("step5_2", "study_design_keywords", updatedKeywords);
    } else {
      const updatedKeywords = [...currentKeywords, keyword];
      console.log('Adding keyword, updated keywords:', updatedKeywords);
      updateField("step5_2", "study_design_keywords", updatedKeywords);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Purpose of Trial</Label>
        <Textarea
          value={form.purpose_of_trial}
          onChange={(e) => updateField("step5_2", "purpose_of_trial", e.target.value)}
          placeholder="Describe the primary purpose of this clinical trial..."
          rows={3}
          className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
        />
      </div>

      <div className="space-y-2">
        <Label>Summary</Label>
        <Textarea
          value={form.summary}
          onChange={(e) => updateField("step5_2", "summary", e.target.value)}
          placeholder="Provide a brief summary of the trial..."
          rows={4}
          className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
        />
      </div>

      <div className="space-y-2">
        <Label>Primary Outcome Measures</Label>
        <div className="space-y-2">
          {form.primaryOutcomeMeasures.length > 0 ? (
            form.primaryOutcomeMeasures.map((measure, idx) => (
              <div key={idx} className="flex gap-2">
                <Textarea
                  value={measure}
                  onChange={(e) => updateArrayItem("step5_2", "primaryOutcomeMeasures", idx, e.target.value)}
                  placeholder="e.g., Overall Survival, Progression-Free Survival"
                  rows={2}
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
                {idx === 0 ? (
                  <Button type="button" variant="outline" onClick={() => addArrayItem("step5_2", "primaryOutcomeMeasures")}>
                    <Plus className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => removeArrayItem("step5_2", "primaryOutcomeMeasures", idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="flex gap-2">
              <Textarea
                value=""
                onChange={(e) => {
                  if (form.primaryOutcomeMeasures.length === 0) {
                    addArrayItem("step5_2", "primaryOutcomeMeasures");
                  }
                  updateArrayItem("step5_2", "primaryOutcomeMeasures", 0, e.target.value);
                }}
                placeholder="e.g., Overall Survival, Progression-Free Survival"
                rows={2}
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
              <Button type="button" variant="outline" onClick={() => addArrayItem("step5_2", "primaryOutcomeMeasures")}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Other Outcome Measures</Label>
        <div className="space-y-2">
          {form.otherOutcomeMeasures.length > 0 ? (
            form.otherOutcomeMeasures.map((measure, idx) => (
              <div key={idx} className="flex gap-2">
                <Textarea
                  value={measure}
                  onChange={(e) => updateArrayItem("step5_2", "otherOutcomeMeasures", idx, e.target.value)}
                  placeholder="e.g., Overall Survival, Progression-Free Survival"
                  rows={2}
                  className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                />
                {idx === 0 ? (
                  <Button type="button" variant="outline" onClick={() => addArrayItem("step5_2", "otherOutcomeMeasures")}>
                    <Plus className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => removeArrayItem("step5_2", "otherOutcomeMeasures", idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="flex gap-2">
              <Textarea
                value=""
                onChange={(e) => {
                  if (form.otherOutcomeMeasures.length === 0) {
                    addArrayItem("step5_2", "otherOutcomeMeasures");
                  }
                  updateArrayItem("step5_2", "otherOutcomeMeasures", 0, e.target.value);
                }}
                placeholder="e.g., Overall Survival, Progression-Free Survival"
                rows={2}
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
              <Button type="button" variant="outline" onClick={() => addArrayItem("step5_2", "otherOutcomeMeasures")}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Study Design Keywords</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              >
                {form.study_design_keywords && form.study_design_keywords.length > 0
                  ? `${form.study_design_keywords.length} keyword(s) selected`
                  : "Select keywords..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search keywords..." />
                <CommandList>
                  {keywordsLoading ? (
                    <CommandEmpty>Loading keywords...</CommandEmpty>
                  ) : studyDesignKeywords.length === 0 ? (
                    <CommandEmpty>No keywords found.</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {studyDesignKeywords.map((keyword) => (
                        <CommandItem
                          key={keyword}
                          value={keyword}
                          onSelect={() => handleKeywordToggle(keyword)}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            checked={(form.study_design_keywords || []).includes(keyword)}
                            className="border-gray-600 data-[state=checked]:bg-gray-800 data-[state=checked]:border-gray-800"
                          />
                          <span>{keyword}</span>
                          <Check
                            className={`ml-auto h-4 w-4 ${
                              (form.study_design_keywords || []).includes(keyword) ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {form.study_design_keywords && form.study_design_keywords.length > 0 && (
            <div className="text-sm text-gray-600 mt-2">
              Selected: {form.study_design_keywords.join(", ")}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Study Design</Label>
          <Textarea
            value={form.study_design}
            onChange={(e) => updateField("step5_2", "study_design", e.target.value)}
            placeholder="Describe the study design in detail..."
            rows={8}
            className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Treatment Regimen</Label>
        <Textarea
          value={form.treatment_regimen}
          onChange={(e) => updateField("step5_2", "treatment_regimen", e.target.value)}
          placeholder="Describe the treatment regimen..."
          rows={3}
          className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
        />
      </div>

      <div className="space-y-2">
        <Label>Number of Arms</Label>
        <Input
          type="number"
          value={form.number_of_arms}
          onChange={(e) => updateField("step5_2", "number_of_arms", e.target.value)}
          placeholder="e.g., 2"
          min="1"
          className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 w-32"
        />
      </div>
    </div>
  );
}
