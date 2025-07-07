"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Submission, OrderSection } from "@/lib/types"

interface SubmissionDetailsDialogProps {
  submission: Submission | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function SubmissionDetailsDialog({ submission, isOpen, onOpenChange }: SubmissionDetailsDialogProps) {
  if (!submission) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <div className="space-y-4">
              {submission.order_data.sections.map((section: OrderSection, index: number) => (
                <div key={index} className="rounded-md border p-4">
                  <h4 className="font-medium text-md mb-2">{section.title}</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        {item.name}
                        {item.quantity && `: ${item.quantity}`}
                        {item.value && `: ${item.value}`}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {submission.status === "complete" && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Dispatch Information</h3>
              <div className="text-sm space-y-2">
                <p>
                  <strong>Dispatch Date:</strong>{" "}
                  {submission.dispatch_date ? new Date(submission.dispatch_date).toLocaleDateString() : "N/A"}
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
        <div className="mt-6 flex justify-end space-x-2">
          {submission.pdf_url && (
            <Button asChild variant="outline">
              <a href={submission.pdf_url} target="_blank" rel="noopener noreferrer">
                View PDF
              </a>
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
