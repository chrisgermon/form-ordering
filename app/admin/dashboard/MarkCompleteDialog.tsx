"use client"

import { useFormState } from "react-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { useEffect } from "react"
import { toast } from "sonner"

import type { Submission } from "@/lib/types"
import { markCompleteSchema } from "@/lib/schemas"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { markSubmissionAsComplete } from "./actions"
import { DatePicker } from "@/components/ui/date-picker"

type MarkCompleteDialogProps = {
  submission: Submission
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function MarkCompleteDialog({ submission, isOpen, onOpenChange }: MarkCompleteDialogProps) {
  const [state, formAction] = useFormState(markSubmissionAsComplete, {
    success: false,
    message: "",
    errors: null,
  })

  const form = useForm<z.infer<typeof markCompleteSchema>>({
    resolver: zodResolver(markCompleteSchema),
    defaultValues: {
      submissionId: submission.id,
      dispatchDate: submission.dispatch_date ? new Date(submission.dispatch_date) : new Date(),
      trackingLink: submission.tracking_link || "",
      dispatchNotes: submission.dispatch_notes || "",
    },
  })

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        onOpenChange(false)
      } else {
        toast.error(state.message)
      }
    }
  }, [state, onOpenChange])

  const {
    formState: { isSubmitting },
  } = form

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Order as Complete</DialogTitle>
          <DialogDescription>
            Please provide the dispatch details for order #{submission.order_number}. This will mark the order as
            complete.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="submissionId" value={submission.id} />
          <div>
            <Label htmlFor="dispatchDate">Dispatch Date</Label>
            <DatePicker name="dispatchDate" defaultValue={form.getValues("dispatchDate")} />
            {state.errors?.dispatchDate && <p className="text-sm text-red-500 mt-1">{state.errors.dispatchDate}</p>}
          </div>
          <div>
            <Label htmlFor="trackingLink">Tracking Link</Label>
            <Input
              id="trackingLink"
              name="trackingLink"
              defaultValue={form.getValues("trackingLink")}
              placeholder="https://example.com/track/12345"
            />
            {state.errors?.trackingLink && <p className="text-sm text-red-500 mt-1">{state.errors.trackingLink}</p>}
          </div>
          <div>
            <Label htmlFor="dispatchNotes">Dispatch Notes</Label>
            <Textarea
              id="dispatchNotes"
              name="dispatchNotes"
              defaultValue={form.getValues("dispatchNotes")}
              placeholder="Optional notes about the dispatch."
            />
            {state.errors?.dispatchNotes && <p className="text-sm text-red-500 mt-1">{state.errors.dispatchNotes}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save and Mark as Complete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
