<script setup lang="ts">
definePageMeta({ middleware: 'seller' })
useHead({ title: `Kelola Produk — ${SHOP.name}` })

const { data: products, pending, refresh } = await useFetch<Scent[]>('/api/products', {
  query: { all: '1' },
  server: false,
  default: () => [],
})

const q = ref('')
const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return products.value
  return products.value.filter(
    (p) => p.name.toLowerCase().includes(term) || getCollection(p.collectionId)?.shortName.toLowerCase().includes(term),
  )
})

function priceRange(p: Scent) {
  const prices = p.sizes.map((s) => s.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? formatRupiah(min) : `${formatRupiah(min)} – ${formatRupiah(max)}`
}

async function remove(p: Scent) {
  if (!confirm(`Hapus produk "${p.name}"? Tindakan ini permanen.`)) return
  await $fetch(`/api/products/${p.id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="gutter mx-auto max-w-[1540px] py-8 md:py-12">
    <NuxtLink to="/seller" class="link-underline mb-3 inline-flex items-center gap-1.5 text-sm text-ash">
      <BaseIcon name="arrow-left" :size="15" /> Dashboard
    </NuxtLink>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-4xl tracking-tight md:text-5xl">Kelola Produk</h1>
        <p class="mt-1 text-sm text-ash"><ClientOnly>{{ products.length }} produk</ClientOnly></p>
      </div>
      <NuxtLink to="/seller/products/new" class="btn-ink shrink-0"><BaseIcon name="plus" :size="16" /> Tambah produk</NuxtLink>
    </div>

    <div class="mt-6 flex items-center gap-2.5 border border-smoke px-4 py-3 md:max-w-sm">
      <BaseIcon name="search" :size="18" class="shrink-0 text-ash" />
      <input v-model="q" type="search" placeholder="Cari produk…" class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-pewter" />
    </div>

    <ClientOnly>
      <div v-if="pending" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 6" :key="n" class="h-32 animate-pulse bg-fog" />
      </div>

      <div v-else-if="filtered.length" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article v-for="p in filtered" :key="p.id" class="flex flex-col border border-smoke">
          <div class="flex gap-4 p-4">
            <span class="grid size-20 shrink-0 place-items-center bg-fog">
              <img :src="p.image" :alt="p.name" class="size-full object-contain p-1.5" loading="lazy" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="eyebrow text-ash">{{ getCollection(p.collectionId)?.shortName }}<span v-if="p.concentration"> · {{ p.concentration }}</span></p>
              <h3 class="mt-0.5 truncate font-display text-lg leading-tight">{{ p.name }}</h3>
              <p class="mt-1 text-sm text-ash">{{ priceRange(p) }}</p>
              <div class="mt-2 flex flex-wrap items-center gap-1.5">
                <span class="rounded-[2px] px-2 py-0.5 text-[11px] font-semibold" :class="p.stock > 0 ? 'bg-fog text-ink' : 'border border-ash text-ash'">
                  {{ p.stock > 0 ? `Stok ${p.stock}` : 'Habis' }}
                </span>
                <span v-if="!p.active" class="rounded-[2px] border border-ash px-2 py-0.5 text-[11px] font-semibold text-ash">Nonaktif</span>
                <span v-if="p.isNew" class="rounded-[2px] bg-ink px-2 py-0.5 text-[11px] font-semibold text-paper">Baru</span>
              </div>
            </div>
          </div>
          <div class="mt-auto flex divide-x divide-smoke border-t border-smoke text-sm font-semibold">
            <NuxtLink :to="`/seller/products/${p.id}`" class="flex flex-1 items-center justify-center gap-1.5 py-3 transition hover:bg-fog">
              <BaseIcon name="edit" :size="15" /> Ubah
            </NuxtLink>
            <button type="button" class="flex flex-1 items-center justify-center gap-1.5 py-3 text-ash transition hover:bg-fog hover:text-ink" @click="remove(p)">
              <BaseIcon name="trash" :size="15" /> Hapus
            </button>
          </div>
        </article>
      </div>

      <div v-else class="mt-8 grid place-items-center border border-dashed border-smoke py-20 text-center">
        <div>
          <BaseIcon name="package" :size="32" class="mx-auto text-pewter" />
          <p class="mt-4 font-display text-2xl">Belum ada produk</p>
          <NuxtLink to="/seller/products/new" class="btn-ink mt-6">Tambah produk pertama</NuxtLink>
        </div>
      </div>

      <template #fallback>
        <div class="mt-8 h-32 animate-pulse bg-fog" />
      </template>
    </ClientOnly>
  </div>
</template>
