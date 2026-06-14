export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const { data } = await authClient.getSession()
  if (!data?.user) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if ((data.user as { role?: string }).role !== 'seller') {
    return navigateTo('/')
  }
})
