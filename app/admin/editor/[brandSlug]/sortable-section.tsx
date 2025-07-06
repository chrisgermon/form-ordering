"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { ProductSection, ProductItem } from "@/lib/types"
import { SortableItem } from "./sortable-item"

interface SortableSectionProps {
  section: ProductSection
  onUpdateSection: (sectionId: string, newTitle: string) => void
  onDeleteSection: (sectionId: string) => void
  onAddItem: (sectionId: string) => void
  onUpdateItem: (sectionId: string, itemId: string, updatedItem: ProductItem) => void
  onDeleteItem: (sectionId: string, itemId: string) => void
}

export function SortableSection({
  section,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: SortableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
    data: { type: "section" },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card ref={setNodeRef} style={style} className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="h-5 w-5" />
          </Button>
          <Input
            value={section.title}
            onChange={(e) => onUpdateSection(section.id, e.target.value)}
            className="text-lg font-semibold border-none shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onAddItem(section.id)}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDeleteSection(section.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-4">
          <div className="space-y-2">
            <SortableContext items={section.product_items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {section.product_items.length > 0 ? (
                section.product_items.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onUpdateItem={(updatedItem) => onUpdateItem(section.id, item.id, updatedItem)}
                    onDeleteItem={() => onDeleteItem(section.id, item.id)}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No items in this section.</p>
              )}
            </SortableContext>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
