"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileManager } from "./FileManager"
import type { Brand, UploadedFile } from "@/lib/types"
import { toast } from "sonner"
import { Trash2, PlusCircle, Loader2, Sparkles, X } from "lucide-react"
import { fetchBrandData } from "./actions"
import { cn, resolveAssetUrl } from "@/lib/utils"

const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  logo: z.string().nullable().optional(),
  active: z.boolean(),
  emails: z.array(z.object({ value: z.string().email("Invalid email address").or(z.literal("")) })),
  clinicLocations: z.array(
    z.object({
      name: z.string().min(1, "Location name is required"),
      address: z.string().optional(),
      phone: z.string().optional(),
    }),
  ),
})

type BrandFormData = z.infer<typeof brandFormSchema>

interface BrandFormProps {
  brand: Brand | null
  uploadedFiles: UploadedFile[]
  onSave: (data: any) => void
  onCancel: () => void
  onLogoUpload: () => void
}

function LogoSelectionDialog({
  open,
  onOpenChange,
  files,
  currentLogo,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  files: UploadedFile[]
  currentLogo: string | null | undefined
  onSelect: (logoPath: string | null) => void
}) {
  const [selected, setSelected] = useState(currentLogo)

  useEffect(() => {
    setSelected(currentLogo)
  }, [currentLogo, open])

  const handleSave = () => {
    onSelect(selected || null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select a Logo</DialogTitle>
          <DialogDescription>Choose a logo for the brand or select "No Logo".</DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto space-y-2 pr-2">
          <div
            onClick={() => setSelected(null)}
            className={cn(
              "flex items-center gap-4 p-2 rounded-md cursor-pointer border-2",
              !selected ? "border-primary bg-primary/10" : "border-transparent hover:bg-gray-100",
            )}
          >
            <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center shrink-0">
              <X className="h-6 w-6 text-gray-500" />
            </div>
            <p className="font-medium">No Logo</p>
          </div>

          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => setSelected(file.pathname)}
              className={cn(
                "flex items-center gap-4 p-2 rounded-md cursor-pointer border-2",
                selected === file.pathname ? "border-primary bg-primary/10" : "border-transparent hover:bg-gray-100",
              )}
            >
              <Image
                src={resolveAssetUrl(file.pathname) || "/placeholder.svg"}
                alt={file.original_name}
                width={48}
                height={48}
                className="object-contain rounded-md bg-gray-50 shrink-0"
              />
              <p className="font-medium flex-grow truncate">{file.original_name}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Select Logo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function BrandForm({ brand, uploadedFiles, onSave, onCancel, onLogoUpload }: BrandFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isLogoDialogOpen, setIsLogoDialogOpen] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      logo: null,
      active: true,
      emails: [],
      clinicLocations: [],
    },
  })

  const currentLogoPath = watch("logo")
  const currentLogoFile = useMemo(() => {
    if (!currentLogoPath) return null
    return uploadedFiles.find((file) => file.pathname === currentLogoPath)
  }, [currentLogoPath, uploadedFiles])

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({ control, name: "emails" })
  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({ control, name: "clinicLocations" })

  useEffect(() => {
    if (brand) {
      reset({
        name: brand.name,
        logo: brand.logo || null,
        active: brand.active,
        emails: brand.emails.map((email) => ({ value: email })),
        clinicLocations: brand.clinic_locations || [],
      })
    } else {
      reset({
        name: "",
        logo: null,
        active: true,
        emails: [{ value: "" }],
        clinicLocations: [{ name: "", address: "", phone: "" }],
      })
    }
  }, [brand, reset])

  const brandSpecificFiles = useMemo(() => {
    if (!brand) return []
    return uploadedFiles.filter((file) => file.brand_id === brand.id || file.brand_id === null)
  }, [uploadedFiles, brand])

  const handleFetchData = async () => {
    if (!websiteUrl) {
      toast.error("Please enter a website URL to fetch data.")
      return
    }
    setIsFetching(true)
    const result = await fetchBrandData(websiteUrl, brand?.slug || "new-brand")
    setIsFetching(false)

    if (result.success && result.data) {
      if (result.data.name) setValue("name", result.data.name)
      if (result.data.logo) {
        setValue("logo", result.data.logo)
        onLogoUpload()
      }
      if (result.data.locations && result.data.locations.length > 0) {
        setValue("clinicLocations", result.data.locations)
      }
      toast.success("Data fetched successfully!")
    } else {
      toast.error(result.error || "Failed to fetch data.")
    }
  }

  const onSubmitHandler = async (data: BrandFormData) => {
    setIsSaving(true)
    const payload = {
      id: brand?.id,
      ...data,
      emails: data.emails.map((e) => e.value).filter(Boolean),
    }
    await onSave(payload)
    setIsSaving(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col h-full overflow-hidden">
        <Tabs defaultValue="settings" className="flex-grow flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="files" disabled={!brand}>
              Files
            </TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="flex-grow overflow-y-auto pr-6 -mr-6 space-y-6 mt-4">
            <div className="p-4 border rounded-md bg-blue-50 border-blue-200">
              <Label htmlFor="website_url">Fetch Data with AI</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Enter a website URL to automatically populate the brand name, logo, and locations.
              </p>
              <div className="flex gap-2">
                <Input
                  id="website_url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
                <Button type="button" onClick={handleFetchData} disabled={isFetching || !websiteUrl}>
                  {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span className="ml-2">Fetch</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4 p-3 border rounded-md min-h-[76px]">
                {currentLogoFile ? (
                  <>
                    <Image
                      src={resolveAssetUrl(currentLogoFile.pathname) || "/placeholder.svg"}
                      alt={currentLogoFile.original_name}
                      width={48}
                      height={48}
                      className="object-contain rounded-md bg-gray-50 shrink-0"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold">{currentLogoFile.original_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{currentLogoFile.pathname}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-4 flex-grow">
                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center shrink-0">
                      <X className="h-6 w-6 text-gray-500" />
                    </div>
                    <p className="font-medium text-muted-foreground">No Logo Selected</p>
                  </div>
                )}
                <Button type="button" variant="outline" onClick={() => setIsLogoDialogOpen(true)}>
                  Change
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Upload logos and other images in the 'Files' tab.</p>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="active"
                control={control}
                render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label htmlFor="active">Active</Label>
              <p className="text-sm text-muted-foreground">(Inactive brands will not appear on the public homepage)</p>
            </div>

            <div className="space-y-3 p-4 border rounded-md">
              <Label>Recipient Emails</Label>
              <p className="text-sm text-muted-foreground">
                These addresses will receive the order submission emails for this brand.
              </p>
              {emailFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`emails.${index}.value`)} placeholder="name@example.com" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeEmail(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendEmail({ value: "" })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Email
              </Button>
            </div>

            <div className="space-y-3 p-4 border rounded-md">
              <Label>Clinic Locations</Label>
              <p className="text-sm text-muted-foreground">
                These locations will appear in the "Bill To" and "Deliver To" dropdowns on the order form.
              </p>
              {locationFields.map((field, index) => (
                <div key={field.id} className="space-y-2 p-3 border rounded-md bg-gray-50/50">
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLocation(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor={`clinicLocations.${index}.name`}>Location Name</Label>
                      <Input {...register(`clinicLocations.${index}.name`)} placeholder="Main Clinic" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`clinicLocations.${index}.phone`}>Phone Number</Label>
                      <Input {...register(`clinicLocations.${index}.phone`)} placeholder="e.g., (02) 1234 5678" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`clinicLocations.${index}.address`}>Address</Label>
                    <Textarea
                      {...register(`clinicLocations.${index}.address`)}
                      placeholder="123 Health St, Wellness City"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendLocation({ name: "", address: "", phone: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Location
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="files" className="flex-grow overflow-y-auto mt-4">
            {brand && (
              <FileManager
                initialFiles={brandSpecificFiles}
                brands={brand ? [brand] : []}
                onFilesUpdate={onLogoUpload}
                isEmbedded={true}
                brandId={brand.id}
              />
            )}
          </TabsContent>
        </Tabs>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Brand"}
          </Button>
        </div>
      </form>
      <LogoSelectionDialog
        open={isLogoDialogOpen}
        onOpenChange={setIsLogoDialogOpen}
        files={brandSpecificFiles.filter((file) => file.content_type?.startsWith("image/"))}
        currentLogo={currentLogoPath}
        onSelect={(newLogoPath) => {
          setValue("logo", newLogoPath, { shouldDirty: true })
        }}
      />
    </>
  )
}
