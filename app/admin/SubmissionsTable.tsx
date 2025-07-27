"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import type { Submission } from "@/lib/types"

type FormattedSubmission = Submission & { brand_name: string }

interface SubmissionsTableProps {
  submissions?: FormattedSubmission[]
  refreshSubmissions: () => void
  onMarkComplete: (submission: FormattedSubmission) => void
}

export default function SubmissionsTable({
  submissions = [],
  refreshSubmissions,
  onMarkComplete,
}: SubmissionsTableProps) {
  const [isClearing, setIsClearing] = useState(false)

  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      const response = await fetch("/api/admin/submissions", { method: "DELETE" })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to clear submissions.")
      }
      toast({
        title: "Success",
        description: "All submissions have been cleared.",
      })
      refreshSubmissions()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "sent":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isClearing || submissions.length === 0}>
              {isClearing ? "Clearing..." : "Clear All Submissions"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all submissions from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Ordered By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{format(new Date(submission.created_at), "dd MMM yyyy, h:mm a")}</TableCell>
                  <TableCell>{submission.brand_name}</TableCell>
                  <TableCell>
                    <div className="font-medium">{submission.ordered_by}</div>
                    <div className="text-sm text-muted-foreground">{submission.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(submission.status)}>{submission.status}</Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(submission.pdf_url || "", "_blank")}
                      disabled={!submission.pdf_url}
                    >
                      View PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkComplete(submission)}
                      disabled={submission.status === "completed"}
                    >
                      {submission.status === "completed" ? "Completed" : "Mark Complete"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No submissions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
