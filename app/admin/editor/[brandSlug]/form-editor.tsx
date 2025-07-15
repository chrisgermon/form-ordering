"use client"

import * as React from "react"
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
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { SectionItem } from "./SectionItem"
import { AddSectionDialog, ConfirmDeleteDialog } from "./dialogs"
import { updateSectionOrder, deleteSection as deleteSectionAction } from "./actions"
import type { BrandData, Section } from "@/lib/types"

export function FormEditor({ brand }: { brand: BrandData }) {
  const router = useRouter()
  const [sections, setSections] = React.useState(brand.sections)
  const [isAddSectionOpen, setAddSectionOpen] = React.useState(false)
  const [deletingSection, setDeletingSection] = React.useState<Section | null>(null)

  React.useEffect(() => {
    setSections([...brand.sections].sort((a, b) => a.position - b.position))
  }, [brand.sections])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id)
      const newIndex = sections.findIndex((s) => s.id === over.id)
      const newSections = arrayMove(sections, oldIndex, newIndex)
      setSections(newSections)

      const sectionOrder = newSections.map((s, index) => ({
        id: s.id,
        position: index,
      }))

      const toastId = toast.loading("Updating section order...")
      const result = await updateSectionOrder(sectionOrder)
      toast.dismiss(toastId)
      if (result.success) {
        toast.success("Section order updated.")
      } else {
        toast.error(result.message || "Failed to update section order.")
        setSections(brand.sections) // Revert on failure
      }
    }
  }

  const handleDeleteSection = async () => {
    if (!deletingSection) return
    const toastId = toast.loading(`Deleting section "${deletingSection.title}"...`)
    const result = await deleteSectionAction(deletingSection.id)
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Section deleted.")
      setDeletingSection(null)
      router.refresh()
    } else {
      toast.error(result.message || "Failed to delete section.")
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Form Sections</CardTitle>
          <Button size="sm" onClick={() => setAddSectionOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {sections.map((section) => (
                  <SectionItem key={section.id} section={section} onDelete={() => setDeletingSection(section)} />
                ))}
                {sections.length === 0 && (
                  <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
                    <p>No sections yet.</p>
                    <Button variant="link" onClick={() => setAddSectionOpen(true)}>
                      Click here to add your first section.
                    </Button>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
      <AddSectionDialog
        isOpen={isAddSectionOpen}
        onClose={() => setAddSectionOpen(false)}
        brandId={brand.id}
        currentMaxPosition={sections.length}
      />
      {deletingSection && (
        <ConfirmDeleteDialog
          isOpen={!!deletingSection}
          onClose={() => setDeletingSection(null)}
          onConfirm={handleDeleteSection}
          itemName={`section "${deletingSection.title}" and all of its items`}
        />
      )}
    </>
  )
}
