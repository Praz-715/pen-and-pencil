export default defineEventHandler(async (event) => {
  const siteUrl = useRuntimeConfig(event).public.siteUrl
  const products = await listProductsDb({ activeOnly: true })

  const staticUrls = ['/', '/products', '/about'].map((p) => ({ loc: siteUrl + p }))
  const collectionUrls = [...new Set(products.map((p) => p.collectionId))].map((c) => ({
    loc: `${siteUrl}/products?c=${c}`,
  }))
  const productUrls = products.map((p) => ({
    loc: `${siteUrl}/products/${p.id}/${p.slug}`,
    lastmod: new Date(p.updatedAt).toISOString(),
  }))

  const urls = [...staticUrls, ...collectionUrls, ...productUrls]
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${u.loc.replace(/&/g, '&amp;')}</loc>${'lastmod' in u && u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>`

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return body
})
