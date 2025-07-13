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
import { toast } from "sonner"

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
import { clearFormForBrand, importForm } from "../../actions"
import type { Brand, ProductSection, ProductItem, UploadedFile } from "./types"
import { FileManager } from "@/app/admin/FileManager"

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

// Main Editor Component
export default function FormEditor({
  initialBrandData,
  uploadedFiles,
}: {
  initialBrandData: Brand
  uploadedFiles: UploadedFile[]
}) {
  const [brandData, setBrandData] = useState<Brand>(initialBrandData)
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isImportFormDialogOpen, setIsImportFormDialogOpen] = useState(false)
  const [activeItemOptions, setActiveItemOptions] = useState<{
    sectionId: string
    brandId: string
    fieldType: ProductItem["field_type"]
    item?: ProductItem
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === "section" && overType === "section") {
      const oldIndex = brandData.product_sections.findIndex((s) => s.id === active.id)
      const newIndex = brandData.product_sections.findIndex((s) => s.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reorderedSections = arrayMove(brandData.product_sections, oldIndex, newIndex)
      setBrandData((prev) => ({ ...prev, product_sections: reorderedSections }))

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
      const sectionIndex = brandData.product_sections.findIndex((s) => s.id === sectionId)
      if (sectionIndex === -1) return

      const section = brandData.product_sections[sectionIndex]
      const oldIndex = section.product_items.findIndex((i) => i.id === active.id)
      const newIndex = section.product_items.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reorderedItems = arrayMove(section.product_items, oldIndex, newIndex)
      const newSections = [...brandData.product_sections]
      newSections[sectionIndex] = { ...section, product_items: reorderedItems }
      setBrandData((prev) => ({ ...prev, product_sections: newSections }))

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

  const handleAddItemClick = (sectionId: string, fieldType: ProductItem["field_type"]) => {
    setActiveItemOptions({ sectionId, brandId: brandData.id, fieldType })
    setIsItemDialogOpen(true)
  }

  const handleEditItemClick = (item: ProductItem) => {
    setActiveItemOptions({
      sectionId: item.section_id,
      brandId: item.brand_id,
      fieldType: item.field_type,
      item: item,
    })
    setIsItemDialogOpen(true)
  }

  const handleDeleteSection = (sectionId: string) => {
    if (!confirm(`Are you sure you want to delete this section and all its items?`)) return

    const originalSections = brandData.product_sections
    setBrandData((prev) => ({
      ...prev,
      product_sections: prev.product_sections.filter((s) => s.id !== sectionId),
    }))

    const promise = fetch(`/api/admin/sections?id=${sectionId}`, { method: "DELETE" })
    toast.promise(promise, {
      loading: "Deleting section...",
      success: (res) => {
        if (!res.ok) throw new Error("Failed on server.")
        onDataChange()
        return "Section deleted successfully!"
      },
      error: () => {
        setBrandData((prev) => ({ ...prev, product_sections: originalSections }))
        return "Failed to delete section."
      },
    })
  }

  const handleDeleteItem = (itemId: string, sectionId: string) => {
    if (!confirm(`Are you sure you want to delete this item?`)) return

    const originalSections = brandData.product_sections
    const newSections = originalSections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          product_items: section.product_items.filter((item) => item.id !== itemId),
        }
      }
      return section
    })
    setBrandData((prev) => ({ ...prev, product_sections: newSections }))

    const promise = fetch(`/api/admin/items?id=${itemId}`, { method: "DELETE" })
    toast.promise(promise, {
      loading: "Deleting item...",
      success: (res) => {
        if (!res.ok) throw new Error("Failed on server.")
        onDataChange()
        return "Item deleted successfully!"
      },
      error: () => {
        setBrandData((prev) => ({ ...prev, product_sections: originalSections }))
        return "Failed to delete item."
      },
    })
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
          onDataChange()
          return result.message
        } else {
          throw new Error(result.message)
        }
      },
      error: (err) => err.message || "Failed to clear form.",
    })
  }

  const handleSectionCreated = (newSection: ProductSection) => {
    setBrandData((prev) => ({
      ...prev,
      product_sections: [...prev.product_sections, newSection],
    }))
  }

  const handleSectionUpdated = (updatedSection: ProductSection) => {
    setBrandData((prev) => ({
      ...prev,
      product_sections: prev.product_sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)),
    }))
  }

  const handleItemCreated = (newItem: ProductItem) => {
    setBrandData((prev) => ({
      ...prev,
      product_sections: prev.product_sections.map((section) => {
        if (section.id === newItem.section_id) {
          return {
            ...section,
            product_items: [...section.product_items, newItem],
          }
        }
        return section
      }),
    }))
  }

  const handleItemUpdated = (updatedItem: ProductItem) => {
    setBrandData((prev) => ({
      ...prev,
      product_sections: prev.product_sections.map((section) => {
        if (section.id === updatedItem.section_id) {
          return {
            ...section,
            product_items: section.product_items.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
          }
        }
        return section
      }),
    }))
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
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
              onClick={handleClearForm}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Form
            </Button>
            <Button variant="outline" onClick={() => setIsImportFormDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Form
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

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          <div className="space-y-6">
            <Toolbox onAddSectionClick={() => setIsSectionDialogOpen(true)} />
            <FileManager brandId={brandData.id} />
          </div>

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
                        onDeleteSection={handleDeleteSection}
                        onAddItem={handleAddItemClick}
                        onSectionUpdated={handleSectionUpdated}
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
                                onDelete={handleDeleteItem}
                                onEdit={handleEditItemClick}
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
        onSectionCreated={handleSectionCreated}
      />
      {activeItemOptions && (
        <ItemDialog
          key={activeItemOptions.item?.id || "new"}
          open={isItemDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setActiveItemOptions(null)
            }
            setIsItemDialogOpen(open)
          }}
          {...activeItemOptions}
          onItemCreated={handleItemCreated}
          onItemUpdated={handleItemUpdated}
          uploadedFiles={uploadedFiles}
        />
      )}
      <ImportFormDialog
        open={isImportFormDialogOpen}
        onOpenChange={setIsImportFormDialogOpen}
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
  onDeleteSection,
  onAddItem,
  onSectionUpdated,
}: {
  section: ProductSection
  children: React.ReactNode
  onDeleteSection: (sectionId: string) => void
  onAddItem: (sectionId: string, fieldType: ProductItem["field_type"]) => void
  onSectionUpdated: (updatedSection: ProductSection) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
    data: { type: "section" },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)

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
          <Button size="sm" variant="destructive" onClick={() => onDeleteSection(section.id)}>
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
        onSectionUpdated={onSectionUpdated}
      />
    </Card>
  )
}

