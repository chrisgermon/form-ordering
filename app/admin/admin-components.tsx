"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { markOrderAsComplete, refreshSubmissions } from "./actions"
import type { Submission } from "@/lib/types"
import { RefreshCcw, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function MarkAsCompleteButton({ submission }: { submission: Submission }) {
  const [isOpen, setIsOpen] = useState(false)
  const [deliveryDetails, setDeliveryDetails] = useState("")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date>()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = () => {
    if (!expectedDeliveryDate) {
      toast({
        title: "Missing Information",
        description: "Please select an expected delivery date.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const result = await markOrderAsComplete(submission, deliveryDetails, expectedDeliveryDate.toISOString())
      if (result.success) {
        toast({
          title: "Order Completed",
          description: `Order #${submission.order_number} has been marked as complete.`,
        })
        setIsOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to mark order as complete.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Mark as Complete</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Order #{submission.order_number}</DialogTitle>
          <DialogDescription>
            Enter dispatch details for this order. An email will be sent to the customer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="delivery-details" className="text-right">
              Delivery Notes
            </Label>
            <Textarea
              id="delivery-details"
              value={deliveryDetails}
              onChange={(e) => setDeliveryDetails(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Sent via AusPost, tracking #12345"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="delivery-date" className="text-right">
              Expected Delivery
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !expectedDeliveryDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expectedDeliveryDate ? format(expectedDeliveryDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expectedDeliveryDate}
                  onSelect={setExpectedDeliveryDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Submitting..." : "Mark as Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RefreshButton() {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshSubmissions()
      toast({
        title: "Refreshed",
        description: "The submissions list has been updated.",
      })
    })
  }

  return (
    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isPending}>
      <RefreshCcw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      <span className="sr-only">Refresh submissions</span>
    </Button>
  )
}
