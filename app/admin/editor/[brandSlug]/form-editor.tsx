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
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { toast } from "sonner"
import { updateSectionOrder, addSection, clearForm } from "./actions"
import { SortableSection } from "./SortableSection"
import EditorHeader from "./editor-header"

export default function FormEditor({ initialBrand }: { initialBrand: Brand }) {
  const [brand, setBrand] = useState<Brand>(initialBrand)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    if (active.data.current?.type !== "section" || over.data.current?.type !== "section") {
      return
    }

    setBrand((prevBrand) => {
      const oldIndex = prevBrand.sections.findIndex((s) => s.id === active.id)
      const newIndex = prevBrand.sections.findIndex((s) => s.id === over.id)
      const reorderedSections = arrayMove(prevBrand.sections, oldIndex, newIndex)

      startTransition(async () => {
        const sectionPositions = reorderedSections.map((section, index) => ({ id: section.id, position: index }))
        const result = await updateSectionOrder(brand.id, sectionPositions)
        if (result.success) {
          toast.success(result.message)
        } else {
          toast.error(result.message)
          setBrand(prevBrand)
        }
      })

      return { ...prevBrand, sections: reorderedSections }
    })
  }

  const handleSectionUpdate = (updatedSection: Section) => {
    setBrand((prevBrand) => {
      const newSections = prevBrand.sections.map((s) => (s.id === updatedSection.id ? updatedSection : s))
      return { ...prevBrand, sections: newSections }
    })
  }

  return (
    <>
      <EditorHeader
        brandName={brand.name}
        brandId={brand.id}
        onAddSection={(title) => addSection(brand.id, title)}
        onClearForm={(id) => clearForm(id)}
      />
      <div className="container mx-auto py-10">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={brand.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {brand.sections.map((section) => (
                <SortableSection key={section.id} section={section} onSectionUpdate={handleSectionUpdate} />
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
