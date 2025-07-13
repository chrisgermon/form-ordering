"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import type { FormItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SectionItemProps {
  item: FormItem
  onEdit: (item: FormItem) => void
  onDelete: (itemId: number) => void
}

export function SectionItem({ item, onEdit, onDelete }: SectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : "auto",
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 mb-2 bg-white rounded-md shadow-sm border border-gray-200"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </button>
        <span className="font-medium">{item.label}</span>
        <Badge variant="secondary" className="capitalize">
          {item.type.replace(/_/g, " ")}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit Item</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
          <span className="sr-only">Delete Item</span>
        </Button>
      </div>
    </div>
  )
}
