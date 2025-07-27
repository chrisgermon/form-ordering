"use client"

import { useState, useEffect } from "react"
import AdminDashboard from "./AdminDashboard"
import { Loader2 } from "lucide-react"
import type { Brand, Submission } from "@/lib/types"

export default function AdminPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [submissions, setSubmissions] = useState<(Submission & { brand_name: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [brandsRes, submissionsRes] = await Promise.all([
          fetch("/api/admin/brands"),
          fetch("/api/admin/submissions"),
        ])

        if (!brandsRes.ok) {
          const errorData = await brandsRes.json().catch(() => ({ message: brandsRes.statusText }))
          throw new Error(`Failed to fetch brands: ${errorData.message || brandsRes.statusText}`)
        }
        if (!submissionsRes.ok) {
          const errorData = await submissionsRes.json().catch(() => ({ message: submissionsRes.statusText }))
          throw new Error(`Failed to fetch submissions: ${errorData.message || submissionsRes.statusText}`)
        }

        const brandsData = await brandsRes.json()
        const submissionsData = await submissionsRes.json()

        setBrands(brandsData || [])
        setSubmissions(submissionsData || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error) {
    return <p className="text-red-500 p-8">Error loading admin data: {error}</p>
  }

  return <AdminDashboard initialBrands={brands} initialSubmissions={submissions} />
}
