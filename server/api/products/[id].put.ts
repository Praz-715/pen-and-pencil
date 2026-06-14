import { eq } from 'drizzle-orm'
import { productSlug } from '~~/app/utils/catalog'
import { slugify } from '~~/app/utils/format'

export default defineEventHandler(async (event) => {
  await requireSeller(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const current = await getProductDb(id)
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })

  const patch: Record<string, unknown> = { updatedAt: new Date() }

  if ('name' in body) {
    const name = String(body.name).trim()
    if (!name) throw createError({ statusCode: 400, statusMessage: 'Nama produk wajib diisi.' })
    patch.name = name
  }
  if ('collectionId' in body) {
    const cid = slugify(String(body.collectionId ?? ''))
    if (!cid) throw createError({ statusCode: 400, statusMessage: 'Koleksi wajib diisi.' })
    patch.collectionId = cid
  }
  if ('concentration' in body) {
    patch.concentration = body.concentration ? String(body.concentration).trim() : null
  }
  if ('image' in body && String(body.image).trim()) patch.image = String(body.image).trim()
  if ('description' in body) patch.description = body.description ? String(body.description).trim() : null
  if ('sizes' in body) {
    const sizes = normalizeSizes(body.sizes)
    if (!sizes.length) throw createError({ statusCode: 400, statusMessage: 'Minimal satu ukuran & harga.' })
    patch.sizes = sizes
  }
  if ('stock' in body) patch.stock = Math.max(0, Math.round(Number(body.stock) || 0))
  if ('isNew' in body) patch.isNew = Boolean(body.isNew)
  if ('active' in body) patch.active = Boolean(body.active)

  // Regenerate slug if name/collection/concentration changed
  if ('name' in patch || 'collectionId' in patch || 'concentration' in patch) {
    const name = (patch.name as string) ?? current.name
    const collectionId = (patch.collectionId as string) ?? current.collectionId
    const conc = 'concentration' in patch ? (patch.concentration as string | null) : current.concentration
    patch.slug = await ensureUniqueSlug(productSlug(collectionId, name, conc), id)
  }

  const [row] = await db.update(schema.product).set(patch).where(eq(schema.product.id, id)).returning()
  return serializeProduct(row)
})
