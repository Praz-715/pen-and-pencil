import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const OUT = 'C:/Users/teguh/AppData/Local/Temp/pp-products'
mkdirSync(OUT, { recursive: true })

const VPS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]
const SHOT = new Set(['mobile', 'desktop'])

async function checkOverflow(page, vw) {
  return page.evaluate((vw) => {
    const overflow = document.documentElement.scrollWidth - vw
    const off = []
    if (overflow > 1) {
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        if (r.right > vw + 1) {
          const cs = getComputedStyle(el)
          if (['auto', 'scroll', 'hidden'].includes(cs.overflowX)) continue
          off.push(`<${el.tagName.toLowerCase()} class="${(el.getAttribute('class') || '').slice(0, 70)}">`)
        }
      }
    }
    return { overflow, off: off.slice(0, 4) }
  }, vw)
}

const browser = await chromium.launch()
const ctx = await browser.newContext()
await ctx.request.post(`${BASE}/api/auth/sign-in/email`, { data: { email: 'penjual@penandpencil.id', password: 'penjual123', rememberMe: true } })

const routes = [
  ['products-list', '/seller/products'],
  ['product-new', '/seller/products/new'],
  ['product-edit', '/seller/products/3001'],
]
let problems = 0
for (const vp of VPS) {
  const page = await ctx.newPage()
  await page.setViewportSize({ width: vp.width, height: vp.height })
  for (const [name, path] of routes) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {})
    await page.waitForTimeout(700)
    const { overflow, off } = await checkOverflow(page, vp.width)
    const tag = `${name} @ ${vp.name}`
    if (overflow > 1) {
      problems++
      console.log(`❌ OVERFLOW ${overflow}px ${tag}`)
      off.forEach((o) => console.log('   ', o))
    } else console.log(`✅ ${tag}`)
    if (SHOT.has(vp.name)) await page.screenshot({ path: `${OUT}/${name}-${vp.name}.png`, fullPage: false })
  }
  await page.close()
}
await ctx.close()
await browser.close()
console.log(`\n${problems ? `⚠️ ${problems} overflow` : '🎉 no overflow on seller product pages'} · shots → ${OUT}`)
