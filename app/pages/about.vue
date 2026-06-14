<script setup lang="ts">
const { collectionsInUse } = useProducts()
const stats = [
  { value: SHOP.rating.toFixed(1), label: `${SHOP.reviewsLabel} penilaian` },
  { value: `${SHOP.chatResponse}%`, label: 'chat dibalas (jam)' },
  { value: `${SHOP.yearsActive} thn`, label: `melayani sejak ${SHOP.established}` },
]
const keywords = useStoreKeywords()
useHead({ title: `Tentang — ${SHOP.name}`, meta: [{ name: 'keywords', content: keywords }] })
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="gutter mx-auto max-w-[1540px] py-12 md:py-20">
      <p class="eyebrow text-ash">Tentang kami</p>
      <h1 class="mt-5 max-w-4xl font-display text-[2.6rem] font-semibold leading-[0.95] tracking-tight md:text-7xl">
        Decant original, supaya kamu bisa coba dulu sebelum jatuh cinta.
      </h1>
      <p class="mt-7 max-w-2xl text-base text-ash md:text-lg">
        {{ SHOP.name }} adalah toko decant &amp; tester parfum yang berdiri sejak {{ SHOP.established }}.
        Kami membagi parfum original ke ukuran kecil — dari 1ml — supaya kamu bisa mengeksplorasi
        banyak aroma tanpa harus menebus botol penuh.
      </p>
    </section>

    <!-- Stats -->
    <section class="gutter mx-auto max-w-[1540px]">
      <dl class="grid grid-cols-3 gap-4 border-y border-smoke py-10">
        <div v-for="(s, i) in stats" :key="s.label" class="px-1 md:px-6" :class="i > 0 ? 'border-l border-smoke' : ''">
          <dd class="font-display text-4xl font-semibold tracking-tight md:text-6xl">{{ s.value }}</dd>
          <dt class="mt-2 text-xs text-ash md:text-sm">{{ s.label }}</dt>
        </div>
      </dl>
    </section>

    <!-- Collections -->
    <section class="gutter mx-auto max-w-[1540px] py-16 md:py-24">
      <h2 class="font-display text-3xl tracking-tight md:text-5xl">Koleksi kami</h2>
      <div class="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        <NuxtLink v-for="c in collectionsInUse" :key="c.id" :to="`/products?c=${c.id}`" class="group">
          <div class="relative aspect-[4/3] overflow-hidden bg-fog">
            <img :src="c.gallery[0]" :alt="c.name" class="absolute inset-0 size-full object-contain p-6 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105" />
          </div>
          <h3 class="mt-4 font-display text-2xl">{{ c.shortName }}</h3>
          <p v-if="c.description" class="mt-1.5 text-sm text-ash">{{ c.description }}</p>
          <span class="link-underline mt-3 inline-flex items-center gap-1.5 text-sm font-semibold">Lihat koleksi <BaseIcon name="arrow-right" :size="15" /></span>
        </NuxtLink>
      </div>
    </section>

    <!-- Info grid -->
    <section class="gutter mx-auto max-w-[1540px] pb-16 md:pb-24">
      <div class="grid gap-px overflow-hidden border border-smoke bg-smoke md:grid-cols-3">
        <div class="bg-paper p-8">
          <BaseIcon name="clock" :size="26" />
          <h3 class="mt-4 font-display text-xl">Jam operasional</h3>
          <p class="mt-2 text-sm text-ash">{{ SHOP.hours }}. Chat di luar jam tetap kami balas saat toko buka.</p>
        </div>
        <div class="bg-paper p-8">
          <BaseIcon name="map-pin" :size="26" />
          <h3 class="mt-4 font-display text-xl">Lokasi &amp; pengiriman</h3>
          <p class="mt-2 text-sm text-ash">Dikirim dari {{ SHOP.shipFrom }} ke seluruh Indonesia. Dikemas aman &amp; anti-bocor.</p>
        </div>
        <div class="bg-paper p-8">
          <BaseIcon name="droplet" :size="26" />
          <h3 class="mt-4 font-display text-xl">Untuk semua</h3>
          <p class="mt-2 text-sm text-ash">Seluruh wangi bersifat {{ SHOP.gender.toLowerCase() }} — cocok dipakai siapa saja, mulai 1ml.</p>
        </div>
      </div>
    </section>

    <!-- Contact band -->
    <section class="gutter mx-auto max-w-[1540px] pb-20">
      <div class="flex flex-col items-start justify-between gap-6 border border-smoke p-8 md:flex-row md:items-center md:p-12">
        <div>
          <h2 class="font-display text-3xl tracking-tight md:text-4xl">Mau tanya-tanya dulu?</h2>
          <p class="mt-2 text-ash">Tim kami siap bantu rekomendasi aroma yang pas buatmu.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <a :href="whatsappLink('Halo Pen & Pencil!')" target="_blank" rel="noopener" class="btn-ink"><BaseIcon name="whatsapp" :size="18" /> WhatsApp</a>
          <a :href="SHOP.shopeeUrl" target="_blank" rel="noopener" class="btn-line">Shopee</a>
          <a :href="SHOP.instagram" target="_blank" rel="noopener" class="btn-line">Instagram</a>
        </div>
      </div>
    </section>
  </div>
</template>
