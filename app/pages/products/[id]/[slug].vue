<script setup lang="ts">
const route = useRoute()
const id = Number(route.params.id)

const { data: scent } = await useFetch<Scent>(`/api/products/${id}`)
const { siblings: siblingsOf } = useProducts()

const collection = computed(() => (scent.value ? getCollection(scent.value.collectionId) : undefined))
const siblings = computed(() => (scent.value ? siblingsOf(scent.value) : []))

interface Media {
  type: 'image' | 'video'
  src: string
}
const media = computed<Media[]>(() => {
  if (!scent.value) return []
  const col = collection.value
  const arr: Media[] = [
    { type: 'image', src: scent.value.image },
    ...(col?.gallery ?? []).map((src) => ({ type: 'image' as const, src })),
  ]
  if (col?.video) arr.push({ type: 'video', src: col.video })
  return arr
})
const activeIndex = ref(0)
const activeMedia = computed(() => media.value[activeIndex.value])

const selectedMl = ref<number | null>(null)
watch(
  scent,
  (s) => {
    if (s) selectedMl.value = s.sizes.find((x) => x.ml === 2)?.ml ?? s.sizes[0]?.ml ?? null
  },
  { immediate: true },
)
const selectedSize = computed(() => scent.value?.sizes.find((s) => s.ml === selectedMl.value) ?? scent.value?.sizes[0])
const qty = ref(1)

const { isFavorite, toggleFavorite } = useFavorites()
const fav = computed(() => (scent.value ? isFavorite(scent.value.id) : false))
const { cart, addToCart } = useCart()
const { isSeller } = useAuth()

// Stock is the single source of truth. Cap selectable qty by what's left after
// what the buyer already put in the cart for this exact product+size.
const stock = computed(() => scent.value?.stock ?? 0)
const inCart = computed(() => {
  if (!scent.value || selectedMl.value == null) return 0
  const id = scent.value.id
  const ml = selectedMl.value
  return cart.value.find((i) => i.scentId === id && i.ml === ml)?.qty ?? 0
})
const remaining = computed(() => Math.max(0, stock.value - inCart.value))
watch(remaining, (r) => {
  if (qty.value > r) qty.value = Math.max(1, r)
})

// Best value per ml — informational banner
const perMl = computed(() =>
  (scent.value?.sizes ?? []).map((s) => ({ ml: s.ml, perMl: s.price / s.ml })).sort((a, b) => a.perMl - b.perMl),
)
const bestValueMl = computed(() => perMl.value[0]?.ml ?? 0)
const outOfStock = computed(() => stock.value <= 0)
const canAdd = computed(() => !outOfStock.value && remaining.value > 0)

const justAdded = ref(false)
let addedTimer: ReturnType<typeof setTimeout> | undefined
const addLabel = computed(() => {
  if (justAdded.value) return 'Ditambahkan'
  if (outOfStock.value) return 'Stok habis'
  if (remaining.value <= 0) return 'Maksimal di keranjang'
  return 'Tambah ke Keranjang'
})
function add() {
  if (!scent.value || selectedMl.value == null) return
  const want = Math.min(qty.value, remaining.value)
  if (want <= 0) return
  addToCart(scent.value.id, selectedMl.value, want)
  justAdded.value = true
  clearTimeout(addedTimer)
  addedTimer = setTimeout(() => (justAdded.value = false), 2000)
}
onUnmounted(() => clearTimeout(addedTimer))

const waMessage = computed(() =>
  scent.value
    ? `Halo ${SHOP.name}! Saya mau pesan:\n• ${scentFullName(scent.value)}\n• Ukuran ${selectedSize.value?.label}\n• Jumlah ${qty.value}\nTotal ${formatRupiah((selectedSize.value?.price ?? 0) * qty.value)}\n\nMasih ready?`
    : '',
)

const showSizeGuide = ref(false)

const siteUrl = useRuntimeConfig().public.siteUrl as string
const metaDescription = computed(() =>
  scent.value
    ? `${scentFullName(scent.value)} — decant tester original, mulai ${formatRupiah(scent.value.fromPrice)}. ${collection.value?.description ?? ''}`.trim()
    : '',
)
const keywords = computed(() =>
  scent.value
    ? dedupeKeywords(
        productKeywords(scent.value.name, collection.value?.shortName ?? '', scent.value.concentration),
        ['parfum decant', 'tester parfum', 'perfume decant', 'perfume tester', SHOP.name],
      )
    : '',
)

