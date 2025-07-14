"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, PlusCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditSectionDialog, AddItemDialog, EditItemDialog, ConfirmDeleteDialog, ManageOptionsDialog } from "./dialogs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { deleteItem as deleteItemAction } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Section, Item } from "@/lib/types"

interface SectionItemProps {
  section: Section
  onDelete: () => void
}

export function SectionItem({ section, onDelete }: SectionItemProps) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [isEditSectionOpen, setEditSectionOpen] = React.useState(false)
  const [isAddItemOpen, setAddItemOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Item | null>(null)
  const [deletingItem, setDeletingItem] = React.useState<Item | null>(null)
  const [managingOptions, setManagingOptions] = React.useState<Item | null>(null)

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

  const hasOptions = (item: Item) => ["select", "radio"].includes(item.field_type)

  return (
    <>
      <Card ref={setNodeRef} style={style} className="bg-white">
        <CardHeader className="flex flex-row items-start bg-gray-50 rounded-t-lg p-4">
          <div className="flex-grow">
            <CardTitle className="flex items-center text-lg">
              <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab mr-2">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </Button>
              {section.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditSectionOpen(true)}>
              <Pencil className="h-3 w-3 mr-2" /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="h-3 w-3 mr-2" /> Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {section.items.length > 0 ? (
                section.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.field_type}</Badge>
                    </TableCell>
                    <TableCell>{item.is_required ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {hasOptions(item) && (
                        <Button variant="outline" size="sm" onClick={() => setManagingOptions(item)}>
                          Options
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeletingItem(item)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-gray-500">
                    No items in this section.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="p-4 border-t">
            <Button variant="secondary" size="sm" onClick={() => setAddItemOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs for this section */}
      <EditSectionDialog isOpen={isEditSectionOpen} onClose={() => setEditSectionOpen(false)} section={section} />
      <AddItemDialog
        isOpen={isAddItemOpen}
        onClose={() => setAddItemOpen(false)}
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
      {managingOptions && (
        <ManageOptionsDialog
          isOpen={!!managingOptions}
          onClose={() => setManagingOptions(null)}
          item={managingOptions}
        />
      )}
    </>
  )
}
