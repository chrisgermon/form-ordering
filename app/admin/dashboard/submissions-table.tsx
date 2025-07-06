"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import type { Submission } from "@/lib/types"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import { subDays } from "date-fns"

interface SubmissionsTableProps {
  initialSubmissions: Submission[]
}

const ITEMS_PER_PAGE = 10

export default function SubmissionsTable({ initialSubmissions }: SubmissionsTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })

  const filteredSubmissions = (initialSubmissions || [])
    .filter((submission) => {
      if (!dateRange?.from) return true
      const submissionDate = new Date(submission.created_at)
      const from = new Date(dateRange.from)
      from.setHours(0, 0, 0, 0)
      if (submissionDate < from) return false
      if (dateRange.to) {
        const to = new Date(dateRange.to)
        to.setHours(23, 59, 59, 999)
        if (submissionDate > to) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE)
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </div>
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Ordered By</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSubmissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-medium">{submission.order_number || "N/A"}</TableCell>
                <TableCell>{new Date(submission.created_at).toLocaleString()}</TableCell>
                <TableCell>{submission.brands?.name || "N/A"}</TableCell>
                <TableCell>{submission.ordered_by}</TableCell>
                <TableCell>{submission.email}</TableCell>
                <TableCell>
                  <Badge variant={submission.status === "sent" ? "default" : "secondary"}>
                    {submission.status || "pending"}
                  </Badge>
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={7}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
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
    </div>
  )
}
