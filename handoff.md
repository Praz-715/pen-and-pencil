# HANDOFF — Pen & Pencil

> Catatan serah-terima untuk sesi Claude berikutnya. **Baca ini dulu**, lalu [CLAUDE.md](CLAUDE.md)
> (arsitektur detail) + [DESIGN.md](DESIGN.md) (sistem desain). File ini = pengetahuan operasional,
> kondisi terkini, keputusan, dan jebakan yang sudah ketemu. Tanggal handoff: 2026-06-14.

---

## 1. Ringkas: ini apa & sudah sampai mana

Storefront **toko parfum decant & tester "Pen & Pencil"** — **Nuxt 4 full-stack monolith**, target deploy **Vercel**.
Desain **hitam-putih editorial** (B&W only), copy Bahasa Indonesia, IDR. Sudah **fungsional end-to-end**, lolos
`npm run build`, dan diuji responsif (0 horizontal overflow) di mobile/tablet/desktop.

**Sudah jalan (DONE):**
- Storefront: beranda, katalog `/products` (sidebar filter, sort, grid 2/3/4), detail produk (galeri + size selector).
- **Auth** (Better Auth, email+password) + **2 role**: `buyer` (default signup) & `seller` (1 akun, di-seed).
- **Produk DB-backed** + manajemen penjual penuh (CRUD di `/seller/products`, **upload gambar PNG/JPG → WebP** via sharp).
- **Koleksi & konsentrasi free-form** (combobox; koleksi baru otomatis muncul di nav/filter/carousel/footer/sitemap/keyword).
- **Stok nyata**: order kurangi stok (tolak 409 kalau kurang), cancel kembalikan; stok jadi batas qty di semua surface.
- **Cart & favorites DB-backed** (BUKAN localStorage), butuh login.
- **Checkout in-app** (Transfer/COD, bukan WhatsApp) → order tracking timeline; alamat multi (CRUD).
- **Seller**: dashboard omzet (hari/minggu/bulan/semua + total), notifikasi order baru, fulfillment checklist (pending→processing→shipped+resi→delivered/cancel).
- **SEO maksimal**: keyword tag dinamis, OG/Twitter (SSR), JSON-LD (Store+Product), canonical, robots.txt, sitemap.xml dinamis, **OG image JPEG card** `/og/<id>.jpg`, tombol Bagikan di detail.
- **Sticky bottom CTA** (produk/cart/checkout): melayang saat scroll, **mendarat di atas footer** saat di bawah (pakai `position: sticky`).

**Belum (TODO produksi) — lihat §7.**

---

## 2. ⚠️ Jebakan operasional (BACA — ini paling sering bikin bingung)

1. **Dev server sering crash saat HMR** (`exit 139`/segfault, atau request balik **503 "Dev server is unavailable"**)
   setelah banyak edit beruntun (apalagi nambah file server/route baru). **Ini bukan bug kode** — `npm run build`
   tetap lolos. **Pola pemulihan (Windows):**
   ```bash
   # stop task dev di background lalu:
   powershell "Get-Process node -EA SilentlyContinue | Stop-Process -Force"
   # tunggu 2 dtk, lalu start lagi:
   npm run dev   # (run in background), tunggu ~13 dtk, cek: curl localhost:3000 → 200
   ```
   Selalu **restart bersih** setelah serangkaian edit besar sebelum verifikasi.

2. **Windows lock di folder `public/`**: kalau mau rename/move folder di `public/` dan kena
   "Permission denied", **kill proses node dulu** (dev server megang folder), baru rename.

3. **Nuxt nested-route gotcha**: JANGAN punya `foo.vue` **dan** `foo/[id].vue` bareng — Nuxt jadikan `foo.vue`
   parent layout (butuh `<NuxtPage>`), jadi halaman detail tak render. **Pakai `foo/index.vue` + `foo/[id].vue`.**
   (Sudah diterapkan di `account/orders/` & `seller/orders/`.)

4. **Nama folder di `public/` = nama route → 301**: aset produk ditaruh di **`public/img/`** (bukan `public/products`)
   supaya tak bentrok route `/products`. Jangan bikin folder top-level `public/` bernama `products/cart/checkout/...`.

5. **`min-w-0`** wajib di item grid/flex yang punya anak `overflow-x-auto` (mis. baris "Varian" / form produk),
   kalau tidak track menolak menyusut → halaman melebar (horizontal overflow).

