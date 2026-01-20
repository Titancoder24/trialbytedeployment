"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useTherapeuticForm } from "../../context/therapeutic-form-context";
import { formatDateTimeToMMDDYYYY } from "@/lib/date-utils";
import NotesSection from "@/components/notes-section";
import CustomDateInput from "@/components/ui/custom-date-input";

import { Upload, X, Image, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEdgeStore } from "@/lib/edgestore";

export default function ReviewNotesSection() {
  const {
    formData,
    updateField,
    addNote,
    updateNote,
    removeNote,
  } = useTherapeuticForm();
  const { toast } = useToast();
  const { edgestore } = useEdgeStore();
  const [uploadingFile, setUploadingFile] = useState(false);
  const form = formData.step5_8;

  const calculateNextReviewDate = (): string => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 90);
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');
    const year = futureDate.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const handleFullReviewChange = (checked: boolean) => {
    updateField("step5_8", "fullReview", checked);
    if (checked) {
      updateField("step5_8", "fullReviewUser", "admin");
      updateField("step5_8", "nextReviewDate", calculateNextReviewDate());
    } else {
      updateField("step5_8", "fullReviewUser", "");
      updateField("step5_8", "nextReviewDate", "");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadingFile(true);
      console.log('Uploading file to Edge Store for Logs:', file.name);

      const res = await edgestore.trialOutcomeAttachments.upload({
        file,
        onProgressChange: (progress) => {
          console.log('Upload progress for Logs:', progress);
        },
      });

      console.log('File uploaded successfully:', res.url);

      // Add the attachment to the logsAttachments array
      const currentAttachments = form.logsAttachments || [];
      const newAttachment = {
        name: file.name,
        fileUrl: res.url,
        type: file.type || 'application/octet-stream'
      };

      updateField("step5_8", "logsAttachments", [...currentAttachments, newAttachment]);

      toast({
        title: "Success",
        description: "File uploaded successfully!",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileRemove = async (index: number, fileUrl: string) => {
    if (!fileUrl) {
      const currentAttachments = form.logsAttachments || [];
      const updatedAttachments = currentAttachments.filter((_, i) => i !== index);
      updateField("step5_8", "logsAttachments", updatedAttachments);
      return;
    }

    // Optimistically update UI first
    const currentAttachments = form.logsAttachments || [];
    const updatedAttachments = currentAttachments.filter((_, i) => i !== index);
    updateField("step5_8", "logsAttachments", updatedAttachments);

    try {
      await edgestore.trialOutcomeAttachments.delete({
        url: fileUrl.trim(),
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
  };

  return (
    <div className="space-y-6">
      {/* Trial Creation & Modification Info */}
      <Card className="border rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-700">Trial Creation</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Created Date:</span>
                  <span className="text-gray-600">
                    {form.creationInfo?.createdDate
                      ? formatDateTimeToMMDDYYYY(form.creationInfo.createdDate)
                      : 'Not available'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Created User:</span>
                  <span className="text-gray-600">{form.creationInfo?.createdUser || 'admin'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-700">Last Modification</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Last Modified Date:</span>
                  <span className="text-gray-600">
                    {form.modificationInfo?.lastModifiedDate
                      ? formatDateTimeToMMDDYYYY(form.modificationInfo.lastModifiedDate)
                      : 'Not available'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Last Modified User:</span>
                  <span className="text-gray-600">{form.modificationInfo?.lastModifiedUser || 'admin'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Total Modifications:</span>
                  <span className="text-gray-600">{form.modificationInfo?.modificationCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Internal Note */}
      <Card className="border rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Logs</Label>
            <div className="space-y-2">
              <Label htmlFor="internalNote" className="text-sm font-medium text-gray-700">
                Internal Note
              </Label>
              <Textarea
                id="internalNote"
                rows={4}
                placeholder="Enter internal note..."
                value={form.internalNote || ""}
                onChange={(e) => updateField("step5_8", "internalNote", e.target.value)}
                className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
              />
            </div>

            {/* Attachments Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Attachments</Label>
              <div className="space-y-3">
                {/* Display uploaded files */}
                {form.logsAttachments && form.logsAttachments.length > 0 && (
                  <div className="space-y-2">
                    {form.logsAttachments.map((attachment: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                        {attachment.type?.startsWith('image/') || attachment.name?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ? (
                          <Image className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="flex-1">{attachment.name || 'Attachment'}</span>
                        {(attachment.fileUrl || attachment.url) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              window.open(attachment.fileUrl || attachment.url, '_blank');
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
                          onClick={() => handleFileRemove(index, attachment.fileUrl || attachment.url)}
                          className="text-red-500 hover:text-red-700 p-0 h-auto"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload File Section */}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.zip,.rar"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                        e.target.value = '';
                      }
                    }}
                    disabled={uploadingFile}
                    className="flex-1 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={uploadingFile}
                    className="bg-[#204B73] hover:bg-[#204B73]/90 text-white"
                  >
                    {uploadingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review and Notes Section */}
      <Card className="border rounded-xl shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-2">
              <Checkbox
                id="fullReview"
                checked={form.fullReview || false}
                onCheckedChange={handleFullReviewChange}
              />
              <Label htmlFor="fullReview">Full Review</Label>
            </div>
            <div className="space-y-2">
              <Label>Full Review User</Label>
              <Input
                placeholder="User name"
                value={form.fullReviewUser || ""}
                onChange={(e) => updateField("step5_8", "fullReviewUser", e.target.value)}
                readOnly={form.fullReview}
                className={`border-gray-600 ${form.fullReview ? 'bg-gray-50' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Next Review Date</Label>
              <CustomDateInput
                placeholder="Month Day Year"
                value={form.nextReviewDate || ""}
                onChange={(value) => updateField("step5_8", "nextReviewDate", value)}
                readOnly={form.fullReview}
                className={`border-gray-600 ${form.fullReview ? 'bg-gray-50' : ''}`}
              />
            </div>
          </div>

          <NotesSection
            title="Notes & Documentation"
            notes={(form.notes || []).map(note => {
              let content = "";
              if (typeof note.content === 'string') {
                content = note.content;
              } else if (note.content && typeof note.content === 'object') {
                const noteContent = note.content as any;
                content = noteContent.text || noteContent.content || JSON.stringify(note.content);
              } else {
                content = String(note.content || "");
              }

              return {
                id: note.id,
                date: String(note.date || ""),
                type: String(note.type || "General"),
                content: content,
                sourceLink: String(note.sourceLink || ""),
                sourceType: String(note.sourceType || ""),
                sourceUrl: String(note.sourceUrl || ""),
                attachments: Array.isArray(note.attachments) ? note.attachments : [],
                isVisible: note.isVisible !== false
              };
            })}
            onAddNote={() => addNote("step5_8", "notes")}
            onUpdateNote={(index, updatedNote) => {
              updateNote("step5_8", "notes", index, updatedNote);
            }}
            onRemoveNote={(index) => removeNote("step5_8", "notes", index)}
            onToggleVisibility={(index) => {
              const currentNote = form.notes[index];
              updateNote("step5_8", "notes", index, { isVisible: !currentNote.isVisible });
            }}
            noteTypes={[
              "General",
              "Clinical",
              "Regulatory",
              "Safety",
              "Efficacy",
              "Protocol",
              "Site",
              "Patient",
              "Adverse Event",
              "Publication",
              "Press Release",
              "Other"
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
