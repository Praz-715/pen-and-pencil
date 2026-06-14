# CLAUDE.md — Pen & Pencil

Konteks proyek untuk sesi Claude Code berikutnya. Baca ini dulu, lalu [DESIGN.md](DESIGN.md) untuk sistem desain.

## Apa ini

Storefront **toko parfum decant & tester "Pen & Pencil"** (Shopee: [penandpencil.id](https://shopee.co.id/penandpencil.id)).
**Monolith Nuxt full-stack** yang siap deploy ke **Vercel**. Punya **auth + 2 role** (penjual & pembeli),
**checkout in-app** (bukan WhatsApp), order tracking, dan dashboard penjual. Katalog produk masih **statis**
(`app/utils/catalog.ts`); order/alamat/akun tersimpan di **database**.

- **Pembeli** (default saat signup): lihat produk, keranjang, checkout in-app, simpan banyak alamat, lacak pesanan.
- **Penjual** (hanya 1, di-seed): notifikasi pesanan baru, proses pesanan via checklist status, dashboard omzet
  (hari/minggu/bulan/semua) + total penghasilan.

Desain: **modern hitam-putih** (lihat DESIGN.md). Copy berbahasa Indonesia. Mata uang IDR (label "IDR" di navbar sudah dihapus).

## Stack

- **Nuxt 4** (SSR) · Vue 3 · Nitro · Vite
- **Tailwind CSS v4** via `@tailwindcss/vite` (token di `app/assets/css/main.css`, bukan file config JS)
- **@nuxt/fonts** — Fraunces (display) + Archivo (body), self-hosted
- **Better Auth** (email+password, role) — `lib/auth.ts`, client `app/utils/auth-client.ts`
- **Drizzle ORM + libSQL/SQLite** — schema `server/database/schema.ts`, client `server/utils/db.ts`
- Ikon: SVG inline ([`BaseIcon.vue`](app/components/BaseIcon.vue)), tanpa dependency ikon
- State klien: `useState` (tanpa Pinia). **Cart & favorites tersimpan di DB** (bukan localStorage lagi) —
  butuh login; di-hydrate oleh `plugins/shop-state.client.ts` saat sesi aktif.

## Perintah

```bash
npm install
cp .env.example .env   # lalu isi BETTER_AUTH_SECRET dll (lihat di bawah)
npm run db:push        # buat tabel SQLite (file ./.data/penandpencil.db)
npm run db:seed        # buat akun penjual (idempotent)
npm run dev            # http://localhost:3000
npm run build          # build produksi (Nitro)
npm run db:studio      # drizzle studio (inspeksi DB)
```

### Env & akun penjual

`.env` (lihat `.env.example`): `DATABASE_URL` (default `file:./.data/penandpencil.db`), `BETTER_AUTH_SECRET`
(≥32 char), `BETTER_AUTH_URL`, `SELLER_NAME/EMAIL/PASSWORD`.
Default seed penjual: **penjual@penandpencil.id / penjual123** (ganti via `.env` lalu `npm run db:seed`).
Signup di UI **selalu** membuat *pembeli* (role `seller` hanya server-side/seed).

### Produksi (Vercel)

Vercel auto-detect Nuxt. Set env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (URL deploy), dan `DATABASE_URL` +
`DATABASE_AUTH_TOKEN` ke **Turso** (libsql cloud) — file SQLite lokal tidak persist di serverless.

> **Windows:** dev server memunculkan beberapa proses `node`. Jika perlu rename/ubah folder di
> `public/` dan kena "Permission denied", hentikan dulu dev server (proses node) baru ubah.

## Arsitektur (srcDir = `app/`, default Nuxt 4)

```
app/
  app.vue, error.vue
  assets/css/main.css        # token Tailwind v4 + util (@theme/@layer)
  components/                # auto-import: AppHeader, AppFooter, MobileMenu,
                             #   SearchOverlay, WhatsAppFab, ProductCard, ProductGrid,
                             #   ProductFilters, OfferCarousel, BaseIcon
  composables/               # useCart, useFavorites, useUi
  layouts/default.vue        # header + slot + footer + overlay
  pages/
    index.vue                # beranda
    products/index.vue       # katalog (sidebar + grid + sort)
    products/[id]/[slug].vue # detail produk
    favorites.vue · cart.vue · about.vue · account.vue
  plugins/shop-state.client.ts # load cart+favorites dari DB saat login (ganti localStorage)
  middleware/                # auth.ts (wajib login), seller.ts (role seller) — client-side
  composables/               # + useAuth, useSellerNotifications
  pages/
    login.vue · signup.vue
    account/index.vue · account/addresses.vue
    account/orders/index.vue · account/orders/[id].vue   # pembeli: list + tracking
    checkout.vue
    seller/index.vue                                      # dashboard
    seller/orders/index.vue · seller/orders/[id].vue      # penjual: list + fulfillment
  utils/                     # auto-import: catalog.ts, shop.ts, format.ts, orders.ts, auth-client.ts
lib/auth.ts                  # Better Auth server instance
server/
  api/auth/[...all].ts       # Better Auth handler
  api/addresses/*            # GET/POST/PUT/DELETE
  api/orders/* + [id]/status.patch.ts
  api/seller/stats.get.ts · notifications.get.ts
  utils/db.ts · utils/authSession.ts   # requireUser/requireSeller (auto-imported)
  database/schema.ts
public/
  img/<koleksi>/...          # aset produk (BUKAN /products, hindari bentrok route)
  favicon.ico · logo.webp
```

## Auth, role & order

- Role di `user.role` (`buyer`|`seller`). Better Auth `additionalFields.role` `input:false` → tak bisa di-set lewat signup.
- Proteksi: client middleware `auth`/`seller` (redirect); **server API selalu** cek via `requireUser`/`requireSeller`
  (jangan percaya client). Harga order **dihitung ulang di server** dari `catalog.ts`, bukan dari body klien.
- Status order: `pending → processing → shipped → delivered` (+ `cancelled`). Penjual memajukan status
  (`PATCH /api/orders/:id/status`), timestamp tiap langkah disimpan → pembeli melacak via `OrderTimeline.vue`.
- Notifikasi penjual = order dgn `seenBySeller=false`; otomatis `true` saat penjual buka detailnya.
- E2E flow terverifikasi & 2 script audit: `scripts/audit.mjs` (overflow publik) + `scripts/verify-app.mjs`
  (login per-role, overflow + screenshot halaman ber-auth).

## Produk (DB-backed) & manajemen

Produk **disimpan di DB** (tabel `product`) dan dikelola penjual. `app/utils/catalog.ts` menyimpan
**metadata koleksi "known"** (3: mandalika/hmns/velixir, dgn gallery/deskripsi kaya) + tipe + `SIZE_TIERS` + helper.

**Koleksi & konsentrasi bersifat bebas (free-form).** Di form tambah produk keduanya adalah combobox
(input + `<datalist>` saran), penjual boleh ketik baru. `collectionId` di-slugify server-side; `concentration`
string apa saja. `CollectionId`/`Concentration` = `string`. `getCollection(id)` **selalu** balik metadata —
known → entri kaya; baru → disintesis (`shortName` = `titleCase(slug)`, gallery kosong). Daftar koleksi
yang tampil di UI **dinamis**: `useProducts().collectionsInUse` (koleksi yg punya produk; known dulu, lalu
buatan penjual; gallery jatuh ke gambar produk pertama). Dipakai header nav, sidebar filter, OfferCarousel,
about, mobile menu, footer — jadi koleksi baru langsung muncul di semua tempat.

- **Data flow:** API `GET /api/products` (publik, aktif saja; `?all=1` utk penjual) → `serializeProduct()`
  ([server/utils/products.ts](server/utils/products.ts)) mengubah row DB ke bentuk `Scent` (sizes berlabel + `fromPrice`).
- **Client:** composable `useProducts()` (`useAsyncData('products', …)`) — `products`, `getById`, `byCollection`,
  `siblings`. Dipakai homepage, /products, search, cart, checkout, favorites. Halaman detail fetch
  `/api/products/:id` langsung (stok fresh).
- **CRUD penjual:** `POST/PUT/DELETE /api/products` (cek `requireSeller`). UI di `/seller/products` (list),
  `/seller/products/new`, `/seller/products/[id]` via `ProductForm.vue`.
- **Upload gambar:** `POST /api/seller/upload` (multipart) → **sharp** konversi PNG/JPG → **WebP**, resize ≤1400px,
  simpan ke `public/img/uploads/` (gitignored). **Produksi: ganti ke Vercel Blob** (kembalikan URL blob, bukan tulis file —
  filesystem serverless read-only).
- **Stok = sumber kebenaran tunggal.** Order mengurangi `product.stock` (tolak 409 jika kurang); cancel mengembalikan.
  Batas qty pembeli = `stock` di **semua** surface: detail ("Stok tersedia", stepper cap ke sisa-stok-dikurangi-isi-keranjang),
  cart (+ disabled di stok, warning "Melebihi stok"), checkout ("Buat pesanan" disabled bila ada baris > stok).
  **JANGAN** hardcode batas qty (dulu sempat ada `MAX_QTY=10` yang bikin tidak konsisten).
- **Seed awal:** `scripts/seed-products.ts` mengisi 36 produk (id 1001–1020/2001–2002/3001–3014, stok 50). Id baru
  auto-increment dari 3015. Aset awal di `/img/<collectionId>/<File>.webp` (Apollo sudah dari `Appolo.webp`).
- Harga diformat `formatRupiah()`; status order helper di [`orders.ts`](app/utils/orders.ts).

## Konfigurasi toko — `app/utils/shop.ts`

Konstanta `SHOP` (rating 4.9, 2.7RB penilaian, 92% chat, sejak 2018, jam Sen–Sab 08–15, kirim dari
Jakarta Barat, Unisex, link Shopee/IG).

> ⚠️ **TODO penting:** ganti `SHOP.whatsapp` (`6281234567890`) dengan **nomor WhatsApp resmi toko**
> (format `62…`, tanpa `+`/`0`/spasi). Dipakai semua tombol WA & checkout.

## Konvensi

- Hanya **hitam/putih/abu** — jangan tambah warna (lihat DESIGN.md §2).
- Komponen, composable, dan util **auto-import** — jangan tulis statement `import` untuk itu.
- **Cart & favorites = DB** (`cart_item`/`favorite`), bukan localStorage. API `/api/cart` (GET/POST/PUT/DELETE,
  di-cap stok) & `/api/favorites` (GET/POST toggle). Order dibuat dari cart DB lalu cart dikosongkan.
  `/cart`, `/favorites`, `/checkout` butuh login (middleware `buyer`); add-to-cart/favorit tamu → redirect `/login`.
  Bagian yang baca state ini tetap dibungkus `<ClientOnly>` (di-hydrate client-side) agar tak hydration-mismatch.
- Link route produk: `/products/${id}/${slug}` (id dipakai untuk lookup; slug kosmetik).
- Komponen file/link memakai path relatif yang clickable.

## Responsive audit

`node scripts/audit.mjs` — cek **horizontal overflow** di semua halaman × 5 viewport
(mobile 390 / tablet 768 / tabletwide 1024 / desktop 1440 / wide 1920). Butuh dev server jalan di :3000.
Output ✅/❌ + elemen biang kerok + screenshot FAIL ke `%TEMP%/pp-audit`. Jalankan setelah ubah layout.

**Gotcha layout (sudah diperbaiki, jangan diulang):**
- Footer wordmark pakai `text-[clamp(...)]` + `whitespace-nowrap` + parent `overflow-hidden` (jangan `text-[16vw]`/rem tetap yang bisa lebih lebar dari kontainer).
- Item grid/flex yang punya anak `overflow-x-auto` (mis. baris "Varian" di detail) **wajib** diberi `min-w-0`, kalau tidak track menolak menyusut dan kontennya mendorong halaman melebar. Grid detail juga pakai `lg:items-start` supaya gambar `aspect-square` tidak melar mengikuti tinggi kolom info.

## Routing & aset

- Route `/products` sempat **301 → /products/** karena dahulu ada folder `public/products`.
  Sudah diperbaiki dengan rename folder aset ke **`public/img`**. Jangan buat lagi folder top-level di
  `public/` yang namanya sama dengan route (`products`, `cart`, `favorites`, `about`, `account`).
- **Nested route gotcha:** JANGAN punya `foo.vue` **dan** `foo/[id].vue` sekaligus — Nuxt menjadikan
  `foo.vue` sebagai *parent layout* dan `[id].vue` jadi child (butuh `<NuxtPage>`), jadi detail tak render.
  Pakai `foo/index.vue` + `foo/[id].vue` (itu sebabnya list ada di `orders/index.vue`, bukan `orders.vue`).

## SEO

- **Keyword tags dinamis**: `app/utils/seo.ts` (BASE_KEYWORDS + `collectionKeywords`/`productKeywords`/`dedupeKeywords`)
  + composable `useStoreKeywords()` → semua koleksi & konsentrasi otomatis jadi tag
  (mis. "Mandalika", "Mandalika decant", "Mandalika EDP", "HMNS", … + "perfume decant/tester"). Koleksi baru ikut otomatis.
  Dipakai di home/products/about (`meta name="keywords"`) & detail (keyword spesifik produk).
- **OG/Twitter** via `useSeoMeta` (default di `nuxt.config` + `app.vue`, per-halaman di home & detail).
  **OG tag dirender SSR** (detail fetch produk server-side) → preview muncul saat link di-share (WA/FB/Twitter).
- **OG image JPEG** (bukan webp — WA rewel sama webp): route **`/og/<id>.jpg`** (sharp) bikin kartu 1200×630
  (botol + footer hitam: brand · nama · harga). Default `/og-cover.jpg` (statik). og:image:width/height diset.
- **Tombol Bagikan** di halaman detail: Web Share API → fallback copy link; + tombol share ke WhatsApp.
- **JSON-LD**: Store/AggregateRating global (`app.vue`), Product+Offer (harga/stok) di halaman detail.
- **Canonical + og:url** global (`app.vue`) pakai `runtimeConfig.public.siteUrl`
  (set `NUXT_PUBLIC_SITE_URL` di produksi). **`/robots.txt`** & **`/sitemap.xml`** dinamis di `server/routes/`.

## Roadmap (lanjutan)

- **Upload → Vercel Blob** untuk produksi (saat ini tulis ke `public/img/uploads`, tidak persist di serverless).
- Bukti bayar / payment gateway (Midtrans/Xendit) — sekarang order langsung `pending` (Transfer/COD manual).
- Email/notif real-time (sekarang notifikasi penjual via polling 30s di `SellerBell.vue`).
- Pindah DB ke Turso untuk produksi (lihat bagian Env).
- Stok per-ukuran (sekarang stok total per produk).

Saat menambah fitur LLM/API apa pun, default ke model Claude terbaru (lihat skill `claude-api`).
