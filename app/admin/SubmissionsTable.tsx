"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Submission, Brand } from "@/lib/types"
import { format } from "date-fns"

interface SubmissionsTableProps {
  submissions: Submission[]
  brands: Brand[]
}

export function SubmissionsTable({ submissions, brands }: SubmissionsTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  const brandMap = useMemo(() => {
    if (!brands) return new Map()
    return new Map(brands.map((brand) => [brand.id, brand.name]))
  }, [brands])

  if (!submissions || submissions.length === 0) {
    return <p className="text-center py-8 text-gray-500">No submissions yet.</p>
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>{format(new Date(submission.created_at), "dd MMM yyyy, h:mm a")}</TableCell>
              <TableCell>{brandMap.get(submission.brand_id) || "Unknown Brand"}</TableCell>
              <TableCell className="text-right">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Submission Details</DialogTitle>
                    </DialogHeader>
                    {selectedSubmission && (
                      <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {Object.entries(selectedSubmission.form_data).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-3 gap-4">
                            <span className="font-semibold text-gray-600 capitalize col-span-1">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="text-gray-800 col-span-2">
                              {Array.isArray(value) ? value.join(", ") : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
