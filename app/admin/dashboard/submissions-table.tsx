"use client"

import { useState, useMemo } from "react"
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
import { MoreHorizontal, ArrowUpDown, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"
import { MarkCompleteDialog } from "./MarkCompleteDialog"
import type { Submission } from "@/lib/types"
import { useRouter } from "next/navigation"
import type { DateRange } from "react-day-picker"

type SubmissionsTableProps = {
  initialSubmissions: Submission[]
}

export function SubmissionsTable({ initialSubmissions }: SubmissionsTableProps) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const [isDetailsOpen, setDetailsOpen] = useState(false)
  const [isMarkCompleteOpen, setMarkCompleteOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  const handleRefresh = () => {
    router.refresh()
  }

  const openDetailsDialog = (submission: Submission) => {
    setSelectedSubmission(submission)
    setDetailsOpen(true)
  }

  const openMarkCompleteDialog = (submission: Submission) => {
    setSelectedSubmission(submission)
    setMarkCompleteOpen(true)
  }

  const columns: ColumnDef<Submission>[] = useMemo(
    () => [
      {
        accessorKey: "brands.name",
        header: "Brand",
        cell: ({ row }) => <div>{row.original.brands?.name || "N/A"}</div>,
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Submitted At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleString(),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <div className="capitalize">{row.getValue("status")}</div>,
      },
      {
        accessorKey: "customer_name",
        header: "Customer Name",
      },
      {
        accessorKey: "customer_email",
        header: "Customer Email",
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
                <DropdownMenuItem onClick={() => openDetailsDialog(submission)}>View Details</DropdownMenuItem>
                {submission.status !== "Complete" && (
                  <DropdownMenuItem onClick={() => openMarkCompleteDialog(submission)}>
                    Mark as Complete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [],
  )

  const filteredSubmissions = useMemo(() => {
    let data = [...submissions]
    if (dateRange?.from && dateRange?.to) {
      data = data.filter((submission) => {
        const submissionDate = new Date(submission.created_at)
        return submissionDate >= dateRange.from! && submissionDate <= dateRange.to!
      })
    }
    return data
  }, [submissions, dateRange])

  const table = useReactTable({
    data: filteredSubmissions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Search all fields..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Complete">Complete</SelectItem>
          </SelectContent>
        </Select>
        <DateRangePicker onUpdate={({ range }) => setDateRange(range)} />
        <Button onClick={handleRefresh} variant="outline" className="ml-auto bg-transparent">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
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
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
      {selectedSubmission && (
        <>
          <SubmissionDetailsDialog
            isOpen={isDetailsOpen}
            onClose={() => setDetailsOpen(false)}
            submission={selectedSubmission}
          />
          <MarkCompleteDialog
            isOpen={isMarkCompleteOpen}
            onClose={() => setMarkCompleteOpen(false)}
            submission={selectedSubmission}
          />
        </>
      )}
    </div>
  )
}
