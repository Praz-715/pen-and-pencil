import { eq, sql } from 'drizzle-orm'

const ALLOWED = ['processing', 'shipped', 'delivered', 'cancelled'] as const
type Status = (typeof ALLOWED)[number]

export default defineEventHandler(async (event) => {
  await requireSeller(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const next = body?.status as Status

  if (!ALLOWED.includes(next)) {
    throw createError({ statusCode: 400, statusMessage: 'Status tidak valid.' })
  }

  const [ord] = await db.select().from(schema.order).where(eq(schema.order.id, id))
  if (!ord) throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan.' })

  const now = new Date()
  const patch: Record<string, unknown> = { status: next, seenBySeller: true }
  if (next === 'processing') patch.processingAt = now
  if (next === 'shipped') {
    patch.shippedAt = now
    if (body.courier) patch.courier = String(body.courier).trim()
    if (body.trackingNumber) patch.trackingNumber = String(body.trackingNumber).trim()
  }
  if (next === 'delivered') patch.deliveredAt = now
  if (next === 'cancelled') patch.cancelledAt = now

  // Restore stock when cancelling an order that wasn't already cancelled.
  if (next === 'cancelled' && ord.status !== 'cancelled') {
    const items = await db.select().from(schema.orderItem).where(eq(schema.orderItem.orderId, id))
    const restore = new Map<number, number>()
    for (const it of items) restore.set(it.scentId, (restore.get(it.scentId) ?? 0) + it.qty)
    for (const [productId, qty] of restore) {
      await db
        .update(schema.product)
        .set({ stock: sql`${schema.product.stock} + ${qty}`, updatedAt: new Date() })
        .where(eq(schema.product.id, productId))
    }
  }

  const [updated] = await db.update(schema.order).set(patch).where(eq(schema.order.id, id)).returning()
  return updated
})
