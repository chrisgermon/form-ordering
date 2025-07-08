"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function SectionItems({ sectionIndex }: { sectionIndex: number }) {
  const { control, register, setValue } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: `product_sections.${sectionIndex}.product_items`,
  })

  return (
    <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700 ml-4 mt-4">
      <div className="space-y-4">
        {fields.map((item, itemIndex) => (
          <Card key={item.id}>
            <CardHeader className="flex flex-row items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
              <CardTitle className="text-md font-medium">Item {itemIndex + 1}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => remove(itemIndex)}>
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="sr-only">Remove Item</span>
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label>Item Name</Label>
                <Input
                  {...register(`product_sections.${sectionIndex}.product_items.${itemIndex}.name`)}
                  placeholder="e.g. X-Ray Request"
                />
              </div>
              <div>
                <Label>Item Type</Label>
                <Select
                  defaultValue={(item as any).item_type}
                  onValueChange={(value) => {
                    setValue(`product_sections.${sectionIndex}.product_items.${itemIndex}.item_type`, value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-4 bg-transparent"
        onClick={() =>
          append({
            name: "",
            item_type: "quantity",
            description: "",
            price: 0,
            sort_order: fields.length,
            active: true,
          })
        }
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  )
}

export function SectionsAndItems() {
  const { control, register } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "product_sections",
  })

  return (
    <div className="space-y-6">
      {fields.map((section, index) => (
        <Card key={section.id} className="bg-white dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Section {index + 1}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4 text-red-500" />
              <span className="sr-only">Remove Section</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input {...register(`product_sections.${index}.title`)} placeholder="e.g. General Referrals" />
            </div>
            <div>
              <Label>Section Description</Label>
              <Textarea
                {...register(`product_sections.${index}.description`)}
                placeholder="Optional: add a description for this section"
              />
            </div>
            <SectionItems sectionIndex={index} />
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        onClick={() =>
          append({
            title: "",
            description: "",
            sort_order: fields.length,
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
