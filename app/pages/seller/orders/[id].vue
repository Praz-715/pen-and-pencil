<script setup lang="ts">
definePageMeta({ middleware: 'seller' })
const route = useRoute()
const { data: order, pending, error, refresh } = await useFetch<OrderDTO>(`/api/orders/${route.params.id}`, {
  server: false,
})
useHead({ title: () => (order.value ? `${order.value.code} — Penjual` : 'Pesanan — Penjual') })

const updating = ref(false)
const courier = ref('')
const tracking = ref('')

const actions = computed(() => (order.value ? nextActions(order.value.status) : []))
const canCancel = computed(() => order.value && ['pending', 'processing'].includes(order.value.status))

async function setStatus(status: OrderStatus) {
  if (updating.value) return
  if (status === 'shipped' && !courier.value.trim()) {
    alert('Isi nama kurir dulu.')
    return
  }
  if (status === 'cancelled' && !confirm('Batalkan pesanan ini?')) return
  updating.value = true
  try {
    await $fetch(`/api/orders/${route.params.id}/status`, {
      method: 'PATCH',
      body: {
        status,
        courier: courier.value.trim() || undefined,
        trackingNumber: tracking.value.trim() || undefined,
      },
    })
    await refresh()
  } finally {
    updating.value = false
  }
}
</script>

<template>
  <div class="gutter mx-auto max-w-3xl py-8 md:py-12">
    <NuxtLink to="/seller/orders" class="link-underline mb-3 inline-flex items-center gap-1.5 text-sm text-ash">
      <BaseIcon name="arrow-left" :size="15" /> Kelola pesanan
    </NuxtLink>

    <ClientOnly>
      <div v-if="pending" class="h-96 animate-pulse bg-fog" />
      <div v-else-if="error || !order" class="grid place-items-center border border-dashed border-smoke py-20 text-center">
        <p class="font-display text-2xl">Pesanan tidak ditemukan</p>
      </div>

      <div v-else>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h1 class="font-display text-3xl tracking-tight md:text-4xl">{{ order.code }}</h1>
          <OrderStatusBadge :status="order.status" />
        </div>
        <p class="mt-1 text-sm text-ash">{{ formatDateTime(order.createdAt) }}</p>

        <!-- Fulfillment actions -->
        <section class="mt-8 border border-ink p-5 md:p-6">
          <h2 class="mb-5 font-display text-xl">Proses pesanan</h2>
          <OrderTimeline :order="order" />

          <!-- Shipping inputs when about to ship -->
          <div v-if="order.status === 'processing'" class="mt-5 grid gap-3 border-t border-smoke pt-5 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-semibold text-ash">Kurir</label>
              <input v-model="courier" placeholder="JNE / J&T / SiCepat" class="w-full border border-smoke px-3.5 py-2.5 text-sm outline-none focus:border-ink" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-ash">No. resi</label>
              <input v-model="tracking" placeholder="No. resi" class="w-full border border-smoke px-3.5 py-2.5 text-sm outline-none focus:border-ink" />
            </div>
          </div>

          <div v-if="actions.length || canCancel" class="mt-5 flex flex-wrap gap-3 border-t border-smoke pt-5">
            <button v-for="a in actions" :key="a.status" type="button" class="btn-ink" :disabled="updating" @click="setStatus(a.status)">
              <BaseIcon name="circle-check" :size="17" /> {{ a.label }}
            </button>
            <button v-if="canCancel" type="button" class="btn-line text-ash" :disabled="updating" @click="setStatus('cancelled')">
              Batalkan
            </button>
          </div>
          <p v-else-if="order.status === 'delivered'" class="mt-5 flex items-center gap-2 border-t border-smoke pt-5 text-sm font-medium text-ink">
            <BaseIcon name="circle-check" :size="18" /> Pesanan selesai. Terima kasih!
          </p>
        </section>

        <!-- Buyer / shipping -->
        <section class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="border border-smoke p-5">
            <p class="eyebrow mb-2 text-ash">Kirim ke</p>
            <p class="font-medium">{{ order.shipName }}</p>
            <p class="text-sm text-ash">{{ order.shipPhone }}</p>
            <p class="mt-1 text-sm text-ash">{{ order.shipAddress }}, {{ order.shipCity }} {{ order.shipPostal }}</p>
            <a :href="`https://wa.me/${order.shipPhone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`" target="_blank" rel="noopener" class="link-underline mt-3 inline-flex items-center gap-1.5 text-sm font-semibold">
              <BaseIcon name="whatsapp" :size="15" /> Chat pembeli
            </a>
          </div>
          <div class="border border-smoke p-5">
            <p class="eyebrow mb-2 text-ash">Pembayaran</p>
            <p class="font-medium">{{ order.paymentMethod === 'cod' ? 'COD / Bayar di tempat' : 'Transfer Bank' }}</p>
            <p v-if="order.notes" class="mt-2 text-sm text-ash">Catatan: {{ order.notes }}</p>
          </div>
        </section>

        <!-- Items -->
        <section class="mt-6 border border-smoke">
          <h2 class="border-b border-smoke px-5 py-4 font-display text-xl">Item</h2>
          <ul class="divide-y divide-smoke">
            <li v-for="it in order.items" :key="it.id" class="flex items-center gap-4 px-5 py-4">
              <span class="grid size-14 shrink-0 place-items-center bg-fog">
                <img :src="it.image ?? ''" :alt="it.scentName" class="size-full object-contain p-1.5" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ it.scentName }}</p>
                <p class="text-sm text-ash">{{ it.collection }} · {{ it.ml }}ml × {{ it.qty }}</p>
              </div>
              <span class="shrink-0 text-sm font-medium">{{ formatRupiah(it.lineTotal) }}</span>
            </li>
          </ul>
          <div class="flex justify-between border-t border-smoke px-5 py-4 font-display text-base">
            <span>Total</span><span>{{ formatRupiah(order.total) }}</span>
          </div>
        </section>
      </div>

      <template #fallback>
        <div class="h-96 animate-pulse bg-fog" />
      </template>
    </ClientOnly>
  </div>
</template>
