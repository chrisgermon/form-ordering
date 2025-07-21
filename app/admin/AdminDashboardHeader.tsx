"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
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
import { clearAllSubmissions } from "./actions"
import { Trash2 } from "lucide-react"

interface AdminDashboardHeaderProps {
  onSubmissionsCleared: () => void
}

export function AdminDashboardHeader({ onSubmissionsCleared }: AdminDashboardHeaderProps) {
  const [isPending, startTransition] = useTransition()

  const handleClearSubmissions = () => {
    startTransition(async () => {
      try {
        const result = await clearAllSubmissions()
        if (result.success) {
          toast.success(result.message)
          onSubmissionsCleared()
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        toast.error("An unexpected error occurred.")
      }
    })
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Submissions
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all submissions from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearSubmissions} disabled={isPending}>
              {isPending ? "Clearing..." : "Yes, delete everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
