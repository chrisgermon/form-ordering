"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Item } from "@/lib/types"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ConfirmDeleteDialog } from "./dialogs"

interface SectionItemProps {
  item: Item
  onEdit: () => void
  onDelete: (itemId: string) => void
}

export default function SectionItem({ item, onEdit, onDelete }: SectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <>
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-white border rounded-md shadow-sm">
        <button {...attributes} {...listeners} className="cursor-grab p-1">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </button>
        <div className="flex-grow">
          <span className="font-medium">{item.name}</span>
          {item.is_required && (
            <span className="text-red-500" title="Required">
              *
            </span>
          )}
          {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {item.field_type}
        </Badge>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          onDelete(item.id)
          setIsDeleteDialogOpen(false)
        }}
        itemName={`item "${item.name}"`}
      />
    </>
  )
}
