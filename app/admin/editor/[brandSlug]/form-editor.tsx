"use client"

import { useState, useMemo, startTransition } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { toast } from "sonner"
import { Plus, FileUp, Trash, RefreshCw } from "lucide-react"
import type { BrandWithSections, FormSection, FormItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { reorderSections, reorderItems, createSection, deleteSection, clearForm, deleteItem } from "./actions"
import { SortableSection } from "./SortableSection"
import { SectionItem } from "./SectionItem"
import { useRouter } from "next/navigation"

interface FormEditorProps {
  brand: BrandWithSections
}

export function FormEditor({ brand: initialBrand }: FormEditorProps) {
  const [brand, setBrand] = useState(initialBrand)
  const [activeId, setActiveId] = useState<number | string | null>(null)
  const router = useRouter()

  const [isAddSectionDialogOpen, setAddSectionDialogOpen] = useState(false)
  const [newSectionName, setNewSectionName] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const sections = brand.sections
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])

  const activeElement = useMemo(() => {
    if (!activeId) return null
    const isSection = sectionIds.includes(activeId as number)
    if (isSection) {
      return { type: "section", data: sections.find((s) => s.id === activeId) }
    }
    const item = sections.flatMap((s) => s.items).find((i) => i.id === activeId)
    if (item) {
      return { type: "item", data: item }
    }
    return null
  }, [activeId, sections, sectionIds])

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
      toast.success("Data refreshed.")
    })
  }

  const handleAddSection = async () => {
    if (!newSectionName.trim()) {
      toast.error("Section name cannot be empty.")
      return
    }
    const promise = createSection(brand.id, newSectionName.trim()).then((res) => {
      if (res.success) {
        setAddSectionDialogOpen(false)
        setNewSectionName("")
        // Revalidation will refresh the data
      }
      return res
    })

    toast.promise(promise, {
      loading: "Adding section...",
      success: (res) => res.message,
      error: (err) => err.message,
    })
  }

  const handleDeleteSection = (sectionId: number) => {
    const promise = deleteSection(sectionId)
    toast.promise(promise, {
      loading: "Deleting section...",
      success: (res) => res.message,
      error: (err) => err.message,
    })
  }

  const handleDeleteItem = (itemId: number) => {
    const promise = deleteItem(itemId)
    toast.promise(promise, {
      loading: "Deleting item...",
      success: (res) => res.message,
      error: (err) => err.message,
    })
  }

  const handleClearForm = () => {
    const promise = clearForm(brand.id)
    toast.promise(promise, {
      loading: "Clearing form...",
      success: (res) => res.message,
      error: (err) => err.message,
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeIdNum = active.id as number
    const overIdNum = over.id as number

    const isSectionDrag = sectionIds.includes(activeIdNum)

    if (isSectionDrag) {
      const oldIndex = sections.findIndex((s) => s.id === activeIdNum)
      const newIndex = sections.findIndex((s) => s.id === overIdNum)
      const newSections = arrayMove(sections, oldIndex, newIndex)
      setBrand((prev) => ({ ...prev, sections: newSections }))

      const sectionOrder = newSections.map((s, index) => ({ id: s.id, display_order: index }))
      const result = await reorderSections(brand.id, sectionOrder)
      if (!result.success) {
        toast.error(result.message)
        setBrand((prev) => ({ ...prev, sections: sections })) // Revert
      } else {
        toast.success(result.message)
      }
    } else {
      const activeSection = sections.find((s) => s.items.some((i) => i.id === activeIdNum))
      const overSection = sections.find((s) => s.items.some((i) => i.id === overIdNum) || s.id === overIdNum)

      if (activeSection && overSection && activeSection.id === overSection.id) {
        const oldIndex = activeSection.items.findIndex((i) => i.id === activeIdNum)
        const newIndex = overSection.items.findIndex((i) => i.id === overIdNum)
        if (oldIndex === -1 || newIndex === -1) return

        const newItems = arrayMove(activeSection.items, oldIndex, newIndex)
        const newSections = sections.map((s) => (s.id === activeSection.id ? { ...s, items: newItems } : s))
        setBrand((prev) => ({ ...prev, sections: newSections }))

        const itemOrder = newItems.map((item, index) => ({ id: item.id, display_order: index }))
        const result = await reorderItems(activeSection.id, itemOrder)
        if (!result.success) {
          toast.error(result.message)
          setBrand((prev) => ({ ...prev, sections: sections })) // Revert
        } else {
          toast.success(result.message)
        }
      }
    }
  }

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{brand.name}</h1>
            <p className="text-sm text-gray-500">Form Editor</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="outline" onClick={() => toast.info("AI Import coming soon!")}>
              <FileUp className="h-4 w-4 mr-2" />
              Import Form
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Clear Form
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all sections and items for this form. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearForm}>Yes, clear form</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onDeleteSection={handleDeleteSection}
                onDeleteItem={handleDeleteItem}
                onEditSection={(s) => toast.info(`Editing section: ${s.title}`)}
                onEditItem={(i) => toast.info(`Editing item: ${i.label}`)}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeElement?.type === "section" && activeElement.data && (
              <SortableSection
                section={activeElement.data as FormSection}
                onDeleteSection={() => {}}
                onDeleteItem={() => {}}
                onEditSection={() => {}}
                onEditItem={() => {}}
              />
            )}
            {activeElement?.type === "item" && activeElement.data && (
              <SectionItem item={activeElement.data as FormItem} onDelete={() => {}} onEdit={() => {}} />
            )}
          </DragOverlay>
        </DndContext>

        <div className="mt-8">
          <Button onClick={() => setAddSectionDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      </main>

      <Dialog open={isAddSectionDialogOpen} onOpenChange={setAddSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>Enter a title for the new section.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="section-name" className="text-right">
                Title
              </Label>
              <Input
                id="section-name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="col-span-3"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddSectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAddSection}>
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
