"use client"

import { useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Plus, Trash2, GripVertical } from "lucide-react"
import type { BrandWithSections, Section, Item } from "@/lib/types"

interface FormEditorProps {
  brand: BrandWithSections
}

const ITEM_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File Upload" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
]

export default function FormEditor({ brand }: FormEditorProps) {
  const [sections, setSections] = useState<Section[]>(brand.sections || [])
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false)
  const [isAddingItemOpen, setIsAddingItemOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [currentSectionId, setCurrentSectionId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setSections((sections) => {
        const oldIndex = sections.findIndex((section) => section.id === active.id)
        const newIndex = sections.findIndex((section) => section.id === over.id)

        return arrayMove(sections, oldIndex, newIndex)
      })
    }
  }

  const addSection = async (formData: FormData) => {
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    try {
      const response = await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brand.id,
          title,
          description,
          order: sections.length + 1,
        }),
      })

      if (!response.ok) throw new Error("Failed to add section")

      const newSection = await response.json()
      setSections([...sections, { ...newSection, items: [] }])
      setIsAddingSectionOpen(false)

      toast({
        title: "Section Added",
        description: "New section has been added successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add section.",
        variant: "destructive",
      })
    }
  }

  const addItem = async (formData: FormData) => {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const type = formData.get("type") as string
    const required = formData.get("required") === "on"
    const options = formData.get("options") as string

    try {
      const response = await fetch("/api/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_id: currentSectionId,
          title,
          description,
          type,
          required,
          options: options ? options.split("\n").filter(Boolean) : undefined,
          order: sections.find((s) => s.id === currentSectionId)?.items.length || 0 + 1,
        }),
      })

      if (!response.ok) throw new Error("Failed to add item")

      const newItem = await response.json()
      setSections(
        sections.map((section) =>
          section.id === currentSectionId ? { ...section, items: [...section.items, newItem] } : section,
        ),
      )
      setIsAddingItemOpen(false)

      toast({
        title: "Item Added",
        description: "New form item has been added successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item.",
        variant: "destructive",
      })
    }
  }

  const deleteSection = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/admin/sections`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sectionId }),
      })

      if (!response.ok) throw new Error("Failed to delete section")

      setSections(sections.filter((s) => s.id !== sectionId))

      toast({
        title: "Section Deleted",
        description: "Section has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete section.",
        variant: "destructive",
      })
    }
  }

  const deleteItem = async (itemId: string, sectionId: string) => {
    try {
      const response = await fetch(`/api/admin/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      })

      if (!response.ok) throw new Error("Failed to delete item")

      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
            : section,
        ),
      )

      toast({
        title: "Item Deleted",
        description: "Form item has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      })
    }
  }

  const saveForm = async () => {
    setIsSaving(true)
    try {
      // Update section orders
      const updatePromises = sections.map((section, index) =>
        fetch("/api/admin/sections", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: section.id,
            order: index + 1,
          }),
        }),
      )

      await Promise.all(updatePromises)

      toast({
        title: "Form Saved",
        description: "Form structure has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save form.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Form Editor</h2>
          <p className="text-muted-foreground">Design your order form by adding sections and items</p>
        </div>
        <div className="space-x-2">
          <Dialog open={isAddingSectionOpen} onOpenChange={setIsAddingSectionOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form action={addSection}>
                <DialogHeader>
                  <DialogTitle>Add New Section</DialogTitle>
                  <DialogDescription>Create a new section to group related form fields.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="title">Section Title</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea id="description" name="description" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Section</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button onClick={saveForm} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Form"}
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      {section.description && <CardDescription>{section.description}</CardDescription>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentSectionId(section.id)
                            setIsAddingItemOpen(true)
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form action={addItem}>
                          <DialogHeader>
                            <DialogTitle>Add Form Item</DialogTitle>
                            <DialogDescription>Add a new form field to this section.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="item-title">Field Title</Label>
                              <Input id="item-title" name="title" required />
                            </div>
                            <div>
                              <Label htmlFor="item-description">Description (optional)</Label>
                              <Input id="item-description" name="description" />
                            </div>
                            <div>
                              <Label htmlFor="item-type">Field Type</Label>
                              <Select name="type" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ITEM_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="options">Options (for select/radio, one per line)</Label>
                              <Textarea id="options" name="options" placeholder="Option 1&#10;Option 2&#10;Option 3" />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="required" name="required" />
                              <Label htmlFor="required">Required field</Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Add Item</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => deleteSection(section.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{item.type}</Badge>
                          <span className="font-medium">{item.title}</span>
                          {item.required && <Badge variant="destructive">Required</Badge>}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id, section.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {section.items.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No items in this section. Click "Add Item" to get started.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No sections created yet. Start building your form by adding a section.
            </p>
            <Button onClick={() => setIsAddingSectionOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Section
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
