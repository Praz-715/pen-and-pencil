# Pen & Pencil — Design System

> Toko **decant & tester parfum original** sejak 2018.
> Arah desain: **editorial-luxury monochrome** — ink on paper, hairline, ruang napas lega.
> Hanya **hitam & putih** (plus tangga abu-abu). Tidak ada warna aksen.

Referensi tata letak diambil dari [kanky.com](https://kanky.com/products) (sidebar filter, grid produk,
halaman detail dengan galeri + selector), lalu diterjemahkan ke palet monokrom dan rasa majalah/fine-stationery
yang sesuai nama merek "Pen & Pencil".

---

## 1. Konsep & nada

Nama **Pen & Pencil** mengingatkan pada tinta, tulisan tangan, dan kertas premium. Maka:

- **Tipografi serif kontras tinggi** sebagai bintang (judul terasa seperti cover majalah).
- **Latar kertas putih**, **tinta hitam**, garis pembatas setipis rambut.
- Banyak **negative space**; produk (botol decant) jadi subjek di atas ubin abu lembut.
- Gerak halus, elegan — bukan ramai. Satu "page-load reveal" lebih berkesan daripada banyak microinteraction.

---

## 2. Token warna

Didefinisikan sebagai Tailwind v4 `@theme` di [`app/assets/css/main.css`](app/assets/css/main.css).

| Token | Hex | Pakai untuk |
|------|-----|-------------|
| `--color-ink` | `#0b0b0c` | teks utama, tombol solid, logo, footer bg |
| `--color-graphite` | `#1c1c1e` | hover tombol, surface gelap |
| `--color-ash` | `#6b6b6e` | teks sekunder |
| `--color-pewter` | `#9a9a9d` | teks tersier, placeholder |
| `--color-smoke` | `#e6e4e1` | garis/border hairline |
| `--color-fog` | `#f4f3f1` | ubin gambar produk, fill lembut |
| `--color-paper` | `#ffffff` | latar halaman |

Dipakai lewat utilitas Tailwind otomatis: `bg-ink`, `text-ash`, `border-smoke`, `bg-fog`, dst.

**Aturan:** jangan menambah hue (merah/biru/dll). Penegasan dilakukan lewat **kontras** (ink vs paper) dan **berat tipografi**, bukan warna.

---

## 3. Tipografi

Dimuat via [`@nuxt/fonts`](nuxt.config.ts) (self-hosted, zero-config, ramah Vercel).

| Peran | Font | Token | Catatan |
|------|------|-------|---------|
| Display / judul | **Fraunces** | `font-display` (`--font-display`) | serif "old-style" karakterful; pakai *italic* untuk aksen liris |
| Body / UI | **Archivo** | `font-sans` (`--font-sans`) | grotesque bersih, sedikit editorial |

Konvensi:
- `h1/h2/h3` otomatis memakai serif (lihat `@layer base`).
- Kicker/eyebrow: util `.eyebrow` — uppercase, tracking lebar, 11px.
- Angka statistik & harga besar: serif (`font-display`) untuk kesan editorial.
- Tracking judul dirapatkan (`-0.02em`); body sedikit (`-0.011em`).

---

## 4. Layout & grid

- Kontainer maks: `max-w-[1540px]`, gutter responsif via util `.gutter` (20 → 32 → 40px).
- **Grid produk (wajib):**
  - Mobile `< 768px` → **2 kolom**
  - Tablet `768–1279px` → **3 kolom**
  - Desktop `≥ 1280px` → **4 kolom**
  - Lihat [`ProductGrid.vue`](app/components/ProductGrid.vue): `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`.
- Halaman katalog: sidebar `260–280px` + konten (`lg:grid-cols-[260px_1fr]`).
- Tinggi header: `--header-h: 76px` (sticky).

Breakpoint Tailwind default: `sm 640 · md 768 · lg 1024 · xl 1280`.
`lg` = batas desktop-vs-mobile untuk nav (nav tengah muncul di `lg+`).

---

## 5. Komponen kunci

Util komponen di `@layer components` ([main.css](app/assets/css/main.css)):

- `.btn-ink` — tombol solid hitam (CTA utama).
- `.btn-line` — tombol outline (CTA sekunder).
- `.tag` / `.tag-line` — pill status (Ready Stock / Baru / Intens / nama koleksi).
- `.eyebrow` — label kicker.
- `.link-underline` — underline animasi sweep (kiri→kanan) saat hover.

