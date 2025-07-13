"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { Section, Item } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Pencil, PlusCircle, Trash2 } from "lucide-react"
import SectionItem from "./SectionItem"
import { AddItemDialog, EditItemDialog, ConfirmDeleteDialog } from "./dialogs"

interface SortableSectionProps {
  section: Section
  onEditSection: () => void
  onDeleteSection: (sectionId: string) => void
  onUpdateItems: (sectionId: string, items: Item[], deletedItemIds: string[]) => void
  brandId: string
}

export default function SortableSection({
  section,
  onEditSection,
  onDeleteSection,
  onUpdateItems,
  brandId,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  const handleAddItem = (item: Omit<Item, "id" | "position" | "brand_id" | "section_id">) => {
    const newItem: Item = {
      ...item,
      id: `new-item-${Date.now()}`,
      position: section.items.length,
      brand_id: brandId,
      section_id: section.id,
    }
    onUpdateItems(section.id, [...section.items, newItem], [])
  }

  const handleUpdateItem = (updatedItem: Item) => {
    const newItems = section.items.map((i) => (i.id === updatedItem.id ? updatedItem : i))
    onUpdateItems(section.id, newItems, [])
    setEditingItem(null)
  }

  const handleDeleteItem = (itemId: string) => {
    const newItems = section.items.filter((i) => i.id !== itemId)
    onUpdateItems(section.id, newItems, [itemId])
  }

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = section.items.findIndex((item) => item.id === active.id)
      const newIndex = section.items.findIndex((item) => item.id === over.id)
      const newItems = arrayMove(section.items, oldIndex, newIndex).map((item, index) => ({ ...item, position: index }))
      onUpdateItems(section.id, newItems, [])
    }
  }

  return (
    <>
      <Card ref={setNodeRef} style={style} className="bg-slate-50">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="cursor-grab p-1">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </button>
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onEditSection}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeletingSectionId(section.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <DndContext sensors={[]} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
            <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <SectionItem
                    key={item.id}
                    item={item}
                    onEdit={() => setEditingItem(item)}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {section.items.length === 0 && (
            <div className="text-center py-6 text-gray-500">This section has no items.</div>
          )}
          <Button variant="outline" className="mt-4 w-full bg-transparent" onClick={() => setIsAddItemOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </CardContent>
      </Card>

      <AddItemDialog isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} onAdd={handleAddItem} />
      {editingItem && (
        <EditItemDialog
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onUpdate={handleUpdateItem}
          item={editingItem}
        />
      )}
      {deletingSectionId && (
        <ConfirmDeleteDialog
          isOpen={!!deletingSectionId}
          onClose={() => setDeletingSectionId(null)}
          onConfirm={() => {
            onDeleteSection(deletingSectionId)
            setDeletingSectionId(null)
          }}
          itemName={`section "${section.title}" and all its items`}
        />
      )}
    </>
  )
}
