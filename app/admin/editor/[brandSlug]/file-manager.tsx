"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Upload, CheckCircle, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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
import type { UploadedFile } from "@/lib/types"

type EditorFileManagerProps = {
  uploadedFiles: UploadedFile[]
  logoUrl: string | null | undefined
  headerImageUrl: string | null | undefined
  onSelectLogo: (pathname: string) => void
  onSelectHeader: (pathname: string) => void
  brandId: string
}

export default function EditorFileManager({
  uploadedFiles: initialFiles,
  logoUrl,
  headerImageUrl,
  onSelectLogo,
  onSelectHeader,
  brandId,
}: EditorFileManagerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("brandId", brandId)

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const newFile = await response.json()
      setUploadedFiles((prev) => [newFile, ...prev])
      toast({ title: "Success", description: "File uploaded successfully." })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async (pathname: string) => {
    try {
      const response = await fetch(`/api/admin/files?pathname=${encodeURIComponent(pathname)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Delete failed")
      }

      setUploadedFiles((prev) => prev.filter((file) => file.pathname !== pathname))
      toast({ title: "Success", description: "File deleted successfully." })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Brand Files</h3>
        <Button asChild variant="outline">
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload File"}
            <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {uploadedFiles.map((file) => (
          <div key={file.id} className="relative group border rounded-lg overflow-hidden">
            <Image
              src={file.url || "/placeholder.svg"}
              alt={file.pathname}
              width={200}
              height={200}
              className="object-cover w-full h-32"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
              <p className="text-white text-xs text-center break-all mb-2">{file.pathname.split("/").pop()}</p>
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" onClick={() => onSelectLogo(file.pathname)}>
                  Logo
                  {logoUrl === file.pathname && <CheckCircle className="ml-1 h-3 w-3 text-green-400" />}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onSelectHeader(file.pathname)}>
                  Header
                  {headerImageUrl === file.pathname && <CheckCircle className="ml-1 h-3 w-3 text-green-400" />}
                </Button>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the file.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteFile(file.pathname)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