6. **OG harus SSR**: halaman detail fetch produk **server-side** (`useFetch` TANPA `server:false`) supaya tag OG
   ada di HTML mentah → preview muncul saat link di-share. Jangan ubah jadi client-only.

7. **WhatsApp rewel sama webp** untuk OG → OG image dibuat **JPEG** (`/og/<id>.jpg`, sharp). Jangan pakai webp utk og:image.

8. **Cart/favorites = state client** (di-hydrate dari DB via `plugins/shop-state.client.ts`) → bagian yang
   menampilkannya **wajib** dibungkus `<ClientOnly>` biar tak hydration-mismatch.

9. **Stok = sumber kebenaran tunggal** untuk batas qty. JANGAN hardcode batas (dulu ada `MAX_QTY=10` → bikin tak konsisten).

10. **`sharp` TIDAK jalan di runtime Vercel** (binary native `@img/sharp-*` di-load lewat `require`
    dinamis yang tak bisa di-trace `@vercel/nft`). Akibatnya route OG dinamis `/og/<id>.jpg` selalu
    fallback ke `/og-cover.jpg` di produksi. **Jangan** coba `nitro.externals.traceInclude:['sharp']`
    (malah bikin build Vercel gagal — di-resolve sebagai path file). **Solusi yang dipakai:**
    pre-generate kartu OG statis (`npm run og:gen` → `public/og/<id>.jpg`, sharp jalan di lokal),
    **commit**; Vercel menyajikannya sebagai file statis. Route dinamis tetap ada sbg fallback. **Tiap
    nambah/ubah produk → `npm run og:gen` + commit.** (Upload gambar penjual di prod juga butuh sharp →
    sama-sama kena; untuk demo aman karena 36 produk seed sudah punya kartu.)

---

## 3. Cara jalanin & akun uji

```bash
npm install
# .env sudah ada (dev). Kalau hilang: cp .env.example .env lalu isi BETTER_AUTH_SECRET dll.
npm run db:push     # buat/sync tabel ke ./.data/penandpencil.db
npm run db:seed     # seed penjual + 36 produk (idempotent)
npm run dev         # http://localhost:3000
npm run build       # cek deployability (Nitro)
npm run db:studio   # inspeksi DB (drizzle studio)
```

**Akun uji (dev DB):**
- Penjual: **penjual@penandpencil.id / penjual123** (login → diarahkan ke `/seller`).
- Pembeli: **budi@test.com / rahasia123** (ada juga `citra@test.com / rahasia123`).
- Signup di UI **selalu** bikin pembeli; role seller hanya via seed/DB.

**State data dev sekarang (sudah ada isinya dari pengujian):** 36 produk seed + koleksi tambahan **"mykonos"**
(dibuat user saat tes — bukti sistem koleksi dinamis jalan), beberapa order uji milik budi, item cart/favorit budi.
Stok produk seed = 50 (Galatea sempat 0 saat tes lalu di-reset ke 50). Kalau mau bersih: hapus `.data/penandpencil.db`
lalu `npm run db:push && npm run db:seed` (penjual ikut ter-seed ulang).

---

## 4. Peta cepat (detail lengkap di CLAUDE.md)

- **DB tables:** `user, session, account, verification` (auth) · `product` · `address` · `order` · `order_item` ·
  `cart_item` · `favorite`. Schema: `server/database/schema.ts`. Client DB: `server/utils/db.ts`.
- **Server utils auto-import:** `requireUser/requireSeller/getOptionalUser` (`authSession.ts`),
  `getProductDb/listProductsDb/serializeProduct/normalizeSizes/ensureUniqueSlug` (`products.ts`),
  `listCart/listFavorites` (`shopState.ts`).
- **API:** `auth/[...all]`, `products/*` (CRUD), `cart/*` (GET/POST/PUT/DELETE), `favorites/*` (GET/POST toggle),
  `orders/*` + `orders/[id]/status.patch`, `addresses/*`, `seller/stats|notifications|upload`.
- **Server routes (non-API):** `og/[id].get.ts` (JPEG card), `robots.txt.ts`, `sitemap.xml.ts`.
- **Composables:** `useAuth, useProducts, useCart, useFavorites, useUi, useSellerNotifications, useStoreKeywords`.
- **Util (app):** `catalog.ts` (koleksi statik + tipe + `SIZE_TIERS` + helper), `shop.ts` (`SHOP` konstanta), `format.ts`, `orders.ts`, `seo.ts`, `auth-client.ts`.
- **Middleware (client):** `auth` (wajib login), `seller` (role seller), `buyer` (login + bukan seller), `not-seller` (blok seller saja).
- **Plugins:** `shop-state.client.ts` (load cart+favorites dari DB saat login).

