"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, ExternalLink, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface Submission {
  id: string
  brand_id: string
  ordered_by: string
  email: string
  bill_to: string
  deliver_to: string
  order_date: string | null
  items: Record<string, any>
  pdf_url: string
  ip_address: string
  status: "pending" | "sent" | "failed" | "completed"
  created_at: string
  brands: {
    name: string
    email: string
  }
}

interface SubmissionsTableProps {
  submissions: Submission[]
}

function ViewDetailsDialog({ submission }: { submission: Submission }) {
  const items = Object.values(submission.items || {})

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>Submission ID: {submission.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Brand:</span>
                <p>{submission.brands.name}</p>
              </div>
              <div>
                <span className="font-medium">Ordered By:</span>
                <p>{submission.ordered_by}</p>
              </div>
              <div>
                <span className="font-medium">Email:</span>
                <p>{submission.email}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge
                  variant={
                    submission.status === "completed"
                      ? "default"
                      : submission.status === "sent"
                        ? "secondary"
                        : submission.status === "failed"
                          ? "destructive"
                          : "outline"
                  }
                >
                  {submission.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Bill To:</span>
                <p>{submission.bill_to}</p>
              </div>
              <div>
                <span className="font-medium">Deliver To:</span>
                <p>{submission.deliver_to}</p>
              </div>
              <div>
                <span className="font-medium">Order Date:</span>
                <p>{submission.order_date ? new Date(submission.order_date).toLocaleDateString() : "Not specified"}</p>
              </div>
              <div>
                <span className="font-medium">Submitted:</span>
                <p>{new Date(submission.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Ordered Items</h3>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.code && <p className="text-sm text-gray-600">Code: {item.code}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {item.quantity === "other" ? `${item.customQuantity || "N/A"} (custom)` : item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No items found</p>
            )}
          </div>

          {/* PDF Link */}
          {submission.pdf_url && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Documents</h3>
              <Button variant="outline" asChild>
                <a href={submission.pdf_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View PDF
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

async function markAsComplete(submissionId: string) {
  try {
    const response = await fetch(`/api/admin/submissions/${submissionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "completed" }),
    })

    if (!response.ok) {
      throw new Error("Failed to update submission")
    }

    toast.success("Submission marked as complete")
    window.location.reload() // Simple refresh for now
  } catch (error) {
    console.error("Error updating submission:", error)
    toast.error("Failed to update submission")
  }
}

export default function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Brand</TableHead>
            <TableHead>Ordered By</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Deliver To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell className="font-medium">{submission.brands.name}</TableCell>
              <TableCell>{submission.ordered_by}</TableCell>
              <TableCell>{submission.email}</TableCell>
              <TableCell>{submission.deliver_to}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    submission.status === "completed"
                      ? "default"
                      : submission.status === "sent"
                        ? "secondary"
                        : submission.status === "failed"
                          ? "destructive"
                          : "outline"
                  }
                >
                  {submission.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <ViewDetailsDialog submission={submission} />
                  {submission.status !== "completed" && (
                    <Button variant="outline" size="sm" onClick={() => markAsComplete(submission.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
