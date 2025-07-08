"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { Upload, CheckCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { UploadedFile } from "@/lib/types"
import { useRouter } from "next/navigation"
import { resolveAssetUrl } from "@/lib/utils"

interface EditorFileManagerProps {
  uploadedFiles: UploadedFile[]
  logoUrl: string | null
  headerImageUrl: string | null
  onSelectLogo: (pathname: string) => void
  onSelectHeader: (pathname: string) => void
}

export default function EditorFileManager({
  uploadedFiles,
  logoUrl,
  headerImageUrl,
  onSelectLogo,
  onSelectHeader,
}: EditorFileManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    toast.loading("Uploading file...")
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      toast.dismiss()

      if (!response.ok) {
        throw new Error(result.error || "File upload failed")
      }

      toast.success("File uploaded successfully.")
      router.refresh()
    } catch (error) {
      toast.dismiss()
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file? This cannot be undone.")) return

    toast.loading("Deleting file...")
    try {
      const response = await fetch(`/api/admin/files?id=${fileId}`, {
        method: "DELETE",
      })
      toast.dismiss()
      if (!response.ok) throw new Error("Failed to delete file.")
      toast.success("File deleted.")
      router.refresh()
    } catch (error) {
      toast.dismiss()
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload New File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="bg-transparent">
              <label htmlFor="editor-file-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Choose File"}
              </label>
            </Button>
            <Input
              id="editor-file-upload"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedFiles.length === 0 ? (
            <p className="text-muted-foreground">No files uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedFiles.map((file) => (
                <Card key={file.id} className="overflow-hidden group">
                  <div className="relative h-32 bg-gray-100 flex items-center justify-center">
                    {file.content_type?.startsWith("image/") ? (
                      <Image
                        src={resolveAssetUrl(file.pathname) || "/placeholder.svg"}
                        alt={file.original_name}
                        width={128}
                        height={128}
                        className="object-contain h-full w-auto"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <p className="p-4 text-center text-sm text-muted-foreground">Non-image file</p>
                    )}
                  </div>
                  <div className="p-2 text-sm">
                    <p className="truncate font-medium" title={file.original_name}>
                      {file.original_name}
                    </p>
                    <div className="flex flex-col gap-1 mt-2">
                      <Button
                        size="sm"
                        variant={logoUrl === file.pathname ? "default" : "outline"}
                        onClick={() => onSelectLogo(file.pathname)}
                      >
                        {logoUrl === file.pathname && <CheckCircle className="mr-2 h-4 w-4" />}
                        Set as Logo
                      </Button>
                      <Button
                        size="sm"
                        variant={headerImageUrl === file.pathname ? "default" : "outline"}
                        onClick={() => onSelectHeader(file.pathname)}
                      >
                        {headerImageUrl === file.pathname && <CheckCircle className="mr-2 h-4 w-4" />}
                        Set as Header
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="mt-2"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
