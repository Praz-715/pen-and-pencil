<script setup lang="ts">
const { searchOpen, menuOpen } = useUi()
const favorites = useFavorites()
const cartStore = useCart()
const { isSeller } = useAuth()
const { collectionsInUse } = useProducts()

const buyerLinks = computed(() => [
  { label: 'Semua Produk', to: '/products' },
  ...collectionsInUse.value.slice(0, 4).map((c) => ({ label: c.shortName, to: `/products?c=${c.id}` })),
  { label: 'Tentang', to: '/about' },
])
const sellerLinks = [
  { label: 'Dashboard', to: '/seller' },
  { label: 'Pesanan', to: '/seller/orders' },
  { label: 'Produk', to: '/seller/products' },
  { label: 'Lihat Toko', to: '/products' },
]
const navLinks = computed(() => (isSeller.value ? sellerLinks : buyerLinks.value))
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-smoke bg-paper/85 backdrop-blur-md">
    <div
      class="gutter relative mx-auto flex h-[var(--header-h)] max-w-[1540px] items-center justify-between gap-3"
    >
      <!-- Left: mobile menu + wordmark -->
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="-ml-1.5 grid size-10 place-items-center lg:hidden"
          aria-label="Buka menu"
          @click="menuOpen = true"
        >
          <BaseIcon name="menu" :size="22" />
        </button>

        <NuxtLink to="/" class="group flex items-baseline gap-2 leading-none" aria-label="Pen & Pencil — beranda">
          <span class="font-display text-[1.35rem] font-semibold tracking-tight text-ink sm:text-2xl">
            Pen<span class="px-0.5 italic text-ash">&amp;</span>Pencil
          </span>
        </NuxtLink>
      </div>

      <!-- Center: desktop nav (role-aware) -->
      <nav class="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
        <ClientOnly>
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="link-underline text-[0.82rem] font-semibold uppercase tracking-[0.13em] text-ink/80 transition-colors hover:text-ink"
          >
            {{ link.label }}
          </NuxtLink>
          <template #fallback>
            <NuxtLink
              v-for="link in buyerLinks"
              :key="link.to"
              :to="link.to"
              class="link-underline text-[0.82rem] font-semibold uppercase tracking-[0.13em] text-ink/80 transition-colors hover:text-ink"
            >
              {{ link.label }}
            </NuxtLink>
          </template>
        </ClientOnly>
      </nav>

      <!-- Right: utilities -->
      <div class="flex items-center gap-0.5 sm:gap-1">
        <button
          type="button"
          class="grid size-10 place-items-center text-ink transition hover:opacity-60"
          aria-label="Cari parfum"
          @click="searchOpen = true"
        >
          <BaseIcon name="search" :size="20" />
        </button>

        <ClientOnly>
          <!-- Seller sees a notification bell; everyone else gets wishlist + cart -->
          <SellerBell v-if="isSeller" />
          <template v-else>
            <NuxtLink
              to="/favorites"
              class="relative grid size-10 place-items-center text-ink transition hover:opacity-60"
              aria-label="Favorit"
            >
              <BaseIcon name="heart" :size="20" />
              <span
                v-if="favorites.count.value"
                class="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold leading-4 text-paper"
              >{{ favorites.count.value }}</span>
            </NuxtLink>

            <NuxtLink
              to="/cart"
              class="relative grid size-10 place-items-center text-ink transition hover:opacity-60"
              aria-label="Keranjang"
            >
              <BaseIcon name="bag" :size="20" />
              <span
                v-if="cartStore.count.value"
                class="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold leading-4 text-paper"
              >{{ cartStore.count.value }}</span>
            </NuxtLink>
          </template>

          <template #fallback>
            <NuxtLink to="/favorites" class="grid size-10 place-items-center text-ink" aria-label="Favorit"><BaseIcon name="heart" :size="20" /></NuxtLink>
            <NuxtLink to="/cart" class="grid size-10 place-items-center text-ink" aria-label="Keranjang"><BaseIcon name="bag" :size="20" /></NuxtLink>
          </template>
        </ClientOnly>

        <AccountMenu />
      </div>
    </div>
  </header>
</template>
