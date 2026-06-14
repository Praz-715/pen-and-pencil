<script setup lang="ts">
const route = useRoute()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

useHead({ title: `Masuk — ${SHOP.name}` })

function destination(role?: string) {
  const r = route.query.redirect
  if (typeof r === 'string' && r.startsWith('/')) return r
  return role === 'seller' ? '/seller' : '/'
}

onMounted(async () => {
  const { data } = await authClient.getSession()
  if (data?.user) navigateTo(destination((data.user as { role?: string }).role), { replace: true })
})

async function submit() {
  if (loading.value) return
  loading.value = true
  errorMsg.value = ''
  const { data, error } = await authClient.signIn.email({
    email: email.value.trim(),
    password: password.value,
    rememberMe: true,
  })
  loading.value = false
  if (error) {
    errorMsg.value = error.message || 'Email atau kata sandi salah.'
    return
  }
  await navigateTo(destination((data?.user as { role?: string })?.role), { replace: true })
}
</script>

<template>
  <div class="gutter mx-auto grid min-h-[calc(100dvh-var(--header-h))] max-w-md place-items-center py-10">
    <div class="w-full">
      <div class="text-center">
        <p class="eyebrow text-ash">Selamat datang kembali</p>
        <h1 class="mt-3 font-display text-4xl tracking-tight">Masuk</h1>
      </div>

      <form class="mt-9 space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1.5 block text-sm font-semibold">Email</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="kamu@email.com"
            class="w-full border border-smoke px-4 py-3 text-sm outline-none transition focus:border-ink"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-semibold">Kata sandi</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full border border-smoke px-4 py-3 text-sm outline-none transition focus:border-ink"
          />
        </div>

        <p v-if="errorMsg" class="border border-ink/15 bg-fog px-4 py-3 text-sm text-ink">{{ errorMsg }}</p>

        <button type="submit" class="btn-ink w-full" :disabled="loading">
          {{ loading ? 'Memproses…' : 'Masuk' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-ash">
        Belum punya akun?
        <NuxtLink :to="{ path: '/signup', query: route.query }" class="link-underline font-semibold text-ink">Daftar</NuxtLink>
      </p>
    </div>
  </div>
</template>
