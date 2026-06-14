import type { CartItem } from '~/composables/useCart'

/** Load cart + favorites from the DB when a user is signed in; clear on sign-out. */
export default defineNuxtPlugin(() => {
  const cart = useState<CartItem[]>('cart', () => [])
  const favorites = useState<number[]>('favorites', () => [])
  const session = authClient.useSession()

  async function load(userId: string | undefined) {
    if (!userId) {
      cart.value = []
      favorites.value = []
      return
    }
    try {
      const [c, f] = await Promise.all([
        $fetch<CartItem[]>('/api/cart'),
        $fetch<number[]>('/api/favorites'),
      ])
      cart.value = c
      favorites.value = f
    } catch {
      cart.value = []
      favorites.value = []
    }
  }

  watch(() => session.value.data?.user?.id, (id) => load(id), { immediate: true })
})
