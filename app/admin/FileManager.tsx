"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, Trash2, Copy, FileIcon } from "lucide-react"
import { upload } from "@vercel/blob/client"
import type { UploadedFile } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"

interface FileManagerProps {
  brandId: string
}

export function FileManager({ brandId }: FileManagerProps) {
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFiles = async () => {
    if (!brandId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/files?brandId=${brandId}`)
      if (!response.ok) throw new Error("Failed to fetch files.")
      const data = await response.json()
      setFiles(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [brandId])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    if (!inputFileRef.current?.files || !brandId) {
      toast.error("No file selected or brand ID is missing.")
      return
    }

    const file = inputFileRef.current.files[0]
    const toastId = toast.loading(`Uploading ${file.name}...`)

    try {
      await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        clientPayload: JSON.stringify({ brandId }),
      })

      toast.success("File uploaded successfully!", { id: toastId })
      fetchFiles()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.", { id: toastId })
    } finally {
      if (inputFileRef.current) {
        inputFileRef.current.value = ""
      }
    }
  }

  const handleDelete = async (fileId: string) => {
    const toastId = toast.loading("Deleting file...")
    try {
      const response = await fetch("/api/admin/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: [fileId] }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to delete file.")
      }

      toast.success("File deleted successfully.", { id: toastId })
      setFiles(files.filter((f) => f.id !== fileId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.", { id: toastId })
    }
  }

  const copyToClipboard = (pathname: string) => {
    const url = resolveAssetUrl(pathname)
    if (url) {
      navigator.clipboard.writeText(url)
      toast.success("URL copied to clipboard!")
    } else {
      toast.error("Could not resolve file URL.")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>File Manager</CardTitle>
        <Button size="sm" onClick={() => inputFileRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
        <input type="file" ref={inputFileRef} onChange={handleUpload} className="hidden" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading files...</p>
        ) : files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
                  <a
                    href={resolveAssetUrl(file.pathname) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm hover:underline"
                    title={file.original_name}
                  >
                    {file.original_name}
                  </a>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(file.pathname)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(file.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500">No files uploaded for this brand.</p>
        )}
      </CardContent>
    </Card>
  )
}
