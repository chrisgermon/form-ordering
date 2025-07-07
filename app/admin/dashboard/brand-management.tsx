"use client"

import { useState } from "react"
import { PlusCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type { Brand } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { BrandForm } from "./BrandForm"
import { deleteBrand } from "../dashboard/actions"

interface BrandManagementProps {
  brands: Brand[]
}

export function BrandManagement({ brands }: BrandManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const handleAddBrand = () => {
    setSelectedBrand(null)
    setDialogOpen(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const result = await deleteBrand(id)
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Management</CardTitle>
        <CardDescription>Add, edit, or remove brands.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleAddBrand} className="mb-4">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Brand
        </Button>
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-4">
                {brand.logo_url && (
                  <img src={brand.logo_url || "/placeholder.svg"} alt={`${brand.name} logo`} className="h-8 w-auto" />
                )}
                <span className="font-medium">{brand.name}</span>
                <span className={`text-sm ${brand.active ? "text-green-600" : "text-red-600"}`}>
                  {brand.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditBrand(brand)}>
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the brand and all associated forms
                        and submissions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(brand.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
            </DialogHeader>
            <BrandForm brand={selectedBrand} onSave={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
