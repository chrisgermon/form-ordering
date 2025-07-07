"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Submission } from "@/lib/types"
import { format } from "date-fns"

interface SubmissionDetailsDialogProps {
  submission: Submission | null
  isOpen: boolean
  onClose: () => void
}

export function SubmissionDetailsDialog({ submission, isOpen, onClose }: SubmissionDetailsDialogProps) {
  if (!submission) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details #{submission.order_number}</DialogTitle>
          <DialogDescription>
            Submitted by {submission.ordered_by} ({submission.email}) on{" "}
            {new Date(submission.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
            <div className="space-y-4 bg-gray-50 p-4 rounded-md">
              <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(submission.form_data, null, 2)}</pre>
            </div>
          </div>

          {submission.status === "Complete" && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Dispatch Information</h3>
              <div className="text-sm space-y-2">
                <p>
                  <strong>Dispatch Date:</strong>{" "}
                  {submission.dispatch_date ? format(new Date(submission.dispatch_date), "PPP") : "N/A"}
                </p>
                <p>
                  <strong>Tracking Link:</strong>{" "}
                  {submission.tracking_link ? (
                    <a
                      href={submission.tracking_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {submission.tracking_link}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
                <div>
                  <strong>Notes:</strong>
                  <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                    {submission.dispatch_notes || "No notes provided."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="mt-6">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
