"use client"

import { useEffect, useRef, useState } from "react"
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

interface MarkCompleteDialogProps {
  submission: Submission | null
  isOpen: boolean
  onClose: () => void
}

const initialState = {
  success: false,
  message: "",
}

export function MarkCompleteDialog({ submission, isOpen, onClose }: MarkCompleteDialogProps) {
  const [state, formAction] = useFormState(markSubmissionAsComplete, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [dispatchDate, setDispatchDate] = useState<Date | undefined>()

  useEffect(() => {
    if (!isOpen) {
      setDispatchDate(undefined)
      formRef.current?.reset()
    }
  }, [isOpen])

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      onClose()
    } else if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, onClose])

  if (!submission) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Order as Complete</DialogTitle>
          <DialogDescription>Fill in the dispatch details for order #{submission.order_number}.</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="space-y-4 py-4">
          <input type="hidden" name="submissionId" value={submission.id} />
          <div>
            <Label htmlFor="dispatch_date">Dispatch Date</Label>
            <DatePicker date={dispatchDate} onDateChange={setDispatchDate} />
            <input
              type="hidden"
              name="dispatch_date"
              value={dispatchDate ? dispatchDate.toISOString().split("T")[0] : ""}
            />
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => formRef.current?.requestSubmit()}>
            Save and Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
