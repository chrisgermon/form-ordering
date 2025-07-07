"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { markAsComplete } from "./actions"
import type { Submission } from "@/lib/types"

interface MarkCompleteDialogProps {
  submission: Submission | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Mark as Complete"}
    </Button>
  )
}

export function MarkCompleteDialog({ submission, isOpen, onOpenChange }: MarkCompleteDialogProps) {
  const [state, formAction] = useFormState(markAsComplete, null)
  const [dispatchDate, setDispatchDate] = useState<Date | undefined>(undefined)

  if (!submission) return null

  const handleSubmit = (formData: FormData) => {
    if (dispatchDate) {
      formData.set("dispatchDate", dispatchDate.toISOString())
    }
    formAction(formData)

    if (state?.success) {
      toast.success("Order marked as complete.")
      onOpenChange(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Mark Order #{submission.order_number} as Complete</DialogTitle>
            <DialogDescription>Add dispatch details for this order. This is optional.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="submissionId" value={submission.id} />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dispatchDate" className="text-right">
                Dispatch Date
              </Label>
              <DatePicker date={dispatchDate} setDate={setDispatchDate} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trackingLink" className="text-right">
                Tracking Link
              </Label>
              <Input id="trackingLink" name="trackingLink" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dispatchNotes" className="text-right">
                Notes
              </Label>
              <Textarea id="dispatchNotes" name="dispatchNotes" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
