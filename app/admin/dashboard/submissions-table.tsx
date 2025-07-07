"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"
import { MarkCompleteDialog } from "./MarkCompleteDialog"
import type { Submission } from "@/lib/types"

interface SubmissionsTableProps {
  submissions: Submission[]
}

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isMarkCompleteOpen, setIsMarkCompleteOpen] = useState(false)

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission)
    setIsDetailsOpen(true)
  }

  const handleMarkComplete = (submission: Submission) => {
    setSelectedSubmission(submission)
    setIsMarkCompleteOpen(true)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Ordered By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-medium">{submission.order_number}</TableCell>
                <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{submission.brands.name}</TableCell>
                <TableCell>{submission.ordered_by}</TableCell>
                <TableCell>
                  <Badge variant={submission.status}>{submission.status}</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(submission)}>
                    View Details
                  </Button>
                  {submission.status === "pending" && (
                    <Button variant="default" size="sm" onClick={() => handleMarkComplete(submission)}>
                      Mark Complete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <SubmissionDetailsDialog submission={selectedSubmission} isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      <MarkCompleteDialog
        submission={selectedSubmission}
        isOpen={isMarkCompleteOpen}
        onOpenChange={setIsMarkCompleteOpen}
      />
    </>
  )
}
