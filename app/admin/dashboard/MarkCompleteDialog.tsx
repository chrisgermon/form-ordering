"use client"

import { useEffect, useState, useRef } from "react"
import { useFormState, useFormStatus } from "react-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { markSubmissionAsComplete } from "./actions"
import type { Submission } from "@/lib/types"
import { toast } from "sonner"

interface MarkCompleteDialogProps {
  submission: Submission
  onComplete: () => void
}

const initialState = {
  success: false,
  message: "",
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save and Send Email"}
    </Button>
  )
}

export function MarkCompleteDialog({ submission, onComplete }: MarkCompleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useFormState(markSubmissionAsComplete, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      setIsOpen(false)
      onComplete()
    } else if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, onComplete])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Mark Complete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Order as Complete</DialogTitle>
          <DialogDescription>Fill in the dispatch details for order #{submission.order_number}.</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="space-y-4 py-4">
          <input type="hidden" name="submissionId" value={submission.id} />
          <div>
            <Label htmlFor="dispatch_date">Dispatch Date</Label>
            <DatePicker name="dispatch_date" />
          </div>
          <div>
            <Label htmlFor="tracking_link">Tracking Link</Label>
            <Input id="tracking_link" name="tracking_link" placeholder="https://courier.com/tracking/..." />
          </div>
          <div>
            <Label htmlFor="dispatch_notes">Dispatch Notes</Label>
            <Textarea id="dispatch_notes" name="dispatch_notes" placeholder="Any notes for the dispatch..." />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <SubmitButton />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