useHead({
  title: () => (scent.value ? `${scentFullName(scent.value)} — ${SHOP.name}` : `Produk — ${SHOP.name}`),
  meta: [{ name: 'keywords', content: keywords }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() =>
        scent.value
          ? JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: scentFullName(scent.value),
              image: `${siteUrl}${scent.value.image}`,
              description: metaDescription.value,
              brand: { '@type': 'Brand', name: collection.value?.shortName ?? SHOP.name },
              category: collection.value?.name,
              offers: {
                '@type': 'Offer',
                priceCurrency: 'IDR',
                price: scent.value.fromPrice,
                availability: scent.value.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                url: `${siteUrl}/products/${scent.value.id}/${scent.value.slug}`,
              },
            })
          : '{}',
      ),
    },
  ],
})
const ogImage = computed(() => (scent.value ? `${siteUrl}/og/${scent.value.id}.jpg` : `${siteUrl}/og-cover.jpg`))
useSeoMeta({
  description: () => metaDescription.value,
  ogTitle: () => (scent.value ? scentFullName(scent.value) : ''),
  ogDescription: () => metaDescription.value,
  ogImage: () => ogImage.value,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => (scent.value ? scentFullName(scent.value) : ''),
  twitterDescription: () => metaDescription.value,
  twitterImage: () => ogImage.value,
})

// Share
const shareUrl = computed(() => (scent.value ? `${siteUrl}/products/${scent.value.id}/${scent.value.slug}` : siteUrl))
const waShareLink = computed(() =>
  scent.value
    ? `https://wa.me/?text=${encodeURIComponent(`${scentFullName(scent.value)} — ${formatRupiah(scent.value.fromPrice)}\n${shareUrl.value}`)}`
    : '',
)
const shareState = ref<'idle' | 'copied'>('idle')
async function shareProduct() {
  if (!scent.value) return
  const url = typeof window !== 'undefined' ? window.location.href : shareUrl.value
  const payload = {
    title: scentFullName(scent.value),
    text: `${scentFullName(scent.value)} — ${formatRupiah(scent.value.fromPrice)} di ${SHOP.name}`,
    url,
  }
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(payload)
    } catch {
      /* user cancelled */
    }
  } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url)
      shareState.value = 'copied'
      setTimeout(() => (shareState.value = 'idle'), 2000)
    } catch {}
  }
}
</script>

