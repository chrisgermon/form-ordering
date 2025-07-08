"use client"

import { useFieldArray, useFormContext, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BrandData } from "@/lib/types"

function ItemArray({ sectionIndex, brandId }: { sectionIndex: number; brandId: string }) {
  const { control, register, getValues } = useFormContext<BrandData>()
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: `product_sections.${sectionIndex}.product_items`,
  })

  const sectionId = getValues(`product_sections.${sectionIndex}.id`)

  return (
    <div className="pl-4 mt-4 space-y-4">
      <h4 className="font-medium">Items</h4>
      {itemFields.map((item, itemIndex) => (
        <Card key={item.id} className="bg-gray-50 dark:bg-gray-800/50">
          <CardHeader className="flex flex-row items-center justify-between p-3">
            <CardTitle className="text-md font-medium">Item {itemIndex + 1}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => removeItem(itemIndex)}>
              <Trash2 className="h-4 w-4 text-red-500" />
              <span className="sr-only">Remove Item</span>
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Item Name</Label>
                <Input {...register(`product_sections.${sectionIndex}.product_items.${itemIndex}.name`)} />
              </div>
              <div>
                <Label>Item Type</Label>
                <Controller
                  control={control}
                  name={`product_sections.${sectionIndex}.product_items.${itemIndex}.field_type`}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quantity">Quantity</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input {...register(`product_sections.${sectionIndex}.product_items.${itemIndex}.description`)} />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          appendItem({
            id: `new-item-${Date.now()}`,
            brand_id: brandId,
            section_id: sectionId,
            name: "New Item",
            code: "",
            description: "",
            options: [],
            sample_link: "",
            sort_order: itemFields.length,
            field_type: "quantity",
            is_required: false,
            placeholder: "",
          })
        }
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Item to Section
      </Button>
    </div>
  )
}

export function SectionsAndItems() {
  const { control, register, getValues } = useFormContext<BrandData>()
  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
  } = useFieldArray({
    control,
    name: "product_sections",
  })

  const brandId = getValues("id")

  return (
    <div className="space-y-6">
      {sectionFields.map((section, sectionIndex) => (
        <Card key={section.id} className="bg-white dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
            <CardTitle className="text-lg font-medium">Section {sectionIndex + 1}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => removeSection(sectionIndex)}>
              <Trash2 className="h-4 w-4 text-red-500" />
              <span className="sr-only">Remove Section</span>
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input {...register(`product_sections.${sectionIndex}.title`)} placeholder="e.g. General Referrals" />
            </div>
            <div>
              <Label>Section Description</Label>
              <Textarea
                {...register(`product_sections.${sectionIndex}.description`)}
                placeholder="Optional: add a description for this section"
              />
            </div>
            <ItemArray sectionIndex={sectionIndex} brandId={brandId} />
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          appendSection({
            id: `new-section-${Date.now()}`,
            brand_id: brandId,
            title: "New Section",
            description: "",
            sort_order: sectionFields.length,
            product_items: [],
          })
        }
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Section
      </Button>
    </div>
  )
}
