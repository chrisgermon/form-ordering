"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createSection, updateSection, createItem, updateItem, deleteOption, updateOrCreateOption } from "./actions"
import type { Section, Item, Option } from "@/lib/types"
import { PlusCircle, Trash2 } from "lucide-react"

// Schemas
const sectionSchema = z.object({ title: z.string().min(1, "Title is required") })
const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  field_type: z.enum(["text", "textarea", "number", "date", "checkbox", "select", "radio"]),
  placeholder: z.string().optional(),
  is_required: z.boolean(),
})

// Dialog Props
interface DialogProps {
  isOpen: boolean
  onClose: () => void
}
interface ConfirmDialogProps extends DialogProps {
  onConfirm: () => void
  itemName: string
}
interface SectionDialogProps extends DialogProps {
  section: Section
}
interface AddSectionDialogProps extends DialogProps {
  brandId: string
  currentMaxPosition: number
}
interface ItemDialogProps extends DialogProps {
  item: Item
}
interface AddItemDialogProps extends DialogProps {
  sectionId: string
  brandId: string
  currentMaxPosition: number
}
interface ManageOptionsDialogProps extends DialogProps {
  item: Item
}

// Reusable Form Component
function FormField({ name, label, children, error }: any) {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={name} className="text-right">
        {label}
      </Label>
      <div className="col-span-3">
        {children}
        {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
      </div>
    </div>
  )
}

// Dialog Components
export function AddSectionDialog({ isOpen, onClose, brandId, currentMaxPosition }: AddSectionDialogProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ resolver: zodResolver(sectionSchema) })

  const onSubmit = async (data: z.infer<typeof sectionSchema>) => {
    const toastId = toast.loading("Creating section...")
    const result = await createSection({ ...data, brand_id: brandId, position: currentMaxPosition })
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Section created.")
      reset()
      onClose()
      router.refresh()
    } else {
      toast.error(result.message || "Failed to create section.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField name="title" label="Title" error={errors.title}>
            <Input id="title" {...register("title")} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EditSectionDialog({ isOpen, onClose, section }: SectionDialogProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(sectionSchema),
    defaultValues: { title: section.title },
  })

  const onSubmit = async (data: z.infer<typeof sectionSchema>) => {
    const toastId = toast.loading("Updating section...")
    const result = await updateSection(section.id, data)
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Section updated.")
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField name="title" label="Title" error={errors.title}>
            <Input id="title" {...register("title")} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AddItemDialog({ isOpen, onClose, sectionId, brandId, currentMaxPosition }: AddItemDialogProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: { is_required: false, field_type: "text" },
  })

  const onSubmit = async (data: z.infer<typeof itemSchema>) => {
    const toastId = toast.loading("Creating item...")
    const result = await createItem({ ...data, section_id: sectionId, brand_id: brandId, position: currentMaxPosition })
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Item created.")
      reset()
      onClose()
      router.refresh()
    } else {
      toast.error(result.message || "Failed to create item.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField name="name" label="Name" error={errors.name}>
            <Input id="name" {...register("name")} />
          </FormField>
          <FormField name="code" label="Code" error={errors.code}>
            <Input id="code" {...register("code")} />
          </FormField>
          <FormField name="description" label="Description" error={errors.description}>
            <Textarea id="description" {...register("description")} />
          </FormField>
          <FormField name="field_type" label="Field Type" error={errors.field_type}>
            <Select onValueChange={(value) => control.setValue("field_type", value as any)} defaultValue="text">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="select">Select (Dropdown)</SelectItem>
                <SelectItem value="radio">Radio Group</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField name="placeholder" label="Placeholder" error={errors.placeholder}>
            <Input id="placeholder" {...register("placeholder")} />
          </FormField>
          <FormField name="is_required" label="Required" error={errors.is_required}>
            <Checkbox id="is_required" onCheckedChange={(checked) => control.setValue("is_required", !!checked)} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EditItemDialog({ isOpen, onClose, item }: ItemDialogProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: { ...item },
  })

  const onSubmit = async (data: z.infer<typeof itemSchema>) => {
    const toastId = toast.loading("Updating item...")
    const result = await updateItem(item.id, data)
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Item updated.")
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField name="name" label="Name" error={errors.name}>
            <Input id="name" {...register("name")} />
          </FormField>
          <FormField name="code" label="Code" error={errors.code}>
            <Input id="code" {...register("code")} />
          </FormField>
          <FormField name="description" label="Description" error={errors.description}>
            <Textarea id="description" {...register("description")} />
          </FormField>
          <FormField name="field_type" label="Field Type" error={errors.field_type}>
            <Select
              onValueChange={(value) => control.setValue("field_type", value as any)}
              defaultValue={item.field_type}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="select">Select (Dropdown)</SelectItem>
                <SelectItem value="radio">Radio Group</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField name="placeholder" label="Placeholder" error={errors.placeholder}>
            <Input id="placeholder" {...register("placeholder")} />
          </FormField>
          <FormField name="is_required" label="Required" error={errors.is_required}>
            <Checkbox
              id="is_required"
              defaultChecked={item.is_required}
              onCheckedChange={(checked) => control.setValue("is_required", !!checked)}
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ManageOptionsDialog({ isOpen, onClose, item }: ManageOptionsDialogProps) {
  const router = useRouter()
  const [options, setOptions] = React.useState<Partial<Option>[]>(item.options || [])
  const [isSaving, setIsSaving] = React.useState(false)

  const handleAddOption = () => {
    setOptions([...options, { label: "", value: "" }])
  }

  const handleRemoveOption = async (index: number, optionId?: string) => {
    if (optionId) {
      const toastId = toast.loading("Deleting option...")
      await deleteOption(optionId)
      toast.dismiss(toastId)
      toast.success("Option deleted.")
    }
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setIsSaving(true)
    const toastId = toast.loading("Saving options...")

    const promises = options.map((opt, index) => {
      const payload = {
        ...opt,
        item_id: item.id,
        brand_id: item.brand_id,
        sort_order: index,
      }
      return updateOrCreateOption(payload as any)
    })

    const results = await Promise.all(promises)
    const hasError = results.some((r) => !r.success)

    toast.dismiss(toastId)
    setIsSaving(false)
    if (hasError) {
      toast.error("Some options failed to save. Please review and try again.")
    } else {
      toast.success("Options saved successfully.")
      onClose()
      router.refresh()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Options for "{item.name}"</DialogTitle>
          <DialogDescription>Add, edit, or remove options for this select or radio field.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {options.map((option, index) => (
            <div key={option.id || index} className="flex items-center gap-2">
              <Input
                placeholder="Label (e.g., Small)"
                defaultValue={option.label || ""}
                onChange={(e) => {
                  const newOptions = [...options]
                  newOptions[index].label = e.target.value
                  setOptions(newOptions)
                }}
              />
              <Input
                placeholder="Value (e.g., sm)"
                defaultValue={option.value || ""}
                onChange={(e) => {
                  const newOptions = [...options]
                  newOptions[index].value = e.target.value
                  setOptions(newOptions)
                }}
              />
              <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index, option.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleAddOption}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Option
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Options"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ConfirmDeleteDialog({ isOpen, onClose, onConfirm, itemName }: ConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the {itemName}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
