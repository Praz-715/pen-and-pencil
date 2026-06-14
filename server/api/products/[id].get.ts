export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, statusMessage: 'ID tidak valid.' })

  const row = await getProductDb(id)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })

  const user = await getOptionalUser(event)
  const isSeller = (user as { role?: string } | null)?.role === 'seller'
  if (!row.active && !isSeller) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })

  return serializeProduct(row)
})
