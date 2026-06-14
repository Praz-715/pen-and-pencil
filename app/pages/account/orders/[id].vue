<script setup lang="ts">
definePageMeta({ middleware: 'buyer' })
const route = useRoute()
const { data: order, pending, error } = await useFetch<OrderDTO>(`/api/orders/${route.params.id}`, {
  server: false,
})
useHead({ title: () => (order.value ? `${order.value.code} — ${SHOP.name}` : `Pesanan — ${SHOP.name}`) })
</script>

<template>
  <div class="gutter mx-auto max-w-3xl py-8 md:py-12">
    <NuxtLink to="/account/orders" class="link-underline mb-3 inline-flex items-center gap-1.5 text-sm text-ash">
      <BaseIcon name="arrow-left" :size="15" /> Pesanan saya
    </NuxtLink>

    <ClientOnly>
      <div v-if="pending" class="h-96 animate-pulse bg-fog" />
      <div v-else-if="error || !order" class="grid place-items-center border border-dashed border-smoke py-20 text-center">
        <div>
          <p class="font-display text-2xl">Pesanan tidak ditemukan</p>
          <NuxtLink to="/account/orders" class="btn-ink mt-6">Kembali</NuxtLink>
        </div>
      </div>

      <div v-else>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h1 class="font-display text-3xl tracking-tight md:text-4xl">{{ order.code }}</h1>
          <OrderStatusBadge :status="order.status" />
        </div>
        <p class="mt-1 text-sm text-ash">Dibuat {{ formatDateTime(order.createdAt) }}</p>

        <!-- Tracking -->
        <section class="mt-8 border border-smoke p-5 md:p-6">
          <h2 class="mb-5 font-display text-xl">Lacak pesanan</h2>
          <OrderTimeline :order="order" />
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
          <dl class="space-y-2 border-t border-smoke px-5 py-4 text-sm">
            <div class="flex justify-between"><dt class="text-ash">Subtotal</dt><dd>{{ formatRupiah(order.subtotal) }}</dd></div>
            <div class="flex justify-between"><dt class="text-ash">Ongkir</dt><dd>{{ order.shippingFee ? formatRupiah(order.shippingFee) : 'Dihitung penjual' }}</dd></div>
            <div class="flex justify-between border-t border-smoke pt-2 font-display text-base"><dt>Total</dt><dd>{{ formatRupiah(order.total) }}</dd></div>
          </dl>
        </section>

        <!-- Shipping + payment -->
        <section class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="border border-smoke p-5">
            <p class="eyebrow mb-2 text-ash">Dikirim ke</p>
            <p class="font-medium">{{ order.shipName }}</p>
            <p class="text-sm text-ash">{{ order.shipPhone }}</p>
            <p class="mt-1 text-sm text-ash">{{ order.shipAddress }}, {{ order.shipCity }} {{ order.shipPostal }}</p>
          </div>
          <div class="border border-smoke p-5">
            <p class="eyebrow mb-2 text-ash">Pembayaran</p>
            <p class="font-medium">{{ order.paymentMethod === 'cod' ? 'COD / Bayar di tempat' : 'Transfer Bank' }}</p>
            <p v-if="order.notes" class="mt-2 text-sm text-ash">Catatan: {{ order.notes }}</p>
            <a :href="whatsappLink(`Halo ${SHOP.name}, mau tanya pesanan ${order.code}`)" target="_blank" rel="noopener" class="link-underline mt-3 inline-flex items-center gap-1.5 text-sm font-semibold">
              <BaseIcon name="whatsapp" :size="15" /> Tanya penjual
            </a>
          </div>
        </section>
      </div>

      <template #fallback>
        <div class="h-96 animate-pulse bg-fog" />
      </template>
    </ClientOnly>
  </div>
</template>
