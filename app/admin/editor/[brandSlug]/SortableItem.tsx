"use client"

import type { Item } from "@/lib/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { GripVertical, Pencil, Trash2 } from "lucide-react"

interface SortableItemProps {
  item: Item
  sectionId: string | number
  onEdit: () => void
  onDelete: () => void
}

export function SortableItem({ item, sectionId, onEdit, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: "item", sectionId: sectionId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-white border rounded-md shadow-sm">
      <button {...attributes} {...listeners} className="cursor-grab p-1">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>
      <div className="flex-grow">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-gray-500">{item.field_type}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  )
}
