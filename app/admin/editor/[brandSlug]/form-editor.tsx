"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { saveForm } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, GripVertical, PlusCircle } from "lucide-react"
import type { Brand, ProductSection, Item } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

type FormEditorProps = {
  brand: (Brand & { product_sections: ProductSection[] }) | null
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  )
}

export function FormEditor({ brand: initialBrand }: FormEditorProps) {
  const [brand, setBrand] = useState<Partial<Brand>>(
    initialBrand || { name: "", slug: "", active: true, submission_recipients: [] },
  )
  const [sections, setSections] = useState<(Partial<ProductSection> & { items: Partial<Item>[] })[]>(
    initialBrand?.product_sections || [],
  )

  const [state, formAction] = useFormState(saveForm, { message: "" })

  useEffect(() => {
    if (initialBrand) {
      setBrand(initialBrand)
      setSections(initialBrand.product_sections.sort((a, b) => (a.position || 0) - (b.position || 0)))
    }
  }, [initialBrand])

  const handleBrandChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBrand((prev) => ({ ...prev, [name]: value }))
  }

  const handleBrandSwitch = (checked: boolean) => {
    setBrand((prev) => ({ ...prev, active: checked }))
  }

  const handleSectionChange = (sectionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSections((prev) => prev.map((sec, i) => (i === sectionIndex ? { ...sec, [name]: value } : sec)))
  }

  const addSection = () => {
    setSections((prev) => [...prev, { id: uuidv4(), name: "", position: prev.length, items: [] }])
  }

  const removeSection = (sectionIndex: number) => {
    setSections((prev) => prev.filter((_, i) => i !== sectionIndex))
  }

  const handleItemChange = (
    sectionIndex: number,
    itemIndex: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i === sectionIndex) {
          return {
            ...sec,
            items: sec.items.map((item, j) => (j === itemIndex ? { ...item, [name]: value } : item)),
          }
        }
        return sec
      }),
    )
  }

  const addItem = (sectionIndex: number) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i === sectionIndex) {
          return {
            ...sec,
            items: [
              ...sec.items,
              {
                id: uuidv4(),
                name: "",
                description: "",
                price: 0,
                position: sec.items.length,
              },
            ],
          }
        }
        return sec
      }),
    )
  }

  const removeItem = (sectionIndex: number, itemIndex: number) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i === sectionIndex) {
          return {
            ...sec,
            items: sec.items.filter((_, j) => j !== itemIndex),
          }
        }
        return sec
      }),
    )
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="data" value={JSON.stringify({ brand, sections })} />

      <Card>
        <CardHeader>
          <CardTitle>Brand Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Brand Name</Label>
              <Input id="name" name="name" value={brand.name || ""} onChange={handleBrandChange} required />
            </div>
            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input id="slug" name="slug" value={brand.slug || ""} onChange={handleBrandChange} required />
            </div>
          </div>
          <div>
            <Label htmlFor="logo">Logo URL</Label>
            <Input id="logo" name="logo" value={brand.logo || ""} onChange={handleBrandChange} />
          </div>
          <div>
            <Label htmlFor="submission_recipients">Submission Recipient Emails (comma-separated)</Label>
            <Textarea
              id="submission_recipients"
              name="submission_recipients"
              value={Array.isArray(brand.submission_recipients) ? brand.submission_recipients.join(", ") : ""}
              onChange={(e) =>
                setBrand((prev) => ({
                  ...prev,
                  submission_recipients: e.target.value.split(",").map((s) => s.trim()),
                }))
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="active" checked={brand.active} onCheckedChange={handleBrandSwitch} />
            <Label htmlFor="active">Active</Label>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Form Sections</h2>
        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <Card key={section.id || sectionIndex}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  <Input
                    name="name"
                    placeholder="Section Name"
                    value={section.name || ""}
                    onChange={(e) => handleSectionChange(sectionIndex, e)}
                    className="text-xl font-bold"
                  />
                </CardTitle>
                <div className="flex items-center gap-2">
                  <GripVertical className="cursor-grab text-muted-foreground" />
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeSection(sectionIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <div key={item.id || itemIndex} className="flex items-start gap-4 p-2 border rounded-md">
                    <GripVertical className="cursor-grab text-muted-foreground mt-2" />
                    <div className="flex-grow space-y-2">
                      <Input
                        name="name"
                        placeholder="Item Name"
                        value={item.name || ""}
                        onChange={(e) => handleItemChange(sectionIndex, itemIndex, e)}
                      />
                      <Textarea
                        name="description"
                        placeholder="Item Description"
                        value={item.description || ""}
                        onChange={(e) => handleItemChange(sectionIndex, itemIndex, e)}
                        rows={2}
                      />
                      <Input
                        name="price"
                        type="number"
                        placeholder="Price"
                        value={item.price || 0}
                        onChange={(e) => handleItemChange(sectionIndex, itemIndex, e)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(sectionIndex, itemIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => addItem(sectionIndex)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={addSection} className="mt-6">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Section
        </Button>
      </div>

      <div className="flex justify-end items-center gap-4">
        {state.message && <p className={state.error ? "text-red-500" : "text-green-500"}>{state.message}</p>}
        <SubmitButton />
      </div>
    </form>
  )
}
