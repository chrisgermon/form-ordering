"use client"

import { useState, useEffect, useTransition } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { toast } from "sonner"
import type { Brand, Section, Item } from "@/lib/types"
import { saveFormChanges } from "./actions"
import { EditorHeader } from "./editor-header"
import { SortableSection } from "./SortableSection"
import {
  AddSectionDialog,
  EditSectionDialog,
  ConfirmDeleteDialog,
  AddItemDialog,
  EditItemDialog,
  ImportFormDialog,
} from "./dialogs"
import { produce } from "immer"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export default function FormEditor({ initialBrand }: { initialBrand: Brand }) {
  const [brand, setBrand] = useState<Brand>(initialBrand)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, startSaving] = useTransition()

  // Dialog states
  const [isAddSectionOpen, setAddSectionOpen] = useState(false)
  const [isImportOpen, setImportOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [deletingSection, setDeletingSection] = useState<Section | null>(null)
  const [addingItemToSection, setAddingItemToSection] = useState<Section | null>(null)
  const [editingItem, setEditingItem] = useState<{ sectionId: string; item: Item } | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ sectionId: string; item: Item } | null>(null)
  const [deletingForm, setDeletingForm] = useState(false)

  // Track deleted IDs for the save action
  const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([])
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([])

  useEffect(() => {
    setBrand(initialBrand)
    setIsDirty(false)
  }, [initialBrand])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleStateChange = (updater: (draft: Brand) => void) => {
    setBrand(produce(brand, updater))
    setIsDirty(true)
  }

  const handleAddSection = (title: string) => {
    handleStateChange((draft) => {
      draft.sections.push({
        id: `new-${Date.now()}`,
        title,
        brand_id: brand.id,
        position: draft.sections.length,
        items: [],
      })
    })
    setAddSectionOpen(false)
  }

  const handleUpdateSection = (updatedSection: Section) => {
    handleStateChange((draft) => {
      const index = draft.sections.findIndex((s) => s.id === updatedSection.id)
      if (index !== -1) draft.sections[index] = updatedSection
    })
    setEditingSection(null)
  }

  const handleDeleteSection = () => {
    if (!deletingSection) return
    handleStateChange((draft) => {
      if (!deletingSection.id.toString().startsWith("new-")) {
        setDeletedSectionIds((prev) => [...prev, deletingSection.id.toString()])
      }
      draft.sections = draft.sections.filter((s) => s.id !== deletingSection.id)
    })
    setDeletingSection(null)
  }

  const handleAddItem = (newItemData: Omit<Item, "id" | "position" | "brand_id" | "section_id">) => {
    if (!addingItemToSection) return
    const sectionId = addingItemToSection.id
    handleStateChange((draft) => {
      const section = draft.sections.find((s) => s.id === sectionId)
      if (section) {
        section.items.push({
          ...newItemData,
          id: `new-${Date.now()}`,
          brand_id: brand.id,
          section_id: sectionId,
          position: section.items.length,
        })
      }
    })
    setAddingItemToSection(null)
  }

  const handleUpdateItem = (updatedItem: Item) => {
    if (!editingItem) return
    const { sectionId } = editingItem
    handleStateChange((draft) => {
      const section = draft.sections.find((s) => s.id === sectionId)
      if (section) {
        const itemIndex = section.items.findIndex((i) => i.id === updatedItem.id)
        if (itemIndex !== -1) section.items[itemIndex] = updatedItem
      }
    })
    setEditingItem(null)
  }

  const handleDeleteItem = () => {
    if (!deletingItem) return
    const { sectionId, item } = deletingItem
    handleStateChange((draft) => {
      if (!item.id.toString().startsWith("new-")) {
        setDeletedItemIds((prev) => [...prev, item.id.toString()])
      }
      const section = draft.sections.find((s) => s.id === sectionId)
      if (section) {
        section.items = section.items.filter((i) => i.id !== item.id)
      }
    })
    setDeletingItem(null)
  }

  const handleClearForm = () => {
    handleStateChange((draft) => {
      const toDelete = draft.sections.filter((s) => !s.id.toString().startsWith("new-"))
      setDeletedSectionIds((prev) => [...prev, ...toDelete.map((s) => s.id.toString())])
      draft.sections = []
    })
    setDeletingForm(false)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!over) return

    if (active.id !== over.id) {
      if (active.data.current.type === "section") {
        handleStateChange((draft) => {
          const oldIndex = draft.sections.findIndex((s) => s.id === active.id)
          const newIndex = draft.sections.findIndex((s) => s.id === over.id)
          draft.sections = arrayMove(draft.sections, oldIndex, newIndex)
          draft.sections.forEach((s, i) => (s.position = i))
        })
      } else if (active.data.current.type === "item") {
        const sectionId = active.data.current.sectionId
        handleStateChange((draft) => {
          const section = draft.sections.find((s) => s.id === sectionId)
          if (section) {
            const oldIndex = section.items.findIndex((i) => i.id === active.id)
            const newIndex = section.items.findIndex((i) => i.id === over.id)
            section.items = arrayMove(section.items, oldIndex, newIndex)
            section.items.forEach((item, i) => (item.position = i))
          }
        })
      }
    }
  }

  const handleSave = () => {
    startSaving(async () => {
      toast.loading("Saving form changes...")
      const result = await saveFormChanges(brand.id, brand.sections, deletedItemIds, deletedSectionIds)
      toast.dismiss()
      if (result.success) {
        toast.success(result.message)
        setIsDirty(false)
        setDeletedItemIds([])
        setDeletedSectionIds([])
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetector={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        <EditorHeader
          brand={brand}
          onAddSection={() => setAddSectionOpen(true)}
          onSave={handleSave}
          onClear={() => setDeletingForm(true)}
          onImport={() => setImportOpen(true)}
          isDirty={isDirty}
          isSaving={isSaving}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <SortableContext items={brand.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {brand.sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onEditSection={() => setEditingSection(section)}
                  onDeleteSection={() => setDeletingSection(section)}
                  onAddItem={() => setAddingItemToSection(section)}
                  onEditItem={(item) => setEditingItem({ sectionId: section.id, item })}
                  onDeleteItem={(item) => setDeletingItem({ sectionId: section.id, item })}
                />
              ))}
            </SortableContext>
            {brand.sections.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">This form is empty.</p>
                <Button className="mt-4" onClick={() => setAddSectionOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add your first section
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <AddSectionDialog isOpen={isAddSectionOpen} onClose={() => setAddSectionOpen(false)} onAdd={handleAddSection} />
      <ImportFormDialog isOpen={isImportOpen} onClose={() => setImportOpen(false)} brandId={brand.id} />
      {editingSection && (
        <EditSectionDialog
          isOpen={!!editingSection}
          onClose={() => setEditingSection(null)}
          section={editingSection}
          onUpdate={handleUpdateSection}
        />
      )}
      {deletingSection && (
        <ConfirmDeleteDialog
          isOpen={!!deletingSection}
          onClose={() => setDeletingSection(null)}
          onConfirm={handleDeleteSection}
          itemName={`section "${deletingSection.title}"`}
        />
      )}
      {addingItemToSection && (
        <AddItemDialog
          isOpen={!!addingItemToSection}
          onClose={() => setAddingItemToSection(null)}
          onAdd={handleAddItem}
        />
      )}
      {editingItem && (
        <EditItemDialog
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          item={editingItem.item}
          onUpdate={handleUpdateItem}
        />
      )}
      {deletingItem && (
        <ConfirmDeleteDialog
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteItem}
          itemName={`item "${deletingItem.item.name}"`}
        />
      )}
      {deletingForm && (
        <ConfirmDeleteDialog
          isOpen={deletingForm}
          onClose={() => setDeletingForm(false)}
          onConfirm={handleClearForm}
          itemName="entire form"
        />
      )}
    </DndContext>
  )
}
