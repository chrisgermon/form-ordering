"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { addSection, clearForm, importFormFromURL } from "./actions"
import type { Brand } from "@/lib/types"
import { RefreshCw, Plus, Trash2, Upload } from "lucide-react"

export default function EditorHeader({ brand }: { brand: Brand }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAddSectionOpen, setAddSectionOpen] = useState(false)
  const [isImportOpen, setImportOpen] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState("")
  const [importUrl, setImportUrl] = useState("")

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) {
      toast.error("Section title cannot be empty.")
      return
    }
    startTransition(async () => {
      const result = await addSection(brand.id, newSectionTitle)
      if (result.success) {
        toast.success(result.message)
        setNewSectionTitle("")
        setAddSectionOpen(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleClearForm = () => {
    startTransition(async () => {
      const result = await clearForm(brand.id)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleImport = () => {
    if (!importUrl.trim()) {
      toast.error("Please enter a URL.")
      return
    }
    startTransition(async () => {
      const result = await importFormFromURL(brand.id, importUrl)
      if (result.success) {
        toast.info(result.message)
        setImportUrl("")
        setImportOpen(false)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Form Editor</h1>
        <p className="text-muted-foreground">
          Editing form for: <span className="font-semibold text-primary">{brand.name}</span>
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={() => router.refresh()} disabled={isPending}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>

        <Dialog open={isAddSectionOpen} onOpenChange={setAddSectionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Section</DialogTitle>
              <DialogDescription>Enter a title for the new section below.</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="e.g., Patient Details"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddSectionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSection} disabled={isPending}>
                {isPending ? "Adding..." : "Add Section"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isImportOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Form</DialogTitle>
              <DialogDescription>
                Paste a URL to import a form. This feature is currently a placeholder.
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="https://example.com/form.html"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isPending}>
                {isPending ? "Importing..." : "Import"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Form
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all sections and items from this form.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearForm} disabled={isPending}>
                {isPending ? "Clearing..." : "Yes, clear form"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
