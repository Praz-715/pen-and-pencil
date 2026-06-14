import { and, desc, eq, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const isSeller = (user as { role?: string }).role === 'seller'
  const q = getQuery(event)

  const conds = []
  if (!isSeller) conds.push(eq(schema.order.buyerId, user.id))
  if (typeof q.status === 'string' && q.status) conds.push(eq(schema.order.status, q.status))

  const orders = await db
    .select()
    .from(schema.order)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schema.order.createdAt))

  if (!orders.length) return []

  // Attach line items in one query
  const ids = orders.map((o) => o.id)
  const items = await db.select().from(schema.orderItem).where(inArray(schema.orderItem.orderId, ids))
  const byOrder = new Map<string, typeof items>()
  for (const it of items) {
    const arr = byOrder.get(it.orderId) ?? []
    arr.push(it)
    byOrder.set(it.orderId, arr)
  }

  return orders.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] }))
})
