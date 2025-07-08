"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Upload, CheckCircle, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { UploadedFile } from "@/lib/types"
import { useRouter } from "next/navigation"

interface FileManagerProps {
  uploadedFiles: UploadedFile[]
  logoUrl: string | null
  headerImageUrl: string | null
  onSelectLogo: (url: string) => void
  onSelectHeader: (url: string) => void
}

export function FileManager({
  uploadedFiles,
  logoUrl,
  headerImageUrl,
  onSelectLogo,
  onSelectHeader,
}: FileManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "File upload failed")
      }

      toast({ title: "Success", description: "File uploaded successfully." })
      router.refresh() // Refresh server components to get new file list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async (pathname: string) => {
    if (!confirm("Are you sure you want to delete this file? This cannot be undone.")) return

    try {
      const response = await fetch(`/api/admin/files?pathname=${encodeURIComponent(pathname)}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete file.")
      toast({ title: "Success", description: "File deleted." })
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
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
            <Button asChild variant="outline">
              <label htmlFor="file-upload">
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </label>
            </Button>
            <Input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            {isUploading && <p>Uploading...</p>}
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
                <Card key={file.id} className="overflow-hidden">
                  <div className="relative h-32 bg-gray-100">
                    <Image
                      src={file.url || "/placeholder.svg"}
                      alt={file.original_name}
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                  <div className="p-2 text-sm">
                    <p className="truncate font-medium">{file.original_name}</p>
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
                        onClick={() => handleDeleteFile(file.pathname)}
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
