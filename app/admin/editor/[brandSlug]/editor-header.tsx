"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { PlusCircle, Save, Loader2 } from "lucide-react"
import { useState } from "react"

interface EditorHeaderProps {
  brandName: string
  onAddSection: (title: string) => void
  onSave: () => void
  isSaving: boolean
  hasChanges: boolean
}

export default function EditorHeader({ brandName, onAddSection, onSave, isSaving, hasChanges }: EditorHeaderProps) {
  const [sectionTitle, setSectionTitle] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAdd = () => {
    if (sectionTitle.trim()) {
      onAddSection(sectionTitle.trim())
      setSectionTitle("")
      setIsDialogOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <h1 className="text-2xl font-bold">
          Editing: <span className="font-semibold text-primary">{brandName}</span>
        </h1>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Section</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="section-title">Section Title</Label>
                <Input
                  id="section-title"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="e.g., Patient Details"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAdd}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={onSave} disabled={!hasChanges || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </header>
  )
}
