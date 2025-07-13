"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, Trash2, Upload } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

interface EditorHeaderProps {
  brandName: string
  brandId: number
  onAddSection: (title: string) => Promise<{ success: boolean; message: string }>
  onClearForm: (brandId: number) => Promise<{ success: boolean; message: string }>
}

export default function EditorHeader({ brandName, brandId, onAddSection, onClearForm }: EditorHeaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
      toast.info("Data refreshed.")
    })
  }

  const handleAddSection = async () => {
    const title = prompt("Enter a title for the new section:")
    if (title) {
      startTransition(async () => {
        const result = await onAddSection(title)
        if (result.success) {
          toast.success(result.message)
        } else {
          toast.error(result.message)
        }
      })
    }
  }

  const handleClearForm = async () => {
    startTransition(async () => {
      const result = await onClearForm(brandId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="bg-background border-b sticky top-0 z-10 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Editing: <span className="text-primary">{brandName}</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import Form
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Form from URL</DialogTitle>
                <DialogDescription>
                  Paste a URL to a form and we'll try to import it using AI. (This feature is coming soon).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="url" className="text-right">
                    URL
                  </Label>
                  <Input id="url" placeholder="https://example.com/form" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled>
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="secondary" size="sm" onClick={handleAddSection} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isPending}>
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
                <AlertDialogAction onClick={handleClearForm}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
