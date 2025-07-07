"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Order Details: #{submission.order_number || submission.id.substring(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Patient Name</h3>
              <p>{submission.patient_name}</p>
            </div>
            <div>
              <h3 className="font-semibold">Brand</h3>
              <p>{submission.brands?.name || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-semibold">Ordered By</h3>
              <p>{submission.ordered_by}</p>
            </div>
            <div>
              <h3 className="font-semibold">Email</h3>
              <p>{submission.email}</p>
            </div>
            <div>
              <h3 className="font-semibold">Order Date</h3>
              <p>{format(new Date(submission.created_at), "dd MMM yyyy, HH:mm")}</p>
            </div>
            <div>
              <h3 className="font-semibold">Status</h3>
              <p>{submission.status || "Pending"}</p>
            </div>
          </div>
          {submission.status === "Complete" && (
            <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
              <div>
                <h3 className="font-semibold">Dispatch Date</h3>
                <p>{submission.dispatch_date ? format(new Date(submission.dispatch_date), "dd MMM yyyy") : "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold">Tracking Link</h3>
                <p>
                  {submission.tracking_link ? (
                    <a
                      href={submission.tracking_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Track Order
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <h3 className="font-semibold">Dispatch Notes</h3>
                <p className="whitespace-pre-wrap">{submission.dispatch_notes || "N/A"}</p>
              </div>
            </div>
          )}
          <div>
            <h3 className="font-semibold">Order Items</h3>
            <div className="border rounded-md p-4 mt-2 max-h-60 overflow-y-auto bg-gray-50">
              <pre className="text-sm">{JSON.stringify(submission.form_data, null, 2)}</pre>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
