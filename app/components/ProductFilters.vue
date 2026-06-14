<script setup lang="ts">
export interface ProductFilterState {
  q: string
  collections: CollectionId[]
  type: 'all' | 'new' | 'intens'
  sizes: number[]
}

const props = defineProps<{ filters: ProductFilterState }>()

const { byCollection, collectionsInUse } = useProducts()
const sizeOptions = [1, 2, 3, 5, 10]
const typeOptions = [
  { value: 'all', label: 'Semua produk' },
  { value: 'new', label: 'Terbaru' },
  { value: 'intens', label: 'Intens' },
] as const

function collectionCount(id: CollectionId) {
  return byCollection(id).length
}

function toggleCollection(id: CollectionId) {
  const arr = props.filters.collections
  const i = arr.indexOf(id)
  if (i === -1) arr.push(id)
  else arr.splice(i, 1)
}

function toggleSize(ml: number) {
  const arr = props.filters.sizes
  const i = arr.indexOf(ml)
  if (i === -1) arr.push(ml)
  else arr.splice(i, 1)
}

function reset() {
  props.filters.q = ''
  props.filters.collections = []
  props.filters.type = 'all'
  props.filters.sizes = []
}
</script>

<template>
  <div class="space-y-8">
    <!-- Search -->
    <div class="flex items-center gap-2.5 border border-smoke px-4 py-3">
      <BaseIcon name="search" :size="18" class="shrink-0 text-ash" />
      <input
        :value="filters.q"
        type="search"
        placeholder="Cari di katalog…"
        class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-pewter"
        @input="filters.q = ($event.target as HTMLInputElement).value"
      />
    </div>

    <!-- Koleksi -->
    <fieldset>
      <legend class="eyebrow mb-4 text-ink">Koleksi</legend>
      <ul class="space-y-3">
        <li v-for="c in collectionsInUse" :key="c.id">
          <label class="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              class="size-4 shrink-0 accent-ink"
              :checked="filters.collections.includes(c.id)"
              @change="toggleCollection(c.id)"
            />
            <span class="flex-1">{{ c.shortName }}</span>
            <span class="text-xs text-pewter">{{ collectionCount(c.id) }}</span>
          </label>
        </li>
      </ul>
    </fieldset>

    <!-- Tipe -->
    <fieldset>
      <legend class="eyebrow mb-4 text-ink">Tipe Produk</legend>
      <ul class="space-y-3">
        <li v-for="t in typeOptions" :key="t.value">
          <label class="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="radio"
              name="ptype"
              class="size-4 shrink-0 accent-ink"
              :value="t.value"
              :checked="filters.type === t.value"
              @change="filters.type = t.value"
            />
            <span>{{ t.label }}</span>
          </label>
        </li>
      </ul>
    </fieldset>

    <!-- Ukuran -->
    <fieldset>
      <legend class="eyebrow mb-4 text-ink">Ukuran Tersedia</legend>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="ml in sizeOptions"
          :key="ml"
          type="button"
          class="min-w-12 border px-3 py-2 text-sm transition"
          :class="filters.sizes.includes(ml) ? 'border-ink bg-ink text-paper' : 'border-smoke text-ink hover:border-ink'"
          @click="toggleSize(ml)"
        >
          {{ ml }}ml
        </button>
      </div>
    </fieldset>

    <button type="button" class="link-underline text-sm font-semibold text-ash" @click="reset">
      Reset filter
    </button>
  </div>
</template>
