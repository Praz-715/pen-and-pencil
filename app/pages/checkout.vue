<script setup lang="ts">
import type { AddressRecord } from '~/components/AddressForm.vue'
definePageMeta({ middleware: 'buyer' })
useHead({ title: `Checkout — ${SHOP.name}` })

const { cart } = useCart()
const { getById } = useProducts()

interface Line { scent: Scent; ml: number; label: string; qty: number; unit: number; total: number }
const lines = computed<Line[]>(() =>
  cart.value
    .map((i) => {
      const scent = getById(i.scentId)
      if (!scent) return null
      const size = scent.sizes.find((s) => s.ml === i.ml)
      return { scent, ml: i.ml, label: size?.label ?? `${i.ml}ml`, qty: i.qty, unit: size?.price ?? 0, total: (size?.price ?? 0) * i.qty }
    })
    .filter(Boolean) as Line[],
)
const subtotal = computed(() => lines.value.reduce((sum, l) => sum + l.total, 0))
const stockIssue = computed(() => lines.value.find((l) => l.qty > l.scent.stock) ?? null)

const { data: addresses, refresh } = await useFetch<AddressRecord[]>('/api/addresses', {
  server: false,
  default: () => [],
})

const selectedId = ref<string | null>(null)
const showAddrForm = ref(false)
const paymentMethod = ref<'transfer' | 'cod'>('transfer')
const notes = ref('')
const placing = ref(false)
const errorMsg = ref('')

watch(
  addresses,
  (list) => {
    if (!list?.length) {
      showAddrForm.value = true
      selectedId.value = null
    } else if (!selectedId.value || !list.find((a) => a.id === selectedId.value)) {
      selectedId.value = (list.find((a) => a.isDefault) ?? list[0])?.id ?? null
      showAddrForm.value = false
    }
  },
  { immediate: true },
)

async function onAddrSaved() {
  await refresh()
  showAddrForm.value = false
}

async function placeOrder() {
  errorMsg.value = ''
  if (!lines.value.length) {
    errorMsg.value = 'Keranjang kosong.'
    return
  }
  if (!selectedId.value) {
    errorMsg.value = 'Pilih atau tambahkan alamat pengiriman.'
    return
  }
  if (stockIssue.value) {
    errorMsg.value = `Stok "${stockIssue.value.scent.name}" tidak cukup (sisa ${stockIssue.value.scent.stock}). Sesuaikan jumlah di keranjang.`
    return
  }
  placing.value = true
  try {
    const res = await $fetch<{ id: string; code: string }>('/api/orders', {
      method: 'POST',
      body: {
        addressId: selectedId.value,
        paymentMethod: paymentMethod.value,
        notes: notes.value.trim() || undefined,
      },
    })
    cart.value = [] // server already emptied the DB cart
    await navigateTo(`/account/orders/${res.id}`)
  } catch (e: unknown) {
    const ex = e as { data?: { statusMessage?: string }; statusMessage?: string }
    errorMsg.value = ex?.data?.statusMessage || ex?.statusMessage || 'Gagal membuat pesanan.'
    placing.value = false
  }
}
</script>

