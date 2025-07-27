"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import BrandEditor from "./BrandEditor"
import AdminActions from "./AdminActions"
import SubmissionsTable from "./SubmissionsTable"
import type { Brand, Submission } from "@/lib/types"
import { deleteBrand } from "./actions"
import { useToast } from "@/components/ui/use-toast"

interface AdminDashboardProps {
  brands: Brand[]
  submissions: Submission[]
}

export default function AdminDashboard({ brands, submissions }: AdminDashboardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const { toast } = useToast()

  const handleCreateNew = () => {
    setSelectedBrand(null)
    setIsEditorOpen(true)
  }

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsEditorOpen(true)
  }

  const handleDelete = async (brandId: number) => {
    if (window.confirm("Are you sure you want to delete this brand? This action cannot be undone.")) {
      const result = await deleteBrand(brandId)
      if (result.success) {
        toast({ title: "Success", description: "Brand deleted successfully." })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete brand.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your brands, forms, and submissions.</p>
        </div>
        <AdminActions />
      </header>

      <main className="space-y-8">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Brands</h2>
            <Button onClick={handleCreateNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Brand
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <Card key={brand.id} className="flex flex-col">
                <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                    {brand.logo_url ? (
                      <Image
                        src={brand.logo_url || "/placeholder.svg"}
                        alt={`${brand.name} logo`}
                        width={48}
                        height={48}
                        objectFit="contain"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">No Logo</span>
                    )}
                  </div>
                  <div className="flex-grow">
                    <CardTitle className="text-lg">{brand.name}</CardTitle>
                    <Badge variant={brand.is_active ? "default" : "outline"} className="mt-1">
                      {brand.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    <Link
                      href={`/forms/${brand.slug}`}
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      /forms/{brand.slug}
                    </Link>
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(brand)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(brand.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                  <Link href={`/admin/editor/${brand.slug}`} passHref>
                    <Button>Edit Form</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Recent Submissions</h2>
          <SubmissionsTable submissions={submissions} />
        </section>
      </main>

      <BrandEditor
        isOpen={isEditorOpen}
        setIsOpen={setIsEditorOpen}
        brand={selectedBrand}
        onSuccess={() => setIsEditorOpen(false)}
      />
    </div>
  )
}
