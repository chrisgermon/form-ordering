"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
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
import type { SubmissionWithBrand } from "@/lib/types"
import { RefreshCw } from "lucide-react"

export function SubmissionsTable({ submissions }: { submissions: SubmissionWithBrand[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
  })

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (globalFilter) {
      params.set("search", globalFilter)
    } else {
      params.delete("search")
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter)
    } else {
      params.delete("status")
    }
    if (dateRange.from) {
      params.set("from", dateRange.from.toISOString().split("T")[0])
    } else {
      params.delete("from")
    }
    if (dateRange.to) {
      params.set("to", dateRange.to.toISOString().split("T")[0])
    } else {
      params.delete("to")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }, [globalFilter, statusFilter, dateRange, router, pathname, searchParams])

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const submissionDate = new Date(submission.created_at)
      const fromDate = dateRange.from
      const toDate = dateRange.to

      const dateMatch =
        (!fromDate || submissionDate >= fromDate) &&
        (!toDate || submissionDate <= new Date(toDate.getTime() + 86400000)) // Include the whole 'to' day

      const statusMatch = statusFilter === "all" || submission.status === statusFilter

      return dateMatch && statusMatch
    })
  }, [submissions, dateRange, statusFilter])

  const columns: ColumnDef<SubmissionWithBrand>[] = [
    {
      accessorKey: "order_number",
      header: "Order #",
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
    },
    {
      accessorKey: "brands.name",
      header: "Brand",
    },
    {
      accessorKey: "patient_name",
      header: "Patient Name",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const submission = row.original
        return (
          <div className="flex gap-2">
            <SubmissionDetailsDialog submission={submission} />
            {submission.status === "Pending" && <MarkCompleteDialog submission={submission} />}
          </div>
        )
      },
    },
  ]

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
    <div>
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Search all fields..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Complete">Complete</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Button variant="outline" size="icon" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4" />
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
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  )
}
