"use client"

import { useState, useTransition } from "react"
import type { Item, Section } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { importFormFromHtml } from "./actions"

// Confirm Delete Dialog
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
            This action cannot be undone. This will permanently delete the {itemName}.
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

// Add/Edit Section Dialogs
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="title">Section Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onAdd(title)}>Add Section</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EditSectionDialog({
  isOpen,
  onClose,
  section,
  onUpdate,
}: {
  isOpen: boolean
  onClose: () => void
  section: Section
  onUpdate: (section: Section) => void
}) {
  const [title, setTitle] = useState(section.title)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="title">Section Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onUpdate({ ...section, title })}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Add/Edit Item Dialogs
const itemFieldTypes = ["text", "textarea", "select", "checkbox", "radio", "date", "file", "email", "phone"]

function ItemForm({ item, setItem }: { item: Partial<Item>; setItem: (item: Partial<Item>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name / Label</Label>
        <Input
          id="name"
          value={item.name || ""}
          onChange={(e) => setItem({ ...item, name: e.target.value })}
          placeholder="e.g., Patient Full Name"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={item.description || ""}
          onChange={(e) => setItem({ ...item, description: e.target.value })}
          placeholder="e.g., As it appears on the driver's license"
        />
      </div>
      <div>
        <Label htmlFor="field_type">Field Type</Label>
        <Select value={item.field_type} onValueChange={(value) => setItem({ ...item, field_type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a field type" />
          </SelectTrigger>
          <SelectContent>
            {itemFieldTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input
          id="placeholder"
          value={item.placeholder || ""}
          onChange={(e) => setItem({ ...item, placeholder: e.target.value })}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_required"
          checked={item.is_required}
          onCheckedChange={(checked) => setItem({ ...item, is_required: !!checked })}
        />
        <Label htmlFor="is_required">Required</Label>
      </div>
    </div>
  )
}

export function AddItemDialog({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: Omit<Item, "id" | "position" | "brand_id" | "section_id">) => void
}) {
  const [item, setItem] = useState<Partial<Item>>({ is_required: false, field_type: "text" })
  const handleSubmit = () => {
    if (!item.name || !item.field_type) {
      toast.error("Name and Field Type are required.")
      return
    }
    onAdd(item as any)
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <ItemForm item={item} setItem={setItem} />
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

export function EditItemDialog({
  isOpen,
  onClose,
  item,
  onUpdate,
}: {
  isOpen: boolean
  onClose: () => void
  item: Item
  onUpdate: (item: Item) => void
}) {
  const [editedItem, setEditedItem] = useState<Item>(item)
  const handleSubmit = () => {
    if (!editedItem.name || !editedItem.field_type) {
      toast.error("Name and Field Type are required.")
      return
    }
    onUpdate(editedItem)
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <ItemForm item={editedItem} setItem={(i) => setEditedItem(i as Item)} />
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

// Import Dialog
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
    if (!htmlContent) {
      toast.error("Please paste HTML content to import.")
      return
    }
    startParsing(async () => {
      toast.loading("Parsing and importing form...")
      const result = await importFormFromHtml(brandId, htmlContent)
      toast.dismiss()
      if (result.success) {
        toast.success(result.message)
        onClose()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Import from HTML</DialogTitle>
          <DialogDescription>
            Paste your form's HTML code below. The AI will parse it and create the form structure for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="html-content" className="sr-only">
            HTML Content
          </Label>
          <Textarea
            id="html-content"
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="<form>...</form>"
            className="h-64 font-mono"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isParsing}>
            {isParsing ? "Importing..." : "Parse & Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
