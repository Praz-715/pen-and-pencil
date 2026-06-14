<script setup lang="ts">
const { menuOpen } = useUi()
const { user, loggedIn, isSeller, signOut } = useAuth()
const { collectionsInUse } = useProducts()
const route = useRoute()

const buyerLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Semua Produk', to: '/products' },
  { label: 'Tentang', to: '/about' },
]
const sellerLinks = [
  { label: 'Dashboard', to: '/seller' },
  { label: 'Pesanan', to: '/seller/orders' },
  { label: 'Produk', to: '/seller/products' },
  { label: 'Lihat Toko', to: '/products' },
]
const links = computed(() => (isSeller.value ? sellerLinks : buyerLinks))

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

watch(menuOpen, (open) => {
  if (import.meta.client) document.documentElement.style.overflow = open ? 'hidden' : ''
})
onUnmounted(() => {
  if (import.meta.client) document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="menu">
      <div v-if="menuOpen" class="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden">
        <!-- Bar -->
        <div class="gutter flex h-[var(--header-h)] items-center justify-between border-b border-smoke">
          <span class="font-display text-2xl font-semibold tracking-tight">
            Pen<span class="px-0.5 italic text-ash">&amp;</span>Pencil
          </span>
          <button type="button" class="-mr-1.5 grid size-10 place-items-center" aria-label="Tutup menu" @click="menuOpen = false">
            <BaseIcon name="x" :size="24" />
          </button>
        </div>

        <!-- Links -->
        <nav class="gutter flex flex-col py-2">
          <NuxtLink
            v-for="(link, i) in links"
            :key="link.to"
            :to="link.to"
            class="reveal flex items-center justify-between border-b border-smoke py-5"
            :style="{ animationDelay: `${i * 60}ms` }"
          >
            <span class="font-display text-3xl tracking-tight">{{ link.label }}</span>
            <BaseIcon name="arrow-up-right" :size="22" class="text-ash" />
          </NuxtLink>
        </nav>

        <!-- Collections (buyers only) -->
        <div v-if="!isSeller" class="gutter mt-2">
          <p class="eyebrow mb-3 text-ash">Koleksi</p>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="c in collectionsInUse"
              :key="c.id"
              :to="`/products?c=${c.id}`"
              class="tag-line"
            >{{ c.shortName }}</NuxtLink>
          </div>
        </div>

        <!-- Footer of menu -->
        <div class="gutter mt-auto space-y-4 border-t border-smoke py-5 text-sm">
          <ClientOnly>
            <div v-if="loggedIn" class="space-y-3">
              <div>
                <p class="font-display text-lg leading-tight">{{ user?.name }}</p>
                <p class="text-xs text-ash">{{ user?.email }}<span v-if="isSeller"> · Penjual</span></p>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-2 font-semibold">
                <NuxtLink v-if="isSeller" to="/seller" class="link-underline">Dashboard</NuxtLink>
                <NuxtLink v-if="isSeller" to="/seller/orders" class="link-underline">Kelola pesanan</NuxtLink>
                <NuxtLink v-if="!isSeller" to="/account/orders" class="link-underline">Pesanan saya</NuxtLink>
                <NuxtLink v-if="!isSeller" to="/account/addresses" class="link-underline">Alamat</NuxtLink>
                <NuxtLink to="/account" class="link-underline">Profil</NuxtLink>
                <button type="button" class="link-underline text-ash" @click="signOut">Keluar</button>
              </div>
            </div>
            <div v-else class="flex gap-3">
              <NuxtLink to="/login" class="btn-ink flex-1">Masuk</NuxtLink>
              <NuxtLink to="/signup" class="btn-line flex-1">Daftar</NuxtLink>
            </div>
          </ClientOnly>

          <div class="flex items-center gap-2 border-t border-smoke pt-4 text-ash">
            <BaseIcon name="clock" :size="16" />
            <span>{{ SHOP.hours }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.3s var(--ease-out-expo), transform 0.4s var(--ease-out-expo);
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-2%);
}
</style>
