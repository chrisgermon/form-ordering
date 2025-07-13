"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Item } from "@/lib/types"

interface SectionItemProps {
  item: Item
  sectionId: string
}

export function SectionItem({ item, sectionId }: SectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: {
      type: "item",
      sectionId: sectionId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : "auto",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center justify-between p-3 border rounded-lg bg-background shadow-sm"
    >
      <div className="flex items-center gap-3">
        <button {...listeners} className="cursor-grab p-1 -ml-1">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <span className="font-medium">{item.label}</span>
        <Badge variant="outline">{item.type}</Badge>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
