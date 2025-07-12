"use client"

import { Button } from "@/components/ui/button"
import {
  createAdminTables,
  initializeDatabase,
  forceSchemaReload,
  runBrandSchemaCorrection,
  runPrimaryColorFix,
  runSubmissionsFKFix,
  seedPulseRadiologyForm,
} from "@/app/admin/actions"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SystemActions() {
  const { toast } = useToast()

  const handleAction = async (action: () => Promise<{ success: boolean; message: string }>, actionName: string) => {
    try {
      const result = await action()
      if (result.success) {
        toast({
          title: "Success",
          description: `${actionName}: ${result.message}`,
        })
      } else {
        toast({
          title: "Error",
          description: `${actionName}: ${result.message}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast({
        title: "Error",
        description: `An unexpected error occurred during ${actionName}: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Seeding</CardTitle>
          <CardDescription>
            Use these actions to seed specific forms into the database. This will overwrite existing form data for the
            brand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleAction(seedPulseRadiologyForm, "Seed Pulse Radiology Form")}>
              Seed Pulse Radiology Form
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Initialization & Maintenance</CardTitle>
          <CardDescription>
            Run these actions for initial setup or to apply schema updates. Be cautious as some actions can be
            destructive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleAction(createAdminTables, "Create Admin Tables")}>
              Step 0: Create Admin Tables
            </Button>
            <Button onClick={() => handleAction(initializeDatabase, "Initialize Database")}>
              Step 1: Initialize Database (Seed Brands)
            </Button>
            <Button onClick={() => handleAction(forceSchemaReload, "Force Schema Reload")}>Force Schema Reload</Button>
            <Button onClick={() => handleAction(runBrandSchemaCorrection, "Run Brand Schema Correction")}>
              Fix: Brand Schema
            </Button>
            <Button onClick={() => handleAction(runPrimaryColorFix, "Run Primary Color Fix")}>
              Fix: Primary Color
            </Button>
            <Button onClick={() => handleAction(runSubmissionsFKFix, "Run Submissions FK Fix")}>
              Fix: Submissions FK
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
