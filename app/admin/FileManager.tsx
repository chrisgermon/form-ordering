"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Upload, Trash2, Copy, FileIcon, AlertCircle, Loader2 } from "lucide-react"
import { upload, del } from "@vercel/blob/client"
import type { FileRecord, Brand } from "@/lib/types"
import { format } from "date-fns"
import Image from "next/image"

interface FileManagerProps {
  brands: Brand[]
}

export function FileManager({ brands }: FileManagerProps) {
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>(brands[0]?.id.toString() || "")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFiles = async (brandId: string) => {
    if (!brandId) {
      setFiles([])
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
    if (selectedBrandId) {
      fetchFiles(selectedBrandId)
    } else {
      setLoading(false)
      setFiles([])
    }
  }, [selectedBrandId])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    if (!inputFileRef.current?.files) {
      toast.error("No file selected.")
      return
    }
    if (!selectedBrandId) {
      toast.error("Please select a brand before uploading.")
      return
    }

    const file = inputFileRef.current.files[0]
    const toastId = toast.loading(`Uploading ${file.name}...`)

    try {
      await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `/api/admin/upload?brandId=${selectedBrandId}`,
      })

      await fetchFiles(selectedBrandId)
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

  const handleDelete = async (file: FileRecord) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) return

    const toastId = toast.loading("Deleting file...")
    try {
      await del(file.url)

      const response = await fetch(`/api/admin/files?id=${file.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to delete file from database.")
      }

      toast.success("File deleted successfully.", { id: toastId })
      setFiles(files.filter((f) => f.id !== file.id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      toast.error(errorMessage, { id: toastId })
    }
  }

  const copyToClipboard = (url: string) => {
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
          <Button
            onClick={() => fetchFiles(selectedBrandId)}
            variant="outline"
            size="sm"
            className="mt-4 bg-transparent"
          >
            Try Again
          </Button>
        </div>
      )
    }

    if (files.length === 0) {
      return (
        <div className="text-center text-sm text-gray-500 py-8">
          <p>No files uploaded for this brand yet.</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {files.map((file) => (
          <div key={file.id} className="border rounded-lg p-2 flex flex-col gap-2 group relative">
            <div className="relative h-32 w-full bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
              {file.content_type?.startsWith("image/") ? (
                <Image
                  src={file.url || "/placeholder.svg"}
                  alt={file.original_name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  className="object-contain"
                />
              ) : (
                <FileIcon className="h-16 w-16 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col flex-grow">
              <p className="text-sm font-medium truncate flex-grow" title={file.original_name}>
                {file.original_name}
              </p>
              <p className="text-xs text-gray-500">{format(new Date(file.uploaded_at), "dd MMM yyyy")}</p>
            </div>
            <div className="flex gap-1 mt-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-transparent"
                onClick={() => copyToClipboard(file.url)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDelete(file)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Global File Manager</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => inputFileRef.current?.click()} disabled={!selectedBrandId}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <input type="file" ref={inputFileRef} onChange={handleUpload} className="hidden" />
          </div>
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  )
}
