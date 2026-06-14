import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from '../database/schema'

const url = process.env.DATABASE_URL || 'file:./.data/penandpencil.db'
const authToken = process.env.DATABASE_AUTH_TOKEN

const client = createClient(authToken ? { url, authToken } : { url })

export const db = drizzle(client, { schema })
export { schema }
