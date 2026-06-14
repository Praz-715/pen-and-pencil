<script setup lang="ts">
/** "Penawaran Terbaik" — horizontal snap carousel of the 3 collections. */
const scroller = ref<HTMLElement | null>(null)
const active = ref(0)
const { byCollection, collectionsInUse } = useProducts()

const slides = computed(() =>
  collectionsInUse.value.map((c) => {
    const prices = byCollection(c.id).map((s) => s.fromPrice)
    return {
      collection: c,
      image: c.gallery[0] ?? '',
      from: prices.length ? Math.min(...prices) : 0,
    }
  }),
)

function go(i: number) {
  const el = scroller.value
  if (!el) return
  const clamped = Math.max(0, Math.min(slides.value.length - 1, i))
  el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
}

function onScroll() {
  const el = scroller.value
  if (!el) return
  active.value = Math.round(el.scrollLeft / el.clientWidth)
}
</script>

<template>
  <section class="gutter mx-auto max-w-[1540px] py-16 md:py-24">
    <div class="mb-7 flex items-end justify-between gap-4">
      <div>
        <p class="eyebrow text-ash">Penawaran Terbaik</p>
        <h2 class="mt-2 font-display text-3xl tracking-tight md:text-5xl">Koleksi pilihan</h2>
      </div>
      <div class="hidden gap-2 md:flex">
        <button type="button" class="btn-line size-11 !p-0" aria-label="Sebelumnya" @click="go(active - 1)">
          <BaseIcon name="chevron-left" :size="20" />
        </button>
        <button type="button" class="btn-line size-11 !p-0" aria-label="Berikutnya" @click="go(active + 1)">
          <BaseIcon name="chevron-right" :size="20" />
        </button>
      </div>
    </div>

    <div
      ref="scroller"
      class="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      @scroll.passive="onScroll"
    >
      <article
        v-for="slide in slides"
        :key="slide.collection.id"
        class="w-full shrink-0 snap-start pr-0"
      >
        <NuxtLink
          :to="`/products?c=${slide.collection.id}`"
          class="group grid overflow-hidden bg-fog md:grid-cols-2"
        >
          <!-- Image -->
          <div class="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[440px]">
            <img
              :src="slide.image"
              :alt="slide.collection.name"
              class="absolute inset-0 size-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            />
          </div>
          <!-- Copy -->
          <div class="flex flex-col justify-center gap-5 p-7 md:p-14">
            <p class="eyebrow text-ash">Decant Tester · {{ slide.collection.shortName }}</p>
            <h3 class="font-display text-4xl leading-[0.95] tracking-tight md:text-6xl">
              {{ slide.collection.name.replace('Decant ', '').replace('Share ', '').replace('Tester ', '') }}
            </h3>
            <p class="max-w-md text-ash">{{ slide.collection.description }}</p>
            <div class="flex items-center gap-5">
              <span class="text-sm text-ash">Mulai <span class="text-lg font-semibold text-ink">{{ formatRupiah(slide.from) }}</span></span>
            </div>
            <span class="btn-ink mt-1 w-fit">Lihat koleksi <BaseIcon name="arrow-right" :size="16" /></span>
          </div>
        </NuxtLink>
      </article>
    </div>

    <!-- Dots -->
    <div class="mt-5 flex justify-center gap-2">
      <button
        v-for="(s, i) in slides"
        :key="s.collection.id"
        type="button"
        :aria-label="`Ke slide ${i + 1}`"
        class="h-1.5 rounded-full transition-all duration-300"
        :class="active === i ? 'w-7 bg-ink' : 'w-1.5 bg-smoke'"
        @click="go(i)"
      />
    </div>
  </section>
</template>
