"use client"

import type { Item } from "@/lib/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SectionItemProps {
  item: Item
}

export function SectionItem({ item }: SectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: {
      type: "item",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} {...attributes} className="bg-background">
      <CardHeader className="flex flex-row items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <button {...listeners} className="cursor-grab p-1">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <CardTitle className="text-base font-medium">{item.label}</CardTitle>
            {item.description && <CardDescription className="text-xs">{item.description}</CardDescription>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{item.type}</Badge>
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}
