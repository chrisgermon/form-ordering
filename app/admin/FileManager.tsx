"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, Trash2, Copy, ExternalLink } from "lucide-react"
import type { Brand, FileRecord } from "@/lib/types"
import { format } from "date-fns"

interface FileManagerProps {
  brands: Brand[]
}

export function FileManager({ brands }: FileManagerProps) {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchFiles = useCallback(async (brandId: string) => {
    if (!brandId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/files?brandId=${brandId}`)
      if (!response.ok) throw new Error("Failed to fetch files")
      const data = await response.json()
      setFiles(data)
    } catch (error) {
      toast.error("Error fetching files.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (brands && brands.length > 0 && !selectedBrandId) {
      setSelectedBrandId(String(brands[0].id))
    }
  }, [brands, selectedBrandId])

  useEffect(() => {
    if (selectedBrandId) {
      fetchFiles(selectedBrandId)
    }
  }, [selectedBrandId, fetchFiles])

  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !selectedBrandId) return
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("brandId", selectedBrandId)

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error("Upload failed")
      toast.success("File uploaded successfully.")
      fetchFiles(selectedBrandId)
    } catch (error) {
      toast.error("File upload failed.")
      console.error(error)
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ""
    }
  }

  const handleDeleteFile = async (fileUrl: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return
    try {
      const response = await fetch(`/api/admin/files?url=${encodeURIComponent(fileUrl)}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete file")
      toast.success("File deleted successfully.")
      if (selectedBrandId) fetchFiles(selectedBrandId)
    } catch (error) {
      toast.error("Failed to delete file.")
      console.error(error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("URL copied to clipboard!")
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
        <div className="w-full sm:w-auto">
          <Select onValueChange={handleBrandChange} value={selectedBrandId || ""}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Select a brand..." />
            </SelectTrigger>
            <SelectContent>
              {(brands || []).map((brand) => (
                <SelectItem key={brand.id} value={String(brand.id)}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-auto">
          <Button asChild className="w-full">
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload File"}
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={!selectedBrandId || uploading}
              />
            </label>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center py-8">Loading files...</p>
      ) : files.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No files found for this brand.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium truncate max-w-xs">{file.pathname.split("/").pop()}</TableCell>
                <TableCell>{format(new Date(file.created_at), "dd MMM yyyy")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(file.url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteFile(file.url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
