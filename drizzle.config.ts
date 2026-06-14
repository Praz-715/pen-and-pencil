import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'turso', // libSQL (works for both local file: and Turso URLs)
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./.data/penandpencil.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
})
