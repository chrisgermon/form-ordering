"use client"
import { useState, useMemo, useEffect } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { MoreHorizontal, FileDown, CheckCircle, Search } from "lucide-react"
import { toast } from "sonner"

import type { Submission } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"
import { MarkCompleteDialog } from "./MarkCompleteDialog"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ClientOnly } from "@/components/client-only"

export function SubmissionsTable({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions || [])
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "Pending" | "Completed">("all")
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isMarkCompleteOpen, setIsMarkCompleteOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    setSubmissions(initialSubmissions || [])
  }, [initialSubmissions])

  const handleDownloadPdf = async (pdfUrl: string | null, orderNumber: string | null) => {
    if (!pdfUrl) {
      toast.error("No PDF available for this submission.")
      return
    }
    try {
      const response = await fetch(pdfUrl)
      if (!response.ok) throw new Error("PDF download failed")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `order-${orderNumber || "details"}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success("PDF downloaded.")
    } catch (error) {
      toast.error("Failed to download PDF.")
      console.error(error)
    }
  }

  const handleMarkComplete = (submission: Submission) => {
    setSelectedSubmission(submission)
    setIsMarkCompleteOpen(true)
  }

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission)
    setIsDetailsOpen(true)
  }

  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const statusClass = status === "Completed" ? "text-green-600 bg-green-100" : "text-yellow-600 bg-yellow-100"
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>{status}</span>
      },
    },
    {
      accessorKey: "brands.name",
      header: "Brand",
      cell: ({ row }) => {
        const brand = row.original.brands
        return brand ? brand.name : <span className="text-muted-foreground">N/A</span>
      },
    },
    {
      accessorKey: "ordered_by",
      header: "Ordered By",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "created_at",
      header: "Date Submitted",
      cell: ({ row }) => (
        <ClientOnly>
          <span>{new Date(row.getValue("created_at")).toLocaleString()}</span>
        </ClientOnly>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const submission = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewDetails(submission)}>View Details</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownloadPdf(submission.pdf_url, submission.order_number)}
                disabled={!submission.pdf_url}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleMarkComplete(submission)}
                disabled={submission.status === "Completed"}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Complete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const filteredSubmissions = useMemo(() => {
    let filtered = submissions || []

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter)
    }

    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.ordered_by?.toLowerCase().includes(lowercasedFilter) ||
          s.email?.toLowerCase().includes(lowercasedFilter) ||
          s.brands?.name?.toLowerCase().includes(lowercasedFilter) ||
          s.order_number?.toLowerCase().includes(lowercasedFilter),
      )
    }

    const [startDate, endDate] = dateRange
    if (startDate) {
      filtered = filtered.filter((s) => new Date(s.created_at) >= startDate)
    }
    if (endDate) {
      // Add 1 day to the end date to make the range inclusive
      const inclusiveEndDate = new Date(endDate)
      inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1)
      filtered = filtered.filter((s) => new Date(s.created_at) < inclusiveEndDate)
    }

    return filtered
  }, [submissions, searchTerm, statusFilter, dateRange])

  const table = useReactTable({
    data: filteredSubmissions || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 py-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker className="w-full sm:w-auto" value={dateRange} onChange={setDateRange} />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
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
      </CardContent>

      {selectedSubmission && (
        <>
          <SubmissionDetailsDialog
            submission={selectedSubmission}
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
          />
          <MarkCompleteDialog
            submission={selectedSubmission}
            isOpen={isMarkCompleteOpen}
            onClose={() => setIsMarkCompleteOpen(false)}
          />
        </>
      )}
    </Card>
  )
}
