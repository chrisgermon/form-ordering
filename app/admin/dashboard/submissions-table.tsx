"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Submission } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Eye, CheckCircle, FileText, Search, X, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"
import { MarkCompleteDialog } from "./MarkCompleteDialog"

export function SubmissionsTable({ submissions }: { submissions: Submission[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        submission.ordered_by.toLowerCase().includes(searchLower) ||
        submission.email.toLowerCase().includes(searchLower) ||
        (submission.order_number || "").toLowerCase().includes(searchLower) ||
        (submission.brands?.name || "").toLowerCase().includes(searchLower)

      const matchesStatus = statusFilter === "all" || (submission.status || "Pending").toLowerCase() === statusFilter

      const submissionDate = new Date(submission.created_at)
      const matchesDate =
        !dateRange ||
        !dateRange.from ||
        (submissionDate >= dateRange.from && (!dateRange.to || submissionDate <= dateRange.to))

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [submissions, searchTerm, statusFilter, dateRange])

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission)
    setIsDetailsOpen(true)
  }

  const handleMarkComplete = (submission: Submission) => {
    setSelectedSubmission(submission)
    setIsCompleteOpen(true)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDateRange(undefined)
  }

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by name, email, order #, brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2">
          <X className="h-4 w-4" />
          Clear
        </Button>
        <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Ordered By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>PDF</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.order_number || "N/A"}</TableCell>
                  <TableCell>{submission.brands?.name || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{submission.ordered_by}</span>
                      <span className="text-xs text-gray-500">{submission.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(submission.created_at), "dd MMM yyyy, HH:mm")}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        submission.status === "Complete"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {submission.status || "Pending"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {submission.pdf_url ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={submission.pdf_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          View PDF
                        </a>
                      </Button>
                    ) : (
                      "Generating..."
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(submission)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                      {submission.status !== "Complete" && (
                        <Button variant="default" size="sm" onClick={() => handleMarkComplete(submission)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No submissions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {selectedSubmission && (
        <>
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
      )}
    </div>
  )
}
