"use client"

import type { Section } from "@/lib/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Plus } from "lucide-react"
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateItemOrder } from "./actions"
import SectionItem from "./SectionItem"

export default function SortableSection({
  section,
  onSectionUpdate,
}: {
  section: Section
  onSectionUpdate: (section: Section) => void
}) {
  const [items, setItems] = useState(section.items || [])
  const [isPending, startTransition] = useTransition()

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)

    const reorderedItems = [...items]
    const [movedItem] = reorderedItems.splice(oldIndex, 1)
    reorderedItems.splice(newIndex, 0, movedItem)

    setItems(reorderedItems)
    onSectionUpdate({ ...section, items: reorderedItems })

    startTransition(async () => {
      const itemOrder = reorderedItems.map((item, index) => ({ id: item.id, order: index }))
      const result = await updateItemOrder(section.id, itemOrder)
      if (result.success) {
        toast.success("Item order saved.")
      } else {
        toast.error(result.message)
        // Revert on failure
        setItems(section.items)
        onSectionUpdate(section)
      }
    })
  }

  return (
    <Card ref={setNodeRef} style={style} className="bg-slate-50/50">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </Button>
          <CardTitle className="text-lg">{section.title}</CardTitle>
        </div>
        {/* Add Edit/Delete Section buttons here if needed */}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <SectionItem key={item.id} item={item} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {items.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed rounded-lg">
            <p className="text-sm text-gray-500">This section is empty.</p>
          </div>
        )}
        <Button variant="outline" className="mt-4 w-full bg-transparent">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </CardContent>
    </Card>
  )
}
