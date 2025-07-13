"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Trash2, RefreshCw } from "lucide-react"
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

type EditorHeaderProps = {
  brandName: string
  brandId: number
  onAddSection: (title: string) => Promise<{ success: boolean; message: string }>
  onClearForm: (id: number) => Promise<{ success: boolean; message: string }>
}

export default function EditorHeader({ brandName, brandId, onAddSection, onClearForm }: EditorHeaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sectionTitle, setSectionTitle] = useState("")

  const handleAddSection = () => {
    if (!sectionTitle.trim()) {
      toast.error("Section title cannot be empty.")
      return
    }
    startTransition(async () => {
      const result = await onAddSection(sectionTitle)
      if (result.success) {
        toast.success(result.message)
        setSectionTitle("")
        document.getElementById("close-add-section-dialog")?.click()
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleClearForm = () => {
    startTransition(async () => {
      const result = await onClearForm(brandId)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="bg-background border-b sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold">Editing: {brandName}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.refresh()} className="bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent">
                <PlusCircle className="h-4 w-4 mr-2" />
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
                  <Button id="close-add-section-dialog" type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button onClick={handleAddSection} disabled={isPending}>
                  {isPending ? "Adding..." : "Add Section"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
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
    </div>
  )
}
