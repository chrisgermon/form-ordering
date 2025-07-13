"use client"

import type { Item } from "@/lib/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Pencil, Trash2 } from "lucide-react"

interface SortableItemProps {
  item: Item
  sectionId: string | number
  onEditItem: () => void
  onDeleteItem: () => void
}

export function SortableItem({ item, sectionId, onEditItem, onDeleteItem }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: "item", sectionId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-white p-3 rounded-md border shadow-sm">
      <button {...attributes} {...listeners} className="cursor-grab p-1 touch-none">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>
      <div className="flex-1">
        <p className="font-medium">{item.name}</p>
        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
      </div>
      <Badge variant="outline" className="font-mono text-xs">
        {item.field_type}
      </Badge>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEditItem}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDeleteItem}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  )
}
