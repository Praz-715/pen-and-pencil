<script setup lang="ts">
export interface AddressRecord {
  id?: string
  label: string
  recipient: string
  phone: string
  line: string
  city: string
  province?: string | null
  postalCode?: string | null
  notes?: string | null
  isDefault?: boolean
}

const props = defineProps<{ address?: AddressRecord | null }>()
const emit = defineEmits<{ saved: [AddressRecord]; cancel: [] }>()

const f = reactive<AddressRecord>({
  label: props.address?.label ?? '',
  recipient: props.address?.recipient ?? '',
  phone: props.address?.phone ?? '',
  line: props.address?.line ?? '',
  city: props.address?.city ?? '',
  province: props.address?.province ?? '',
  postalCode: props.address?.postalCode ?? '',
  isDefault: props.address?.isDefault ?? false,
})

const saving = ref(false)
const err = ref('')
const input = 'w-full border border-smoke px-3.5 py-2.5 text-sm outline-none transition focus:border-ink'

async function save() {
  if (saving.value) return
  saving.value = true
  err.value = ''
  try {
    const res = props.address?.id
      ? await $fetch<AddressRecord>(`/api/addresses/${props.address.id}`, { method: 'PUT', body: f })
      : await $fetch<AddressRecord>('/api/addresses', { method: 'POST', body: f })
    emit('saved', res)
  } catch (e: unknown) {
    const ex = e as { data?: { statusMessage?: string }; statusMessage?: string }
    err.value = ex?.data?.statusMessage || ex?.statusMessage || 'Gagal menyimpan alamat.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="save">
    <div class="grid gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-xs font-semibold text-ash">Label</label>
        <input v-model="f.label" :class="input" placeholder="Rumah / Kantor" required />
      </div>
      <div>
        <label class="mb-1 block text-xs font-semibold text-ash">Nama penerima</label>
        <input v-model="f.recipient" :class="input" placeholder="Nama penerima" required />
      </div>
    </div>
    <div>
      <label class="mb-1 block text-xs font-semibold text-ash">No. HP / WhatsApp</label>
      <input v-model="f.phone" :class="input" placeholder="08xxxxxxxxxx" required />
    </div>
    <div>
      <label class="mb-1 block text-xs font-semibold text-ash">Alamat lengkap</label>
      <textarea v-model="f.line" :class="input" rows="2" placeholder="Jalan, no. rumah, RT/RW, kecamatan" required />
    </div>
    <div class="grid gap-3 sm:grid-cols-3">
      <div>
        <label class="mb-1 block text-xs font-semibold text-ash">Kota</label>
        <input v-model="f.city" :class="input" placeholder="Kota / Kab." required />
      </div>
      <div>
        <label class="mb-1 block text-xs font-semibold text-ash">Provinsi</label>
        <input v-model="f.province" :class="input" placeholder="Provinsi" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-semibold text-ash">Kode pos</label>
        <input v-model="f.postalCode" :class="input" placeholder="kode pos" />
      </div>
    </div>
    <label class="flex cursor-pointer items-center gap-2.5 text-sm">
      <input v-model="f.isDefault" type="checkbox" class="size-4 accent-ink" />
      Jadikan alamat utama
    </label>

    <p v-if="err" class="bg-fog px-3.5 py-2.5 text-sm text-ink">{{ err }}</p>

    <div class="flex gap-3 pt-1">
      <button type="submit" class="btn-ink" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan alamat' }}</button>
      <button type="button" class="btn-line" @click="emit('cancel')">Batal</button>
    </div>
  </form>
</template>
