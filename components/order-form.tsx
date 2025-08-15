"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/hooks/use-toast"
import type { BrandWithSections, Item } from "@/lib/types"
import Image from "next/image"

interface OrderFormProps {
  brand: BrandWithSections
}

export default function OrderForm({ brand }: OrderFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<Record<string, File>>({})

  const handleInputChange = (itemId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [itemId]: value,
    }))
  }

  const handleFileChange = (itemId: string, file: File | null) => {
    if (file) {
      setFiles((prev) => ({
        ...prev,
        [itemId]: file,
      }))
    } else {
      const newFiles = { ...files }
      delete newFiles[itemId]
      setFiles(newFiles)
    }
  }

  const renderFormItem = (item: Item) => {
    const value = formData[item.id] || ""

    switch (item.type) {
      case "text":
      case "number":
        return (
          <Input
            type={item.type}
            value={value}
            onChange={(e) => handleInputChange(item.id, e.target.value)}
            required={item.required}
          />
        )

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(item.id, e.target.value)}
            required={item.required}
            rows={4}
          />
        )

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(item.id, e.target.value)}
            required={item.required}
          />
        )

      case "select":
        return (
          <Select value={value} onValueChange={(val) => handleInputChange(item.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {item.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "radio":
        return (
          <RadioGroup value={value} onValueChange={(val) => handleInputChange(item.id, val)}>
            {item.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${item.id}-${option}`} />
                <Label htmlFor={`${item.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={item.id}
              checked={value === true}
              onCheckedChange={(checked) => handleInputChange(item.id, checked)}
            />
            <Label htmlFor={item.id}>{item.title}</Label>
          </div>
        )

      case "file":
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              handleFileChange(item.id, file)
            }}
            required={item.required}
          />
        )

      default:
        return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create FormData for file uploads
      const submitData = new FormData()
      submitData.append("brandId", brand.id)
      submitData.append("formData", JSON.stringify(formData))

      // Add files
      Object.entries(files).forEach(([itemId, file]) => {
        submitData.append(`file_${itemId}`, file)
      })

      const response = await fetch("/api/submit-order", {
        method: "POST",
        body: submitData,
      })

      if (!response.ok) {
        throw new Error("Failed to submit order")
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Order Submitted",
          description: "Your order has been submitted successfully.",
        })

        // Reset form
        setFormData({})
        setFiles({})
      } else {
        throw new Error(result.message || "Failed to submit order")
      }
    } catch (error) {
      console.error("Error submitting order:", error)
      toast({
        title: "Error",
        description: "Failed to submit order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        {brand.logo_url && (
          <div className="mb-4">
            <Image
              src={brand.logo_url || "/placeholder.svg"}
              alt={`${brand.name} logo`}
              width={200}
              height={100}
              className="mx-auto"
            />
          </div>
        )}
        <h1 className="text-3xl font-bold" style={{ color: brand.primary_color }}>
          {brand.name} Order Form
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {brand.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                {section.description && <CardDescription>{section.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-6">
                {section.items
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <div key={item.id} className="space-y-2">
                      {item.type !== "checkbox" && (
                        <Label htmlFor={item.id}>
                          {item.title}
                          {item.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                      )}
                      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                      {renderFormItem(item)}
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}

        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2"
            style={{ backgroundColor: brand.primary_color }}
          >
            {isSubmitting ? "Submitting..." : "Submit Order"}
          </Button>
        </div>
      </form>
    </div>
  )
}
