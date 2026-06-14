export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const user = await getOptionalUser(event)
  const isSeller = (user as { role?: string } | null)?.role === 'seller'
  const wantAll = isSeller && (q.all === '1' || q.all === 'true')

  const rows = await listProductsDb({
    activeOnly: !wantAll,
    collectionId: typeof q.collection === 'string' ? q.collection : undefined,
  })
  return rows.map(serializeProduct)
})
