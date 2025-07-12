"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Database } from "lucide-react"
import type { SystemActions as SystemActionsType } from "@/lib/types"

export function SystemActions({ actions }: { actions: SystemActionsType }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleRunAction = async (actionName: keyof SystemActionsType, confirmation?: string) => {
    if (confirmation && !confirm(confirmation)) return
    setLoadingAction(actionName)
    try {
      const result = await actions[actionName]()
      alert(result.message)
      if (result.success) {
        window.location.reload()
      }
    } catch (error) {
      alert(`An unexpected error occurred while running ${actionName}.`)
    } finally {
      setLoadingAction(null)
    }
  }

  const actionCards = [
    {
      key: "runSubmissionsFKFix",
      title: "Step 1: Fix Admin Page Error",
      description:
        "Run this if the admin page shows a 'Could not find a relationship' error. This script corrects the link between 'form_submissions' and 'brands' in the database.",
      buttonText: "Fix Submissions Relationship",
      confirmation:
        "This will fix the relationship between submissions and brands. This is likely needed to fix the current admin page error. Run now?",
      variant: "destructive",
      Icon: Database,
    },
    {
      key: "runBrandSchemaCorrection",
      title: "Step 2: Fix Common Schema Errors",
      description:
        "Fixes common column issues (like in the 'brands' table) and forces the API to reload its schema. This is a common solution for production discrepancies.",
      buttonText: "Run Full Schema Correction",
      confirmation: "This will attempt to fix common issues with the 'brands' table schema. Continue?",
      Icon: Database,
    },
    {
      key: "initializeDatabase",
      title: "Initialize Database (Destructive)",
      description:
        "Wipes all data and creates 5 blank brands. Use this for a fresh start. This is a destructive action.",
      buttonText: "Initialize & Reset",
      confirmation:
        "Are you sure you want to initialize the database? This will delete ALL existing data and cannot be undone.",
      variant: "destructive",
      Icon: Database,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Maintenance</CardTitle>
        <CardDescription>
          Use these actions for database setup and to resolve common errors. Follow the steps in order if you're seeing
          issues.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actionCards.map((card) => (
          <Card
            key={card.key}
            className={`p-4 flex flex-col justify-between ${
              card.isPrimary ? "border-blue-500 border-2 shadow-lg" : ""
            }`}
          >
            <div>
              <h3 className={`font-semibold ${card.isPrimary ? "text-blue-700" : ""}`}>{card.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
            </div>
            <Button
              onClick={() => handleRunAction(card.key as keyof SystemActionsType, card.confirmation)}
              disabled={!!loadingAction}
              variant={card.variant as any}
              className={`mt-4 ${card.isPrimary ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
            >
              {loadingAction === card.key ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <card.Icon className="mr-2 h-4 w-4" />
              )}
              {loadingAction === card.key ? "Running..." : card.buttonText}
            </Button>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}
