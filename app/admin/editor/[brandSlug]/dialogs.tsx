"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Item, Option, Section } from "@/lib/types"
import { PlusCircle, Trash2 } from "lucide-react"

// Confirm Delete Dialog
interface ConfirmDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
}

export function ConfirmDeleteDialog({ isOpen, onClose, onConfirm, itemName }: ConfirmDeleteDialogProps) {
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
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Yes, delete it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Section Dialogs
interface SectionDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface AddSectionDialogProps extends SectionDialogProps {
  onAdd: (title: string) => void
}

export function AddSectionDialog({ isOpen, onClose, onAdd }: AddSectionDialogProps) {
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
          <Label htmlFor="title">Section Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Patient Details"
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

interface EditSectionDialogProps extends SectionDialogProps {
  section: Section
  onUpdate: (section: Section) => void
}

export function EditSectionDialog({ isOpen, onClose, section, onUpdate }: EditSectionDialogProps) {
  const [title, setTitle] = useState(section.title)

  useEffect(() => {
    setTitle(section.title)
  }, [section])

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
          <Label htmlFor="title">Section Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
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

// Item Dialogs
const fieldTypes: Item["field_type"][] = ["text", "textarea", "number", "date", "checkbox", "select", "radio"]

interface ItemDialogProps extends SectionDialogProps {
  item?: Item
}

interface AddItemDialogProps extends ItemDialogProps {
  onAdd: (item: Omit<Item, "id" | "position" | "brand_id" | "section_id">) => void
}

interface EditItemDialogProps extends ItemDialogProps {
  item: Item
  onUpdate: (item: Item) => void
}

function ItemForm({
  item,
  onSave,
  onClose,
}: {
  item?: Item
  onSave: (itemData: any) => void
  onClose: () => void
}) {
  const [name, setName] = useState(item?.name || "")
  const [description, setDescription] = useState(item?.description || "")
  const [fieldType, setFieldType] = useState<Item["field_type"]>(item?.field_type || "text")
  const [isRequired, setIsRequired] = useState(item?.is_required || false)
  const [placeholder, setPlaceholder] = useState(item?.placeholder || "")
  const [options, setOptions] = useState<Partial<Option>[]>(item?.options || [])

  const showOptions = fieldType === "select" || fieldType === "radio"

  useEffect(() => {
    if (item) {
      setName(item.name)
      setDescription(item.description || "")
      setFieldType(item.field_type)
      setIsRequired(item.is_required)
      setPlaceholder(item.placeholder || "")
      setOptions(item.options || [])
    }
  }, [item])

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], value: value, label: value }
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, { value: "", label: "" }])
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    const finalOptions = showOptions ? options.filter((o) => o.value?.trim()) : []
    onSave({
      name: name.trim(),
      description: description.trim(),
      field_type: fieldType,
      is_required: isRequired,
      placeholder: placeholder.trim(),
      options: finalOptions,
    })
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="space-y-1">
          <Label htmlFor="name">Name / Label</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Patient Full Name"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Help text shown below the field"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fieldType">Field Type</Label>
          <Select value={fieldType} onValueChange={(v: Item["field_type"]) => setFieldType(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a field type" />
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="placeholder">Placeholder (optional)</Label>
          <Input
            id="placeholder"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="e.g., John Doe"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="isRequired" checked={isRequired} onCheckedChange={(c) => setIsRequired(!!c)} />
          <Label htmlFor="isRequired">Required field</Label>
        </div>

        {showOptions && (
          <div className="space-y-2 pt-2 border-t">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option.value || ""}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <Button variant="ghost" size="icon" onClick={() => removeOption(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Option
            </Button>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save</Button>
      </DialogFooter>
    </>
  )
}

export function AddItemDialog({ isOpen, onClose, onAdd }: AddItemDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <ItemForm onSave={onAdd} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export function EditItemDialog({ isOpen, onClose, item, onUpdate }: EditItemDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <ItemForm item={item} onSave={(data) => onUpdate({ ...item, ...data })} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}
