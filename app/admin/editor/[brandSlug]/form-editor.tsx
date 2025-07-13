"use client"

import { useState, useMemo, useEffect } from "react"
import type { Brand, Section, Item } from "@/lib/types"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { arrayMove } from "@dnd-kit/sortable"
import { toast } from "sonner"
import { isEqual } from "lodash"

import EditorHeader from "./editor-header"
import SortableSection from "./SortableSection"
import { AddSectionDialog, EditSectionDialog } from "./dialogs"
import { saveFormChanges } from "./actions"

export default function FormEditor({ initialBrand }: { initialBrand: Brand }) {
  const [brand, setBrand] = useState<Brand>(initialBrand)
  const [isSaving, setIsSaving] = useState(false)
  const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([])
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([])

  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const hasChanges = useMemo(() => {
    if (deletedItemIds.length > 0 || deletedSectionIds.length > 0) return true
    return !isEqual(initialBrand, brand)
  }, [initialBrand, brand, deletedItemIds, deletedSectionIds])

  useEffect(() => {
    // When initialBrand changes (e.g. after saving), reset the local state
    setBrand(initialBrand)
    setDeletedItemIds([])
    setDeletedSectionIds([])
  }, [initialBrand])

  const handleSaveChanges = async () => {
    setIsSaving(true)
    toast.loading("Saving changes...")

    const result = await saveFormChanges(brand.id, brand.sections, deletedItemIds, deletedSectionIds)

    toast.dismiss()
    if (result.success) {
      toast.success(result.message)
      // The page will be revalidated, and new initialBrand will be passed down,
      // which will trigger the useEffect to reset state.
    } else {
      toast.error(result.message)
    }
    setIsSaving(false)
  }

  const handleAddSection = (title: string) => {
    const newSection: Section = {
      id: `new-${Date.now()}`,
      brand_id: brand.id,
      title,
      position: brand.sections.length,
      items: [],
    }
    setBrand((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }))
  }

  const handleUpdateSection = (updatedSection: Section) => {
    setBrand((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)),
    }))
    setEditingSection(null)
  }

  const handleDeleteSection = (sectionId: string) => {
    if (!sectionId.startsWith("new-")) {
      setDeletedSectionIds((prev) => [...prev, sectionId])
    }
    setBrand((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }))
    toast.info("Section marked for deletion. Save changes to confirm.")
  }

  const handleUpdateItems = (sectionId: string, updatedItems: Item[], newDeletedItemIds: string[]) => {
    if (newDeletedItemIds.length > 0) {
      setDeletedItemIds((prev) => [...prev, ...newDeletedItemIds.filter((id) => !id.startsWith("new-"))])
    }
    setBrand((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, items: updatedItems } : s)),
    }))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    if (active.id !== over.id) {
      setBrand((prev) => {
        const oldIndex = prev.sections.findIndex((s) => s.id === active.id)
        const newIndex = prev.sections.findIndex((s) => s.id === over.id)
        const newSections = arrayMove(prev.sections, oldIndex, newIndex).map((s, index) => ({ ...s, position: index }))
        return { ...prev, sections: newSections }
      })
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="container mx-auto py-8">
        <EditorHeader
          brandName={brand.name}
          onAddSection={() => setIsAddSectionOpen(true)}
          onSave={handleSaveChanges}
          isSaving={isSaving}
          hasChanges={hasChanges}
        />

        <div className="mt-8 space-y-4">
          <SortableContext items={brand.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {brand.sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onEditSection={() => setEditingSection(section)}
                onDeleteSection={handleDeleteSection}
                onUpdateItems={handleUpdateItems}
                brandId={brand.id}
              />
            ))}
          </SortableContext>
          {brand.sections.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">This form is empty.</p>
              <p className="text-gray-400 text-sm">Click "Add Section" to get started.</p>
            </div>
          )}
        </div>

        <AddSectionDialog
          isOpen={isAddSectionOpen}
          onClose={() => setIsAddSectionOpen(false)}
          onAdd={handleAddSection}
        />
        {editingSection && (
          <EditSectionDialog
            isOpen={!!editingSection}
            onClose={() => setEditingSection(null)}
            onUpdate={handleUpdateSection}
            section={editingSection}
          />
        )}
      </div>
    </DndContext>
  )
}
