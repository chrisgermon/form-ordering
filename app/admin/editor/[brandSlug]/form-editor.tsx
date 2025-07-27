"use client"

import React from "react"

import { useEffect } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, GripVertical, PlusCircle } from "lucide-react"
import { saveForm, type FormData } from "./actions"
import { useFormState } from "react-dom"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { BrandForEditor } from "./page"

const ItemTypes = {
  SECTION: "section",
  ITEM: "item",
}

export function FormEditor({ initialData }: { initialData: BrandForEditor }) {
  const router = useRouter()
  const [state, formAction] = useFormState(saveForm, { success: false, error: null, brand: null })

  const form = useForm<FormData>({
    defaultValues: {
      ...initialData,
      // Convert clinics array to a newline-separated string for the textarea
      clinics: Array.isArray(initialData.clinics) ? initialData.clinics.join("\n") : "",
      sections: initialData.product_sections.map((s) => ({
        ...s,
        name: s.title, // map title to name for the form
        product_items:
          s.product_items?.map((p) => ({
            ...p,
            // Convert quantities array to a comma-separated string for the textarea
            quantities: Array.isArray(p.quantities) ? p.quantities.join(", ") : "",
          })) || [],
      })),
    },
  })

  const {
    fields: sections,
    append: appendSection,
    remove: removeSection,
    move: moveSection,
  } = useFieldArray({
    control: form.control,
    name: "sections",
  })

  useEffect(() => {
    if (state.success) {
      toast.success("Form saved successfully!")
      if (state.brand) {
        // If it was a new brand, the slug might have changed.
        // Redirect to the new slug to ensure the URL is correct.
        if (initialData.id === "" || initialData.slug !== state.brand.slug) {
          router.push(`/admin/editor/${state.brand.slug}`)
        }
      }
    } else if (state.error) {
      toast.error(`Error: ${state.error}`)
    }
  }, [state, router, initialData])

  const DraggableSection = ({ section, index }: { section: any; index: number }) => {
    const ref = React.useRef<HTMLDivElement>(null)
    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.SECTION,
      item: { id: section.id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    })

    const [, drop] = useDrop({
      accept: ItemTypes.SECTION,
      hover: (item: { id: string; index: number }) => {
        if (item.index !== index) {
          moveSection(item.index, index)
          item.index = index
        }
      },
    })

    drag(drop(ref))

    const {
      fields: items,
      append: appendItem,
      remove: removeItem,
      move: moveItem,
    } = useFieldArray({
      control: form.control,
      name: `sections.${index}.product_items`,
    })

    const DraggableItem = ({ item, itemIndex }: { item: any; itemIndex: number }) => {
      const itemRef = React.useRef<HTMLDivElement>(null)
      const [{ isDragging: isItemDragging }, itemDrag] = useDrag({
        type: `${ItemTypes.ITEM}_${index}`,
        item: { id: item.id, index: itemIndex },
        collect: (monitor) => ({
          isItemDragging: monitor.isDragging(),
        }),
      })

      const [, itemDrop] = useDrop({
        accept: `${ItemTypes.ITEM}_${index}`,
        hover: (draggedItem: { id: string; index: number }) => {
          if (draggedItem.index !== itemIndex) {
            moveItem(draggedItem.index, itemIndex)
            draggedItem.index = itemIndex
          }
        },
      })

      itemDrag(itemDrop(itemRef))

      return (
        <div
          ref={itemRef}
          style={{ opacity: isItemDragging ? 0.5 : 1 }}
          className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50"
        >
          <GripVertical className="h-5 w-5 mt-2 text-gray-400 cursor-move" />
          <div className="flex-grow space-y-2">
            <Input {...form.register(`sections.${index}.product_items.${itemIndex}.name`)} placeholder="Item Name" />
            <Textarea
              {...form.register(`sections.${index}.product_items.${itemIndex}.description`)}
              placeholder="Item Description (optional)"
              rows={2}
            />
            <Input
              {...form.register(`sections.${index}.product_items.${itemIndex}.sample_link`)}
              placeholder="Sample Link (e.g., https://...)"
            />
            <Textarea
              {...form.register(`sections.${index}.product_items.${itemIndex}.quantities`)}
              placeholder="Enter quantities, comma-separated (e.g. 1, 2, 5, other)"
              rows={2}
            />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(itemIndex)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        className="p-4 border-2 border-dashed rounded-lg space-y-4"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-6 w-6 text-gray-500 cursor-move" />
          <Input
            {...form.register(`sections.${index}.name`)}
            placeholder="Section Name"
            className="text-lg font-bold"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(index)}>
            <Trash2 className="h-5 w-5 text-red-500" />
          </Button>
        </div>
        <div className="space-y-3 pl-6">
          {items.map((item, itemIndex) => (
            <DraggableItem key={item.id} item={item} itemIndex={itemIndex} />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            appendItem({
              id: `new-item-${crypto.randomUUID()}`,
              name: "",
              description: "",
              sample_link: "",
              quantities: "",
              sort_order: items.length,
            })
          }
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" /> Add Item
        </Button>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <form onSubmit={form.handleSubmit((data) => formAction(data))} className="space-y-8 p-4 md:p-8">
        <input type="hidden" {...form.register("id")} />
        <Card>
          <CardHeader>
            <CardTitle>Brand Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input {...form.register("name")} placeholder="Brand Name" />
              <Input {...form.register("slug")} placeholder="brand-slug" />
            </div>
            <Input {...form.register("logo")} placeholder="Logo URL" />
            <Input {...form.register("email")} placeholder="Submission Email" />
            <div>
              <Label htmlFor="clinics">Clinics</Label>
              <Textarea
                id="clinics"
                {...form.register("clinics")}
                placeholder="Enter one clinic location per line"
                rows={5}
              />
            </div>
            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="active"
                render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((section, index) => (
              <DraggableSection key={section.id} section={section} index={index} />
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                appendSection({
                  id: `new-section-${crypto.randomUUID()}`,
                  name: "",
                  description: "",
                  sort_order: sections.length,
                  product_items: [],
                })
              }
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" /> Add Section
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </DndProvider>
  )
}
