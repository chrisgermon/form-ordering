"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Image from "next/image"
import { Copy, Trash2 } from "lucide-react"

interface FileObject {
  name: string
  url: string
}

export default function FileManager() {
  const [files, setFiles] = useState<FileObject[]>([])
  const [uploading, setUploading] = useState(false)

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/admin/files")
      if (!response.ok) throw new Error("Failed to fetch files")
      const data = await response.json()
      setFiles(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred")
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      toast.success("File uploaded successfully")
      fetchFiles() // Refresh file list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("URL copied to clipboard")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input type="file" onChange={handleFileUpload} disabled={uploading} />
          {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <div key={file.name} className="border rounded-lg p-2 flex flex-col items-center">
              <Image
                src={file.url || "/placeholder.svg"}
                alt={file.name}
                width={100}
                height={100}
                className="object-contain h-24 w-24"
              />
              <p className="text-xs truncate w-full text-center mt-2" title={file.name}>
                {file.name}
              </p>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(file.url)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
