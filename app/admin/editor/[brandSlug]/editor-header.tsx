"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addSection, clearForm, importFormFromURL } from "./actions"
import { toast } from "sonner"
import { RefreshCw, Plus, Trash2, UploadCloud } from "lucide-react"
import type { Brand } from "@/lib/types"

export default function EditorHeader({ brand }: { brand: Brand }) {
  const router = useRouter()
  const [isAddSectionOpen, setAddSectionOpen] = useState(false)
  const [isClearFormOpen, setClearFormOpen] = useState(false)
  const [isImportFormOpen, setImportFormOpen] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState("")
  const [importUrl, setImportUrl] = useState("")

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) {
      toast.error("Section title cannot be empty.")
      return
    }
    toast.promise(addSection(brand.id, newSectionTitle), {
      loading: "Adding section...",
      success: (res) => {
        if (res.success) {
          setNewSectionTitle("")
          setAddSectionOpen(false)
          router.refresh()
          return res.message
        } else {
          throw new Error(res.message)
        }
      },
      error: (err) => err.message,
    })
  }

  const handleClearForm = async () => {
    toast.promise(clearForm(brand.id), {
      loading: "Clearing form...",
      success: (res) => {
        if (res.success) {
          setClearFormOpen(false)
          router.refresh()
          return res.message
        } else {
          throw new Error(res.message)
        }
      },
      error: (err) => err.message,
    })
  }

  const handleImportForm = async () => {
    if (!importUrl.trim()) {
      toast.error("Please enter a URL to import from.")
      return
    }
    toast.promise(importFormFromURL(brand.id, importUrl), {
      loading: "Starting import process...",
      success: (res) => {
        if (res.success) {
          setImportUrl("")
          setImportFormOpen(false)
          router.refresh()
          return res.message
        } else {
          throw new Error(res.message)
        }
      },
      error: (err) => err.message,
    })
  }

  return (
    <div className="mb-6 p-4 bg-card border rounded-lg flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Form Editor</h1>
        <p className="text-muted-foreground">
          Editing form for: <span className="font-semibold text-primary">{brand.name}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => router.refresh()}>
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
              <DialogTitle>Add New Section</DialogTitle>
              <DialogDescription>Enter a title for the new section.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="section-title" className="text-right">
                  Title
                </Label>
                <Input
                  id="section-title"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setAddSectionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleAddSection}>
                Add Section
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isImportFormOpen} onOpenChange={setImportFormOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UploadCloud className="mr-2 h-4 w-4" />
              Import Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Form from URL</DialogTitle>
              <DialogDescription>
                Paste a URL to a webpage containing a form. We'll use AI to attempt to parse it. (This is a placeholder
                feature).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="import-url" className="text-right">
                  URL
                </Label>
                <Input
                  id="import-url"
                  placeholder="https://example.com/form.html"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setImportFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleImportForm}>
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isClearFormOpen} onOpenChange={setClearFormOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete all sections and items associated with this
                form.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setClearFormOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClearForm}>
                Yes, clear form
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
