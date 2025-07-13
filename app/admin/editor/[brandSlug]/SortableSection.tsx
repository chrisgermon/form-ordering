"use client"

import type { Section, Item } from "@/lib/types"
import { useSortable, SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Plus, Pencil, Trash2 } from "lucide-react"
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateItemOrder } from "./actions"
import { SectionItem } from "./SectionItem"

interface SortableSectionProps {
  section: Section
  onSectionUpdate: (section: Section) => void
}

export function SortableSection({ section, onSectionUpdate }: SortableSectionProps) {
  const [items, setItems] = useState<Item[]>(section.items || [])
  const [isPending, startTransition] = useTransition()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: {
      type: "section",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  }

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)

    const reorderedItems = arrayMove(items, oldIndex, newIndex)
    setItems(reorderedItems)
    onSectionUpdate({ ...section, items: reorderedItems })

    startTransition(async () => {
      const itemOrder = reorderedItems.map((item, index) => ({ id: item.id, order: index }))
      const result = await updateItemOrder(section.id, itemOrder)
      if (result.success) {
        toast.success("Item order saved.")
      } else {
        toast.error(result.message)
        setItems(section.items)
        onSectionUpdate(section)
      }
    })
  }

  return (
    <Card ref={setNodeRef} style={style} {...attributes} className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-muted/40">
        <div className="flex items-center gap-2">
          <button {...listeners} className="cursor-grab p-1 -ml-1">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <CardTitle className="text-lg font-semibold">{section.title}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">This section is empty.</p>}
        <div className="mt-4 pt-4 border-t">
          <Button variant="secondary" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
