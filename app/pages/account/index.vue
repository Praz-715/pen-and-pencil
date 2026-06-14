<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { user, isSeller, signOut } = useAuth()
useHead({ title: `Akun — ${SHOP.name}` })

const buyerLinks = [
  { to: '/account/orders', icon: 'package', label: 'Pesanan saya', desc: 'Lacak status pesananmu' },
  { to: '/account/addresses', icon: 'map-pin', label: 'Alamat', desc: 'Kelola alamat pengiriman' },
  { to: '/products', icon: 'search', label: 'Belanja', desc: 'Jelajahi katalog' },
]
</script>

<template>
  <div class="gutter mx-auto max-w-3xl py-8 md:py-14">
    <p class="eyebrow text-ash">Akun</p>
    <h1 class="mt-2 font-display text-4xl tracking-tight md:text-6xl">Profil</h1>

    <ClientOnly>
      <div class="mt-8 flex items-start gap-4 border border-smoke p-6">
        <span class="grid size-14 shrink-0 place-items-center rounded-full bg-ink text-paper font-display text-xl">
          {{ user?.name?.charAt(0)?.toUpperCase() }}
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="font-display text-2xl leading-tight">{{ user?.name }}</h2>
            <span class="tag">{{ isSeller ? 'Penjual' : 'Pembeli' }}</span>
          </div>
          <p class="mt-0.5 truncate text-sm text-ash">{{ user?.email }}</p>
          <p v-if="user?.phone" class="text-sm text-ash">{{ user.phone }}</p>
        </div>
        <button type="button" class="btn-line shrink-0 !px-4" @click="signOut">
          <BaseIcon name="log-out" :size="16" /> <span class="hidden sm:inline">Keluar</span>
        </button>
      </div>

      <!-- Seller shortcut -->
      <NuxtLink v-if="isSeller" to="/seller" class="mt-6 flex items-center justify-between border border-ink bg-ink p-6 text-paper transition hover:bg-graphite">
        <div>
          <p class="eyebrow text-paper/50">Penjual</p>
          <p class="mt-1 font-display text-2xl">Buka Dashboard</p>
        </div>
        <BaseIcon name="arrow-right" :size="22" />
      </NuxtLink>

      <!-- Buyer links -->
      <div v-else class="mt-6 grid gap-px overflow-hidden border border-smoke bg-smoke sm:grid-cols-3">
        <NuxtLink v-for="l in buyerLinks" :key="l.to" :to="l.to" class="bg-paper p-6 transition hover:bg-fog">
          <BaseIcon :name="l.icon" :size="24" />
          <h3 class="mt-4 font-display text-xl">{{ l.label }}</h3>
          <p class="mt-1 text-sm text-ash">{{ l.desc }}</p>
        </NuxtLink>
      </div>

      <template #fallback>
        <div class="mt-8 h-28 animate-pulse bg-fog" />
      </template>
    </ClientOnly>
  </div>
</template>
