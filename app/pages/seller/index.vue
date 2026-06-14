<script setup lang="ts">
definePageMeta({ middleware: 'seller' })
useHead({ title: `Dashboard Penjual — ${SHOP.name}` })

const { user } = useAuth()

interface Period { revenue: number; orders: number; bottles: number }
interface StatsResp {
  stats: { today: Period; week: Period; month: Period; all: Period }
  pipeline: { pending: number; processing: number; shipped: number; delivered: number }
}

const { data: stats } = await useFetch<StatsResp>('/api/seller/stats', { server: false })
const { data: orders } = await useFetch<OrderDTO[]>('/api/orders', { server: false, default: () => [] })

const recent = computed(() => orders.value.slice(0, 6))
const newCount = computed(() => orders.value.filter((o) => !o.seenBySeller).length)

const periodCards = computed(() => {
  const s = stats.value?.stats
  return [
    { key: 'today', label: 'Hari ini', data: s?.today },
    { key: 'week', label: 'Minggu ini', data: s?.week },
    { key: 'month', label: 'Bulan ini', data: s?.month },
    { key: 'all', label: 'Semua waktu', data: s?.all },
  ]
})
</script>

<template>
  <div class="gutter mx-auto max-w-[1540px] py-8 md:py-12">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow text-ash">Dashboard penjual</p>
        <h1 class="mt-2 font-display text-4xl tracking-tight md:text-5xl">Halo, {{ user?.name?.split(' ')[0] }}</h1>
      </div>
      <div class="flex flex-wrap gap-3">
        <NuxtLink to="/seller/products" class="btn-line">
          <BaseIcon name="droplet" :size="16" /> Kelola produk
        </NuxtLink>
        <NuxtLink to="/seller/orders" class="btn-ink">
          <BaseIcon name="package" :size="16" /> Kelola pesanan
          <ClientOnly><span v-if="newCount" class="ml-1 grid size-5 place-items-center rounded-full bg-paper text-[11px] font-bold text-ink">{{ newCount }}</span></ClientOnly>
        </NuxtLink>
      </div>
    </div>

    <ClientOnly>
      <!-- New orders banner -->
      <NuxtLink
        v-if="newCount"
        to="/seller/orders?status=pending"
        class="mt-6 flex items-center gap-3 border border-ink bg-ink px-5 py-4 text-paper transition hover:bg-graphite"
      >
        <BaseIcon name="bell" :size="20" />
        <span class="flex-1 font-medium">{{ newCount }} pesanan baru menunggu diproses</span>
        <BaseIcon name="arrow-right" :size="18" />
      </NuxtLink>

      <!-- Revenue highlight -->
      <div class="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div class="flex flex-col justify-between bg-ink p-6 text-paper md:p-7">
          <div class="flex items-center gap-2">
            <BaseIcon name="wallet" :size="18" class="text-paper/60" />
            <p class="eyebrow text-paper/60">Total penghasilan</p>
          </div>
          <p class="mt-6 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            {{ formatRupiah(stats?.stats.all.revenue ?? 0) }}
          </p>
          <p class="mt-1 text-sm text-paper/60">{{ stats?.stats.all.orders ?? 0 }} pesanan · {{ stats?.stats.all.bottles ?? 0 }} botol terjual</p>
        </div>

        <!-- Pipeline -->
        <div class="grid grid-cols-2 gap-px overflow-hidden border border-smoke bg-smoke sm:grid-cols-4">
          <NuxtLink v-for="p in [
              { k: 'pending', label: 'Baru' },
              { k: 'processing', label: 'Diproses' },
              { k: 'shipped', label: 'Dikirim' },
              { k: 'delivered', label: 'Selesai' },
            ]" :key="p.k" :to="`/seller/orders?status=${p.k}`" class="bg-paper p-5 transition hover:bg-fog">
            <p class="font-display text-4xl font-semibold">{{ stats?.pipeline?.[p.k as keyof StatsResp['pipeline']] ?? 0 }}</p>
            <p class="mt-1 text-sm text-ash">{{ p.label }}</p>
          </NuxtLink>
        </div>
      </div>

      <!-- Period stats -->
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="c in periodCards" :key="c.key" class="border border-smoke p-5">
          <div class="flex items-center gap-2 text-ash">
            <BaseIcon name="calendar" :size="15" />
            <p class="text-xs font-semibold uppercase tracking-wider">{{ c.label }}</p>
          </div>
          <p class="mt-4 font-display text-3xl font-semibold tracking-tight">{{ formatRupiah(c.data?.revenue ?? 0) }}</p>
          <p class="mt-1 text-sm text-ash">{{ c.data?.orders ?? 0 }} pesanan · {{ c.data?.bottles ?? 0 }} botol</p>
        </div>
      </div>

      <!-- Recent orders -->
      <div class="mt-10">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-2xl tracking-tight">Pesanan terbaru</h2>
          <NuxtLink to="/seller/orders" class="link-underline text-sm font-semibold">Lihat semua</NuxtLink>
        </div>
        <div v-if="recent.length" class="divide-y divide-smoke border-y border-smoke">
          <NuxtLink v-for="o in recent" :key="o.id" :to="`/seller/orders/${o.id}`" class="group flex items-center gap-4 py-4">
            <span v-if="!o.seenBySeller" class="size-2 shrink-0 rounded-full bg-ink" aria-label="baru" />
            <span v-else class="size-2 shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="font-display text-lg leading-tight">{{ o.code }}</p>
              <p class="text-sm text-ash">{{ o.shipName }} · {{ formatDateTime(o.createdAt) }}</p>
            </div>
            <OrderStatusBadge :status="o.status" />
            <span class="hidden w-28 text-right font-medium sm:block">{{ formatRupiah(o.total) }}</span>
            <BaseIcon name="chevron-right" :size="18" class="text-ash transition-transform group-hover:translate-x-1" />
          </NuxtLink>
        </div>
        <p v-else class="border border-dashed border-smoke py-12 text-center text-ash">Belum ada pesanan masuk.</p>
      </div>

      <template #fallback>
        <div class="mt-6 h-40 animate-pulse bg-fog" />
      </template>
    </ClientOnly>
  </div>
</template>
