"use client"

import { Button } from "@/components/ui/button"
import { PlusCircle, Save } from "lucide-react"
import Link from "next/link"

interface EditorHeaderProps {
  brandName: string
  onAddSection: () => void
  onSave: () => void
  isSaving: boolean
  hasChanges: boolean
}

export default function EditorHeader({ brandName, onAddSection, onSave, isSaving, hasChanges }: EditorHeaderProps) {
  return (
    <div className="flex justify-between items-center pb-4 border-b">
      <div>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">{brandName} Form Editor</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onAddSection}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Section
        </Button>
        <Button onClick={onSave} disabled={!hasChanges || isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
