"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { Submission } from "@/lib/types"
import { format } from "date-fns"

export function SubmissionDetailsDialog({
  submission,
  isOpen,
  onOpenChange,
}: {
  submission: Submission | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!submission) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Order Details: {submission.order_number}</DialogTitle>
          <DialogDescription>
            Submitted on {format(new Date(submission.created_at), "MMMM dd, yyyy hh:mm a")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-semibold">Brand:</span>
            <span className="col-span-3">{submission.brand_name}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-semibold">Name:</span>
            <span className="col-span-3">{submission.name}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-semibold">Email:</span>
            <span className="col-span-3">{submission.email}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-semibold">IP Address:</span>
            <span className="col-span-3">{submission.ip_address}</span>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <span className="text-right font-semibold pt-1">Order:</span>
            <div className="col-span-3 bg-muted p-3 rounded-md">
              {submission.order_data.map((section) => (
                <div key={section.section_title} className="mb-4 last:mb-0">
                  <h4 className="font-bold text-md mb-2">{section.section_title}</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {section.items.map((item) => (
                      <li key={item.item_name}>
                        {item.item_name}:{" "}
                        <span className="font-mono bg-muted-foreground/10 px-1 py-0.5 rounded">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
