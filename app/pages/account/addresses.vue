<script setup lang="ts">
import type { AddressRecord } from '~/components/AddressForm.vue'
definePageMeta({ middleware: 'buyer' })
useHead({ title: `Alamat — ${SHOP.name}` })

const { data: addresses, refresh, pending } = await useFetch<AddressRecord[]>('/api/addresses', {
  server: false,
  default: () => [],
})

const showForm = ref(false)
const editing = ref<AddressRecord | null>(null)

function openNew() {
  editing.value = null
  showForm.value = true
}
function openEdit(a: AddressRecord) {
  editing.value = a
  showForm.value = true
}
async function onSaved() {
  showForm.value = false
  editing.value = null
  await refresh()
}
async function remove(a: AddressRecord) {
  if (!a.id) return
  if (!confirm(`Hapus alamat "${a.label}"?`)) return
  await $fetch(`/api/addresses/${a.id}`, { method: 'DELETE' })
  await refresh()
}
async function setDefault(a: AddressRecord) {
  if (!a.id || a.isDefault) return
  await $fetch(`/api/addresses/${a.id}`, { method: 'PUT', body: { isDefault: true } })
  await refresh()
}
</script>

<template>
  <div class="gutter mx-auto max-w-4xl py-8 md:py-12">
    <div class="mb-8 flex items-end justify-between gap-4">
      <div>
        <NuxtLink to="/account" class="link-underline mb-3 inline-flex items-center gap-1.5 text-sm text-ash">
          <BaseIcon name="arrow-left" :size="15" /> Akun
        </NuxtLink>
        <h1 class="font-display text-4xl tracking-tight md:text-5xl">Alamat</h1>
      </div>
      <button v-if="!showForm" type="button" class="btn-ink shrink-0" @click="openNew">
        <BaseIcon name="plus" :size="16" /> <span class="hidden sm:inline">Tambah alamat</span>
      </button>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="mb-8 border border-ink p-5 md:p-6">
      <h2 class="mb-4 font-display text-xl">{{ editing ? 'Ubah alamat' : 'Alamat baru' }}</h2>
      <AddressForm :address="editing" @saved="onSaved" @cancel="showForm = false" />
    </div>

    <ClientOnly>
      <div v-if="pending" class="space-y-3">
        <div v-for="n in 2" :key="n" class="h-28 animate-pulse bg-fog" />
      </div>

      <ul v-else-if="addresses.length" class="grid gap-4 sm:grid-cols-2">
        <li v-for="a in addresses" :key="a.id" class="flex flex-col border border-smoke p-5">
          <div class="mb-2 flex items-center gap-2">
            <span class="font-display text-lg">{{ a.label }}</span>
            <span v-if="a.isDefault" class="tag">Utama</span>
          </div>
          <p class="text-sm font-medium">{{ a.recipient }}</p>
          <p class="text-sm text-ash">{{ a.phone }}</p>
          <p class="mt-1.5 text-sm text-ash">{{ a.line }}<span v-if="a.province">, {{ a.province }}</span></p>
          <p class="text-sm text-ash">{{ a.city }} {{ a.postalCode }}</p>
          <div class="mt-4 flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm font-semibold">
            <button v-if="!a.isDefault" type="button" class="link-underline" @click="setDefault(a)">Jadikan utama</button>
            <button type="button" class="link-underline" @click="openEdit(a)">Ubah</button>
            <button type="button" class="link-underline text-ash" @click="remove(a)">Hapus</button>
          </div>
        </li>
      </ul>

      <div v-else-if="!showForm" class="grid place-items-center border border-dashed border-smoke py-20 text-center">
        <div>
          <BaseIcon name="map-pin" :size="32" class="mx-auto text-pewter" />
          <p class="mt-4 font-display text-2xl">Belum ada alamat</p>
          <p class="mt-1 text-sm text-ash">Tambahkan alamat untuk mempercepat checkout.</p>
          <button type="button" class="btn-ink mt-6" @click="openNew">Tambah alamat</button>
        </div>
      </div>

      <template #fallback>
        <div class="h-28 animate-pulse bg-fog" />
      </template>
    </ClientOnly>
  </div>
</template>
