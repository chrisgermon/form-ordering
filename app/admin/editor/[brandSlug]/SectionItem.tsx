"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { GripVertical } from "lucide-react"
import type { Item } from "@/lib/types"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SectionItem({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card ref={setNodeRef} style={style} className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between p-3">
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
          <div>
            <CardTitle className="text-base font-medium">{item.name}</CardTitle>
            <CardDescription className="text-xs">{item.field_type}</CardDescription>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
            Delete
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}
