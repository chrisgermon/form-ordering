"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

import { EditorHeader } from "./editor-header"
import { SortableSection } from "./SortableSection"
import { UnsavedChangesDialog } from "./dialogs"
import { saveForm } from "./actions"
import type { Brand, Section, Item } from "@/lib/types"

interface FormEditorProps {
  brand: Brand & { sections: Section[] }
}

export default function FormEditor({ brand }: FormEditorProps) {
  const [sections, setSections] = useState<Section[]>(JSON.parse(JSON.stringify(brand.sections || [])))
  const [initialSections, setInitialSections] = useState<Section[]>(JSON.parse(JSON.stringify(brand.sections || [])))
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [nextPath, setNextPath] = useState("")
  const router = useRouter()

  useEffect(() => {
    setHasChanges(JSON.stringify(sections) !== JSON.stringify(initialSections))
  }, [sections, initialSections])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    setSections((prevSections) => {
      const activeIsSection = prevSections.some((s) => s.id === activeId)
      const overIsSection = prevSections.some((s) => s.id === overId)

      // Moving a section
      if (activeIsSection && overIsSection) {
        const oldIndex = prevSections.findIndex((s) => s.id === activeId)
        const newIndex = prevSections.findIndex((s) => s.id === overId)
        return arrayMove(prevSections, oldIndex, newIndex)
      }

      // Moving an item
      const activeSectionIndex = prevSections.findIndex((s) => s.items.some((i) => i.id === activeId))
      const overSectionIndex = prevSections.findIndex((s) => s.items.some((i) => i.id === overId))
      const overIsJustSection = prevSections.some((s) => s.id === overId && !s.items.some((i) => i.id === overId))

      if (activeSectionIndex === -1) return prevSections

      const newSections = [...prevSections]
      const activeSection = newSections[activeSectionIndex]
      const activeItemIndex = activeSection.items.findIndex((i) => i.id === activeId)
      const [movedItem] = activeSection.items.splice(activeItemIndex, 1)

      if (overIsJustSection) {
        // Dropping item into an empty section
        const targetSectionIndex = newSections.findIndex((s) => s.id === overId)
        newSections[targetSectionIndex].items.push(movedItem)
      } else if (overSectionIndex !== -1) {
        // Dropping item within or between sections
        const overSection = newSections[overSectionIndex]
        const overItemIndex = overSection.items.findIndex((i) => i.id === overId)
        overSection.items.splice(overItemIndex, 0, movedItem)
      }

      return newSections
    })
  }

  const handleAddSection = () => {
    const newSection: Section = {
      id: uuidv4(),
      title: "New Section",
      sort_order: sections.length,
      items: [],
      brand_id: brand.id,
    }
    setSections([...sections, newSection])
  }

  const handleSectionChange = (id: string, value: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, title: value } : s)))
  }

  const handleSectionRemove = (id: string) => {
    setSections(sections.filter((s) => s.id !== id))
  }

  const handleItemAdd = (sectionId: string) => {
    const newItem: Item = {
      id: uuidv4(),
      name: "New Item",
      item_code: "",
      sort_order: sections.find((s) => s.id === sectionId)?.items.length || 0,
      section_id: sectionId,
      field_type: "number",
    }
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, items: [...s.items, newItem] } : s)))
  }

  const handleItemChange = (itemId: string, field: keyof Item, value: string | number) => {
    setSections(
      sections.map((s) => ({
        ...s,
        items: s.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)),
      })),
    )
  }

  const handleItemRemove = (itemId: string) => {
    setSections(
      sections.map((s) => ({
        ...s,
        items: s.items.filter((i) => i.id !== itemId),
      })),
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Update sort orders before saving
    const sectionsToSave = sections.map((section, sectionIndex) => ({
      ...section,
      sort_order: sectionIndex,
      items: section.items.map((item, itemIndex) => ({
        ...item,
        sort_order: itemIndex,
      })),
    }))

    const result = await saveForm(brand.id, sectionsToSave)
    if (result.success) {
      toast.success(result.message)
      setInitialSections(JSON.parse(JSON.stringify(sectionsToSave)))
      setSections(sectionsToSave)
      setHasChanges(false)
    } else {
      toast.error(result.message)
    }
    setIsSaving(false)
  }

  const handleNavigate = (path: string) => {
    if (hasChanges) {
      setNextPath(path)
      setShowUnsavedDialog(true)
    } else {
      router.push(path)
    }
  }

  const handleConfirmLeave = () => {
    setShowUnsavedDialog(false)
    router.push(nextPath)
  }

  return (
    <>
      <EditorHeader
        brandName={brand.name}
        onSave={handleSave}
        onAddSection={handleAddSection}
        isSaving={isSaving}
        hasChanges={hasChanges}
        onNavigate={handleNavigate}
      />
      <main className="container mx-auto p-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onSectionChange={handleSectionChange}
                onSectionRemove={handleSectionRemove}
                onItemAdd={handleItemAdd}
                onItemChange={handleItemChange}
                onItemRemove={handleItemRemove}
              />
            ))}
          </SortableContext>
        </DndContext>
      </main>
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onConfirm={handleConfirmLeave}
      />
    </>
  )
}