Pola kartu produk ([`ProductCard.vue`](app/components/ProductCard.vue)):
ubin `aspect-square bg-fog` + gambar `object-contain`, badge kiri-atas, hati favorit kanan-bawah,
meta (koleksi · konsentrasi · nama · "Mulai Rp…"), baris "Lihat & Beli" dengan panah geser saat hover.

---

## 6. Navbar

`AppHeader.vue` — sticky, `bg-paper/85 backdrop-blur`, border bawah hairline.

- **Kiri:** (mobile) tombol menu + wordmark `Pen&Pencil` (serif, `&` italic abu).
- **Tengah (≥lg):** nav — Semua Produk · Mandalika · HMNS · Velixir · Tentang (uppercase, tracking, underline hover).
- **Kanan:** `IDR` (label) · **Search** (buka overlay) · **Favorite** (♥, badge jumlah) · **Keranjang** (tas, badge) · **Profile** (user).
- **Mobile:** menu(kiri) → wordmark → Search · ♥ · Tas · User. Nav lengkap ada di drawer ([`MobileMenu.vue`](app/components/MobileMenu.vue)).

Badge jumlah dibungkus `<ClientOnly>` (state dari localStorage) agar tak terjadi hydration mismatch.

---

## 7. Sidebar (katalog)

Direkayasa di [`ProductFilters.vue`](app/components/ProductFilters.vue), dipakai ulang untuk
desktop (sticky) dan drawer mobile.

Isi yang dipilih (hasil "coba kamu pikirkan"):
1. **Kotak cari** di katalog.
2. **Koleksi** (checkbox + jumlah): Mandalika / HMNS / Velixir.
3. **Tipe Produk** (radio): Semua / Terbaru / Intens.
4. **Ukuran Tersedia** (toggle chip): 1 / 2 / 3 / 5 / 10 ml.
5. **Reset filter**.

Di **mobile** sidebar disembunyikan, diganti bar **Filter** + **Urutkan** (meniru Kanky):
Filter membuka sheet penuh, Urutkan membuka bottom-sheet. Chip filter aktif bisa dihapus satu-satu.

Input native diberi `accent-ink` agar checkbox/radio ikut monokrom.

---

## 8. Halaman detail produk

`pages/products/[id]/[slug].vue` — meniru pola Kanky, versi monokrom.

**Desktop:** kolom thumbnail vertikal + gambar utama besar (`bg-fog`), lalu panel info:
badge (Ready Stock/Baru/koleksi/konsentrasi) → judul serif → harga per ukuran terpilih →
banner "tips hemat" → info pembelian → **Varian koleksi** (thumbnail saudara = analog "Color" Kanky) →
**Pilih ukuran** (grid harga + Panduan ukuran) → stepper qty + Tambah ke Keranjang + favorit +
Pesan via WhatsApp → accordion (Deskripsi / Pengiriman / Catatan decant).

**Mobile:** galeri swipe `snap-x` + dots, info di bawah, dan **sticky bottom CTA**
(harga • Tambah ke Keranjang • tombol WhatsApp) — seperti tombol "Add to Cart" Kanky mobile.
FAB WhatsApp global disembunyikan di halaman ini agar tak bertumpuk.

---

## 9. Motion

- `--ease-out-expo: cubic-bezier(0.16,1,0.3,1)` untuk hampir semua transisi.
- `.reveal` + `animation-delay` bertingkat → page-load hero/menu.
- Gambar produk: `scale` halus saat hover (durasi 700ms–1.2s).
- Transisi halaman Nuxt: fade + geser 8px.
- `@media (prefers-reduced-motion: reduce)` mematikan animasi.

---

## 10. Aksesibilitas

- Fokus terlihat: `:focus-visible` outline ink 2px.
- Semua tombol ikon punya `aria-label`; toggle favorit pakai `aria-pressed`.
- Kontras teks: ink/ash di atas paper memenuhi AA.
- Target sentuh ≥ 40px (ikon header `size-10`).
- `Esc` menutup overlay search; sheet/drawer mengunci scroll body.

---

## 11. Aset

- Gambar produk di [`public/img/<koleksi>/<Nama>.webp`](public/img) (mandalika / hmns / velixir).
- Galeri koleksi: `1/2/3/4.webp`; video Mandalika: `video-mandalika-1.mp4`.
- Folder sengaja dinamai `img/` (bukan `products/`) agar tidak bentrok dengan route `/products`.
- `public/logo.webp` tersedia bila ingin mengganti wordmark teks (saat ini pakai wordmark serif demi konsistensi B&W).
- Favicon: [`public/favicon.ico`](public/favicon.ico) — monogram `P&P`.
