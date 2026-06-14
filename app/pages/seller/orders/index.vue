<script setup lang="ts">
definePageMeta({ middleware: 'seller' })
useHead({ title: `Kelola Pesanan — ${SHOP.name}` })

const route = useRoute()
const status = computed(() => (typeof route.query.status === 'string' ? route.query.status : ''))

const { data: orders, pending } = await useFetch<OrderDTO[]>('/api/orders', {
  server: false,
  query: { status },
  default: () => [],
})

const tabs = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Baru' },
  { value: 'processing', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'delivered', label: 'Selesai' },
  { value: 'cancelled', label: 'Batal' },
]
</script>

<template>
  <div class="gutter mx-auto max-w-[1540px] py-8 md:py-12">
    <NuxtLink to="/seller" class="link-underline mb-3 inline-flex items-center gap-1.5 text-sm text-ash">
      <BaseIcon name="arrow-left" :size="15" /> Dashboard
    </NuxtLink>
    <h1 class="font-display text-4xl tracking-tight md:text-5xl">Kelola Pesanan</h1>

    <!-- Filter tabs -->
    <div class="no-scrollbar mt-6 flex gap-2 overflow-x-auto border-b border-smoke pb-3">
      <NuxtLink
        v-for="t in tabs"
        :key="t.value"
        :to="t.value ? `/seller/orders?status=${t.value}` : '/seller/orders'"
        class="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition"
        :class="status === t.value ? 'border-ink bg-ink text-paper' : 'border-smoke text-ink hover:border-ink'"
      >
        {{ t.label }}
      </NuxtLink>
    </div>

    <ClientOnly>
      <div v-if="pending" class="mt-6 space-y-3">
        <div v-for="n in 4" :key="n" class="h-20 animate-pulse bg-fog" />
      </div>

      <div v-else-if="orders.length" class="mt-6 divide-y divide-smoke border-y border-smoke">
        <NuxtLink v-for="o in orders" :key="o.id" :to="`/seller/orders/${o.id}`" class="group flex items-center gap-4 py-4">
          <span class="shrink-0" :class="!o.seenBySeller ? 'size-2 rounded-full bg-ink' : 'size-2'" :aria-label="!o.seenBySeller ? 'baru' : ''" />
          <div class="flex -space-x-3">
            <span v-for="(it, i) in (o.items ?? []).slice(0, 2)" :key="it.id" class="grid size-12 place-items-center rounded-full border-2 border-paper bg-fog" :style="{ zIndex: 2 - i }">
              <img :src="it.image ?? ''" :alt="it.scentName" class="size-full rounded-full object-contain p-1.5" />
            </span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-display text-lg leading-tight">{{ o.code }}</p>
            <p class="truncate text-sm text-ash">{{ o.shipName }} · {{ o.shipCity }} · {{ formatDateTime(o.createdAt) }}</p>
          </div>
          <OrderStatusBadge :status="o.status" />
          <span class="hidden w-28 text-right font-medium sm:block">{{ formatRupiah(o.total) }}</span>
          <BaseIcon name="chevron-right" :size="18" class="text-ash transition-transform group-hover:translate-x-1" />
        </NuxtLink>
      </div>

      <div v-else class="mt-6 grid place-items-center border border-dashed border-smoke py-20 text-center">
        <div>
          <BaseIcon name="package" :size="32" class="mx-auto text-pewter" />
          <p class="mt-4 font-display text-2xl">Tidak ada pesanan</p>
          <p class="mt-1 text-sm text-ash">Belum ada pesanan pada filter ini.</p>
        </div>
      </div>

      <template #fallback>
        <div class="mt-6 h-20 animate-pulse bg-fog" />
      </template>
    </ClientOnly>
  </div>
</template>
