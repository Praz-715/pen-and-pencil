<script setup lang="ts">
definePageMeta({ middleware: 'buyer' })
useHead({ title: `Pesanan Saya — ${SHOP.name}` })

const { data: orders, pending } = await useFetch<OrderDTO[]>('/api/orders', {
  server: false,
  default: () => [],
})
</script>

<template>
  <div class="gutter mx-auto max-w-4xl py-8 md:py-12">
    <NuxtLink to="/account" class="link-underline mb-3 inline-flex items-center gap-1.5 text-sm text-ash">
      <BaseIcon name="arrow-left" :size="15" /> Akun
    </NuxtLink>
    <h1 class="font-display text-4xl tracking-tight md:text-5xl">Pesanan Saya</h1>

    <ClientOnly>
      <div v-if="pending" class="mt-8 space-y-3">
        <div v-for="n in 3" :key="n" class="h-24 animate-pulse bg-fog" />
      </div>

      <ul v-else-if="orders.length" class="mt-8 space-y-4">
        <li v-for="o in orders" :key="o.id">
          <NuxtLink :to="`/account/orders/${o.id}`" class="group flex flex-col gap-4 border border-smoke p-5 transition hover:border-ink sm:flex-row sm:items-center">
            <div class="flex -space-x-3">
              <span v-for="(it, i) in (o.items ?? []).slice(0, 3)" :key="it.id" class="grid size-14 place-items-center rounded-full border-2 border-paper bg-fog" :style="{ zIndex: 3 - i }">
                <img :src="it.image ?? ''" :alt="it.scentName" class="size-full rounded-full object-contain p-1.5" />
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-display text-lg">{{ o.code }}</span>
                <OrderStatusBadge :status="o.status" />
              </div>
              <p class="mt-0.5 text-sm text-ash">
                {{ formatDateTime(o.createdAt) }} · {{ (o.items ?? []).reduce((n, x) => n + x.qty, 0) }} item
              </p>
            </div>
            <div class="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
              <span class="font-display text-lg">{{ formatRupiah(o.total) }}</span>
              <BaseIcon name="arrow-right" :size="18" class="text-ash transition-transform group-hover:translate-x-1" />
            </div>
          </NuxtLink>
        </li>
      </ul>

      <div v-else class="mt-8 grid place-items-center border border-dashed border-smoke py-20 text-center">
        <div>
          <BaseIcon name="package" :size="32" class="mx-auto text-pewter" />
          <p class="mt-4 font-display text-2xl">Belum ada pesanan</p>
          <p class="mt-1 text-sm text-ash">Pesananmu akan muncul di sini setelah checkout.</p>
          <NuxtLink to="/products" class="btn-ink mt-6">Mulai belanja</NuxtLink>
        </div>
      </div>

      <template #fallback>
        <div class="mt-8 h-24 animate-pulse bg-fog" />
      </template>
    </ClientOnly>
  </div>
</template>
