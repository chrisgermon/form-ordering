"use client"

import { useMemo } from "react"

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import type { FormItem, FormSection } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionItem } from "./SectionItem"

interface SortableSectionProps {
  section: FormSection
  onEditSection: (section: FormSection) => void
  onDeleteSection: (sectionId: number) => void
  onEditItem: (item: FormItem) => void
  onDeleteItem: (itemId: number) => void
}

export function SortableSection({
  section,
  onEditSection,
  onDeleteSection,
  onEditItem,
  onDeleteItem,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.8 : 1,
  }

  const itemIds = useMemo(() => section.items.map((item) => item.id), [section.items])

  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      <Card>
        <CardHeader
          className="flex flex-row items-center justify-between p-4 bg-gray-50 border-b"
          {...attributes}
          {...listeners}
          style={{ touchAction: "none", cursor: "grab" }}
        >
          <div className="flex items-center gap-3">
            <GripVertical className="h-6 w-6 text-gray-500" />
            <CardTitle className="text-lg font-semibold">{section.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onEditSection(section)
              }}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Section</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteSection(section.id)
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              <span className="sr-only">Delete Section</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-gray-50/50">
          {section.items.length > 0 ? (
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              {section.items.map((item) => (
                <SectionItem key={item.id} item={item} onEdit={onEditItem} onDelete={onDeleteItem} />
              ))}
            </SortableContext>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">This section is empty. Add an item to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
