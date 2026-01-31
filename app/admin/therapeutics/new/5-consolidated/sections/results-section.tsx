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
import { Plus, X, Check, ChevronsUpDown, Eye, EyeOff, Upload, Loader2 } from "lucide-react";
import CustomDateInput from "@/components/ui/custom-date-input";
import { useTherapeuticForm } from "../../context/therapeutic-form-context";
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useEdgeStore } from "@/lib/edgestore";
import { useToast } from "@/hooks/use-toast";

export default function ResultsSection() {
  const {
    formData,
    updateField,
    addSiteNote,
    updateSiteNote,
    removeSiteNote,
    toggleSiteNoteVisibility,
  } = useTherapeuticForm();
  const form = formData.step5_5;
  const [openOutcome, setOpenOutcome] = useState(false);
  const [openAdverseReported, setOpenAdverseReported] = useState(false);
  const [openAdverseType, setOpenAdverseType] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadingNoteAttachment, setUploadingNoteAttachment] = useState<{ [key: number]: boolean }>({});
  const { edgestore } = useEdgeStore();
  const { toast } = useToast();

  console.log("ResultsSection (New Trial) - Current form data:", form);

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

  const resultTypes = resultTypeOptions.map(opt => opt.label);



  // Handle file upload for trial outcome attachment
  const handleAttachmentUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadingAttachment(true);

      const res = await edgestore.trialOutcomeAttachments.upload({
        file,
        options: {
          replaceTargetUrl: form.trial_outcome_attachment?.url || undefined,
        },
        onProgressChange: (progress) => {
          console.log("Upload progress:", progress);
        },
      });

      console.log("File uploaded successfully:", res.url);

      // Store the URL and file info in form data
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
    if (form.trial_outcome_attachment?.url) {
      const fileUrl = form.trial_outcome_attachment.url;

      // Optimistically update UI first for better UX
      updateField("step5_5", "trial_outcome_attachment", null);

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
          // File may not exist on EdgeStore or server error - that's fine, we already removed from UI
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
    }
  };

  // Handle file upload for note attachments
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

  // Handle removing a specific attachment from a note
  const handleRemoveNoteAttachment = async (noteIndex: number, attachmentIndex: number) => {
    const currentNote = form.site_notes[noteIndex];
    const attachment = currentNote?.attachments[attachmentIndex];

    // Optimistically update UI first
    const updatedAttachments = currentNote.attachments.filter((_: any, i: number) => i !== attachmentIndex);
    handleUpdateSiteNote(noteIndex, "attachments", updatedAttachments);

    if (attachment && typeof attachment === "object" && "url" in attachment && (attachment as any).url) {
      const fileUrl = (attachment as any).url;

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
    }
  };

  // Helper functions for site notes
  const handleAddSiteNote = () => addSiteNote("step5_5", "site_notes");
  const handleRemoveSiteNote = (index: number) => removeSiteNote("step5_5", "site_notes", index);
  const handleUpdateSiteNote = (index: number, field: string, value: any) => {
    console.log(`Updating site note ${index}, field: ${field}, value:`, value);
    console.log(`Current note before update:`, form.site_notes[index]);
    updateSiteNote("step5_5", "site_notes", index, { [field]: value });
    // Log after a short delay to see if the update took effect
    setTimeout(() => {
      console.log(`Current note after update:`, form.site_notes[index]);
    }, 100);
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
                {form.trial_outcome || "Select outcome"}
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
                        updateField("step5_5", "trial_outcome", outcome);
                        setOpenOutcome(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          form.trial_outcome === outcome ? "opacity-100" : "opacity-0"
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
                  }
                }}
                disabled={uploadingAttachment}
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={uploadingAttachment}
              >
                {uploadingAttachment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
              {form.trial_outcome_attachment?.url && (
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
            {form.trial_outcome_attachment?.url && (
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md">
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {form.trial_outcome_attachment.name || "Uploaded file"}
                </span>
                <a
                  href={form.trial_outcome_attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View
                </a>
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
            className="flex items-center gap-1"
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
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hidden
                        </>
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
                      value={note.noteType || ""}
                      onValueChange={(value) => handleUpdateSiteNote(index, "noteType", value)}
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

                {/* View Source */}
                <div className="space-y-2">
                  <Label htmlFor={`site-note-source-${index}`}>Source</Label>
                  <Input
                    id={`site-note-source-${index}`}
                    type="url"
                    placeholder="Enter source link"
                    value={note.viewSource || note.source || ""}
                    onChange={(e) => handleUpdateSiteNote(index, "viewSource", e.target.value)}
                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <Label htmlFor={`site-note-attachments-${index}`}>Attachments</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`site-note-attachments-${index}`}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.zip,.rar"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleNoteAttachmentUpload(file, index);
                          // Reset input
                          e.target.value = '';
                        }
                      }}
                      disabled={uploadingNoteAttachment[index]}
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 flex-1"
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
                  {note.attachments && note.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.attachments.map((attachment: any, attachIndex: number) => {
                        const fileName = typeof attachment === 'string' ? attachment : attachment.name;
                        const fileUrl = typeof attachment === 'object' ? attachment.url : null;

                        return (
                          <div
                            key={attachIndex}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm"
                          >
                            {fileUrl ? (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate max-w-[200px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                title={fileName}
                              >
                                {fileName}
                              </a>
                            ) : (
                              <span className="truncate max-w-[200px]">{fileName}</span>
                            )}
                            {fileUrl && (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                View
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveNoteAttachment(index, attachIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
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
