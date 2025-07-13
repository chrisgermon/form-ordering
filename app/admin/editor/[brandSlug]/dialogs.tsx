"use client"

import type React from "react"

import { useState, type FC } from "react"
import type { Item, Option } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

interface ItemDialogProps {
  item?: Item
  onSave: (item: any) => void
  children: React.ReactNode
}

export const ItemDialog: FC<ItemDialogProps> = ({ item, onSave, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(item?.name || "")
  const [description, setDescription] = useState(item?.description || "")
  const [fieldType, setFieldType] = useState<Item["field_type"]>(item?.field_type || "text")
  const [isRequired, setIsRequired] = useState(item?.is_required || false)
  const [placeholder, setPlaceholder] = useState(item?.placeholder || "")
  const [options, setOptions] = useState<Partial<Option>[]>(item?.options || [{ value: "", label: "" }])

  const handleSave = () => {
    const itemData = {
      ...(item || {}),
      name,
      description: description || null,
      field_type: fieldType,
      is_required: isRequired,
      placeholder: placeholder || null,
      options: fieldType === "select" || fieldType === "radio" ? options.filter((o) => o.value?.trim()) : [],
    }
    onSave(itemData)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description || ""}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fieldType" className="text-right">
              Field Type
            </Label>
            <Select value={fieldType} onValueChange={(v) => setFieldType(v as Item["field_type"])}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="select">Select</SelectItem>
                <SelectItem value="radio">Radio Group</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(fieldType === "select" || fieldType === "radio") && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Options</Label>
              <div className="col-span-3 space-y-2">
                {options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Value"
                      value={opt.value || ""}
                      onChange={(e) =>
                        setOptions(options.map((o, i) => (i === index ? { ...o, value: e.target.value } : o)))
                      }
                    />
                    <Input
                      placeholder="Label (optional)"
                      value={opt.label || ""}
                      onChange={(e) =>
                        setOptions(options.map((o, i) => (i === index ? { ...o, label: e.target.value } : o)))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOptions(options.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setOptions([...options, { value: "", label: "" }])}>
                  <Plus className="h-4 w-4 mr-2" /> Add Option
                </Button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="placeholder" className="text-right">
              Placeholder
            </Label>
            <Input
              id="placeholder"
              value={placeholder || ""}
              onChange={(e) => setPlaceholder(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isRequired" className="text-right">
              Required
            </Label>
            <Checkbox id="isRequired" checked={isRequired} onCheckedChange={(c) => setIsRequired(!!c)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
