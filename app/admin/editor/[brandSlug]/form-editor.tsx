"use client"

import React from "react"
import { useState } from "react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import { ArrowLeft, Edit, Plus, Trash2, GripVertical, Heading2, X, Download, Loader2, Trash } from "lucide-react"

import { updateSectionOrder, updateItemOrder, importFromJotform, clearForm } from "./actions"
import type { Brand, ProductSection, ProductItem, UploadedFile } from "@/lib/types"

// Toolbox Component
function Toolbox({ onAddSectionClick, onImportClick }: { onAddSectionClick: () => void; onImportClick: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Elements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start bg-transparent" onClick={onAddSectionClick}>
            <Heading2 className="mr-2 h-4 w-4" />
            Add Section
          </Button>
          <p className="text-xs text-muted-foreground px-2 pt-2">Add items within a section.</p>
          <div className="border-t my-4" />
          <Button variant="outline" className="w-full justify-start bg-transparent" onClick={onImportClick}>
            <Download className="mr-2 h-4 w-4" />
            Import from JotForm
          </Button>
          <p className="text-xs text-muted-foreground px-2">Import sections and items from an existing JotForm.</p>
        </div>
      </CardContent>
    </Card>
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
  const [message, setMessage] = useState("")
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const onDataChange = async () => {
    // Fetch with 'no-store' to bypass cache and get the latest data
    const res = await fetch(`/api/admin/brands/${brandData.slug}`, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      // Ensure nested items are sorted correctly after refetch
      data.product_sections.sort((a: any, b: any) => a.sort_order - b.sort_order)
      data.product_sections.forEach((section: any) => {
        if (section.product_items) {
          section.product_items.sort((a: any, b: any) => a.sort_order - b.sort_order)
        }
      })
      setBrandData(data)
    }
  }

  const handleClearForm = async () => {
    if (
      !confirm(`Are you sure you want to clear the entire form for "${brandData.name}"? This action cannot be undone.`)
    ) {
      return
    }

    const originalSections = brandData.product_sections
    setBrandData({ ...brandData, product_sections: [] }) // Optimistic update
    setMessage("Clearing form...")

    const result = await clearForm(brandData.id, brandData.slug)

    if (result.success) {
      setMessage(result.message || "Form cleared successfully.")
    } else {
      setMessage(`Error: ${result.error}`)
      setBrandData({ ...brandData, product_sections: originalSections }) // Revert on failure
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === "section" && overType === "section") {
      const oldIndex = brandData.product_sections.findIndex((s) => s.id === active.id)
      const newIndex = brandData.product_sections.findIndex((s) => s.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reorderedSections = arrayMove(brandData.product_sections, oldIndex, newIndex)
      setBrandData((brand) => ({ ...brand, product_sections: reorderedSections }))

      try {
        const result = await updateSectionOrder(
          brandData.slug,
          reorderedSections.map((s) => s.id),
        )
        if (!result.success) throw new Error(result.error)
        setMessage("Section order saved.")
        setTimeout(() => setMessage(""), 3000)
      } catch (e: any) {
        setMessage(`Error saving section order: ${e.message}`)
        onDataChange() // Revert optimistic update on failure
      }
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
      setBrandData((brand) => {
        const newSections = [...brand.product_sections]
        newSections[sectionIndex] = { ...section, product_items: reorderedItems }
        return { ...brand, product_sections: newSections }
      })

      try {
        const result = await updateItemOrder(
          brandData.slug,
          reorderedItems.map((i) => i.id),
        )
        if (!result.success) throw new Error(result.error)
        setMessage("Item order saved.")
        setTimeout(() => setMessage(""), 3000)
      } catch (e: any) {
        setMessage(`Error saving item order: ${e.message}`)
        onDataChange() // Revert optimistic update on failure
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button onClick={() => router.push("/admin")} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button asChild>
            <Link href={`/forms/${brandData.slug}`} target="_blank">
              Preview Form
            </Link>
          </Button>
        </div>

        <Card className="mb-6 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Form Editor</p>
              <CardTitle className="text-3xl">{brandData.name}</CardTitle>
            </div>
            <Button variant="destructive" onClick={handleClearForm}>
              <Trash className="mr-2 h-4 w-4" />
              Clear Form
            </Button>
          </CardHeader>
        </Card>

        {message && <Alert className="mb-4">{message}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          <Toolbox
            onAddSectionClick={() => setIsSectionDialogOpen(true)}
            onImportClick={() => setIsImportDialogOpen(true)}
          />

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
                        brandData={brandData}
                        setBrandData={setBrandData}
                        setMessage={setMessage}
                        uploadedFiles={uploadedFiles}
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
                                brandData={brandData}
                                setBrandData={setBrandData}
                                setMessage={setMessage}
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
                      <p>Add a section or import from JotForm to get started.</p>
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
      <JotformImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        brandId={brandData.id}
        brandSlug={brandData.slug}
        onDataChange={onDataChange}
        setMessage={setMessage}
      />
    </div>
  )
}

// Sortable Section Component
function SortableSection({
  section,
  children,
  brandData,
  setBrandData,
  setMessage,
  uploadedFiles,
}: {
  section: ProductSection
  children: React.ReactNode
  brandData: Brand
  setBrandData: React.Dispatch<React.SetStateAction<Brand>>
  setMessage: (message: string) => void
  uploadedFiles: UploadedFile[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
    data: { type: "section" },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)

  const onDataChange = async () => {
    const res = await fetch(`/api/admin/brands/${brandData.slug}`, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      data.product_sections.sort((a: any, b: any) => a.sort_order - b.sort_order)
      data.product_sections.forEach((s: any) => {
        if (s.product_items) s.product_items.sort((a: any, b: any) => a.sort_order - b.sort_order)
      })
      setBrandData(data)
    }
  }

  const deleteSection = async () => {
    if (!confirm(`Are you sure you want to delete section "${section.title}"? This will also delete all items in it.`))
      return

    const originalSections = brandData.product_sections
    const newSections = originalSections.filter((s) => s.id !== section.id)
    setBrandData((prev) => ({ ...prev, product_sections: newSections })) // Optimistic update

    const response = await fetch(`/api/admin/sections?id=${section.id}`, { method: "DELETE" })

    if (!response.ok) {
      setMessage(`Error: Could not delete section "${section.title}".`)
      setBrandData((prev) => ({ ...prev, product_sections: originalSections })) // Revert
    } else {
      setMessage(`Section "${section.title}" deleted.`)
    }
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
        <div className="p-4 border-t bg-white">
          <Button variant="ghost" className="w-full text-blue-600" onClick={() => setIsItemDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </CardContent>
      <ItemDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        sectionId={section.id}
        brandId={section.brand_id}
        onDataChange={onDataChange}
        uploadedFiles={uploadedFiles}
      />
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
  brandData,
  setBrandData,
  setMessage,
  uploadedFiles,
}: {
  item: ProductItem
  brandData: Brand
  setBrandData: React.Dispatch<React.SetStateAction<Brand>>
  setMessage: (message: string) => void
  uploadedFiles: UploadedFile[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    data: { type: "item", sectionId: item.section_id },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)

  const onDataChange = async () => {
    const res = await fetch(`/api/admin/brands/${brandData.slug}`, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      data.product_sections.sort((a: any, b: any) => a.sort_order - b.sort_order)
      data.product_sections.forEach((s: any) => {
        if (s.product_items) s.product_items.sort((a: any, b: any) => a.sort_order - b.sort_order)
      })
      setBrandData(data)
    }
  }

  const deleteItem = async () => {
    if (!confirm(`Are you sure you want to delete item "${item.name}"?`)) return

    const originalBrandData = brandData
    const updatedBrandData = {
      ...brandData,
      product_sections: brandData.product_sections.map((s) => {
        if (s.id === item.section_id) {
          return {
            ...s,
            product_items: s.product_items.filter((i) => i.id !== item.id),
          }
        }
        return s
      }),
    }
    setBrandData(updatedBrandData) // Optimistic update

    const response = await fetch(`/api/admin/items?id=${item.id}`, { method: "DELETE" })

    if (!response.ok) {
      setMessage(`Error: Could not delete item "${item.name}".`)
      setBrandData(originalBrandData) // Revert
    } else {
      setMessage(`Item "${item.name}" deleted.`)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-white p-3 rounded-md border shadow-sm">
      <Button variant="ghost" size="sm" {...attributes} {...listeners} className="cursor-grab p-2">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </Button>
      <div className="flex-grow">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-gray-500">Code: {item.code}</p>
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
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ProductItem
  sectionId: string
  brandId: string
  onDataChange: () => void
  uploadedFiles: UploadedFile[]
}) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    sample_link: "",
  })
  const [quantities, setQuantities] = useState<string[]>([])

  React.useEffect(() => {
    if (open) {
      setFormData({
        code: item?.code || "",
        name: item?.name || "",
        description: item?.description || "",
        sample_link: item?.sample_link || "",
      })
      setQuantities(item?.quantities || [""])
    }
  }, [open, item])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleQuantityChange = (index: number, value: string) => {
    const newQuantities = [...quantities]
    newQuantities[index] = value
    setQuantities(newQuantities)
  }

  const addQuantity = () => {
    setQuantities([...quantities, ""])
  }

  const removeQuantity = (index: number) => {
    if (quantities.length > 1) {
      const newQuantities = quantities.filter((_, i) => i !== index)
      setQuantities(newQuantities)
    } else {
      setQuantities([""])
    }
  }

  const handleSubmit = async () => {
    const payload = {
      id: item?.id,
      ...formData,
      quantities: quantities.filter((q) => q.trim() !== ""),
      sectionId,
      brandId,
    }
    await fetch("/api/admin/items", {
      method: item ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    onDataChange()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Item Code</Label>
              <Input id="code" value={formData.code} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" value={formData.name} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description || ""} onChange={handleChange} />
          </div>
          <div>
            <Label>Quantities</Label>
            <div className="space-y-2">
              {quantities.map((qty, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={qty}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    placeholder={`Quantity ${index + 1}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeQuantity(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={addQuantity}>
              <Plus className="mr-2 h-4 w-4" /> Add Quantity
            </Button>
          </div>
          <div>
            <Label htmlFor="sample_link">Sample Link (URL)</Label>
            <Select
              value={formData.sample_link || ""}
              onValueChange={(value) => setFormData({ ...formData, sample_link: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an uploaded file" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No file / Custom URL</SelectItem>
                {uploadedFiles.map((file) => (
                  <SelectItem key={file.id} value={file.url}>
                    {file.original_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="sample_link"
              className="mt-2"
              placeholder="Or paste custom URL here"
              value={formData.sample_link || ""}
              onChange={handleChange}
            />
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

// Jotform Import Dialog
function JotformImportDialog({
  open,
  onOpenChange,
  brandId,
  brandSlug,
  onDataChange,
  setMessage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandId: string
  brandSlug: string
  onDataChange: () => void
  setMessage: (message: string) => void
}) {
  const [jotformId, setJotformId] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    if (!jotformId) {
      setMessage("Please enter a JotForm Form ID.")
      return
    }
    if (
      !confirm("This will add new sections and items from the JotForm. Existing items will not be affected. Continue?")
    ) {
      return
    }

    setIsImporting(true)
    setMessage("Importing from JotForm... This may take a moment.")

    const result = await importFromJotform(brandId, brandSlug, jotformId)

    if (result.success) {
      setMessage(result.message || "Import successful!")
      onDataChange()
      onOpenChange(false)
    } else {
      setMessage(`Import failed: ${result.error}`)
    }
    setIsImporting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from JotForm</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="jotform-id">JotForm Form ID</Label>
            <Input
              id="jotform-id"
              value={jotformId}
              onChange={(e) => setJotformId(e.target.value)}
              placeholder="e.g., 241938217491867"
            />
            <p className="text-xs text-muted-foreground mt-1">You can find this ID in your JotForm URL.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Form
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
