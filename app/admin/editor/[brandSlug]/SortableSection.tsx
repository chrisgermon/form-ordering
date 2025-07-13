"use client"

import type { Section, Item } from "@/lib/types"
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SectionItem } from "./SectionItem"
import { ItemDialog } from "./dialogs"
import { v4 as uuidv4 } from "uuid"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SortableSectionProps {
  section: Section
  onUpdate: (section: Section) => void
  onDelete: (sectionId: string) => void
}

export function SortableSection({ section, onUpdate, onDelete }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: "section" },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  const handleAddItem = (newItem: Omit<Item, "id" | "position" | "brand_id">) => {
    const item: Item = {
      ...newItem,
      id: `new-${uuidv4()}`,
      position: section.items.length,
      brand_id: section.brand_id,
    }
    onUpdate({ ...section, items: [...section.items, item] })
  }

  const handleUpdateItem = (updatedItem: Item) => {
    const newItems = section.items.map((i) => (i.id === updatedItem.id ? updatedItem : i))
    onUpdate({ ...section, items: newItems })
  }

  const handleDeleteItem = (itemId: string) => {
    const newItems = section.items.filter((i) => i.id !== itemId).map((item, i) => ({ ...item, position: i }))
    onUpdate({ ...section, items: newItems })
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the "{section.title}" section and all of its items. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(section.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter}>
          <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {section.items.map((item) => (
                <SectionItem
                  key={item.id}
                  item={item}
                  onUpdate={handleUpdateItem}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {section.items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">This section is empty.</p>
        )}
        <div className="mt-4 pt-4 border-t">
          <ItemDialog onSave={handleAddItem}>
            <Button variant="secondary" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </ItemDialog>
        </div>
      </CardContent>
    </Card>
  )
}
