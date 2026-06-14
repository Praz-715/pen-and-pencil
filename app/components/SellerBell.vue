<script setup lang="ts">
const { count, refresh } = useSellerNotifications()
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  refresh()
  timer = setInterval(refresh, 30000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <NuxtLink
    to="/seller/orders"
    class="relative grid size-10 place-items-center text-ink transition hover:opacity-60"
    aria-label="Notifikasi pesanan baru"
  >
    <BaseIcon name="bell" :size="20" />
    <span
      v-if="count"
      class="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold leading-4 text-paper"
    >{{ count }}</span>
  </NuxtLink>
</template>
