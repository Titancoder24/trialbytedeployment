"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Minus, CalendarIcon } from "lucide-react"
import { QueryHistoryModal } from "@/components/query-history-modal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useDynamicDropdown } from "@/hooks/use-dynamic-dropdown"
import { DrugFilterState } from "./drug-filter-modal"

interface DrugAdvancedSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplySearch: (criteria: DrugSearchCriteria[]) => void
  initialCriteria?: DrugSearchCriteria[] // Add initial criteria for editing
  currentFilters?: DrugFilterState // Add current filters for save query functionality
  editingQueryId?: string | null
  editingQueryTitle?: string
  editingQueryDescription?: string
  onSaveQuerySuccess?: () => void
}

export interface DrugSearchCriteria {
  id: string
  field: string
  operator: string
  value: string
  logic: "AND" | "OR"
}

// Interface for drug data
interface DrugData {
  id: string;
  drug_name: string;
  generic_name: string;
  other_name: string;
  primary_name: string;
  global_status: string;
  development_status: string;
  drug_summary: string;
  originator: string;
  other_active_companies: string;
  therapeutic_area: string;
  disease_type: string;
  regulator_designations: string;
  source_link: string;
  drug_record_status: string;
  is_approved: string;
  created_at: string;
  updated_at: string;
}

const drugSearchFields = [
  { value: "drug_name", label: "Drug Name" },
  { value: "generic_name", label: "Generic Name" },
  { value: "other_name", label: "Other Name" },
  { value: "primary_name", label: "Primary Name" },
  { value: "global_status", label: "Global Status" },
  { value: "development_status", label: "Development Status" },
  { value: "drug_summary", label: "Drug Summary" },
  { value: "originator", label: "Originator" },
  { value: "other_active_companies", label: "Other Active Companies" },
  { value: "therapeutic_area", label: "Therapeutic Area" },
  { value: "disease_type", label: "Disease Type" },
  { value: "regulator_designations", label: "Regulator Designations" },
  { value: "source_link", label: "Source Link" },
  { value: "drug_record_status", label: "Drug Record Status" },
  { value: "is_approved", label: "Approval Status" },
  { value: "created_at", label: "Created Date" },
  { value: "updated_at", label: "Updated Date" }
]

// Text operators (for non-numeric fields)
const textOperators = [
  { value: "contains", label: "Contains" },
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
]

// Date operators
const dateOperators = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "greater_than", label: ">" },
  { value: "greater_than_equal", label: ">=" },
  { value: "less_than", label: "<" },
  { value: "less_than_equal", label: "<=" },
]

// Helper function to get operators based on field type
const getOperatorsForField = (fieldValue: string) => {
  if (dateFields.includes(fieldValue)) return dateOperators
  return textOperators
}

// Fields that should use date picker
const dateFields = [
  "created_at",
  "updated_at"
]

const DEFAULT_CRITERIA: DrugSearchCriteria[] = [
  {
    id: "1",
    field: "drug_name",
    operator: "contains",
    value: "",
    logic: "AND",
  }
]

