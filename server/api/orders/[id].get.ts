import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const isSeller = (user as { role?: string }).role === 'seller'
  const id = getRouterParam(event, 'id')!

  const [ord] = await db.select().from(schema.order).where(eq(schema.order.id, id))
  if (!ord) throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan.' })
  if (!isSeller && ord.buyerId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Bukan pesanan Anda.' })
  }

  const items = await db.select().from(schema.orderItem).where(eq(schema.orderItem.orderId, id))

  // Seller opening a new order marks it as seen.
  if (isSeller && !ord.seenBySeller) {
    await db.update(schema.order).set({ seenBySeller: true }).where(eq(schema.order.id, id))
    ord.seenBySeller = true
  }

  return { ...ord, items }
})
