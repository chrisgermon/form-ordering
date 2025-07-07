"use client"

import { useState, useMemo } from "react"
import type { Submission } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog"
import { MarkCompleteDialog } from "./MarkCompleteDialog"
import { RefreshCw } from "lucide-react"

export function SubmissionsTable({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [filter, setFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch("/api/admin/submissions")
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error("Failed to refresh submissions", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((submission) => {
        if (statusFilter === "all") return true
        return submission.status.toLowerCase() === statusFilter
      })
      .filter((submission) => {
        const searchLower = filter.toLowerCase()
        return (
          submission.id.toString().includes(searchLower) ||
          submission.brands?.name.toLowerCase().includes(searchLower) ||
          submission.ordered_by.toLowerCase().includes(searchLower) ||
          submission.email.toLowerCase().includes(searchLower)
        )
      })
  }, [submissions, filter, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Filter by ID, Brand, Name, or Email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="icon">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Ordered By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-mono text-xs">{submission.id.substring(0, 8)}</TableCell>
                <TableCell>{submission.brands?.name || "N/A"}</TableCell>
                <TableCell>{submission.ordered_by}</TableCell>
                <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{submission.status}</TableCell>
                <TableCell className="space-x-2">
                  <SubmissionDetailsDialog submission={submission} />
                  {submission.status === "Pending" && <MarkCompleteDialog submission={submission} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
