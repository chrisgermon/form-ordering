"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Upload } from "lucide-react"

import type { Brand, UploadedFile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileUploader } from "@/app/admin/editor/[brandSlug]/file-manager"

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  logo_url: z.string().optional().nullable(),
  active: z.boolean(),
  brand_colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    text: z.string(),
  }),
  form_title: z.string().min(1, "Form title is required."),
  confirmation_message: z.string().min(1, "Confirmation message is required."),
  confirmation_email_subject: z.string().min(1, "Email subject is required."),
  send_confirmation_email: z.boolean(),
  recipient_emails: z.string().refine(
    (value) => {
      if (!value) return true // Allow empty string
      const emails = value.split(",").map((e) => e.trim())
      return emails.every((email) => z.string().email().safeParse(email).success)
    },
    { message: "Please provide a valid, comma-separated list of email addresses." },
  ),
  cc_emails: z.string().refine(
    (value) => {
      if (!value) return true
      const emails = value.split(",").map((e) => e.trim())
      return emails.every((email) => z.string().email().safeParse(email).success)
    },
    { message: "Please provide a valid, comma-separated list of CC email addresses." },
  ),
  bcc_emails: z.string().refine(
    (value) => {
      if (!value) return true
      const emails = value.split(",").map((e) => e.trim())
      return emails.every((email) => z.string().email().safeParse(email).success)
    },
    { message: "Please provide a valid, comma-separated list of BCC email addresses." },
  ),
})

interface BrandFormProps {
  brand: Brand | null
  uploadedFiles: UploadedFile[]
  onSave: (data: any) => void
  onCancel: () => void
  onLogoUpload: () => void
}

export function BrandForm({ brand, uploadedFiles, onSave, onCancel, onLogoUpload }: BrandFormProps) {
  const [isUploaderOpen, setIsUploaderOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: brand?.id || undefined,
      name: brand?.name || "",
      slug: brand?.slug || "",
      logo_url: brand?.logo_url || "",
      active: brand?.active ?? true,
      brand_colors: brand?.brand_colors || {
        primary: "#ffffff",
        secondary: "#f8fafc",
        accent: "#020617",
        text: "#020617",
      },
      form_title: brand?.form_title || "New Order Form",
      confirmation_message: brand?.confirmation_message || "Thank you for your order!",
      confirmation_email_subject: brand?.confirmation_email_subject || "Your Order Confirmation",
      send_confirmation_email: brand?.send_confirmation_email ?? true,
      recipient_emails: brand?.recipient_emails?.join(", ") || "",
      cc_emails: brand?.cc_emails?.join(", ") || "",
      bcc_emails: brand?.bcc_emails?.join(", ") || "",
    },
  })

  useEffect(() => {
    form.reset({
      id: brand?.id || undefined,
      name: brand?.name || "",
      slug: brand?.slug || "",
      logo_url: brand?.logo_url || "",
      active: brand?.active ?? true,
      brand_colors: brand?.brand_colors || {
        primary: "#ffffff",
        secondary: "#f8fafc",
        accent: "#020617",
        text: "#020617",
      },
      form_title: brand?.form_title || "New Order Form",
      confirmation_message: brand?.confirmation_message || "Thank you for your order!",
      confirmation_email_subject: brand?.confirmation_email_subject || "Your Order Confirmation",
      send_confirmation_email: brand?.send_confirmation_email ?? true,
      recipient_emails: brand?.recipient_emails?.join(", ") || "",
      cc_emails: brand?.cc_emails?.join(", ") || "",
      bcc_emails: brand?.bcc_emails?.join(", ") || "",
    })
  }, [brand, form])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const submissionData = {
      ...values,
      recipient_emails: values.recipient_emails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      cc_emails: values.cc_emails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      bcc_emails: values.bcc_emails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
    }
    onSave(submissionData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto p-2 -m-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Slug</FormLabel>
                <FormControl>
                  <Input placeholder="acme-inc" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <div className="flex items-center gap-2">
                <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a logo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(uploadedFiles || []).map((file) => (
                      <SelectItem key={file.id} value={file.file_path}>
                        {file.file_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isUploaderOpen} onOpenChange={setIsUploaderOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <Upload className="mr-2 h-4 w-4" /> Upload New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Logo</DialogTitle>
                    </DialogHeader>
                    <FileUploader
                      onUploadSuccess={() => {
                        toast.success("Logo uploaded successfully!")
                        onLogoUpload()
                        setIsUploaderOpen(false)
                      }}
                      brandId={null} // Global upload
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Brand Active</FormLabel>
                <FormDescription>Make this brand visible and accessible to users.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-medium">Brand Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="brand_colors.primary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand_colors.secondary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand_colors.accent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand_colors.text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-medium">Form & Confirmation</h3>
          <FormField
            control={form.control}
            name="form_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Form Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmation_message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmation Message</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-medium">Email Settings</h3>
          <FormField
            control={form.control}
            name="send_confirmation_email"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Send Confirmation Email</FormLabel>
                  <FormDescription>Send an email to the user upon successful order.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmation_email_subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmation Email Subject</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recipient_emails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Emails (To)</FormLabel>
                <FormControl>
                  <Input placeholder="email1@example.com, email2@example.com" {...field} />
                </FormControl>
                <FormDescription>Comma-separated list of emails to receive order notifications.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cc_emails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CC Emails</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Comma-separated list of emails to CC.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bcc_emails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BCC Emails</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Comma-separated list of emails to BCC.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
