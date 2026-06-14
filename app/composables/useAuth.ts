/** Reactive auth state backed by Better Auth's Vue client. */
export function useAuth() {
  const session = authClient.useSession()

  const user = computed(() => (session.value.data?.user ?? null) as AppUser | null)
  const loggedIn = computed(() => !!user.value)
  const isSeller = computed(() => user.value?.role === 'seller')
  const pending = computed(() => session.value.isPending)

  async function signOut() {
    await authClient.signOut()
    await navigateTo('/login')
  }

  return { session, user, loggedIn, isSeller, pending, signOut }
}
