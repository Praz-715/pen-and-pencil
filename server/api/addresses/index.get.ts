import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return db
    .select()
    .from(schema.address)
    .where(eq(schema.address.userId, user.id))
    .orderBy(desc(schema.address.isDefault), desc(schema.address.createdAt))
})
