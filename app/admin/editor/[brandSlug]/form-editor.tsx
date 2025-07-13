"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { toast } from "sonner"
import arrayMove from "array-move"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import { GripVertical, Plus, Trash2, Edit, Upload } from "lucide-react"

import { updateSectionOrder, updateItemOrder } from "./actions"
import { clearFormForBrand, importForm } from "../../actions"
import type { Brand, ProductSection, ProductItem, UploadedFile } from "./types"
import { FileManager } from "@/app/admin/FileManager"

const fieldTypes = [
  { value: "checkbox_group", label: "Checkbox Group", icon: null },
  { value: "select", label: "Dropdown", icon: null },
  { value: "text", label: "Text Input", icon: null },
  { value: "textarea", label: "Text Area", icon: null },
  { value: "date", label: "Date Picker", icon: null },
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
            <Plus className="mr-2 h-4 w-4" />
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

  const [sections, setSections] = useState<ProductSection[]>(initialBrandData.product_sections)
  const [currentItem, setCurrentItem] = useState<ProductItem | null>(null)
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)

  useEffect(() => {
    setBrandData(initialBrandData)
    setSections(initialBrandData.product_sections)
  }, [initialBrandData])

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return

    const sourceType = source.droppableId.startsWith("section-") ? "item" : "section"
    const destinationType = destination.droppableId.startsWith("section-") ? "item" : "section"

    if (sourceType === "section" && destinationType === "section") {
      const oldIndex = source.index
      const newIndex = destination.index
      const reorderedSections = arrayMove(sections, oldIndex, newIndex)
      setSections(reorderedSections)

      const promise = updateSectionOrder(
        initialBrandData.slug,
        reorderedSections.map((s) => s.id),
      )
      toast.promise(promise, {
        loading: "Saving section order...",
        success: "Section order saved!",
        error: "Failed to save section order.",
      })
    }

    if (sourceType === "item" && destinationType === "item") {
      const sectionId = source.droppableId.replace("section-", "")
      const sectionIndex = sections.findIndex((s) => s.id === sectionId)
      if (sectionIndex === -1) return

      const section = sections[sectionIndex]
      const oldIndex = source.index
      const newIndex = destination.index
      const reorderedItems = arrayMove(section.product_items, oldIndex, newIndex)
      const newSections = [...sections]
      newSections[sectionIndex] = { ...section, product_items: reorderedItems }
      setSections(newSections)

      const promise = updateItemOrder(
        initialBrandData.slug,
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
        brand_id: initialBrandData.id,
        title: newSectionName,
        position: sections.length,
      }),
    })

    if (response.ok) {
      const newSection = await response.json()
      setSections((prevSections) => [...prevSections, newSection])
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
    setCurrentItem(item || { name: "", field_type: "text", is_required: false, placeholder: "" })
    setIsItemDialogOpen(true)
  }

  const handleSaveItem = async () => {
    if (!currentItem || !currentSectionId) return

    const toastId = toast.loading("Saving item...")
    const isNewItem = !currentItem.id

    const response = await fetch("/api/admin/items", {
      method: isNewItem ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...currentItem, section_id: currentSectionId }),
    })

    if (response.ok) {
      const savedItem = await response.json()
      setSections((prevSections) => {
        return prevSections.map((section) => {
          if (section.id === currentSectionId) {
            const newItems = isNewItem
              ? [...(section.product_items || []), savedItem]
              : (section.product_items || []).map((item) => (item.id === savedItem.id ? savedItem : item))
            return { ...section, product_items: newItems }
          }
          return section
        })
      })
      toast.success("Item saved successfully!", { id: toastId })
      setIsItemDialogOpen(false)
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
            return { ...section, product_items: (section.product_items || []).filter((item) => item.id !== itemId) }
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

    const promise = clearFormForBrand(initialBrandData.id, initialBrandData.slug)

    toast.promise(promise, {
      loading: "Clearing form...",
      success: (result) => {
        if (result.success) {
          router.refresh()
          return result.message
        } else {
          throw new Error(result.message)
        }
      },
      error: (err) => err.message || "Failed to clear form.",
    })
  }

  const handleSectionCreated = (newSection: ProductSection) => {
    setSections((prev) => [...prev, newSection])
  }

  const handleSectionUpdated = (updatedSection: ProductSection) => {
    setSections((prev) => prev.map((s) => (s.id === updatedSection.id ? updatedSection : s)))
  }

  const handleItemCreated = (newItem: ProductItem) => {
    setSections((prev) => {
      return prev.map((section) => {
        if (section.id === newItem.section_id) {
          return {
            ...section,
            product_items: [...(section.product_items || []), newItem],
          }
        }
        return section
      })
    })
  }

  const handleItemUpdated = (updatedItem: ProductItem) => {
    setSections((prev) => {
      return prev.map((section) => {
        if (section.id === updatedItem.section_id) {
          return {
            ...section,
            product_items: (section.product_items || []).map((item) =>
              item.id === updatedItem.id ? updatedItem : item,
            ),
          }
        }
        return section
      })
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button onClick={() => router.push("/admin")} variant="outline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
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
              <Link href={`/forms/${initialBrandData.slug}`} target="_blank">
                Preview Form
              </Link>
            </Button>
          </div>
        </div>

        <Card className="mb-6 bg-white shadow-sm">
          <CardHeader>
            <p className="text-sm text-gray-500">Form Editor</p>
            <CardTitle className="text-3xl">{initialBrandData.name}</CardTitle>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          <div className="space-y-6">
            <Toolbox onAddSectionClick={handleAddSection} />
            <FileManager brandId={initialBrandData.id} />
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm min-h-[400px]">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="all-sections" direction="vertical" type="SECTION">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={String(section.id)} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <Card>
                              <CardHeader className="flex flex-row items-center justify-between p-4">
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <Input
                                    defaultValue={section.title}
                                    onBlur={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                                    className="text-lg font-semibold border-none focus:ring-0 shadow-none"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => openItemDialog(section.id)}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Item
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSection(section.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <Droppable droppableId={`section-${section.id}`} type="ITEM">
                                  {(provided) => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className="min-h-[20px] space-y-2"
                                    >
                                      {(section.product_items || []).map((item, itemIndex) => (
                                        <Draggable key={item.id} draggableId={String(item.id)} index={itemIndex}>
                                          {(provided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className="flex items-center gap-2 p-2 border rounded-md bg-background"
                                            >
                                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                                              <div className="flex-grow">
                                                {item.name} ({item.field_type})
                                              </div>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openItemDialog(section.id, item)}
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteItem(section.id, item.id)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>
      <ImportFormDialog
        open={isImportFormDialogOpen}
        onOpenChange={setIsImportFormDialogOpen}
        brandId={initialBrandData.id}
        brandSlug={initialBrandData.slug}
        onImport={() => router.refresh()}
      />
      {currentItem && (
        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentItem.id ? "Edit" : "Add"} Item</DialogTitle>
              <DialogDescription>Configure the details for this form item.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Label
                </Label>
                <Input
                  id="name"
                  value={currentItem.name || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="field_type" className="text-right">
                  Type
                </Label>
                <Select
                  value={currentItem.field_type}
                  onValueChange={(value) =>
                    setCurrentItem({ ...currentItem, field_type: value as ProductItem["field_type"] })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkbox_group">Checkbox Group</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="text">Text Input</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="date">Date Picker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="placeholder" className="text-right">
                  Placeholder
                </Label>
                <Input
                  id="placeholder"
                  value={currentItem.placeholder || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, placeholder: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveItem}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
