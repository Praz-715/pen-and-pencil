<script setup lang="ts">
const props = defineProps<{ order: OrderDTO }>()

interface Step { key: string; label: string; at?: string | null; extra?: string }
const steps = computed<Step[]>(() => {
  const o = props.order
  return [
    { key: 'created', label: 'Pesanan dibuat', at: o.createdAt },
    { key: 'processing', label: 'Dikonfirmasi & diproses', at: o.processingAt },
    {
      key: 'shipped',
      label: 'Dikirim',
      at: o.shippedAt,
      extra: o.courier || o.trackingNumber ? `${o.courier ?? ''}${o.trackingNumber ? ` · ${o.trackingNumber}` : ''}`.trim() : undefined,
    },
    { key: 'delivered', label: 'Pesanan selesai', at: o.deliveredAt },
  ]
})
</script>

<template>
  <div v-if="order.status === 'cancelled'" class="flex items-center gap-3 border border-smoke bg-fog px-4 py-4">
    <BaseIcon name="x" :size="20" />
    <div>
      <p class="font-semibold">Pesanan dibatalkan</p>
      <p class="text-sm text-ash">{{ order.cancelledAt ? formatDateTime(order.cancelledAt) : '' }}</p>
    </div>
  </div>

  <ol v-else class="relative">
    <li v-for="(s, i) in steps" :key="s.key" class="relative flex gap-4 pb-7 last:pb-0">
      <!-- connector -->
      <span
        v-if="i < steps.length - 1"
        class="absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-px"
        :class="s.at ? 'bg-ink' : 'bg-smoke'"
      />
      <!-- dot -->
      <span
        class="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2"
        :class="s.at ? 'border-ink bg-ink text-paper' : 'border-smoke bg-paper text-pewter'"
      >
        <BaseIcon v-if="s.at" name="check" :size="13" :stroke="2.5" />
        <span v-else class="size-1.5 rounded-full bg-pewter" />
      </span>
      <!-- body -->
      <div class="-mt-0.5 flex-1">
        <p class="font-semibold" :class="s.at ? 'text-ink' : 'text-pewter'">{{ s.label }}</p>
        <p v-if="s.at" class="text-sm text-ash">{{ formatDateTime(s.at) }}</p>
        <p v-else class="text-sm text-pewter">Menunggu</p>
        <p v-if="s.extra" class="mt-1 inline-flex items-center gap-1.5 bg-fog px-2.5 py-1 text-xs font-medium">
          <BaseIcon name="truck" :size="14" /> {{ s.extra }}
        </p>
      </div>
    </li>
  </ol>
</template>
