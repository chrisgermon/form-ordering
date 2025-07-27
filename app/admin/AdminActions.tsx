"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { seedDatabase } from "./actions"
import { Loader2 } from "lucide-react"

export default function AdminActions() {
  const [isSeeding, setIsSeeding] = useState(false)
  const { toast } = useToast()

  const handleSeedDatabase = async () => {
    if (window.confirm("Are you sure you want to seed the database? This will delete all existing data.")) {
      setIsSeeding(true)
      const result = await seedDatabase()
      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
      setIsSeeding(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleSeedDatabase} disabled={isSeeding}>
        {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Seed Database
      </Button>
    </div>
  )
}
