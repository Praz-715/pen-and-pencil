<script setup lang="ts">
const route = useRoute()
const siteUrl = useRuntimeConfig().public.siteUrl as string

useSeoMeta({
  ogImage: `${siteUrl}/og-cover.jpg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterImage: `${siteUrl}/og-cover.jpg`,
})

useHead({
  link: [{ rel: 'canonical', href: () => siteUrl + route.path }],
  meta: [{ property: 'og:url', content: () => siteUrl + route.path }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: SHOP.name,
        description: `Toko decant & tester parfum original sejak ${SHOP.established}. Dikirim dari ${SHOP.shipFrom}.`,
        url: siteUrl,
        image: `${siteUrl}/logo.webp`,
        sameAs: [SHOP.shopeeUrl, SHOP.instagram],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: SHOP.rating,
          reviewCount: SHOP.reviewsCount,
        },
      }),
    },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
