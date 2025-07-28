"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Download, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { OrderSubmission } from "@/lib/types"

interface SubmissionsTableProps {
  initialSubmissions: OrderSubmission[]
}

export default function SubmissionsTable({ initialSubmissions }: SubmissionsTableProps) {
  const [submissions, setSubmissions] = useState<OrderSubmission[]>(initialSubmissions)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<OrderSubmission | null>(null)

  const refreshSubmissions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/submissions")
      const data = await response.json()
      if (data.success) {
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error("Error refreshing submissions:", error)
      toast.error("Failed to refresh submissions")
    } finally {
      setIsLoading(false)
    }
  }

  const updateSubmissionStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()
      if (result.success) {
        setSubmissions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, status } : sub)))
        toast.success("Status updated successfully")
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Order Submissions</CardTitle>
            <CardDescription>Manage and track all order submissions</CardDescription>
          </div>
          <Button onClick={refreshSubmissions} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ordered By</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Bill To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{submission.ordered_by}</TableCell>
                    <TableCell>{submission.email}</TableCell>
                    <TableCell>{submission.bill_to}</TableCell>
                    <TableCell>
                      <Select
                        value={submission.status}
                        onValueChange={(value) => updateSubmissionStatus(submission.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                              <DialogDescription>
                                Submission from {selectedSubmission?.ordered_by} on{" "}
                                {selectedSubmission && new Date(selectedSubmission.created_at).toLocaleDateString()}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedSubmission && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold">Contact Information</h4>
                                    <p>Name: {selectedSubmission.ordered_by}</p>
                                    <p>Email: {selectedSubmission.email}</p>
                                    {selectedSubmission.phone && <p>Phone: {selectedSubmission.phone}</p>}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Delivery Information</h4>
                                    <p>Bill To: {selectedSubmission.bill_to}</p>
                                    <p>Deliver To: {selectedSubmission.deliver_to}</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-2">Items Ordered</h4>
                                  <div className="space-y-2">
                                    {Object.entries(selectedSubmission.items || {}).map(
                                      ([key, item]: [string, any]) => (
                                        <div
                                          key={key}
                                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                        >
                                          <span>{item.name}</span>
                                          <Badge variant="secondary">
                                            {item.quantity === "other" ? item.customQuantity : item.quantity}
                                          </Badge>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>

                                {selectedSubmission.special_instructions && (
                                  <div>
                                    <h4 className="font-semibold">Special Instructions</h4>
                                    <p className="text-gray-600">{selectedSubmission.special_instructions}</p>
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(selectedSubmission.status)}>
                                    {selectedSubmission.status}
                                  </Badge>
                                  {selectedSubmission.pdf_url && (
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={selectedSubmission.pdf_url} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4 mr-1" />
                                        Download PDF
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
