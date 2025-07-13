"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Submission, Brand } from "@/lib/types"

interface SubmissionsTableProps {
  submissions: Submission[]
  brands: Brand[]
}

export function SubmissionsTable({ submissions, brands }: SubmissionsTableProps) {
  const getBrandName = (brandId: string | null) => {
    if (!brandId || !Array.isArray(brands)) return "N/A"
    return brands.find((b) => b.id === brandId)?.name || "Unknown Brand"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Ordered By</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(submissions) && submissions.length > 0 ? (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getBrandName(submission.brand_id)}</TableCell>
                  <TableCell>{submission.ordered_by || "N/A"}</TableCell>
                  <TableCell>{submission.email || "N/A"}</TableCell>
                  <TableCell>{submission.status || "Pending"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No submissions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
