"use client"

import { useState } from "react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Submission } from "@/lib/types"

type FormattedSubmission = Submission & { brand_name: string }

interface SubmissionsTableProps {
  submissions: FormattedSubmission[]
  onMarkComplete: (
    submission: FormattedSubmission,
    data: { delivery_details: string; expected_delivery_date: string },
  ) => Promise<void>
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
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Submission for {submission.ordered_by}</DialogTitle>
          <DialogDescription>Enter delivery details and the expected delivery date.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="delivery-details">Delivery Details</Label>
            <Textarea
              id="delivery-details"
              value={deliveryDetails}
              onChange={(e) => setDeliveryDetails(e.target.value)}
              placeholder="e.g., Tracking number, courier info"
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

export default function SubmissionsTable({ submissions, onMarkComplete }: SubmissionsTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<FormattedSubmission | null>(null)

  const handleOpenDialog = (submission: FormattedSubmission) => {
    setSelectedSubmission(submission)
  }

  const handleConfirmCompletion = (data: {
    delivery_details: string
    expected_delivery_date: string
  }) => {
    if (selectedSubmission) {
      onMarkComplete(selectedSubmission, data)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Brand</TableHead>
            <TableHead>Ordered By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>{submission.brand_name}</TableCell>
              <TableCell className="font-medium">{submission.ordered_by}</TableCell>
              <TableCell>
                <Badge variant={submission.status === "completed" ? "default" : "secondary"}>{submission.status}</Badge>
              </TableCell>
              <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    {submission.status !== "completed" && (
                      <DropdownMenuItem onClick={() => handleOpenDialog(submission)}>Mark as Complete</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedSubmission && (
        <CompleteSubmissionDialog
          submission={selectedSubmission}
          isOpen={!!selectedSubmission}
          onOpenChange={() => setSelectedSubmission(null)}
          onConfirm={handleConfirmCompletion}
        />
      )}
    </>
  )
}
