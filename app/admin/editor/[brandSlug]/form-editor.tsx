"use client"

import React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import {
  ArrowLeft,
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
  Upload,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { updateSectionOrder, updateItemOrder } from "./actions"
import { importFromJotform } from "../../actions"
import type { Brand, ProductSection, ProductItem, UploadedFile } from "./types"

const fieldTypes = [
  { value: "checkbox_group", label: "Checkbox Group", icon: CheckSquare },
  { value: "select", label: "Dropdown", icon: ChevronDown },
  { value: "text", label: "Text Input", icon: Type },
  { value: "textarea", label: "Text Area", icon: Type },
  { value: "date", label: "Date Picker", icon: Calendar },
]

// Toolbox Component
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

// Jotform Import Dialog
function JotformImportDialog({
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
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleImport = async () => {
    setIsImporting(true)
    setMessage(null)
    const result = await importFromJotform(brandId, brandSlug, htmlCode)
    if (result.success) {
      setMessage({ type: "success", text: result.message })
      onImport()
      setTimeout(() => {
        onOpenChange(false)
        setHtmlCode("")
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
          setMessage(null)
          setIsImporting(false)
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from Jotform</DialogTitle>
          <DialogDescription>Paste the full HTML source code of your Jotform to import its fields.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Textarea
            placeholder="Paste Jotform HTML source code here..."
            className="min-h-[300px] font-mono text-xs"
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
          />
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
          <Button onClick={handleImport} disabled={isImporting || !htmlCode}>
            {isImporting ? "Importing..." : "Import Form"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main Editor Component
export function FormEditor({
  initialBrandData,
  uploadedFiles,
}: {
  initialBrandData: Brand
  uploadedFiles: UploadedFile[]
}) {
  const [brandData, setBrandData] = useState<Brand>(initialBrandData)
  const [message, setMessage] = useState("")
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isJotformDialogOpen, setIsJotformDialogOpen] = useState(false)
  const [activeItemOptions, setActiveItemOptions] = useState<{
    sectionId: string
    brandId: string
    fieldType: ProductItem["field_type"]
  } | null>(null)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const onDataChange = () => {
    router.refresh()
  }

  React.useEffect(() => {
    setBrandData(initialBrandData)
  }, [initialBrandData])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === "section" && overType === "section") {
      setBrandData((brand) => {
        const oldIndex = brand.product_sections.findIndex((s) => s.id === active.id)
        const newIndex = brand.product_sections.findIndex((s) => s.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return brand
        const reorderedSections = arrayMove(brand.product_sections, oldIndex, newIndex)
        updateSectionOrder(
          brand.slug,
          reorderedSections.map((s) => s.id),
        )
        return { ...brand, product_sections: reorderedSections }
      })
    }

    if (activeType === "item" && overType === "item") {
      const sectionId = active.data.current?.sectionId
      setBrandData((brand) => {
        const sectionIndex = brand.product_sections.findIndex((s) => s.id === sectionId)
        if (sectionIndex === -1) return brand

        const section = brand.product_sections[sectionIndex]
        const oldIndex = section.product_items.findIndex((i) => i.id === active.id)
        const newIndex = section.product_items.findIndex((i) => i.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return brand
        const reorderedItems = arrayMove(section.product_items, oldIndex, newIndex)

        updateItemOrder(
          brand.slug,
          reorderedItems.map((i) => i.id),
        )

        const newSections = [...brand.product_sections]
        newSections[sectionIndex] = { ...section, product_items: reorderedItems }
        return { ...brand, product_sections: newSections }
      })
    }
  }

  const handleAddItemToSection = (sectionId: string, fieldType: ProductItem["field_type"]) => {
    setActiveItemOptions({ sectionId, brandId: brandData.id, fieldType })
    setIsItemDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button onClick={() => router.push("/admin")} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsJotformDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import from Jotform
            </Button>
            <Button asChild>
              <Link href={`/forms/${brandData.slug}`} target="_blank">
                Preview Form
              </Link>
            </Button>
          </div>
        </div>

        <Card className="mb-6 bg-white shadow-sm">
          <CardHeader>
            <p className="text-sm text-gray-500">Form Editor</p>
            <CardTitle className="text-3xl">{brandData.name}</CardTitle>
          </CardHeader>
        </Card>

        {message && <Alert className="mb-4">{message}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          <Toolbox onAddSectionClick={() => setIsSectionDialogOpen(true)} />

          <div className="bg-white p-4 rounded-lg shadow-sm min-h-[400px]">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={brandData.product_sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {brandData.product_sections.length > 0 ? (
                    brandData.product_sections.map((section) => (
                      <SortableSection
                        key={section.id}
                        section={section}
                        onDataChange={onDataChange}
                        uploadedFiles={uploadedFiles}
                        onAddItem={handleAddItemToSection}
                      >
                        <SortableContext
                          items={section.product_items.map((i) => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2 p-4">
                            {section.product_items.map((item) => (
                              <SortableItem
                                key={item.id}
                                item={item}
                                onDataChange={onDataChange}
                                uploadedFiles={uploadedFiles}
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
      </div>
      <SectionDialog
        open={isSectionDialogOpen}
        onOpenChange={setIsSectionDialogOpen}
        brandId={brandData.id}
        onDataChange={onDataChange}
      />
      {activeItemOptions && (
        <ItemDialog
          key={activeItemOptions.fieldType + (activeItemOptions as any).id}
          open={isItemDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setActiveItemOptions(null)
            }
            setIsItemDialogOpen(open)
          }}
          sectionId={activeItemOptions.sectionId}
          brandId={activeItemOptions.brandId}
          fieldType={activeItemOptions.fieldType}
          onDataChange={onDataChange}
          uploadedFiles={uploadedFiles}
        />
      )}
      <JotformImportDialog
        open={isJotformDialogOpen}
        onOpenChange={setIsJotformDialogOpen}
        brandId={brandData.id}
        brandSlug={brandData.slug}
        onImport={onDataChange}
      />
    </div>
  )
}

// Sortable Section Component
function SortableSection({
  section,
  children,
  onDataChange,
  uploadedFiles,
  onAddItem,
}: {
  section: ProductSection
  children: React.ReactNode
  onDataChange: () => void
  uploadedFiles: UploadedFile[]
  onAddItem: (sectionId: string, fieldType: ProductItem["field_type"]) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
    data: { type: "section" },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)

  const deleteSection = async () => {
    if (!confirm(`Are you sure you want to delete section "${section.title}"?`)) return
    await fetch(`/api/admin/sections?id=${section.id}`, { method: "DELETE" })
    onDataChange()
  }

  return (
    <Card ref={setNodeRef} style={style} className="bg-gray-50 border-2 border-dashed">
      <CardHeader className="flex flex-row items-center justify-between p-3 bg-white border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" {...attributes} {...listeners} className="cursor-grab p-2">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </Button>
          <h3 className="font-semibold text-lg">{section.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsSectionDialogOpen(true)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={deleteSection}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {children}
        <div className="p-4 border-t bg-white grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {fieldTypes.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => onAddItem(section.id, value as ProductItem["field_type"])}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
      <SectionDialog
        open={isSectionDialogOpen}
        onOpenChange={setIsSectionDialogOpen}
        section={section}
        brandId={section.brand_id}
        onDataChange={onDataChange}
      />
    </Card>
  )
}

// Sortable Item Component
function SortableItem({
  item,
  onDataChange,
  uploadedFiles,
}: {
  item: ProductItem
  onDataChange: () => void
  uploadedFiles: UploadedFile[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    data: { type: "item", sectionId: item.section_id },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)

  const deleteItem = async () => {
    if (!confirm(`Are you sure you want to delete item "${item.name}"?`)) return
    await fetch(`/api/admin/items?id=${item.id}`, { method: "DELETE" })
    onDataChange()
  }

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
        <Button size="sm" variant="outline" onClick={() => setIsItemDialogOpen(true)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="destructive" onClick={deleteItem}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <ItemDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        item={item}
        sectionId={item.section_id}
        brandId={item.brand_id}
        onDataChange={onDataChange}
        uploadedFiles={uploadedFiles}
        fieldType={item.field_type}
      />
    </div>
  )
}

// Section Dialog
function SectionDialog({
  open,
  onOpenChange,
  section,
  brandId,
  onDataChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  section?: ProductSection
  brandId: string
  onDataChange: () => void
}) {
  const [title, setTitle] = useState("")

  React.useEffect(() => {
    if (open) {
      setTitle(section?.title || "")
    }
  }, [open, section])

  const handleSubmit = async () => {
    const payload = {
      id: section?.id,
      title,
      brandId,
    }
    await fetch("/api/admin/sections", {
      method: section ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    onDataChange()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{section ? "Edit Section" : "Add New Section"}</DialogTitle>
          <DialogDescription>
            {section ? "Update the title for this form section." : "Create a new section to group items in the form."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="section-title">Section Title</Label>
            <Input id="section-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Section</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Item Dialog
function ItemDialog({
  open,
  onOpenChange,
  item,
  sectionId,
  brandId,
  onDataChange,
  uploadedFiles,
  fieldType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ProductItem
  sectionId: string
  brandId: string
  onDataChange: () => void
  uploadedFiles: UploadedFile[]
  fieldType: ProductItem["field_type"]
}) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    sample_link: "",
    placeholder: "",
    is_required: false,
  })
  const [options, setOptions] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const brandSpecificFiles = useMemo(
    () => uploadedFiles.filter((file) => file.brand_id === brandId || file.brand_id === null),
    [uploadedFiles, brandId],
  )

  React.useEffect(() => {
    if (open) {
      setFormData({
        code: item?.code || "",
        name: item?.name || "",
        description: item?.description || "",
        sample_link: item?.sample_link || "",
        placeholder: item?.placeholder || "",
        is_required: item?.is_required || false,
      })
      setOptions(item?.options || [""])
    }
  }, [open, item])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, ""])
  }

  const removeOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
    } else {
      setOptions([""])
    }
  }

  const handleFileSelectAndUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)

    try {
      const response = await fetch(`/api/admin/upload?brandId=${brandId}`, {
        method: "POST",
        body: uploadFormData,
      })
      if (response.ok) {
        const newFile = await response.json()
        // Automatically select the newly uploaded file's pathname
        setFormData((prev) => ({ ...prev, sample_link: newFile.pathname }))
        // Trigger parent to refresh its file list
        onDataChange()
      } else {
        console.error("Failed to upload file")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    const payload = {
      id: item?.id,
      ...formData,
      options: options.filter((q) => q.trim() !== ""),
      sectionId,
      brandId,
      fieldType,
      is_required: formData.is_required,
    }
    await fetch("/api/admin/items", {
      method: item ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    onDataChange()
    onOpenChange(false)
  }

  const fieldTypeLabel = fieldTypes.find((ft) => ft.value === fieldType)?.label || "Item"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? `Edit ${fieldTypeLabel}` : `Add New ${fieldTypeLabel}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Label / Name</Label>
              <Input id="name" value={formData.name} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="code">Item Code</Label>
              <Input id="code" value={formData.code} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description || ""} onChange={handleChange} />
          </div>

          {(fieldType === "text" || fieldType === "textarea") && (
            <div>
              <Label htmlFor="placeholder">Placeholder</Label>
              <Input id="placeholder" value={formData.placeholder || ""} onChange={handleChange} />
            </div>
          )}

          {(fieldType === "checkbox_group" || fieldType === "select") && (
            <div>
              <Label>Options</Label>
              <div className="space-y-2">
                {options.map((opt, index) => (
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

          <div>
            <Label htmlFor="sample_link">Sample Link (URL)</Label>
            <div className="flex items-center gap-2">
              <Select
                value={formData.sample_link}
                onValueChange={(value) => setFormData({ ...formData, sample_link: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an uploaded file" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No file / Custom URL</SelectItem>
                  {brandSpecificFiles.map((file) => (
                    <SelectItem key={file.id} value={file.pathname}>
                      {file.original_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Button type="button" variant="outline" asChild disabled={isUploading}>
                  <label htmlFor="sample-file-upload" className="cursor-pointer flex items-center">
                    <Upload className="mr-2 h-4 w-4" /> {isUploading ? "Uploading..." : "Upload"}
                  </label>
                </Button>
                <Input
                  id="sample-file-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.svg"
                  onChange={handleFileSelectAndUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
              </div>
            </div>
            <Input
              id="sample_link"
              className="mt-2"
              placeholder="Or paste custom URL here"
              value={formData.sample_link || ""}
              onChange={handleChange}
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is_required"
              checked={formData.is_required}
              onCheckedChange={(checked) => setFormData({ ...formData, is_required: !!checked })}
            />
            <Label htmlFor="is_required" className="font-medium">
              This field is required
            </Label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Item</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
