<script setup lang="ts">
const { searchOpen } = useUi()
const { products } = useProducts()
const query = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

const results = computed<Scent[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return products.value
    .filter((s) => {
      const col = getCollection(s.collectionId)
      return (
        s.name.toLowerCase().includes(q) ||
        col?.shortName.toLowerCase().includes(q) ||
        col?.name.toLowerCase().includes(q) ||
        (s.concentration?.toLowerCase().includes(q) ?? false)
      )
    })
    .slice(0, 8)
})

const suggestions = ['Mandalika', 'HMNS', 'Velixir', 'Intens', 'Tuberose', 'Apollo']

watch(searchOpen, async (open) => {
  if (import.meta.client) document.documentElement.style.overflow = open ? 'hidden' : ''
  if (open) {
    await nextTick()
    inputEl.value?.focus()
  } else {
    query.value = ''
  }
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') searchOpen.value = false
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  if (import.meta.client) document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="search">
      <div v-if="searchOpen" class="fixed inset-0 z-50 flex flex-col bg-paper">
        <!-- Search bar -->
        <div class="gutter mx-auto flex w-full max-w-[1100px] items-center gap-3 py-5">
          <BaseIcon name="search" :size="24" class="shrink-0 text-ash" />
          <input
            ref="inputEl"
            v-model="query"
            type="search"
            placeholder="Cari parfum, koleksi, atau varian…"
            class="min-w-0 flex-1 bg-transparent py-2 font-display text-2xl tracking-tight outline-none placeholder:text-pewter sm:text-3xl"
          />
          <button type="button" class="grid size-10 shrink-0 place-items-center" aria-label="Tutup pencarian" @click="searchOpen = false">
            <BaseIcon name="x" :size="26" />
          </button>
        </div>

        <div class="h-px w-full bg-smoke" />

        <!-- Body -->
        <div class="no-scrollbar gutter mx-auto w-full max-w-[1100px] flex-1 overflow-y-auto py-7">
          <!-- Empty / suggestions -->
          <div v-if="!query.trim()">
            <p class="eyebrow mb-4 text-ash">Pencarian populer</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in suggestions" :key="s" type="button" class="tag-line" @click="query = s">
                {{ s }}
              </button>
            </div>
          </div>

          <!-- No results -->
          <p v-else-if="!results.length" class="text-ash">
            Tidak ada hasil untuk “<span class="text-ink">{{ query }}</span>”.
          </p>

          <!-- Results -->
          <div v-else>
            <p class="eyebrow mb-4 text-ash">{{ results.length }} hasil</p>
            <ul class="divide-y divide-smoke">
              <li v-for="s in results" :key="s.id">
                <NuxtLink
                  :to="`/products/${s.id}/${s.slug}`"
                  class="group flex items-center gap-4 py-3"
                  @click="searchOpen = false"
                >
                  <span class="grid size-14 shrink-0 place-items-center bg-fog">
                    <img :src="s.image" :alt="s.name" class="size-full object-contain p-1.5" loading="lazy" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-display text-lg leading-tight">{{ s.name }}</span>
                    <span class="eyebrow text-ash">{{ getCollection(s.collectionId)?.shortName }}<span v-if="s.concentration"> · {{ s.concentration }}</span></span>
                  </span>
                  <span class="shrink-0 text-sm text-ash">Mulai <span class="text-ink">{{ formatRupiah(s.fromPrice) }}</span></span>
                  <BaseIcon name="arrow-right" :size="18" class="shrink-0 text-ash transition-transform group-hover:translate-x-1" />
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.search-enter-active,
.search-leave-active {
  transition: opacity 0.25s var(--ease-out-expo), transform 0.35s var(--ease-out-expo);
}
.search-enter-from,
.search-leave-to {
  opacity: 0;
  transform: translateY(-1.5%);
}
</style>
