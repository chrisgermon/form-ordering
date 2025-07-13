"use client"

import type { Section } from "@/lib/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, PlusCircle } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SectionItem } from "./SectionItem"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateItemOrder } from "./actions"

type SortableSectionProps = {
  section: Section
  onSectionUpdate: (section: Section) => void
}

export function SortableSection({ section, onSectionUpdate }: SortableSectionProps) {
  const [items, setItems] = useState(section.items)
  const [isPending, startTransition] = useTransition()

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
    data: { type: "section" },
  })

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

    setItems((prevItems) => {
      const oldIndex = prevItems.findIndex((i) => i.id === active.id)
      const newIndex = prevItems.findIndex((i) => i.id === over.id)
      const reorderedItems = arrayMove(prevItems, oldIndex, newIndex)

      startTransition(async () => {
        const itemPositions = reorderedItems.map((item, index) => ({ id: item.id, position: index }))
        const result = await updateItemOrder(section.id, itemPositions)
        if (result.success) {
          toast.success(result.message)
          onSectionUpdate({ ...section, items: reorderedItems })
        } else {
          toast.error(result.message)
          setItems(prevItems) // Revert on failure
        }
      })

      return reorderedItems
    })
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 bg-muted/50">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab touch-none">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </div>
          {/* Placeholder for section actions like delete/edit */}
        </CardHeader>
        <CardContent className="p-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item) => (
                  <SectionItem key={item.id} item={item} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <Button variant="outline" className="w-full mt-4 bg-transparent">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
