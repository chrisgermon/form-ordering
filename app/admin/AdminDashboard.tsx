"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PlusCircle, Home } from "lucide-react"
import SubmissionsTable from "./SubmissionsTable"
import { toast } from "sonner"
import type { Submission, Brand } from "@/lib/types"

type FormattedSubmission = Submission & { brand_name: string }

interface AdminDashboardProps {
  initialSubmissions: Submission[]
  initialBrands: Brand[]
}

export default function AdminDashboard({ initialSubmissions, initialBrands }: AdminDashboardProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [brands, setBrands] = useState(initialBrands)

  const refreshSubmissions = async () => {
    try {
      const response = await fetch("/api/admin/submissions")
      if (!response.ok) throw new Error("Failed to fetch submissions")
      const data = await response.json()
      setSubmissions(data)
    } catch (error) {
      toast.error("Could not refresh submissions.")
    }
  }

  const handleStatusUpdate = async (submissionId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update status")
      }
      toast.success(`Submission status updated to ${status.replace("_", " ")}.`)
      // Optimistically update UI or refresh
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) => (sub.id === submissionId ? { ...sub, status: status } : sub)),
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast.error(`Error: ${errorMessage}`)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="ml-auto">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Home className="h-4 w-4" />
              View Forms
            </Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 p-4 sm:px-6 sm:py-0">
        <div className="grid auto-rows-max items-start gap-4 py-4 md:gap-8 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Brands</CardTitle>
              <Link href="/admin/editor/new">
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Brand</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {brands.length > 0 ? (
                <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {brands.map((brand) => (
                    <li key={brand.id}>
                      <Link href={`/admin/editor/${brand.slug}`}>
                        <div className="group flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent">
                          <img
                            src={brand.logo || "/placeholder-logo.svg"}
                            alt={`${brand.name} logo`}
                            className="h-16 w-16 object-contain"
                          />
                          <span className="text-center font-medium">{brand.name}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-muted-foreground">No brands created yet.</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionsTable submissions={submissions} onStatusUpdate={handleStatusUpdate} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
