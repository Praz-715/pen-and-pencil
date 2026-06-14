<script setup lang="ts">
definePageMeta({ middleware: 'buyer' })
const { favorites } = useFavorites()
const { getById } = useProducts()
const items = computed<Scent[]>(() => favorites.value.map((id) => getById(id)).filter(Boolean) as Scent[])
useHead({ title: `Favorit — ${SHOP.name}` })
</script>

<template>
  <div class="gutter mx-auto max-w-[1540px] py-8 md:py-12">
    <div class="mb-8 md:mb-10">
      <p class="eyebrow text-ash">Wishlist</p>
      <h1 class="mt-2 font-display text-4xl tracking-tight md:text-6xl">Favorit</h1>
    </div>

    <ClientOnly>
      <ProductGrid v-if="items.length" :scents="items" />
      <div v-else class="grid place-items-center border border-dashed border-smoke py-24 text-center">
        <div class="max-w-sm">
          <BaseIcon name="heart" :size="34" class="mx-auto text-pewter" />
          <p class="mt-4 font-display text-2xl">Belum ada favorit</p>
          <p class="mt-1 text-sm text-ash">Ketuk ikon hati di produk untuk menyimpannya di sini.</p>
          <NuxtLink to="/products" class="btn-ink mt-7">Jelajahi katalog</NuxtLink>
        </div>
      </div>

      <template #fallback>
        <div class="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
          <div v-for="n in 4" :key="n" class="aspect-square animate-pulse bg-fog" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
