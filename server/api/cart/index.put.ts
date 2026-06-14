import { and, eq } from 'drizzle-orm'

// Set absolute qty for a cart line (qty<=0 removes it), capped at stock.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const scentId = Number(body?.scentId)
  const ml = Number(body?.ml)
  let qty = Math.round(Number(body?.qty) || 0)

  const where = and(
    eq(schema.cartItem.userId, user.id),
    eq(schema.cartItem.scentId, scentId),
    eq(schema.cartItem.ml, ml),
  )

  if (qty <= 0) {
    await db.delete(schema.cartItem).where(where)
    return listCart(user.id)
  }

  const product = await getProductDb(scentId)
  if (product) qty = Math.min(qty, product.stock)
  if (qty <= 0) {
    await db.delete(schema.cartItem).where(where)
    return listCart(user.id)
  }

  const [existing] = await db.select().from(schema.cartItem).where(where)
  if (existing) await db.update(schema.cartItem).set({ qty }).where(eq(schema.cartItem.id, existing.id))
  else await db.insert(schema.cartItem).values({ userId: user.id, scentId, ml, qty })

  return listCart(user.id)
})
