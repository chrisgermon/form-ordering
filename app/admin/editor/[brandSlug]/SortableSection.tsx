"use client"

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GripVertical, PlusCircle, Trash2 } from "lucide-react"
import { SectionItem } from "./SectionItem"
import type { Section, Item } from "@/lib/types"

interface SortableSectionProps {
  section: Section
  onSectionChange: (id: string, value: string) => void
  onSectionRemove: (id: string) => void
  onItemAdd: (sectionId: string) => void
  onItemChange: (itemId: string, field: keyof Item, value: string | number) => void
  onItemRemove: (itemId: string) => void
}

export function SortableSection({
  section,
  onSectionChange,
  onSectionRemove,
  onItemAdd,
  onItemChange,
  onItemRemove,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 p-4">
          <div className="flex items-center gap-2 flex-grow">
            <button {...attributes} {...listeners} className="cursor-grab p-1">
              <GripVertical className="h-5 w-5 text-gray-500" />
            </button>
            <Input
              value={section.title}
              onChange={(e) => onSectionChange(section.id, e.target.value)}
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-0"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => onSectionRemove(section.id)}>
            <Trash2 className="h-5 w-5 text-red-500" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <SortableContext items={section.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {section.items.map((item) => (
              <SectionItem key={item.id} item={item} onItemChange={onItemChange} onItemRemove={onItemRemove} />
            ))}
          </SortableContext>
          <Button variant="outline" size="sm" onClick={() => onItemAdd(section.id)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
