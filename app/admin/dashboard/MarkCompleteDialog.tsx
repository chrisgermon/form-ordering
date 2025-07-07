"use client"

import { useEffect, useState } from "react"
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
import { markSubmissionAsComplete } from "./actions"
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

const initialState = {
  success: false,
  message: "",
  errors: null,
}

export function MarkCompleteDialog({ submission, isOpen, onOpenChange }: MarkCompleteDialogProps) {
  const [state, formAction] = useFormState(markSubmissionAsComplete, initialState)
  const [dispatchDate, setDispatchDate] = useState<Date | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setDispatchDate(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      onOpenChange(false)
    } else if (state.message && !state.success) {
      const errorMessages = state.errors ? Object.values(state.errors).flat().join("\n") : state.message
      toast.error("Failed to mark as complete", {
        description: errorMessages,
      })
    }
  }, [state, onOpenChange])

  if (!submission) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Mark Order #{submission.order_number} as Complete</DialogTitle>
            <DialogDescription>Add dispatch details for this order. This is optional.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="submissionId" value={submission.id} />
            <input
              type="hidden"
              name="dispatchDate"
              value={dispatchDate ? dispatchDate.toISOString().split("T")[0] : ""}
            />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dispatchDate" className="text-right">
                Dispatch Date
              </Label>
              <div className="col-span-3">
                <DatePicker value={dispatchDate} onChange={setDispatchDate} placeholder="Select dispatch date" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trackingLink" className="text-right">
                Tracking Link
              </Label>
              <Input id="trackingLink" name="trackingLink" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea id="notes" name="notes" className="col-span-3" />
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
