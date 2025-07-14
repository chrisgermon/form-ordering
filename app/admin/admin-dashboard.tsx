"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Download, Loader2, CalendarIcon, ClipboardCopy } from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Brand, Submission } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { RefreshButton, MarkAsCompleteButton } from "./admin-components"

function CompleteSubmissionDialog({
  open,
  onOpenChange,
  submission,
  onCompleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: Submission | null
  onCompleted: () => void
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      delivery_details: "",
      expected_delivery_date: new Date(),
    },
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (open) {
      reset({
        delivery_details: "",
        expected_delivery_date: new Date(),
      })
      setErrorMessage("")
    }
  }, [open, reset])

  const onSubmit = async (data: any) => {
    if (!submission) return
    setIsSaving(true)
    setErrorMessage("")
    try {
      const response = await fetch(`/api/admin/submissions/${submission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_details: data.delivery_details,
          expected_delivery_date: data.expected_delivery_date
            ? format(data.expected_delivery_date, "yyyy-MM-dd")
            : null,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update submission.")
      }
      onCompleted()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Order as Complete</DialogTitle>
          <DialogDescription>Add delivery details for order {submission?.order_number}.</DialogDescription>
        </DialogHeader>
        {submission && (
          <div className="text-sm text-muted-foreground border-y py-4 my-4">
            <p>
              <strong>Order #:</strong> {submission.order_number}
            </p>
            <p>
              <strong>Brand:</strong> {submission.brand_name}
            </p>
            <p>
              <strong>Ordered By:</strong> {submission.ordered_by} ({submission.email})
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="delivery_details">Delivery Details (Courier, Tracking #, etc.)</Label>
            <Controller
              name="delivery_details"
              control={control}
              render={({ field }) => <Textarea id="delivery_details" {...field} />}
            />
          </div>
          <div>
            <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
            <Controller
              name="expected_delivery_date"
              control={control}
              rules={{ required: "Delivery date is required." }}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.expected_delivery_date && (
              <p className="text-xs text-red-500 mt-1">{errors.expected_delivery_date.message}</p>
            )}
          </div>
          {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save and Complete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SubmissionDetailsDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: Submission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!submission) return null

  const orderedItems = Object.values(submission.items || {})

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Order Details: {submission.order_number}</DialogTitle>
          <DialogDescription>
            A complete summary of the order submitted on{" "}
            {new Date(submission.created_at).toLocaleString("en-AU", {
              dateStyle: "full",
              timeStyle: "short",
            })}
            .
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 max-h-[70vh] overflow-y-auto pr-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Brand:</span>
                <span>{submission.brand_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Status:</span>
                <Badge
                  variant={submission.status === "completed" ? "default" : "secondary"}
                  className={submission.status === "completed" ? "bg-green-100 text-green-800" : ""}
                >
                  {submission.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">PDF:</span>
                <a
                  href={submission.pdf_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Download
                </a>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submitter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Ordered By:</span>
                <span>{submission.ordered_by}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">Email:</span>
                <div className="flex items-center gap-2">
                  <span>{submission.email}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(submission.email)}
                  >
                    <ClipboardCopy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">IP Address:</span>
                <span>{submission.ip_address || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Clinic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Deliver To:</span>
                <span className="text-right whitespace-pre-wrap">{submission.deliver_to}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Bill To:</span>
                <span>{submission.bill_to}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Ordered Items ({orderedItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedItems.map((item: any, index: number) => (
                    <TableRow key={item.code || index}>
                      <TableCell className="font-mono text-xs">{item.code}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity === "other" ? item.customQuantity || "N/A" : item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end pt-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminDashboard({
  initialSubmissions,
  initialBrands,
}: {
  initialSubmissions: Submission[]
  initialBrands: Brand[]
}) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)

  useEffect(() => {
    setSubmissions(initialSubmissions)
  }, [initialSubmissions])

  const handleRowClick = (submission: Submission) => {
    setSelectedSubmission(submission)
    setIsDetailsDialogOpen(true)
  }

  const handleMarkAsCompleteClick = (e: React.MouseEvent, submission: Submission) => {
    e.stopPropagation() // Prevent row click from firing
    setSelectedSubmission(submission)
    setIsCompleteDialogOpen(true)
  }

  const handleCompletion = () => {
    setIsCompleteDialogOpen(false)
    setSelectedSubmission(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <div className="ml-auto flex items-center gap-2">
                <RefreshButton />
                <Link href="/admin/editor/focus-radiology">
                  <Button>Manage Forms</Button>
                </Link>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Order Submissions</CardTitle>
                <CardDescription>View and manage all order submissions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow
                        key={submission.id}
                        onClick={() => handleRowClick(submission)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell className="font-medium">{submission.order_number}</TableCell>
                        <TableCell>{format(new Date(submission.created_at), "PPP p")}</TableCell>
                        <TableCell>{submission.brand.name}</TableCell>
                        <TableCell>{submission.name}</TableCell>
                        <TableCell>{submission.email}</TableCell>
                        <TableCell>
                          <Badge variant={submission.completed_at ? "default" : "secondary"}>
                            {submission.completed_at ? "Completed" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!submission.completed_at && <MarkAsCompleteButton submission={submission} />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      <SubmissionDetailsDialog
        submission={selectedSubmission}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
      <CompleteSubmissionDialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        submission={selectedSubmission}
        onCompleted={handleCompletion}
      />
    </>
  )
}
