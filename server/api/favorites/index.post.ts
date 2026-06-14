import { and, eq } from 'drizzle-orm'

// Toggle a favorite. Returns the updated list of favorited scent ids.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const scentId = Number(body?.scentId)
  if (!Number.isFinite(scentId)) throw createError({ statusCode: 400, statusMessage: 'ID produk tidak valid.' })

  const where = and(eq(schema.favorite.userId, user.id), eq(schema.favorite.scentId, scentId))
  const [existing] = await db.select().from(schema.favorite).where(where)

  if (existing) {
    await db.delete(schema.favorite).where(where)
  } else {
    await db.insert(schema.favorite).values({ userId: user.id, scentId })
  }

  return listFavorites(user.id)
})
