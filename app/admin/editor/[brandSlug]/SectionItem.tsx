"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Item } from "@/lib/types"

interface SectionItemProps {
  item: Item
  onItemChange: (id: string, field: keyof Item, value: string | number) => void
  onItemRemove: (id: string) => void
}

export function SectionItem({ item, onItemChange, onItemRemove }: SectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm">
      <button {...attributes} {...listeners} className="cursor-grab p-1">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <Label htmlFor={`item-name-${item.id}`} className="sr-only">
            Item Name
          </Label>
          <Input
            id={`item-name-${item.id}`}
            value={item.name}
            onChange={(e) => onItemChange(item.id, "name", e.target.value)}
            placeholder="Item Name"
          />
        </div>
        <div>
          <Label htmlFor={`item-code-${item.id}`} className="sr-only">
            Item Code
          </Label>
          <Input
            id={`item-code-${item.id}`}
            value={item.item_code || ""}
            onChange={(e) => onItemChange(item.id, "item_code", e.target.value)}
            placeholder="Item Code"
          />
        </div>
        <div>
          <Label htmlFor={`item-type-${item.id}`} className="sr-only">
            Field Type
          </Label>
          <Select
            value={item.field_type || "text"}
            onValueChange={(value) => onItemChange(item.id, "field_type", value)}
          >
            <SelectTrigger id={`item-type-${item.id}`}>
              <SelectValue placeholder="Field Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onItemRemove(item.id)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  )
}
