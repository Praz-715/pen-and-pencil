<script setup lang="ts">
import type { ProductFilterState } from '~/components/ProductFilters.vue'

const route = useRoute()
const { products } = useProducts()

function collectionFromQuery(): string[] {
  const c = route.query.c
  return typeof c === 'string' && c ? [c] : []
}

const filters = reactive<ProductFilterState>({
  q: '',
  collections: collectionFromQuery(),
  type: 'all',
  sizes: [],
})

const sort = ref<'featured' | 'new' | 'price-asc' | 'price-desc' | 'az'>('featured')
const sortOptions = [
  { value: 'featured', label: 'Unggulan' },
  { value: 'new', label: 'Terbaru' },
  { value: 'price-asc', label: 'Harga: rendah ke tinggi' },
  { value: 'price-desc', label: 'Harga: tinggi ke rendah' },
  { value: 'az', label: 'Nama: A ke Z' },
] as const

// React to collection nav links while page is mounted
watch(
  () => route.query.c,
  () => {
    filters.collections = collectionFromQuery()
  },
)

const filtered = computed<Scent[]>(() => {
  let list = products.value.slice()
  const q = filters.q.trim().toLowerCase()
  if (q) {
    list = list.filter((s) => {
      const col = getCollection(s.collectionId)
      return s.name.toLowerCase().includes(q) || (col?.shortName.toLowerCase().includes(q) ?? false)
    })
  }
  if (filters.collections.length) list = list.filter((s) => filters.collections.includes(s.collectionId))
  if (filters.type === 'new') list = list.filter((s) => s.isNew)
  else if (filters.type === 'intens') list = list.filter((s) => s.concentration === 'Intens')
  if (filters.sizes.length) list = list.filter((s) => s.sizes.some((sz) => filters.sizes.includes(sz.ml)))

  switch (sort.value) {
    case 'new':
      list.sort((a, b) => Number(b.isNew) - Number(a.isNew))
      break
    case 'price-asc':
      list.sort((a, b) => a.fromPrice - b.fromPrice)
      break
    case 'price-desc':
      list.sort((a, b) => b.fromPrice - a.fromPrice)
      break
    case 'az':
      list.sort((a, b) => a.name.localeCompare(b.name))
      break
  }
  return list
})

const heading = computed(() => {
  if (filters.collections.length === 1) return getCollection(filters.collections[0]!)?.shortName ?? 'Semua Produk'
  return 'Semua Produk'
})

const activeCount = computed(
  () =>
    filters.collections.length +
    filters.sizes.length +
    (filters.type !== 'all' ? 1 : 0) +
    (filters.q.trim() ? 1 : 0),
)

const showFilter = ref(false)
const showSort = ref(false)

const keywords = useStoreKeywords()
useHead({
  title: () => `${heading.value} — ${SHOP.name}`,
  meta: [{ name: 'keywords', content: keywords }],
})
</script>

