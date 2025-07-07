"use client"
import { useState, useMemo, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"
import { MarkCompleteDialog } from "./MarkCompleteDialog"
import { ClientOnly } from "@/components/client-only"
import type { Submission, Brand } from "@/lib/types"
import type { DateRange } from "react-day-picker"
import { ArrowUpDown, ChevronDown, ChevronUp, Download, RefreshCw, Search, FileCheck2, FileClock } from "lucide-react"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 15

type SortKey = "order_number" | "created_at" | "brand_name" | "status"
type SortDirection = "asc" | "desc"

export function SubmissionsTable({
  initialSubmissions,
  brands,
}: {
  initialSubmissions: Submission[]
  brands: Brand[]
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isMarkCompleteOpen, setIsMarkCompleteOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [brandFilter, setBrandFilter] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [isRefreshing, startRefreshTransition] = useTransition()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleRefresh = () => {
    startRefreshTransition(async () => {
      try {
        const response = await fetch(`/api/admin/submissions?${searchParams.toString()}`)
        if (!response.ok) throw new Error("Failed to fetch submissions")
        const data = await response.json()
        setSubmissions(data)
        toast.success("Submissions refreshed successfully.")
      } catch (error) {
        toast.error("Failed to refresh submissions.")
        console.error(error)
      }
    })
  }

  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = submissions

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.order_number.toString().includes(lowercasedTerm) ||
          s.ordered_by.toLowerCase().includes(lowercasedTerm) ||
          s.brand_name.toLowerCase().includes(lowercasedTerm),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter)
    }

    if (brandFilter !== "all") {
      filtered = filtered.filter((s) => s.brand_slug === brandFilter)
    }

    if (dateRange?.from) {
      filtered = filtered.filter((s) => new Date(s.created_at) >= dateRange.from!)
    }
    if (dateRange?.to) {
      // Add 1 day to the 'to' date to make the range inclusive
      const inclusiveToDate = new Date(dateRange.to)
      inclusiveToDate.setDate(inclusiveToDate.getDate() + 1)
      filtered = filtered.filter((s) => new Date(s.created_at) < inclusiveToDate)
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [submissions, searchTerm, statusFilter, brandFilter, dateRange, sortKey, sortDirection])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("desc")
    }
  }

  const renderSortArrow = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    return sortDirection === "desc" ? <ChevronDown className="ml-2 h-4 w-4" /> : <ChevronUp className="ml-2 h-4 w-4" />
  }

  const handleDownloadCSV = () => {
    const headers = [
      "Order Number",
      "Status",
      "Brand",
      "Ordered By",
      "Submission Date",
      "Dispatch Date",
      "Tracking Link",
      "Notes",
    ]
    const rows = filteredAndSortedSubmissions.map((s) => [
      s.order_number,
      s.status,
      s.brand_name,
      s.ordered_by,
      new Date(s.created_at).toLocaleDateString(),
      s.dispatch_date ? new Date(s.dispatch_date).toLocaleDateString() : "N/A",
      s.tracking_link || "N/A",
      s.completion_notes || "N/A",
    ])

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `submissions_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order #, name, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.slug}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <ClientOnly>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </ClientOnly>
          <Button variant="outline" onClick={handleDownloadCSV} disabled={filteredAndSortedSubmissions.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("order_number")} className="cursor-pointer">
                  <div className="flex items-center">Order #{renderSortArrow("order_number")}</div>
                </TableHead>
                <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                  <div className="flex items-center">Status{renderSortArrow("status")}</div>
                </TableHead>
                <TableHead onClick={() => handleSort("brand_name")} className="cursor-pointer">
                  <div className="flex items-center">Brand{renderSortArrow("brand_name")}</div>
                </TableHead>
                <TableHead>Ordered By</TableHead>
                <TableHead onClick={() => handleSort("created_at")} className="cursor-pointer">
                  <div className="flex items-center">Submitted{renderSortArrow("created_at")}</div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSubmissions.length > 0 ? (
                filteredAndSortedSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.order_number}</TableCell>
                    <TableCell>
                      {submission.status === "completed" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FileCheck2 className="mr-1.5 h-3 w-3" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <FileClock className="mr-1.5 h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{submission.brand_name}</TableCell>
                    <TableCell>{submission.ordered_by}</TableCell>
                    <TableCell>
                      <ClientOnly>
                        {new Date(submission.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </ClientOnly>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission)
                            setIsDetailsOpen(true)
                          }}
                        >
                          Details
                        </Button>
                        {submission.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission)
                              setIsMarkCompleteOpen(true)
                            }}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No submissions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6}>Total Submissions: {filteredAndSortedSubmissions.length}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
      <SubmissionDetailsDialog submission={selectedSubmission} isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      <MarkCompleteDialog
        submission={selectedSubmission}
        isOpen={isMarkCompleteOpen}
        onOpenChange={(open) => {
          setIsMarkCompleteOpen(open)
          if (!open) {
            handleRefresh() // Refresh data when dialog closes
          }
        }}
      />
    </>
  )
}
