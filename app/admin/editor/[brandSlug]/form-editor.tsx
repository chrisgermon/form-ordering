"use client"

import type React from "react"

import { useState, useTransition, type FC, useEffect } from "react"
import type { Brand, Section, Item, Option } from "@/lib/types"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GripVertical, PlusCircle, Trash2, Edit, Plus } from "lucide-react"
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
import { toast } from "sonner"
import {
  createItem,
  createSection,
  deleteItem,
  deleteSection,
  updateItem,
  updateItemOrder,
  updateSectionOrder,
} from "./actions"

const SortableWrapper: FC<{ id: string; children: React.ReactNode; className?: string }> = ({
  id,
  children,
  className,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab touch-none">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-grow">{children}</div>
      </div>
    </div>
  )
}

const ItemDialog: FC<{
  brandId: string
  sectionId: string
  item?: Item
  children: React.ReactNode
}> = ({ brandId, sectionId, item, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(item?.name || "")
  const [description, setDescription] = useState(item?.description || "")
  const [fieldType, setFieldType] = useState<Item["field_type"]>(item?.field_type || "text")
  const [isRequired, setIsRequired] = useState(item?.is_required || false)
  const [placeholder, setPlaceholder] = useState(item?.placeholder || "")
  const [options, setOptions] = useState<Partial<Option>[]>(item?.options || [{ value: "", label: "" }])

  const handleSave = () => {
    startTransition(async () => {
      const itemData: Partial<Item> = {
        id: item?.id,
        brand_id: brandId,
        section_id: sectionId,
        name,
        description: description || null,
        field_type: fieldType,
        is_required: isRequired,
        placeholder: placeholder || null,
        options: fieldType === "select" || fieldType === "radio" ? options.filter((o) => o.value) : [],
      }
      const promise = item ? updateItem(itemData) : createItem(itemData)
      toast.promise(promise, {
        loading: "Saving item...",
        success: () => {
          setIsOpen(false)
          return `Item ${item ? "updated" : "created"} successfully.`
        },
        error: "Failed to save item.",
      })
    })
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
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const SectionItems: FC<{ brandSlug: string; section: Section }> = ({ brandSlug, section }) => {
  const [items, setItems] = useState(section.items)
  const [isPending, startTransition] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    setItems(section.items)
  }, [section.items])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)
      startTransition(() => {
        toast.promise(
          updateItemOrder(
            brandSlug,
            section.id,
            newItems.map((i) => i.id),
          ),
          {
            loading: "Updating item order...",
            success: "Order updated.",
            error: "Failed to update order.",
          },
        )
      })
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      startTransition(() => {
        toast.promise(deleteItem(id), {
          loading: "Deleting item...",
          success: "Item deleted.",
          error: "Failed to delete item.",
        })
      })
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <SortableWrapper key={item.id} id={item.id} className="p-2 border rounded">
              <div className="flex-grow">{item.name}</div>
              <div className="text-sm text-muted-foreground">{item.field_type}</div>
              <ItemDialog brandId={section.brand_id} sectionId={section.id} item={item}>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </ItemDialog>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={isPending}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </SortableWrapper>
          ))}
        </div>
      </SortableContext>
      <ItemDialog brandId={section.brand_id} sectionId={section.id}>
        <Button variant="outline" className="w-full mt-4 bg-transparent">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </ItemDialog>
    </DndContext>
  )
}

const AddSectionDialog: FC<{ onAdd: (title: string) => void; children: React.ReactNode }> = ({ onAdd, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")

  const handleAdd = () => {
    if (title.trim()) {
      onAdd(title.trim())
      setIsOpen(false)
      setTitle("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="section-title">Section Title</Label>
          <Input
            id="section-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Patient Details"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleAdd}>Add Section</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const FormEditor: FC<{ initialBrand: Brand }> = ({ initialBrand }) => {
  const [brand, setBrand] = useState(initialBrand)
  const [isPending, startTransition] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    setBrand(initialBrand)
  }, [initialBrand])

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = brand.sections.findIndex((s) => s.id === active.id)
      const newIndex = brand.sections.findIndex((s) => s.id === over.id)
      const newSections = arrayMove(brand.sections, oldIndex, newIndex)
      setBrand({ ...brand, sections: newSections })
      startTransition(() => {
        toast.promise(
          updateSectionOrder(
            brand.slug,
            newSections.map((s) => s.id),
          ),
          {
            loading: "Updating section order...",
            success: "Order updated.",
            error: "Failed to update order.",
          },
        )
      })
    }
  }

  const handleAddSection = (title: string) => {
    startTransition(() => {
      const promise = new Promise(async (resolve, reject) => {
        const result = await createSection(brand.id, title)
        if (result.success) {
          resolve(result.data)
        } else {
          reject(new Error(result.error))
        }
      })

      toast.promise(promise, {
        loading: "Creating section...",
        success: "Section created.",
        error: (err) => `Failed to create section: ${err.message}`,
      })
    })
  }

  const handleDeleteSection = (id: string) => {
    if (window.confirm("Are you sure you want to delete this section and all its items?")) {
      startTransition(() => {
        toast.promise(deleteSection(id), {
          loading: "Deleting section...",
          success: "Section deleted.",
          error: "Failed to delete section.",
        })
      })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Editing: {brand.name}</h1>
        <AddSectionDialog onAdd={handleAddSection}>
          <Button disabled={isPending}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Section
          </Button>
        </AddSectionDialog>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={brand.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {brand.sections.map((section) => (
              <SortableWrapper key={section.id} id={section.id}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4 bg-muted/50">
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSection(section.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    <SectionItems brandSlug={brand.slug} section={section} />
                  </CardContent>
                </Card>
              </SortableWrapper>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