// Sortable Item Component
function SortableItem({
  item,
  onDelete,
  onEdit,
}: {
  item: ProductItem
  onDelete: (itemId: string, sectionId: string) => void
  onEdit: (item: ProductItem) => void
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
        <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(item.id, item.section_id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Section Dialog
function SectionDialog({
  open,
  onOpenChange,
  section,
  brandId,
  onSectionCreated,
  onSectionUpdated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  section?: ProductSection
  brandId: string
  onSectionCreated?: (newSection: ProductSection) => void
  onSectionUpdated?: (updatedSection: ProductSection) => void
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
    const promise = fetch("/api/admin/sections", {
      method: section ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    toast.promise(promise, {
      loading: "Saving section...",
      success: async (res) => {
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || "Failed on server.")
        }
        const savedSection = await res.json()
        if (section && onSectionUpdated) {
          onSectionUpdated(savedSection)
        } else if (!section && onSectionCreated) {
          onSectionCreated(savedSection)
        }
        onOpenChange(false)
        return "Section saved successfully!"
      },
      error: (err) => err.message || "Failed to save section.",
    })
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
  uploadedFiles,
  fieldType,
  onItemCreated,
  onItemUpdated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ProductItem
  sectionId: string
  brandId: string
  uploadedFiles: UploadedFile[]
  fieldType: ProductItem["field_type"]
  onItemCreated?: (newItem: ProductItem) => void
  onItemUpdated?: (updatedItem: ProductItem) => void
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
        setFormData((prev) => ({ ...prev, sample_link: newFile.pathname }))
        toast.success("File uploaded and selected.")
      } else {
        toast.error("Failed to upload file.")
      }
    } catch (error) {
      toast.error("Error uploading file.")
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
    const promise = fetch("/api/admin/items", {
      method: item ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    toast.promise(promise, {
      loading: "Saving item...",
      success: async (res) => {
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || "Failed on server.")
        }
        const savedItem = await res.json()
        if (item && onItemUpdated) {
          onItemUpdated(savedItem)
        } else if (!item && onItemCreated) {
          onItemCreated(savedItem)
        }
        onOpenChange(false)
        return "Item saved successfully!"
      },
      error: (err) => err.message || "Failed to save item.",
    })
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
