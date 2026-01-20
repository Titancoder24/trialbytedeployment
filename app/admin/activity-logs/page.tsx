"use client"

import { useEffect, useMemo, useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { activityLogsApi, type LogItem } from "@/app/_lib/api"
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"

const columnHelper = createColumnHelper<LogItem>()

export default function ActivityLogsPage() {
  const [data, setData] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const [serverFilters, setServerFilters] = useState({
    userId: "",
    tableName: "",
    actionType: "",
    from: "",
    to: "",
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor("user_id", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            User
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => info.getValue() || "-",
      }),
      columnHelper.accessor("table_name", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Table
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("record_id", {
        header: "Record ID",
        cell: (info) => <span className="font-mono text-xs">{info.getValue() || "-"}</span>,
      }),
      columnHelper.accessor("action_type", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Action
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              info.getValue() === "INSERT"
                ? "bg-green-100 text-green-800"
                : info.getValue() === "UPDATE"
                  ? "bg-blue-100 text-blue-800"
                  : info.getValue() === "DELETE"
                    ? "bg-red-100 text-red-800"
                    : info.getValue() === "APPROVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : info.getValue() === "REJECT"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-gray-100 text-gray-800"
            }`}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await activityLogsApi.list({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        userId: serverFilters.userId || undefined,
        tableName: serverFilters.tableName || undefined,
        actionType: serverFilters.actionType || undefined,
        from: serverFilters.from || undefined,
        to: serverFilters.to || undefined,
      })
      setData(response.items)
      setTotal(response.total)
    } catch (error) {
      console.error("Failed to fetch activity logs:", error)
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination.pageIndex, pagination.pageSize, serverFilters])

  const handleServerFilterChange = (key: keyof typeof serverFilters, value: string) => {
    setServerFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Activity Logs</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                placeholder="Search by user id"
                value={serverFilters.userId}
                onChange={(e) => handleServerFilterChange("userId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Table</Label>
              <Input
                placeholder="e.g. users"
                value={serverFilters.tableName}
                onChange={(e) => handleServerFilterChange("tableName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={serverFilters.actionType || "ALL"}
                onValueChange={(v) => handleServerFilterChange("actionType", v === "ALL" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="INSERT">INSERT</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="APPROVE">APPROVE</SelectItem>
                  <SelectItem value="REJECT">REJECT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>From</Label>
                <Input
                  type="date"
                  value={serverFilters.from}
                  onChange={(e) => handleServerFilterChange("from", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Input
                  type="date"
                  value={serverFilters.to}
                  onChange={(e) => handleServerFilterChange("to", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Logs ({total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} of {total} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={pagination.pageIndex === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={pagination.pageIndex >= Math.ceil(total / pagination.pageSize) - 1 || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
