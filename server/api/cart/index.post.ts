import { and, eq } from 'drizzle-orm'

// Add to cart (adds to existing qty for the same scent+size), capped at stock.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  if ((user as { role?: string }).role === 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Akun penjual tidak punya keranjang.' })
  }
  const body = await readBody(event)
  const scentId = Number(body?.scentId)
  const ml = Number(body?.ml)
  const addQty = Math.max(1, Number(body?.qty) || 1)

  const product = await getProductDb(scentId)
  if (!product || !product.active) throw createError({ statusCode: 400, statusMessage: 'Produk tidak tersedia.' })
  const size = (product.sizes ?? []).find((s) => s.ml === ml)
  if (!size) throw createError({ statusCode: 400, statusMessage: 'Ukuran tidak valid.' })
  if (product.stock <= 0) throw createError({ statusCode: 409, statusMessage: 'Stok habis.' })

  const [existing] = await db
    .select()
    .from(schema.cartItem)
    .where(and(eq(schema.cartItem.userId, user.id), eq(schema.cartItem.scentId, scentId), eq(schema.cartItem.ml, ml)))

  const newQty = Math.min((existing?.qty ?? 0) + addQty, product.stock)
  if (existing) {
    await db.update(schema.cartItem).set({ qty: newQty }).where(eq(schema.cartItem.id, existing.id))
  } else {
    await db.insert(schema.cartItem).values({ userId: user.id, scentId, ml, qty: newQty })
  }

  return listCart(user.id)
})
