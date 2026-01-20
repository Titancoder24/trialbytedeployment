"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Eye, EyeOff, Upload, FileText, Image, Link as LinkIcon, Loader2 } from "lucide-react";
import CustomDateInput from "@/components/ui/custom-date-input";
import { useEditTherapeuticForm } from "../../../context/edit-form-context";
import { useToast } from "@/hooks/use-toast";
import { useEdgeStore } from "@/lib/edgestore";
import { useState } from "react";

export default function SitesSection() {
  const {
    formData,
    updateField,
    addReference,
    removeReference,
    updateReference,
  } = useEditTherapeuticForm();
  const { toast } = useToast();
  const { edgestore } = useEdgeStore();
  const [uploadingNoteAttachment, setUploadingNoteAttachment] = useState<{ [key: number]: boolean }>({});
  const form = formData.step5_6;

  console.log("📋 SitesSection (Edit) - Current form data:", form);
  console.log("🎯 Key Sites values:", {
    study_start_date: form.study_start_date,
    references_count: form.references?.length,
    references: form.references,
  });
  
  // Log each reference individually with detailed attachment info
  if (form.references && form.references.length > 0) {
    form.references.forEach((ref: any, index: number) => {
      console.log(`  Reference ${index}:`, {
        id: ref.id,
        date: ref.date,
        registryType: ref.registryType,
        content: ref.content?.substring(0, 50),
        viewSource: ref.viewSource,
        attachments: ref.attachments,
        attachments_count: ref.attachments?.length || 0,
        attachments_type: typeof ref.attachments,
        attachments_isArray: Array.isArray(ref.attachments),
        isVisible: ref.isVisible,
      });
      if (ref.attachments && ref.attachments.length > 0) {
        ref.attachments.forEach((att: any, attIdx: number) => {
          console.log(`    Attachment ${attIdx}:`, {
            raw: att,
            type: typeof att,
            name: typeof att === 'object' ? att.name : att,
            url: typeof att === 'object' ? att.url : null,
          });
        });
      }
    });
  }

  // Registry type options (same as in Timings)
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
  const handleAddReference = () => {
    console.log("Adding reference to step5_6");
    addReference("step5_6", "references");
  };
  
  const handleRemoveReference = (index: number) => {
    console.log("Removing reference from step5_6:", index);
    removeReference("step5_6", "references", index);
  };
  
  const handleUpdateReference = (index: number, field: string, value: any) => {
    console.log(`Updating reference ${index}, field: ${field}`, value);
    updateReference("step5_6", "references", index, { [field]: value });
  };

  const getAttachmentDisplayMeta = (attachment: any) => {
    console.log("🧾 Building attachment display meta:", attachment);

    const defaultMeta = {
      name: "Attachment",
      url: "",
      isImage: false,
    };

    if (!attachment) {
      return defaultMeta;
    }

    const extractNameFromUrl = (rawUrl: string) => {
      try {
        const parsedUrl = new URL(rawUrl);
        const segments = parsedUrl.pathname.split("/").filter(Boolean);
        return decodeURIComponent(segments.pop() || "Attachment");
      } catch {
        const segments = rawUrl.split("/").filter(Boolean);
        return decodeURIComponent(segments.pop() || "Attachment");
      }
    };

    if (typeof attachment === "string") {
      const trimmed = attachment.trim();
      if (!trimmed) {
        return defaultMeta;
      }

      const isUrl = /^https?:\/\//i.test(trimmed);
      const name = isUrl ? extractNameFromUrl(trimmed) : trimmed;
      const url = isUrl ? trimmed : "";
      const isImage = /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name) || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(url);

      return {
        name,
        url,
        isImage,
      };
    }

    if (typeof attachment === "object") {
      const possibleUrl =
        typeof attachment.url === "string"
          ? attachment.url
          : typeof attachment.href === "string"
          ? attachment.href
          : typeof attachment.link === "string"
          ? attachment.link
          : "";
      const name =
        typeof attachment.name === "string" && attachment.name
          ? attachment.name
          : possibleUrl
          ? extractNameFromUrl(possibleUrl)
          : "Attachment";

      const isImage =
        /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name) ||
        (possibleUrl ? /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(possibleUrl) : false);

      return {
        name,
        url: possibleUrl,
        isImage,
      };
    }

    return defaultMeta;
  };

  // Handle file upload for note attachments using Edge Store
  const handleNoteAttachmentUpload = async (file: File, noteIndex: number) => {
    if (!file) return;

    try {
      setUploadingNoteAttachment(prev => ({ ...prev, [noteIndex]: true }));
      console.log(`Uploading file to Edge Store for site note ${noteIndex}:`, file.name);

      const res = await edgestore.trialOutcomeAttachments.upload({
        file,
        onProgressChange: (progress) => {
          console.log(`Upload progress for site note ${noteIndex}:`, progress);
        },
      });

      console.log("File uploaded successfully:", res.url);

      // Get current attachments and add the new one
      const currentNote = form.references[noteIndex];
      const currentAttachments = currentNote?.attachments || [];
      const newAttachment = {
        url: res.url,
        name: file.name,
        size: file.size,
        type: file.type,
      };

      handleUpdateReference(noteIndex, "attachments", [...currentAttachments, newAttachment]);

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
    const currentNote = form.references[noteIndex];
    const attachment = currentNote?.attachments[attachmentIndex];

    // Check if attachment is an object with a url property
    if (attachment && typeof attachment === 'object' && 'url' in attachment) {
      const fileUrl = attachment.url;
      
      // Optimistically update UI first
      const updatedAttachments = currentNote.attachments.filter((_: any, i: number) => i !== attachmentIndex);
      handleUpdateReference(noteIndex, "attachments", updatedAttachments);

      try {
        await edgestore.trialOutcomeAttachments.delete({
          url: fileUrl?.trim() || '',
        });

        toast({
          title: "Success",
          description: "File removed successfully",
        });
      } catch (error: any) {
        console.error("Error removing file from Edge Store:", error);
        
        const errorMessage = error?.message || String(error) || '';
        const errorString = errorMessage.toLowerCase();
        
        const isNotFoundError = errorString.includes('404') || 
                               errorString.includes('not found') || 
                               errorString.includes('does not exist') ||
                               errorString.includes('no such key');
        
        const isServerError = errorString.includes('internal server error') ||
                             errorString.includes('500') ||
                             errorString.includes('server error');
        
        if (isNotFoundError || isServerError) {
          // Already removed from UI, silently succeed
          return;
        } else {
          console.warn("Edge Store deletion error (file removed from form):", error);
          toast({
            title: "File removed",
            description: "File has been removed from the form.",
          });
        }
      }
    } else {
      // If it's just a string (old format), just remove it from the array
      const updatedAttachments = currentNote.attachments.filter((_: any, i: number) => i !== attachmentIndex);
      handleUpdateReference(noteIndex, "attachments", updatedAttachments);
    }
  };

  return (
    <div className="space-y-6">
      {/* Total No of Sites */}
      <div className="space-y-2">
        <Label>Total No of Sites</Label>
        <Input
          type="number"
          min="1"
          max="10000"
          value={form.total_sites || ""}
          onChange={(e) => updateField("step5_6", "total_sites", e.target.value)}
          className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 w-32"
        />
      </div>

      {/* References/Notes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Notes</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddReference}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </div>
        
        <div className="space-y-6">
          {(form.references || []).map((reference: any, index: number) => (
            <Card key={reference.id} className="border border-gray-200">
              <CardContent className="p-6 space-y-4">
                {/* Reference Header */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Site Info {index + 1}</h4>
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
                      value={reference.date || ""}
                      onChange={(value) => handleUpdateReference(index, "date", value)}
                      placeholder="Select date"
                      className="w-full"
                    />
                  </div>

                  {/* Registry Type */}
                  <div className="space-y-2">
                    <Label htmlFor={`ref-registry-${index}`}>Registry Type</Label>
                    <Select
                      value={reference.registryType || ""}
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
                    placeholder="Enter note content here..."
                    value={reference.content || ""}
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
                    value={reference.viewSource || ""}
                    onChange={(e) => handleUpdateReference(index, "viewSource", e.target.value)}
                    className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <Label htmlFor={`ref-attachments-${index}`}>Attachments</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`ref-attachments-${index}`}
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
                      className="flex-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
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
                  
                  {/* Display uploaded files */}
                  {(() => {
                    let attachments = reference.attachments;
                    
                    // Normalize attachments if needed
                    if (!attachments) {
                      return false;
                    }
                    
                    // If it's a string, try to parse it or convert to array
                    if (typeof attachments === 'string') {
                      const trimmed = attachments.trim();
                      if (!trimmed) {
                        return false;
                      }
                      // Try to parse as JSON
                      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                        try {
                          attachments = JSON.parse(trimmed);
                        } catch {
                          attachments = [trimmed];
                        }
                      } else {
                        attachments = [trimmed];
                      }
                    }
                    
                    // Ensure it's an array
                    if (!Array.isArray(attachments)) {
                      attachments = [attachments];
                    }
                    
                    // Filter out null/undefined/empty items
                    attachments = attachments.filter((att: any) => att !== null && att !== undefined && att !== '');
                    
                    const hasAttachments = attachments.length > 0;
                    console.log(`🔍 Checking attachments for reference ${index}:`, {
                      original: reference.attachments,
                      normalized: attachments,
                      hasAttachments,
                      count: attachments.length
                    });
                    
                    // Store normalized attachments for rendering
                    (reference as any)._normalizedAttachments = attachments;
                    
                    return hasAttachments;
                  })() && (
                    <div className="mt-2 space-y-1">
                      {((reference as any)._normalizedAttachments || reference.attachments || []).map((attachment: any, attIndex: number) => {
                        console.log(`📎 Displaying attachment ${attIndex} for reference ${index}:`, attachment);
                        const fileName = typeof attachment === 'string' 
                          ? attachment 
                          : (attachment?.name || 'Attachment');
                        const fileUrl = typeof attachment === 'string'
                          ? (attachment.startsWith('http') ? attachment : null)
                          : (attachment?.url || null);
                        const isImage = fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);

                        console.log(`📎 Processed attachment ${attIndex}:`, { fileName, fileUrl, isImage });

                        return (
                          <div key={attIndex} className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                            {isImage ? (
                              <Image className="h-4 w-4 text-blue-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-600" />
                            )}
                            <span className="flex-1 truncate">{fileName}</span>
                            {fileUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  window.open(fileUrl, '_blank');
                                }}
                                className="text-blue-600 hover:text-blue-800 p-0 h-auto text-xs"
                              >
                                View
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveNoteAttachment(index, attIndex)}
                              className="text-red-500 hover:text-red-700 p-0 h-auto"
                            >
                              <X className="h-3 w-3" />
                            </Button>
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
    </div>
  );
}
