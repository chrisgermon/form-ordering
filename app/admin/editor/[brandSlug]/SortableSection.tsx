"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { Section, Item } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Pencil, PlusCircle, Trash2 } from "lucide-react"
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
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} className="mb-4 bg-slate-50/50">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b cursor-default">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="cursor-grab p-1 touch-none">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </button>
          <CardTitle className="text-lg font-medium">{section.title}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEditSection}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDeleteSection}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {section.items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                sectionId={section.id}
                onEditItem={() => onEditItem(item)}
                onDeleteItem={() => onDeleteItem(item)}
              />
            ))}
          </SortableContext>
        </div>
        {section.items.length === 0 && <div className="text-center py-6 text-gray-500">This section has no items.</div>}
        <Button variant="outline" className="mt-4 w-full bg-transparent" onClick={onAddItem}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </CardContent>
    </Card>
  )
}
