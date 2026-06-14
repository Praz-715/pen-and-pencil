/** Count of unseen orders for the seller (new-purchase notifications). */
export function useSellerNotifications() {
  const count = useState('seller:notif', () => 0)

  async function refresh() {
    try {
      const r = await $fetch<{ count: number }>('/api/seller/notifications')
      count.value = r.count
    } catch {
      count.value = 0
    }
  }

  return { count, refresh }
}
