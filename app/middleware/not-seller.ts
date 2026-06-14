/** Allow guests & buyers; bounce the seller to their dashboard (no shopping for the seller). */
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return
  const { data } = await authClient.getSession()
  if (data?.user && (data.user as { role?: string }).role === 'seller') {
    return navigateTo('/seller')
  }
})
