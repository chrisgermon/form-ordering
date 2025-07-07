"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"
import { MarkCompleteDialog } from "./MarkCompleteDialog"
import type { Submission } from "@/lib/types"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { RefreshCw, Eye, CheckCircle, FileText } from "lucide-react"

export function SubmissionsTable({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const columns: ColumnDef<Submission>[] = useMemo(
    () => [
      {
        accessorKey: "order_number",
        header: "Order #",
      },
      {
        accessorKey: "brands.name",
        header: "Brand",
        cell: ({ row }) => row.original.brands?.name || "N/A",
      },
      {
        accessorKey: "ordered_by",
        header: "Ordered By",
      },
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => format(new Date(row.getValue("created_at")), "dd MMM yyyy"),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              row.getValue("status") === "Complete" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {row.getValue("status") || "Pending"}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const submission = row.original
          return (
            <div className="flex items-center justify-end gap-2">
              {submission.pdf_url && (
                <Button asChild variant="ghost" size="icon">
                  <a href={submission.pdf_url} target="_blank" rel="noopener noreferrer" title="View PDF">
                    <FileText className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedSubmission(submission)
                  setIsDetailsOpen(true)
                }}
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {submission.status !== "Complete" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedSubmission(submission)
                    setIsCompleteOpen(true)
                  }}
                  title="Mark Complete"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [],
  )

  const filteredData = useMemo(() => {
    return submissions.filter((submission) => {
      const statusMatch = statusFilter === "all" || (submission.status || "Pending").toLowerCase() === statusFilter
      const submissionDate = new Date(submission.created_at)
      const dateMatch =
        !dateRange ||
        !dateRange.from ||
        (submissionDate >= dateRange.from && (!dateRange.to || submissionDate <= dateRange.to))
      return statusMatch && dateMatch
    })
  }, [submissions, statusFilter, dateRange])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <Input
            placeholder="Search all fields..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full md:max-w-sm"
          />
          <div className="flex w-full md:w-auto items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
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
              {table.getRowModel().rows?.length ? (
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
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
      <SubmissionDetailsDialog
        submission={selectedSubmission}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
      <MarkCompleteDialog
        submission={selectedSubmission}
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
      />
    </>
  )
}
