import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient()

export interface AppUser {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller'
  phone?: string | null
  image?: string | null
  emailVerified?: boolean
  createdAt?: string
}
