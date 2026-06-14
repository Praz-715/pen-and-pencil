import { and, eq } from 'drizzle-orm'

// DELETE /api/cart?all=1  → clear; DELETE /api/cart?scentId=&ml=  → remove one line.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const q = getQuery(event)

  if (q.all === '1' || q.all === 'true') {
    await db.delete(schema.cartItem).where(eq(schema.cartItem.userId, user.id))
    return listCart(user.id)
  }

  const scentId = Number(q.scentId)
  const ml = Number(q.ml)
  await db
    .delete(schema.cartItem)
    .where(and(eq(schema.cartItem.userId, user.id), eq(schema.cartItem.scentId, scentId), eq(schema.cartItem.ml, ml)))
  return listCart(user.id)
})
