"use client"

import { useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { markSubmissionAsComplete } from "./actions"
import type { Submission } from "@/lib/types"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Marking as Complete..." : "Mark as Complete"}
    </Button>
  )
}

export function MarkCompleteDialog({ submission }: { submission: Submission }) {
  const [state, formAction] = useFormState(markSubmissionAsComplete, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
    } else if (state?.message) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Mark Complete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Order as Complete</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="submissionId" value={submission.id} />
          <div>
            <Label htmlFor="dispatch_date">Dispatch Date</Label>
            <Input id="dispatch_date" name="dispatch_date" type="date" />
          </div>
          <div>
            <Label htmlFor="tracking_link">Tracking Link</Label>
            <Input id="tracking_link" name="tracking_link" placeholder="https://courier.com/tracking/..." />
          </div>
          <div>
            <Label htmlFor="dispatch_notes">Dispatch Notes</Label>
            <Textarea id="dispatch_notes" name="dispatch_notes" placeholder="Any notes for the recipient..." />
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
