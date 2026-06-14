<script setup lang="ts">
const { products, getById } = useProducts()

// Hero: prefer Mandalika · Day Intens, else the first "new" product, else first product
const hero = computed<Scent | undefined>(
  () => getById(1018) ?? products.value.find((p) => p.isNew) ?? products.value[0],
)
const heroCollection = computed(() => (hero.value ? getCollection(hero.value.collectionId) : undefined))

const featured = computed<Scent[]>(() => {
  const preferred = [1001, 1017, 1019, 2001, 2002, 3001, 3003, 3004]
    .map((id) => getById(id))
    .filter(Boolean) as Scent[]
  const pool = preferred.length >= 4 ? preferred : products.value
  return pool.slice(0, 8)
})

const stats = [
  { value: SHOP.rating.toFixed(1), label: 'Rating toko', sub: `${SHOP.reviewsLabel} penilaian` },
  { value: `${SHOP.chatResponse}%`, label: 'Chat dibalas', sub: 'dalam hitungan jam' },
  { value: SHOP.established.toString(), label: 'Berdiri sejak', sub: `${SHOP.yearsActive} tahun melayani` },
  { value: '1ml', label: 'Mulai dari', sub: 'tester sebelum full bottle' },
]

const values = [
  { icon: 'droplet', title: 'Decant rapi', text: 'Dibagi presisi dari botol asli, takaran akurat dari 1ml.' },
  { icon: 'sparkles', title: '100% Original', text: 'Tester resmi — coba dulu profil aromanya tanpa beli botol penuh.' },
  { icon: 'truck', title: `Kirim dari ${SHOP.shipFrom}`, text: 'Dikemas aman, anti-bocor, siap dikirim ke seluruh Indonesia.' },
  { icon: 'user', title: SHOP.gender, text: 'Semua wangi cocok dipakai siapa saja, kapan saja.' },
]

