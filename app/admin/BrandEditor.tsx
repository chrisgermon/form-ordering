"use client"

import { useState, useTransition } from "react"
import type { Brand, Clinic } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { createBrand, updateBrand, deleteBrand } from "./actions"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"

interface BrandEditorProps {
  brand?: Brand | null
  isOpen: boolean
  onClose: () => void
}

export default function BrandEditor({ brand, isOpen, onClose }: BrandEditorProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const [clinics, setClinics] = useState<Clinic[]>(brand?.clinics || [{ name: "", address: "" }])

  const handleClinicChange = (index: number, field: keyof Clinic, value: string) => {
    const newClinics = [...clinics]
    newClinics[index][field] = value
    setClinics(newClinics)
  }

  const addClinic = () => {
    setClinics([...clinics, { name: "", address: "" }])
  }

  const removeClinic = (index: number) => {
    const newClinics = clinics.filter((_, i) => i !== index)
    setClinics(newClinics)
  }

  const handleSubmit = (formData: FormData) => {
    formData.append("clinics", JSON.stringify(clinics))
    startTransition(async () => {
      const result = brand?.id ? await updateBrand(brand.id, formData) : await createBrand(formData)
      if (result.success) {
        toast({ title: "Success", description: result.message })
        onClose()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    })
  }

  const handleDelete = () => {
    if (brand?.id && confirm(`Are you sure you want to delete ${brand.name}? This cannot be undone.`)) {
      startTransition(async () => {
        const result = await deleteBrand(brand.id)
        if (result.success) {
          toast({ title: "Success", description: result.message })
          onClose()
        } else {
          toast({ title: "Error", description: result.message, variant: "destructive" })
        }
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{brand?.id ? "Edit Brand" : "Create New Brand"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input id="name" name="name" defaultValue={brand?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input id="email" name="email" type="email" defaultValue={brand?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" name="logo" defaultValue={brand?.logo ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <Input
                id="primary_color"
                name="primary_color"
                type="color"
                defaultValue={brand?.primary_color ?? "#000000"}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Clinic Locations</Label>
            {clinics.map((clinic, index) => (
              <div key={index} className="flex items-end gap-2 p-3 border rounded-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-grow">
                  <div className="space-y-1">
                    <Label htmlFor={`clinic-name-${index}`} className="text-xs">
                      Clinic Name
                    </Label>
                    <Input
                      id={`clinic-name-${index}`}
                      value={clinic.name}
                      onChange={(e) => handleClinicChange(index, "name", e.target.value)}
                      placeholder="Main Clinic"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`clinic-address-${index}`} className="text-xs">
                      Address
                    </Label>
                    <Input
                      id={`clinic-address-${index}`}
                      value={clinic.address}
                      onChange={(e) => handleClinicChange(index, "address", e.target.value)}
                      placeholder="123 Health St, Suburb"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeClinic(index)}
                  disabled={clinics.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addClinic}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Clinic
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="active" name="active" defaultChecked={brand?.active ?? true} />
            <Label htmlFor="active">Active</Label>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
            <div>
              {brand?.id && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {brand?.id ? "Save Changes" : "Create Brand"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
