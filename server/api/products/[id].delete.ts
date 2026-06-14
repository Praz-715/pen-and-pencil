import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireSeller(event)
  const id = Number(getRouterParam(event, 'id'))
  const current = await getProductDb(id)
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })

  // Hard delete — past orders keep their own snapshot in order_item, so nothing breaks.
  await db.delete(schema.product).where(eq(schema.product.id, id))
  return { ok: true }
})
