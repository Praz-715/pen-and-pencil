import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../server/utils/db'
import * as schema from '../server/database/schema'

export const auth = betterAuth({
  appName: 'Pen & Pencil',
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      // assigned server-side only; signup always yields a buyer
      role: { type: 'string', required: false, defaultValue: 'buyer', input: false },
      phone: { type: 'string', required: false, input: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
})

export type AuthSession = typeof auth.$Infer.Session
