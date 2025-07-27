"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { seedDatabase } from "./actions"
import { useRouter } from "next/navigation"

export default function AdminActions() {
  const [isSeeding, setIsSeeding] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSeedDatabase = async () => {
    if (
      !confirm(
        "Are you sure you want to re-seed the database? This will ERASE all current brands and products and replace them with default data.",
      )
    ) {
      return
    }
    setIsSeeding(true)
    toast({ title: "Seeding Database...", description: "This may take a moment." })
    try {
      const result = await seedDatabase()
      if (result.success) {
        toast({ title: "Success!", description: result.message })
        router.refresh()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error Seeding Data",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Actions</CardTitle>
        <CardDescription>Run tasks that affect the entire application.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleSeedDatabase} disabled={isSeeding} variant="destructive">
          {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Seed Database
        </Button>
      </CardContent>
    </Card>
  )
}
