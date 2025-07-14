"use client"

import { Button } from "@/components/ui/button"
import { Save, Plus, Trash2, Upload } from "lucide-react"
import type { Brand } from "@/lib/types"

interface EditorHeaderProps {
  brand: Brand
  onAddSection: () => void
  onSave: () => void
  onClear: () => void
  onImport: () => void
  isDirty: boolean
  isSaving: boolean
}

export function EditorHeader({ brand, onAddSection, onSave, onClear, onImport, isDirty, isSaving }: EditorHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-[57px] items-center gap-4 border-b bg-background px-4">
      <h1 className="flex-1 text-xl font-semibold">{brand.name} - Form Editor</h1>
      <Button variant="outline" size="sm" onClick={onImport}>
        <Upload className="mr-2 h-4 w-4" />
        Import from HTML
      </Button>
      <Button variant="outline" size="sm" onClick={onAddSection}>
        <Plus className="mr-2 h-4 w-4" />
        Add Section
      </Button>
      <Button variant="destructive" size="sm" onClick={onClear}>
        <Trash2 className="mr-2 h-4 w-4" />
        Clear Form
      </Button>
      <Button onClick={onSave} disabled={!isDirty || isSaving} size="sm">
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </header>
  )
}
