import { and, eq, sql } from 'drizzle-orm'
import { getCollection } from '~~/app/utils/catalog'

function makeCode() {
  const ts = Date.now().toString(36).toUpperCase().slice(-5)
  const rnd = Math.floor(Math.random() * 900 + 100)
  return `PP-${ts}${rnd}`
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  if ((user as { role?: string }).role === 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Akun penjual tidak bisa memesan.' })
  }

  const body = await readBody(event)

  // Cart lives in the DB — read it from there (source of truth), not from the client.
  const items = await db.select().from(schema.cartItem).where(eq(schema.cartItem.userId, user.id))
  if (!items.length) throw createError({ statusCode: 400, statusMessage: 'Keranjang kosong.' })

  const [addr] = await db
    .select()
    .from(schema.address)
    .where(and(eq(schema.address.id, String(body.addressId)), eq(schema.address.userId, user.id)))
  if (!addr) throw createError({ statusCode: 400, statusMessage: 'Pilih alamat pengiriman yang valid.' })

  // Build line items from the DB (trusted prices) + tally stock needed per product.
  let subtotal = 0
  const lines: Array<typeof schema.orderItem.$inferInsert> = []
  const needPerProduct = new Map<number, number>()

  for (const it of items) {
    const product = await getProductDb(Number(it.scentId))
    if (!product || !product.active) continue
    const size = (product.sizes ?? []).find((s) => s.ml === Number(it.ml))
    if (!size) continue
    const qty = Math.max(1, Math.min(99, Number(it.qty) || 1))
    const lineTotal = size.price * qty
    subtotal += lineTotal
    needPerProduct.set(product.id, (needPerProduct.get(product.id) ?? 0) + qty)
    const col = getCollection(product.collectionId)
    lines.push({
      orderId: '',
      scentId: product.id,
      scentName: product.concentration ? `${product.name} ${product.concentration}` : product.name,
      collection: col?.shortName ?? product.collectionId,
      ml: size.ml,
      unitPrice: size.price,
      qty,
      lineTotal,
      image: product.image,
    })
  }
  if (!lines.length) throw createError({ statusCode: 400, statusMessage: 'Item pesanan tidak valid.' })

  // Stock check (per product, across its sizes)
  for (const [productId, need] of needPerProduct) {
    const p = await getProductDb(productId)
    if (!p || p.stock < need) {
      throw createError({ statusCode: 409, statusMessage: `Stok "${p?.name ?? 'produk'}" tidak mencukupi (sisa ${p?.stock ?? 0}).` })
    }
  }

  const shippingFee = 0
  const total = subtotal + shippingFee
  const paymentMethod = body.paymentMethod === 'cod' ? 'cod' : 'transfer'

  const [ord] = await db
    .insert(schema.order)
    .values({
      code: makeCode(),
      buyerId: user.id,
      status: 'pending',
      paymentMethod,
      subtotal,
      shippingFee,
      total,
      shipLabel: addr.label,
      shipName: addr.recipient,
      shipPhone: addr.phone,
      shipAddress: addr.province ? `${addr.line}, ${addr.province}` : addr.line,
      shipCity: addr.city,
      shipPostal: addr.postalCode,
      notes: body.notes ? String(body.notes).trim() : null,
      seenBySeller: false,
    })
    .returning()

  await db.insert(schema.orderItem).values(lines.map((l) => ({ ...l, orderId: ord.id })))

  // Decrement stock
  for (const [productId, need] of needPerProduct) {
    await db
      .update(schema.product)
      .set({ stock: sql`max(0, ${schema.product.stock} - ${need})`, updatedAt: new Date() })
      .where(eq(schema.product.id, productId))
  }

  // Empty the cart now that it's been converted into an order.
  await db.delete(schema.cartItem).where(eq(schema.cartItem.userId, user.id))

  return { id: ord.id, code: ord.code }
})
