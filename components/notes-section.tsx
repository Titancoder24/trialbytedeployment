"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  X, 
  Eye, 
  EyeOff, 
  Calendar, 
  Link as LinkIcon, 
  Paperclip,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  Image,
  File
} from "lucide-react";
import { format } from "date-fns";
import CustomDateInput from "@/components/ui/custom-date-input";
import { UploadButton } from "@/lib/uploadthing";

export interface AttachmentFile {
  name: string;
  url: string;
  type: string;
}

export interface NoteItem {
  id: string;
  date: string;
  type: string;
  content: string;
  sourceLink?: string;
  sourceType?: string;
  sourceUrl?: string;
  attachments?: AttachmentFile[];
  isVisible: boolean;
  isExpanded?: boolean;
}

export interface NotesSectionProps {
  title?: string;
  notes: NoteItem[];
  onAddNote: () => void;
  onUpdateNote: (index: number, updatedNote: Partial<NoteItem>) => void;
  onRemoveNote: (index: number) => void;
  onToggleVisibility?: (index: number) => void;
  noteTypes?: string[];
  sourceTypes?: string[];
  className?: string;
  showAddButton?: boolean;
}

const DEFAULT_NOTE_TYPES = [
  "Interim",
  "Full Results",
  "Primary Endpoint Results",
  "Analysis"
];

const DEFAULT_SOURCE_TYPES = [
  "PubMed",
  "Journals",
  "Conferences"
];

export function NotesSection({
  title = "Notes",
  notes,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onToggleVisibility,
  noteTypes = DEFAULT_NOTE_TYPES,
  sourceTypes = DEFAULT_SOURCE_TYPES,
  className = "",
  showAddButton = true
}: NotesSectionProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  // Helper function to get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  // Helper function to check if file is an image
  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const toggleNoteExpansion = (index: number) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleToggleVisibility = (index: number) => {
    if (onToggleVisibility) {
      onToggleVisibility(index);
    } else {
      onUpdateNote(index, { isVisible: !notes[index].isVisible });
    }
  };

  // Sort notes by date (latest first)
  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {showAddButton && (
            <Button
              onClick={onAddNote}
              size="sm"
              className="bg-[#204B73] hover:bg-[#1a3d5c] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {sortedNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No notes added yet.</p>
            <p className="text-sm">Click "Add Note" to create your first note.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotes.map((note, index) => {
              const originalIndex = notes.findIndex(n => n.id === note.id);
              const isExpanded = expandedNotes.has(originalIndex);
              
              // Ensure we have a unique key - use note.id if available, otherwise fallback to index
              const noteKey = note.id || `note-${originalIndex}-${index}`;
              
              return (
                <div
                  key={noteKey}
                  className={`border rounded-lg transition-all duration-200 ${
                    note.isVisible 
                      ? "border-gray-200 bg-white shadow-sm" 
                      : "border-gray-300 bg-gray-50 opacity-60"
                  }`}
                >
                  {/* Note Header */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">
                        Note #{originalIndex + 1}
                      </span>
                      
                      {/* Date */}
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {note.date ? format(new Date(note.date), "MM-dd-yyyy") : "No date"}
                        </span>
                      </div>
                      
                      {/* Type */}
                      {note.type && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {note.type}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Visibility Toggle */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(originalIndex)}
                        className={`${
                          note.isVisible
                            ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                            : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {note.isVisible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {/* Expand/Collapse */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleNoteExpansion(originalIndex)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveNote(originalIndex)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Note Content */}
                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {/* Date Input */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Date</Label>
                          <CustomDateInput
                            value={note.date}
                            onChange={(value) => onUpdateNote(originalIndex, { date: value })}
                            placeholder="MM-DD-YYYY"
                            className="text-sm"
                          />
                        </div>
                        
                        {/* Type Dropdown */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Type</Label>
                          <Select
                            value={note.type}
                            onValueChange={(value) => onUpdateNote(originalIndex, { type: value })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select note type" />
                            </SelectTrigger>
                            <SelectContent>
                              {noteTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Content Text Box */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Content</Label>
                        <Textarea
                          rows={4}
                          value={note.content}
                          onChange={(e) => onUpdateNote(originalIndex, { content: e.target.value })}
                          placeholder="Enter note content..."
                          className="text-sm resize-none"
                        />
                      </div>
                      
                      {/* Source URL Input */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Source</Label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="url"
                            placeholder="https://..."
                            value={note.sourceUrl || ""}
                            onChange={(e) => onUpdateNote(originalIndex, { sourceUrl: e.target.value })}
                            className="pl-10 text-sm"
                          />
                        </div>
                      </div>
                      
                      {/* Attachments */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Attachments</Label>
                        <div className="space-y-3">
                          {/* Display uploaded files */}
                          {note.attachments?.map((attachment, attachmentIndex) => {
                            // Use attachment URL or name as key for better uniqueness
                            const attachmentKey = attachment.url || attachment.name || `attachment-${attachmentIndex}`;
                            return (
                            <div key={`${noteKey}-attachment-${attachmentKey}`} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {getFileIcon(attachment.type)}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700">{attachment.name}</p>
                                    <p className="text-xs text-gray-500">{attachment.type}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updatedAttachments = note.attachments?.filter((_, i) => i !== attachmentIndex);
                                      onUpdateNote(originalIndex, { attachments: updatedAttachments });
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Image preview */}
                              {isImageFile(attachment.type) && (
                                <div className="mt-3">
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="max-w-full h-32 object-cover rounded border"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            );
                          })}
                          
                          {/* Upload button */}
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <div className="text-center">
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600 mb-2">Upload files to attach to this note</p>
                              <UploadButton
                                endpoint="therapeuticFileUploader"
                                onClientUploadComplete={(res) => {
                                  if (res && res[0]) {
                                    const newAttachment: AttachmentFile = {
                                      name: res[0].name,
                                      url: res[0].url,
                                      type: res[0].type || 'application/octet-stream'
                                    };
                                    const updatedAttachments = [...(note.attachments || []), newAttachment];
                                    onUpdateNote(originalIndex, { attachments: updatedAttachments });
                                  }
                                }}
                                onUploadError={(error: Error) => {
                                  console.error('Upload error:', error);
                                }}
                                appearance={{
                                  button: "bg-[#204B73] hover:bg-[#1a3d5c] text-white px-4 py-2 rounded-md text-sm font-medium",
                                  allowedContent: "text-xs text-gray-500 mt-1"
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotesSection;
