"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  runSchemaV2Update,
  runSchemaV3Update,
  runSchemaV4Update,
  runSchemaV5Update,
  runSchemaV6Update,
  runSchemaV7Update,
  runSchemaV8Update,
  runSchemaV9Update,
  runSchemaV10Update,
  runSchemaV11Update,
  runSchemaV12Update,
  runSchemaV13Update,
  runSchemaV14Update,
  runSchemaV15Update,
  runSchemaV16Update,
  runSchemaV17Update,
  forceSchemaReload,
  seedDatabase,
  runCodeAssessment,
} from "./actions"
import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface MigrationButtonProps {
  version: string
  description: string
  onRun: () => Promise<{ success: boolean; message: string }>
}

function MigrationButton({ version, description, onRun }: MigrationButtonProps) {
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
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-semibold text-gray-700">Schema Update {version}</p>
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
  const [isAssessing, setIsAssessing] = useState(false) // New state for assessment
  const [assessmentResult, setAssessmentResult] = useState<string | null>(null) // New state for result

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

  // New handler function for the code assessment
  const handleRunAssessment = async () => {
    setIsAssessing(true)
    setAssessmentResult(null)
    toast.loading("Grok is analyzing your code...")
    const result = await runCodeAssessment()
    toast.dismiss()
    if (result.success) {
      setAssessmentResult(result.assessment as string)
      toast.success("Code assessment complete.")
    } else {
      toast.error("Assessment Failed", { description: result.message })
    }
    setIsAssessing(false)
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
          <MigrationButton version="v2" description="Adds more field types." onRun={runSchemaV2Update} />
          <MigrationButton version="v3" description="Adds emails and clinics to brands." onRun={runSchemaV3Update} />
          <MigrationButton version="v4" description="Ensures all item columns exist." onRun={runSchemaV4Update} />
          <MigrationButton version="v5" description="Adds pathname to uploaded files." onRun={runSchemaV5Update} />
          <MigrationButton version="v6" description="Fixes brand emails column." onRun={runSchemaV6Update} />
          <MigrationButton version="v7" description="Adds columns to submissions." onRun={runSchemaV7Update} />
          <MigrationButton version="v8" description="Adds order sequence to brands." onRun={runSchemaV8Update} />
          <MigrationButton version="v9" description="Adds IP address to submissions." onRun={runSchemaV9Update} />
          <MigrationButton version="v10" description="Adds active flag to brands." onRun={runSchemaV10Update} />
          <MigrationButton version="v11" description="Adds order data to submissions." onRun={runSchemaV11Update} />
          <MigrationButton version="v12" description="Adds allowed IPs table." onRun={runSchemaV12Update} />
          <MigrationButton version="v13" description="Adds slug to brands table." onRun={runSchemaV13Update} />
          <MigrationButton version="v14" description="Adds unique constraint to slug." onRun={runSchemaV14Update} />
          <MigrationButton version="v15" description="Adds order number to submissions." onRun={runSchemaV15Update} />
          <MigrationButton version="v16" description="Fixes order number data type." onRun={runSchemaV16Update} />
          <MigrationButton version="v17" description="Adds order prefix to brands." onRun={runSchemaV17Update} />
        </CardContent>
      </Card>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>System Maintenance</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-purple-500" />
              AI Code Assessment
            </CardTitle>
            <CardDescription>
              Use Grok to analyze key project files for bugs, performance, and best practices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRunAssessment} disabled={isAssessing}>
              {isAssessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Run Assessment with Grok
            </Button>
            {assessmentResult && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50 max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-700">{assessmentResult}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
