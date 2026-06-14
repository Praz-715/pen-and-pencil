/**
 * Seed a REALISTIC DEMO dataset (for showing the app to the shop owner).
 *
 * What it does (idempotent — safe to re-run; it resets first):
 *   1. Cleans test junk: drops the "mykonos" test collection, wipes all
 *      orders / order_items / carts / favorites.
 *   2. Resets every product's stock to a healthy baseline, then leaves a
 *      couple deliberately low so the "stok menipis" UX can be demoed.
 *   3. Seeds ~12 orders spread across all statuses AND across today / this
 *      week / this month / older — so the seller dashboard's omzet
 *      (hari·minggu·bulan·semua) shows increasing real numbers, the
 *      pipeline has entries in every column, and 2 brand-new unseen orders
 *      light up the notification bell.
 *   4. Gives the demo buyer (budi@test.com) a default address, a couple of
 *      favorites and a couple of cart items so every buyer page looks "used".
 *
 * Run:  npm run db:seed:demo   (requires seller + products already seeded)
 */
import { eq, inArray } from 'drizzle-orm'
import { getCollection } from '../app/utils/catalog'
import { db, schema } from '../server/utils/db'

const DAY = 86_400_000
const now = new Date()

/** A Date `daysAgo` days before now, at a fixed local hour (deterministic). */
function at(daysAgo: number, hour = 10, min = 17): Date {
  const d = new Date(now.getTime() - daysAgo * DAY)
  d.setHours(hour, min, 0, 0)
  return d
}

let seq = 4200
const nextCode = () => `PP-${(++seq).toString(36).toUpperCase()}`

/* ------------------------------------------------------------------ */
/* 0. Look up users                                                    */
/* ------------------------------------------------------------------ */
const buyers = await db.select().from(schema.user).where(eq(schema.user.role, 'buyer'))
if (!buyers.length) {
  console.error('✖ No buyer accounts found. Sign up a buyer (or run db:seed) first.')
  process.exit(1)
}
const budi = buyers.find((b) => b.email === 'budi@test.com') ?? buyers[0]

/* ------------------------------------------------------------------ */
/* 1. Clean test junk                                                  */
/* ------------------------------------------------------------------ */
console.log('› Cleaning previous orders / carts / favorites / junk collection…')
await db.delete(schema.orderItem)
await db.delete(schema.order)
await db.delete(schema.cartItem)
await db.delete(schema.favorite)
await db.delete(schema.address)
// Drop the "mykonos" test collection created during manual testing.
const junk = await db.delete(schema.product).where(eq(schema.product.collectionId, 'mykonos')).returning()
if (junk.length) console.log(`  – removed ${junk.length} junk product(s) from "mykonos"`)

/* ------------------------------------------------------------------ */
/* 2. Reset stock baseline + a couple deliberately low                 */
/* ------------------------------------------------------------------ */
const products = await db.select().from(schema.product).where(eq(schema.product.active, true))
const byId = new Map(products.map((p) => [p.id, p]))
for (const p of products) {
  await db.update(schema.product).set({ stock: 50 }).where(eq(schema.product.id, p.id))
}
// Showcase low stock (skip silently if these ids aren't present).
const LOW: Array<[number, number]> = [
  [3005, 4], // Velixir Galatea — "Stok menipis"
  [1006, 7], // Mandalika Lady Boss
]
for (const [id, n] of LOW) {
  if (byId.has(id)) await db.update(schema.product).set({ stock: n }).where(eq(schema.product.id, id))
}

/* ------------------------------------------------------------------ */
/* 3. Build realistic orders                                           */
/* ------------------------------------------------------------------ */
type Status = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

// Realistic Indonesian shipping snapshots, rotated across orders.
const SHIP = [
  { name: 'Budi Santoso', phone: '081234567811', addr: 'Jl. Kemang Raya No. 21, RT 03/RW 05, Mampang Prapatan', city: 'Jakarta Selatan', postal: '12730' },
  { name: 'Citra Lestari', phone: '082145678922', addr: 'Perum Griya Asri Blok C2 No. 9, Cibubur', city: 'Depok', postal: '16454' },
  { name: 'Dewi Anggraini', phone: '085678123433', addr: 'Jl. Diponegoro No. 145, Tegalsari', city: 'Surabaya', postal: '60264' },
  { name: 'Rangga Pratama', phone: '087812345644', addr: 'Jl. Cihampelas No. 88, Coblong', city: 'Bandung', postal: '40131' },
  { name: 'Sari Wulandari', phone: '081398765455', addr: 'Jl. Gajah Mada No. 7, Pontianak Kota', city: 'Pontianak', postal: '78121' },
]
const COURIERS = ['JNE REG', 'J&T Express', 'SiCepat HALU', 'AnterAja']

// Curated product ids to feature in orders (kept on the healthy-stock side).
const POOL = [3003, 3004, 3006, 3001, 1001, 1003, 1005, 1017, 2001, 2002, 1013, 3010].filter((id) => byId.has(id))

// Plan: [daysAgo, status, itemCount, seenBySeller]
// Spread so omzet today < week < month < all, and every pipeline column is filled.
const PLAN: Array<[number, Status, number, boolean]> = [
  // today (3) — 2 brand-new unseen → bell lights up
  [0, 'pending', 2, false],
  [0, 'pending', 1, false],
  [0, 'processing', 2, true],
  // this week (3)
  [1, 'processing', 1, true],
  [3, 'shipped', 2, true],
  [5, 'shipped', 1, true],
  // earlier this month (3)
  [8, 'shipped', 2, true],
  [11, 'delivered', 1, true],
  [13, 'delivered', 3, true],
  // older — only counts toward "semua" (2 delivered + 1 cancelled)
  [22, 'delivered', 2, true],
  [34, 'delivered', 1, true],
  [27, 'cancelled', 2, true],
]

