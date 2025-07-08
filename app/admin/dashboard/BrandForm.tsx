"use client"

import { useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import type { Brand, UploadedFile } from "@/lib/types"
import { createOrUpdateBrand } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function SubmitButton({ isUpdate }: { isUpdate: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : isUpdate ? (
        "Save Changes"
      ) : (
        "Create Brand"
      )}
    </Button>
  )
}

type BrandFormProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  brand: Brand | null
  uploadedFiles: UploadedFile[]
}

export function BrandForm({ isOpen, setIsOpen, brand, uploadedFiles }: BrandFormProps) {
  const initialState = { success: false, message: "", errors: null }
  const [state, formAction] = useFormState(createOrUpdateBrand, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      setIsOpen(false)
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state, setIsOpen])

  const arrayToString = (arr: string[] | undefined | null) => (Array.isArray(arr) ? arr.join(", ") : "")

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{brand ? "Edit Brand" : "Create New Brand"}</DialogTitle>
          <DialogDescription>
            {brand ? "Update the details for this brand." : "Fill in the details for the new brand."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          {brand && <input type="hidden" name="id" value={brand.id} />}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" name="name" defaultValue={brand?.name} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="initials" className="text-right">
              Initials
            </Label>
            <Input id="initials" name="initials" defaultValue={brand?.initials} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="slug" className="text-right">
              Slug
            </Label>
            <Input id="slug" name="slug" defaultValue={brand?.slug} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="to_emails" className="text-right">
              To Emails
            </Label>
            <Input
              id="to_emails"
              name="to_emails"
              defaultValue={arrayToString(brand?.to_emails)}
              className="col-span-3"
              placeholder="email1@example.com, email2@example.com"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cc_emails" className="text-right">
              CC Emails
            </Label>
            <Input
              id="cc_emails"
              name="cc_emails"
              defaultValue={arrayToString(brand?.cc_emails)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bcc_emails" className="text-right">
              BCC Emails
            </Label>
            <Input
              id="bcc_emails"
              name="bcc_emails"
              defaultValue={arrayToString(brand?.bcc_emails)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clinic_locations" className="text-right">
              Clinic Locations
            </Label>
            <Input
              id="clinic_locations"
              name="clinic_locations"
              defaultValue={arrayToString(brand?.clinic_locations)}
              className="col-span-3"
              placeholder="Location A, Location B"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="logo_url" className="text-right">
              Logo
            </Label>
            <Select name="logo_url" defaultValue={brand?.logo_url ?? "default-logo-url"}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a logo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default-logo-url">No Logo</SelectItem>
                {uploadedFiles.map((file) => (
                  <SelectItem key={file.id} value={file.pathname}>
                    {file.original_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end mt-4">
            <SubmitButton isUpdate={!!brand} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
