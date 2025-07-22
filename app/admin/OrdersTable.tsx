"use client"

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { OrderWithBrand } from "@/lib/types"
import Link from "next/link"

export function OrdersTable({ orders }: { orders: OrderWithBrand[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>Patient Name</TableHead>
          <TableHead>Referring Doctor</TableHead>
          <TableHead>Submitted At</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>{order.id}</TableCell>
            <TableCell>{order.brands?.name ?? "N/A"}</TableCell>
            <TableCell>{order.patient_name}</TableCell>
            <TableCell>{order.referring_doctor}</TableCell>
            <TableCell>{new Date(order.submitted_at).toLocaleString()}</TableCell>
            <TableCell>
              <Badge>{order.status}</Badge>
            </TableCell>
            <TableCell>
              {order.pdf_url && (
                <Button asChild variant="outline" size="sm">
                  <Link href={order.pdf_url} target="_blank" rel="noopener noreferrer">
                    View PDF
                  </Link>
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
