"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, Trash2, Copy, FileIcon, AlertCircle, Loader2 } from "lucide-react"
import { upload } from "@vercel/blob/client"
import type { UploadedFile } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"
import { format } from "date-fns"

interface FileManagerProps {
  brandId: string
}

export function FileManager({ brandId }: FileManagerProps) {
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFiles = async () => {
    if (!brandId) {
      setError("No Brand ID provided.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/files?brandId=${brandId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch files.")
      }
      const data = await response.json()
      setFiles(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
      toast.error(`Error fetching files: ${errorMessage}`)
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
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `/api/admin/upload?brandId=${brandId}`,
      })

      // After successful upload to blob, we need to refetch the files list
      // as the server-side handleUploadUrl creates the DB record.
      await fetchFiles()
      toast.success("File uploaded successfully!", { id: toastId })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed."
      toast.error(errorMessage, { id: toastId })
    } finally {
      if (inputFileRef.current) {
        inputFileRef.current.value = ""
      }
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) return

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      toast.error(errorMessage, { id: toastId })
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="ml-2 text-gray-500">Loading files...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-red-600 bg-red-50 rounded-md">
          <AlertCircle className="h-8 w-8" />
          <p className="mt-2 font-semibold">Failed to load files</p>
          <p className="text-sm">{error}</p>
          <Button onClick={fetchFiles} variant="outline" size="sm" className="mt-4 bg-transparent">
            Try Again
          </Button>
        </div>
      )
    }

    if (files.length === 0) {
      return <p className="text-center text-sm text-gray-500 py-8">No files uploaded for this brand yet.</p>
    }

    return (
      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between rounded-md border p-2 hover:bg-gray-50">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
              <div className="flex-grow overflow-hidden">
                <a
                  href={resolveAssetUrl(file.pathname) || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-medium text-gray-800 hover:underline"
                  title={file.original_name}
                >
                  {file.original_name}
                </a>
                <p className="text-xs text-gray-500">{format(new Date(file.uploaded_at), "dd MMM yyyy")}</p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
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
    )
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
      <CardContent>{renderContent()}</CardContent>
    </Card>
  )
}