<template>
  <div>
    <!-- Not found -->
    <div v-if="!scent" class="gutter mx-auto grid min-h-[60vh] max-w-[1540px] place-items-center text-center">
      <div>
        <p class="font-display text-3xl tracking-tight">Produk tidak ditemukan</p>
        <p class="mt-2 text-sm text-ash">Produk mungkin sudah dihapus atau tidak aktif.</p>
        <NuxtLink to="/products" class="btn-ink mt-6">Kembali ke katalog</NuxtLink>
      </div>
    </div>

    <!-- Product (display:contents wrapper keeps layout identical) -->
    <div v-else class="contents">
    <!-- Breadcrumb (desktop) -->
    <div class="gutter mx-auto hidden max-w-[1540px] items-center gap-2 pt-6 text-xs text-ash lg:flex">
      <NuxtLink to="/" class="link-underline">Beranda</NuxtLink>
      <span>/</span>
      <NuxtLink to="/products" class="link-underline">Semua Produk</NuxtLink>
      <span>/</span>
      <NuxtLink :to="`/products?c=${collection?.id}`" class="link-underline">{{ collection?.shortName }}</NuxtLink>
      <span>/</span>
      <span class="text-ink">{{ scent!.name }}</span>
    </div>

    <div class="gutter mx-auto max-w-[1540px] lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-12 lg:pt-6 xl:gap-16">
      <!-- ============ MEDIA ============ -->
      <!-- Desktop: thumbs + main -->
      <div class="hidden min-w-0 lg:flex lg:items-start lg:gap-4">
        <div class="no-scrollbar flex max-h-[640px] w-20 shrink-0 flex-col gap-3 overflow-y-auto">
          <button
            v-for="(m, i) in media"
            :key="i"
            type="button"
            class="relative aspect-square shrink-0 overflow-hidden border bg-fog transition"
            :class="activeIndex === i ? 'border-ink' : 'border-transparent hover:border-smoke'"
            @click="activeIndex = i"
          >
            <img v-if="m.type === 'image'" :src="m.src" :alt="`${scent!.name} ${i + 1}`" class="size-full object-contain p-2" loading="lazy" />
            <span v-else class="grid size-full place-items-center bg-graphite text-paper">
              <BaseIcon name="sparkles" :size="18" />
            </span>
          </button>
        </div>

        <div class="relative aspect-square min-w-0 flex-1 overflow-hidden bg-fog">
          <img v-if="activeMedia?.type === 'image'" :src="activeMedia?.src" :alt="scent!.name" class="absolute inset-0 size-full object-contain p-12" />
          <video v-else :src="activeMedia?.src" class="absolute inset-0 size-full object-cover" autoplay muted loop playsinline />
          <div class="absolute left-4 top-4 flex flex-col gap-1.5">
            <span v-if="scent!.isNew" class="tag">BARU</span>
          </div>
        </div>
      </div>

      <!-- Mobile: swipeable gallery -->
      <div class="-mx-5 lg:hidden">
        <div class="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" @scroll.passive="(e) => (activeIndex = Math.round((e.target as HTMLElement).scrollLeft / (e.target as HTMLElement).clientWidth))">
          <div v-for="(m, i) in media" :key="i" class="relative aspect-square w-full shrink-0 snap-center bg-fog">
            <img v-if="m.type === 'image'" :src="m.src" :alt="`${scent!.name} ${i + 1}`" class="absolute inset-0 size-full object-contain p-10" />
            <video v-else :src="m.src" class="absolute inset-0 size-full object-cover" autoplay muted loop playsinline />
          </div>
        </div>
        <div class="mt-3 flex justify-center gap-1.5">
          <span v-for="(m, i) in media" :key="i" class="h-1.5 rounded-full transition-all" :class="activeIndex === i ? 'w-6 bg-ink' : 'w-1.5 bg-smoke'" />
        </div>
      </div>

      <!-- ============ INFO ============ -->
      <div class="min-w-0 pt-8 lg:pt-0">
        <!-- Badges -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="tag">Ready Stock</span>
          <span v-if="scent!.isNew" class="tag-line">Baru</span>
          <span class="tag-line">{{ collection?.shortName }}</span>
          <span v-if="scent!.concentration" class="tag-line">{{ scent!.concentration }}</span>
        </div>

        <h1 class="mt-4 font-display text-3xl leading-tight tracking-tight md:text-5xl">
          {{ scent!.name }}<span v-if="scent!.concentration" class="text-ash"> · {{ scent!.concentration }}</span>
        </h1>
        <p class="mt-1.5 text-sm text-ash">{{ collection?.name }} · {{ SHOP.gender }}</p>

        <!-- Share -->
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" class="inline-flex items-center gap-1.5 border border-smoke px-3 py-2 text-xs font-semibold transition hover:border-ink" @click="shareProduct">
            <BaseIcon :name="shareState === 'copied' ? 'check' : 'share'" :size="15" /> {{ shareState === 'copied' ? 'Link tersalin' : 'Bagikan' }}
          </button>
          <a :href="waShareLink" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 border border-smoke px-3 py-2 text-xs font-semibold transition hover:border-ink">
            <BaseIcon name="whatsapp" :size="15" /> WhatsApp
          </a>
          <button
            v-show="!isSeller"
            type="button"
            class="inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-semibold transition lg:hidden"
            :class="fav ? 'border-ink bg-ink text-paper' : 'border-smoke hover:border-ink'"
            @click="toggleFavorite(scent!.id)"
          >
            <BaseIcon name="heart" :size="15" :filled="fav" /> {{ fav ? 'Tersimpan' : 'Favorit' }}
          </button>
        </div>

        <!-- Price -->
        <div class="mt-5 flex items-baseline gap-3">
          <span class="font-display text-3xl font-semibold md:text-4xl">{{ formatRupiah((selectedSize?.price ?? 0)) }}</span>
          <span class="text-sm text-ash">/ {{ selectedSize?.label }}</span>
        </div>

        <!-- Value banner -->
        <div class="mt-5 flex items-center gap-3 border border-smoke bg-fog px-4 py-3.5">
          <BaseIcon name="droplet" :size="20" class="shrink-0" />
          <p class="flex-1 text-sm">
            <span class="font-semibold">Tips hemat.</span>
            <span class="text-ash"> Ukuran {{ bestValueMl }}ml paling murah per ml-nya.</span>
          </p>
        </div>

        <!-- Quantity info -->
        <div class="mt-5 border border-smoke">
          <div class="flex items-center justify-between px-4 py-3.5">
            <span class="text-sm font-semibold">Informasi Pembelian</span>
          </div>
          <div class="flex items-center justify-between border-t border-smoke px-4 py-3 text-sm text-ash">
            <span>Stok tersedia</span>
            <span class="font-medium" :class="outOfStock ? 'text-ash' : 'text-ink'">{{ outOfStock ? 'Habis' : `${stock} pcs` }}</span>
          </div>
          <div v-if="inCart > 0" class="flex items-center justify-between border-t border-smoke px-4 py-3 text-sm text-ash">
            <span>Sudah di keranjang</span><span class="font-medium text-ink">{{ inCart }} pcs</span>
          </div>
        </div>

        <!-- Sibling scents (varian) -->
        <div class="mt-7">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-semibold">Varian {{ collection?.shortName }}</p>
            <span class="text-xs text-ash">{{ siblings.length }} lainnya</span>
          </div>
          <div class="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
            <NuxtLink
              v-for="s in [scent!, ...siblings]"
              :key="s.id"
              :to="`/products/${s.id}/${s.slug}`"
              class="group relative size-16 shrink-0 overflow-hidden border bg-fog transition"
              :class="s.id === scent!.id ? 'border-ink' : 'border-smoke hover:border-ink'"
              :title="s.name"
            >
              <img :src="s.image" :alt="s.name" class="size-full object-contain p-1.5" loading="lazy" />
            </NuxtLink>
          </div>
        </div>

        <!-- Size selector -->
        <div class="mt-7">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-semibold">Pilih ukuran</p>
            <button type="button" class="link-underline inline-flex items-center gap-1 text-sm text-ash" @click="showSizeGuide = true">
              Panduan ukuran <BaseIcon name="chevron-right" :size="14" />
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <button
              v-for="s in scent!.sizes"
              :key="s.ml"
              type="button"
              class="flex flex-col items-start border px-4 py-3 text-left transition"
              :class="selectedMl === s.ml ? 'border-ink bg-ink text-paper' : 'border-smoke hover:border-ink'"
              @click="selectedMl = s.ml"
            >
              <span class="flex items-center gap-1.5 text-sm font-semibold">
                {{ s.label }}<span v-if="s.note" class="text-[10px] font-medium uppercase tracking-wide opacity-70">{{ s.note }}</span>
              </span>
              <span class="mt-0.5 text-xs" :class="selectedMl === s.ml ? 'text-paper/70' : 'text-ash'">{{ formatRupiah(s.price) }}</span>
            </button>
          </div>
        </div>

        <!-- Quantity + actions (desktop) — hidden for the seller -->
        <div v-show="!isSeller" class="mt-7 hidden items-stretch gap-3 lg:flex">
          <div class="flex items-center border border-smoke">
            <button type="button" class="grid size-12 place-items-center transition hover:bg-fog disabled:opacity-30" :disabled="qty <= 1" aria-label="Kurangi" @click="qty = Math.max(1, qty - 1)"><BaseIcon name="minus" :size="16" /></button>
            <span class="w-10 text-center text-sm font-semibold tabular-nums">{{ qty }}</span>
            <button type="button" class="grid size-12 place-items-center transition hover:bg-fog disabled:opacity-30" :disabled="qty >= remaining" aria-label="Tambah" @click="qty = Math.min(remaining, qty + 1)"><BaseIcon name="plus" :size="16" /></button>
          </div>
          <button type="button" class="btn-ink flex-1 disabled:opacity-40" :disabled="!canAdd" @click="add">
            <BaseIcon v-if="justAdded" name="check" :size="18" />
            {{ addLabel }}
          </button>
          <button
            type="button"
            class="grid size-12 shrink-0 place-items-center border transition"
            :class="fav ? 'border-ink bg-ink text-paper' : 'border-ink hover:bg-fog'"
            :aria-label="fav ? 'Hapus dari favorit' : 'Tambah ke favorit'"
            @click="toggleFavorite(scent!.id)"
          >
            <BaseIcon name="heart" :size="20" :filled="fav" />
          </button>
        </div>
        <a v-show="!isSeller" :href="whatsappLink(waMessage)" target="_blank" rel="noopener" class="btn-line mt-3 hidden w-full lg:flex">
          <BaseIcon name="whatsapp" :size="18" /> Pesan langsung via WhatsApp
        </a>

        <!-- Seller preview notice (replaces buy actions) -->
        <div v-if="isSeller" class="mt-7 border border-smoke bg-fog p-5">
          <p class="flex items-center gap-2 font-semibold"><BaseIcon name="shield" :size="18" /> Mode penjual</p>
          <p class="mt-1 text-sm text-ash">Anda login sebagai penjual. Halaman ini hanya pratinjau katalog — penjual tidak membeli produknya sendiri.</p>
          <NuxtLink to="/seller" class="btn-ink mt-4"><BaseIcon name="grid" :size="16" /> Ke Dashboard</NuxtLink>
        </div>

        <!-- Details accordion -->
        <div class="mt-9 divide-y divide-smoke border-t border-smoke">
          <details class="group" open>
            <summary class="flex cursor-pointer items-center justify-between py-4 text-sm font-semibold">
              Deskripsi <BaseIcon name="chevron-down" :size="18" class="text-ash transition-transform group-open:rotate-180" />
            </summary>
            <p class="pb-5 text-sm leading-relaxed text-ash">{{ collection?.description }}</p>
          </details>
          <details class="group">
            <summary class="flex cursor-pointer items-center justify-between py-4 text-sm font-semibold">
              Pengiriman <BaseIcon name="chevron-down" :size="18" class="text-ash transition-transform group-open:rotate-180" />
            </summary>
            <p class="pb-5 text-sm leading-relaxed text-ash">
              Dikirim dari {{ SHOP.shipFrom }}. Dikemas aman & anti-bocor. Pesanan diproses pada jam operasional toko: {{ SHOP.hours }}.
            </p>
          </details>
          <details class="group">
            <summary class="flex cursor-pointer items-center justify-between py-4 text-sm font-semibold">
              Catatan decant <BaseIcon name="chevron-down" :size="18" class="text-ash transition-transform group-open:rotate-180" />
            </summary>
            <p class="pb-5 text-sm leading-relaxed text-ash">
              Produk ini adalah decant/tester — parfum asli yang dibagi ke ukuran kecil. Ukuran 1ml hadir dalam botol oles (roll/dab), ukuran lainnya dalam botol semprot.
            </p>
          </details>
        </div>
      </div>
    </div>

    <!-- Mobile CTA: floats while scrolling, docks above the footer at the bottom -->
    <div v-show="!isSeller" class="sticky bottom-0 z-30 mt-8 border-t border-smoke bg-paper/95 backdrop-blur lg:hidden" style="padding-bottom: env(safe-area-inset-bottom)">
      <div class="gutter flex items-center gap-3 py-3">
        <div class="shrink-0">
          <p class="text-[11px] leading-none text-ash">{{ selectedSize?.label }}</p>
          <p class="font-display text-lg leading-tight">{{ formatRupiah((selectedSize?.price ?? 0) * qty) }}</p>
        </div>
        <button type="button" class="btn-ink flex-1 disabled:opacity-40" :disabled="!canAdd" @click="add">
          <BaseIcon v-if="justAdded" name="check" :size="18" />
          {{ addLabel }}
        </button>
        <a :href="whatsappLink(waMessage)" target="_blank" rel="noopener" aria-label="Pesan via WhatsApp" class="grid size-12 shrink-0 place-items-center rounded-sm border border-ink">
          <BaseIcon name="whatsapp" :size="22" />
        </a>
      </div>
    </div>

    <!-- Size guide modal -->
    <Teleport to="body">
      <Transition name="search">
        <div v-if="showSizeGuide" class="fixed inset-0 z-50 grid place-items-center p-5" @click.self="showSizeGuide = false">
          <div class="absolute inset-0 bg-ink/40" @click="showSizeGuide = false" />
          <div class="relative w-full max-w-md bg-paper p-7">
            <div class="flex items-start justify-between">
              <h3 class="font-display text-2xl">Panduan ukuran</h3>
              <button type="button" class="-mr-2 -mt-1 grid size-9 place-items-center" aria-label="Tutup" @click="showSizeGuide = false"><BaseIcon name="x" :size="22" /></button>
            </div>
            <p class="mt-2 text-sm text-ash">Perkiraan jumlah pemakaian per ukuran (1 semprot ≈ 0,1ml).</p>
            <ul class="mt-5 divide-y divide-smoke border-y border-smoke">
              <li class="flex items-center justify-between py-3 text-sm"><span class="font-semibold">1ml (oles)</span><span class="text-ash">± 10 pemakaian · botol roll/dab</span></li>
              <li class="flex items-center justify-between py-3 text-sm"><span class="font-semibold">2ml</span><span class="text-ash">± 20 semprot</span></li>
              <li class="flex items-center justify-between py-3 text-sm"><span class="font-semibold">3ml</span><span class="text-ash">± 30 semprot</span></li>
              <li class="flex items-center justify-between py-3 text-sm"><span class="font-semibold">5ml</span><span class="text-ash">± 50 semprot</span></li>
              <li class="flex items-center justify-between py-3 text-sm"><span class="font-semibold">10ml</span><span class="text-ash">± 100 semprot · paling hemat</span></li>
            </ul>
            <button type="button" class="btn-ink mt-6 w-full" @click="showSizeGuide = false">Mengerti</button>
          </div>
        </div>
      </Transition>
    </Teleport>
    </div>
  </div>
</template>
