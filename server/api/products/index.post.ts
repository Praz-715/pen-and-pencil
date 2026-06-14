import { productSlug } from '~~/app/utils/catalog'
import { slugify } from '~~/app/utils/format'

export default defineEventHandler(async (event) => {
  await requireSeller(event)
  const body = await readBody(event)

  const name = String(body?.name ?? '').trim()
  const collectionId = slugify(String(body?.collectionId ?? '')) // any collection, normalized to a slug
  const image = String(body?.image ?? '').trim()
  const concentration = body?.concentration ? String(body.concentration).trim() : null
  const sizes = normalizeSizes(body?.sizes)

  if (!name) throw createError({ statusCode: 400, statusMessage: 'Nama produk wajib diisi.' })
  if (!collectionId) throw createError({ statusCode: 400, statusMessage: 'Koleksi wajib diisi.' })
  if (!image) throw createError({ statusCode: 400, statusMessage: 'Gambar produk wajib diunggah.' })
  if (!sizes.length) throw createError({ statusCode: 400, statusMessage: 'Minimal satu ukuran & harga.' })

  const slug = await ensureUniqueSlug(productSlug(collectionId, name, concentration))
  const now = new Date()

  const [row] = await db
    .insert(schema.product)
    .values({
      slug,
      name,
      collectionId,
      concentration,
      image,
      description: body?.description ? String(body.description).trim() : null,
      sizes,
      stock: Math.max(0, Math.round(Number(body?.stock) || 0)),
      isNew: Boolean(body?.isNew),
      active: body?.active === undefined ? true : Boolean(body.active),
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return serializeProduct(row)
})