<template>
  <div class="gutter mx-auto max-w-[1100px] pt-8 md:pt-12 lg:pb-12">
    <h1 class="font-display text-4xl tracking-tight md:text-5xl">Checkout</h1>

    <ClientOnly>
      <div v-if="!lines.length" class="mt-8 grid place-items-center border border-dashed border-smoke py-20 text-center">
        <div>
          <BaseIcon name="bag" :size="32" class="mx-auto text-pewter" />
          <p class="mt-4 font-display text-2xl">Keranjang kosong</p>
          <NuxtLink to="/products" class="btn-ink mt-6">Mulai belanja</NuxtLink>
        </div>
      </div>

      <div v-else class="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
        <!-- Left: address + payment -->
        <div class="space-y-10">
          <!-- Address -->
          <section>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="font-display text-2xl">Alamat pengiriman</h2>
              <button v-if="addresses.length && !showAddrForm" type="button" class="link-underline text-sm font-semibold" @click="showAddrForm = true">
                + Alamat baru
              </button>
            </div>

            <div v-if="showAddrForm" class="border border-ink p-5">
              <AddressForm @saved="onAddrSaved" @cancel="addresses.length ? (showAddrForm = false) : null" />
            </div>

            <ul v-else class="grid gap-3 sm:grid-cols-2">
              <li v-for="a in addresses" :key="a.id">
                <button
                  type="button"
                  class="flex w-full flex-col border p-4 text-left transition"
                  :class="selectedId === a.id ? 'border-ink ring-1 ring-ink' : 'border-smoke hover:border-ink'"
                  @click="selectedId = a.id ?? null"
                >
                  <span class="flex items-center gap-2">
                    <span class="font-semibold">{{ a.label }}</span>
                    <span v-if="a.isDefault" class="tag">Utama</span>
                  </span>
                  <span class="mt-1 text-sm">{{ a.recipient }} · {{ a.phone }}</span>
                  <span class="mt-0.5 text-sm text-ash">{{ a.line }}, {{ a.city }} {{ a.postalCode }}</span>
                </button>
              </li>
            </ul>
          </section>

          <!-- Payment -->
          <section>
            <h2 class="mb-4 font-display text-2xl">Metode pembayaran</h2>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="flex cursor-pointer items-start gap-3 border p-4 transition" :class="paymentMethod === 'transfer' ? 'border-ink ring-1 ring-ink' : 'border-smoke'">
                <input v-model="paymentMethod" type="radio" value="transfer" class="mt-0.5 size-4 accent-ink" />
                <span><span class="block font-semibold">Transfer Bank</span><span class="text-sm text-ash">Konfirmasi & instruksi via penjual.</span></span>
              </label>
              <label class="flex cursor-pointer items-start gap-3 border p-4 transition" :class="paymentMethod === 'cod' ? 'border-ink ring-1 ring-ink' : 'border-smoke'">
                <input v-model="paymentMethod" type="radio" value="cod" class="mt-0.5 size-4 accent-ink" />
                <span><span class="block font-semibold">COD / Bayar di tempat</span><span class="text-sm text-ash">Untuk area tertentu.</span></span>
              </label>
            </div>
          </section>

          <!-- Notes -->
          <section>
            <h2 class="mb-3 font-display text-2xl">Catatan <span class="text-base font-normal text-ash">(opsional)</span></h2>
            <textarea v-model="notes" rows="2" placeholder="Patokan alamat, request packing, dll." class="w-full border border-smoke px-4 py-3 text-sm outline-none focus:border-ink" />
          </section>
        </div>

        <!-- Right: summary -->
        <aside class="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div class="border border-smoke p-6">
            <h2 class="font-display text-2xl">Ringkasan</h2>
            <ul class="mt-5 space-y-3">
              <li v-for="l in lines" :key="`${l.scent.id}-${l.ml}`" class="flex gap-3">
                <span class="grid size-12 shrink-0 place-items-center bg-fog">
                  <img :src="l.scent.image" :alt="l.scent.name" class="size-full object-contain p-1" />
                </span>
                <span class="min-w-0 flex-1 text-sm">
                  <span class="block truncate font-medium">{{ l.scent.name }}</span>
                  <span class="text-ash">{{ l.label }} × {{ l.qty }}</span>
                </span>
                <span class="shrink-0 text-sm font-medium">{{ formatRupiah(l.total) }}</span>
              </li>
            </ul>
            <dl class="mt-5 space-y-2 border-t border-smoke pt-5 text-sm">
              <div class="flex justify-between"><dt class="text-ash">Subtotal</dt><dd>{{ formatRupiah(subtotal) }}</dd></div>
              <div class="flex justify-between"><dt class="text-ash">Ongkir</dt><dd class="text-ash">Dihitung penjual</dd></div>
            </dl>
            <div class="mt-4 flex justify-between border-t border-smoke pt-4">
              <span class="font-display text-lg">Total</span>
              <span class="font-display text-lg">{{ formatRupiah(subtotal) }}</span>
            </div>

            <p v-if="stockIssue" class="mt-4 bg-fog px-4 py-3 text-sm text-ink">
              Stok "{{ stockIssue.scent.name }}" tidak cukup (sisa {{ stockIssue.scent.stock }}). Sesuaikan jumlah di keranjang.
            </p>
            <p v-else-if="errorMsg" class="mt-4 bg-fog px-4 py-3 text-sm text-ink">{{ errorMsg }}</p>

            <button type="button" class="btn-ink mt-5 hidden w-full disabled:opacity-40 lg:flex" :disabled="placing || !!stockIssue" @click="placeOrder">
              {{ placing ? 'Memproses…' : 'Buat pesanan' }}
            </button>
            <p class="mt-3 text-center text-xs text-ash">Pesanan dikirim ke penjual untuk dikonfirmasi & diproses.</p>
          </div>
        </aside>
      </div>

      <!-- Mobile place-order bar: floats while scrolling, docks above the footer at the bottom -->
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
          <button type="button" class="btn-ink flex-1 disabled:opacity-40" :disabled="placing || !!stockIssue" @click="placeOrder">
            {{ placing ? 'Memproses…' : 'Buat pesanan' }}
          </button>
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
        <div class="mt-8 h-64 animate-pulse bg-fog" />
      </template>
    </ClientOnly>
  </div>
</template>
