"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { runSeedProductData, autoAssignPdfs } from "./actions"

export default function AdminActions() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const { toast } = useToast()

  const handleSeedData = async () => {
    if (
      !confirm(
        "Are you sure you want to re-seed all product data? This will clear and replace existing items and sections.",
      )
    ) {
      return
    }
    setIsSeeding(true)
    toast({ title: "Seeding Product Data..." })
    try {
      const result = await runSeedProductData()
      if (result.success) {
        toast({ title: "Success!", description: result.message })
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

  const handleAutoAssign = async () => {
    setIsAssigning(true)
    toast({ title: "Assigning PDFs..." })
    try {
      const result = await autoAssignPdfs()
      if (result.success) {
        toast({ title: "Success!", description: result.message })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error Assigning PDFs",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Actions</CardTitle>
        <CardDescription>Run tasks that affect the entire application.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleSeedData} disabled={isSeeding || isAssigning} variant="destructive">
          {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Seed Product Data
        </Button>
        <Button onClick={handleAutoAssign} disabled={isSeeding || isAssigning}>
          {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Auto-assign PDFs
        </Button>
      </CardContent>
    </Card>
  )
}
