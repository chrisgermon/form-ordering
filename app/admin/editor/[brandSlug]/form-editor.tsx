"use client"

import type { Brand, Section } from "@/lib/types"
import { useState, useTransition, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { toast } from "sonner"
import { saveFormChanges, deleteSectionAndItems } from "./actions"
import { SortableSection } from "./SortableSection"
import EditorHeader from "./editor-header"
import { v4 as uuidv4 } from "uuid"

export default function FormEditor({ initialBrand }: { initialBrand: Brand }) {
  const [brand, setBrand] = useState<Brand>(initialBrand)
  const [dirty, setDirty] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setBrand(initialBrand)
    setDirty(false)
  }, [initialBrand])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const updateBrandState = (newSections: Section[]) => {
    setBrand((prev) => ({ ...prev, sections: newSections }))
    setDirty(true)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === "section" && overType === "section") {
      const oldIndex = brand.sections.findIndex((s) => s.id === active.id)
      const newIndex = brand.sections.findIndex((s) => s.id === over.id)
      const reordered = arrayMove(brand.sections, oldIndex, newIndex).map((s, i) => ({ ...s, position: i }))
      updateBrandState(reordered)
    } else if (activeType === "item" && overType === "item") {
      const newSections = brand.sections.map((section) => {
        if (section.id === active.data.current?.sectionId) {
          const oldIndex = section.items.findIndex((i) => i.id === active.id)
          const newIndex = section.items.findIndex((i) => i.id === over.id)
          const reorderedItems = arrayMove(section.items, oldIndex, newIndex).map((item, i) => ({
            ...item,
            position: i,
          }))
          return { ...section, items: reorderedItems }
        }
        return section
      })
      updateBrandState(newSections)
    }
  }

  const handleAddSection = (title: string) => {
    const newSection: Section = {
      id: `new-${uuidv4()}`,
      brand_id: brand.id,
      title,
      position: brand.sections.length,
      items: [],
    }
    updateBrandState([...brand.sections, newSection])
  }

  const handleUpdateSection = (updatedSection: Section) => {
    const newSections = brand.sections.map((s) => (s.id === updatedSection.id ? updatedSection : s))
    updateBrandState(newSections)
  }

  const handleDeleteSection = (sectionId: string) => {
    if (!sectionId.toString().startsWith("new-")) {
      startTransition(async () => {
        const result = await deleteSectionAndItems(sectionId)
        if (result.success) toast.success(result.message)
        else toast.error(result.message)
      })
    }
    const newSections = brand.sections.filter((s) => s.id !== sectionId).map((s, i) => ({ ...s, position: i }))
    updateBrandState(newSections)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveFormChanges(brand.id, brand.sections)
      if (result.success) {
        toast.success(result.message)
        setDirty(false)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      <EditorHeader
        brandName={brand.name}
        onAddSection={handleAddSection}
        onSave={handleSave}
        isSaving={isPending}
        hasChanges={dirty}
      />
      <div className="container mx-auto py-10">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={brand.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {brand.sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onUpdate={handleUpdateSection}
                  onDelete={handleDeleteSection}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {brand.sections.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium">This form is empty</h3>
            <p className="text-muted-foreground mt-1">Click "Add Section" to get started.</p>
          </div>
        )}
      </div>
    </>
  )
}
