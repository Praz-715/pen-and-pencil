import { and, desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!

  const [target] = await db
    .select()
    .from(schema.address)
    .where(and(eq(schema.address.id, id), eq(schema.address.userId, user.id)))
  if (!target) throw createError({ statusCode: 404, statusMessage: 'Alamat tidak ditemukan.' })

  await db.delete(schema.address).where(eq(schema.address.id, id))

  // If we removed the default, promote the most recent remaining address.
  if (target.isDefault) {
    const [next] = await db
      .select()
      .from(schema.address)
      .where(eq(schema.address.userId, user.id))
      .orderBy(desc(schema.address.createdAt))
      .limit(1)
    if (next) await db.update(schema.address).set({ isDefault: true }).where(eq(schema.address.id, next.id))
  }

  return { ok: true }
})
