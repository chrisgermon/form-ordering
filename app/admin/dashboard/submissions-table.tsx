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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronDown, Download } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { addDays, format } from "date-fns"
import type { DateRange } from "react-day-picker"
import type { Submission } from "@/lib/types"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"

export function SubmissionsTable({
  initialSubmissions,
  brands,
}: {
  initialSubmissions: Submission[]
  brands: { name: string }[]
}) {
  const [data, setData] = React.useState(initialSubmissions)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [date, setDate] = React.useState<DateRange | undefined>()
  const [selectedSubmission, setSelectedSubmission] = React.useState<Submission | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)

  const uniqueBrands = [...new Set(brands.map((b) => b.name))]
  const uniqueStatuses = [...new Set(data.map((s) => s.status))]

  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: "order_number",
      header: "Order #",
    },
    {
      accessorKey: "brand_name",
      header: "Brand",
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
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
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedSubmission(row.original)
            setIsDetailsOpen(true)
          }}
        >
          View
        </Button>
      ),
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
    if (date?.from && date?.to) {
      const filteredData = initialSubmissions.filter((submission) => {
        const submissionDate = new Date(submission.created_at)
        return submissionDate >= date.from! && submissionDate <= date.to!
      })
      setData(filteredData)
    } else {
      setData(initialSubmissions)
    }
  }, [date, initialSubmissions])

  const downloadCSV = () => {
    const headers = ["Order #", "Brand", "Name", "Email", "Date", "Status", "Order Data"]
    const rows = table.getRowModel().rows.map((row) => {
      const submission = row.original
      return [
        submission.order_number,
        submission.brand_name,
        submission.name,
        submission.email,
        format(new Date(submission.created_at), "dd/MM/yyyy hh:mm a"),
        submission.status,
        JSON.stringify(submission.order_data),
      ].join(",")
    })

    const csvContent = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
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
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto bg-transparent">
                Brand <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {uniqueBrands.map((brand) => (
                <DropdownMenuCheckboxItem
                  key={brand}
                  className="capitalize"
                  checked={
                    (table.getColumn("brand_name")?.getFilterValue() as string[] | undefined)?.includes(brand) ?? false
                  }
                  onCheckedChange={(value) => {
                    const currentFilter =
                      (table.getColumn("brand_name")?.getFilterValue() as string[] | undefined) || []
                    const newFilter = value ? [...currentFilter, brand] : currentFilter.filter((b) => b !== brand)
                    table.getColumn("brand_name")?.setFilterValue(newFilter.length ? newFilter : undefined)
                  }}
                >
                  {brand}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto bg-transparent">
                Status <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {uniqueStatuses.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  className="capitalize"
                  checked={
                    (table.getColumn("status")?.getFilterValue() as string[] | undefined)?.includes(status) ?? false
                  }
                  onCheckedChange={(value) => {
                    const currentFilter = (table.getColumn("status")?.getFilterValue() as string[] | undefined) || []
                    const newFilter = value ? [...currentFilter, status] : currentFilter.filter((s) => s !== status)
                    table.getColumn("status")?.setFilterValue(newFilter.length ? newFilter : undefined)
                  }}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant={"outline"} className="w-[300px] justify-start text-left font-normal">
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
              <div className="flex p-2 space-x-2">
                <Button variant="outline" size="sm" onClick={() => setDate({ from: new Date(), to: new Date() })}>
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDate({ from: addDays(new Date(), -1), to: addDays(new Date(), -1) })}
                >
                  Yesterday
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDate({ from: addDays(new Date(), -7), to: new Date() })}
                >
                  Last 7 Days
                </Button>
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
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
      <SubmissionDetailsDialog submission={selectedSubmission} isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
    </div>
  )
}
