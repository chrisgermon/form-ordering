"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import type { Brand, UploadedFile, Submission } from "@/lib/types"
import BrandGrid from "@/components/brand-grid"
import SubmissionsTable from "./SubmissionsTable"

type FormattedSubmission = Submission & { brand_name: string }

interface AdminDashboardProps {
  initialBrands: Brand[]
  initialSubmissions: FormattedSubmission[]
}

export default function AdminDashboard({ initialBrands, initialSubmissions }: AdminDashboardProps) {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [submissions, setSubmissions] = useState<FormattedSubmission[]>(initialSubmissions)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isBrandFormOpen, setIsBrandFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshData = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch("/api/admin/files")
        if (!res.ok) throw new Error("Failed to fetch files")
        const data = await res.json()
        setUploadedFiles(data)
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Could not load uploaded files.",
          variant: "destructive",
        })
      }
    }
    fetchFiles()
  }, [])

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsBrandFormOpen(true)
  }

  const handleAddNewBrand = () => {
    setSelectedBrand(null)
    setIsBrandFormOpen(true)
  }

  const handleSaveBrand = async (brandData: any) => {
    setIsLoading(true)
    const method = brandData.id ? "PUT" : "POST"
    const endpoint = brandData.id ? `/api/admin/brands/${brandData.id}` : "/api/admin/brands"

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save brand.")
      }

      toast({
        title: "Success",
        description: `Brand ${brandData.id ? "updated" : "created"} successfully.`,
      })
      setIsBrandFormOpen(false)
      refreshData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleAddNewBrand}>Add New Brand</Button>
      </div>
      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions">
          <SubmissionsTable submissions={submissions} refreshSubmissions={refreshData} />
        </TabsContent>
        <TabsContent value="brands">
          <BrandGrid brands={brands} onEdit={handleEditBrand} />
        </TabsContent>
      </Tabs>

      <Dialog open={isBrandFormOpen} onOpenChange={setIsBrandFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
          </DialogHeader>
          <BrandForm
            brand={selectedBrand}
            uploadedFiles={uploadedFiles}
            onSave={handleSaveBrand}
            onCancel={() => setIsBrandFormOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BrandForm({
  brand,
  uploadedFiles,
  onSave,
  onCancel,
  isLoading,
}: {
  brand: Brand | null
  uploadedFiles: UploadedFile[]
  onSave: (brand: any) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    id: brand?.id || undefined,
    name: brand?.name || "",
    logo: brand?.logo || "",
    primary_color: brand?.primary_color || "",
    email: brand?.email || "",
    active: brand?.active ?? true,
  })
  const [clinicsText, setClinicsText] = useState(brand?.clinics?.join("\n") || "")

  useEffect(() => {
    if (brand) {
      setFormData({
        id: brand.id,
        name: brand.name,
        logo: brand.logo || "",
        primary_color: brand.primary_color || "",
        email: brand.email,
        active: brand.active,
      })
      setClinicsText(brand.clinics?.join("\n") || "")
    } else {
      setFormData({
        id: undefined,
        name: "",
        logo: "",
        primary_color: "",
        email: "",
        active: true,
      })
      setClinicsText("")
    }
  }, [brand])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clinicsArray = clinicsText
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean)
    onSave({ ...formData, clinics: clinicsArray })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="name">Brand Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="primaryColor">Primary Color</Label>
        <Input
          id="primaryColor"
          placeholder="e.g., #007bff or a Tailwind color"
          value={formData.primary_color}
          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="email">Recipient Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="orders@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="logo">Logo URL</Label>
        <Select
          value={formData.logo}
          onValueChange={(value) => setFormData({ ...formData, logo: value === "none" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an uploaded logo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No logo</SelectItem>
            {Array.isArray(uploadedFiles) &&
              uploadedFiles.map((file) => (
                <SelectItem key={file.id} value={file.url}>
                  {file.original_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Input
          className="mt-2"
          placeholder="Or enter custom URL"
          value={formData.logo}
          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="clinics">Clinic Locations (one per line)</Label>
        <Textarea
          id="clinics"
          value={clinicsText}
          onChange={(e) => setClinicsText(e.target.value)}
          rows={6}
          placeholder={"Botanic Ridge\nBulleen\nCarnegie"}
        />
      </div>
      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="active"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
        />
        <Label htmlFor="active" className="font-medium">
          Active
        </Label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  )
}
