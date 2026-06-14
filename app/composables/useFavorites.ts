/** DB-backed wishlist (no localStorage). Hydrated by plugins/shop-state.client.ts. */
export function useFavorites() {
  const favorites = useState<number[]>('favorites', () => [])
  const { loggedIn } = useAuth()
  const route = useRoute()

  const count = computed(() => favorites.value.length)

  function isFavorite(id: number): boolean {
    return favorites.value.includes(id)
  }

  async function toggleFavorite(id: number): Promise<void> {
    if (!loggedIn.value) {
      await navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
      return
    }
    favorites.value = await $fetch<number[]>('/api/favorites', { method: 'POST', body: { scentId: id } })
  }

  async function reload(): Promise<void> {
    favorites.value = loggedIn.value ? await $fetch<number[]>('/api/favorites') : []
  }

  return { favorites, count, isFavorite, toggleFavorite, reload }
}
