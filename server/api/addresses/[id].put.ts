import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const [owned] = await db
    .select({ id: schema.address.id })
    .from(schema.address)
    .where(and(eq(schema.address.id, id), eq(schema.address.userId, user.id)))
  if (!owned) throw createError({ statusCode: 404, statusMessage: 'Alamat tidak ditemukan.' })

  if (body.isDefault) {
    await db.update(schema.address).set({ isDefault: false }).where(eq(schema.address.userId, user.id))
  }

  const patch: Record<string, unknown> = {}
  for (const f of ['label', 'recipient', 'phone', 'line', 'city', 'province', 'postalCode', 'notes'] as const) {
    if (f in body) patch[f] = body[f] === '' ? null : body[f]
  }
  if ('isDefault' in body) patch.isDefault = Boolean(body.isDefault)

  const [row] = await db.update(schema.address).set(patch).where(eq(schema.address.id, id)).returning()
  return row
})
