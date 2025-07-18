"use client"

import { useState, useMemo } from "react"
import type { Submission, Brand } from "@/lib/types"
import { SubmissionsTable } from "./SubmissionsTable"

type SortKey = keyof Submission | "brand_name"
type SortDirection = "asc" | "desc"

interface SubmissionsClientProps {
  initialSubmissions: Submission[]
  brands: Brand[]
}

export function SubmissionsClient({ initialSubmissions, brands }: SubmissionsClientProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const getBrandName = (brandId: string | null) => {
    if (!brandId) return "N/A"
    return brands.find((b) => b.id === brandId)?.name || "Unknown Brand"
  }

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
      let valA: any
      let valB: any

      if (sortKey === "brand_name") {
        valA = getBrandName(a.brand_id)
        valB = getBrandName(b.brand_id)
      } else {
        valA = a[sortKey as keyof Submission]
        valB = b[sortKey as keyof Submission]
      }

      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      if (valA < valB) {
        return sortDirection === "asc" ? -1 : 1
      }
      if (valA > valB) {
        return sortDirection === "asc" ? 1 : -1
      }
      return 0
    })
  }, [submissions, sortKey, sortDirection, brands])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  return (
    <SubmissionsTable
      submissions={sortedSubmissions}
      brands={brands}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
    />
  )
}
