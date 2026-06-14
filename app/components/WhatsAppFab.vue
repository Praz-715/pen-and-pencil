<script setup lang="ts">
const href = whatsappLink(
  `Halo ${SHOP.name}! Saya mau tanya soal decant parfum yang tersedia 🙏`,
)
// Hide on pages that carry their own sticky bottom CTA (product detail, cart, checkout)
// so the floating button never overlaps those bars. Also hide for the seller entirely —
// the seller would just be messaging their own shop (and on every /seller page).
const route = useRoute()
const { isSeller } = useAuth()
const hidden = computed(
  () =>
    isSeller.value ||
    route.path.startsWith('/seller') ||
    /^\/products\/\d+/.test(route.path) ||
    route.path === '/cart' ||
    route.path === '/checkout',
)
</script>

<template>
  <a
    v-if="!hidden"
    :href="href"
    target="_blank"
    rel="noopener"
    aria-label="Chat WhatsApp"
    class="group fixed bottom-5 right-5 z-30 grid size-13 place-items-center rounded-full bg-ink text-paper shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 md:bottom-7 md:right-7"
    style="width: 3.25rem; height: 3.25rem"
  >
    <BaseIcon name="whatsapp" :size="26" />
    <span
      class="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-sm bg-ink px-3 py-2 text-xs font-semibold text-paper opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block"
    >Tanya stok via WhatsApp</span>
  </a>
</template>
