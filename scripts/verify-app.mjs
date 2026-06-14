import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const OUT = 'C:/Users/teguh/AppData/Local/Temp/pp-app'
mkdirSync(OUT, { recursive: true })

const VPS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]
const SHOT_VPS = new Set(['mobile', 'desktop'])

let problems = 0

async function checkOverflow(page, vw) {
  return page.evaluate((vw) => {
    const overflow = document.documentElement.scrollWidth - vw
    const offenders = []
    if (overflow > 1) {
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        if (r.right > vw + 1) {
          const cs = getComputedStyle(el)
          if (['auto', 'scroll', 'hidden'].includes(cs.overflowX)) continue
          offenders.push(`<${el.tagName.toLowerCase()} class="${(el.getAttribute('class') || '').slice(0, 70)}">`)
        }
      }
    }
    return { overflow, offenders: offenders.slice(0, 4) }
  }, vw)
}

async function signIn(context, email, password) {
  const res = await context.request.post(`${BASE}/api/auth/sign-in/email`, {
    data: { email, password, rememberMe: true },
  })
  if (!res.ok()) throw new Error(`sign-in failed for ${email}: ${res.status()}`)
}

async function auditRoutes(label, context, routes, { seedCart = false } = {}) {
  if (seedCart) {
    await context.addInitScript(() => {
      localStorage.setItem('pp:cart', JSON.stringify([
        { scentId: 1001, ml: 2, qty: 2 },
        { scentId: 3003, ml: 5, qty: 1 },
      ]))
    })
  }
  for (const vp of VPS) {
    const page = await context.newPage()
    await page.setViewportSize({ width: vp.width, height: vp.height })
    for (const [name, path] of routes) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {})
      await page.waitForTimeout(700)
      const { overflow, offenders } = await checkOverflow(page, vp.width)
      const tag = `${label}:${name} @ ${vp.name}`
      if (overflow > 1) {
        problems++
        console.log(`❌ OVERFLOW ${overflow}px  ${tag}`)
        offenders.forEach((o) => console.log(`     ${o}`))
      } else {
        console.log(`✅ ${tag}`)
      }
      if (SHOT_VPS.has(vp.name)) {
        await page.screenshot({ path: `${OUT}/${label}-${name}-${vp.name}.png`, fullPage: false })
      }
    }
    await page.close()
  }
}

const browser = await chromium.launch()

// Public pages
const pub = await browser.newContext()
await auditRoutes('public', pub, [['login', '/login'], ['signup', '/signup']])
await pub.close()

// Buyer
const buyer = await browser.newContext()
await signIn(buyer, 'budi@test.com', 'rahasia123')
const ordersRes = await buyer.request.get(`${BASE}/api/orders`)
const orders = await ordersRes.json()
const oid = orders[0]?.id
await auditRoutes(
  'buyer',
  buyer,
  [
    ['account', '/account'],
    ['addresses', '/account/addresses'],
    ['orders', '/account/orders'],
    ['order-track', `/account/orders/${oid}`],
    ['checkout', '/checkout'],
  ],
  { seedCart: true },
)
await buyer.close()

// Seller
const seller = await browser.newContext()
await signIn(seller, 'penjual@penandpencil.id', 'penjual123')
const sOrdersRes = await seller.request.get(`${BASE}/api/orders`)
const sOrders = await sOrdersRes.json()
const soid = sOrders[0]?.id
await auditRoutes('seller', seller, [
  ['dashboard', '/seller'],
  ['orders', '/seller/orders'],
  ['fulfillment', `/seller/orders/${soid}`],
])
await seller.close()

await browser.close()
console.log(`\n${problems === 0 ? '🎉 No overflow across auth pages.' : `⚠️  ${problems} overflow case(s).`}`)
console.log(`Screenshots → ${OUT}`)
