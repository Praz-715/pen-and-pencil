import { and, desc, eq } from 'drizzle-orm'
import type { Product } from '../database/schema'

/** DB product row → storefront `Scent` shape used by the UI. */
export function serializeProduct(p: Product) {
  const sizes = (p.sizes ?? []).map((s) => ({
    ml: s.ml,
    label: `${s.ml}ml`,
    note: s.note,
    price: s.price,
  }))
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    collectionId: p.collectionId,
    concentration: p.concentration ?? undefined,
    image: p.image,
    description: p.description,
    sizes,
    isNew: p.isNew,
    stock: p.stock,
    active: p.active,
    fromPrice: sizes.length ? Math.min(...sizes.map((s) => s.price)) : 0,
  }
}

export async function listProductsDb(opts: { activeOnly?: boolean; collectionId?: string } = {}) {
  const conds = []
  if (opts.activeOnly) conds.push(eq(schema.product.active, true))
  if (opts.collectionId) conds.push(eq(schema.product.collectionId, opts.collectionId))
  return db
    .select()
    .from(schema.product)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schema.product.isNew), desc(schema.product.createdAt))
}

export async function getProductDb(id: number) {
  const [row] = await db.select().from(schema.product).where(eq(schema.product.id, id))
  return row
}

/** Coerce arbitrary input into a clean, sorted size list. */
export function normalizeSizes(input: unknown): { ml: number; price: number; note?: string }[] {
  if (!Array.isArray(input)) return []
  return input
    .map((s: { ml?: unknown; price?: unknown; note?: unknown }) => ({
      ml: Math.round(Number(s?.ml)),
      price: Math.round(Number(s?.price)),
      note: s?.note ? String(s.note) : undefined,
    }))
    .filter((s) => Number.isFinite(s.ml) && s.ml > 0 && Number.isFinite(s.price) && s.price >= 0)
    .sort((a, b) => a.ml - b.ml)
}

/** Return a slug that is unique in the product table (optionally excluding one id). */
export async function ensureUniqueSlug(base: string, excludeId?: number): Promise<string> {
  const root = base || 'produk'
  let slug = root
  let i = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [hit] = await db.select({ id: schema.product.id }).from(schema.product).where(eq(schema.product.slug, slug))
    if (!hit || hit.id === excludeId) return slug
    i += 1
    slug = `${root}-${i}`
  }
}
