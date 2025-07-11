"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, Loader2 } from "lucide-react"
import type { SystemActions as SystemActionsType } from "@/lib/types"

interface Action {
  id: keyof SystemActionsType
  title: string
  description: string
  action: () => Promise<{ success: boolean; message: string }>
}

export function SystemActions({ actions }: { actions: SystemActionsType }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const systemActions: Action[] = [
    {
      id: "initializeDatabase",
      title: "Seed Database",
      description: "Populate the database with 5 sample brands. Use this for initial setup.",
      action: actions.initializeDatabase,
    },
    {
      id: "autoAssignPdfs",
      title: "Auto-assign PDFs",
      description: "Match uploaded PDFs to form items based on filename.",
      action: actions.autoAssignPdfs,
    },
    {
      id: "runBrandSchemaCorrection",
      title: "Run Full Schema Correction",
      description:
        "Fixes multiple potential schema issues and reloads the schema cache. Run this if you see unexpected errors.",
      action: actions.runBrandSchemaCorrection,
    },
    {
      id: "runPrimaryColorFix",
      title: "Fix Primary Color Column",
      description: "Adds the 'primary_color' column to the brands table if it's missing.",
      action: actions.runPrimaryColorFix,
    },
    {
      id: "forceSchemaReload",
      title: "Force Schema Reload",
      description: "Manually reloads Supabase's schema cache. Useful if you've made manual DB changes.",
      action: actions.forceSchemaReload,
    },
  ]

  const handleAction = async (action: Action) => {
    setLoading(action.id)
    setResult(null)
    const res = await action.action()
    setResult(res)
    setLoading(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Actions</CardTitle>
        <CardDescription>
          Run administrative tasks and database maintenance operations. Use with caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {systemActions.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg flex items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Button onClick={() => handleAction(item)} disabled={!!loading} variant="outline" className="w-24">
                {loading === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run"}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
