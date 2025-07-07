"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Submission } from "@/lib/types"

export function SubmissionDetailsDialog({ submission }: { submission: Submission }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details - #{submission.order_number}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="font-semibold col-span-1">Status</p>
            <div className="col-span-3">
              <Badge variant={submission.status === "Complete" ? "default" : "secondary"}>{submission.status}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="font-semibold col-span-1">Brand</p>
            <p className="col-span-3">{submission.brands?.name}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="font-semibold col-span-1">Ordered By</p>
            <p className="col-span-3">{submission.ordered_by}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="font-semibold col-span-1">Email</p>
            <p className="col-span-3">{submission.email}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="font-semibold col-span-1">Date Ordered</p>
            <p className="col-span-3">{new Date(submission.created_at).toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <p className="font-semibold col-span-1">Items</p>
            <div className="col-span-3">
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(submission.items as Record<string, { name: string; quantity: string }>).map(
                  ([key, item]) => (
                    <li key={key}>
                      {item.name}: {item.quantity}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
          {submission.notes && (
            <div className="grid grid-cols-4 items-start gap-4">
              <p className="font-semibold col-span-1">Notes</p>
              <p className="col-span-3 whitespace-pre-wrap">{submission.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
