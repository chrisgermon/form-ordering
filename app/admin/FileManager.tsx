"use client"

import type React from "react"

import { useState, useEffect, useTransition } from "react"
import { Upload, Trash2, Copy, Download, FileIcon, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { Brand, FileRecord } from "@/lib/types"
import { deleteFile } from "@/app/admin/actions"

async function fetchFiles(brandId: string | null): Promise<FileRecord[]> {
  const query = brandId ? `?brandId=${brandId}` : ""
  const response = await fetch(`/api/admin/files${query}`)
  if (!response.ok) {
    throw new Error("Failed to fetch files")
  }
  return response.json()
}

export function FileManager({ brands, files }: { brands: Brand[]; files: FileRecord[] }) {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [fileList, setFileList] = useState<FileRecord[]>(files || [])
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setFileList(files || [])
  }, [files])

  const handleBrandChange = (brandId: string) => {
    const newBrandId = brandId === "all" ? null : brandId
    setSelectedBrandId(newBrandId)
    setIsLoading(true)
    startTransition(async () => {
      try {
        const fetchedFiles = await fetchFiles(newBrandId)
        setFileList(fetchedFiles)
      } catch (error) {
        toast.error("Failed to load files for the selected brand.")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!selectedBrandId) {
      toast.error("Please select a brand before uploading a file.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("brandId", selectedBrandId)

    setIsLoading(true)
    const toastId = toast.loading("Uploading file...")

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
      setFileList((prevFiles) => [newFile, ...prevFiles])
      toast.success("File uploaded successfully!", { id: toastId })
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred."
      toast.error(`Upload failed: ${message}`, { id: toastId })
    } finally {
      setIsLoading(false)
      event.target.value = "" // Reset file input
    }
  }

  const handleDeleteFile = async (fileUrl: string) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      return
    }
    const toastId = toast.loading("Deleting file...")
    startTransition(async () => {
      const result = await deleteFile(fileUrl)
      if (result.success) {
        setFileList((prevFiles) => prevFiles.filter((f) => f.url !== fileUrl))
        toast.success("File deleted successfully.", { id: toastId })
      } else {
        toast.error(`Failed to delete file: ${result.error}`, { id: toastId })
      }
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("URL copied to clipboard!")
  }

  const getFileIcon = (contentType: string | null) => {
    if (contentType?.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-gray-500" />
    }
    return <FileIcon className="h-5 w-5 text-gray-500" />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>File Manager</CardTitle>
        <div className="flex items-center gap-4">
          <Select onValueChange={handleBrandChange} defaultValue={selectedBrandId || "all"}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {Array.isArray(brands) &&
                brands.map((brand) => (
                  <SelectItem key={brand.id} value={String(brand.id)}>
                    {brand.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button asChild variant="outline" disabled={!selectedBrandId || isLoading}>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Label>
          </Button>
          <Input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={!selectedBrandId || isLoading}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-[40px_1fr_1fr_150px_180px] items-center border-b bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">
            <div></div>
            <div>Filename</div>
            <div>Brand</div>
            <div>Uploaded At</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {isLoading || isPending ? (
              <div className="p-4 text-center text-gray-500">Loading files...</div>
            ) : Array.isArray(fileList) && fileList.length > 0 ? (
              fileList.map((file) => (
                <div key={file.id} className="grid grid-cols-[40px_1fr_1fr_150px_180px] items-center px-4 py-2 text-sm">
                  <div className="flex items-center justify-center">{getFileIcon(file.content_type)}</div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate font-medium text-blue-600 hover:underline"
                    title={file.pathname}
                  >
                    {file.pathname.split("/").pop()}
                  </a>
                  <div className="truncate text-gray-600">
                    {brands.find((b) => b.id === file.brand_id)?.name || "N/A"}
                  </div>
                  <div className="text-gray-600">{new Date(file.uploaded_at).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(file.url)} title="Copy URL">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <a href={file.url} download target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.url)} title="Delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No files found.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
