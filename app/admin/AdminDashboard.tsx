"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import SubmissionsTable from "./SubmissionsTable" // Corrected: default import
import { signOut } from "../login/actions"
import type { Brand, Submission } from "@/lib/types"
import Link from "next/link"

interface AdminDashboardProps {
  initialBrands: Brand[]
  initialSubmissions: Submission[]
}

export default function AdminDashboard({ initialBrands = [], initialSubmissions = [] }: AdminDashboardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      const updatedSubmission = await response.json()

      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) => (sub.id === id ? { ...sub, status: updatedSubmission.status } : sub)),
      )

      toast({
        title: "Success",
        description: `Submission status updated to ${status.replace("_", " ")}.`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update submission status.",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleSignOut} variant="outline">
          Sign Out
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <Link href={`/admin/editor/${brand.slug}`} key={brand.id}>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <h3 className="font-semibold">{brand.name}</h3>
                  <p className="text-sm text-gray-500">{brand.slug}</p>
                </div>
              </Link>
            ))}
          </div>
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
  )
}
