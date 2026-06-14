/**
 * Seed the single seller account.
 * Run: npm run db:seed   (loads .env, transpiles via tsx)
 * Idempotent — re-running just ensures the seller role is set.
 */
import { eq } from 'drizzle-orm'
import { auth } from '../lib/auth'
import { db, schema } from '../server/utils/db'

const email = process.env.SELLER_EMAIL || 'penjual@penandpencil.id'
const password = process.env.SELLER_PASSWORD || 'penjual123'
const name = process.env.SELLER_NAME || 'Admin Pen & Pencil'

const existing = await db.select().from(schema.user).where(eq(schema.user.email, email))

if (existing.length) {
  await db.update(schema.user).set({ role: 'seller' }).where(eq(schema.user.email, email))
  console.log(`✔ Seller already exists; role ensured → ${email}`)
} else {
  await auth.api.signUpEmail({ body: { email, password, name } })
  await db.update(schema.user).set({ role: 'seller' }).where(eq(schema.user.email, email))
  console.log(`✔ Seller created → ${email}  (password: ${password})`)
}

process.exit(0)
