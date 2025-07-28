"use client"

import React, { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { useFormState } from "react-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Trash2, GripVertical, PlusCircle, Save } from "lucide-react"
import { saveForm } from "./actions"
import { formSchema, type FormEditorData } from "./schema"
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

  const form = useForm<FormEditorData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      clinics: initialData.clinics || [],
      sections:
        initialData.product_sections?.map((s) => ({
          ...s,
          name: s.title,
          product_items:
            s.product_items?.map((p) => ({
              ...p,
              quantities: Array.isArray(p.quantities) ? p.quantities.join(", ") : p.quantities || "",
            })) || [],
        })) || [],
    },
    mode: "onChange",
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

  const {
    fields: clinics,
    append: appendClinic,
    remove: removeClinic,
  } = useFieldArray({
    control: form.control,
    name: "clinics",
  })

  useEffect(() => {
    if (state.success) {
      toast.success("Form saved successfully!")
      if (state.brand) {
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
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
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
      const [{ isItemDragging }, itemDrag] = useDrag({
        type: `${ItemTypes.ITEM}_${index}`,
        item: { id: item.id, index: itemIndex },
        collect: (monitor) => ({ isItemDragging: monitor.isDragging() }),
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
          className="flex items-start gap-2 p-3 border rounded-lg bg-background"
        >
          <GripVertical className="h-5 w-5 mt-2 text-muted-foreground cursor-move" />
          <div className="flex-grow space-y-4">
            <FormField
              control={form.control}
              name={`sections.${index}.product_items.${itemIndex}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Item Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`sections.${index}.product_items.${itemIndex}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Item Description (optional)" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`sections.${index}.product_items.${itemIndex}.sample_link`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Sample Link (e.g., https://...)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`sections.${index}.product_items.${itemIndex}.quantities`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Enter quantities, comma-separated (e.g. 1, 2, 5, other)"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(itemIndex)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        className="p-4 border-2 border-dashed rounded-lg space-y-4 bg-card"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-6 w-6 text-muted-foreground cursor-move" />
          <FormField
            control={form.control}
            name={`sections.${index}.name`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl>
                  <Input
                    placeholder="Section Name"
                    className="text-lg font-bold bg-transparent border-none focus-visible:ring-0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(index)}>
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
        <div className="space-y-3 pl-8">
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
          className="flex items-center gap-2 ml-8"
        >
          <PlusCircle className="h-4 w-4" /> Add Item
        </Button>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => formAction(form.getValues()))} className="space-y-8 py-4">
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <input type="hidden" {...form.register("id")} />
          <Card>
            <CardHeader>
              <CardTitle>Brand Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Brand Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="brand-slug" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submission Email</FormLabel>
                    <FormControl>
                      <Input placeholder="submissions@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clinics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clinics.map((clinic, index) => (
                <div key={clinic.id} className="p-4 border rounded-lg space-y-4 relative bg-background">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeClinic(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`clinics.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clinic Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Clinic Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`clinics.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clinic Email</FormLabel>
                          <FormControl>
                            <Input placeholder="clinic@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`clinics.${index}.address`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 Main St..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => appendClinic({ name: "", address: "", email: "" })}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" /> Add Clinic
              </Button>
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
              <Save className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </DndProvider>
  )
}
