"use client"

import type { Section, Item } from "@/lib/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Plus, Trash2, Pencil } from "lucide-react"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableItem } from "./SortableItem"

interface SortableSectionProps {
  section: Section
  onEditSection: () => void
  onDeleteSection: () => void
  onAddItem: () => void
  onEditItem: (item: Item) => void
  onDeleteItem: (item: Item) => void
}

export function SortableSection({
  section,
  onEditSection,
  onDeleteSection,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: "section" },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-gray-100 border-b">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="cursor-grab p-1">
            <GripVertical className="h-5 w-5 text-gray-500" />
          </button>
          <CardTitle className="text-lg">{section.title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onEditSection}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDeleteSection}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {section.items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                sectionId={section.id}
                onEdit={() => onEditItem(item)}
                onDelete={() => onDeleteItem(item)}
              />
            ))}
          </div>
        </SortableContext>
        <Button variant="outline" className="mt-4 w-full bg-transparent" onClick={onAddItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </CardContent>
    </Card>
  )
}
