# DEPLOY — Pen & Pencil → Vercel + Turso

Runbook deploy **preview/demo** ke Vercel (DB di Turso, gambar upload di Vercel Blob).
Kode sudah siap: `db.ts` baca `DATABASE_AUTH_TOKEN` (Turso), uploader pindah ke Blob otomatis
saat `BLOB_READ_WRITE_TOKEN` ada, dan `npm run build` lolos.

> Bagian yang **wajib kamu lakukan sendiri** (login browser) ditandai 🔑.

---

## Env yang dibutuhkan di Vercel

| Variable | Nilai |
|---|---|
| `BETTER_AUTH_SECRET` | rahasia ≥32 char (sudah digenerate, lihat chat — atau buat baru: `node -e "console.log(require('crypto').randomBytes(33).toString('base64'))"`) |
| `BETTER_AUTH_URL` | URL deploy (mis. `https://pen-and-pencil.vercel.app`) |
| `NUXT_PUBLIC_SITE_URL` | sama dengan URL deploy (untuk canonical/OG/sitemap) |
| `DATABASE_URL` | dari Turso (`libsql://…`) |
| `DATABASE_AUTH_TOKEN` | token Turso |
| `BLOB_READ_WRITE_TOKEN` | otomatis ditambahkan Vercel saat bikin Blob store |
| `SELLER_EMAIL` / `SELLER_PASSWORD` / `SELLER_NAME` | opsional, untuk akun penjual seed |

---

## Langkah 1 — Database Turso 🔑

1. Daftar/masuk di **https://app.turso.tech** → **Create Database** (region terdekat, mis. `sin`/Singapore).
2. Buka database → **Connect** → salin:
   - **URL** → ini `DATABASE_URL` (`libsql://nama-db-org.turso.io`)
   - **Create Token** → ini `DATABASE_AUTH_TOKEN`

## Langkah 2 — Push skema + seed ke Turso (lokal)

Buat file **`.env.production`** di root (sudah gitignored):

```env
DATABASE_URL=libsql://...isi-dari-turso...
DATABASE_AUTH_TOKEN=...isi-dari-turso...
BETTER_AUTH_SECRET=...rahasia-produksi...
BETTER_AUTH_URL=https://nanti-isi-url-deploy
SELLER_EMAIL=penjual@penandpencil.id
SELLER_PASSWORD=penjual123
SELLER_NAME=Admin Pen & Pencil
```

Lalu jalankan (sekali saja, dari mesin lokal):

```bash
npm run db:push:prod    # buat tabel di Turso
npm run db:seed:prod    # seller + 36 produk + data demo realistis
npm run og:gen          # generate kartu OG statis → public/og/<id>.jpg (lalu commit)
```

> `db:seed:prod` = seller seed → products seed → demo seed (order semua status + omzet + notif).
>
> ⚠️ **OG image & sharp di Vercel:** `sharp` (native binary) **tidak bisa dimuat** di runtime
> serverless Vercel, jadi route dinamis `/og/<id>.jpg` selalu fallback ke `/og-cover.jpg`. Solusi:
> **pre-generate kartu OG secara lokal** (`npm run og:gen`, sharp jalan di Windows/Mac) ke
> `public/og/<id>.jpg` lalu **commit** — Vercel menyajikannya sebagai file statis (dilayani sebelum
> fungsi). **Tiap kali nambah/ubah produk, jalankan `og:gen` lagi & commit.** Route dinamis tetap
> ada sebagai fallback anggun (302 → og-cover) untuk produk tanpa kartu.

## Langkah 3 — Deploy ke Vercel 🔑

**Cara A — Vercel CLI (paling cepat untuk preview):**

```bash
npm i -g vercel
vercel login            # 🔑 login browser
vercel                  # deploy preview (jawab prompt: link/buat project baru)
```

**Cara B — Git + dashboard:** push repo ke GitHub, lalu di **vercel.com** → New Project →
import repo (Vercel auto-detect Nuxt, tak perlu setting build).

## Langkah 4 — Vercel Blob + Env Vars 🔑

1. Di project Vercel → tab **Storage** → **Create** → **Blob** → connect.
   Ini otomatis menambahkan `BLOB_READ_WRITE_TOKEN` ke env project.
2. Tab **Settings → Environment Variables**, tambahkan semua var dari tabel di atas
   (`DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
   `NUXT_PUBLIC_SITE_URL`, `SELLER_*`).

## Langkah 5 — Set URL final & redeploy

URL deploy baru diketahui **setelah** deploy pertama. Maka:

1. Setelah tahu URL (mis. `https://pen-and-pencil.vercel.app`), isi `BETTER_AUTH_URL` &
   `NUXT_PUBLIC_SITE_URL` dengan URL itu.
2. **Redeploy** (CLI: `vercel --prod`, atau dashboard → Redeploy).

Kalau dua var URL ini salah/masih localhost: **login bisa gagal** (Better Auth cek origin)
dan **preview OG saat share belum benar**.

---

## Uji setelah online

- Buka URL → beranda tampil, produk muncul (artinya Turso konek).
- Login **penjual@penandpencil.id / penjual123** → dashboard omzet & lonceng notif terisi.
- Login pembeli **budi@test.com / rahasia123** → keranjang/favorit terisi, checkout jalan.
- Penjual → **Produk → Tambah** → upload gambar → tersimpan (artinya Blob konek).
- Buka produk → tombol **Bagikan** → share ke WhatsApp → **kartu OG muncul** (artinya `NUXT_PUBLIC_SITE_URL` benar).
- Cek `/<URL>/og/3003.jpg` langsung → kartu 1200×630 ter-render.

## Catatan

- File `.env.production` **jangan di-commit** (sudah gitignored). Token Turso/Blob = rahasia.
- DB Turso free tier cukup untuk demo. Data demo bisa di-refresh kapan saja: `npm run db:seed:demo` (lokal) atau `npm run db:seed:prod` (ke Turso).
- Domain custom nanti: tambah di Vercel → update kedua var URL → redeploy.
