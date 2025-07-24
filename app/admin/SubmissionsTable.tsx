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
  submissions: FormattedSubmission[]
  refreshSubmissions: () => void
}

export default function SubmissionsTable({ submissions, refreshSubmissions }: SubmissionsTableProps) {
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

  return (
    <div className="border rounded-lg">
      <div className="p-4 flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={submissions.length === 0 || isClearing}>
              {isClearing ? "Clearing..." : "Clear All"}
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
                <TableCell>{submission.ordered_by}</TableCell>
                <TableCell>
                  <Badge variant={submission.status === "sent" ? "default" : "secondary"}>{submission.status}</Badge>
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
  )
}
