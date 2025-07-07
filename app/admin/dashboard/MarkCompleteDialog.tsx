"use client"

import { useEffect, useRef } from "react"
import { useFormState } from "react-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { markSubmissionAsComplete } from "./actions"
import type { Submission } from "@/lib/types"
import { toast } from "sonner"

type MarkCompleteDialogProps = {
  isOpen: boolean
  onClose: () => void
  submission: Submission | null
}

const initialState = {
  success: false,
  message: "",
}

export function MarkCompleteDialog({ isOpen, onClose, submission }: MarkCompleteDialogProps) {
  const [state, formAction] = useFormState(markSubmissionAsComplete, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      onClose()
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state, onClose])

  if (!submission) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Order as Complete</DialogTitle>
          <DialogDescription>Enter dispatch details for order #{submission.id.substring(0, 8)}.</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="space-y-4">
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
            <Textarea id="dispatch_notes" name="dispatch_notes" placeholder="Any notes for the customer..." />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => formRef.current?.requestSubmit()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
