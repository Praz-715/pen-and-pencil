<script setup lang="ts">
/** Responsive product grid: 2 cols mobile, 3 tablet, 4 desktop. */
defineProps<{ scents: Scent[] }>()
</script>

<template>
  <div class="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4 xl:gap-x-7">
    <ProductCard
      v-for="(scent, i) in scents"
      :key="scent.id"
      :scent="scent"
      :index="i"
    />
  </div>
</template>
