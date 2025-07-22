"use client"

import type React from "react"

import { useEffect, useState, useActionState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createBrand, updateBrand } from "./actions"
import type { Brand, ClinicLocation } from "@/lib/types"
import { Trash2, PlusCircle } from "lucide-react"

interface BrandFormProps {
  brand?: Brand & { clinic_locations: ClinicLocation[] }
  children: React.ReactNode
}

const initialState = {
  message: "",
  errors: null,
  success: false,
}

export function BrandForm({ brand, children }: BrandFormProps) {
  const [open, setOpen] = useState(false)
  const [emails, setEmails] = useState<string[]>(brand?.emails || [""])
  const [locations, setLocations] = useState<Partial<ClinicLocation>[]>(brand?.clinic_locations || [])
  const [logoPreview, setLogoPreview] = useState<string | null>(brand?.logo || null)

  const action = brand ? updateBrand.bind(null, brand.id) : createBrand
  const [state, formAction] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      setOpen(false)
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state])

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
  }

  const addEmailField = () => setEmails([...emails, ""])
  const removeEmailField = (index: number) => setEmails(emails.filter((_, i) => i !== index))

  const handleLocationChange = (index: number, field: keyof ClinicLocation, value: string) => {
    const newLocations = [...locations]
    const locationToUpdate = { ...newLocations[index], [field]: value }
    newLocations[index] = locationToUpdate
    setLocations(newLocations)
  }

  const addLocationField = () => setLocations([...locations, { name: "", address: "" }])
  const removeLocationField = (index: number) => setLocations(locations.filter((_, i) => i !== index))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{brand ? "Edit Brand" : "Create New Brand"}</DialogTitle>
          <DialogDescription>
            {brand
              ? "Update the details for this brand and its locations."
              : "Fill out the form to create a new brand."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" name="name" defaultValue={brand?.name} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right">
                Slug
              </Label>
              <Input id="slug" name="slug" defaultValue={brand?.slug} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logo" className="text-right">
                Logo
              </Label>
              <div className="col-span-3 flex items-center gap-4">
                <Input id="logo" name="logo" type="file" className="flex-grow" onChange={handleFileChange} />
                {logoPreview && (
                  <img
                    src={logoPreview || "/placeholder.svg"}
                    alt="Logo Preview"
                    className="h-10 w-10 object-contain"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Active
              </Label>
              <Switch id="active" name="active" defaultChecked={brand?.active ?? true} />
            </div>

            {/* Emails */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Notification Emails</Label>
              <div className="col-span-3 space-y-2">
                {emails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder="email@example.com"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEmailField(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addEmailField}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Email
                </Button>
              </div>
            </div>
            <input type="hidden" name="emails" value={JSON.stringify(emails.filter(Boolean))} />

            {/* Clinic Locations */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Clinic Locations</Label>
              <div className="col-span-3 space-y-4">
                {locations.map((loc, index) => (
                  <div key={loc.id || index} className="space-y-2 rounded-md border p-4">
                    <div className="flex justify-end">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLocationField(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <Input type="hidden" name={`locations[${index}][id]`} value={loc.id || ""} />
                    <div>
                      <Label>Location Name</Label>
                      <Input
                        value={loc.name}
                        onChange={(e) => handleLocationChange(index, "name", e.target.value)}
                        placeholder="Main Clinic"
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input
                        value={loc.address || ""}
                        onChange={(e) => handleLocationChange(index, "address", e.target.value)}
                        placeholder="123 Health St, Suburb"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={loc.phone || ""}
                        onChange={(e) => handleLocationChange(index, "phone", e.target.value)}
                        placeholder="02 1234 5678"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={loc.email || ""}
                        onChange={(e) => handleLocationChange(index, "email", e.target.value)}
                        placeholder="location@example.com"
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addLocationField}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Location
                </Button>
              </div>
            </div>
            <input type="hidden" name="clinic_locations" value={JSON.stringify(locations)} />
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
