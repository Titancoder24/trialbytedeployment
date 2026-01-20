"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { DrugFilterState } from "./drug-filter-modal"
import { DrugSearchCriteria } from "./drug-advanced-search-modal"

interface DrugSaveQueryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveSuccess?: () => void
  currentFilters: DrugFilterState
  currentSearchCriteria: DrugSearchCriteria[]
  searchTerm?: string
  editingQueryId?: string | null
  editingQueryTitle?: string
  editingQueryDescription?: string
}

export function DrugSaveQueryModal({ 
  open, 
  onOpenChange, 
  onSaveSuccess,
  currentFilters,
  currentSearchCriteria,
  searchTerm = "",
  editingQueryId = null,
  editingQueryTitle = "",
  editingQueryDescription = ""
}: DrugSaveQueryModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const isEditMode = editingQueryId !== null && editingQueryId !== ""

  const resetForm = () => {
    if (!isEditMode) {
      setTitle("")
      setDescription("")
    }
    setError("")
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  // Pre-populate form when in edit mode
  React.useEffect(() => {
    if (open && isEditMode) {
      setTitle(editingQueryTitle)
      setDescription(editingQueryDescription)
    } else if (open && !isEditMode) {
      setTitle("")
      setDescription("")
    }
  }, [open, isEditMode, editingQueryTitle, editingQueryDescription])

  const hasActiveFilters = () => {
    return Object.values(currentFilters).some(filter => filter.length > 0) || 
           currentSearchCriteria.length > 0 ||
           searchTerm.trim() !== ""
  }

  const getActiveFilterSummary = () => {
    const activeFilters: string[] = []
    
    Object.entries(currentFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        activeFilters.push(`${key}: ${values.length} selected`)
      }
    })
    
    if (currentSearchCriteria.length > 0) {
      activeFilters.push(`Advanced search: ${currentSearchCriteria.length} criteria`)
    }
    
    if (searchTerm.trim()) {
      activeFilters.push(`Search term: "${searchTerm}"`)
    }
    
    return activeFilters
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required")
      return
    }

    if (!hasActiveFilters()) {
      setError("No filters or search criteria to save")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Prepare the query data
      const queryData = {
        searchTerm: searchTerm || "",
        filters: currentFilters,
        searchCriteria: currentSearchCriteria,
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
            title: title.trim(),
            description: description.trim() || null,
            query_data: queryData,
            updated_at: new Date().toISOString()
          }
          localStorage.setItem('unifiedSavedQueries', JSON.stringify(existingQueries))
        }

        // Try to update in backend API
        try {
          const requestBody = {
            title: title.trim(),
            description: description.trim() || null,
            query_type: "drug_dashboard",
            query_data: queryData,
            filters: currentFilters
          }

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved/${editingQueryId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify(requestBody)
            }
          )

          if (response.ok) {
            const result = await response.json()
            console.log("Query updated in backend successfully:", result)
          } else {
            console.warn("Backend update failed, but query updated locally")
          }
        } catch (apiError) {
          console.warn("API update failed, but query updated locally:", apiError)
        }
      } else {
        // CREATE MODE: Create new query
        const localQuery = {
          id: Date.now().toString(),
          title: title.trim(),
          description: description.trim() || null,
          query_type: "drug_dashboard",
          query_data: queryData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const existingQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
        existingQueries.push(localQuery)
        localStorage.setItem('unifiedSavedQueries', JSON.stringify(existingQueries))

        // Try to save to backend API
        try {
          const requestBody = {
            title: title.trim(),
            description: description.trim() || null,
            query_type: "drug_dashboard",
            query_data: queryData,
            filters: currentFilters
          }

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify(requestBody)
            }
          )

          if (response.ok) {
            const result = await response.json()
            console.log("Query saved to backend successfully:", result)
          } else {
            console.warn("Backend save failed, but query saved locally")
          }
        } catch (apiError) {
          console.warn("API save failed, but query saved locally:", apiError)
        }
      }

      if (onSaveSuccess) {
        onSaveSuccess()
      }

      handleClose()
    } catch (error) {
      console.error("Error saving query:", error)
      setError("Failed to save query. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Update Drug Query" : "Save Current Drug Query"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Current Query Includes:</h4>
              <ul className="text-xs space-y-1 text-gray-600">
                {getActiveFilterSummary().map((filter, index) => (
                  <li key={index}>• {filter}</li>
                ))}
              </ul>
            </div>
          )}

          {!hasActiveFilters() && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No filters or search criteria are currently active. Apply some filters before saving.
              </AlertDescription>
            </Alert>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Query Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a name for this query"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this query is for..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !hasActiveFilters()}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update Query" : "Save Query"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
