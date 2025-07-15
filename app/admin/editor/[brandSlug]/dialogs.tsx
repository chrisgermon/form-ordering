"use client"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Item, Section } from "@/lib/types"
import { importFormFromHtml } from "./actions"
import { toast } from "sonner"

// ConfirmDeleteDialog
export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the <strong>{itemName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// AddSectionDialog
export function AddSectionDialog({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (title: string) => void
}) {
  const [title, setTitle] = useState("")

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title.trim())
      setTitle("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="section-title">Title</Label>
          <Input
            id="section-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Patient Information"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Section</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// EditSectionDialog
export function EditSectionDialog({
  isOpen,
  onClose,
  section,
  onUpdate,
}: {
  isOpen: boolean
  onClose: () => void
  section: Section
  onUpdate: (updatedSection: Section) => void
}) {
  const [title, setTitle] = useState(section.title)

  const handleSubmit = () => {
    if (title.trim()) {
      onUpdate({ ...section, title: title.trim() })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="section-title">Title</Label>
          <Input id="section-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// AddItemDialog
export function AddItemDialog({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: Omit<Item, "id" | "position" | "brand_id" | "section_id">) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [fieldType, setFieldType] = useState<Item["field_type"]>("text")
  const [isRequired, setIsRequired] = useState(false)
  const [placeholder, setPlaceholder] = useState("")

  const handleSubmit = () => {
    if (name.trim() && fieldType) {
      onAdd({ name, description, field_type: fieldType, is_required: isRequired, placeholder })
      // Reset form
      setName("")
      setDescription("")
      setFieldType("text")
      setIsRequired(false)
      setPlaceholder("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="item-name">Name / Label</Label>
            <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="item-description">Description</Label>
            <Input id="item-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="item-placeholder">Placeholder</Label>
            <Input id="item-placeholder" value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="item-field-type">Field Type</Label>
            <Select value={fieldType} onValueChange={(v) => setFieldType(v as Item["field_type"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select a field type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="select">Select (Dropdown)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="is-required" checked={isRequired} onCheckedChange={(c) => setIsRequired(!!c)} />
            <Label htmlFor="is-required">Required</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// EditItemDialog
export function EditItemDialog({
  isOpen,
  onClose,
  item,
  onUpdate,
}: {
  isOpen: boolean
  onClose: () => void
  item: Item
  onUpdate: (updatedItem: Item) => void
}) {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description || "")
  const [fieldType, setFieldType] = useState<Item["field_type"]>(item.field_type)
  const [isRequired, setIsRequired] = useState(item.is_required)
  const [placeholder, setPlaceholder] = useState(item.placeholder || "")

  const handleSubmit = () => {
    if (name.trim() && fieldType) {
      onUpdate({ ...item, name, description, field_type: fieldType, is_required: isRequired, placeholder })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="item-name">Name / Label</Label>
            <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="item-description">Description</Label>
            <Input id="item-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="item-placeholder">Placeholder</Label>
            <Input id="item-placeholder" value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="item-field-type">Field Type</Label>
            <Select value={fieldType} onValueChange={(v) => setFieldType(v as Item["field_type"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select a field type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="select">Select (Dropdown)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="is-required" checked={isRequired} onCheckedChange={(c) => setIsRequired(!!c)} />
            <Label htmlFor="is-required">Required</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ImportFormDialog
export function ImportFormDialog({
  isOpen,
  onClose,
  brandId,
}: {
  isOpen: boolean
  onClose: () => void
  brandId: string
}) {
  const [htmlContent, setHtmlContent] = useState("")
  const [isParsing, startParsing] = useTransition()

  const handleImport = () => {
    if (!htmlContent.trim()) {
      toast.error("Please paste some HTML content.")
      return
    }
    startParsing(async () => {
      toast.loading("Parsing and importing form...")
      const result = await importFormFromHtml(brandId, htmlContent)
      toast.dismiss()
      if (result.success) {
        toast.success(result.message)
        setHtmlContent("")
        onClose()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from HTML</DialogTitle>
          <DialogDescription>
            Paste your form's HTML code below. The AI will parse it and create the form structure for you. This will
            replace the current form.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Paste your JotForm or other form HTML here..."
            className="h-64"
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={isParsing}>
            {isParsing ? "Importing..." : "Parse & Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
