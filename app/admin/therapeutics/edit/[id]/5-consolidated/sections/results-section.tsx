"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Plus, X, Check, ChevronsUpDown, Eye, EyeOff, Link as LinkIcon, Loader2, Upload, FileText, Image } from "lucide-react";
import CustomDateInput from "@/components/ui/custom-date-input";
import { useEditTherapeuticForm } from "../../../context/edit-form-context";
import { useToast } from "@/hooks/use-toast";
import { useEdgeStore } from "@/lib/edgestore";
import { PreviewLink } from "@/components/ui/preview-link";
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTherapeuticTrial } from "@/hooks/use-therapeutic-trial";

export default function ResultsSection() {
  const params = useParams();
  const trialId = params.id as string;
  const {
    formData,
    updateField,
    addSiteNote,
    updateSiteNote,
    removeSiteNote,
    toggleSiteNoteVisibility,
  } = useEditTherapeuticForm();
  const { toast } = useToast();
  const { edgestore } = useEdgeStore();
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadingNoteAttachment, setUploadingNoteAttachment] = useState<{ [key: number]: boolean }>({});
  const form = formData.step5_5;

  // Use react-query to fetch trial data
  const { data: trialData, isLoading: isTrialLoading } = useTherapeuticTrial(trialId);

  // Auto-fill fields from react-query data - this runs as a backup to ensure data is populated
  useEffect(() => {
    // Wait for both trial data and form to be ready
    if (!trialData || !form || isTrialLoading) {
      return;
    }

    const results = trialData.results?.[0];
    if (!results) {
      console.log("⚠️ No results data found in trialData");
      return;
    }

    console.log("🔄 React-Query Auto-fill: Checking if fields need to be populated", {
      has_trial_outcome: !!results.trial_outcome,
      has_reference: !!results.reference,
      has_trial_outcome_link: !!results.trial_outcome_link,
      has_treatment_for_adverse_events: !!results.treatment_for_adverse_events,
      has_site_notes: !!results.site_notes,
      current_form_trial_outcome: form.trial_outcome,
      current_form_reference_date: form.trial_outcome_reference_date,
      current_form_link: form.trial_outcome_link,
      current_form_treatment: form.treatment_for_adverse_events,
    });

    // Helper function to format date for CustomDateInput
    const formatDateForInput = (dateStr: string): string => {
      if (!dateStr) return "";
      try {
        // Handle YYYY-MM-DD format (from database)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split('-');
          return `${month}-${day}-${year}`;
        }
        // Handle MM-DD-YYYY format (already formatted)
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
          return dateStr;
        }
        // Try to parse as Date object
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}-${day}-${year}`;
        }
        return dateStr;
      } catch (e) {
        console.warn('Error formatting date for input:', dateStr, e);
        return "";
      }
    };

    // Auto-fill main results fields - force update if API has data and form is empty
    if (results.trial_outcome && (!form.trial_outcome || form.trial_outcome.trim() === "")) {
      console.log("✅ React-Query: Auto-filling trial_outcome:", results.trial_outcome);
      updateField("step5_5", "trial_outcome", results.trial_outcome);
    }

    if (results.reference && (!form.trial_outcome_reference_date || form.trial_outcome_reference_date.trim() === "")) {
      const formattedDate = formatDateForInput(results.reference);
      if (formattedDate) {
        console.log("✅ React-Query: Auto-filling trial_outcome_reference_date:", formattedDate);
        updateField("step5_5", "trial_outcome_reference_date", formattedDate);
      }
    }

    if (results.trial_outcome_link && (!form.trial_outcome_link || form.trial_outcome_link.trim() === "")) {
      console.log("✅ React-Query: Auto-filling trial_outcome_link:", results.trial_outcome_link);
      updateField("step5_5", "trial_outcome_link", results.trial_outcome_link);
    }

    if (results.treatment_for_adverse_events && (!form.treatment_for_adverse_events || form.treatment_for_adverse_events.trim() === "")) {
      console.log("✅ React-Query: Auto-filling treatment_for_adverse_events:", results.treatment_for_adverse_events);
      updateField("step5_5", "treatment_for_adverse_events", results.treatment_for_adverse_events);
    }

    // Auto-fill site_notes (Results Notes) including Result Type
    if (results.site_notes) {
      let siteNotes = results.site_notes;
      // Parse if it's a string
      if (typeof siteNotes === 'string') {
        try {
          siteNotes = JSON.parse(siteNotes);
        } catch (e) {
          console.warn('Failed to parse site_notes:', e);
          siteNotes = [];
        }
      }

      if (Array.isArray(siteNotes) && siteNotes.length > 0) {
        const firstNote = siteNotes[0];
        const currentFirstNote = form.site_notes?.[0];

        // Check if Result Type needs to be filled
        const needsNoteTypeFill = !currentFirstNote?.noteType || currentFirstNote.noteType.trim() === "";
        const hasNoteType = firstNote.noteType || firstNote.type;

        if (needsNoteTypeFill && hasNoteType) {
          console.log("✅ React-Query: Auto-filling Result Type (noteType):", firstNote.noteType || firstNote.type);

          // Ensure we have at least one note in the form
          if (!form.site_notes || form.site_notes.length === 0) {
            addSiteNote("step5_5", "site_notes");
          }

          // Use a small delay to ensure form state is ready
          setTimeout(() => {
            const noteType = firstNote.noteType || firstNote.type;
            updateSiteNote("step5_5", "site_notes", 0, { noteType });

            // Also fill other fields if they're empty
            if (firstNote.date && (!currentFirstNote?.date || currentFirstNote.date.trim() === "")) {
              const formattedDate = formatDateForInput(firstNote.date);
              updateSiteNote("step5_5", "site_notes", 0, { date: formattedDate });
            }
            if (firstNote.content && (!currentFirstNote?.content || currentFirstNote.content.trim() === "")) {
              updateSiteNote("step5_5", "site_notes", 0, { content: firstNote.content });
            }
            if ((firstNote.sourceType || firstNote.source) && (!currentFirstNote?.sourceType || currentFirstNote.sourceType.trim() === "")) {
              updateSiteNote("step5_5", "site_notes", 0, { sourceType: firstNote.sourceType || firstNote.source });
            }
          }, 500);
        }
      }
    }
  }, [trialData, form, isTrialLoading, updateField, updateSiteNote, addSiteNote]);

  const [openOutcome, setOpenOutcome] = useState(false);
  const [openAdverseReported, setOpenAdverseReported] = useState(false);
  const [openAdverseType, setOpenAdverseType] = useState(false);

  console.log("📋 ResultsSection - Current form data:", form);
  console.log("🎯 Key dropdown values:", {
    trial_outcome: form.trial_outcome,
    trial_outcome_reference_date: form.trial_outcome_reference_date,
    trial_outcome_link: form.trial_outcome_link,
    adverse_event_reported: form.adverse_event_reported,
    adverse_event_type: form.adverse_event_type,
    site_notes_count: form.site_notes?.length,
  });

  // Trial Outcome options - fetch from database with fallback
  const { options: trialOutcomeOptions } = useDynamicDropdown({
    categoryName: 'trial_outcome',
    fallbackOptions: [
      { value: "completed_outcome_indeterminate", label: "Completed – Outcome Indeterminate" },
      { value: "completed_outcome_unknown", label: "Completed – Outcome Unknown" },
      { value: "completed_primary_endpoints_met", label: "Completed – Primary Endpoints Met" },
      { value: "completed_primary_endpoints_not_met", label: "Completed – Primary Endpoints Not Met" },
      { value: "terminated_business_other", label: "Terminated - Business Decision, Other" },
      { value: "terminated_business_pipeline_reprioritization", label: "Terminated - Business Decision, Pipeline Reprioritization" },
      { value: "terminated_business_drug_strategy_shift", label: "Terminated – Business Decision, Drug Strategy Shift" },
      { value: "terminated_insufficient_enrolment", label: "Terminated – Insufficient Enrolment" },
      { value: "terminated_lack_of_efficacy", label: "Terminated – Lack Of Efficacy" },
      { value: "terminated_lack_of_funding", label: "Terminated – Lack Of Funding" },
      { value: "terminated_other", label: "Terminated – Other" },
      { value: "terminated_planned_but_never_initiated", label: "Terminated – Planned But Never Initiated" },
      { value: "terminated_safety_adverse_effects", label: "Terminated – Safety/adverse Effects" },
      { value: "terminated_unknown", label: "Terminated – Unknown" },
    ]
  });

  const outcomes = trialOutcomeOptions.map(opt => opt.label);
  const adverseReported = ["Yes", "No"];
  const adverseTypes = ["Mild", "Moderate", "Severe"];

  // Helper function to map trial outcome value to label
  const getTrialOutcomeLabel = (value: string): string => {
    if (!value) return "";
    const option = trialOutcomeOptions.find(opt => opt.value === value || opt.label === value);
    return option ? option.label : value;
  };

  // Helper function to get trial outcome value from label
  const getTrialOutcomeValue = (label: string): string => {
    if (!label) return "";
    const option = trialOutcomeOptions.find(opt => opt.label === label || opt.value === label);
    return option ? option.value : label;
  };

  // Result Type options - fetch from database with fallback
  const { options: resultTypeOptions } = useDynamicDropdown({
    categoryName: 'result_type',
    fallbackOptions: [
      { value: "interim", label: "Interim" },
      { value: "full_results", label: "Full Results" },
      { value: "primary_endpoint_results", label: "Primary Endpoint Results" },
      { value: "analysis", label: "Analysis" },
    ]
  });

  // Helper function to map result type value to label
  const getResultTypeLabel = (value: string): string => {
    if (!value) return "";
    const option = resultTypeOptions.find(opt => opt.value === value || opt.label === value);
    return option ? option.label : value;
  };

  // Helper function to get result type value from label
  const getResultTypeValue = (label: string): string => {
    if (!label) return "";
    const option = resultTypeOptions.find(opt => opt.label === label || opt.value === label);
    return option ? option.value : label;
  };

  const resultTypes = resultTypeOptions.map(opt => opt.label);



  const attachmentDisplayInfo = useMemo(() => {
    console.log("🔍 Calculating attachment display info:", form.trial_outcome_attachment);
    const attachment = form.trial_outcome_attachment as any;

    if (!attachment) {
      return null;
    }

    if (typeof attachment === "string") {
      const trimmed = attachment.trim();
      if (!trimmed) {
        return null;
      }

      const isLikelyUrl = /^https?:\/\//i.test(trimmed);
      if (isLikelyUrl) {
        const segments = trimmed.split("/");
        const name = segments[segments.length - 1] || "Attachment";
        return { url: trimmed, name };
      }

      return { url: null, name: trimmed };
    }

    if (typeof attachment === "object") {
      if (attachment instanceof File) {
        return { url: null, name: attachment.name };
      }

      // Handle legacy objects that might store url/name
      const possibleUrl = (attachment as Record<string, unknown>).url;
      const possibleName = (attachment as Record<string, unknown>).name;

      if (typeof possibleUrl === "string" && possibleUrl) {
        return {
          url: possibleUrl,
          name: typeof possibleName === "string" && possibleName ? possibleName : "Attachment",
        };
      }
    }

    return null;
  }, [form.trial_outcome_attachment]);

  // Helper functions for site notes
  const handleAddSiteNote = () => addSiteNote("step5_5", "site_notes");
  const handleRemoveSiteNote = (index: number) => removeSiteNote("step5_5", "site_notes", index);
  const handleUpdateSiteNote = (index: number, field: string, value: any) => {
    console.log(`Updating site note ${index}, field: ${field}, value:`, value);
    updateSiteNote("step5_5", "site_notes", index, { [field]: value });
  };

  const handleAttachmentUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadingAttachment(true);
      console.log("Uploading main trial outcome attachment:", file.name);

      const res = await edgestore.trialOutcomeAttachments.upload({
        file,
        onProgressChange: (progress) => {
          console.log("Upload progress:", progress);
        },
      });

      console.log("File uploaded successfully:", res.url);

      updateField("step5_5", "trial_outcome_attachment", {
        url: res.url,
        name: file.name,
        size: file.size,
        type: file.type,
      });

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
      setUploadingAttachment(false);
    }
  };

  // Handle file removal
  const handleAttachmentRemove = async () => {
    const attachment = form.trial_outcome_attachment as any;
    const fileUrl = attachment?.url || (typeof attachment === 'string' ? attachment : null);

    // Optimistically update UI first
    updateField("step5_5", "trial_outcome_attachment", null);

    if (fileUrl) {
      try {
        await edgestore.trialOutcomeAttachments.delete({
          url: fileUrl,
        });
        toast({
          title: "Success",
          description: "File removed successfully",
        });
      } catch (error: any) {
        // Handle EdgeStore errors gracefully - file is already removed from form
        const errorMessage = error?.message || String(error) || '';
        const errorString = errorMessage.toLowerCase();

        const isNotFoundError = errorString.includes('404') ||
          errorString.includes('not found') ||
          errorString.includes('does not exist');

        const isServerError = errorString.includes('internal server error') ||
          errorString.includes('500');

        if (isNotFoundError || isServerError) {
          console.warn("EdgeStore deletion issue (file removed from form):", error);
          toast({
            title: "File removed",
            description: "File has been removed from the form.",
          });
        } else {
          console.error("Error removing file:", error);
          toast({
            title: "File removed",
            description: "File has been removed from the form.",
          });
        }
      }
    } else {
      toast({
        title: "File removed",
        description: "File has been removed from the form.",
      });
    }
  };

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

      const currentNote = form.site_notes[noteIndex];
      const currentAttachments = currentNote?.attachments || [];
      const newAttachment = {
        url: res.url,
        name: file.name,
        size: file.size,
        type: file.type,
      };

      handleUpdateSiteNote(noteIndex, "attachments", [...currentAttachments, newAttachment]);

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

  const handleRemoveNoteAttachment = async (noteIndex: number, attachmentIndex: number) => {
    const currentNote = form.site_notes[noteIndex];
    const attachment = currentNote?.attachments[attachmentIndex];

    if (attachment && typeof attachment === 'object' && 'url' in attachment) {
      const fileUrl = attachment.url;
      const updatedAttachments = currentNote.attachments.filter((_: any, i: number) => i !== attachmentIndex);
      handleUpdateSiteNote(noteIndex, "attachments", updatedAttachments);

      try {
        await edgestore.trialOutcomeAttachments.delete({ url: fileUrl });
      } catch (error) {
        console.warn("Edge Store deletion error:", error);
      }
    } else {
      const updatedAttachments = currentNote.attachments.filter((_: any, i: number) => i !== attachmentIndex);
      handleUpdateSiteNote(noteIndex, "attachments", updatedAttachments);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Label>Results Available</Label>
          <Switch
            checked={form.results_available || false}
            onCheckedChange={(val) => updateField("step5_5", "results_available", val)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label>Endpoints met</Label>
          <Switch
            checked={form.endpoints_met || false}
            onCheckedChange={(val) => updateField("step5_5", "endpoints_met", val)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label>Adverse Events Reported</Label>
          <Switch
            checked={form.adverse_events_reported || false}
            onCheckedChange={(val) => updateField("step5_5", "adverse_events_reported", val)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Trial Outcome</Label>
          <Popover open={openOutcome} onOpenChange={setOpenOutcome}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              >
                {getTrialOutcomeLabel(form.trial_outcome || "") || "Select outcome"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search outcome..." />
                <CommandEmpty>No outcome found.</CommandEmpty>
                <CommandGroup>
                  {outcomes.map((outcome) => (
                    <CommandItem
                      key={outcome}
                      value={outcome}
                      onSelect={() => {
                        const value = getTrialOutcomeValue(outcome);
                        updateField("step5_5", "trial_outcome", value);
                        setOpenOutcome(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          getTrialOutcomeLabel(form.trial_outcome || "") === outcome ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {outcome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 border rounded-md p-2">
          <Label>Trial Outcome Reference</Label>
          <div className="w-1/2">
            <CustomDateInput
              value={form.trial_outcome_reference_date || ""}
              onChange={(value) => updateField("step5_5", "trial_outcome_reference_date", value)}
              placeholder="Select date"
              className="w-full border-gray-600 focus:border-gray-800 focus:ring-gray-800"
            />
          </div>

          {/* Trial Outcome Results Content */}
          <div className="space-y-2">
            <Label>Trial Outcome Results Content</Label>
            <Textarea
              rows={3}
              placeholder="Enter trial outcome results content here..."
              value={form.trial_outcome_content || ""}
              onChange={(e) => updateField("step5_5", "trial_outcome_content", e.target.value)}
              className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
            />
          </div>

          {/* Link Row */}
          <div className="space-y-2 mt-2">
            <Label>Link</Label>
            <div className="flex items-center gap-2">
              <Input
                type="url"
                placeholder="Enter link"
                value={form.trial_outcome_link || ""}
                onChange={(e) => updateField("step5_5", "trial_outcome_link", e.target.value)}
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
              <Button type="button" variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Attachments Row */}
          <div className="space-y-2 mt-2">
            <Label>Attachments</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.zip,.rar"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleAttachmentUpload(file);
                    e.target.value = '';
                  }
                }}
                disabled={uploadingAttachment}
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 flex-1"
              />
              <Button type="button" variant="outline" size="icon" disabled={uploadingAttachment}>
                {uploadingAttachment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
              {attachmentDisplayInfo && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAttachmentRemove}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {attachmentDisplayInfo && (
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md">
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {attachmentDisplayInfo.name}
                </span>
                {attachmentDisplayInfo.url ? (
                  <PreviewLink
                    href={attachmentDisplayInfo.url}
                    title={attachmentDisplayInfo.name}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap"
                  >
                    <LinkIcon className="h-3 w-3" />
                    View
                  </PreviewLink>
                ) : (
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    Preview unavailable
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Site Notes / Results Notes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Results Notes</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSiteNote}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </div>

        <div className="space-y-4">
          {(form.site_notes || []).map((note: any, index: number) => (
            <Card key={note.id} className={`border border-gray-200 ${!note.isVisible ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
              <CardContent className="p-6 space-y-4">
                {/* Site Note Header */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Result {index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSiteNoteVisibility("step5_5", "site_notes", index)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {note.isVisible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    {(form.site_notes || []).length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSiteNote(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Site Note Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor={`site-note-date-${index}`}>Date</Label>
                    <div className="w-1/2">
                      <CustomDateInput
                        value={note.date || ""}
                        onChange={(value) => handleUpdateSiteNote(index, "date", value)}
                        placeholder="Select date"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Note Type */}
                  <div className="space-y-2">
                    <Label htmlFor={`site-note-type-${index}`}>Result type</Label>
                    <Select
                      value={getResultTypeLabel(note.noteType || "")}
                      onValueChange={(label) => {
                        const value = getResultTypeValue(label);
                        handleUpdateSiteNote(index, "noteType", value);
                      }}
                    >
                      <SelectTrigger className="border-gray-600 focus:border-gray-800 focus:ring-gray-800">
                        <SelectValue placeholder="Select result type" />
                      </SelectTrigger>
                      <SelectContent>
                        {resultTypes.map((type) => (
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
                  <Label htmlFor={`site-note-content-${index}`}>Content</Label>
                  <Textarea
                    rows={3}
                    placeholder="Enter result note content..."
                    value={note.content || ""}
                    onChange={(e) => handleUpdateSiteNote(index, "content", e.target.value)}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                </div>

                {/* Source Link */}
                <div className="space-y-2">
                  <Label htmlFor={`site-note-source-link-${index}`}>Source Link</Label>
                  <Input
                    type="url"
                    placeholder="Enter source URL..."
                    value={note.sourceLink || ""}
                    onChange={(e) => handleUpdateSiteNote(index, "sourceLink", e.target.value)}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Input
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
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  <Button type="button" variant="outline" size="icon" disabled={uploadingNoteAttachment[index]}>
                    {uploadingNoteAttachment[index] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {note.attachments && note.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {note.attachments.map((attachment: any, attachIndex: number) => {
                      // Handle both string and object attachments
                      const attachmentName = typeof attachment === 'string'
                        ? attachment
                        : (attachment?.name || attachment?.url || `Attachment ${attachIndex + 1}`);
                      const attachmentUrl = typeof attachment === 'string'
                        ? (attachment.startsWith('http') ? attachment : '#')
                        : (attachment?.url || '#');

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
                          {attachmentUrl !== '#' ? (
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate max-w-[200px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              title={attachmentName}
                            >
                              {attachmentName}
                            </a>
                          ) : (
                            <span className="truncate max-w-[200px]">{attachmentName}</span>
                          )}
                          {attachmentUrl !== '#' && (
                            <PreviewLink
                              href={attachmentUrl}
                              title={attachmentName}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 whitespace-nowrap"
                            >
                              <LinkIcon className="h-3 w-3" />
                              View
                            </PreviewLink>
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Adverse Event */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Adverse Event Reported */}
        <div className="space-y-2">
          <Label>Adverse Event Reported</Label>
          <Popover open={openAdverseReported} onOpenChange={setOpenAdverseReported}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              >
                {form.adverse_event_reported || "Select option"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search option..." />
                <CommandEmpty>No option found.</CommandEmpty>
                <CommandGroup>
                  {adverseReported.map((opt) => (
                    <CommandItem
                      key={opt}
                      value={opt}
                      onSelect={() => {
                        updateField("step5_5", "adverse_event_reported", opt);
                        setOpenAdverseReported(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          form.adverse_event_reported === opt ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {opt}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Adverse Event Type */}
        <div className="space-y-2">
          <Label>Adverse Event Type</Label>
          <Popover open={openAdverseType} onOpenChange={setOpenAdverseType}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              >
                {form.adverse_event_type || "Select type"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search type..." />
                <CommandEmpty>No type found.</CommandEmpty>
                <CommandGroup>
                  {adverseTypes.map((type) => (
                    <CommandItem
                      key={type}
                      value={type}
                      onSelect={() => {
                        updateField("step5_5", "adverse_event_type", type);
                        setOpenAdverseType(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          form.adverse_event_type === type ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {type}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Treatment For Adverse Events */}
      <div className="space-y-2">
        <Label>Treatment For Adverse Events</Label>
        <Textarea
          rows={3}
          placeholder="Describe treatments for adverse events..."
          value={form.treatment_for_adverse_events || ""}
          onChange={(e) => updateField("step5_5", "treatment_for_adverse_events", e.target.value)}
          className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
        />
      </div>
    </div>
  );
}
