"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Eye, EyeOff, Upload, FileText, Image } from "lucide-react";
import CustomDateInput from "@/components/ui/custom-date-input";
import { useEditTherapeuticForm } from "../../context/edit-form-context";
import FormProgress from "../../components/form-progress";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";

export default function EditTherapeuticsStep5_6() {
  const {
    formData,
    updateField,
    addReference,
    removeReference,
    updateReference,
    saveTrial,
    isLoading,
    isSaving,
  } = useEditTherapeuticForm();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const [isSavingStep, setIsSavingStep] = useState(false);
  const form = formData.step5_6;
  
  // Use separate references for step5_6 (Sites/Timeline)
  const referencesForm = formData.step5_6;
  
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
  const handleAddReference = () => addReference("step5_6", "references");
  const handleRemoveReference = (index: number) => removeReference("step5_6", "references", index);
  const handleUpdateReference = (index: number, field: string, value: any) => {
    updateReference("step5_6", "references", index, { [field]: value });
  };
  
  // Handle file upload for attachments
  const handleFileUpload = (index: number, files: FileList | null) => {
    if (files) {
      const fileData = Array.from(files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        lastModified: file.lastModified
      }));
      
      const currentAttachments = referencesForm.references[index]?.attachments || [];
      handleUpdateReference(index, "attachments", [...currentAttachments, ...fileData]);
      
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) uploaded successfully`,
      });
    }
  };

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
      <FormProgress currentStep={6} />

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
          {/* Total No of Sites */}
          <div className="space-y-2 mt-4">
            <Label>Total No of Sites</Label>
                <Input
              type="number"
              value={form.study_start_date || ""}
              onChange={(e) =>
                updateField("step5_6", "study_start_date", e.target.value)
              }
              className="border-gray-600 focus:border-gray-800 focus:ring-gray-800 w-32"
            />
            </div>

          {/* References Section (Shared with Timings) */}
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
              {referencesForm.references.map((reference, index) => (
                <Card key={reference.id} className="border border-gray-200">
                  <CardContent className="p-6 space-y-4">
                    {/* Reference Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Reference {index + 1}</h4>
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
                        {referencesForm.references.length > 1 && (
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
                          value={reference.date}
                          onChange={(value) => handleUpdateReference(index, "date", value)}
                          placeholder="Select date"
                          className="w-full"
                        />
                      </div>

                      {/* Registry Type */}
                      <div className="space-y-2">
                        <Label htmlFor={`ref-registry-${index}`}>Registry Type</Label>
                        <Select
                          value={reference.registryType}
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
                        placeholder="Enter reference content here..."
                        value={reference.content}
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
                        value={reference.viewSource}
                        onChange={(e) => handleUpdateReference(index, "viewSource", e.target.value)}
                        className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>

                    {/* Attachments */}
                    <div className="space-y-2">
                      <Label htmlFor={`ref-attachments-${index}`}>Attachments</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id={`ref-attachments-${index}`}
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                          onChange={(e) => handleFileUpload(index, e.target.files)}
                          className="flex-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </Button>
                      </div>
                      
                      {/* Display uploaded files */}
                      {reference.attachments && reference.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {reference.attachments.map((attachment, attIndex) => {
                            const fileName = typeof attachment === 'string' ? attachment : (attachment as any).name;
                            const fileUrl = typeof attachment === 'object' ? (attachment as any).url : null;
                            const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
                            
                            return (
                              <div key={attIndex} className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                                {isImage ? (
                                  <Image className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <FileText className="h-4 w-4 text-gray-600" />
                                )}
                                <span className="flex-1">{fileName}</span>
                                {fileUrl && isImage && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      window.open(fileUrl, '_blank');
                                    }}
                                    className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                                  >
                                    Preview
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updatedAttachments = reference.attachments.filter((_, i) => i !== attIndex);
                                    handleUpdateReference(index, "attachments", updatedAttachments);
                                  }}
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

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="ghost" asChild>
              <Link href={`/admin/therapeutics/edit/${params.id}/5-5`}>Previous</Link>
                  </Button>
            <Button asChild className="px-8 bg-[#204B73] text-white">
              <Link href={`/admin/therapeutics/edit/${params.id}/5-7`}>Next</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}