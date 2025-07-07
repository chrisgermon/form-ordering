"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Submission } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"

type SubmissionDetailsDialogProps = {
  isOpen: boolean
  onClose: () => void
  submission: Submission | null
}

export function SubmissionDetailsDialog({ isOpen, onClose, submission }: SubmissionDetailsDialogProps) {
  if (!submission) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-right font-semibold">Brand:</p>
            <p className="col-span-3">{submission.brands?.name}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-right font-semibold">Status:</p>
            <p className="col-span-3">{submission.status}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-right font-semibold">Customer:</p>
            <p className="col-span-3">
              {submission.customer_name} ({submission.customer_email})
            </p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-right font-semibold">Submitted:</p>
            <p className="col-span-3">{new Date(submission.created_at).toLocaleString()}</p>
          </div>
          <hr className="my-2" />
          <h3 className="font-semibold text-lg">Order Details</h3>
          {Object.entries(submission.form_data as Record<string, any>).map(([key, value]) => (
            <div key={key} className="grid grid-cols-4 items-start gap-4">
              <p className="text-right font-semibold capitalize">{key.replace(/_/g, " ")}:</p>
              <div className="col-span-3">
                {typeof value === "string" && (value.startsWith("uploads/") || value.startsWith("signatures/")) ? (
                  <a
                    href={resolveAssetUrl(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View File
                  </a>
                ) : (
                  <p>{JSON.stringify(value)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
