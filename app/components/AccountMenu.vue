<script setup lang="ts">
const { user, loggedIn, isSeller, signOut } = useAuth()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const route = useRoute()

function onDoc(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDoc))
onUnmounted(() => document.removeEventListener('click', onDoc))
watch(() => route.fullPath, () => (open.value = false))

const itemCls =
  'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink transition hover:bg-fog'
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="grid size-10 place-items-center text-ink transition hover:opacity-60"
      aria-label="Akun"
      @click="open = !open"
    >
      <BaseIcon name="user" :size="20" />
    </button>

    <ClientOnly>
      <Transition name="dropdown">
        <div
          v-if="open"
          class="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden border border-smoke bg-paper shadow-[0_16px_50px_-12px_rgba(0,0,0,0.25)]"
        >
          <template v-if="loggedIn">
            <div class="border-b border-smoke px-4 py-3.5">
              <p class="truncate font-display text-lg leading-tight">{{ user?.name }}</p>
              <p class="truncate text-xs text-ash">{{ user?.email }}</p>
              <span v-if="isSeller" class="tag mt-2 inline-flex">Penjual</span>
            </div>
            <nav class="py-1">
              <NuxtLink v-if="isSeller" to="/seller" :class="itemCls"><BaseIcon name="grid" :size="17" /> Dashboard</NuxtLink>
              <NuxtLink v-if="isSeller" to="/seller/orders" :class="itemCls"><BaseIcon name="package" :size="17" /> Kelola pesanan</NuxtLink>
              <NuxtLink v-if="isSeller" to="/seller/products" :class="itemCls"><BaseIcon name="droplet" :size="17" /> Kelola produk</NuxtLink>
              <NuxtLink v-if="!isSeller" to="/account/orders" :class="itemCls"><BaseIcon name="package" :size="17" /> Pesanan saya</NuxtLink>
              <NuxtLink v-if="!isSeller" to="/account/addresses" :class="itemCls"><BaseIcon name="map-pin" :size="17" /> Alamat</NuxtLink>
              <NuxtLink to="/account" :class="itemCls"><BaseIcon name="user" :size="17" /> Profil</NuxtLink>
              <button type="button" :class="itemCls" @click="signOut"><BaseIcon name="log-out" :size="17" /> Keluar</button>
            </nav>
          </template>
          <div v-else class="p-4">
            <p class="text-sm text-ash">Masuk untuk checkout & melacak pesanan.</p>
            <NuxtLink to="/login" class="btn-ink mt-3 w-full">Masuk</NuxtLink>
            <NuxtLink to="/signup" class="btn-line mt-2 w-full">Daftar</NuxtLink>
          </div>
        </div>
      </Transition>
    </ClientOnly>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.18s ease, transform 0.22s var(--ease-out-expo);
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
