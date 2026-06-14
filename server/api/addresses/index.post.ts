import { eq } from 'drizzle-orm'

const REQUIRED = ['label', 'recipient', 'phone', 'line', 'city'] as const

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)

  for (const f of REQUIRED) {
    if (!body?.[f] || !String(body[f]).trim()) {
      throw createError({ statusCode: 400, statusMessage: `Kolom "${f}" wajib diisi.` })
    }
  }

  const existing = await db
    .select({ id: schema.address.id })
    .from(schema.address)
    .where(eq(schema.address.userId, user.id))

  const makeDefault = Boolean(body.isDefault) || existing.length === 0
  if (makeDefault) {
    await db.update(schema.address).set({ isDefault: false }).where(eq(schema.address.userId, user.id))
  }

  const [row] = await db
    .insert(schema.address)
    .values({
      userId: user.id,
      label: String(body.label).trim(),
      recipient: String(body.recipient).trim(),
      phone: String(body.phone).trim(),
      line: String(body.line).trim(),
      city: String(body.city).trim(),
      province: body.province ? String(body.province).trim() : null,
      postalCode: body.postalCode ? String(body.postalCode).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      isDefault: makeDefault,
    })
    .returning()

  return row
})
