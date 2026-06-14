<script setup lang="ts">
definePageMeta({ middleware: 'buyer' })
const { cart, updateQty, removeItem, clear } = useCart()
const { getById } = useProducts()

interface Line {
  scent: Scent
  ml: number
  label: string
  qty: number
  unit: number
  total: number
}
const lines = computed<Line[]>(() =>
  cart.value
    .map((i) => {
      const scent = getById(i.scentId)
      if (!scent) return null
      const size = scent.sizes.find((s) => s.ml === i.ml)
      const unit = size?.price ?? 0
      return { scent, ml: i.ml, label: size?.label ?? `${i.ml}ml`, qty: i.qty, unit, total: unit * i.qty }
    })
    .filter(Boolean) as Line[],
)
const subtotal = computed(() => lines.value.reduce((sum, l) => sum + l.total, 0))

useHead({ title: `Keranjang — ${SHOP.name}` })
</script>

<template>
  <div class="gutter mx-auto max-w-[1540px] pt-8 md:pt-12 lg:pb-12">
    <div class="mb-8 flex items-end justify-between md:mb-10">
      <div>
        <p class="eyebrow text-ash">Pesanan</p>
        <h1 class="mt-2 font-display text-4xl tracking-tight md:text-6xl">Keranjang</h1>
      </div>
      <ClientOnly>
        <button v-if="lines.length" type="button" class="link-underline text-sm text-ash" @click="clear">Kosongkan</button>
      </ClientOnly>
    </div>

    <ClientOnly>
      <div v-if="lines.length" class="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
        <!-- Lines -->
        <ul class="divide-y divide-smoke border-y border-smoke">
          <li v-for="l in lines" :key="`${l.scent.id}-${l.ml}`" class="flex gap-4 py-5">
            <NuxtLink :to="`/products/${l.scent.id}/${l.scent.slug}`" class="grid size-24 shrink-0 place-items-center bg-fog">
              <img :src="l.scent.image" :alt="l.scent.name" class="size-full object-contain p-2.5" />
            </NuxtLink>
            <div class="flex min-w-0 flex-1 flex-col">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="eyebrow text-ash">{{ getCollection(l.scent.collectionId)?.shortName }}</p>
                  <NuxtLink :to="`/products/${l.scent.id}/${l.scent.slug}`" class="mt-1 block font-display text-xl leading-tight">
                    {{ l.scent.name }}<span v-if="l.scent.concentration" class="text-ash"> · {{ l.scent.concentration }}</span>
                  </NuxtLink>
                  <p class="mt-0.5 text-sm text-ash">Ukuran {{ l.label }} · {{ formatRupiah(l.unit) }}/pcs</p>
                  <p v-if="l.qty >= l.scent.stock" class="mt-0.5 text-xs" :class="l.qty > l.scent.stock ? 'text-ink' : 'text-ash'">
                    {{ l.scent.stock <= 0 ? 'Stok habis' : l.qty > l.scent.stock ? `Melebihi stok — sisa ${l.scent.stock}` : `Maksimal stok (${l.scent.stock})` }}
                  </p>
                </div>
                <button type="button" class="grid size-9 shrink-0 place-items-center text-ash transition hover:text-ink" aria-label="Hapus" @click="removeItem(l.scent.id, l.ml)">
                  <BaseIcon name="trash" :size="18" />
                </button>
              </div>
              <div class="mt-auto flex items-center justify-between pt-3">
                <div class="flex items-center border border-smoke">
                  <button type="button" class="grid size-9 place-items-center transition hover:bg-fog" aria-label="Kurangi" @click="updateQty(l.scent.id, l.ml, l.qty - 1)"><BaseIcon name="minus" :size="14" /></button>
                  <span class="w-9 text-center text-sm font-semibold tabular-nums">{{ l.qty }}</span>
                  <button type="button" class="grid size-9 place-items-center transition hover:bg-fog disabled:opacity-30" aria-label="Tambah" :disabled="l.qty >= l.scent.stock" @click="updateQty(l.scent.id, l.ml, Math.min(l.qty + 1, l.scent.stock))"><BaseIcon name="plus" :size="14" /></button>
                </div>
                <span class="font-display text-lg">{{ formatRupiah(l.total) }}</span>
              </div>
            </div>
          </li>
        </ul>

        <!-- Summary -->
        <aside class="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div class="border border-smoke p-6">
            <h2 class="font-display text-2xl">Ringkasan</h2>
            <dl class="mt-5 space-y-3 text-sm">
              <div class="flex justify-between"><dt class="text-ash">Subtotal</dt><dd class="font-medium">{{ formatRupiah(subtotal) }}</dd></div>
              <div class="flex justify-between"><dt class="text-ash">Ongkir</dt><dd class="text-ash">Dihitung saat chat</dd></div>
            </dl>
            <div class="mt-5 flex justify-between border-t border-smoke pt-5">
              <span class="font-display text-lg">Total</span>
              <span class="font-display text-lg">{{ formatRupiah(subtotal) }}</span>
            </div>
            <NuxtLink to="/checkout" class="btn-ink mt-6 hidden w-full lg:flex">
              Checkout <BaseIcon name="arrow-right" :size="16" />
            </NuxtLink>
            <p class="mt-3 hidden text-center text-xs text-ash lg:block">Bayar & lacak pesanan langsung di aplikasi.</p>
            <a :href="SHOP.shopeeUrl" target="_blank" rel="noopener" class="btn-line mt-3 w-full lg:mt-3">Atau beli via Shopee</a>
          </div>
          <NuxtLink to="/products" class="link-underline mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
            <BaseIcon name="arrow-left" :size="16" /> Lanjut belanja
          </NuxtLink>
        </aside>
      </div>

      <!-- Empty -->
      <div v-else class="grid place-items-center border border-dashed border-smoke py-24 text-center">
        <div class="max-w-sm">
          <BaseIcon name="bag" :size="34" class="mx-auto text-pewter" />
          <p class="mt-4 font-display text-2xl">Keranjang kosong</p>
          <p class="mt-1 text-sm text-ash">Yuk pilih wangi favoritmu dulu.</p>
          <NuxtLink to="/products" class="btn-ink mt-7">Mulai belanja</NuxtLink>
        </div>
      </div>

      <!-- Mobile checkout bar: floats while scrolling, docks above the footer at the bottom -->
      <div
        v-if="lines.length"
        class="sticky bottom-0 z-30 -mx-5 mt-8 border-t border-smoke bg-paper/95 backdrop-blur md:-mx-8 lg:hidden"
        style="padding-bottom: env(safe-area-inset-bottom)"
      >
        <div class="gutter flex items-center gap-3 py-3">
          <div class="shrink-0">
            <p class="text-[11px] leading-none text-ash">Total</p>
            <p class="font-display text-lg leading-tight">{{ formatRupiah(subtotal) }}</p>
          </div>
          <NuxtLink to="/checkout" class="btn-ink flex-1">Checkout <BaseIcon name="arrow-right" :size="16" /></NuxtLink>
          <a
            :href="whatsappLink(`Halo ${SHOP.name}, saya mau tanya soal pesanan 🙏`)"
            target="_blank"
            rel="noopener"
            aria-label="Tanya via WhatsApp"
            class="grid size-12 shrink-0 place-items-center rounded-sm border border-ink"
          >
            <BaseIcon name="whatsapp" :size="22" />
          </a>
        </div>
      </div>

      <template #fallback>
        <div class="h-64 animate-pulse bg-fog" />
      </template>
    </ClientOnly>
  </div>
</template>
