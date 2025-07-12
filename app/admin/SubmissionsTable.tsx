"use client"
import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, RefreshCw, Loader2 } from "lucide-react"
import type { FormSubmission } from "@/lib/types"

export function SubmissionsTable({
  submissions,
  onRefresh,
}: {
  submissions: FormSubmission[]
  onRefresh: () => Promise<void>
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filteredSubmissions = useMemo(() => {
    if (!submissions) return []
    if (!searchTerm) return submissions

    const term = searchTerm.toLowerCase()
    return submissions.filter(
      (sub) =>
        sub.ordered_by?.toLowerCase().includes(term) ||
        sub.email?.toLowerCase().includes(term) ||
        sub.brands?.name?.toLowerCase().includes(term),
    )
  }, [submissions, searchTerm])

  const handleRefreshClick = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setIsRefreshing(false)
  }

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case "sent":
        return "default"
      case "failed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by name, email, or brand..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleRefreshClick} disabled={isRefreshing} variant="outline">
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Ordered By</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(sub.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.brands?.name || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>{sub.ordered_by || "N/A"}</TableCell>
                  <TableCell>{sub.email || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(sub.status)}>{sub.status || "pending"}</Badge>
                  </TableCell>
                  <TableCell>
                    {sub.pdf_url ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={sub.pdf_url} target="_blank" rel="noopener noreferrer">
                          View PDF
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    ) : (
                      "No PDF"
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  No submissions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
