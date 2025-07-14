"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2, PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EditSectionDialog, AddItemDialog, EditItemDialog, ConfirmDeleteDialog } from "./dialogs"
import { deleteItem as deleteItemAction } from "./actions"
import type { Section, Item } from "@/lib/types"

interface SectionItemProps {
  section: Section
  onDelete: () => void
}

export function SectionItem({ section, onDelete }: SectionItemProps) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  const [isEditingSection, setIsEditingSection] = React.useState(false)
  const [isAddingItem, setIsAddingItem] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Item | null>(null)
  const [deletingItem, setDeletingItem] = React.useState<Item | null>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  }

  const handleDeleteItem = async () => {
    if (!deletingItem) return
    const toastId = toast.loading(`Deleting item "${deletingItem.name}"...`)
    const result = await deleteItemAction(deletingItem.id)
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Item deleted.")
      setDeletingItem(null)
      router.refresh()
    } else {
      toast.error(result.message || "Failed to delete item.")
    }
  }

  return (
    <>
      <Card ref={setNodeRef} style={style} className="bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 p-3 bg-gray-50 border-b">
          <button {...attributes} {...listeners} className="cursor-grab p-2 text-gray-500 hover:bg-gray-200 rounded-md">
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex-grow">
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditingSection(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {section.items.length > 0 ? (
            section.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-2 border rounded-md bg-white">
                <div className="flex-grow">
                  <span className="font-medium">{item.name}</span>
                  {item.is_required && <span className="text-red-500 ml-1">*</span>}
                  {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                </div>
                <Badge variant="secondary">{item.field_type}</Badge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeletingItem(item)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <CardDescription className="text-center py-4">No items in this section.</CardDescription>
          )}
          <Button variant="outline" className="w-full bg-transparent" onClick={() => setIsAddingItem(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      {/* Dialogs for this section */}
      <EditSectionDialog isOpen={isEditingSection} onClose={() => setIsEditingSection(false)} section={section} />
      <AddItemDialog
        isOpen={isAddingItem}
        onClose={() => setIsAddingItem(false)}
        sectionId={section.id}
        brandId={section.brand_id}
        currentMaxPosition={section.items.length}
      />
      {editingItem && <EditItemDialog isOpen={!!editingItem} onClose={() => setEditingItem(null)} item={editingItem} />}
      {deletingItem && (
        <ConfirmDeleteDialog
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteItem}
          itemName={`item "${deletingItem.name}"`}
        />
      )}
    </>
  )
}