---

## 5. Keputusan penting (kenapa begini)

- **B&W tapi foto produk tetap berwarna** — grayscale foto parfum jelek & nyembunyiin produk. Chrome/UI monokrom, foto asli.
- **Semua data di DB** (produk, cart, favorit, order, alamat) — katalog statik lama sudah dipindah; `catalog.ts` cuma metadata koleksi "known".
- **Koleksi & konsentrasi free-form** — penjual bisa ketik baru; `collectionId` di-slugify; `getCollection()` selalu balik metadata (known kaya / sintesis `titleCase`).
- **Checkout in-app** (bukan WA) sesuai permintaan; pembayaran masih manual (Transfer/COD, dikonfirmasi penjual).
- **Seller tak bisa beli**: nav role-aware, tombol beli/cart/favorit disembunyikan utk seller, server tolak 403; `/cart /favorites /checkout` redirect seller ke `/seller`.
- **Sticky CTA** pakai `position: sticky; bottom:0` (bukan fixed) → otomatis mendarat di atas footer; full-bleed via negative margin (cart/checkout) atau root full-width (detail).

---

## 6. Verifikasi (script Playwright — butuh dev server :3000 hidup)

```bash
node scripts/audit.mjs          # overflow semua halaman publik × 5 viewport
node scripts/verify-app.mjs     # login per-role, overflow + screenshot halaman ber-auth
node scripts/verify-seller.mjs  # seller diblok dari halaman beli + nav role-aware
node scripts/verify-products.mjs # halaman manajemen produk (overflow + shot)
node scripts/verify-stock.mjs / verify-cart-stock.mjs  # batas stok di detail/cart/checkout
node scripts/verify-mobile-cta.mjs / verify-sticky.mjs # bottom bar mobile (float → dock)
```
Screenshot keluar ke `%TEMP%/pp-*` (mis. `C:/Users/teguh/AppData/Local/Temp/pp-shots`).
Catatan: script yg ubah stok sudah me-reset balik ke 50 di akhir; kalau ke-interupsi, cek/`PUT` stok manual.

---

## 7. TODO untuk PRODUKSI (penting sebelum go-live)

1. **`NUXT_PUBLIC_SITE_URL`** = domain asli (mis. `https://penandpencil.com`) → canonical, og:url, og:image, sitemap pakai URL publik. Sekarang masih `http://localhost:3000` (dev) jadi preview share belum benar sampai online.
2. **`SHOP.whatsapp`** di `app/utils/shop.ts` masih placeholder `6281234567890` → ganti nomor WA toko asli.
3. **Database → Turso** (libSQL cloud): SQLite file lokal **tidak persist** di serverless Vercel. Set `DATABASE_URL=libsql://…` + `DATABASE_AUTH_TOKEN`. (Drizzle/better-auth sudah kompatibel.)
4. **Upload gambar → Vercel Blob**: sekarang `POST /api/seller/upload` (sharp→webp) **tulis ke `public/img/uploads/`** — FS serverless read-only, jadi di prod harus diganti upload ke Blob & kembalikan URL-nya (tinggal ganti isi handler itu; sisanya sudah pakai path apa adanya).
5. **`BETTER_AUTH_SECRET`** + `BETTER_AUTH_URL` di env Vercel (jangan pakai secret dev).
6. **Payment gateway** (opsional): Midtrans/Xendit — sekarang order langsung `pending` (manual).
7. Catatan kosmetik: produk seed **Mandalika** pakai gambar promo webp berwarna (ramai); produk baru yg di-upload penjual pakai foto sendiri. Stok seed semua 50 — atur stok asli via **Produk → Ubah**.

---

## 8. Roadmap lanjutan (kalau diminta)
- Stok per-ukuran (sekarang stok total per produk).
- Bukti bayar / upload bukti transfer.
- Notifikasi real-time penjual (sekarang polling 30 dtk di `SellerBell.vue`).
- Halaman kelola koleksi (nama/gambar/deskripsi) — sekarang koleksi non-"known" metadata-nya disintesis dari slug.

> Saat nambah fitur LLM/API apa pun, default ke model Claude terbaru (lihat skill `claude-api`).
