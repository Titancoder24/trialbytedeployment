"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  Trash2,
  X
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
}

export function QueryHistoryModal({
  open,
  onOpenChange,
  onLoadQuery,
  onEditQuery
}: QueryHistoryModalProps) {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedQueries, setSelectedQueries] = useState<string[]>([])

  const fetchSavedQueries = async () => {
    setLoading(true)
    setError("")

    try {
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/queries/saved/user/dashboard-queries`

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
          const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
          setSavedQueries(localQueries)
        } else {
          setSavedQueries(data.data || [])
        }
        return
      }

      const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
      setSavedQueries(localQueries)

    } catch (error) {
      console.error("Error fetching saved queries:", error)

      try {
        const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
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

      const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
      const updatedQueries = localQueries.filter((query: any) => query.id !== queryId)
      localStorage.setItem('unifiedSavedQueries', JSON.stringify(updatedQueries))

      toast({
        title: "Success",
        description: "Query deleted successfully",
      })

      await fetchSavedQueries()

    } catch (error) {
      console.error("Error deleting query:", error)

      try {
        const localQueries = JSON.parse(localStorage.getItem('unifiedSavedQueries') || '[]')
        const updatedQueries = localQueries.filter((query: any) => query.id !== queryId)
        localStorage.setItem('unifiedSavedQueries', JSON.stringify(updatedQueries))

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

  const editQuery = (query: SavedQuery) => {
    if (onEditQuery && query.query_data) {
      onEditQuery({
        ...query.query_data,
        queryId: query.id,
        queryTitle: query.title,
        queryDescription: query.description
      })
      toast({
        title: "Edit Query",
        description: `Opening Advanced Search with "${query.title}"`,
      })
      onOpenChange(false)
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
            <DialogTitle
              className="text-lg font-semibold"
              style={{ fontFamily: "Poppins, sans-serif", color: "#204B73" }}
            >
              Saved Queries
            </DialogTitle>
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

          {/* Table */}
          {!loading && (
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
                      <th className="px-4 py-3 text-center text-white font-medium" style={{ width: "150px" }}>Render</th>
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

                        {/* Render - Run button */}
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

        {/* Footer */}
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
      </DialogContent>
    </Dialog>
  )
}