let poolCursor = 0
function pickItems(count: number) {
  const chosen: number[] = []
  for (let i = 0; i < count; i++) {
    chosen.push(POOL[poolCursor % POOL.length])
    poolCursor++
  }
  return chosen
}

let orderIdx = 0
const summary: Record<string, number> = {}

for (const [daysAgo, status, itemCount, seen] of PLAN) {
  const created = at(daysAgo, 9 + (orderIdx % 9), (orderIdx * 13) % 60)
  const buyer = buyers[orderIdx % buyers.length]
  const ship = SHIP[orderIdx % SHIP.length]

  // Build line items from real product prices.
  let subtotal = 0
  const lines: Array<typeof schema.orderItem.$inferInsert> = []
  for (const pid of pickItems(itemCount)) {
    const p = byId.get(pid)!
    const sizes = (p.sizes ?? []) as Array<{ ml: number; price: number }>
    // pick a mid-range size for a believable basket
    const size = sizes[Math.min(2, sizes.length - 1)] ?? sizes[0]
    const qty = 1 + (orderIdx % 2)
    const lineTotal = size.price * qty
    subtotal += lineTotal
    lines.push({
      orderId: '',
      scentId: p.id,
      scentName: p.concentration ? `${p.name} ${p.concentration}` : p.name,
      collection: getCollection(p.collectionId).shortName,
      ml: size.ml,
      unitPrice: size.price,
      qty,
      lineTotal,
      image: p.image,
    })
  }

  // Status-consistent fulfillment timestamps.
  const processingAt = ['processing', 'shipped', 'delivered'].includes(status) ? new Date(created.getTime() + 3 * 3600_000) : null
  const shippedAt = ['shipped', 'delivered'].includes(status) ? new Date(created.getTime() + 1 * DAY) : null
  const deliveredAt = status === 'delivered' ? new Date(created.getTime() + 3 * DAY) : null
  const cancelledAt = status === 'cancelled' ? new Date(created.getTime() + 1 * DAY) : null
  const shipped = shippedAt !== null

  const [ord] = await db
    .insert(schema.order)
    .values({
      code: nextCode(),
      buyerId: buyer.id,
      status,
      paymentMethod: orderIdx % 3 === 0 ? 'cod' : 'transfer',
      subtotal,
      shippingFee: 0,
      total: subtotal,
      shipLabel: orderIdx % 2 === 0 ? 'Rumah' : 'Kantor',
      shipName: ship.name,
      shipPhone: ship.phone,
      shipAddress: ship.addr,
      shipCity: ship.city,
      shipPostal: ship.postal,
      notes: daysAgo === 0 && itemCount > 1 ? 'Tolong bubble wrap ekstra ya, makasih 🙏' : null,
      seenBySeller: seen,
      processingAt,
      shippedAt,
      deliveredAt,
      cancelledAt,
      courier: shipped ? COURIERS[orderIdx % COURIERS.length] : null,
      trackingNumber: shipped ? `${COURIERS[orderIdx % COURIERS.length].split(' ')[0].toUpperCase()}${created.getFullYear()}${String(1000 + orderIdx)}` : null,
      createdAt: created,
    })
    .returning()

  await db.insert(schema.orderItem).values(lines.map((l) => ({ ...l, orderId: ord.id })))
  summary[status] = (summary[status] ?? 0) + 1
  orderIdx++
}

/* ------------------------------------------------------------------ */
/* 4. Make the demo buyer's pages look "used"                          */
/* ------------------------------------------------------------------ */
await db.insert(schema.address).values({
  userId: budi.id,
  label: 'Rumah',
  recipient: 'Budi Santoso',
  phone: '081234567811',
  line: 'Jl. Kemang Raya No. 21, RT 03/RW 05, Mampang Prapatan',
  city: 'Jakarta Selatan',
  province: 'DKI Jakarta',
  postalCode: '12730',
  isDefault: true,
})

const FAVS = [3003, 1017, 2001].filter((id) => byId.has(id))
if (FAVS.length) {
  await db.insert(schema.favorite).values(FAVS.map((scentId) => ({ userId: budi.id, scentId })))
}

// A couple of cart items (use a real size each).
const CART: Array<[number, number]> = [[3004, 1], [1001, 0]] // [productId, sizeIndex]
for (const [pid, sizeIdx] of CART) {
  const p = byId.get(pid)
  if (!p) continue
  const sizes = (p.sizes ?? []) as Array<{ ml: number }>
  const size = sizes[Math.min(sizeIdx, sizes.length - 1)]
  if (size) await db.insert(schema.cartItem).values({ userId: budi.id, scentId: pid, ml: size.ml, qty: 2 })
}

/* ------------------------------------------------------------------ */
/* Done                                                                */
/* ------------------------------------------------------------------ */
const unseen = (await db.select().from(schema.order).where(eq(schema.order.seenBySeller, false))).length
console.log('\n✔ Demo data seeded.')
console.log('  Orders by status:', summary)
console.log(`  Unseen (bell) orders: ${unseen}`)
console.log(`  Demo buyer: ${budi.email} — 1 address, ${FAVS.length} favorites, cart prefilled.`)
console.log('  Low stock showcase: Galatea=4, Lady Boss=7.')
process.exit(0)
