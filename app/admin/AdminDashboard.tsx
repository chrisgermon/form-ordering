"use client"

import { useState } from "react"
import type { Brand, Submission } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import SubmissionsTable from "./SubmissionsTable"

interface AdminDashboardProps {
  initialBrands?: Brand[]
  initialSubmissions?: Submission[]
}

export default function AdminDashboard({ initialBrands = [], initialSubmissions = [] }: AdminDashboardProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)

  const handleStatusUpdate = (submissionId: string, newStatus: string) => {
    setSubmissions((prevSubmissions) =>
      prevSubmissions.map((sub) => (sub.id === submissionId ? { ...sub, status: newStatus } : sub)),
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100/40 dark:bg-gray-800/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 dark:bg-gray-950">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs defaultValue="submissions">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                <TabsTrigger value="brands">Brands</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="submissions">
              <SubmissionsTable submissions={submissions} onStatusUpdate={handleStatusUpdate} />
            </TabsContent>
            <TabsContent value="brands">
              <Card>
                <CardHeader>
                  <CardTitle>Brands</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {brands.map((brand) => (
                      <Link href={`/admin/editor/${brand.slug}`} key={brand.id}>
                        <Card className="h-full transform transition-transform duration-200 hover:scale-105">
                          <CardContent className="flex flex-col items-center justify-center p-6">
                            {brand.logo_url && (
                              <img
                                src={brand.logo_url || "/placeholder.svg"}
                                alt={`${brand.name} logo`}
                                className="mb-4 h-16 w-auto object-contain"
                              />
                            )}
                            <h3 className="text-lg font-semibold">{brand.name}</h3>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
