"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, ExternalLink } from "lucide-react"

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
    slug: string
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
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Order Information</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Brand:</strong> {submission.brands.name}
                </p>
                <p>
                  <strong>Ordered By:</strong> {submission.ordered_by}
                </p>
                <p>
                  <strong>Email:</strong> {submission.email}
                </p>
                <p>
                  <strong>Bill To:</strong> {submission.bill_to}
                </p>
                <p>
                  <strong>Deliver To:</strong> {submission.deliver_to}
                </p>
                <p>
                  <strong>Order Date:</strong>{" "}
                  {submission.order_date ? new Date(submission.order_date).toLocaleDateString() : "Not specified"}
                </p>
                <p>
                  <strong>Submitted:</strong> {new Date(submission.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong>
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
                    className="ml-2"
                  >
                    {submission.status}
                  </Badge>
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Technical Details</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Submission ID:</strong> {submission.id}
                </p>
                <p>
                  <strong>IP Address:</strong> {submission.ip_address}
                </p>
                <p>
                  <strong>PDF:</strong>
                  {submission.pdf_url ? (
                    <a
                      href={submission.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-2 inline-flex items-center"
                    >
                      View PDF <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  ) : (
                    <span className="ml-2 text-gray-500">Not available</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Ordered Items</h3>
            {items.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: any, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name || "Unknown Item"}</TableCell>
                        <TableCell>{item.code || "N/A"}</TableCell>
                        <TableCell>
                          {item.quantity === "other"
                            ? `${item.customQuantity || "N/A"} (custom)`
                            : item.quantity || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-gray-500">No items found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  const filteredSubmissions = submissions.filter(
    (submission) => selectedStatus === "all" || submission.status === selectedStatus,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={selectedStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus("all")}
          >
            All
          </Button>
          <Button
            variant={selectedStatus === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus("pending")}
          >
            Pending
          </Button>
          <Button
            variant={selectedStatus === "sent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus("sent")}
          >
            Sent
          </Button>
          <Button
            variant={selectedStatus === "failed" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus("failed")}
          >
            Failed
          </Button>
          <Button
            variant={selectedStatus === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus("completed")}
          >
            Completed
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Ordered By</TableHead>
                <TableHead>Deliver To</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No submissions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.brands.name}</TableCell>
                    <TableCell>{submission.ordered_by}</TableCell>
                    <TableCell>{submission.deliver_to}</TableCell>
                    <TableCell>{Object.keys(submission.items || {}).length} items</TableCell>
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
                      <ViewDetailsDialog submission={submission} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
