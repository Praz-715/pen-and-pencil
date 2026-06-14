<script setup lang="ts">
const { collectionsInUse } = useProducts()
const year = 2026
</script>

<template>
  <footer class="mt-24 border-t border-smoke bg-ink text-paper">
    <div class="gutter mx-auto max-w-[1540px]">
      <!-- Big wordmark band -->
      <div class="overflow-hidden border-b border-white/10 py-12 md:py-16">
        <p class="eyebrow mb-5 text-paper/50">Decant &amp; tester parfum · sejak {{ SHOP.established }}</p>
        <h2 class="whitespace-nowrap font-display text-[clamp(2.5rem,12vw,9rem)] font-semibold leading-[0.86] tracking-tight">
          Pen<span class="italic text-paper/40">&amp;</span>Pencil
        </h2>
      </div>

      <!-- Columns -->
      <div class="grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-4 md:py-16">
        <div>
          <p class="eyebrow mb-4 text-paper/50">Koleksi</p>
          <ul class="space-y-2.5 text-sm">
            <li v-for="c in collectionsInUse" :key="c.id">
              <NuxtLink :to="`/products?c=${c.id}`" class="link-underline text-paper/80 hover:text-paper">
                {{ c.shortName }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/products" class="link-underline text-paper/80 hover:text-paper">Semua Produk</NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <p class="eyebrow mb-4 text-paper/50">Belanja</p>
          <ul class="space-y-2.5 text-sm">
            <li><NuxtLink to="/favorites" class="link-underline text-paper/80 hover:text-paper">Favorit</NuxtLink></li>
            <li><NuxtLink to="/cart" class="link-underline text-paper/80 hover:text-paper">Keranjang</NuxtLink></li>
            <li><NuxtLink to="/account" class="link-underline text-paper/80 hover:text-paper">Akun</NuxtLink></li>
            <li><NuxtLink to="/about" class="link-underline text-paper/80 hover:text-paper">Tentang</NuxtLink></li>
          </ul>
        </div>

        <div>
          <p class="eyebrow mb-4 text-paper/50">Toko</p>
          <ul class="space-y-3 text-sm text-paper/80">
            <li class="flex items-start gap-2.5"><BaseIcon name="clock" :size="16" class="mt-0.5 shrink-0 text-paper/50" /><span>{{ SHOP.hours }}</span></li>
            <li class="flex items-start gap-2.5"><BaseIcon name="map-pin" :size="16" class="mt-0.5 shrink-0 text-paper/50" /><span>Dikirim dari {{ SHOP.shipFrom }}</span></li>
            <li class="flex items-start gap-2.5"><BaseIcon name="droplet" :size="16" class="mt-0.5 shrink-0 text-paper/50" /><span>{{ SHOP.gender }} · mulai 1ml</span></li>
          </ul>
        </div>

        <div>
          <p class="eyebrow mb-4 text-paper/50">Terhubung</p>
          <ul class="space-y-2.5 text-sm">
            <li>
              <a :href="SHOP.shopeeUrl" target="_blank" rel="noopener" class="link-underline inline-flex items-center gap-1.5 text-paper/80 hover:text-paper">
                Shopee <BaseIcon name="arrow-up-right" :size="14" />
              </a>
            </li>
            <li>
              <a :href="SHOP.instagram" target="_blank" rel="noopener" class="link-underline inline-flex items-center gap-1.5 text-paper/80 hover:text-paper">
                Instagram <BaseIcon name="arrow-up-right" :size="14" />
              </a>
            </li>
            <li>
              <a :href="whatsappLink('Halo Pen & Pencil!')" target="_blank" rel="noopener" class="link-underline inline-flex items-center gap-1.5 text-paper/80 hover:text-paper">
                WhatsApp <BaseIcon name="arrow-up-right" :size="14" />
              </a>
            </li>
          </ul>

          <div class="mt-6 flex items-center gap-2 text-sm">
            <BaseIcon name="star" :size="15" class="text-paper" />
            <span class="font-semibold">{{ SHOP.rating }}</span>
            <span class="text-paper/50">· {{ SHOP.reviewsLabel }} penilaian</span>
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ year }} {{ SHOP.name }}. Semua hak dilindungi.</p>
        <p>{{ SHOP.yearsActive }} tahun melayani · {{ SHOP.chatResponse }}% chat dibalas dalam hitungan jam</p>
      </div>
    </div>
  </footer>
</template>
