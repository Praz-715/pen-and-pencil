import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireSeller(event)
  const rows = await db
    .select({ id: schema.order.id })
    .from(schema.order)
    .where(eq(schema.order.seenBySeller, false))
  return { count: rows.length }
})
