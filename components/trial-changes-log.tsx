"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clock, User, Edit3, Plus, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

interface ChangeLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  step?: string;
  changeType?: 'field_change' | 'content_addition' | 'content_removal' | 'visibility_change' | 'creation';
}

interface TrialChangesLogProps {
  changesLog: ChangeLogEntry[];
  className?: string;
}

const getActionIcon = (action: string, changeType?: string) => {
  switch (action.toLowerCase()) {
    case "created":
    case "added":
      return <Plus className="h-4 w-4 text-green-600" />;
    case "changed":
      return <Edit3 className="h-4 w-4 text-blue-600" />;
    case "removed":
    case "deleted":
      return <Trash2 className="h-4 w-4 text-red-600" />;
    case "hidden":
    case "shown":
      return <Eye className="h-4 w-4 text-purple-600" />;
    default:
      return <Edit3 className="h-4 w-4 text-gray-600" />;
  }
};

const getActionColor = (action: string, changeType?: string) => {
  switch (action.toLowerCase()) {
    case "created":
    case "added":
      return "text-green-700 bg-green-50 border-green-200";
    case "changed":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "removed":
    case "deleted":
      return "text-red-700 bg-red-50 border-red-200";
    case "hidden":
    case "shown":
      return "text-purple-700 bg-purple-50 border-purple-200";
    default:
      return "text-gray-700 bg-gray-50 border-gray-200";
  }
};

const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return timestamp;
  }
};

// Helper function to safely format values for display
const formatValueForDisplay = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  // If it's already a string, return it
  if (typeof value === 'string') {
    return value;
  }
  
  // If it's an object or array, stringify it
  if (typeof value === 'object') {
    try {
      // For attachment objects, show a more readable format
      if (value.name && value.url) {
        return `Attachment: ${value.name}`;
      }
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  
  // For other types, convert to string
  return String(value);
};

export default function TrialChangesLog({ changesLog, className = "" }: TrialChangesLogProps) {
  // Sort changes by timestamp (newest first)
  const sortedChanges = [...changesLog].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card className={`border rounded-xl shadow-sm ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-lg font-semibold">Trial Changes Log</Label>
            <span className="text-sm text-gray-500">({changesLog.length} entries)</span>
          </div>
          
          {/* Log Display Area */}
          <div className="border border-gray-200 rounded-lg bg-gray-50 min-h-[300px] max-h-[500px] overflow-y-auto">
            {sortedChanges.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No changes recorded yet</p>
                  <p className="text-sm">Changes will appear here as you modify the trial</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {sortedChanges.map((change, index) => (
                  <div
                    key={change.id}
                    className={`p-4 rounded-lg border-l-4 ${getActionColor(change.action, change.changeType)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getActionIcon(change.action, change.changeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">{change.action}</span>
                        </div>
                        <p className="text-sm mb-2">{change.details}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(change.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>by {change.user}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Summary Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-sm text-gray-500">Trial ID</div>
              <div className="font-medium">Auto-generated</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Last Modified Date</div>
              <div className="font-medium">
                {changesLog.length > 0 
                  ? formatTimestamp(changesLog[changesLog.length - 1]?.timestamp)
                  : "Not available"
                }
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Last Modified User</div>
              <div className="font-medium">
                {changesLog.length > 0 
                  ? changesLog[changesLog.length - 1]?.user || "Unknown"
                  : "Not available"
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
