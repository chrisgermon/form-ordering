"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import {
  Edit,
  Plus,
  Trash2,
  GripVertical,
  X,
  CheckSquare,
  ChevronDown,
  Type,
  Calendar,
  MousePointerClick,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { updateSectionOrder, updateItemOrder } from "./actions"
import { clearFormForBrand, importForm } from "../../actions"
import type { BrandData, Section as ProductSection, Item as ProductItem } from "@/lib/types"

const fieldTypes = [
  { value: "checkbox_group", label: "Checkbox Group", icon: CheckSquare },
  { value: "select", label: "Dropdown", icon: ChevronDown },
  { value: "text", label: "Text Input", icon: Type },
  { value: "textarea", label: "Text Area", icon: Type },
  { value: "date", label: "Date Picker", icon: Calendar },
]

function Toolbox({ onAddSectionClick }: { onAddSectionClick: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Elements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start bg-transparent" onClick={onAddSectionClick}>
            <MousePointerClick className="mr-2 h-4 w-4" />
            Add Section
          </Button>
          <p className="text-xs text-muted-foreground px-2 pt-2">
            Add items within a section using the buttons on the section card.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ImportFormDialog({
  open,
  onOpenChange,
  brandId,
  brandSlug,
  onImport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandId: string
  brandSlug: string
  onImport: () => void
}) {
  const [htmlCode, setHtmlCode] = useState("")
  const [url, setUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleImport = async () => {
    setIsImporting(true)
    setMessage(null)
    const result = await importForm(brandId, brandSlug, { htmlCode, url })
    if (result.success) {
      setMessage({ type: "success", text: result.message })
      onImport()
      setTimeout(() => {
        onOpenChange(false)
        setHtmlCode("")
        setUrl("")
      }, 2000)
    } else {
      setMessage({ type: "error", text: result.message })
    }
    setIsImporting(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) {
          setHtmlCode("")
          setUrl("")
          setMessage(null)
          setIsImporting(false)
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Form with AI</DialogTitle>
          <DialogDescription>
            Provide a URL or paste HTML source code. Grok will analyze the content and build the form for you.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="import-url">Import from URL</Label>
            <Input
              id="import-url"
              placeholder="https://example.com/contact-form"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="text-center text-sm text-muted-foreground">OR</div>
          <div>
            <Label htmlFor="import-html">Paste HTML Source Code</Label>
            <Textarea
              id="import-html"
              placeholder="Paste form HTML source code here..."
              className="min-h-[250px] font-mono text-xs"
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
            />
          </div>
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <p>{message.text}</p>
            </Alert>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || (!htmlCode && !url)}>
            {isImporting ? "Importing..." : "Import Form"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function FormEditor({ initialBrandData }: { initialBrandData: BrandData }) {
  const [brandData, setBrandData] = useState<BrandData>(initialBrandData)
  const [sections, setSections] = useState<ProductSection[]>(initialBrandData.sections || [])
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isImportFormDialogOpen, setIsImportFormDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<ProductItem | null>(null)
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setBrandData(initialBrandData)
    setSections(initialBrandData.sections || [])
  }, [initialBrandData])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === "section" && overType === "section") {
      const oldIndex = sections.findIndex((s) => s.id === active.id)
      const newIndex = sections.findIndex((s) => s.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reorderedSections = arrayMove(sections, oldIndex, newIndex)
      setSections(reorderedSections)

      const promise = updateSectionOrder(
        brandData.slug,
        reorderedSections.map((s) => s.id),
      )
      toast.promise(promise, {
        loading: "Saving section order...",
        success: "Section order saved!",
        error: "Failed to save section order.",
      })
    }

    if (activeType === "item" && overType === "item") {
      const sectionId = active.data.current?.sectionId
      const sectionIndex = sections.findIndex((s) => s.id === sectionId)
      if (sectionIndex === -1) return

      const section = sections[sectionIndex]
      const oldIndex = section.items.findIndex((i) => i.id === active.id)
      const newIndex = section.items.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reorderedItems = arrayMove(section.items, oldIndex, newIndex)
      const newSections = [...sections]
      newSections[sectionIndex] = { ...section, items: reorderedItems }
      setSections(newSections)

      const promise = updateItemOrder(
        brandData.slug,
        reorderedItems.map((i) => i.id),
      )
      toast.promise(promise, {
        loading: "Saving item order...",
        success: "Item order saved!",
        error: "Failed to save item order.",
      })
    }
  }

  const handleAddSection = async () => {
    const newSectionName = prompt("Enter new section name:")
    if (!newSectionName?.trim()) return

    const toastId = toast.loading("Creating section...")

    const response = await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_id: brandData.id,
        title: newSectionName,
        position: sections.length,
      }),
    })

    if (response.ok) {
      const newSection = await response.json()
      setSections((prevSections) => [...prevSections, { ...newSection, items: [] }])
      toast.success("Section created successfully!", { id: toastId })
    } else {
      toast.error("Failed to create section.", { id: toastId })
    }
  }

  const handleUpdateSectionTitle = async (sectionId: string, newTitle: string) => {
    const toastId = toast.loading("Updating section title...")
    const response = await fetch(`/api/admin/sections`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sectionId, title: newTitle }),
    })

    if (response.ok) {
      const updatedSection = await response.json()
      setSections((prevSections) =>
        prevSections.map((s) => (s.id === sectionId ? { ...s, title: updatedSection.title } : s)),
      )
      toast.success("Section title updated!", { id: toastId })
    } else {
      toast.error("Failed to update section title.", { id: toastId })
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm(`Are you sure you want to delete this section and all its items?`)) return

    const toastId = toast.loading("Deleting section...")
    const response = await fetch(`/api/admin/sections`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sectionId }),
    })

    if (response.ok) {
      setSections((prevSections) => prevSections.filter((s) => s.id !== sectionId))
      toast.success("Section deleted successfully!", { id: toastId })
    } else {
      toast.error("Failed to delete section.", { id: toastId })
    }
  }

  const openItemDialog = (sectionId: string, item: ProductItem | null = null) => {
    setCurrentSectionId(sectionId)
    setCurrentItem(item)
    setIsItemDialogOpen(true)
  }

  const handleSaveItem = async () => {
    if (!currentSectionId) return

    const toastId = toast.loading("Saving item...")
    const isNewItem = !currentItem?.id

    const payload = {
      ...currentItem,
      section_id: currentSectionId,
      brand_id: brandData.id,
    }

    const response = await fetch("/api/admin/items", {
      method: isNewItem ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      const savedItem = await response.json()
      setSections((prevSections) => {
        return prevSections.map((section) => {
          if (section.id === currentSectionId) {
            const newItems = isNewItem
              ? [...(section.items || []), savedItem]
              : (section.items || []).map((item) => (item.id === savedItem.id ? savedItem : item))
            return { ...section, items: newItems }
          }
          return section
        })
      })
      toast.success("Item saved successfully!", { id: toastId })
      setIsItemDialogOpen(false)
      setCurrentItem(null)
    } else {
      toast.error("Failed to save item.", { id: toastId })
    }
  }

  const handleDeleteItem = async (sectionId: string, itemId: string) => {
    if (!confirm(`Are you sure you want to delete this item?`)) return

    const toastId = toast.loading("Deleting item...")
    const response = await fetch("/api/admin/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId }),
    })

    if (response.ok) {
      setSections((prevSections) => {
        return prevSections.map((section) => {
          if (section.id === sectionId) {
            return { ...section, items: (section.items || []).filter((item) => item.id !== itemId) }
          }
          return section
        })
      })
      toast.success("Item deleted successfully!", { id: toastId })
    } else {
      toast.error("Failed to delete item.", { id: toastId })
    }
  }

  const handleClearForm = async () => {
    if (
      !confirm("Are you sure you want to delete all sections and items from this form? This action cannot be undone.")
    ) {
      return
    }

    const promise = clearFormForBrand(brandData.id, brandData.slug)

    toast.promise(promise, {
      loading: "Clearing form...",
      success: (result) => {
        if (result.success) {
          setSections([])
          return result.message
        } else {
          throw new Error(result.message)
        }
      },
      error: (err) => err.message || "Failed to clear form.",
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        <div className="space-y-6 lg:sticky lg:top-6">
          <Toolbox onAddSectionClick={handleAddSection} />
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm min-h-[400px]">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {sections.length > 0 ? (
                  sections.map((section) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      onUpdateTitle={handleUpdateSectionTitle}
                      onDelete={handleDeleteSection}
                      onAddItem={openItemDialog}
                    >
                      <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2 p-4">
                          {section.items.map((item) => (
                            <SortableItem
                              key={item.id}
                              item={item}
                              onEdit={openItemDialog}
                              onDelete={handleDeleteItem}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </SortableSection>
                  ))
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <p>Your form is empty.</p>
                    <p>Click 'Add Section' in the toolbox to get started.</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
      <ImportFormDialog
        open={isImportFormDialogOpen}
        onOpenChange={setIsImportFormDialogOpen}
        brandId={brandData.id}
        brandSlug={brandData.slug}
        onImport={() => router.refresh()}
      />
      <ItemDialog
        key={currentItem?.id || "new"}
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        item={currentItem}
        onSave={handleSaveItem}
        setCurrentItem={setCurrentItem}
      />
    </>
  )
}

function SortableSection({
  section,
  children,
  onUpdateTitle,
  onDelete,
  onAddItem,
}: {
  section: ProductSection
  children: React.ReactNode
  onUpdateTitle: (sectionId: string, newTitle: string) => void
  onDelete: (sectionId: string) => void
  onAddItem: (sectionId: string, item: ProductItem | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
    data: { type: "section" },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <Card ref={setNodeRef} style={style} className="bg-gray-50 border-2 border-dashed">
      <CardHeader className="flex flex-row items-center justify-between p-3 bg-white border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" {...attributes} {...listeners} className="cursor-grab p-2">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </Button>
          <Input
            defaultValue={section.title}
            onBlur={(e) => onUpdateTitle(section.id, e.target.value)}
            className="text-lg font-semibold border-none focus:ring-0 shadow-none p-1 h-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onAddItem(section.id, null)}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(section.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

function SortableItem({
  item,
  onEdit,
  onDelete,
}: {
  item: ProductItem
  onEdit: (sectionId: string, item: ProductItem) => void
  onDelete: (sectionId: string, itemId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    data: { type: "item", sectionId: item.section_id },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const fieldTypeLabel = fieldTypes.find((ft) => ft.value === item.field_type)?.label || "Item"

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-white p-3 rounded-md border shadow-sm">
      <Button variant="ghost" size="sm" {...attributes} {...listeners} className="cursor-grab p-2">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </Button>
      <div className="flex-grow">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-gray-500">
          <Badge variant="secondary" className="mr-2">
            {fieldTypeLabel}
          </Badge>
          Code: {item.code}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(item.section_id, item)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(item.section_id, item.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ItemDialog({
  open,
  onOpenChange,
  item,
  onSave,
  setCurrentItem,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ProductItem | null
  onSave: () => void
  setCurrentItem: (item: ProductItem | null) => void
}) {
  const [formData, setFormData] = useState<Partial<ProductItem>>({})

  useEffect(() => {
    if (open) {
      setFormData(
        item || {
          name: "",
          code: "",
          field_type: "text",
          is_required: false,
          options: [],
        },
      )
    }
  }, [open, item])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleCheckedChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_required: checked }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, field_type: value as ProductItem["field_type"] }))
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])]
    newOptions[index] = value
    setFormData((prev) => ({ ...prev, options: newOptions }))
  }

  const addOption = () => {
    setFormData((prev) => ({ ...prev, options: [...(prev.options || []), ""] }))
  }

  const removeOption = (index: number) => {
    const newOptions = (formData.options || []).filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, options: newOptions }))
  }

  const handleSave = () => {
    setCurrentItem(formData as ProductItem)
    setTimeout(onSave, 0)
  }

  const fieldTypeLabel = fieldTypes.find((ft) => ft.value === formData.field_type)?.label || "Item"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{formData.id ? `Edit ${fieldTypeLabel}` : `Add New ${fieldTypeLabel}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Label / Name</Label>
              <Input id="name" value={formData.name || ""} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="code">Item Code</Label>
              <Input id="code" value={formData.code || ""} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="field_type">Field Type</Label>
            <Select value={formData.field_type} onValueChange={handleSelectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a field type" />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>
                    {ft.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description || ""} onChange={handleChange} />
          </div>

          {(formData.field_type === "text" || formData.field_type === "textarea") && (
            <div>
              <Label htmlFor="placeholder">Placeholder</Label>
              <Input id="placeholder" value={formData.placeholder || ""} onChange={handleChange} />
            </div>
          )}

          {(formData.field_type === "checkbox_group" || formData.field_type === "select") && (
            <div>
              <Label>Options</Label>
              <div className="space-y-2">
                {(formData.options || []).map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeOption(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={addOption}>
                <Plus className="mr-2 h-4 w-4" /> Add Option
              </Button>
            </div>
          )}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="is_required" checked={formData.is_required} onCheckedChange={handleCheckedChange} />
            <Label htmlFor="is_required" className="font-medium">
              This field is required
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
