import { getCollection } from '~~/app/utils/catalog'
import { formatRupiah } from '~~/app/utils/format'

const W = 1200
const H = 630

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// 1200×630 JPEG share card: product on white + black footer (brand · name · price).
// WhatsApp/Facebook-friendly (JPEG, not webp). URL: /og/<id>.jpg
export default defineEventHandler(async (event) => {
  const raw = String(getRouterParam(event, 'id') ?? '').replace(/\.jpe?g$/i, '')
  const id = Number(raw)
  const siteUrl = useRuntimeConfig(event).public.siteUrl as string

  try {
    const { default: sharp } = await import('sharp')
    const product = Number.isFinite(id) ? await getProductDb(id) : undefined
    if (!product) return sendRedirect(event, '/og-cover.jpg', 302)

    const src = product.image.startsWith('http') ? product.image : `${siteUrl}${product.image}`
    const srcBuf = Buffer.from(await $fetch<ArrayBuffer>(src, { responseType: 'arrayBuffer' }))

    // Product image centered in the upper area (above the footer)
    const img = sharp(srcBuf).resize({ width: 430, height: 380, fit: 'inside', withoutEnlargement: true })
    const imgBuf = await img.toBuffer()
    const m = await sharp(imgBuf).metadata()
    const iw = m.width ?? 430
    const ih = m.height ?? 380

    const name = product.concentration ? `${product.name} ${product.concentration}` : product.name
    const shortName = name.length > 30 ? `${name.slice(0, 29)}…` : name
    const col = getCollection(product.collectionId).shortName
    const fromPrice = product.sizes?.length ? Math.min(...product.sizes.map((s) => s.price)) : 0

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

    setHeader(event, 'content-type', 'image/jpeg')
    setHeader(event, 'cache-control', 'public, max-age=86400')
    return card
  } catch {
    return sendRedirect(event, '/og-cover.jpg', 302)
  }
})
