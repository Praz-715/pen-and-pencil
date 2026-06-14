export default defineEventHandler((event) => {
  const siteUrl = useRuntimeConfig(event).public.siteUrl
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `User-agent: *
Allow: /
Disallow: /seller
Disallow: /account
Disallow: /checkout
Disallow: /cart
Disallow: /favorites
Disallow: /api

Sitemap: ${siteUrl}/sitemap.xml
`
})
