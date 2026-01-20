"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Loader2, 
  AlertCircle, 
  Search, 
  Calendar, 
  Play,
  X,
  Clock,
  Info
} from "lucide-react"

interface QueryLog {
  id: string
  queryId: string
  queryTitle: string
  queryDescription?: string
  executedAt: string
  executedBy?: string
  queryType: 'advanced_search' | 'filter' | 'saved_query'
  criteria?: any[]
  filters?: any
  searchTerm?: string
  resultCount?: number
  executionTime?: number // in milliseconds
}

// Helper function to calculate days remaining until deletion
const getDaysRemaining = (executedAt: string): number => {
  const executedDate = new Date(executedAt)
  const currentDate = new Date()
  const daysPassed = Math.floor((currentDate.getTime() - executedDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, 30 - daysPassed)
}

// Helper function to check if a log is older than 30 days
const isLogExpired = (executedAt: string): boolean => {
  const executedDate = new Date(executedAt)
  const currentDate = new Date()
  const daysPassed = Math.floor((currentDate.getTime() - executedDate.getTime()) / (1000 * 60 * 60 * 24))
  return daysPassed >= 30
}

interface QueryLogsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExecuteQuery?: (queryData: any) => void
}

export function QueryLogsModal({ open, onOpenChange, onExecuteQuery }: QueryLogsModalProps) {
  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [deletedCount, setDeletedCount] = useState<number>(0)

  // Load query logs from localStorage and auto-delete expired ones
  const loadQueryLogs = async () => {
    setLoading(true)
    setError("")
    setDeletedCount(0)
    
    try {
      const logs = JSON.parse(localStorage.getItem('queryExecutionLogs') || '[]')
      console.log("Loaded query logs:", logs)
      
      // Filter out expired logs (older than 30 days)
      const validLogs = logs.filter((log: QueryLog) => !isLogExpired(log.executedAt))
      const expiredCount = logs.length - validLogs.length
      
      // If any logs were deleted, update localStorage
      if (expiredCount > 0) {
        localStorage.setItem('queryExecutionLogs', JSON.stringify(validLogs))
        setDeletedCount(expiredCount)
        console.log(`Auto-deleted ${expiredCount} expired log(s)`)
      }
      
      setQueryLogs(validLogs)
    } catch (error) {
      console.error("Error loading query logs:", error)
      setError("Failed to load query logs")
    } finally {
      setLoading(false)
    }
  }

  // Load logs when modal opens
  useEffect(() => {
    if (open) {
      loadQueryLogs()
    }
  }, [open])

  // Filter logs based on search term and type - debounced
  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        // Filtering is done directly in the render
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, filterType, open])

  // Filter logs based on search term and type
  const filteredLogs = queryLogs.filter(log => {
    const matchesSearch = !searchTerm.trim() || 
      log.queryTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.queryDescription?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === "all" || log.queryType === filterType
    
    return matchesSearch && matchesType
  })

  // Execute query from log
  const executeQuery = (log: QueryLog) => {
    if (onExecuteQuery) {
      const queryData = {
        searchTerm: log.searchTerm || "",
        filters: log.filters || {},
        searchCriteria: log.criteria || [],
        queryId: log.queryId,
        queryTitle: log.queryTitle,
        queryDescription: log.queryDescription
      }
      onExecuteQuery(queryData)
      onOpenChange(false)
    }
  }

  // Get query type badge
  const getQueryTypeBadge = (type: string) => {
    switch (type) {
      case 'advanced_search':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Advanced Search</Badge>
      case 'filter':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Filter</Badge>
      case 'saved_query':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Saved Query</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  // Format date similar to QueryHistoryModal
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get log details summary
  const getLogSummary = (log: QueryLog) => {
    const parts = []
    if (log.searchTerm) parts.push(`Search: "${log.searchTerm}"`)
    if (log.criteria && log.criteria.length > 0) parts.push(`${log.criteria.length} criteria`)
    if (log.resultCount !== undefined) parts.push(`${log.resultCount} results`)
    
    return parts.length > 0 ? parts.join(", ") : "No details"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Query Execution Logs</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Retention Policy Banner - Permanent */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Retention Policy:</strong> Query log executions will be automatically removed after 30 days.
            </AlertDescription>
          </Alert>

          {/* Auto-Cleanup Notification */}
          {deletedCount > 0 && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Auto-Cleanup:</strong> {deletedCount} expired log{deletedCount > 1 ? 's' : ''} 
                {deletedCount > 1 ? ' have' : ' has'} been automatically removed (older than 30 days).
              </AlertDescription>
            </Alert>
          )}

          {/* Search and Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search query logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="advanced_search">Advanced Search</option>
              <option value="filter">Filter</option>
              <option value="saved_query">Saved Query</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading query logs...</span>
            </div>
          )}

          {/* Results */}
          {!loading && (
            <div className="flex-1 overflow-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || filterType !== "all" 
                    ? "No logs found matching your search" 
                    : "No query logs yet"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Executed</TableHead>
                      <TableHead>Expires In</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <span>{log.queryTitle}</span>
                            {getQueryTypeBadge(log.queryType)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm text-gray-600">
                            {log.queryDescription || "No description"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {getLogSummary(log)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(log.executedAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const daysRemaining = getDaysRemaining(log.executedAt)
                            let badgeColor = "bg-green-100 text-green-800 border-green-200"
                            if (daysRemaining <= 7) badgeColor = "bg-red-100 text-red-800 border-red-200"
                            else if (daysRemaining <= 14) badgeColor = "bg-yellow-100 text-yellow-800 border-yellow-200"
                            
                            return (
                              <Badge variant="outline" className={`${badgeColor} text-xs`}>
                                <Clock className="h-3 w-3 mr-1" />
                                {daysRemaining === 0 
                                  ? "Today" 
                                  : `${daysRemaining}d`
                                }
                              </Badge>
                            )
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => executeQuery(log)}
                              title="Execute this query"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
