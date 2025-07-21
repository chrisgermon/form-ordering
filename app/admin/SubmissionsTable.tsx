"use client"

import { useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import type { Submission } from "@/lib/types"
import { completeSubmission } from "./actions"

type SortKey = keyof Submission | "brand_name"
type SortDirection = "asc" | "desc"

// The submission type from the API will now include brand_name directly
type SubmissionWithBrandName = Submission & {
  brand_name: string
}

interface SubmissionsTableProps {
  submissions: SubmissionWithBrandName[]
  sortKey: SortKey
  sortDirection: SortDirection
  onSort: (key: SortKey) => void
  isLoading: boolean
}

// Simplified and corrected date formatting options
const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}

export function SubmissionsTable({ submissions, sortKey, sortDirection, onSort, isLoading }: SubmissionsTableProps) {
  const [isPending, startTransition] = useTransition()

  const handleComplete = (submissionId: string) => {
    startTransition(async () => {
      const result = await completeSubmission(submissionId)
      if (result.success) {
        toast.success(result.message)
        // Here you might want to trigger a refetch as well
      } else {
        toast.error(result.message)
      }
    })
  }

  const SortableHeader = ({ aKey, label }: { aKey: SortKey; label: string }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => onSort(aKey)}>
        {label}
        {sortKey === aKey ? (
          sortDirection === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    </TableHead>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader aKey="created_at" label="Date" />
              <SortableHeader aKey="brand_name" label="Brand" />
              <SortableHeader aKey="ordered_by" label="Ordered By" />
              <SortableHeader aKey="ordered_by_email" label="Email" />
              <SortableHeader aKey="status" label="Status" />
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading submissions...
                </TableCell>
              </TableRow>
            ) : Array.isArray(submissions) && submissions.length > 0 ? (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    {new Intl.DateTimeFormat("en-US", dateTimeFormatOptions).format(new Date(submission.created_at))}
                  </TableCell>
                  <TableCell>{submission.brand_name}</TableCell>
                  <TableCell>{submission.ordered_by || "N/A"}</TableCell>
                  <TableCell>{submission.ordered_by_email || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={submission.status === "Completed" ? "default" : "secondary"}>
                      {submission.status || "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {submission.status !== "Completed" && (
                      <Button size="sm" onClick={() => handleComplete(submission.id)} disabled={isPending}>
                        {isPending ? "Completing..." : "Complete"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
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
