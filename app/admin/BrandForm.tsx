"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useFormState } from "react-dom"
import { toast } from "sonner"
import type { Brand } from "@/lib/types"
import { createBrand, updateBrand } from "./actions"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { SubmitButton } from "@/components/submit-button"
import { X } from "lucide-react"

const initialState = {
  message: "",
  errors: {},
  success: false,
}

export function BrandForm({
  brand,
  onClose,
}: {
  brand: Brand | null
  onClose: () => void
}) {
  const [emails, setEmails] = useState<string[]>(brand?.emails || [])
  const [emailInput, setEmailInput] = useState("")
  const [locations, setLocations] = useState(brand?.clinic_locations || [])
  const [locationInput, setLocationInput] = useState({ name: "", address: "", phone: "", email: "" })
  const [logoPreview, setLogoPreview] = useState<string | null>(brand?.logo || null)

  const action = brand ? updateBrand.bind(null, brand.id.toString()) : createBrand
  const [state, formAction] = useFormState(action, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      if (onClose) {
        onClose()
      }
    } else if (state.message && !state.success && Object.keys(state.errors || {}).length === 0) {
      toast.error(state.message)
    }
  }, [state, onClose])

  const handleAddEmail = () => {
    if (emailInput && !emails.includes(emailInput)) {
      setEmails([...emails, emailInput])
      setEmailInput("")
    }
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove))
  }

  const handleAddLocation = () => {
    if (locationInput.name && locationInput.address) {
      setLocations([...locations, locationInput])
      setLocationInput({ name: "", address: "", phone: "", email: "" })
    }
  }

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  return (
    <form action={formAction} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
      <input type="hidden" name="id" value={brand?.id} />
      <input type="hidden" name="emails" value={JSON.stringify(emails)} />
      <input type="hidden" name="clinic_locations" value={JSON.stringify(locations)} />

      <div>
        <Label htmlFor="name">Brand Name</Label>
        <Input id="name" name="name" defaultValue={brand?.name} required />
        {state.errors?.name && <p className="text-sm font-medium text-destructive mt-1">{state.errors.name[0]}</p>}
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" defaultValue={brand?.slug} required />
        {state.errors?.slug && <p className="text-sm font-medium text-destructive mt-1">{state.errors.slug[0]}</p>}
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch id="active" name="active" defaultChecked={brand?.active ?? true} />
        <Label htmlFor="active">Active</Label>
      </div>

      <div>
        <Label>Logo</Label>
        <Input id="logo" name="logo" type="file" accept="image/*" onChange={handleLogoChange} />
        {logoPreview && (
          <img src={logoPreview || "/placeholder.svg"} alt="Logo Preview" className="mt-2 h-20 w-auto rounded" />
        )}
      </div>

      <div>
        <Label>Notification Emails</Label>
        <div className="flex gap-2">
          <Input
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="new.email@example.com"
            type="email"
          />
          <Button type="button" onClick={handleAddEmail}>
            Add
          </Button>
        </div>
        <div className="mt-2 space-y-1">
          {emails.map((email) => (
            <div key={email} className="flex items-center justify-between bg-muted p-2 rounded">
              <span className="text-sm">{email}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemoveEmail(email)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Clinic Locations</Label>
        <div className="p-4 border rounded space-y-2">
          <Input
            value={locationInput.name}
            onChange={(e) => setLocationInput({ ...locationInput, name: e.target.value })}
            placeholder="Location Name"
          />
          <Textarea
            value={locationInput.address}
            onChange={(e) => setLocationInput({ ...locationInput, address: e.target.value })}
            placeholder="Full Address"
            rows={3}
          />
          <Input
            value={locationInput.phone || ""}
            onChange={(e) => setLocationInput({ ...locationInput, phone: e.target.value })}
            placeholder="Phone Number (optional)"
          />
          <Input
            value={locationInput.email || ""}
            onChange={(e) => setLocationInput({ ...locationInput, email: e.target.value })}
            placeholder="Email (optional)"
            type="email"
          />
          <Button type="button" variant="secondary" onClick={handleAddLocation}>
            Add Location
          </Button>
        </div>
        <div className="mt-2 space-y-1">
          {locations.map((loc, index) => (
            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
              <div className="text-sm">
                <p className="font-semibold">{loc.name}</p>
                <p className="text-muted-foreground">{loc.address}</p>
                {loc.phone && <p className="text-muted-foreground">Phone: {loc.phone}</p>}
                {loc.email && <p className="text-muted-foreground">Email: {loc.email}</p>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemoveLocation(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  )
}
