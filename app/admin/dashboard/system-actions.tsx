"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  runSchemaV2Update,
  runSchemaV4Update,
  runSchemaV5Update,
  runSchemaV7Update,
  runSchemaV9Update,
  runSchemaV10Update,
  runSchemaV11Update,
  runSchemaV12Update,
  runSchemaV14Update,
  runSchemaV15Update,
  runSchemaV16Update,
  runSchemaV21Update,
  forceSchemaReload,
  seedDatabase,
} from "./actions"
import { useState } from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface MigrationButtonProps {
  version: string
  description: string
  onRun: () => Promise<{ success: boolean; message: string }>
  isCritical?: boolean
}

function MigrationButton({ version, description, onRun, isCritical = false }: MigrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    const result = await onRun()
    if (result.success) {
      toast.success(`Schema Update ${version}`, { description: result.message })
    } else {
      toast.error(`Schema Update ${version} Failed`, { description: result.message })
    }
    setIsLoading(false)
  }

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${isCritical ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"}`}
    >
      <div>
        <p className="font-semibold text-gray-700 flex items-center">
          {isCritical && <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />}
          Schema Update {version}
        </p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Button onClick={handleClick} disabled={isLoading} variant="outline" size="sm">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Run Update
      </Button>
    </div>
  )
}

export default function SystemActions() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSeedDatabase = async () => {
    setIsLoading(true)
    const confirmation = confirm(
      "Are you sure you want to seed the database? This will delete existing brands and add sample data.",
    )
    if (confirmation) {
      const result = await seedDatabase()
      if (result.success) {
        toast.success("Database Seeding", { description: result.message })
      } else {
        toast.error("Database Seeding Failed", { description: result.message })
      }
    }
    setIsLoading(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Migrations</CardTitle>
          <CardDescription>
            Run these updates to apply new features or fixes to your database schema. Run them in order if you are
            setting up a new instance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <MigrationButton
            version="v21"
            description="CRITICAL FIX: Aligns the brands table with all required fields."
            onRun={runSchemaV21Update}
            isCritical={true}
          />
          <MigrationButton version="v16" description="Fixes order number data type." onRun={runSchemaV16Update} />
          <MigrationButton version="v15" description="Adds order number to submissions." onRun={runSchemaV15Update} />
          <MigrationButton version="v14" description="Adds unique constraint to slug." onRun={runSchemaV14Update} />
          <MigrationButton version="v12" description="Adds allowed IPs table." onRun={runSchemaV12Update} />
          <MigrationButton version="v11" description="Adds order data to submissions." onRun={runSchemaV11Update} />
          <MigrationButton version="v10" description="Adds active flag to brands." onRun={runSchemaV10Update} />
          <MigrationButton version="v9" description="Adds IP address to submissions." onRun={runSchemaV9Update} />
          <MigrationButton version="v7" description="Adds columns to submissions." onRun={runSchemaV7Update} />
          <MigrationButton version="v5" description="Adds pathname to uploaded files." onRun={runSchemaV5Update} />
          <MigrationButton version="v4" description="Ensures all item columns exist." onRun={runSchemaV4Update} />
          <MigrationButton version="v2" description="Adds more field types." onRun={runSchemaV2Update} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>System Actions</CardTitle>
          <CardDescription>Perform system-level actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-700">Force Schema Reload</p>
              <p className="text-sm text-gray-500">Notifies the API to reload the schema.</p>
            </div>
            <Button onClick={forceSchemaReload} variant="outline" size="sm">
              Reload Schema
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertTitle>Seed Database</AlertTitle>
            <AlertDescription>
              This will delete all existing brands, sections, and items, and replace them with sample data. Use with
              caution.
            </AlertDescription>
            <Button onClick={handleSeedDatabase} disabled={isLoading} variant="destructive" className="mt-4">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Seed Database
            </Button>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
