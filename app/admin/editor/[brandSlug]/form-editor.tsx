"use client"

import type { Brand, Section } from "@/lib/types"
import { useState, useTransition } from "react"
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
import { toast } from "sonner"
import { updateSectionOrder } from "./actions"
import EditorHeader from "./editor-header"
import SortableSection from "./SortableSection"

export default function FormEditor({ initialBrand }: { initialBrand: Brand }) {
  const [brand, setBrand] = useState(initialBrand)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = brand.sections.findIndex((s) => s.id === active.id)
    const newIndex = brand.sections.findIndex((s) => s.id === over.id)

    const reorderedSections = [...brand.sections]
    const [movedSection] = reorderedSections.splice(oldIndex, 1)
    reorderedSections.splice(newIndex, 0, movedSection)

    setBrand({ ...brand, sections: reorderedSections })

    startTransition(async () => {
      const sectionOrder = reorderedSections.map((s, index) => ({ id: s.id, order: index }))
      const result = await updateSectionOrder(brand.id, sectionOrder)
      if (result.success) {
        toast.success("Section order saved.")
      } else {
        toast.error(result.message)
        // Revert state on failure
        setBrand(initialBrand)
      }
    })
  }

  const onSectionUpdate = (updatedSection: Section) => {
    setBrand((prevBrand) => ({
      ...prevBrand,
      sections: prevBrand.sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)),
    }))
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <EditorHeader brand={brand} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={brand.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {brand.sections.map((section) => (
              <SortableSection key={section.id} section={section} onSectionUpdate={onSectionUpdate} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {brand.sections.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg mt-4">
          <h3 className="text-lg font-medium text-gray-500">This form is empty.</h3>
          <p className="text-sm text-gray-400">Click "Add Section" to get started.</p>
        </div>
      )}
    </div>
  )
}
