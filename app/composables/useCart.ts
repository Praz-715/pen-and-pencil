export interface CartItem {
  scentId: number
  ml: number
  qty: number
}

/** DB-backed cart (no localStorage). State is hydrated by plugins/shop-state.client.ts
 *  and kept in sync by mutations that return the fresh cart from the server. */
export function useCart() {
  const cart = useState<CartItem[]>('cart', () => [])
  const { loggedIn } = useAuth()
  const route = useRoute()

  const count = computed(() => cart.value.reduce((n, i) => n + i.qty, 0))

  async function requireLogin(): Promise<boolean> {
    if (loggedIn.value) return true
    await navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return false
  }

  async function addToCart(scentId: number, ml: number, qty = 1): Promise<void> {
    if (!(await requireLogin())) return
    cart.value = await $fetch<CartItem[]>('/api/cart', { method: 'POST', body: { scentId, ml, qty } })
  }

  async function updateQty(scentId: number, ml: number, qty: number): Promise<void> {
    cart.value = await $fetch<CartItem[]>('/api/cart', { method: 'PUT', body: { scentId, ml, qty } })
  }

  async function removeItem(scentId: number, ml: number): Promise<void> {
    cart.value = await $fetch<CartItem[]>('/api/cart', { method: 'DELETE', query: { scentId, ml } })
  }

  async function clear(): Promise<void> {
    cart.value = await $fetch<CartItem[]>('/api/cart', { method: 'DELETE', query: { all: '1' } })
  }

  async function reload(): Promise<void> {
    cart.value = loggedIn.value ? await $fetch<CartItem[]>('/api/cart') : []
  }

  return { cart, count, addToCart, updateQty, removeItem, clear, reload }
}
