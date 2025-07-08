"use client"

import { Button } from "@/components/ui/button"
import { runSchemaV13Update, runSchemaV14Update, runSchemaV15Update, forceSchemaReload, seedDatabase } from "./actions"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

async function handleAction(
  action: () => Promise<{ success: boolean; message?: string; error?: string | null }>,
  loadingMessage = "Running system action...",
  successMessage = "Action completed successfully.",
) {
  const toastId = toast.loading(loadingMessage)
  const result = await action()
  toast.dismiss(toastId)
  if (result.success) {
    toast.success(result.message || successMessage)
  } else {
    toast.error("Action failed", { description: result.error || "An unknown error occurred." })
  }
}

export default function SystemActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Actions</CardTitle>
        <CardDescription>
          Run system-wide actions for database setup and maintenance. Use these with caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            These actions directly modify the database. Only run them if you know what you are doing.
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            onClick={() => handleAction(seedDatabase, "Seeding database...", "Database seeded successfully.")}
            variant="destructive"
            className="w-full"
          >
            Seed Database
          </Button>
          <Button
            onClick={() => handleAction(runSchemaV13Update, "Running v13 update...", "Schema v13 updated.")}
            variant="secondary"
            className="w-full"
          >
            Run Schema Update (v13)
          </Button>
          <Button
            onClick={() => handleAction(runSchemaV14Update, "Running v14 update...", "Schema v14 updated.")}
            variant="secondary"
            className="w-full"
          >
            Run Schema Update (v14)
          </Button>
          <Button
            onClick={() => handleAction(runSchemaV15Update, "Running v15 update...", "Schema v15 updated.")}
            variant="secondary"
            className="w-full"
          >
            Run Schema Update (v15)
          </Button>
          <Button
            onClick={() => handleAction(forceSchemaReload, "Forcing schema reload...", "Schema reloaded.")}
            variant="outline"
            className="w-full"
          >
            Force Schema Reload
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
