"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { runSeedDatabase, autoAssignPdfs } from "./actions"

export default function AdminActions() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSeedDatabase = async () => {
    if (!confirm("Are you sure you want to re-seed the database? This will reset all product and section data.")) {
      return
    }
    setIsSeeding(true)
    toast({
      title: "Seeding Database...",
      description: "This may take a moment.",
    })
    try {
      const result = await runSeedDatabase()
      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        })
        router.refresh()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error Seeding",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleAutoAssign = async () => {
    setIsAssigning(true)
    toast({
      title: "Assigning PDFs...",
      description: "Matching uploaded PDFs to product items.",
    })
    try {
      const result = await autoAssignPdfs()
      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        })
        router.refresh()
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Admin Actions</CardTitle>
        <CardDescription>Run administrative tasks for the application.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleSeedDatabase} disabled={isSeeding || isAssigning} variant="destructive">
          {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Seed Database
        </Button>
        <Button onClick={handleAutoAssign} disabled={isSeeding || isAssigning}>
          {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Auto-assign PDFs
        </Button>
      </CardContent>
    </Card>
  )
}
