import { asc, eq } from 'drizzle-orm'

export interface CartRow {
  scentId: number
  ml: number
  qty: number
}

export async function listCart(userId: string): Promise<CartRow[]> {
  return db
    .select({ scentId: schema.cartItem.scentId, ml: schema.cartItem.ml, qty: schema.cartItem.qty })
    .from(schema.cartItem)
    .where(eq(schema.cartItem.userId, userId))
    .orderBy(asc(schema.cartItem.createdAt))
}

export async function listFavorites(userId: string): Promise<number[]> {
  const rows = await db
    .select({ scentId: schema.favorite.scentId })
    .from(schema.favorite)
    .where(eq(schema.favorite.userId, userId))
    .orderBy(asc(schema.favorite.createdAt))
  return rows.map((r) => r.scentId)
}