const keywords = useStoreKeywords()
useHead({
  title: `${SHOP.name} — ${SHOP.tagline}`,
  meta: [{ name: 'keywords', content: keywords }],
})
useSeoMeta({
  ogTitle: `${SHOP.name} — Decant & Tester Parfum Original`,
  ogDescription: `Decant & tester parfum original sejak ${SHOP.established}. Mandalika, HMNS, Velixir — mulai 1ml. Coba dulu sebelum full bottle.`,
})
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="gutter mx-auto max-w-[1540px] pt-10 md:pt-16">
      <div class="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <!-- Copy -->
        <div>
          <p class="reveal eyebrow text-ash" style="animation-delay: 40ms">
            Decant &amp; Tester Parfum · Sejak {{ SHOP.established }}
          </p>
          <h1
            class="reveal mt-5 font-display text-[3.1rem] font-semibold leading-[0.92] tracking-tight md:text-[5.2rem]"
            style="animation-delay: 120ms"
          >
            Coba dulu,<br />baru
            <span class="italic">jatuh cinta.</span>
          </h1>
          <p class="reveal mt-6 max-w-md text-base text-ash md:text-lg" style="animation-delay: 200ms">
            Eksplorasi parfum favoritmu lewat ukuran kecil. Mandalika, HMNS, dan Velixir —
            decant original mulai dari 1ml, tanpa harus menebus botol penuh.
          </p>
          <div class="reveal mt-9 flex flex-wrap items-center gap-3" style="animation-delay: 280ms">
            <NuxtLink to="/products" class="btn-ink">Belanja sekarang <BaseIcon name="arrow-right" :size="16" /></NuxtLink>
            <NuxtLink to="/products?c=mandalika" class="btn-line">Lihat koleksi</NuxtLink>
          </div>
          <div class="reveal mt-9 flex items-center gap-5 text-sm text-ash" style="animation-delay: 360ms">
            <span class="flex items-center gap-1.5">
              <BaseIcon name="star" :size="15" class="text-ink" />
              <span class="font-semibold text-ink">{{ SHOP.rating }}</span> · {{ SHOP.reviewsLabel }} penilaian
            </span>
            <span class="h-4 w-px bg-smoke" />
            <span class="flex items-center gap-1.5"><BaseIcon name="clock" :size="15" /> {{ SHOP.hoursShort }}</span>
          </div>
        </div>

        <!-- Image -->
        <div v-if="hero" class="reveal relative" style="animation-delay: 240ms">
          <NuxtLink :to="`/products/${hero.id}/${hero.slug}`" class="group block">
            <div class="relative aspect-[4/5] overflow-hidden bg-fog">
              <img
                :src="hero.image"
                :alt="`${heroCollection?.shortName} ${hero.name}`"
                class="absolute inset-0 size-full object-contain p-10 transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 md:p-16"
              />
              <span v-if="hero.isNew" class="tag absolute left-4 top-4">BARU</span>
            </div>
            <!-- floating caption -->
            <div class="absolute -bottom-5 left-4 right-4 flex items-center justify-between bg-ink p-4 text-paper md:left-8 md:right-8 md:p-5">
              <div>
                <p class="eyebrow text-paper/60">{{ heroCollection?.shortName }}<span v-if="hero.concentration"> · {{ hero.concentration }}</span></p>
                <p class="mt-1 font-display text-xl">{{ hero.name }}</p>
              </div>
              <p class="text-right text-sm text-paper/70">Mulai<br /><span class="font-display text-lg text-paper">{{ formatRupiah(hero.fromPrice) }}</span></p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- MARQUEE -->
    <section class="mt-14 overflow-hidden border-y border-smoke py-4 md:mt-20">
      <div class="marquee flex w-max items-center gap-8 whitespace-nowrap">
        <template v-for="n in 2" :key="n">
          <span v-for="word in ['Decant Original', 'Mulai 1ml', 'Unisex', 'Dikirim dari Jakarta Barat', 'Tester Resmi', 'Sejak 2018']" :key="word + n" class="flex items-center gap-8">
            <span class="font-display text-lg italic text-ash">{{ word }}</span>
            <span class="size-1.5 rounded-full bg-smoke" />
          </span>
        </template>
      </div>
    </section>

    <!-- STATS -->
    <section class="gutter mx-auto max-w-[1540px] py-14 md:py-20">
      <dl class="grid grid-cols-2 gap-y-10 md:grid-cols-4">
        <div v-for="(s, i) in stats" :key="s.label" class="px-2 md:px-6" :class="i > 0 ? 'md:border-l md:border-smoke' : ''">
          <dd class="font-display text-5xl font-semibold tracking-tight md:text-6xl">{{ s.value }}</dd>
          <dt class="mt-3 text-sm font-semibold uppercase tracking-wider">{{ s.label }}</dt>
          <p class="mt-1 text-sm text-ash">{{ s.sub }}</p>
        </div>
      </dl>
    </section>

    <!-- OFFER CAROUSEL -->
    <OfferCarousel />

    <!-- FEATURED PRODUCTS -->
    <section class="gutter mx-auto max-w-[1540px] py-16 md:py-20">
      <div class="mb-8 flex items-end justify-between gap-4">
        <div>
          <p class="eyebrow text-ash">Paling dicari</p>
          <h2 class="mt-2 font-display text-3xl tracking-tight md:text-5xl">Wangi favorit pelanggan</h2>
        </div>
        <NuxtLink to="/products" class="link-underline hidden shrink-0 items-center gap-1.5 text-sm font-semibold md:flex">
          Semua produk <BaseIcon name="arrow-right" :size="16" />
        </NuxtLink>
      </div>
      <ProductGrid :scents="featured" />
      <div class="mt-10 flex justify-center md:hidden">
        <NuxtLink to="/products" class="btn-line w-full">Lihat semua produk</NuxtLink>
      </div>
    </section>

    <!-- VALUE PROPS -->
    <section class="gutter mx-auto max-w-[1540px] py-8">
      <div class="grid gap-px overflow-hidden rounded-md border border-smoke bg-smoke sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="v in values" :key="v.title" class="bg-paper p-7">
          <BaseIcon :name="v.icon" :size="26" class="text-ink" />
          <h3 class="mt-4 font-display text-xl">{{ v.title }}</h3>
          <p class="mt-2 text-sm text-ash">{{ v.text }}</p>
        </div>
      </div>
    </section>

    <!-- CTA BAND -->
    <section class="gutter mx-auto max-w-[1540px] py-16 md:py-24">
      <div class="relative overflow-hidden rounded-lg bg-ink px-7 py-16 text-center text-paper md:px-12 md:py-24">
        <p class="eyebrow text-paper/50">Bingung pilih wangi?</p>
        <h2 class="mx-auto mt-5 max-w-2xl font-display text-4xl leading-[0.98] tracking-tight md:text-6xl">
          Tanya kami, kami bantu carikan aroma yang pas.
        </h2>
        <div class="mt-9 flex flex-wrap justify-center gap-3">
          <a :href="whatsappLink('Halo Pen & Pencil! Bantu rekomendasikan wangi dong 🙏')" target="_blank" rel="noopener" class="inline-flex items-center justify-center gap-2 rounded-sm bg-paper px-6 py-3.5 text-sm font-semibold text-ink transition hover:opacity-90">
            <BaseIcon name="whatsapp" :size="18" /> Chat WhatsApp
          </a>
          <NuxtLink to="/products" class="inline-flex items-center justify-center gap-2 rounded-sm border border-paper/40 px-6 py-3.5 text-sm font-semibold text-paper transition hover:bg-paper hover:text-ink">
            Jelajahi katalog
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.marquee {
  animation: marquee 28s linear infinite;
}
@keyframes marquee {
  to {
    transform: translateX(-50%);
  }
}
</style>
