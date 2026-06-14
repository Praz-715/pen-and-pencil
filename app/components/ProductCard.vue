<script setup lang="ts">
const props = defineProps<{ scent: Scent; index?: number }>()

const { isFavorite, toggleFavorite } = useFavorites()
const { isSeller } = useAuth()
const collection = computed(() => getCollection(props.scent.collectionId))
const to = computed(() => `/products/${props.scent.id}/${props.scent.slug}`)
const fav = computed(() => isFavorite(props.scent.id))
</script>

<template>
  <NuxtLink :to="to" class="group relative flex flex-col">
    <!-- Image tile -->
    <div class="relative aspect-square overflow-hidden bg-fog">
      <img
        :src="scent.image"
        :alt="`${collection?.shortName} ${scent.name}`"
        loading="lazy"
        class="absolute inset-0 size-full object-contain p-5 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] sm:p-7"
      />

      <!-- Badges -->
      <div class="absolute left-2.5 top-2.5 flex flex-col gap-1.5 sm:left-3 sm:top-3">
        <span v-if="scent.isNew" class="tag">BARU</span>
        <span v-if="scent.concentration === 'Intens'" class="tag-line bg-paper">INTENS</span>
      </div>

      <!-- Favorite (buyers/guests only) -->
      <ClientOnly>
        <button
          v-if="!isSeller"
          type="button"
          :aria-label="fav ? 'Hapus dari favorit' : 'Tambah ke favorit'"
          :aria-pressed="fav"
          class="absolute bottom-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-paper/80 text-ink backdrop-blur transition hover:bg-paper sm:bottom-3 sm:right-3"
          @click.prevent.stop="toggleFavorite(scent.id)"
        >
          <BaseIcon name="heart" :size="17" :filled="fav" />
        </button>
      </ClientOnly>
    </div>

    <!-- Meta -->
    <div class="flex flex-1 flex-col gap-1 pt-3">
      <p class="eyebrow text-ash">
        {{ collection?.shortName }}
        <span v-if="scent.concentration"> · {{ scent.concentration }}</span>
      </p>
      <h3 class="font-display text-[0.98rem] leading-tight text-ink sm:text-lg">
        {{ scent.name }}
      </h3>
      <p class="mt-auto pt-1 text-sm text-ash">
        Mulai <span class="font-medium text-ink">{{ formatRupiah(scent.fromPrice) }}</span>
      </p>
    </div>

    <!-- Buy row -->
    <div
      class="mt-3 flex items-center justify-between border-t border-smoke pt-3 text-sm font-semibold text-ink"
    >
      <span class="link-underline">Lihat &amp; Beli</span>
      <BaseIcon
        name="arrow-right"
        :size="16"
        class="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
      />
    </div>
  </NuxtLink>
</template>
