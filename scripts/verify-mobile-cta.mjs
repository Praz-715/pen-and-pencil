import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const OUT = 'C:/Users/teguh/AppData/Local/Temp/pp-shots'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
await ctx.request.post(`${BASE}/api/auth/sign-in/email`, { data: { email: 'budi@test.com', password: 'rahasia123', rememberMe: true } })
// ensure cart has an item
await ctx.request.post(`${BASE}/api/cart`, { data: { scentId: 3003, ml: 2, qty: 2 } })

const page = await ctx.newPage()

async function check(path, label, ctaText) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  // find a fixed bottom bar containing the CTA text
  const hasFloatingCta = await page.evaluate((txt) => {
    const els = [...document.querySelectorAll('div')]
    return els.some((el) => {
      const cs = getComputedStyle(el)
      if (cs.position !== 'fixed') return false
      const r = el.getBoundingClientRect()
      const nearBottom = Math.abs(r.bottom - window.innerHeight) < 4
      return nearBottom && el.textContent.includes(txt)
    })
  }, ctaText)
  console.log(`${label}: overflow ${overflow}px ${overflow <= 1 ? '✅' : '❌'} | floating "${ctaText}" ${hasFloatingCta ? '✅' : '❌'}`)
  await page.screenshot({ path: `${OUT}/${label}.png` })
}

await check('/cart', 'mobile-cart', 'Checkout')
await check('/checkout', 'mobile-checkout', 'Buat pesanan')

await ctx.close()
await browser.close()
