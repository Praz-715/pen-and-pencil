/* ============================================================
   PEN & PENCIL — catalog metadata & types
   Products now live in the database (managed by the seller).
   This module keeps the static collection metadata + shared
   types/helpers used across the app. See server/utils/products.ts
   for DB access and scripts/seed-products.ts for the initial data.
   ============================================================ */
import { slugify } from './format'

// Free-form: the 3 below are "known" (rich metadata) but the seller can add more.
export type CollectionId = string
export type Concentration = string

export interface SizeOption {
  ml: number
  label: string
  note?: string
  price: number
}

/** A storefront product (serialized from the DB `product` row). */
export interface Scent {
  id: number
  slug: string
  name: string
  collectionId: CollectionId
  concentration?: Concentration
  image: string
  description?: string | null
  sizes: SizeOption[]
  isNew: boolean
  stock: number
  active: boolean
  fromPrice: number
}

export interface Collection {
  id: CollectionId
  slug: string
  name: string
  shortName: string
  tagline: string
  description: string
  gallery: string[]
  video?: string
}

/* ---- Price tier presets (for the add-product form) -------- */
export const SIZE_TIERS: Record<'edp' | 'edp3' | 'intens', SizeOption[]> = {
  edp: [
    { ml: 1, label: '1ml', note: 'oles', price: 18000 },
    { ml: 2, label: '2ml', price: 24500 },
    { ml: 5, label: '5ml', price: 48900 },
    { ml: 10, label: '10ml', price: 92800 },
  ],
  edp3: [
    { ml: 1, label: '1ml', note: 'oles', price: 18000 },
    { ml: 2, label: '2ml', price: 24500 },
    { ml: 3, label: '3ml', price: 28500 },
    { ml: 5, label: '5ml', price: 48900 },
    { ml: 10, label: '10ml', price: 92800 },
  ],
  intens: [
    { ml: 1, label: '1ml', note: 'oles', price: 24500 },
    { ml: 2, label: '2ml', price: 33000 },
    { ml: 5, label: '5ml', price: 63000 },
    { ml: 10, label: '10ml', price: 115000 },
  ],
}

/* ---- Collections (static metadata) ------------------------ */
export const collections: Collection[] = [
  {
    id: 'mandalika',
    slug: 'mandalika',
    name: 'Decant Tester Parfum Mandalika',
    shortName: 'Mandalika',
    tagline: 'Berani & tahan lama',
    description:
      'Lini parfum dengan karakter berani dan daya tahan kuat. Tersedia dalam varian EDP dan Intens. Semua dijual sebagai decant tester resmi — coba dulu wanginya sebelum memutuskan full bottle.',
    gallery: ['/img/mandalika/2.webp', '/img/mandalika/3.webp', '/img/mandalika/4.webp'],
    video: '/img/mandalika/video-mandalika-1.mp4',
  },
  {
    id: 'hmns',
    slug: 'hmns',
    name: 'Decant Share Tester Parfum HMNS',
    shortName: 'HMNS',
    tagline: 'Decant share original',
    description:
      'Decant share dari botol original HMNS. Dibagi rapi ke ukuran kecil supaya kamu bisa kenalan dulu dengan karakternya tanpa harus beli botol penuh.',
    gallery: ['/img/hmns/1.webp', '/img/hmns/2.webp', '/img/hmns/3.webp'],
  },
  {
    id: 'velixir',
    slug: 'velixir',
    name: 'Decant Tester Velixir Parfums',
    shortName: 'Velixir',
    tagline: 'Mitologi dalam botol',
    description:
      'Decant tester original Velixir Parfums — koleksi yang terinspirasi nama-nama mitologi. Pilihan tepat untuk mengeksplorasi profil aroma baru lewat ukuran kecil.',
    gallery: ['/img/velixir/1.webp', '/img/velixir/2.webp', '/img/velixir/3.webp'],
  },
]

export const COLLECTION_IDS = collections.map((c) => c.id)

/** "niche-premium" → "Niche Premium" */
export function titleCase(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Always returns metadata. Known collections get their rich entry;
 * unknown (seller-added) ids get a synthesized one (label from the slug).
 */
export function getCollection(id: string): Collection {
  const found = collections.find((c) => c.id === id)
  if (found) return found
  const label = titleCase(id) || id
  return { id, slug: id, name: label, shortName: label, tagline: '', description: '', gallery: [] }
}

/** Full display title incl. collection + concentration. */
export function scentFullName(scent: Pick<Scent, 'name' | 'collectionId' | 'concentration'>): string {
  const col = getCollection(scent.collectionId)
  const conc = scent.concentration ? ` ${scent.concentration}` : ''
  return `${col?.shortName} — ${scent.name}${conc}`
}

/** Compute the canonical slug for a product. */
export function productSlug(collectionId: string, name: string, concentration?: string | null): string {
  return slugify(`${collectionId} ${name} ${concentration ?? ''}`)
}
