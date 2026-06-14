<script setup lang="ts">
const props = defineProps<{ status: OrderStatus }>()
const cls = computed(() => {
  switch (props.status) {
    case 'delivered':
      return 'bg-ink text-paper'
    case 'cancelled':
      return 'border border-ash text-ash'
    case 'pending':
      return 'border border-ink text-ink'
    default:
      return 'bg-fog text-ink border border-smoke'
  }
})
</script>

<template>
  <span class="inline-flex items-center rounded-[2px] px-2.5 py-1 text-[11px] font-semibold tracking-wide" :class="cls">
    {{ STATUS_LABEL[status] ?? status }}
  </span>
</template>
