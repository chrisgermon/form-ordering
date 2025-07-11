"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { FormSubmission } from "@/lib/types"

export function SubmissionsTable({ submissions }: { submissions: FormSubmission[] }) {
  if (!submissions || submissions.length === 0) {
    return <div className="text-center py-12 text-gray-500">No submissions yet.</div>
  }

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Patient Name</TableHead>
            <TableHead>Referrer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(sub.submitted_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{sub.brands?.name || "N/A"}</Badge>
              </TableCell>
              <TableCell>{getNestedValue(sub.form_data, "patientDetails.patientName") || "N/A"}</TableCell>
              <TableCell>{getNestedValue(sub.form_data, "referringPractitioner.gpName") || "N/A"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
