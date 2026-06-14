<script setup lang="ts">
import type { NuxtError } from '#app'
const props = defineProps<{ error: NuxtError }>()
const isNotFound = computed(() => props.error?.statusCode === 404)
</script>

<template>
  <div class="gutter grid min-h-dvh place-items-center">
    <div class="max-w-md text-center">
      <p class="eyebrow text-ash">{{ error?.statusCode || 'Error' }}</p>
      <h1 class="mt-4 font-display text-5xl tracking-tight md:text-7xl">
        {{ isNotFound ? 'Halaman tak ditemukan' : 'Ada yang salah' }}
      </h1>
      <p class="mt-5 text-ash">
        {{ isNotFound ? 'Wangi yang kamu cari mungkin sudah berpindah rak.' : 'Coba muat ulang, atau kembali ke beranda.' }}
      </p>
      <button class="btn-ink mt-8" @click="clearError({ redirect: '/' })">Kembali ke beranda</button>
    </div>
  </div>
</template>
