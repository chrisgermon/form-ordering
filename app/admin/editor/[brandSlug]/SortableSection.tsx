"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { SectionWithItems } from "@/lib/types"
import { SectionItem } from "./SectionItem"

interface SortableSectionProps {
  section: SectionWithItems
}

export function SortableSection({ section }: SortableSectionProps) {
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
        <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {section.items.map((item) => (
              <SectionItem key={item.id} item={item} sectionId={section.id} />
            ))}
          </div>
        </SortableContext>
        {section.items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">This section is empty.</p>
        )}
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
