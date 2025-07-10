"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createBrand } from "../actions"

export default function NewBrandPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = await createBrand(formData)

    if (result.error) {
      setError(result.error)
    } else {
      router.push("/brands")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create a New Brand</CardTitle>
          <CardDescription>Fill out the details below to add a new brand to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initials">Initials</Label>
              <Input id="initials" name="initials" maxLength={5} required />
              <p className="text-sm text-gray-500">A short identifier for the brand (e.g., VRG). Max 5 characters.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_prefix">Order Prefix</Label>
              <Input id="order_prefix" name="order_prefix" maxLength={10} required />
              <p className="text-sm text-gray-500">A prefix for order numbers (e.g., VRG-). Max 10 characters.</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">Create Brand</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
