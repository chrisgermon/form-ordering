"use client"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { addSection, updateSection, addItem, updateItem } from "./actions"
import type { Section, Item } from "@/lib/types"

// --- Reusable Confirm Delete Dialog ---
interface ConfirmDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
}

export function ConfirmDeleteDialog({ isOpen, onClose, onConfirm, itemName }: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the {itemName}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Yes, delete it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Section Dialogs ---
const sectionSchema = z.object({
  title: z.string().min(1, "Title is required."),
})

export function AddSectionDialog({
  isOpen,
  onClose,
  brandId,
  currentMaxPosition,
}: { isOpen: boolean; onClose: () => void; brandId: string; currentMaxPosition: number }) {
  const router = useRouter()
  const form = useForm<z.infer<typeof sectionSchema>>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { title: "" },
  })

  const onSubmit = async (values: z.infer<typeof sectionSchema>) => {
    const toastId = toast.loading("Adding section...")
    const result = await addSection({ ...values, brand_id: brandId, position: currentMaxPosition })
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Section added successfully.")
      form.reset()
      onClose()
      router.refresh()
    } else {
      toast.error(result.message || "Failed to add section.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Patient Information" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Adding..." : "Add Section"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function EditSectionDialog({
  isOpen,
  onClose,
  section,
}: { isOpen: boolean; onClose: () => void; section: Section }) {
  const router = useRouter()
  const form = useForm<z.infer<typeof sectionSchema>>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { title: section.title },
  })

  const onSubmit = async (values: z.infer<typeof sectionSchema>) => {
    const toastId = toast.loading("Updating section...")
    const result = await updateSection(section.id, values)
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Section updated successfully.")
      onClose()
      router.refresh()
    } else {
      toast.error(result.message || "Failed to update section.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// --- Item Dialogs ---
const itemSchema = z.object({
  name: z.string().min(1, "Item name is required."),
  code: z.string().min(1, "Item code is required."),
  description: z.string().optional(),
  field_type: z.enum(["text", "textarea", "number", "date", "checkbox", "select", "radio"]),
  placeholder: z.string().optional(),
  is_required: z.boolean().default(false),
})

const fieldTypes: Item["field_type"][] = ["text", "textarea", "number", "date", "checkbox", "select", "radio"]

function ItemFormFields({ form }: { form: any }) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Label / Question</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Patient Name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Item Code</FormLabel>
            <FormControl>
              <Input placeholder="e.g., PATIENT_NAME" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (optional)</FormLabel>
            <FormControl>
              <Textarea placeholder="Helper text shown below the label" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="field_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a field type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="placeholder"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Placeholder (optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Enter the full name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="is_required"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Required Field</FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </div>
  )
}

export function AddItemDialog({
  isOpen,
  onClose,
  sectionId,
  brandId,
  currentMaxPosition,
}: { isOpen: boolean; onClose: () => void; sectionId: string; brandId: string; currentMaxPosition: number }) {
  const router = useRouter()
  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: "", code: "", description: "", field_type: "text", placeholder: "", is_required: false },
  })

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    const toastId = toast.loading("Adding item...")
    const result = await addItem({ ...values, section_id: sectionId, brand_id: brandId, position: currentMaxPosition })
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Item added successfully.")
      form.reset()
      onClose()
      router.refresh()
    } else {
      toast.error(result.message || "Failed to add item.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ItemFormFields form={form} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function EditItemDialog({ isOpen, onClose, item }: { isOpen: boolean; onClose: () => void; item: Item }) {
  const router = useRouter()
  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item.name,
      code: item.code,
      description: item.description || "",
      field_type: item.field_type,
      placeholder: item.placeholder || "",
      is_required: item.is_required,
    },
  })

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    const toastId = toast.loading("Updating item...")
    const result = await updateItem(item.id, values)
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Item updated successfully.")
      onClose()
      router.refresh()
    } else {
      toast.error(result.message || "Failed to update item.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ItemFormFields form={form} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
