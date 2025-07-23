"use client"
import { Button } from "@/components/ui/button"
import { ChevronLeft, PlusCircle, Save } from "lucide-react"

interface EditorHeaderProps {
  brandName: string
  onSave: () => void
  onAddSection: () => void
  isSaving: boolean
  hasChanges: boolean
  onNavigate: (path: string) => void
}

export function EditorHeader({ brandName, onSave, onAddSection, isSaving, hasChanges, onNavigate }: EditorHeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => onNavigate("/admin")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Editing: {brandName}</h1>
            {hasChanges && <span className="text-sm text-yellow-600">(Unsaved changes)</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onAddSection}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Section
            </Button>
            <Button onClick={onSave} disabled={isSaving || !hasChanges}>
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Form
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
