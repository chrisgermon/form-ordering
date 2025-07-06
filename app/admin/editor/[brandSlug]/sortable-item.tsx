"use client"

import type React from "react"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, Edit } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { ProductItem } from "@/lib/types"

interface SortableItemProps {
  item: ProductItem
  onUpdateItem: (updatedItem: ProductItem) => void
  onDeleteItem: () => void
}

export function SortableItem({ item, onUpdateItem, onDeleteItem }: SortableItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    data: { type: "item", sectionId: item.section_id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleFieldChange = (field: keyof ProductItem, value: any) => {
    onUpdateItem({ ...item, [field]: value })
  }

  const handleOptionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const options = e.target.value.split("\n")
    onUpdateItem({ ...item, options })
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border">
      <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-5 w-5" />
      </Button>
      <div className="flex-grow">
        <p className="font-medium">{item.name || "New Item"}</p>
        <p className="text-sm text-muted-foreground">
          {item.code || "No code"} - {item.field_type}
        </p>
      </div>
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item: {item.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Label / Name</Label>
                <Input id="name" value={item.name} onChange={(e) => handleFieldChange("name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="code">Item Code</Label>
                <Input id="code" value={item.code || ""} onChange={(e) => handleFieldChange("code", e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="field_type">Field Type</Label>
              <Select value={item.field_type} onValueChange={(value) => handleFieldChange("field_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                  <SelectItem value="checkbox_group">Checkbox Group</SelectItem>
                  <SelectItem value="date">Date Picker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={item.description || ""}
                onChange={(e) => handleFieldChange("description", e.target.value)}
              />
            </div>
            {(item.field_type === "text" || item.field_type === "textarea") && (
              <div>
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  value={item.placeholder || ""}
                  onChange={(e) => handleFieldChange("placeholder", e.target.value)}
                />
              </div>
            )}
            {(item.field_type === "select" || item.field_type === "checkbox_group") && (
              <div>
                <Label>Options (one per line)</Label>
                <Textarea
                  value={item.options?.join("\n") || ""}
                  onChange={handleOptionsChange}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
            )}
            <div>
              <Label htmlFor="sample_link">Sample Link (URL)</Label>
              <Input
                id="sample_link"
                value={item.sample_link || ""}
                onChange={(e) => handleFieldChange("sample_link", e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="is_required"
                checked={item.is_required}
                onCheckedChange={(checked) => handleFieldChange("is_required", !!checked)}
              />
              <Label htmlFor="is_required" className="font-medium">
                This field is required
              </Label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsEditing(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Button variant="ghost" size="icon" onClick={onDeleteItem}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  )
}
