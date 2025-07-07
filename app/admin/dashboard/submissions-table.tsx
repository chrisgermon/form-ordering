"use client"

import type { ReactNode } from "react"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ArrowUpDown,
  RefreshCw,
  Search,
} from "lucide-react"
import type { Submission } from "@/lib/types"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"
import { MarkCompleteDialog } from "./MarkCompleteDialog"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import { subDays, format, isValid } from "date-fns"
import { ClientOnly } from "@/components/client-only"

interface SubmissionsTableProps {
  initialSubmissions: Submission[]
}

type SortableKey = "order_number" | "created_at" | "status" | "brands.name"

const ITEMS_PER_PAGE = 15

// Create a client-only wrapper to prevent hydration errors

export function SubmissionsTable({ initialSubmissions }: SubmissionsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [submissionToComplete, setSubmissionToComplete] = useState<Submission | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: "ascending" | "descending" }>({
    key: "created_at",
    direction: "descending",
  })

  const sortedAndFilteredSubmissions = useMemo(() => {
    let filtered = [...submissions]

    // Date filtering
    if (dateRange?.from) {
      filtered = filtered.filter((submission) => {
        const submissionDate = new Date(submission.created_at)
        const from = new Date(dateRange.from!)
        from.setHours(0, 0, 0, 0)
        if (submissionDate < from) return false
        if (dateRange.to) {
          const to = new Date(dateRange.to)
          to.setHours(23, 59, 59, 999)
          if (submissionDate > to) return false
        }
        return true
      })
    }

    // Status filtering
    if (statusFilter !== "all") {
      filtered = filtered.filter((submission) => (submission.status || "pending").toLowerCase() === statusFilter)
    }

    // Search filtering
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.order_number?.toLowerCase().includes(lowercasedQuery) ||
          s.ordered_by.toLowerCase().includes(lowercasedQuery) ||
          s.email.toLowerCase().includes(lowercasedQuery) ||
          s.brands?.name?.toLowerCase().includes(lowercasedQuery),
      )
    }

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any

        if (sortConfig.key === "brands.name") {
          aValue = a.brands?.name || ""
          bValue = b.brands?.name || ""
        } else {
          aValue = a[sortConfig.key as keyof Submission]
          bValue = b[sortConfig.key as keyof Submission]
        }

        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [submissions, dateRange, statusFilter, searchQuery, sortConfig])

  const totalPages = Math.ceil(sortedAndFilteredSubmissions.length / ITEMS_PER_PAGE)
  const paginatedSubmissions = sortedAndFilteredSubmissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const handleSort = (key: SortableKey) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const getStatusVariant = (status: string | null) => {
    switch ((status || "pending").toLowerCase()) {
      case "complete":
        return "success"
      case "sent":
        return "default"
      default:
        return "secondary"
    }
  }

  const SortableHeader = ({ sortKey, children }: { sortKey: SortableKey; children: ReactNode }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => handleSort(sortKey)} className="px-2">
        {children}
        <ArrowUpDown
          className={`ml-2 h-4 w-4 ${sortConfig.key === sortKey ? "text-foreground" : "text-muted-foreground"}`}
        />
      </Button>
    </TableHead>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by Order#, Name, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
          <ClientOnly>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </ClientOnly>
          <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader sortKey="order_number">Order #</SortableHeader>
              <SortableHeader sortKey="created_at">Date</SortableHeader>
              <SortableHeader sortKey="brands.name">Brand</SortableHeader>
              <TableHead>Ordered By</TableHead>
              <TableHead>Email</TableHead>
              <SortableHeader sortKey="status">Status</SortableHeader>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSubmissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-medium">{submission.order_number || "N/A"}</TableCell>
                <TableCell>
                  <ClientOnly>
                    {isValid(new Date(submission.created_at))
                      ? format(new Date(submission.created_at), "dd MMM yyyy, h:mm a")
                      : "Invalid Date"}
                  </ClientOnly>
                </TableCell>
                <TableCell>{submission.brands?.name || "N/A"}</TableCell>
                <TableCell>{submission.ordered_by}</TableCell>
                <TableCell>{submission.email}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(submission.status) as any}>{submission.status || "pending"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                      <FileText className="mr-2 h-3 w-3" />
                      Details
                    </Button>
                    {submission.pdf_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={submission.pdf_url} target="_blank" rel="noopener noreferrer">
                          View PDF <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {(submission.status || "pending").toLowerCase() !== "complete" && (
                      <Button variant="outline" size="sm" onClick={() => setSubmissionToComplete(submission)}>
                        <CheckCircle className="mr-2 h-3 w-3" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={7}>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {paginatedSubmissions.length} of {sortedAndFilteredSubmissions.length} submissions.
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      {selectedSubmission && (
        <SubmissionDetailsDialog
          submission={selectedSubmission}
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
      {submissionToComplete && (
        <MarkCompleteDialog
          submission={submissionToComplete}
          isOpen={!!submissionToComplete}
          onClose={() => setSubmissionToComplete(null)}
        />
      )}
    </div>
  )
}
