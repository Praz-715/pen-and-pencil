<script setup lang="ts">
definePageMeta({ middleware: 'seller' })
const route = useRoute()
const { data: product, pending, error } = await useFetch<Scent>(`/api/products/${route.params.id}`, { server: false })
const { refresh } = useProducts()
useHead({ title: () => (product.value ? `Ubah ${product.value.name} — ${SHOP.name}` : `Ubah Produk`) })

async function onSaved() {
  await refresh()
  await navigateTo('/seller/products')
}
</script>

<template>
  <div class="gutter mx-auto max-w-4xl py-8 md:py-12">
    <NuxtLink to="/seller/products" class="link-underline mb-3 inline-flex items-center gap-1.5 text-sm text-ash">
      <BaseIcon name="arrow-left" :size="15" /> Kelola produk
    </NuxtLink>

    <ClientOnly>
      <div v-if="pending" class="h-96 animate-pulse bg-fog" />
      <div v-else-if="error || !product" class="grid place-items-center border border-dashed border-smoke py-20 text-center">
        <p class="font-display text-2xl">Produk tidak ditemukan</p>
      </div>
      <div v-else>
        <h1 class="mb-8 font-display text-4xl tracking-tight md:text-5xl">Ubah Produk</h1>
        <ProductForm :product="{ ...product, concentration: product.concentration ?? '' }" @saved="onSaved" />
      </div>
      <template #fallback>
        <div class="h-96 animate-pulse bg-fog" />
      </template>
    </ClientOnly>
  </div>
</template>
