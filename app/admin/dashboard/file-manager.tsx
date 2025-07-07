"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Upload, Trash2, Copy } from "lucide-react"

import type { UploadedFile } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileUploader } from "../editor/[brandSlug]/file-manager"

export function FileManager({ initialFiles }: { initialFiles: UploadedFile[] }) {
  const router = useRouter()
  const [files, setFiles] = useState(initialFiles || [])
  const [isUploaderOpen, setIsUploaderOpen] = useState(false)

  const handleUploadSuccess = () => {
    toast.success("File uploaded successfully!")
    setIsUploaderOpen(false)
    router.refresh() // This will refetch the files on the server and update the props
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file? This cannot be undone.")) return

    toast.loading("Deleting file...")
    try {
      const response = await fetch(`/api/admin/files?id=${fileId}`, { method: "DELETE" })
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

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path)
    toast.success("File path copied to clipboard.")
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Global File Library</h3>
          <Dialog open={isUploaderOpen} onOpenChange={setIsUploaderOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" /> Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload to Global Library</DialogTitle>
              </DialogHeader>
              <FileUploader onUploadSuccess={handleUploadSuccess} brandId={null} />
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground mb-6">These files are available to be used as logos for any brand.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(files || []).map((file) => (
            <Card key={file.id} className="group relative aspect-square flex items-center justify-center">
              <Image
                src={resolveAssetUrl(file.file_path) || "/placeholder.svg"}
                alt={file.file_name}
                fill
                className="object-contain p-2"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                <p className="text-white text-xs text-center break-all mb-2">{file.file_name}</p>
                <div className="flex gap-2">
                  <Button size="icon" variant="secondary" onClick={() => handleCopyPath(file.file_path)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => handleDelete(file.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        {(!files || files.length === 0) && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No global files found.</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Upload File" to add to the library.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
