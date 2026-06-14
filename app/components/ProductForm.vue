<script setup lang="ts">
interface ProductInput {
  id?: number
  name: string
  collectionId?: string
  concentration?: string
  image: string
  description?: string | null
  sizes?: { ml: number | null; price: number | null; note?: string }[]
  stock?: number
  isNew?: boolean
  active?: boolean
}

interface FState {
  name: string
  concentration: string
  image: string
  description: string
  sizes: { ml: number | null; price: number | null; note?: string }[]
  stock: number
  isNew: boolean
  active: boolean
}

const props = defineProps<{ product?: ProductInput | null }>()
const emit = defineEmits<{ saved: [{ id: number }] }>()
const { collectionsInUse } = useProducts()

// Free-text collection label (with suggestions); slugified to collectionId on save.
const collectionLabel = ref(props.product?.collectionId ? getCollection(props.product.collectionId).shortName : '')

const f = reactive<FState>({
  name: props.product?.name ?? '',
  concentration: props.product?.concentration ?? '',
  image: props.product?.image ?? '',
  description: props.product?.description ?? '',
  sizes: props.product?.sizes?.length
    ? props.product.sizes.map((s) => ({ ml: s.ml ?? null, price: s.price ?? null, note: s.note }))
    : [{ ml: 1, price: null, note: 'oles' }],
  stock: props.product?.stock ?? 0,
  isNew: props.product?.isNew ?? false,
  active: props.product?.active ?? true,
})

const input = 'w-full border border-smoke px-3.5 py-2.5 text-sm outline-none transition focus:border-ink'
const uploading = ref(false)
const saving = ref(false)
const err = ref('')

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  err.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await $fetch<{ image: string }>('/api/seller/upload', { method: 'POST', body: fd })
    f.image = res.image
  } catch (e: unknown) {
    err.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal mengunggah gambar.'
  } finally {
    uploading.value = false
  }
}

function applyPreset(tier: keyof typeof SIZE_TIERS) {
  f.sizes = SIZE_TIERS[tier].map((s) => ({ ml: s.ml, price: s.price, note: s.note }))
}
function addSize() {
  f.sizes.push({ ml: null, price: null })
}
function removeSize(i: number) {
  f.sizes.splice(i, 1)
}

