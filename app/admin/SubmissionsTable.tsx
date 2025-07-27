"use client"

import { AlertDialogTrigger } from "@/components/ui/alert-dialog"

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
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import type { Submission } from "@/lib/types"

type FormattedSubmission = Submission & { brand_name: string }

interface SubmissionsTableProps {
  submissions: FormattedSubmission[]
  onMarkComplete: (
    submission: FormattedSubmission,
    completionData: { delivery_details: string; expected_delivery_date: string },
  ) => Promise<void>
  onClearAll: () => Promise<void>
  isClearing: boolean
}

function CompleteSubmissionDialog({
  submission,
  onConfirm,
  isOpen,
  onOpenChange,
}: {
  submission: FormattedSubmission
  onConfirm: (data: { delivery_details: string; expected_delivery_date: string }) => void
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}) {
  const [deliveryDetails, setDeliveryDetails] = useState("")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("")

  const handleSubmit = () => {
    onConfirm({
      delivery_details: deliveryDetails,
      expected_delivery_date: expectedDeliveryDate,
    })
    onOpenChange(false) // Close dialog on submit
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Submission for {submission.ordered_by}</DialogTitle>
          <DialogDescription>Enter delivery details and the expected delivery date for this order.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="delivery-details">Delivery Details</Label>
            <Textarea
              id="delivery-details"
              value={deliveryDetails}
              onChange={(e) => setDeliveryDetails(e.target.value)}
              placeholder="e.g., Courier name, tracking number"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expected-delivery-date">Expected Delivery Date</Label>
            <Input
              id="expected-delivery-date"
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Mark as Complete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SubmissionsTable({
  submissions,
  onMarkComplete,
  onClearAll,
  isClearing,
}: SubmissionsTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<FormattedSubmission | null>(null)

  const handleOpenDialog = (submission: FormattedSubmission) => {
    setSelectedSubmission(submission)
  }

  const handleConfirmCompletion = async (data: {
    delivery_details: string
    expected_delivery_date: string
  }) => {
    if (selectedSubmission) {
      await onMarkComplete(selectedSubmission, data)
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
              <AlertDialogAction onClick={onClearAll}>Continue</AlertDialogAction>
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
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.open(submission.pdf_url || "", "_blank")}
                          disabled={!submission.pdf_url}
                        >
                          View PDF
                        </DropdownMenuItem>
                        {submission.status !== "completed" && (
                          <DropdownMenuItem onClick={() => handleOpenDialog(submission)}>
                            Mark as Complete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
      {selectedSubmission && (
        <CompleteSubmissionDialog
          submission={selectedSubmission}
          isOpen={!!selectedSubmission}
          onOpenChange={() => setSelectedSubmission(null)}
          onConfirm={handleConfirmCompletion}
        />
      )}
    </div>
  )
}
