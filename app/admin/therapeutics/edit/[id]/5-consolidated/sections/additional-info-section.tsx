"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Plus, X, Eye, EyeOff, Upload, Link as LinkIcon, Image, FileText, Loader2 } from "lucide-react";
import CustomDateInput from "@/components/ui/custom-date-input";
import { useEditTherapeuticForm } from "../../../context/edit-form-context";
import { useToast } from "@/hooks/use-toast";
import { useEdgeStore } from "@/lib/edgestore";

export default function AdditionalInfoSection() {
  const {
    formData,
    updateComplexArrayItem,
    addComplexArrayItem,
    removeArrayItem,
    toggleArrayItemVisibility,
  } = useEditTherapeuticForm();
  const { toast } = useToast();
  const { edgestore } = useEdgeStore();
  const [activeTab, setActiveTab] = useState("pipeline_data");
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const form = formData.step5_7;

  console.log("📋 AdditionalInfoSection (Edit) - Current form data:", form);
  console.log("🎯 Active tab:", activeTab, "Items:", ((form as any)[activeTab] || []).length);

  // Debug logging for description fields
  if (form) {
    const debugItems = (form as any)[activeTab] || [];
    debugItems.forEach((item: any, idx: number) => {
      console.log(`📝 ${activeTab} item ${idx}:`, {
        id: item.id,
        description: item.description,
        title: item.title || item.information || item.registry || item.type,
        hasDescription: !!item.description,
        descriptionLength: item.description?.length || 0
      });
    });
  }

  const getAttachmentMeta = (fileValue: any, urlValue: any) => {
    console.log("🧾 Building Other Sources attachment meta:", { fileValue, urlValue });

    const deriveNameFromUrl = (rawUrl: string) => {
      if (!rawUrl) return "Attachment";
      try {
        const parsedUrl = new URL(rawUrl);
        const segments = parsedUrl.pathname.split("/").filter(Boolean);
        const last = segments.pop();
        if (last) {
          return decodeURIComponent(last);
        }
      } catch (error) {
        console.warn("Failed to parse URL for attachment meta:", rawUrl, error);
        const segments = rawUrl.split("/").filter(Boolean);
        const last = segments.pop();
        if (last) {
          return decodeURIComponent(last);
        }
      }
      return "Attachment";
    };

    let name = typeof fileValue === "string" ? fileValue.trim() : "";
    let url = typeof urlValue === "string" ? urlValue.trim() : "";

    if (!name && url) {
      name = deriveNameFromUrl(url);
    }

    if (name && !url && /^https?:\/\//i.test(name)) {
      url = name;
      name = deriveNameFromUrl(url);
    }

    const isImage =
      /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name) ||
      (url ? /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(url) : false);

    return {
      name,
      url,
      isImage,
    };
  };

  // Ensure at least one item exists for each tab (matching creation phase behavior)
  useEffect(() => {
    if (!form) return; // Wait for form data to load

    const tabs = ["pipeline_data", "press_releases", "publications", "trial_registries", "associated_studies"];
    tabs.forEach((tab) => {
      const currentItems = (form as any)[tab] || [];
      if (currentItems.length === 0) {
        const templates = {
          pipeline_data: { id: Date.now().toString(), date: "", information: "", url: "", file: "", isVisible: true },
          press_releases: { id: Date.now().toString(), date: "", title: "", description: "", url: "", file: "", isVisible: true },
          publications: { id: Date.now().toString(), date: "", type: "", title: "", description: "", url: "", file: "", isVisible: true },
          trial_registries: { id: Date.now().toString(), date: "", registry: "", identifier: "", description: "", url: "", file: "", isVisible: true },
          associated_studies: { id: Date.now().toString(), date: "", type: "", title: "", description: "", url: "", file: "", isVisible: true },
        };
        addComplexArrayItem("step5_7", tab, templates[tab as keyof typeof templates]);
        console.log(`✅ Initialized empty ${tab} with default item`);
      }
    });
  }, [form]); // Run when form data changes

  // Also ensure current tab has at least one item when switching tabs
  useEffect(() => {
    if (!form) return; // Wait for form data to load

    const currentItems = (form as any)[activeTab] || [];
    if (currentItems.length === 0) {
      const templates = {
        pipeline_data: { id: Date.now().toString(), date: "", information: "", url: "", file: "", isVisible: true },
        press_releases: { id: Date.now().toString(), date: "", title: "", description: "", url: "", file: "", isVisible: true },
        publications: { id: Date.now().toString(), date: "", type: "", title: "", description: "", url: "", file: "", isVisible: true },
        trial_registries: { id: Date.now().toString(), date: "", registry: "", identifier: "", description: "", url: "", file: "", isVisible: true },
        associated_studies: { id: Date.now().toString(), date: "", type: "", title: "", description: "", url: "", file: "", isVisible: true },
      };
      addComplexArrayItem("step5_7", activeTab, templates[activeTab as keyof typeof templates]);
      console.log(`✅ Initialized empty ${activeTab} with default item when switching tabs`);
    }
  }, [activeTab, form]); // Run when activeTab or form changes

  // Dropdown options - matching old page exactly
  const publicationTypeOptions: SearchableSelectOption[] = [
    { value: "company_presentation", label: "Company Presentation" },
    { value: "sec_filing", label: "SEC Filing" },
    { value: "company_conference_report", label: "Company Conference Report" },
    { value: "revenue_reports", label: "Revenue Reports" },
    { value: "others", label: "Others" },
  ];

  const registryNameOptions: SearchableSelectOption[] = [
    { value: "euctr", label: "EUCTR" },
    { value: "ctri", label: "CTRI" },
    { value: "anzctr", label: "ANZCTR" },
    { value: "slctr", label: "SLCTR" },
    { value: "chictr", label: "ChiCTR" },
    { value: "chinese_fda", label: "Chinese FDA" },
    { value: "canadian_cancer_trials", label: "Canadian Cancer Trials" },
    { value: "health_canada", label: "Health Canada" },
    { value: "brazil_ctr", label: "Brazil CTR" },
    { value: "german_ctr", label: "German CTR" },
    { value: "cuban_ctr", label: "Cuban CTR" },
    { value: "iran_ctr", label: "Iran CTR" },
    { value: "lebanon_ctr", label: "Lebanon CTR" },
    { value: "pactr", label: "PACTR" },
    { value: "umin", label: "UMIN" },
  ];

  const studyTypeOptions: SearchableSelectOption[] = [
    { value: "follow_up_study", label: "Follow up Study" },
    { value: "observational_study", label: "Observational study" },
    { value: "other_study", label: "Other Study" },
  ];

  const tabs = [
    { key: "pipeline_data", label: "Pipeline Data" },
    { key: "press_releases", label: "Press Release" },
    { key: "publications", label: "Publication" },
    { key: "trial_registries", label: "Trial Registry" },
    { key: "associated_studies", label: "Associated Study" },
  ];

  const currentItems = (form as any)[activeTab] || [];

  // Handle file upload using Edge Store
  const handleFileUpload = async (file: File, itemIndex: number) => {
    if (!file) return;

    const uploadKey = `${activeTab}_${itemIndex}`;

    try {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));
      console.log(`Uploading file to Edge Store for ${activeTab} item ${itemIndex}:`, file.name);

      const res = await edgestore.trialOutcomeAttachments.upload({
        file,
        onProgressChange: (progress) => {
          console.log(`Upload progress for ${activeTab} item ${itemIndex}:`, progress);
        },
      });

      console.log("File uploaded successfully:", res.url);

      // Update both file name and fileUrl (not the user-facing url field)
      updateComplexArrayItem("step5_7", activeTab, itemIndex, {
        file: file.name,
        fileUrl: res.url
      });

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
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  // Handle file removal
  const handleFileRemove = async (itemIndex: number, fileUrl: string) => {
    if (!fileUrl) {
      // If no URL, just remove from UI
      updateComplexArrayItem("step5_7", activeTab, itemIndex, {
        file: null,
        fileUrl: null
      });
      return;
    }

    // Validate URL format
    let validUrl = fileUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      console.warn("Invalid URL format, removing from UI only:", validUrl);
      updateComplexArrayItem("step5_7", activeTab, itemIndex, {
        file: null,
        fileUrl: null
      });
      return;
    }

    // Optimistically update UI first for better UX
    updateComplexArrayItem("step5_7", activeTab, itemIndex, {
      file: null,
      fileUrl: null
    });

    try {
      await edgestore.trialOutcomeAttachments.delete({
        url: validUrl,
      });

      toast({
        title: "Success",
        description: "File removed successfully",
      });
    } catch (error: any) {
      console.error("Error removing file from Edge Store:", error);

      // Check if error is because file doesn't exist (404 or similar)
      const errorMessage = error?.message || String(error) || '';
      const errorString = errorMessage.toLowerCase();

      const isNotFoundError = errorString.includes('404') ||
        errorString.includes('not found') ||
        errorString.includes('does not exist') ||
        errorString.includes('no such key') ||
        errorString.includes('file not found');

      // Check for internal server errors that might be transient or already resolved
      const isServerError = errorString.includes('internal server error') ||
        errorString.includes('500') ||
        errorString.includes('server error');

      if (isNotFoundError) {
        // File doesn't exist - that's fine, we already removed it from UI
        // Don't show a warning, just silently succeed
        return;
      } else if (isServerError) {
        // Server error - file might still be deleted, or it's a transient issue
        // Since we already removed from UI, just log it without alarming the user
        console.warn("Edge Store server error during deletion (file may still be deleted):", error);
        return;
      } else {
        // Other errors - log but don't alarm user since UI is already updated
        console.warn("Edge Store deletion error (file removed from form):", error);
        // Optionally show a subtle notification, but not as an error
        toast({
          title: "File removed",
          description: "File has been removed from the form.",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            variant={activeTab === tab.key ? "default" : "outline"}
            className={`text-sm px-4 py-2 whitespace-nowrap ${activeTab === tab.key
              ? "bg-[#204B73] text-white hover:bg-[#204B73]/90"
              : "text-gray-600 hover:text-gray-800"
              }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          {tabs.find((t) => t.key === activeTab)?.label}
        </Label>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {currentItems.length > 0 ? (
          currentItems.map((item: any, idx: number) => (
            <div key={item.id || idx} className={`space-y-2 p-4 border rounded-lg ${!item.isVisible ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
              {/* Item Header */}
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">
                  {activeTab === "pipeline_data" && `Pipeline ${idx + 1}`}
                  {activeTab === "press_releases" && `Press Release ${idx + 1}`}
                  {activeTab === "publications" && `Publication ${idx + 1}`}
                  {activeTab === "trial_registries" && `Trial Registry ${idx + 1}`}
                  {activeTab === "associated_studies" && `Associated Study ${idx + 1}`}
                </h4>
              </div>
              {/* Pipeline Data */}
              {activeTab === "pipeline_data" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="w-1/4">
                      <Label className="text-sm">Pipeline Date</Label>
                      <CustomDateInput
                        value={item.date || ""}
                        onChange={(value) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { date: value }
                          )
                        }
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm">Pipeline Information</Label>
                      <Textarea
                        rows={3}
                        placeholder="Enter pipeline information..."
                        value={item.information || ""}
                        onChange={(e) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { information: e.target.value }
                          )
                        }
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <Label className="text-sm">URL</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="https://..."
                          value={item.url || ""}
                          onChange={(e) =>
                            updateComplexArrayItem(
                              "step5_7",
                              activeTab,
                              idx,
                              { url: e.target.value }
                            )
                          }
                          className="pl-10 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                        />
                      </div>
                    </div>
                    <div className="w-1/2">
                      <Label className="text-sm">Upload File</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.zip,.rar"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, idx);
                              e.target.value = '';
                            }
                          }}
                          disabled={uploadingFiles[`${activeTab}_${idx}`]}
                          className="flex-1 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={uploadingFiles[`${activeTab}_${idx}`]}
                          className="bg-[#204B73] hover:bg-[#204B73]/90 text-white"
                        >
                          {uploadingFiles[`${activeTab}_${idx}`] ? (
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
                  {item.fileUrl && (() => {
                    const meta = getAttachmentMeta(item.file, item.fileUrl);
                    return (
                      <div className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                        {meta.isImage ? (
                          <Image className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-600" />
                        )}
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            title={meta.name || "Attachment"}
                          >
                            {meta.name || "Attachment"}
                          </a>
                        ) : (
                          <span className="flex-1 truncate">{meta.name || "Attachment"}</span>
                        )}
                        {item.fileUrl && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            <LinkIcon className="h-3 w-3" />
                            View
                          </a>
                        )}
                        {!item.fileUrl && (
                          <span className="text-xs text-gray-400">No preview</span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileRemove(idx, item.fileUrl)}
                          className="text-red-500 hover:text-red-700 p-0 h-auto"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Press Releases */}
              {activeTab === "press_releases" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="w-1/4">
                      <Label className="text-sm">Press Release Date</Label>
                      <CustomDateInput
                        value={item.date || ""}
                        onChange={(value) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { date: value }
                          )
                        }
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm">Press Release Title</Label>
                      <Input
                        placeholder="Enter press release title..."
                        value={item.title || ""}
                        onChange={(e) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { title: e.target.value }
                          )
                        }
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                  </div>
                  <div className="w-full">
                    <Label className="text-sm">Description</Label>
                    <Textarea
                      rows={3}
                      placeholder="Enter press release description..."
                      value={item.description || ""}
                      onChange={(e) =>
                        updateComplexArrayItem(
                          "step5_7",
                          activeTab,
                          idx,
                          { description: e.target.value }
                        )
                      }
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <Label className="text-sm">URL</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="https://..."
                          value={item.url || ""}
                          onChange={(e) =>
                            updateComplexArrayItem(
                              "step5_7",
                              activeTab,
                              idx,
                              { url: e.target.value }
                            )
                          }
                          className="pl-10 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                        />
                      </div>
                    </div>
                    <div className="w-1/2">
                      <Label className="text-sm">Upload File</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.zip,.rar"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, idx);
                              e.target.value = '';
                            }
                          }}
                          disabled={uploadingFiles[`${activeTab}_${idx}`]}
                          className="flex-1 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={uploadingFiles[`${activeTab}_${idx}`]}
                          className="bg-[#204B73] hover:bg-[#204B73]/90 text-white"
                        >
                          {uploadingFiles[`${activeTab}_${idx}`] ? (
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
                  {item.fileUrl && (() => {
                    const meta = getAttachmentMeta(item.file, item.fileUrl);
                    return (
                      <div className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                        {meta.isImage ? (
                          <Image className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-600" />
                        )}
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            title={meta.name || "Attachment"}
                          >
                            {meta.name || "Attachment"}
                          </a>
                        ) : (
                          <span className="flex-1 truncate">{meta.name || "Attachment"}</span>
                        )}
                        {item.fileUrl && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            <LinkIcon className="h-3 w-3" />
                            View
                          </a>
                        )}
                        {!item.fileUrl && (
                          <span className="text-xs text-gray-400">No preview</span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileRemove(idx, item.fileUrl)}
                          className="text-red-500 hover:text-red-700 p-0 h-auto"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Publications */}
              {activeTab === "publications" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="w-1/4">
                      <Label className="text-sm">Publication Date</Label>
                      <CustomDateInput
                        value={item.date || ""}
                        onChange={(value) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { date: value }
                          )
                        }
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                    <div className="w-1/4">
                      <Label className="text-sm">Publication Type</Label>
                      <SearchableSelect
                        options={publicationTypeOptions}
                        value={item.type || ""}
                        onValueChange={(value) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { type: value }
                          )
                        }
                        placeholder="Select publication type"
                        searchPlaceholder="Search publication type..."
                        emptyMessage="No publication type found."
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                    <div className="w-1/2">
                      <Label className="text-sm">Publication Title</Label>
                      <Input
                        placeholder="Enter publication title..."
                        value={item.title || ""}
                        onChange={(e) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { title: e.target.value }
                          )
                        }
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                  </div>
                  <div className="w-full">
                    <Label className="text-sm">Description</Label>
                    <Textarea
                      rows={3}
                      placeholder="Enter publication description..."
                      value={item.description || ""}
                      onChange={(e) =>
                        updateComplexArrayItem(
                          "step5_7",
                          activeTab,
                          idx,
                          { description: e.target.value }
                        )
                      }
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <Label className="text-sm">URL</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="https://..."
                          value={item.url || ""}
                          onChange={(e) =>
                            updateComplexArrayItem(
                              "step5_7",
                              activeTab,
                              idx,
                              { url: e.target.value }
                            )
                          }
                          className="pl-10 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                        />
                      </div>
                    </div>
                    <div className="w-1/2">
                      <Label className="text-sm">Upload File</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.zip,.rar"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, idx);
                              e.target.value = '';
                            }
                          }}
                          disabled={uploadingFiles[`${activeTab}_${idx}`]}
                          className="flex-1 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={uploadingFiles[`${activeTab}_${idx}`]}
                          className="bg-[#204B73] hover:bg-[#204B73]/90 text-white"
                        >
                          {uploadingFiles[`${activeTab}_${idx}`] ? (
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
                  {item.fileUrl && (() => {
                    const meta = getAttachmentMeta(item.file, item.fileUrl);
                    return (
                      <div className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                        {meta.isImage ? (
                          <Image className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-600" />
                        )}
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            title={meta.name || "Attachment"}
                          >
                            {meta.name || "Attachment"}
                          </a>
                        ) : (
                          <span className="flex-1 truncate">{meta.name || "Attachment"}</span>
                        )}
                        {item.fileUrl && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            <LinkIcon className="h-3 w-3" />
                            View
                          </a>
                        )}
                        {!item.fileUrl && (
                          <span className="text-xs text-gray-400">No preview</span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileRemove(idx, item.fileUrl)}
                          className="text-red-500 hover:text-red-700 p-0 h-auto"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Trial Registries */}
              {activeTab === "trial_registries" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="w-1/4">
                      <Label className="text-sm">Registry Date</Label>
                      <CustomDateInput
                        value={item.date || ""}
                        onChange={(value) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { date: value }
                          )
                        }
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                    <div className="w-1/4">
                      <Label className="text-sm">Registry Name</Label>
                      <SearchableSelect
                        options={registryNameOptions}
                        value={item.registry || ""}
                        onValueChange={(value) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { registry: value }
                          )
                        }
                        placeholder="Select registry name"
                        searchPlaceholder="Search registry..."
                        emptyMessage="No registry found."
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                    <div className="w-1/2">
                      <Label className="text-sm">Registry Identifier</Label>
                      <Input
                        placeholder="Enter registry identifier..."
                        value={item.identifier || ""}
                        onChange={(e) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { identifier: e.target.value }
                          )
                        }
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                  </div>
                  <div className="w-full">
                    <Label className="text-sm">Description</Label>
                    <Textarea
                      rows={3}
                      placeholder="Enter trial registry description..."
                      value={item.description || ""}
                      onChange={(e) =>
                        updateComplexArrayItem(
                          "step5_7",
                          activeTab,
                          idx,
                          { description: e.target.value }
                        )
                      }
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <Label className="text-sm">URL</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="https://..."
                          value={item.url || ""}
                          onChange={(e) =>
                            updateComplexArrayItem(
                              "step5_7",
                              activeTab,
                              idx,
                              { url: e.target.value }
                            )
                          }
                          className="pl-10 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                        />
                      </div>
                    </div>
                    <div className="w-1/2">
                      <Label className="text-sm">Upload File</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.zip,.rar"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, idx);
                              e.target.value = '';
                            }
                          }}
                          disabled={uploadingFiles[`${activeTab}_${idx}`]}
                          className="flex-1 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={uploadingFiles[`${activeTab}_${idx}`]}
                          className="bg-[#204B73] hover:bg-[#204B73]/90 text-white"
                        >
                          {uploadingFiles[`${activeTab}_${idx}`] ? (
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
                  {item.fileUrl && (() => {
                    const meta = getAttachmentMeta(item.file, item.fileUrl);
                    return (
                      <div className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                        {meta.isImage ? (
                          <Image className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-600" />
                        )}
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            title={meta.name || "Attachment"}
                          >
                            {meta.name || "Attachment"}
                          </a>
                        ) : (
                          <span className="flex-1 truncate">{meta.name || "Attachment"}</span>
                        )}
                        {item.fileUrl && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            <LinkIcon className="h-3 w-3" />
                            View
                          </a>
                        )}
                        {!item.fileUrl && (
                          <span className="text-xs text-gray-400">No preview</span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileRemove(idx, item.fileUrl)}
                          className="text-red-500 hover:text-red-700 p-0 h-auto"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Associated Studies */}
              {activeTab === "associated_studies" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="w-1/4">
                      <Label className="text-sm">Study Date</Label>
                      <CustomDateInput
                        value={item.date || ""}
                        onChange={(value) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { date: value }
                          )
                        }
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                    <div className="w-1/4">
                      <Label className="text-sm">Study Type</Label>
                      <SearchableSelect
                        options={studyTypeOptions}
                        value={item.type || ""}
                        onValueChange={(value) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { type: value }
                          )
                        }
                        placeholder="Select study type"
                        searchPlaceholder="Search study type..."
                        emptyMessage="No study type found."
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                    <div className="w-1/2">
                      <Label className="text-sm">Study Title</Label>
                      <Input
                        placeholder="Enter study title..."
                        value={item.title || ""}
                        onChange={(e) =>
                          updateComplexArrayItem(
                            "step5_7",
                            activeTab,
                            idx,
                            { title: e.target.value }
                          )
                        }
                        className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                      />
                    </div>
                  </div>
                  <div className="w-full">
                    <Label className="text-sm">Description</Label>
                    <Textarea
                      rows={3}
                      placeholder="Enter associated study description..."
                      value={item.description || ""}
                      onChange={(e) =>
                        updateComplexArrayItem(
                          "step5_7",
                          activeTab,
                          idx,
                          { description: e.target.value }
                        )
                      }
                      className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <Label className="text-sm">URL</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="https://..."
                          value={item.url || ""}
                          onChange={(e) =>
                            updateComplexArrayItem(
                              "step5_7",
                              activeTab,
                              idx,
                              { url: e.target.value }
                            )
                          }
                          className="pl-10 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                        />
                      </div>
                    </div>
                    <div className="w-1/2">
                      <Label className="text-sm">Upload File</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.zip,.rar"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, idx);
                              e.target.value = '';
                            }
                          }}
                          disabled={uploadingFiles[`${activeTab}_${idx}`]}
                          className="flex-1 border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={uploadingFiles[`${activeTab}_${idx}`]}
                          className="bg-[#204B73] hover:bg-[#204B73]/90 text-white"
                        >
                          {uploadingFiles[`${activeTab}_${idx}`] ? (
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
                  {item.fileUrl && (() => {
                    const meta = getAttachmentMeta(item.file, item.fileUrl);
                    return (
                      <div className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                        {meta.isImage ? (
                          <Image className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-600" />
                        )}
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            title={meta.name || "Attachment"}
                          >
                            {meta.name || "Attachment"}
                          </a>
                        ) : (
                          <span className="flex-1 truncate">{meta.name || "Attachment"}</span>
                        )}
                        {item.fileUrl && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            <LinkIcon className="h-3 w-3" />
                            View
                          </a>
                        )}
                        {!item.fileUrl && (
                          <span className="text-xs text-gray-400">No preview</span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileRemove(idx, item.fileUrl)}
                          className="text-red-500 hover:text-red-700 p-0 h-auto"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleArrayItemVisibility("step5_7", activeTab, idx)}
                    className={item.isVisible ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"}
                  >
                    {item.isVisible ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                    {item.isVisible ? "Visible" : "Hidden"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  {idx === 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const templates = {
                          pipeline_data: { date: "", information: "", url: "", file: "", isVisible: true },
                          press_releases: { date: "", title: "", description: "", url: "", file: "", isVisible: true },
                          publications: { date: "", type: "", title: "", description: "", url: "", file: "", isVisible: true },
                          trial_registries: { date: "", registry: "", identifier: "", description: "", url: "", file: "", isVisible: true },
                          associated_studies: { date: "", type: "", title: "", description: "", url: "", file: "", isVisible: true },
                        };
                        addComplexArrayItem("step5_7", activeTab, templates[activeTab as keyof typeof templates]);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem("step5_7", activeTab, idx)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-2 p-4 border rounded-lg bg-white">
            <p className="text-gray-500 text-center mb-4">
              No {tabs.find((t) => t.key === activeTab)?.label.toLowerCase()} added yet.
            </p>
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const templates = {
                    pipeline_data: { date: "", information: "", url: "", file: "", isVisible: true },
                    press_releases: { date: "", title: "", description: "", url: "", file: "", isVisible: true },
                    publications: { type: "", title: "", description: "", url: "", file: "", isVisible: true },
                    trial_registries: { registry: "", identifier: "", description: "", url: "", file: "", isVisible: true },
                    associated_studies: { type: "", title: "", description: "", url: "", file: "", isVisible: true },
                  };
                  addComplexArrayItem("step5_7", activeTab, templates[activeTab as keyof typeof templates]);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add {tabs.find((t) => t.key === activeTab)?.label.slice(0, -1)}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
