import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const OUT = 'C:/Users/teguh/AppData/Local/Temp/pp-shots'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
await ctx.request.post(`${BASE}/api/auth/sign-in/email`, { data: { email: 'budi@test.com', password: 'rahasia123', rememberMe: true } })
await ctx.request.post(`${BASE}/api/cart`, { data: { scentId: 3003, ml: 2, qty: 2 } })
await ctx.request.post(`${BASE}/api/cart`, { data: { scentId: 3005, ml: 5, qty: 1 } })
const page = await ctx.newPage()

async function measure(ctaText) {
  return page.evaluate((txt) => {
    const bar = [...document.querySelectorAll('div')].find((el) => {
      const cs = getComputedStyle(el)
      return cs.position === 'sticky' && el.textContent.includes(txt) && el.offsetParent !== null
    })
    const footer = document.querySelector('footer')
    const vh = window.innerHeight
    if (!bar) return { found: false }
    const b = bar.getBoundingClientRect()
    const f = footer?.getBoundingClientRect()
    return {
      found: true,
      barBottom: Math.round(b.bottom),
      vh,
      footerTop: f ? Math.round(f.top) : null,
    }
  }, ctaText)
}

async function check(path, label, ctaText) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // At top: bar should float near the bottom of the viewport
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  const top = await measure(ctaText)
  const floating = top.found && Math.abs(top.barBottom - top.vh) <= 8

  // At bottom: bar should dock ABOVE the footer (no overlap)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(400)
  const bot = await measure(ctaText)
  const docked = bot.found && bot.footerTop !== null && bot.barBottom <= bot.footerTop + 2

  console.log(
    `${label}: float@top ${floating ? '✅' : '❌'} (barBottom ${top.barBottom}/vh ${top.vh}) | docks above footer ${docked ? '✅' : '❌'} (barBottom ${bot.barBottom} ≤ footerTop ${bot.footerTop})`,
  )
  await page.screenshot({ path: `${OUT}/sticky-${label}-bottom.png` })
}

await check('/cart', 'cart', 'Checkout')
await check('/checkout', 'checkout', 'Buat pesanan')
await check('/products/3003/velixir-apollo', 'detail', 'Tambah ke Keranjang')

await ctx.close()
await browser.close()