export function DrugAdvancedSearchModal({
  open,
  onOpenChange,
  onApplySearch,
  initialCriteria,
  currentFilters,
  editingQueryId = null,
  editingQueryTitle = "",
  editingQueryDescription = "",
  onSaveQuerySuccess
}: DrugAdvancedSearchModalProps) {
  const { toast } = useToast();
  const [criteria, setCriteria] = useState<DrugSearchCriteria[]>(DEFAULT_CRITERIA)
  const [savedQueriesOpen, setSavedQueriesOpen] = useState(false)
  const [drugData, setDrugData] = useState<DrugData[]>([])
  const [loading, setLoading] = useState(false)

  // Dynamic dropdown for Originator (uses Sponsor and Collaborators from dropdown management)
  const { options: dynamicOriginatorOptions } = useDynamicDropdown({
    categoryName: 'sponsor_collaborators',
    fallbackOptions: [],
  });

  const isEditMode = editingQueryId !== null && editingQueryId !== ""

  // Load initial criteria when modal opens or when initialCriteria changes
  useEffect(() => {
    if (open) {
      if (initialCriteria && initialCriteria.length > 0) {
        setCriteria(initialCriteria)
      } else if (!isEditMode) {
        // Reset to default when not editing
        setCriteria(DEFAULT_CRITERIA)
      }
      fetchDrugData()
    }
  }, [open, initialCriteria, isEditMode])

  const fetchDrugData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/drugs/all-drugs-with-data`)
      if (response.ok) {
        const data = await response.json()
        // Extract overview data from each drug
        const overviewData = (data.drugs || []).map((drug: any) => drug.overview).filter(Boolean)
        setDrugData(overviewData)
      }
    } catch (error) {
      console.error('Error fetching drug data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique values for a specific field from the drug data
  const getFieldValues = (field: string): string[] => {
    // Don't extract values for date fields - they use date picker
    if (dateFields.includes(field)) {
      return []
    }

    // Use dynamic dropdown options for originator and other_active_companies
    if (field === 'originator' || field === 'other_active_companies') {
      return dynamicOriginatorOptions.map(opt => opt.value);
    }

    const values = new Set<string>()

    drugData.forEach(drug => {
      let fieldValue = ''

      switch (field) {
        case 'drug_name':
          fieldValue = drug.drug_name || ''
          break
        case 'generic_name':
          fieldValue = drug.generic_name || ''
          break
        case 'other_name':
          fieldValue = drug.other_name || ''
          break
        case 'primary_name':
          fieldValue = drug.primary_name || ''
          break
        case 'global_status':
          fieldValue = drug.global_status || ''
          break
        case 'development_status':
          fieldValue = drug.development_status || ''
          break
        case 'drug_summary':
          fieldValue = drug.drug_summary || ''
          break
        case 'originator':
          fieldValue = drug.originator || ''
          break
        case 'other_active_companies':
          fieldValue = drug.other_active_companies || ''
          break
        case 'therapeutic_area':
          fieldValue = drug.therapeutic_area || ''
          break
        case 'disease_type':
          fieldValue = drug.disease_type || ''
          break
        case 'regulator_designations':
          fieldValue = drug.regulator_designations || ''
          break
        case 'source_link':
          fieldValue = drug.source_link || ''
          break
        case 'drug_record_status':
          fieldValue = drug.drug_record_status || ''
          break
        case 'is_approved':
          fieldValue = drug.is_approved || ''
          break
      }

      if (fieldValue && fieldValue.trim()) {
        values.add(fieldValue.trim())
      }
    })

    return Array.from(values).sort()
  }

  // Function to render the appropriate input type based on field
  const renderValueInput = (criterion: DrugSearchCriteria) => {
    const isDateField = dateFields.includes(criterion.field)
    const dynamicValues = getFieldValues(criterion.field)

    // Date field with calendar popup and month/year dropdown navigation
    if (isDateField) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal border border-gray-300 rounded-lg",
                !criterion.value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {criterion.value ? format(new Date(criterion.value), "MM-dd-yyyy") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={criterion.value ? new Date(criterion.value) : undefined}
              onSelect={(date: Date | undefined) => {
                if (date) {
                  // Store as YYYY-MM-DD to avoid timezone issues
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  updateCriteria(criterion.id, "value", `${year}-${month}-${day}`)
                }
              }}
              initialFocus
              captionLayout="dropdown"
              fromYear={1900}
              toYear={2100}
            />
          </PopoverContent>
        </Popover>
      )
    }

    // Dynamic dropdown for fields with data from database
    if (dynamicValues.length > 0) {
      return (
        <Select
          value={criterion.value}
          onValueChange={(value) => updateCriteria(criterion.id, "value", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            {dynamicValues.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Default to text input for fields without dynamic data
    return (
      <Input
        placeholder="Enter the search term"
        value={criterion.value || ""}
        onChange={(e) => updateCriteria(criterion.id, "value", e.target.value)}
      />
    )
  }

  const addCriteria = () => {
    const newCriteria: DrugSearchCriteria = {
      id: Date.now().toString(),
      field: "drug_name",
      operator: "contains",
      value: "",
      logic: "AND",
    }
    setCriteria((prev) => [...prev, newCriteria])
  }

  const removeCriteria = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id))
  }

  const updateCriteria = (id: string, field: keyof DrugSearchCriteria, value: string) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const handleApply = () => {
    onApplySearch(criteria.filter((c) => c.value.trim() !== ""))
    onOpenChange(false)
  }

  const handleClear = () => {
    setCriteria(DEFAULT_CRITERIA)
  }

  const handleOpenSavedQueries = () => {
    setSavedQueriesOpen(true)
  }

  const handleLoadQuery = (queryData: any) => {
    if (queryData.searchCriteria && Array.isArray(queryData.searchCriteria)) {
      setCriteria(queryData.searchCriteria)
    }
    setSavedQueriesOpen(false)
  }

  const handleSaveQuery = () => {
    // Prepare the query data
    const queryData = {
      searchTerm: "",
      filters: currentFilters || {},
      searchCriteria: criteria,
      savedAt: new Date().toISOString()
    }

    if (isEditMode && editingQueryId) {
      // UPDATE MODE: Update existing query
      const existingQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
      const queryIndex = existingQueries.findIndex((q: any) => q.id === editingQueryId)

      if (queryIndex !== -1) {
        // Update the existing query
        existingQueries[queryIndex] = {
          ...existingQueries[queryIndex],
          query_data: queryData,
          updated_at: new Date().toISOString()
        }
        localStorage.setItem('unifiedSavedQueries', JSON.stringify(existingQueries))

        toast({
          title: "Query Updated",
          description: `"${editingQueryTitle}" has been updated successfully`,
        });
      }

      // Try to update in backend API
      try {
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved/${editingQueryId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              title: editingQueryTitle,
              description: editingQueryDescription || null,
              query_type: "drug_advanced_search",
              query_data: queryData
            })
          }
        ).then(response => {
          if (response.ok) {
            console.log("Query updated in backend successfully")
          }
        }).catch(err => {
          console.warn("Backend update failed:", err)
        })
      } catch (apiError) {
        console.warn("API update failed, but query updated locally:", apiError)
      }

      if (onSaveQuerySuccess) {
        onSaveQuerySuccess()
      }
    } else {
      // CREATE MODE: Create new query
      const queryName = `Drug Advanced Search (${criteria.length} criteria) - ${new Date().toLocaleDateString()}`;

      const newQuery = {
        id: Date.now().toString(),
        title: queryName,
        description: `Drug advanced search with ${criteria.length} criteria`,
        query_type: "drug_advanced_search",
        query_data: queryData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const savedQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]');
      savedQueries.push(newQuery);
      localStorage.setItem('unifiedSavedQueries', JSON.stringify(savedQueries));

      // Debug: Log what we're saving
      console.log("Saving to localStorage:", savedQueries);
      console.log("Total queries in storage:", savedQueries.length);

      // Show feedback using toast
      toast({
        title: "Query Saved",
        description: `Drug advanced search query saved as: ${queryName}`,
      });
      console.log("Drug query saved:", newQuery);

      // Try to save to backend API
      try {
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              title: queryName,
              description: `Drug advanced search with ${criteria.length} criteria`,
              query_type: "drug_advanced_search",
              query_data: queryData
            })
          }
        ).then(response => {
          if (response.ok) {
            console.log("Query saved to backend successfully")
          }
        }).catch(err => {
          console.warn("Backend save failed:", err)
        })
      } catch (apiError) {
        console.warn("API save failed, but query saved locally:", apiError)
      }
    }
  }

  const handleClose = () => {
    // Reset criteria when closing if not in edit mode
    if (!isEditMode) {
      setCriteria(DEFAULT_CRITERIA)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b bg-blue-50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {isEditMode ? `Edit Query: ${editingQueryTitle}` : "Advanced Drug Search"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading drug data...</p>
              </div>
            </div>
          ) : (
            criteria.map((criterion, index) => (
              <div key={criterion.id} className="space-y-3">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-3">
                    <Select
                      value={criterion.field}
                      onValueChange={(value) => updateCriteria(criterion.id, "field", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {drugSearchFields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Select
                      value={criterion.operator}
                      onValueChange={(value) => updateCriteria(criterion.id, "operator", value)}
                    >
                      <SelectTrigger className="bg-teal-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperatorsForField(criterion.field).map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    {renderValueInput(criterion)}
                  </div>

                  <div className="col-span-2">
                    <Select
                      value={criterion.logic}
                      onValueChange={(value) => updateCriteria(criterion.id, "logic", value as "AND" | "OR")}
                    >
                      <SelectTrigger className="bg-orange-500 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCriteria}
                      className="bg-green-500 text-white hover:bg-green-600 h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    {criteria.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCriteria(criterion.id)}
                        className="bg-red-500 text-white hover:bg-red-600 h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {/* Remove logic connector line for the last item */}
                {index < criteria.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-8 h-4 flex items-center justify-center">
                      <div className="w-px h-4 bg-gray-300"></div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleOpenSavedQueries}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <span className="mr-2">📁</span>
              Open saved queries
            </Button>
            <Button variant="outline" onClick={handleSaveQuery} className="bg-gray-600 text-white hover:bg-gray-700">
              <span className="mr-2">💾</span>
              {isEditMode ? "Update Query" : "Save this Query"}
            </Button>
            <Button variant="outline" onClick={handleClear} className="bg-yellow-600 text-white hover:bg-yellow-700">
              <span className="mr-2">🔄</span>
              Clear All
            </Button>
          </div>
          <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700">
            Run Search
          </Button>
        </div>
      </DialogContent>

      <QueryHistoryModal
        open={savedQueriesOpen}
        onOpenChange={setSavedQueriesOpen}
        onLoadQuery={handleLoadQuery}
      />
    </Dialog>
  )
}
