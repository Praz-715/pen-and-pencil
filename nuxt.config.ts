import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',
  devtools: { enabled: true },

  modules: ['@nuxt/fonts'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    // sharp ships native binaries; force Nitro to trace them into the Vercel
    // serverless bundle, otherwise the OG-image route 500s at runtime
    // ("Cannot find module 'sharp'"). See server/routes/og/[id].get.ts.
    externals: {
      traceInclude: ['sharp'],
    },
  },

  fonts: {
    families: [
      { name: 'Fraunces', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
      { name: 'Archivo', provider: 'google', weights: [400, 500, 600, 700] },
    ],
  },

  runtimeConfig: {
    public: {
      // Used for canonical URLs, og:url, and sitemap. Override on Vercel.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'Pen & Pencil — Decant & Tester Parfum Original',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            'Pen & Pencil — toko decant & tester parfum original sejak 2018. Mandalika, HMNS, Velixir. Mulai 1ml. Dikirim dari Jakarta Barat. Unisex.',
        },
        { name: 'theme-color', content: '#ffffff' },
        {
          name: 'keywords',
          content:
            'parfum decant, decant parfum, perfume decant, parfum tester, tester parfum, perfume tester, parfum original, parfum branded, Mandalika, HMNS, Velixir, Pen & Pencil',
        },
        { property: 'og:site_name', content: 'Pen & Pencil' },
        { property: 'og:title', content: 'Pen & Pencil — Decant & Tester Parfum Original' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'id_ID' },
        {
          property: 'og:description',
          content: 'Decant & tester parfum original. Coba dulu sebelum beli full bottle. Mulai dari 1ml.',
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Pen & Pencil — Decant & Tester Parfum Original' },
        { name: 'robots', content: 'index, follow' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
})
