/**
 * Seed the 36 initial products into the DB (preserves the original ids).
 * Idempotent: skips if products already exist.
 * Run via `npm run db:seed` (after the seller seed).
 */
import { slugify } from '../app/utils/format'
import { SIZE_TIERS } from '../app/utils/catalog'
import { db, schema } from '../server/utils/db'

type Tier = keyof typeof SIZE_TIERS
type Row = [id: number, name: string, conc: 'EDP' | 'Intens' | null, file: string, tier: Tier, isNew: boolean]

const MANDALIKA: Row[] = [
  [1001, 'Gorgeous Tuberose', 'EDP', 'Gorgeous-Tuberose-EDP', 'edp', false],
  [1002, 'Gorgeous Tuberose', 'Intens', 'Gorgeous-Tuberose-Intens', 'intens', true],
  [1003, 'Holy Sweet', 'EDP', 'Holy-Sweet-EDP', 'edp', false],
  [1004, 'Holy Sweet', 'Intens', 'Holy-Sweet-Intens', 'intens', false],
  [1005, 'Hypnotized', 'EDP', 'Hypnotized-EDP', 'edp', false],
  [1006, 'Lady Boss', 'EDP', 'Lady-Boss-EDP', 'edp', false],
  [1007, 'Morning Grass', 'EDP', 'Morning-Grass-EDP', 'edp', false],
  [1008, 'No. 1', 'EDP', 'No-1-EDP', 'edp', false],
  [1009, 'Only The Brave', 'EDP', 'Only-The_Brave-EDP', 'edp', false],
  [1010, 'Only The Brave', 'Intens', 'Only-The_Brave-Intens', 'intens', false],
  [1011, 'Princess', 'EDP', 'Princess-EDP', 'edp', false],
  [1012, 'Remember Me', 'EDP', 'Remember-Me-EDP', 'edp', false],
  [1013, 'Romantica Exotica', 'EDP', 'Romantica-Exotica-EDP', 'edp', false],
  [1014, 'Sensual Obsession', 'EDP', 'Sensual-Obsession-EDP', 'edp', false],
  [1015, 'Sweet Cherry Rose', 'EDP', 'Sweet-Cherry-Rose-EDP', 'edp', false],
  [1016, 'Vanila Mango', 'EDP', 'Vanila-Mango-EDP', 'edp', false],
  [1017, 'Icon', 'EDP', 'Icon-EDP', 'edp', true],
  [1018, 'Day', 'Intens', 'Day-Intens', 'intens', true],
  [1019, 'Signature', 'EDP', 'Signature-EDP', 'edp', true],
  [1020, '24 Hours', 'EDP', '24-Hours-EDP', 'edp', true],
]
const HMNS: Row[] = [
  [2001, 'Philea', null, 'Philea', 'edp3', true],
  [2002, 'Sore', null, 'Sore', 'edp3', true],
]
const VELIXIR: Row[] = [
  [3001, 'Icarus', null, 'Icarus', 'edp3', true],
  [3002, 'Narcisius', null, 'Narcisius', 'edp3', false],
  [3003, 'Apollo', null, 'Apollo', 'edp3', true],
  [3004, 'Athena', null, 'Athena', 'edp3', true],
  [3005, 'Galatea', null, 'Galatea', 'edp3', false],
  [3006, 'Hera', null, 'Hera', 'edp3', false],
  [3007, 'Ares', null, 'Ares', 'edp3', false],
  [3008, 'Adonis', null, 'Adonis', 'edp3', false],
  [3009, 'Paladin', null, 'Paladin', 'edp3', false],
  [3010, 'Orion', null, 'Orion', 'edp3', false],
  [3011, 'Uranus', null, 'Uranus', 'edp3', false],
  [3012, 'Morpheus', null, 'Morpheus', 'edp3', false],
  [3013, 'Persephone', null, 'Persephone', 'edp3', false],
  [3014, 'Concordia', null, 'Concordia', 'edp3', false],
]

const COLLECTIONS: Array<[string, Row[]]> = [
  ['mandalika', MANDALIKA],
  ['hmns', HMNS],
  ['velixir', VELIXIR],
]

const now = new Date()

const existing = await db.select({ id: schema.product.id }).from(schema.product)
if (existing.length) {
  console.log(`✔ Products already seeded (${existing.length}). Skipping.`)
  process.exit(0)
}

const values = COLLECTIONS.flatMap(([collectionId, rows]) =>
  rows.map(([id, name, conc, file, tier, isNew]) => ({
    id,
    slug: slugify(`${collectionId} ${name} ${conc ?? ''}`),
    name,
    collectionId,
    concentration: conc,
    image: `/img/${collectionId}/${file}.webp`,
    description: null,
    sizes: SIZE_TIERS[tier].map((s) => ({ ml: s.ml, price: s.price, note: s.note })),
    stock: 50,
    isNew,
    active: true,
    createdAt: now,
    updatedAt: now,
  })),
)

await db.insert(schema.product).values(values)
console.log(`✔ Seeded ${values.length} products.`)
process.exit(0)
