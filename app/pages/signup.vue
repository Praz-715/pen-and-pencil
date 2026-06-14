<script setup lang="ts">
const route = useRoute()
const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

useHead({ title: `Daftar — ${SHOP.name}` })

function destination() {
  const r = route.query.redirect
  if (typeof r === 'string' && r.startsWith('/')) return r
  return '/'
}

onMounted(async () => {
  const { data } = await authClient.getSession()
  if (data?.user) navigateTo(destination(), { replace: true })
})

async function submit() {
  if (loading.value) return
  loading.value = true
  errorMsg.value = ''
  const { error } = await authClient.signUp.email({
    name: name.value.trim(),
    email: email.value.trim(),
    password: password.value,
    // additional field (role stays 'buyer' — server-only)
    phone: phone.value.trim() || undefined,
  } as Parameters<typeof authClient.signUp.email>[0])
  loading.value = false
  if (error) {
    errorMsg.value =
      error.message?.includes('exist') || error.status === 422
        ? 'Email sudah terdaftar. Coba masuk.'
        : error.message || 'Gagal mendaftar. Coba lagi.'
    return
  }
  await navigateTo(destination(), { replace: true })
}
</script>

<template>
  <div class="gutter mx-auto grid min-h-[calc(100dvh-var(--header-h))] max-w-md place-items-center py-10">
    <div class="w-full">
      <div class="text-center">
        <p class="eyebrow text-ash">Buat akun pembeli</p>
        <h1 class="mt-3 font-display text-4xl tracking-tight">Daftar</h1>
      </div>

      <form class="mt-9 space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1.5 block text-sm font-semibold">Nama lengkap</label>
          <input v-model="name" type="text" required autocomplete="name" placeholder="Nama kamu" class="w-full border border-smoke px-4 py-3 text-sm outline-none transition focus:border-ink" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-semibold">Email</label>
          <input v-model="email" type="email" required autocomplete="email" placeholder="kamu@email.com" class="w-full border border-smoke px-4 py-3 text-sm outline-none transition focus:border-ink" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-semibold">No. WhatsApp <span class="font-normal text-ash">(opsional)</span></label>
          <input v-model="phone" type="tel" autocomplete="tel" placeholder="08xxxxxxxxxx" class="w-full border border-smoke px-4 py-3 text-sm outline-none transition focus:border-ink" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-semibold">Kata sandi <span class="font-normal text-ash">(min. 6 karakter)</span></label>
          <input v-model="password" type="password" required minlength="6" autocomplete="new-password" placeholder="••••••••" class="w-full border border-smoke px-4 py-3 text-sm outline-none transition focus:border-ink" />
        </div>

        <p v-if="errorMsg" class="border border-ink/15 bg-fog px-4 py-3 text-sm text-ink">{{ errorMsg }}</p>

        <button type="submit" class="btn-ink w-full" :disabled="loading">
          {{ loading ? 'Membuat akun…' : 'Daftar' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-ash">
        Sudah punya akun?
        <NuxtLink :to="{ path: '/login', query: route.query }" class="link-underline font-semibold text-ink">Masuk</NuxtLink>
      </p>
    </div>
  </div>
</template>
