"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Home, PanelLeft, PlusCircle, Save, Trash2, Upload } from "lucide-react"
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden bg-transparent">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link href="/admin" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Home className="h-5 w-5" />
              Dashboard
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <h1 className="font-semibold text-xl">Editing: {brand.name}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onImport}>
          <Upload className="h-4 w-4 mr-2" />
          Import from HTML
        </Button>
        <Button variant="outline" onClick={onAddSection}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Section
        </Button>
        <Button variant="destructive" onClick={onClear}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Form
        </Button>
        <Button onClick={onSave} disabled={!isDirty || isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </header>
  )
}