<template>
  <div class="gutter mx-auto max-w-[1540px] py-8 md:py-12">
    <!-- Page head -->
    <div class="mb-6 md:mb-10">
      <p class="eyebrow text-ash">Katalog</p>
      <h1 class="mt-2 font-display text-4xl tracking-tight md:text-6xl">{{ heading }}</h1>
    </div>

    <div class="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 xl:grid-cols-[280px_1fr]">
      <!-- Desktop sidebar -->
      <aside class="hidden lg:block">
        <div class="sticky top-[calc(var(--header-h)+1.5rem)]">
          <ProductFilters :filters="filters" />
        </div>
      </aside>

      <!-- Main -->
      <div>
        <!-- Desktop toolbar -->
        <div class="mb-6 hidden items-center justify-between border-b border-smoke pb-4 lg:flex">
          <p class="text-sm text-ash">
            <span class="font-semibold text-ink">{{ filtered.length }}</span> produk
          </p>
          <div class="relative">
            <select
              v-model="sort"
              class="cursor-pointer appearance-none border border-smoke bg-paper py-2.5 pl-4 pr-10 text-sm font-medium outline-none focus:border-ink"
            >
              <option v-for="o in sortOptions" :key="o.value" :value="o.value">Urutkan: {{ o.label }}</option>
            </select>
            <BaseIcon name="chevron-down" :size="16" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ash" />
          </div>
        </div>

        <!-- Mobile filter / sort bar -->
        <div class="mb-6 grid grid-cols-2 gap-3 lg:hidden">
          <button type="button" class="btn-line relative justify-center" @click="showFilter = true">
            <BaseIcon name="sliders" :size="18" /> Filter
            <span v-if="activeCount" class="ml-1 grid size-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-paper">{{ activeCount }}</span>
          </button>
          <button type="button" class="btn-line justify-center" @click="showSort = true">
            <BaseIcon name="sort" :size="18" /> Urutkan
          </button>
        </div>

        <!-- Active chips -->
        <div v-if="activeCount" class="mb-6 flex flex-wrap items-center gap-2">
          <button v-for="id in filters.collections" :key="id" type="button" class="tag-line gap-1.5" @click="filters.collections = filters.collections.filter((x) => x !== id)">
            {{ getCollection(id)?.shortName }} <BaseIcon name="x" :size="12" />
          </button>
          <button v-if="filters.type !== 'all'" type="button" class="tag-line gap-1.5 capitalize" @click="filters.type = 'all'">
            {{ filters.type === 'new' ? 'Terbaru' : 'Intens' }} <BaseIcon name="x" :size="12" />
          </button>
          <button v-for="ml in filters.sizes" :key="ml" type="button" class="tag-line gap-1.5" @click="filters.sizes = filters.sizes.filter((x) => x !== ml)">
            {{ ml }}ml <BaseIcon name="x" :size="12" />
          </button>
        </div>

        <!-- Grid / empty -->
        <ProductGrid v-if="filtered.length" :scents="filtered" />
        <div v-else class="grid place-items-center border border-dashed border-smoke py-24 text-center">
          <div>
            <BaseIcon name="search" :size="32" class="mx-auto text-pewter" />
            <p class="mt-4 font-display text-2xl">Tidak ada produk</p>
            <p class="mt-1 text-sm text-ash">Coba ubah atau reset filtermu.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile filter sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showFilter" class="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden">
          <div class="gutter flex h-[var(--header-h)] items-center justify-between border-b border-smoke">
            <h2 class="font-display text-2xl">Filter</h2>
            <button type="button" class="-mr-1.5 grid size-10 place-items-center" aria-label="Tutup" @click="showFilter = false"><BaseIcon name="x" :size="24" /></button>
          </div>
          <div class="gutter flex-1 overflow-y-auto py-7"><ProductFilters :filters="filters" /></div>
          <div class="gutter border-t border-smoke py-4">
            <button type="button" class="btn-ink w-full" @click="showFilter = false">Tampilkan {{ filtered.length }} produk</button>
          </div>
        </div>
      </Transition>

      <!-- Mobile sort sheet -->
      <Transition name="sheet-up">
        <div v-if="showSort" class="fixed inset-0 z-50 flex flex-col justify-end lg:hidden" @click.self="showSort = false">
          <div class="absolute inset-0 bg-ink/40" />
          <div class="relative bg-paper">
            <div class="gutter flex items-center justify-between border-b border-smoke py-4">
              <h2 class="font-display text-xl">Urutkan</h2>
              <button type="button" class="grid size-9 place-items-center" aria-label="Tutup" @click="showSort = false"><BaseIcon name="x" :size="22" /></button>
            </div>
            <ul class="gutter py-2">
              <li v-for="o in sortOptions" :key="o.value">
                <button
                  type="button"
                  class="flex w-full items-center justify-between py-3.5 text-left text-sm"
                  @click="sort = o.value; showSort = false"
                >
                  <span :class="sort === o.value ? 'font-semibold text-ink' : 'text-ash'">{{ o.label }}</span>
                  <BaseIcon v-if="sort === o.value" name="check" :size="18" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.3s var(--ease-out-expo), transform 0.35s var(--ease-out-expo);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateX(2%);
}
.sheet-up-enter-active,
.sheet-up-leave-active {
  transition: opacity 0.3s ease;
}
.sheet-up-enter-active .relative,
.sheet-up-leave-active .relative {
  transition: transform 0.35s var(--ease-out-expo);
}
.sheet-up-enter-from,
.sheet-up-leave-to {
  opacity: 0;
}
.sheet-up-enter-from .relative,
.sheet-up-leave-to .relative {
  transform: translateY(100%);
}
</style>
