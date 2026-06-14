<script setup lang="ts">
definePageMeta({ middleware: 'seller' })
useHead({ title: `Tambah Produk — ${SHOP.name}` })

const { refresh } = useProducts()
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
    <h1 class="mb-8 font-display text-4xl tracking-tight md:text-5xl">Tambah Produk</h1>
    <ProductForm @saved="onSaved" />
  </div>
</template>
