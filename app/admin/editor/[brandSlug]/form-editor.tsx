"use client"

import { useEffect } from "react"
import { useFormState } from "react-dom"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import type { BrandData, UploadedFile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { saveForm } from "./actions"
import EditorFileManager from "./file-manager"
import { SectionsAndItems } from "./sections-and-items"

const brandFormSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string().min(1, "Brand name is required"),
  initials: z.string().min(1, "Brand initials are required"),
  to_emails: z.string().optional(),
  cc_emails: z.string().optional(),
  bcc_emails: z.string().optional(),
  subject_line: z.string().optional(),
  form_title: z.string().optional(),
  form_subtitle: z.string().optional(),
  logo_url: z.string().optional().nullable(),
  header_image_url: z.string().optional().nullable(),
  product_sections: z.any(), // We'll handle validation in the action
})

type FormEditorProps = {
  initialBrandData: BrandData
  uploadedFiles: UploadedFile[]
}

export function FormEditor({ initialBrandData, uploadedFiles }: FormEditorProps) {
  const { toast } = useToast()
  const [state, formAction] = useFormState(saveForm, { success: false, message: "" })

  const methods = useForm<BrandData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: initialBrandData,
  })

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Success" : "Error",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      })
    }
  }, [state, toast])

  const logoUrl = methods.watch("logo_url")
  const headerImageUrl = methods.watch("header_image_url")

  return (
    <FormProvider {...methods}>
      <form action={formAction}>
        <input type="hidden" {...methods.register("id")} />
        <input type="hidden" {...methods.register("slug")} />

        <header className="bg-gray-100 dark:bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10 border-b">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Dashboard</span>
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Editing: {initialBrandData.name}</h1>
          </div>
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </header>

        <Tabs defaultValue="details" className="p-4">
          <TabsList>
            <TabsTrigger value="details">Form Details</TabsTrigger>
            <TabsTrigger value="sections">Sections & Items</TabsTrigger>
            <TabsTrigger value="files">File Manager</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4">
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Brand Name</Label>
                  <Input id="name" {...methods.register("name")} />
                  {methods.formState.errors.name && (
                    <p className="text-red-500 text-sm mt-1">{methods.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="initials">Brand Initials</Label>
                  <Input id="initials" {...methods.register("initials")} />
                  {methods.formState.errors.initials && (
                    <p className="text-red-500 text-sm mt-1">{methods.formState.errors.initials.message}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="to_emails">To Emails (comma-separated)</Label>
                <Input id="to_emails" {...methods.register("to_emails")} />
              </div>
              <div>
                <Label htmlFor="cc_emails">CC Emails (comma-separated)</Label>
                <Input id="cc_emails" {...methods.register("cc_emails")} />
              </div>
              <div>
                <Label htmlFor="bcc_emails">BCC Emails (comma-separated)</Label>
                <Input id="bcc_emails" {...methods.register("bcc_emails")} />
              </div>
              <div>
                <Label htmlFor="subject_line">Email Subject Line</Label>
                <Input id="subject_line" {...methods.register("subject_line")} />
              </div>
              <div>
                <Label htmlFor="form_title">Form Title</Label>
                <Input id="form_title" {...methods.register("form_title")} />
              </div>
              <div>
                <Label htmlFor="form_subtitle">Form Subtitle</Label>
                <Textarea id="form_subtitle" {...methods.register("form_subtitle")} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="sections">
            <SectionsAndItems brand={initialBrandData} />
          </TabsContent>
          <TabsContent value="files">
            <EditorFileManager
              uploadedFiles={uploadedFiles}
              logoUrl={logoUrl}
              headerImageUrl={headerImageUrl}
              onSelectLogo={(pathname) => methods.setValue("logo_url", pathname, { shouldDirty: true })}
              onSelectHeader={(pathname) => methods.setValue("header_image_url", pathname, { shouldDirty: true })}
            />
          </TabsContent>
        </Tabs>
      </form>
    </FormProvider>
  )
}
