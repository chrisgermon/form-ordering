"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { useFormContext } from "react-hook-form"

import type { BrandData, ProductSection, ProductItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { SortableSection } from "./sortable-section"

interface SectionsAndItemsProps {
  brand: BrandData
}

export function SectionsAndItems({ brand }: SectionsAndItemsProps) {
  const [sections, setSections] = useState<ProductSection[]>(brand.product_sections || [])
  const { setValue } = useFormContext<BrandData>()

  useEffect(() => {
    // Sync local state with the parent form via a hidden field
    setValue("product_sections", sections, { shouldDirty: true })
  }, [sections, setValue])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === "section" && overType === "section") {
      setSections((prevSections) => {
        const oldIndex = prevSections.findIndex((s) => s.id === active.id)
        const newIndex = prevSections.findIndex((s) => s.id === over.id)
        return arrayMove(prevSections, oldIndex, newIndex)
      })
    }

    if (activeType === "item" && overType === "item") {
      const sectionId = active.data.current?.sectionId
      setSections((prevSections) =>
        prevSections.map((section) => {
          if (section.id !== sectionId) return section
          const oldIndex = section.product_items.findIndex((i) => i.id === active.id)
          const newIndex = section.product_items.findIndex((i) => i.id === over.id)
          const reorderedItems = arrayMove(section.product_items, oldIndex, newIndex)
          return { ...section, product_items: reorderedItems }
        }),
      )
    }
  }

  const handleAddSection = () => {
    const newSection: ProductSection = {
      id: `new-section-${Date.now()}`,
      title: "New Section",
      brand_id: brand.id,
      product_items: [],
      sort_order: sections.length,
    }
    setSections((prev) => [...prev, newSection])
  }

  const updateSection = (sectionId: string, newTitle: string) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, title: newTitle } : s)))
  }

  const deleteSection = (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section and all its items?")) return
    setSections((prev) => prev.filter((s) => s.id !== sectionId))
  }

  const addItemToSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s
        const newItem: ProductItem = {
          id: `new-item-${Date.now()}`,
          name: "New Item",
          code: "",
          description: "",
          options: [],
          sample_link: "",
          section_id: sectionId,
          brand_id: brand.id,
          sort_order: s.product_items.length,
          field_type: "text",
          is_required: false,
          placeholder: "",
        }
        return { ...s, product_items: [...s.product_items, newItem] }
      }),
    )
  }

  const updateItemInSection = (sectionId: string, itemId: string, updatedItem: ProductItem) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s
        return { ...s, product_items: s.product_items.map((i) => (i.id === itemId ? updatedItem : i)) }
      }),
    )
  }

  const deleteItemInSection = (sectionId: string, itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s
        return { ...s, product_items: s.product_items.filter((i) => i.id !== itemId) }
      }),
    )
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onUpdateSection={updateSection}
                onDeleteSection={deleteSection}
                onAddItem={addItemToSection}
                onUpdateItem={updateItemInSection}
                onDeleteItem={deleteItemInSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button variant="outline" className="mt-6 bg-transparent" onClick={handleAddSection}>
        <Plus className="mr-2 h-4 w-4" />
        Add Section
      </Button>
    </div>
  )
}
