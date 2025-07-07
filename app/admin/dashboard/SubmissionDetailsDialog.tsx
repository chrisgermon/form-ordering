"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Submission } from "@/lib/types"
import { format, isValid } from "date-fns"
import { ClientOnly } from "@/components/client-only"

interface SubmissionDetailsDialogProps {
  submission: Submission | null
  isOpen: boolean
  onClose: () => void
}

export function SubmissionDetailsDialog({ submission, isOpen, onClose }: SubmissionDetailsDialogProps) {
  if (!submission) return null

  const renderValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No"
    }
    if (Array.isArray(value)) {
      return value.join(", ")
    }
    return value || "N/A"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Order Details: #{submission.order_number || "N/A"}</DialogTitle>
          <DialogDescription>
            Submitted on{" "}
            <ClientOnly>
              {isValid(new Date(submission.created_at))
                ? format(new Date(submission.created_at), "PPP 'at' h:mm a")
                : "Invalid Date"}
            </ClientOnly>
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-1 pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="font-semibold">Brand:</div>
              <div className="col-span-2">{submission.brands?.name || "N/A"}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="font-semibold">Ordered By:</div>
              <div className="col-span-2">{submission.ordered_by}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="font-semibold">Email:</div>
              <div className="col-span-2">{submission.email}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="font-semibold">Phone:</div>
              <div className="col-span-2">{submission.phone || "N/A"}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="font-semibold">Status:</div>
              <div className="col-span-2 capitalize">{submission.status || "pending"}</div>
            </div>
            {submission.pdf_url && (
              <div className="grid grid-cols-3 gap-2">
                <div className="font-semibold">PDF:</div>
                <div className="col-span-2">
                  <a
                    href={submission.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View PDF
                  </a>
                </div>
              </div>
            )}

            <h3 className="font-bold text-lg mt-4 border-b pb-2">Order Items</h3>
            {submission.order_items &&
            typeof submission.order_items === "object" &&
            !Array.isArray(submission.order_items) ? (
              Object.entries(submission.order_items).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium truncate" title={key}>
                    {key}
                  </div>
                  <div className="col-span-2">{renderValue(value)}</div>
                </div>
              ))
            ) : (
              <p>No items in this order.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
