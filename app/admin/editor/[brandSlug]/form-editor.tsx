"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, Controller, type Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { DndProvider, useDrag, useDrop, type XYCoord } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { toast } from "sonner"
import { saveForm, formSchema, type FormData } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GripVertical, Trash2 } from "lucide-react"
import type { Brand, ProductSection, ProductItem, UploadedFile } from "@/lib/types"

type SectionWithItems = ProductSection & { product_items: ProductItem[] }

type FormEditorProps = {
  initialBrand: Brand | null
  initialSections: SectionWithItems[]
  uploadedFiles: UploadedFile[]
}

export function FormEditor({ initialBrand, initialSections, uploadedFiles }: FormEditorProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues: FormData = {
    id: initialBrand?.id || undefined,
    name: initialBrand?.name || "",
    slug: initialBrand?.slug || "",
    logo: initialBrand?.logo || null,
    primary_color: initialBrand?.primary_color || "#000000",
    email: initialBrand?.email || "",
    active: initialBrand?.active ?? true,
    clinics: initialBrand?.clinics || [],
    sections: initialSections.map((s, index) => ({
      ...s,
      sort_order: s.sort_order ?? index,
      product_items: (s.product_items || []).map((pi, piIndex) => ({
        ...pi,
        sort_order: pi.sort_order ?? piIndex,
      })),
    })),
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    register,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const {
    fields: sections,
    append: appendSection,
    remove: removeSection,
    move: moveSection,
  } = useFieldArray({
    control,
    name: "sections",
  })

  const watchedName = watch("name")
  useEffect(() => {
    if (!initialBrand) {
      const newSlug = watchedName
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      setValue("slug", newSlug)
    }
  }, [watchedName, setValue, initialBrand])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    toast.loading("Saving form...")

    try {
      const result = await saveForm(data, initialBrand?.id || null)
      if (result.success && result.brand) {
        toast.success("Form saved successfully!")
        if (!initialBrand) {
          router.push(`/admin/editor/${result.brand.slug}`)
        } else {
          router.refresh()
        }
      } else {
        throw new Error(result.error || "An unknown error occurred.")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save form."
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
      toast.dismiss()
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Brand Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Brand Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...register("slug")} />
                {errors.slug && <p className="text-red-500 text-sm">{errors.slug.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="logo">Logo</Label>
                <Controller
                  name="logo"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a logo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {uploadedFiles.map((file) => (
                          <SelectItem key={file.id} value={file.url}>
                            {file.original_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <Input id="primary_color" type="color" {...register("primary_color")} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Recipient Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="active"
                control={control}
                render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Form Sections</h2>
          <div className="space-y-4">
            {sections.map((section, index) => (
              <SectionDndItem key={section.id} index={index} moveSection={moveSection}>
                <SectionForm control={control} register={register} sectionIndex={index} removeSection={removeSection} />
              </SectionDndItem>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-4 bg-transparent"
            onClick={() =>
              appendSection({
                id: crypto.randomUUID(),
                name: "",
                description: "",
                sort_order: sections.length,
                product_items: [],
              })
            }
          >
            Add Section
          </Button>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </DndProvider>
  )
}

const ItemTypes = { SECTION: "section", ITEM: "item" }
interface DragItem {
  index: number
  id: string
  type: string
}

function SectionDndItem({
  index,
  moveSection,
  children,
}: { index: number; moveSection: (from: number, to: number) => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: ItemTypes.SECTION,
    hover(item: DragItem, monitor) {
      if (!ref.current) return
      const dragIndex = item.index
      const hoverIndex = index
      if (dragIndex === hoverIndex) return
      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return
      moveSection(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SECTION,
    item: () => ({ id: `section-${index}`, index, type: ItemTypes.SECTION }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  })
  drag(drop(ref))

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }} className="flex items-start gap-2">
      <div className="cursor-move pt-10">
        <GripVertical />
      </div>
      <div className="flex-grow">{children}</div>
    </div>
  )
}

function SectionForm({
  control,
  register,
  sectionIndex,
  removeSection,
}: {
  control: Control<FormData>
  register: any
  sectionIndex: number
  removeSection: (index: number) => void
}) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.product_items`,
  })

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-grow space-y-2">
            <Label>Section Name</Label>
            <Input {...register(`sections.${sectionIndex}.name`)} placeholder="e.g., MRI Scans" />
            <Label>Section Description</Label>
            <Textarea {...register(`sections.${sectionIndex}.description`)} placeholder="Optional description" />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(sectionIndex)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <h4 className="font-semibold">Items</h4>
        <div className="space-y-2">
          {fields.map((item, itemIndex) => (
            <ItemDndItem key={item.id} sectionIndex={sectionIndex} itemIndex={itemIndex} moveItem={move}>
              <div className="p-2 border rounded-md space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-grow space-y-2">
                    <Label>Item Name</Label>
                    <Input
                      {...register(`sections.${sectionIndex}.product_items.${itemIndex}.name`)}
                      placeholder="e.g., Brain MRI"
                    />
                    <Label>Item Description</Label>
                    <Textarea
                      {...register(`sections.${sectionIndex}.product_items.${itemIndex}.description`)}
                      placeholder="Optional description"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(itemIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    name={`sections.${sectionIndex}.product_items.${itemIndex}.requires_scan`}
                    control={control}
                    render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                  />
                  <Label>Requires Scan Upload</Label>
                </div>
              </div>
            </ItemDndItem>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              id: crypto.randomUUID(),
              name: "",
              description: "",
              sort_order: fields.length,
              requires_scan: false,
            })
          }
        >
          Add Item
        </Button>
      </CardContent>
    </Card>
  )
}

function ItemDndItem({
  sectionIndex,
  itemIndex,
  moveItem,
  children,
}: {
  sectionIndex: number
  itemIndex: number
  moveItem: (from: number, to: number) => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const itemType = `${ItemTypes.ITEM}_${sectionIndex}`
  const [, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: itemType,
    hover(item: DragItem, monitor) {
      if (!ref.current) return
      const dragIndex = item.index
      const hoverIndex = itemIndex
      if (dragIndex === hoverIndex) return
      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return
      moveItem(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })
  const [{ isDragging }, drag] = useDrag({
    type: itemType,
    item: () => ({ id: `item-${sectionIndex}-${itemIndex}`, index: itemIndex, type: itemType }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  })
  drag(drop(ref))

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }} className="flex items-center gap-2">
      <div className="cursor-move">
        <GripVertical />
      </div>
      <div className="flex-grow">{children}</div>
    </div>
  )
}
