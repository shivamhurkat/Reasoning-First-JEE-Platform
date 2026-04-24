"use client"

import { useRef, useState } from "react"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { uploadContentImage, deleteContentImage } from "@/lib/supabase/storage"

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024

export function ImageUpload({
  value,
  onChange,
  folder,
}: {
  value: string | null
  onChange: (url: string | null) => void
  folder: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only PNG, JPG, or WebP images are allowed")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 5 MB")
      return
    }
    setUploading(true)
    try {
      const url = await uploadContentImage(file, folder)
      onChange(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove() {
    if (!value) return
    try {
      await deleteContentImage(value)
    } catch {
      // best-effort
    }
    onChange(null)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (value) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Question image"
          className="w-full object-contain max-h-[400px]"
        />
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          className="absolute right-2 top-2"
          onClick={handleRemove}
          aria-label="Remove image"
        >
          <X />
        </Button>
      </div>
    )
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onClick={() => !uploading && inputRef.current?.click()}
      className={cn(
        "flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        uploading && "pointer-events-none opacity-60"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />
      <Upload className="size-8 text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm font-medium">
          {uploading ? "Uploading…" : "Drop image here or click to upload"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPG, WebP — max 5 MB
        </p>
      </div>
    </div>
  )
}
