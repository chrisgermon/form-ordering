"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Submission } from "@/lib/types"
import { format } from "date-fns"

export function SubmissionDetailsDialog({
  submission,
  isOpen,
  onClose,
}: {
  submission: Submission | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!submission) return null

  const { order_data, created_at, ordered_by, email, ip_address, brands, pdf_url } = submission
  const orderInfo = order_data?.orderInfo || {}
  const items = order_data?.items || {}
  const orderItems = Object.values(items).filter((item: any) => item && item.quantity)
  const order_number = orderInfo.orderNumber
  const brand_name = brands?.name

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order Summary: {order_number}</DialogTitle>
          <DialogDescription>
            Submitted on {format(new Date(created_at), "dd/MM/yyyy 'at' hh:mm a")} for {brand_name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">Submitter Details</h4>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Name:</strong> {ordered_by}
                </p>
                <p>
                  <strong>Email:</strong> {email}
                </p>
                <p>
                  <strong>IP Address:</strong> {ip_address}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">Order Info</h4>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Ordered By:</strong> {orderInfo.orderedBy || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">Billing Address</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{orderInfo.billTo?.name || "N/A"}</p>
                <p>{orderInfo.billTo?.address}</p>
                <p>Phone: {orderInfo.billTo?.phone}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">Delivery Address</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{orderInfo.deliverTo?.name || "N/A"}</p>
                <p>{orderInfo.deliverTo?.address}</p>
                <p>Phone: {orderInfo.deliverTo?.phone}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Ordered Items</h4>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.length > 0 ? (
                    orderItems.map((item: any) => (
                      <TableRow key={item.code}>
                        <TableCell className="font-mono text-xs">{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.quantity === "other" ? item.customQuantity : item.quantity}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No items in this order.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {orderInfo.notes && (
            <div>
              <h4 className="font-semibold text-gray-800">Notes</h4>
              <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-md border mt-2">{orderInfo.notes}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {pdf_url && (
            <Button asChild>
              <a href={pdf_url} target="_blank" rel="noopener noreferrer">
                View PDF
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
