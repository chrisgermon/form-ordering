"use client"

import type { Item } from "@/lib/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type SectionItemProps = {
  item: Item
}

export function SectionItem({ item }: SectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    data: { type: "item", sectionId: item.section_id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 border rounded-md bg-background flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab touch-none">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground capitalize">{item.field_type.replace("_", " ")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
