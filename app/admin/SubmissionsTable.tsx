"use client"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, ExternalLink, Calendar, User, Mail, Phone, MapPin, Package } from "lucide-react"
import type { Submission, OrderItem } from "@/lib/types"

interface SubmissionsTableProps {
  submissions: Submission[]
  onStatusUpdate: (id: string, status: string) => void
}

export default function SubmissionsTable({ submissions = [], onStatusUpdate }: SubmissionsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredSubmissions = submissions.filter(
    (submission) => statusFilter === "all" || submission.status === statusFilter,
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getItemsCount = (items: OrderItem[] | Record<string, OrderItem>): number => {
    if (!items) return 0
    if (Array.isArray(items)) {
      return items.length
    }
    if (typeof items === "object") {
      return Object.keys(items).length
    }
    return 0
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <label htmlFor="status-filter" className="text-sm font-medium">
          Filter by status:
        </label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Ordered By</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No submissions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{formatDate(submission.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{submission.brand?.name || "Unknown Brand"}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{submission.ordered_by}</div>
                      <div className="text-sm text-gray-500">{submission.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getItemsCount(submission.items)} item{getItemsCount(submission.items) !== 1 ? "s" : ""}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(submission.status)}>{submission.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Order Details</DialogTitle>
                            <DialogDescription>Submission from {formatDate(submission.created_at)}</DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                  <User className="h-5 w-5 mr-2" />
                                  Contact Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Name:</span>
                                  <span>{submission.ordered_by}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Email:</span>
                                  <span>{submission.email}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Phone:</span>
                                  <span>{submission.phone}</span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                  <MapPin className="h-5 w-5 mr-2" />
                                  Addresses
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div>
                                  <span className="font-medium">Bill To:</span>
                                  <p className="text-sm text-gray-600 mt-1">{submission.bill_to}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Deliver To:</span>
                                  <p className="text-sm text-gray-600 mt-1">{submission.deliver_to}</p>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                  <Package className="h-5 w-5 mr-2" />
                                  Items Ordered
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {(() => {
                                    const itemsArray = Array.isArray(submission.items)
                                      ? submission.items
                                      : Object.values(submission.items || {})
                                    return itemsArray.map((item, index) => (
                                      <div key={index} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium">{item.name}</span>
                                          <Badge variant="secondary">Qty: {item.quantity}</Badge>
                                        </div>
                                        {item.notes && (
                                          <p className="text-sm text-gray-600">
                                            <span className="font-medium">Notes:</span> {item.notes}
                                          </p>
                                        )}
                                      </div>
                                    ))
                                  })()}
                                </div>
                              </CardContent>
                            </Card>

                            {submission.special_instructions && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Special Instructions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm">{submission.special_instructions}</p>
                                </CardContent>
                              </Card>
                            )}

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Order Status & Documents</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">Status:</span>
                                  <Badge className={getStatusColor(submission.status)}>
                                    {submission.status.replace("_", " ")}
                                  </Badge>
                                </div>
                                {submission.pdf_url && (
                                  <div>
                                    <Button asChild variant="outline" size="sm">
                                      <a
                                        href={submission.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center"
                                      >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        View PDF
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Select value={submission.status} onValueChange={(value) => onStatusUpdate(submission.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
