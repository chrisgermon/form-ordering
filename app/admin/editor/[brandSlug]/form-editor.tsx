"use client"

import { useState, useEffect } from "react"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import type { BrandWithSections } from "@/lib/types"
import { reorderSection, reorderItem } from "./actions"
import EditorHeader from "./editor-header"
import { SortableSection } from "./SortableSection"

interface FormEditorProps {
  brand: BrandWithSections
}

export default function FormEditor({ brand: initialBrandData }: FormEditorProps) {
  const [brand, setBrand] = useState(initialBrandData)
  const router = useRouter()

  useEffect(() => {
    setBrand(initialBrandData)
  }, [initialBrandData])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === "section" && overType === "section") {
      setBrand((prev) => {
        const oldIndex = prev.sections.findIndex((s) => s.id === active.id)
        const newIndex = prev.sections.findIndex((s) => s.id === over.id)
        const reorderedSections = arrayMove(prev.sections, oldIndex, newIndex)

        toast.promise(reorderSection({ sectionId: active.id as string, newOrder: newIndex }), {
          loading: "Saving new section order...",
          success: (res) => {
            if (res.success) {
              router.refresh()
              return "Section order saved."
            }
            throw new Error(res.message)
          },
          error: (err) => `Error: ${err.message}`,
        })

        return { ...prev, sections: reorderedSections }
      })
    } else if (activeType === "item" && overType === "item") {
      const sectionId = active.data.current?.sectionId
      if (!sectionId) return

      setBrand((prev) => {
        const sectionIndex = prev.sections.findIndex((s) => s.id === sectionId)
        if (sectionIndex === -1) return prev

        const section = prev.sections[sectionIndex]
        const oldIndex = section.items.findIndex((i) => i.id === active.id)
        const newIndex = section.items.findIndex((i) => i.id === over.id)

        const reorderedItems = arrayMove(section.items, oldIndex, newIndex)
        const updatedSections = [...prev.sections]
        updatedSections[sectionIndex] = { ...section, items: reorderedItems }

        toast.promise(reorderItem({ itemId: active.id as string, newOrder: newIndex, sectionId }), {
          loading: "Saving new item order...",
          success: (res) => {
            if (res.success) {
              router.refresh()
              return "Item order saved."
            }
            throw new Error(res.message)
          },
          error: (err) => `Error: ${err.message}`,
        })

        return { ...prev, sections: updatedSections }
      })
    }
  }

  return (
    <div className="p-4 md:p-6">
      <EditorHeader brand={brand} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={brand.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {brand.sections.map((section) => (
              <SortableSection key={section.id} section={section} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {brand.sections.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg mt-6">
          <h3 className="text-lg font-medium text-muted-foreground">This form is empty.</h3>
          <p className="text-sm text-muted-foreground">Click "Add Section" to get started.</p>
        </div>
      )}
    </div>
  )
}