async function submit() {
  if (saving.value) return
  err.value = ''
  const collectionId = slugify(collectionLabel.value)
  if (!collectionId) {
    err.value = 'Pilih atau ketik koleksi dulu.'
    return
  }
  if (!f.image) {
    err.value = 'Unggah gambar produk dulu.'
    return
  }
  const sizes = f.sizes
    .filter((s) => s.ml && s.price != null)
    .map((s) => ({ ml: Number(s.ml), price: Number(s.price), note: s.note || undefined }))
  if (!sizes.length) {
    err.value = 'Isi minimal satu ukuran & harga.'
    return
  }
  saving.value = true
  try {
    const body = {
      name: f.name,
      collectionId,
      concentration: f.concentration.trim() || null,
      image: f.image,
      description: f.description,
      sizes,
      stock: f.stock,
      isNew: f.isNew,
      active: f.active,
    }
    const res = props.product?.id
      ? await $fetch<{ id: number }>(`/api/products/${props.product.id}`, { method: 'PUT', body })
      : await $fetch<{ id: number }>('/api/products', { method: 'POST', body })
    emit('saved', res)
  } catch (e: unknown) {
    err.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal menyimpan produk.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]" @submit.prevent="submit">
    <!-- Image -->
    <div class="min-w-0">
      <p class="mb-2 text-xs font-semibold text-ash">Gambar produk</p>
      <div class="relative aspect-square w-full overflow-hidden border border-smoke bg-fog">
        <img v-if="f.image" :src="f.image" alt="" class="size-full object-contain p-4" />
        <div v-else class="grid size-full place-items-center text-pewter">
          <div class="text-center">
            <BaseIcon name="droplet" :size="28" class="mx-auto" />
            <p class="mt-2 text-xs">Belum ada gambar</p>
          </div>
        </div>
        <div v-if="uploading" class="absolute inset-0 grid place-items-center bg-paper/70 text-sm font-semibold">Mengonversi…</div>
      </div>
      <label class="btn-line mt-3 w-full cursor-pointer">
        <BaseIcon name="plus" :size="16" /> {{ f.image ? 'Ganti gambar' : 'Unggah PNG/JPG' }}
        <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onFile" />
      </label>
      <p class="mt-2 text-center text-xs text-ash">Otomatis dikonversi ke WebP.</p>
    </div>

    <!-- Fields -->
    <div class="min-w-0 space-y-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-semibold text-ash">Nama produk</label>
          <input v-model="f.name" :class="input" placeholder="Nama scent" required />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold text-ash">Koleksi</label>
          <input v-model="collectionLabel" list="dl-collections" :class="input" placeholder="Pilih atau ketik koleksi baru" required autocomplete="off" />
          <datalist id="dl-collections">
            <option v-for="c in collectionsInUse" :key="c.id" :value="c.shortName" />
          </datalist>
          <p class="mt-1 text-[11px] text-ash">Ketik nama baru untuk membuat koleksi baru.</p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-semibold text-ash">Konsentrasi <span class="font-normal">(opsional)</span></label>
          <input v-model="f.concentration" list="dl-conc" :class="input" placeholder="EDP, Intens, atau lainnya" autocomplete="off" />
          <datalist id="dl-conc">
            <option value="EDP" />
            <option value="Intens" />
          </datalist>
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold text-ash">Stok (unit)</label>
          <input v-model.number="f.stock" type="number" min="0" :class="input" />
        </div>
      </div>

      <div>
        <label class="mb-1 block text-xs font-semibold text-ash">Deskripsi <span class="font-normal">(opsional)</span></label>
        <textarea v-model="f.description" rows="2" :class="input" placeholder="Catatan singkat soal produk" />
      </div>

      <!-- Sizes -->
      <div>
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label class="text-xs font-semibold text-ash">Ukuran &amp; harga</label>
          <div class="flex gap-1.5">
            <button v-for="t in (['edp','edp3','intens'] as const)" :key="t" type="button" class="border border-smoke px-2 py-1 text-[11px] font-semibold transition hover:border-ink" @click="applyPreset(t)">
              {{ t === 'edp3' ? 'EDP+3ml' : t.toUpperCase() }}
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <div v-for="(s, i) in f.sizes" :key="i" class="flex items-center gap-2">
            <input v-model.number="s.ml" type="number" min="1" placeholder="ml" class="w-20 border border-smoke px-3 py-2 text-sm outline-none focus:border-ink" />
            <span class="text-sm text-ash">ml</span>
            <input v-model.number="s.price" type="number" min="0" placeholder="harga" class="min-w-0 flex-1 border border-smoke px-3 py-2 text-sm outline-none focus:border-ink" />
            <input v-model="s.note" placeholder="ket." class="w-20 border border-smoke px-3 py-2 text-sm outline-none focus:border-ink" />
            <button type="button" class="grid size-9 shrink-0 place-items-center text-ash hover:text-ink" aria-label="Hapus ukuran" @click="removeSize(i)"><BaseIcon name="trash" :size="16" /></button>
          </div>
        </div>
        <button type="button" class="link-underline mt-2 text-sm font-semibold" @click="addSize">+ Tambah ukuran</button>
      </div>

      <!-- Flags -->
      <div class="flex flex-wrap gap-5">
        <label class="flex cursor-pointer items-center gap-2.5 text-sm"><input v-model="f.isNew" type="checkbox" class="size-4 accent-ink" /> Tandai "Baru"</label>
        <label class="flex cursor-pointer items-center gap-2.5 text-sm"><input v-model="f.active" type="checkbox" class="size-4 accent-ink" /> Aktif (tampil di toko)</label>
      </div>

      <p v-if="err" class="bg-fog px-4 py-3 text-sm text-ink">{{ err }}</p>

      <div class="flex gap-3 border-t border-smoke pt-5">
        <button type="submit" class="btn-ink" :disabled="saving || uploading">{{ saving ? 'Menyimpan…' : 'Simpan produk' }}</button>
        <NuxtLink to="/seller/products" class="btn-line">Batal</NuxtLink>
      </div>
    </div>
  </form>
</template>
