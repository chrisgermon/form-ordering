"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { SubmissionWithRelations } from "@/lib/types"
import { format } from "date-fns"

interface SubmissionsTableProps {
  submissions: SubmissionWithRelations[]
}

export default function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
        <p className="text-gray-500">No submissions yet. New orders will appear here.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Patient Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submission ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>{format(new Date(submission.created_at), "dd MMM yyyy, HH:mm")}</TableCell>
              <TableCell>{submission.brand?.name || "N/A"}</TableCell>
              <TableCell>{submission.patient_name}</TableCell>
              <TableCell>
                <Badge variant={submission.completed_at ? "default" : "secondary"}>
                  {submission.completed_at ? "Completed" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-gray-500">{submission.id}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
