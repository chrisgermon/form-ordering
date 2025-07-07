"use client"

import { useState } from "react"

import { useEffect, useRef } from "react"
import { useFormState } from "react-dom"
import { toast } from "sonner"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import type { Submission } from "@/lib/types"
import { cn } from "@/lib/utils"
import { markSubmissionAsComplete } from "./actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

interface MarkCompleteDialogProps {
  submission: Submission | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const initialState = {
  success: false,
  message: "",
}

export function MarkCompleteDialog({ submission, isOpen, onOpenChange }: MarkCompleteDialogProps) {
  const [state, formAction] = useFormState(markSubmissionAsComplete, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [date, setDate] = useState<Date | undefined>(
    submission?.dispatch_date ? new Date(submission.dispatch_date) : undefined,
  )

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      onOpenChange(false)
    } else if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, onOpenChange])

  if (!submission) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Order #{submission.order_number} as Complete</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="submissionId" value={submission.id} />
          <div>
            <Label htmlFor="dispatchDate">Dispatch Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
            <input type="hidden" name="dispatchDate" value={date ? format(date, "yyyy-MM-dd") : ""} />
          </div>
          <div>
            <Label htmlFor="trackingLink">Tracking Link</Label>
            <Input id="trackingLink" name="trackingLink" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => formRef.current?.requestSubmit()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
