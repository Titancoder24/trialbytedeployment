"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  Trash2,
  X,
  Edit,
  ArrowLeft,
  Save,
  Calendar
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SavedQuery {
  id: string
  title: string
  description: string | null
  query_type?: string
  query_data?: {
    searchTerm: string
    filters: any
    searchCriteria: any[]
    savedAt: string
  }
  created_at: string
  updated_at: string
}

interface QueryHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadQuery?: (queryData: any) => void
  onEditQuery?: (queryData: any) => void
  storageKey?: string
  queryType?: string
}

export function QueryHistoryModal({
  open,
  onOpenChange,
  onLoadQuery,
  onEditQuery,
  storageKey = "unifiedSavedQueries",
  queryType = "dashboard"
}: QueryHistoryModalProps) {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedQueries, setSelectedQueries] = useState<string[]>([])

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingQuery, setEditingQuery] = useState<SavedQuery | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDate, setEditDate] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const fetchSavedQueries = async () => {
    setLoading(true)
    setError("")

    try {
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved/user/${queryType}-queries`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()

        if (!data.data || data.data.length === 0) {
          const localQueries = JSON.parse(localStorage.getItem(storageKey) || '[]')
          setSavedQueries(localQueries)
        } else {
          setSavedQueries(data.data || [])
        }
        return
      }

      const localQueries = JSON.parse(localStorage.getItem(storageKey) || '[]')
      setSavedQueries(localQueries)

    } catch (error) {
      console.error("Error fetching saved queries:", error)

      try {
        const localQueries = JSON.parse(localStorage.getItem(storageKey) || '[]')
        setSavedQueries(localQueries)
        setError("")
      } catch (localError) {
        setError("Failed to load saved queries")
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteSavedQuery = async (queryId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved/${queryId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Query deleted successfully",
        })
        await fetchSavedQueries()
        return
      }

      const localQueries = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const updatedQueries = localQueries.filter((query: any) => query.id !== queryId)
      localStorage.setItem(storageKey, JSON.stringify(updatedQueries))

      toast({
        title: "Success",
        description: "Query deleted successfully",
      })

      await fetchSavedQueries()

    } catch (error) {
      console.error("Error deleting query:", error)

      try {
        const localQueries = JSON.parse(localStorage.getItem(storageKey) || '[]')
        const updatedQueries = localQueries.filter((query: any) => query.id !== queryId)
        localStorage.setItem(storageKey, JSON.stringify(updatedQueries))

        toast({
          title: "Success",
          description: "Query deleted successfully",
        })

        await fetchSavedQueries()
      } catch (localError) {
        console.error("Failed to delete from localStorage:", localError)
        toast({
          title: "Error",
          description: "Failed to delete query",
          variant: "destructive",
        })
      }
    }
  }

  const deleteSelectedQueries = async () => {
    for (const queryId of selectedQueries) {
      await deleteSavedQuery(queryId)
    }
    setSelectedQueries([])
  }

  const loadQuery = (query: SavedQuery) => {
    if (onLoadQuery && query.query_data) {
      onLoadQuery({
        ...query.query_data,
        queryId: query.id,
        queryTitle: query.title,
        queryDescription: query.description
      })
      toast({
        title: "Query Loaded",
        description: `"${query.title}" has been applied to your current view`,
      })
      onOpenChange(false)
    }
  }

  const startEditQuery = (query: SavedQuery) => {
    // If onEditQuery callback is provided, use it to open the original modal
    // (Filter or Advanced Search) with pre-populated values
    if (onEditQuery && query.query_data) {
      onEditQuery({
        ...query.query_data,
        queryId: query.id,
        queryTitle: query.title,
        queryDescription: query.description,
        queryCreatedAt: query.created_at
      })
      onOpenChange(false) // Close this modal
      return
    }

    // Fallback to inline edit mode if no callback provided
    setEditingQuery(query)
    setEditTitle(query.title || "")
    setEditDescription(query.description || "")
    // Format date for input (YYYY-MM-DD) - use current date
    const date = new Date()
    setEditDate(date.toISOString().split('T')[0])
    setIsEditMode(true)
  }

  const cancelEdit = () => {
    setIsEditMode(false)
    setEditingQuery(null)
    setEditTitle("")
    setEditDescription("")
    setEditDate("")
  }

  const saveEditedQuery = async () => {
    if (!editingQuery) return

    setIsSaving(true)

    try {
      // Try API first
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved/${editingQuery.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: editTitle,
            description: editDescription,
            created_at: new Date(editDate).toISOString(),
          }),
        }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Query updated successfully",
        })
        await fetchSavedQueries()
        cancelEdit()
        return
      }

      // Fallback to localStorage
      const localQueries = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const updatedQueries = localQueries.map((q: SavedQuery) =>
        q.id === editingQuery.id
          ? { ...q, title: editTitle, description: editDescription, created_at: new Date(editDate).toISOString() }
          : q
      )
      localStorage.setItem(storageKey, JSON.stringify(updatedQueries))

      toast({
        title: "Success",
        description: "Query updated successfully",
      })
      await fetchSavedQueries()
      cancelEdit()

    } catch (error) {
      console.error("Error updating query:", error)

      // Fallback to localStorage
      try {
        const localQueries = JSON.parse(localStorage.getItem(storageKey) || '[]')
        const updatedQueries = localQueries.map((q: SavedQuery) =>
          q.id === editingQuery.id
            ? { ...q, title: editTitle, description: editDescription, created_at: new Date(editDate).toISOString() }
            : q
        )
        localStorage.setItem(storageKey, JSON.stringify(updatedQueries))

        toast({
          title: "Success",
          description: "Query updated successfully",
        })
        await fetchSavedQueries()
        cancelEdit()
      } catch (localError) {
        toast({
          title: "Error",
          description: "Failed to update query",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSelectQuery = (queryId: string) => {
    setSelectedQueries(prev =>
      prev.includes(queryId)
        ? prev.filter(id => id !== queryId)
        : [...prev, queryId]
    )
  }

  useEffect(() => {
    if (open) {
      fetchSavedQueries()
      setSelectedQueries([])
      setIsEditMode(false)
      setEditingQuery(null)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[85vh] p-0 rounded-lg overflow-hidden flex flex-col [&>button]:hidden"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {/* Header */}
        <DialogHeader
          className="px-6 py-4 border-b relative"
          style={{ backgroundColor: "#C3E9FB" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEditMode && (
                <button
                  onClick={cancelEdit}
                  className="p-1 hover:opacity-80 rounded"
                  style={{ color: "#204B73" }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <DialogTitle
                className="text-lg font-semibold"
                style={{ fontFamily: "Poppins, sans-serif", color: "#204B73" }}
              >
                {isEditMode ? "Edit Query" : "Saved Queries"}
              </DialogTitle>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-full p-1 hover:opacity-80"
              style={{ backgroundColor: "#204B73" }}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading saved queries...</span>
            </div>
          )}

          {/* Edit Mode View */}
          {!loading && isEditMode && editingQuery && (
            <div className="flex-1 overflow-auto">
              {/* Query Criteria (Read-only) */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-sm font-semibold text-[#204B73] mb-3">Query Criteria</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {editingQuery.query_data?.searchTerm && (
                    <div><span className="font-medium">Search Term:</span> {editingQuery.query_data.searchTerm}</div>
                  )}
                  {editingQuery.query_data?.searchCriteria && editingQuery.query_data.searchCriteria.length > 0 && (
                    <div>
                      <span className="font-medium">Criteria:</span>
                      <ul className="list-disc list-inside ml-2">
                        {editingQuery.query_data.searchCriteria.map((c: any, i: number) => (
                          <li key={i}>{c.field} {c.operator} {c.value}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {editingQuery.query_data?.filters && Object.keys(editingQuery.query_data.filters).some(k => {
                    const val = editingQuery.query_data?.filters[k];
                    return Array.isArray(val) ? val.length > 0 : val;
                  }) && (
                      <div>
                        <span className="font-medium">Filters:</span>
                        <ul className="list-disc list-inside ml-2">
                          {Object.entries(editingQuery.query_data.filters).map(([key, value]: [string, any]) => {
                            if (Array.isArray(value) && value.length > 0) {
                              return <li key={key}>{key}: {value.join(", ")}</li>
                            } else if (value && !Array.isArray(value)) {
                              return <li key={key}>{key}: {String(value)}</li>
                            }
                            return null;
                          })}
                        </ul>
                      </div>
                    )}
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#204B73] mb-2">
                    Query Title *
                  </label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter query title"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#204B73] mb-2">
                    Description
                  </label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Enter query description"
                    className="w-full min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#204B73] mb-2">
                    <Calendar className="h-4 w-4 inline-block mr-1" />
                    Date
                  </label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full max-w-[200px]"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEditedQuery}
                  disabled={!editTitle.trim() || isSaving}
                  className="px-4 py-2 text-white"
                  style={{ backgroundColor: "#204B73" }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* List View */}
          {!loading && !isEditMode && (
            <div className="flex-1 overflow-auto border rounded-lg">
              {savedQueries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No saved queries yet
                </div>
              ) : (
                <table className="w-full" style={{ fontSize: "12px" }}>
                  {/* Table Header */}
                  <thead>
                    <tr style={{ backgroundColor: "#204B73" }}>
                      <th className="px-4 py-3 text-left text-white font-medium" style={{ width: "80px" }}>S.no</th>
                      <th className="px-4 py-3 text-left text-white font-medium" style={{ width: "180px" }}>Query Title</th>
                      <th className="px-4 py-3 text-center text-white font-medium" style={{ width: "120px" }}>Date</th>
                      <th className="px-4 py-3 text-center text-white font-medium">Description</th>
                      <th className="px-4 py-3 text-center text-white font-medium" style={{ width: "180px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedQueries.map((query, index) => (
                      <tr
                        key={query.id}
                        className="border-b hover:bg-gray-50"
                        style={{ borderColor: "#DFE1E7" }}
                      >
                        {/* S.no with Checkbox */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedQueries.includes(query.id)}
                              onCheckedChange={() => toggleSelectQuery(query.id)}
                              className="border-gray-400"
                            />
                            <span>{index + 1}</span>
                          </div>
                        </td>

                        {/* Query Title */}
                        <td className="px-4 py-3 font-medium">
                          {query.title}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-center text-gray-600">
                          {query.created_at ? new Date(query.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'N/A'}
                        </td>

                        {/* Description */}
                        <td className="px-4 py-3 text-center text-gray-600">
                          {query.description || "No description"}
                        </td>

                        {/* Actions - Run and Edit buttons */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => loadQuery(query)}
                              className="px-4 py-1 text-white border-0 rounded-lg hover:opacity-80"
                              style={{ backgroundColor: "#204B73", fontSize: "11px" }}
                            >
                              Run
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditQuery(query)}
                              className="px-3 py-1 border rounded-lg hover:opacity-80 flex items-center gap-1"
                              style={{ borderColor: "#204B73", color: "#204B73", fontSize: "11px" }}
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Footer - only show in list view */}
        {!isEditMode && (
          <div
            className="flex items-center justify-end gap-3 px-6 py-3 border-t"
          >
            <Button
              onClick={deleteSelectedQueries}
              disabled={selectedQueries.length === 0}
              className="border-0 rounded-lg px-4 py-2 flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "#204B73", fontFamily: "Poppins, sans-serif", color: "white", fontSize: "12px" }}
            >
              <Trash2 className="h-4 w-4" />
              Remove Selected Queries
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
