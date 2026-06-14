import type { H3Event } from 'h3'
import { auth } from '~~/lib/auth'

export async function getOptionalUser(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers })
  return session?.user ?? null
}

export async function requireUser(event: H3Event) {
  const user = await getOptionalUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Silakan masuk terlebih dahulu.' })
  return user
}

export async function requireSeller(event: H3Event) {
  const user = await requireUser(event)
  if ((user as { role?: string }).role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Khusus penjual.' })
  }
  return user
}
