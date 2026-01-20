"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Minus } from "lucide-react"
import { FaBook, FaBookmark } from "react-icons/fa"

interface ClinicalTrialAdvancedSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplySearch: (criteria: ClinicalTrialSearchCriteria[]) => void
  onOpenSavedQueries?: () => void
}

export interface ClinicalTrialSearchCriteria {
  id: string
  field: string
  operator: string
  value: string
  logic: "AND" | "OR"
}

const searchFields = [
  { value: "disease_type", label: "Disease Type" },
  { value: "enrollment", label: "Enrollment" },
  { value: "therapeutic_area", label: "Therapeutic Area" },
  { value: "trial_phase", label: "Trial Phase" },
  { value: "primary_drugs", label: "Primary Drug" },
  { value: "secondary_drugs", label: "Secondary Drug" },
  { value: "trial_status", label: "Trial Status" },
  { value: "sponsor_collaborators", label: "Sponsor" },
  { value: "countries", label: "Countries" },
  { value: "patient_segment", label: "Patient Segment" },
  { value: "line_of_therapy", label: "Line of Therapy" },
  { value: "trial_identifier", label: "Trial Identifier" },
  { value: "start_date", label: "Start Date" },
  { value: "end_date", label: "End Date" }
]

const operators = [
  { value: "contains", label: "Contains" },
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
  { value: "greater_than", label: ">=" },
  { value: "less_than", label: "<" },
  { value: "equals", label: "=" },
  { value: "not_equals", label: "!=" }
]

export function ClinicalTrialAdvancedSearchModal({ open, onOpenChange, onApplySearch, onOpenSavedQueries }: ClinicalTrialAdvancedSearchModalProps) {
  const [criteria, setCriteria] = useState<ClinicalTrialSearchCriteria[]>([
    {
      id: "1",
      field: "disease_type",
      operator: "contains",
      value: "Liver cancer",
      logic: "AND",
    },
    {
      id: "2",
      field: "enrollment",
      operator: "greater_than",
      value: "100",
      logic: "OR",
    },
    {
      id: "3",
      field: "",
      operator: "",
      value: "",
      logic: "AND",
    }
  ])

  const addCriteria = () => {
    const newCriteria: ClinicalTrialSearchCriteria = {
      id: Date.now().toString(),
      field: "",
      operator: "",
      value: "",
      logic: "AND",
    }
    setCriteria((prev) => [...prev, newCriteria])
  }

  const removeCriteria = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id))
  }

  const updateCriteria = (id: string, field: keyof ClinicalTrialSearchCriteria, value: string) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const handleApply = () => {
    onApplySearch(criteria.filter((c) => c.value.trim() !== ""))
    onOpenChange(false)
  }

  const handleOpenSavedQueries = () => {
    if (onOpenSavedQueries) {
      onOpenChange(false); // Close advanced search modal
      onOpenSavedQueries(); // Open saved queries modal
    }
  }

  const handleSaveQuery = () => {
    const queryName = `Advanced Search (${criteria.length} criteria) - ${new Date().toLocaleDateString()}`;
    const savedQueries = JSON.parse(localStorage.getItem('clinicalTrialSearchQueries') || '[]');
    const newQuery = {
      id: Date.now().toString(),
      name: queryName,
      criteria: criteria,
      createdAt: new Date().toISOString()
    };

    savedQueries.push(newQuery);
    localStorage.setItem('clinicalTrialSearchQueries', JSON.stringify(savedQueries));
    alert(`Query saved as: ${queryName}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[80vh] p-0 rounded-lg overflow-hidden [&>button]:hidden"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {/* Header - Light Blue Background */}
        <DialogHeader
          className="px-6 py-4 border-b relative"
          style={{ backgroundColor: "#C3E9FB" }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle
              className="text-lg font-semibold"
              style={{ fontFamily: "Poppins, sans-serif", color: "#204B73" }}
            >
              Advanced search
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-200"
              style={{ backgroundColor: "#204B73" }}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </DialogHeader>

        {/* Search Criteria Rows */}
        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto bg-white">
          {criteria.map((criterion, index) => (
            <div key={criterion.id} className="space-y-3">
              <div className="flex items-center gap-3">
                {/* Field Dropdown */}
                <div className="w-[140px]">
                  <Select
                    value={criterion.field}
                    onValueChange={(value) => updateCriteria(criterion.id, "field", value)}
                  >
                    <SelectTrigger
                      className="bg-white border border-gray-300 rounded-lg text-center justify-center"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      <SelectValue placeholder="Choose Field" />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {searchFields.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Operator Dropdown - Teal Color #208B8B */}
                <div className="w-[100px]">
                  <Select
                    value={criterion.operator}
                    onValueChange={(value) => updateCriteria(criterion.id, "operator", value)}
                  >
                    <SelectTrigger
                      className="text-white border-0 rounded-lg text-center justify-center"
                      style={{ backgroundColor: "#208B8B", fontFamily: "Poppins, sans-serif" }}
                    >
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {operators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Term Input */}
                <div className="flex-1">
                  <Input
                    placeholder="Enter the search term"
                    value={criterion.value}
                    onChange={(e) => updateCriteria(criterion.id, "value", e.target.value)}
                    className="border border-gray-300 rounded-lg text-center"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  />
                </div>

                {/* Boolean Dropdown - Orange #FFB547 */}
                <div className="w-[100px]">
                  <Select
                    value={criterion.logic}
                    onValueChange={(value) => updateCriteria(criterion.id, "logic", value as "AND" | "OR")}
                  >
                    <SelectTrigger
                      className="text-white border-0 rounded-lg text-center justify-center"
                      style={{ backgroundColor: "#FFB547", fontFamily: "Poppins, sans-serif" }}
                    >
                      <SelectValue placeholder="Boolean" />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" style={{ fontFamily: "Poppins, sans-serif" }}>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Plus/Minus Buttons */}
                <div className="flex gap-1">
                  {/* Plus Button - Green #4FD09D */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCriteria}
                    className="border-0 h-8 w-8 p-0 rounded"
                    style={{ backgroundColor: "#4FD09D" }}
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </Button>
                  {/* Minus Button - Red/Coral #F67F77 */}
                  {criteria.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCriteria(criterion.id)}
                      className="border-0 h-8 w-8 p-0 rounded"
                      style={{ backgroundColor: "#F67F77" }}
                    >
                      <Minus className="h-4 w-4 text-white" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Divider line between rows */}
              {index < criteria.length - 1 && (
                <div style={{ borderBottom: "1px solid #DFE1E7", marginTop: "16px" }}></div>
              )}
            </div>
          ))}
        </div>

        {/* Footer with Action Buttons */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
        >
          {/* Open Saved Queries Button */}
          <Button
            variant="outline"
            onClick={handleOpenSavedQueries}
            className="border-0 rounded-lg px-4 py-2 flex items-center gap-2 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif", color: "white" }}
          >
            <FaBook className="h-4 w-4" />
            Open saved queries
          </Button>

          {/* Save This Query Button */}
          <Button
            variant="outline"
            onClick={handleSaveQuery}
            className="border-0 rounded-lg px-4 py-2 flex items-center gap-2 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif", color: "white" }}
          >
            <FaBookmark className="h-4 w-4" />
            Save this Query
          </Button>

          {/* Run Button */}
          <Button
            onClick={handleApply}
            className="border-0 rounded-lg px-6 py-2 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif", color: "white" }}
          >
            Run
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
