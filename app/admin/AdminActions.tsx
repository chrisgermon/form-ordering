"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { seedDatabase } from "./actions"
import { toast } from "sonner"

export default function AdminActions() {
  const [isSeeding, setIsSeeding] = useState(false)

  const handleSeed = async () => {
    setIsSeeding(true)
    toast.info("Seeding database... This may take a moment.")
    const result = await seedDatabase()
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
    setIsSeeding(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground">
            This will delete all existing brands and products and replace them with the original seed data.
          </p>
          <Button onClick={handleSeed} disabled={isSeeding}>
            {isSeeding ? "Seeding..." : "Seed Database"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
