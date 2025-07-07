"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { Submission } from "@/lib/types"
import { format } from "date-fns"

interface SubmissionDetailsDialogProps {
  submission: Submission | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function SubmissionDetailsDialog({ submission, isOpen, onOpenChange }: SubmissionDetailsDialogProps) {
  if (!submission) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details #{submission.order_number}</DialogTitle>
          <DialogDescription>Submitted on {format(new Date(submission.created_at), "PPP p")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Ordered By</h3>
              <p>{submission.ordered_by}</p>
              <p>{submission.email}</p>
            </div>
            <div>
              <h3 className="font-semibold">Status</h3>
              <p>{submission.status}</p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold">Order Data</h3>
            <pre className="mt-2 w-full bg-muted p-4 rounded-md text-sm overflow-x-auto">
              {JSON.stringify(submission.order_data, null, 2)}
            </pre>
          </div>
          {submission.notes && (
            <div className="mt-4">
              <h3 className="font-semibold">Notes</h3>
              <p>{submission.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
