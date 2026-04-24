import { createClient } from "@/lib/supabase/client"

const BUCKET = "content-images"

export async function uploadContentImage(file: File, folder: string): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteContentImage(url: string): Promise<void> {
  const supabase = createClient()
  const marker = `/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const path = decodeURIComponent(url.slice(idx + marker.length))
  await supabase.storage.from(BUCKET).remove([path])
}
