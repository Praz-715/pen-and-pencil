import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Convert any PNG/JPG/etc to WebP, then persist it:
//   • Production (Vercel) → Vercel Blob (the serverless filesystem is read-only).
//   • Dev → public/img/uploads (served straight from disk).
// Selected automatically by the presence of BLOB_READ_WRITE_TOKEN.
export default defineEventHandler(async (event) => {
  await requireSeller(event)

  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file' && p.filename)
  if (!file || !file.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada file gambar.' })
  }
  if (file.type && !file.type.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'File harus berupa gambar (PNG/JPG).' })
  }
  if (file.data.length > 12 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'Gambar maksimal 12MB.' })
  }

  let webp: Buffer
  try {
    const { default: sharp } = await import('sharp')
    webp = await sharp(file.data)
      .rotate()
      .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    throw createError({ statusCode: 422, statusMessage: 'Gambar tidak bisa diproses.' })
  }

  const filename = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.webp`

  // Production: store on Vercel Blob and return its public URL.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(`products/${filename}`, webp, {
      access: 'public',
      contentType: 'image/webp',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return { image: blob.url, bytes: webp.length }
  }

  // Dev: write under public/img/uploads.
  const dir = join(process.cwd(), 'public', 'img', 'uploads')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), webp)
  return { image: `/img/uploads/${filename}`, bytes: webp.length }
})
