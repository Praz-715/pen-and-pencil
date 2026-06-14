/**
 * Pre-generate static OG share cards (1200×630 JPEG) for every active product.
 *
 * Why static: sharp's native binary won't load in Vercel's serverless runtime
 * (its platform binary is loaded via a computed require that @vercel/nft can't
 * trace). Generating locally — where sharp works — and committing the JPEGs to
 * public/og/<id>.jpg means Vercel serves them as plain static files (no runtime
 * sharp), so link shares show the real product card. The dynamic route at
 * server/routes/og/[id].get.ts stays as a graceful fallback for any product
 * without a pre-generated card.
 *
 * Run:  npm run og:gen      (after db:seed / adding products)
 * Then commit public/og/*.jpg.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { eq } from 'drizzle-orm'
import { getCollection } from '../app/utils/catalog'
import { formatRupiah } from '../app/utils/format'
import { db, schema } from '../server/utils/db'

const W = 1200
const H = 630
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const outDir = join(process.cwd(), 'public', 'og')
await mkdir(outDir, { recursive: true })

const products = await db.select().from(schema.product).where(eq(schema.product.active, true))
let ok = 0
let skipped = 0

for (const product of products) {
  try {
    // Load source image (local public/ file, or remote URL for uploads).
    let srcBuf: Buffer
    if (product.image.startsWith('http')) {
      srcBuf = Buffer.from(await (await fetch(product.image)).arrayBuffer())
    } else {
      srcBuf = await readFile(join(process.cwd(), 'public', product.image))
    }

    const imgBuf = await sharp(srcBuf)
      .resize({ width: 430, height: 380, fit: 'inside', withoutEnlargement: true })
      .toBuffer()
    const m = await sharp(imgBuf).metadata()
    const iw = m.width ?? 430
    const ih = m.height ?? 380

    const sizes = (product.sizes ?? []) as Array<{ price: number }>
    const name = product.concentration ? `${product.name} ${product.concentration}` : product.name
    const shortName = name.length > 30 ? `${name.slice(0, 29)}…` : name
    const col = getCollection(product.collectionId).shortName
    const fromPrice = sizes.length ? Math.min(...sizes.map((s) => s.price)) : 0

    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="478" width="${W}" height="152" fill="#0b0b0c"/>
      <text x="64" y="524" font-family="Georgia, 'Times New Roman', serif" font-size="20" letter-spacing="5" fill="#9a9a9d">PEN &amp; PENCIL · DECANT &amp; TESTER PARFUM</text>
      <text x="64" y="578" font-family="Georgia, 'Times New Roman', serif" font-size="46" font-weight="700" fill="#ffffff">${esc(shortName)}</text>
      <text x="64" y="612" font-family="Arial, sans-serif" font-size="24" fill="#9a9a9d">${esc(col)} · Mulai ${esc(formatRupiah(fromPrice))}</text>
    </svg>`

    const card = await sharp({
      create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    })
      .composite([
        { input: imgBuf, top: Math.round((478 - ih) / 2), left: Math.round((W - iw) / 2) },
        { input: Buffer.from(svg), top: 0, left: 0 },
      ])
      .jpeg({ quality: 84 })
      .toBuffer()

    await writeFile(join(outDir, `${product.id}.jpg`), card)
    ok++
  } catch (e) {
    skipped++
    console.warn(`  ⚠ skipped ${product.id} ${product.name}:`, (e as Error).message)
  }
}

console.log(`\n✔ Generated ${ok} OG card(s) → public/og/  (skipped ${skipped})`)
process.exit(0)
