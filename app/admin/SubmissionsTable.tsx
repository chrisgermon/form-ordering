"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import type { FormSubmission } from "@/lib/types"

export function SubmissionsTable({ submissions }: { submissions: FormSubmission[] }) {
  if (!submissions || submissions.length === 0) {
    return <div className="text-center py-12 text-gray-500">No submissions yet.</div>
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
    <div className="border rounded-lg overflow-hidden">
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
          {submissions.map((sub) => (
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
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
