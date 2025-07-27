"use client"

import type React from "react"

import { DialogFooter } from "@/components/ui/dialog"

import { useState } from "react"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  const [selectedSubmission, setSelectedSubmission] = useState<FormattedSubmission | null>(null)

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
        <Dialog>
          <Button variant="destructive" disabled={isClearing || submissions.length === 0}>
            {isClearing ? "Clearing..." : "Clear All Submissions"}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete all submissions from the database.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="p-3 rounded-md border">
                  <p className="font-semibold">{submission.brand_name}</p>
                  <p className="text-sm text-muted-foreground">{submission.ordered_by}</p>
                  <p className="text-sm">
                    Quantity: {submission.quantity === "other" ? submission.otherQuantity : submission.quantity}
                  </p>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedSubmission(null)}>Cancel</Button>
              <Button onClick={handleClearAll}>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Clinic</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{format(new Date(submission.created_at), "dd MMM yyyy, h:mm a")}</TableCell>
                  <TableCell>{submission.brand_name}</TableCell>
                  <TableCell>{submission.clinic_name}</TableCell>
                  <TableCell>
                    <div className="font-medium">{submission.contact_person}</div>
                    <div className="text-sm text-muted-foreground">{submission.contact_email}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getStatusVariant(submission.status)}>{submission.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
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
                <TableCell colSpan={6} className="text-center h-24">
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

// Add a Card component wrapper if it's not already there
function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border bg-card text-card-foreground shadow-sm">{children}</div>
}
