"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { addDays, format, startOfWeek, endOfWeek } from "date-fns"
import type { DateRange } from "react-day-picker"
import type { Brand, Submission } from "@/lib/types"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function SubmissionsTable({
  initialSubmissions,
  brands,
}: {
  initialSubmissions: Submission[]
  brands: Brand[]
}) {
  const [data, setData] = React.useState(initialSubmissions)
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "created_at", desc: true }])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [date, setDate] = React.useState<DateRange | undefined>()
  const [selectedSubmission, setSelectedSubmission] = React.useState<Submission | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)

  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: "order_number",
      header: "Order #",
    },
    {
      accessorFn: (row) => row.brands?.name,
      header: "Brand",
    },
    {
      accessorKey: "ordered_by",
      header: "Name",
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return format(date, "dd/MM/yyyy hh:mm a")
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "sent" ? "default" : "destructive"} className="capitalize">
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const submission = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSubmission(submission)
                setIsDetailsOpen(true)
              }}
            >
              View Details
            </Button>
            {submission.pdf_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={submission.pdf_url} target="_blank" rel="noopener noreferrer">
                  View PDF
                </a>
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
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

  React.useEffect(() => {
    let filteredData = initialSubmissions

    if (date?.from) {
      filteredData = filteredData.filter((submission) => {
        const submissionDate = new Date(submission.created_at)

        const fromDate = new Date(date.from!)
        fromDate.setHours(0, 0, 0, 0)

        const toDate = date.to ? new Date(date.to) : new Date(date.from!)
        toDate.setHours(23, 59, 59, 999)

        return submissionDate >= fromDate && submissionDate <= toDate
      })
    }

    setData(filteredData)
  }, [date, initialSubmissions])

  const downloadCSV = () => {
    const headers = ["Order #", "Brand", "Name", "Email", "Date", "Status", "IP Address", "Order Data"]
    const rows = table.getRowModel().rows.map((row) => {
      const sub = row.original
      const orderDataString = JSON.stringify(sub.order_data).replace(/"/g, '""')
      return [
        sub.order_number,
        sub.brands?.name,
        sub.ordered_by,
        sub.email,
        format(new Date(sub.created_at), "yyyy-MM-dd HH:mm:ss"),
        sub.status,
        sub.ip_address,
        `"${orderDataString}"`,
      ].join(",")
    })

    const csvContent = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `submissions-${new Date().toISOString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 py-4">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={(table.getColumn("Brand")?.getFilterValue() as string) ?? ""}
            onValueChange={(value) => table.getColumn("Brand")?.setFilterValue(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.name}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
            onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant={"outline"} className="w-[260px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex items-center p-2">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setDate({ from: new Date(), to: new Date() })}>
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDate({ from: addDays(new Date(), -1), to: addDays(new Date(), -1) })}
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDate({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) })}
                  >
                    This Week
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setDate(undefined)}>
                  Clear
                </Button>
              </div>
              <Separator />
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={downloadCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
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
      <SubmissionDetailsDialog
        submission={selectedSubmission}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  )
}
