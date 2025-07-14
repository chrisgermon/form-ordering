"use client"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { updateSubmissionStatus } from "./actions"
import { useToast } from "@/components/ui/use-toast"
import type { Submission } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw } from "lucide-react"

export function MarkAsCompleteButton({
  submission,
}: {
  submission: Submission
}) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [courier, setCourier] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [notes, setNotes] = useState("")

  const handleMarkAsComplete = () => {
    startTransition(async () => {
      const result = await updateSubmissionStatus(submission.id, true, {
        courier,
        trackingNumber,
        notes,
      })
      if (result.success) {
        toast({
          title: "Success",
          description: "Order marked as complete.",
        })
        setIsOpen(false)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        })
      }
    })
  }

  if (submission.is_complete) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completion Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p>
              <strong>Courier:</strong> {submission.completion_courier}
            </p>
            <p>
              <strong>Tracking:</strong> {submission.completion_tracking}
            </p>
            <p>
              <strong>Notes:</strong> {submission.completion_notes}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Mark as Complete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Order as Complete</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="courier">Courier</Label>
            <Input id="courier" value={courier} onChange={(e) => setCourier(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <Input id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleMarkAsComplete} disabled={isPending}>
            {isPending ? "Saving..." : "Save and Notify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button variant="outline" size="icon" onClick={() => startTransition(() => router.refresh())} disabled={isPending}>
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
    </Button>
  )
}
