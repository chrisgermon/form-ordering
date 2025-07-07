"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { CheckCircle, FileText, MoreHorizontal, Search } from "lucide-react"

import type { Submission, Brand } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"
import { MarkCompleteDialog } from "./MarkCompleteDialog"

interface SubmissionsTableProps {
  submissions: Submission[]
  brands: Brand[]
}

export function SubmissionsTable({ submissions, brands }: SubmissionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [brandFilter, setBrandFilter] = useState("all")
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isDetailsOpen, setDetailsOpen] = useState(false)
  const [isCompleteOpen, setCompleteOpen] = useState(false)

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const brand = submission.brands as Brand | null
      const matchesSearch =
        submission.order_number.toString().includes(searchTerm) ||
        submission.ordered_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || submission.status.toLowerCase() === statusFilter
      const matchesBrand = brandFilter === "all" || (brand && brand.id === brandFilter)
      return matchesSearch && matchesStatus && matchesBrand
    })
  }, [submissions, searchTerm, statusFilter, brandFilter])

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission)
    setDetailsOpen(true)
  }

  const handleMarkComplete = (submission: Submission) => {
    setSelectedSubmission(submission)
    setCompleteOpen(true)
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Complete">Complete</SelectItem>
          </SelectContent>
        </Select>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Ordered By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.map((submission) => {
              const brand = submission.brands as Brand | null
              return (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.order_number}</TableCell>
                  <TableCell>{brand?.name || "N/A"}</TableCell>
                  <TableCell>{submission.ordered_by}</TableCell>
                  <TableCell>{format(new Date(submission.created_at), "dd MMM yyyy, HH:mm")}</TableCell>
                  <TableCell>
                    <Badge variant={submission.status === "Complete" ? "default" : "secondary"}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(submission)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {submission.status !== "Complete" && (
                          <DropdownMenuItem onClick={() => handleMarkComplete(submission)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Complete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      {selectedSubmission && (
        <>
          <SubmissionDetailsDialog
            submission={selectedSubmission}
            isOpen={isDetailsOpen}
            onOpenChange={setDetailsOpen}
          />
          <MarkCompleteDialog submission={selectedSubmission} isOpen={isCompleteOpen} onOpenChange={setCompleteOpen} />
        </>
      )}
    </div>
  )
}
