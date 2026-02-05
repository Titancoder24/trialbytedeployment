"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, X } from "lucide-react"

interface SaveQueryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveSuccess?: () => void
  currentFilters: Record<string, string[]>
  currentSearchCriteria: any[]
  searchTerm?: string
  editingQueryId?: string | null
  editingQueryTitle?: string
  editingQueryDescription?: string
  storageKey?: string
  queryType?: string
  sourceModal?: "filter" | "advanced"
}

export function SaveQueryModal({
  open,
  onOpenChange,
  onSaveSuccess,
  currentFilters,
  currentSearchCriteria,
  searchTerm = "",
  editingQueryId = null,
  editingQueryTitle = "",
  editingQueryDescription = "",
  storageKey = "unifiedSavedQueries",
  queryType = "dashboard",
  sourceModal
}: SaveQueryModalProps) {
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
    // Debug logging
    console.log("SaveQueryModal - currentFilters:", currentFilters);
    console.log("SaveQueryModal - currentSearchCriteria:", currentSearchCriteria);
    console.log("SaveQueryModal - searchTerm:", searchTerm);

    const hasFilters = currentFilters && Object.values(currentFilters).some(filter =>
      Array.isArray(filter) && filter.length > 0
    );
    const hasCriteria = currentSearchCriteria && currentSearchCriteria.length > 0;
    const hasSearch = searchTerm && searchTerm.trim() !== "";

    console.log("hasFilters:", hasFilters, "hasCriteria:", hasCriteria, "hasSearch:", hasSearch);

    return hasFilters || hasCriteria || hasSearch;
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
        savedAt: new Date().toISOString(),
        sourceModal: sourceModal // Add origin tracking
      }

      if (isEditMode && editingQueryId) {
        // UPDATE MODE: Update existing query
        const existingQueries = JSON.parse(localStorage.getItem(storageKey) || '[]')
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
          localStorage.setItem(storageKey, JSON.stringify(existingQueries))
        }

        // Try to update in backend API
        try {
          const requestBody = {
            title: title.trim(),
            description: description.trim() || null,
            query_type: queryType,
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
          query_type: queryType,
          query_data: queryData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const existingQueries = JSON.parse(localStorage.getItem(storageKey) || '[]')
        existingQueries.push(localQuery)
        localStorage.setItem(storageKey, JSON.stringify(existingQueries))

        // Try to save to backend API
        try {
          const requestBody = {
            title: title.trim(),
            description: description.trim() || null,
            query_type: queryType,
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
      <DialogContent
        className="max-w-lg p-0 rounded-lg overflow-hidden [&>button]:hidden"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {/* Header */}
        <DialogHeader
          className="px-6 py-4 border-b relative"
          style={{ backgroundColor: "#C3E9FB" }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle
              className="text-lg font-semibold"
              style={{ fontFamily: "Poppins, sans-serif", color: "#204B73" }}
            >
              Save This Query
            </DialogTitle>
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-1 hover:opacity-80"
              style={{ backgroundColor: "#204B73" }}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h4 className="font-medium text-sm mb-2 text-gray-700">Current Query Includes:</h4>
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

          {/* Title Field */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Enter the query Title<span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=""
              className="mt-2 border-0 rounded-lg"
              style={{ backgroundColor: "#F0F0F0", fontFamily: "Poppins, sans-serif" }}
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=""
              className="mt-2 border-0 rounded-lg resize-none"
              style={{ backgroundColor: "#F0F0F0", fontFamily: "Poppins, sans-serif" }}
              rows={5}
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2 rounded-lg text-white hover:opacity-90"
              style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif" }}
            >
              Close
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !title.trim()}
              className="px-6 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif" }}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
