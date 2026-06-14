import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const OUT = 'C:/Users/teguh/AppData/Local/Temp/pp-seller'
mkdirSync(OUT, { recursive: true })

async function signIn(ctx, email, password) {
  const r = await ctx.request.post(`${BASE}/api/auth/sign-in/email`, { data: { email, password, rememberMe: true } })
  if (!r.ok()) throw new Error(`sign-in ${email}: ${r.status()}`)
}
async function finalUrl(page, path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(600)
  return new URL(page.url()).pathname + new URL(page.url()).search
}

const browser = await chromium.launch()

// ---- SELLER: buy pages must redirect away ----
const seller = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await signIn(seller, 'penjual@penandpencil.id', 'penjual123')
const sp = await seller.newPage()
const sellerBuyRoutes = ['/cart', '/checkout', '/favorites', '/account/orders', '/account/addresses']
console.log('--- SELLER redirects (expect → /seller) ---')
for (const r of sellerBuyRoutes) {
  const dest = await finalUrl(sp, r)
  const ok = dest.startsWith('/seller')
  console.log(`${ok ? '✅' : '❌'} ${r} → ${dest}`)
}
// Seller can view product detail (preview, no buy)
const det = await finalUrl(sp, '/products/1001/mandalika-gorgeous-tuberose-edp')
console.log(`product detail stays: ${det.startsWith('/products/1001') ? '✅' : '❌'} → ${det}`)
const sellerNav = await sp.$$eval('header nav a', (as) => as.map((a) => a.textContent.trim()))
const cartBtnForSeller = await sp.$('a[aria-label="Tambah ke Keranjang"], button:has-text("Tambah ke Keranjang"):visible')
console.log('seller header nav:', JSON.stringify(sellerNav))
console.log('seller sees "Mode penjual" notice:', (await sp.locator('text=Mode penjual').count()) > 0 ? '✅' : '❌')
await sp.screenshot({ path: `${OUT}/seller-home-nav.png` })
await sp.goto(BASE + '/products/1001/mandalika-gorgeous-tuberose-edp', { waitUntil: 'networkidle' })
await sp.waitForTimeout(700)
await sp.screenshot({ path: `${OUT}/seller-product-detail.png` })
await seller.close()

// ---- BUYER: buy pages stay; nav is shopping ----
const buyer = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await signIn(buyer, 'budi@test.com', 'rahasia123')
const bp = await buyer.newPage()
console.log('\n--- BUYER (expect stays on page) ---')
for (const r of ['/cart', '/checkout', '/account/orders']) {
  const dest = await finalUrl(bp, r)
  console.log(`${dest.startsWith(r) ? '✅' : '❌'} ${r} → ${dest}`)
}
const buyerNav = await bp.$$eval('header nav a', (as) => as.map((a) => a.textContent.trim()))
console.log('buyer header nav:', JSON.stringify(buyerNav))
await buyer.close()

// ---- GUEST: cart/favorites stay (no login forced); checkout → login ----
const guest = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const gp = await guest.newPage()
console.log('\n--- GUEST ---')
console.log(`/cart stays: ${(await finalUrl(gp, '/cart')).startsWith('/cart') ? '✅' : '❌'}`)
console.log(`/favorites stays: ${(await finalUrl(gp, '/favorites')).startsWith('/favorites') ? '✅' : '❌'}`)
const co = await finalUrl(gp, '/checkout')
console.log(`/checkout → login: ${co.startsWith('/login') ? '✅' : '❌'} → ${co}`)
await guest.close()

await browser.close()
console.log(`\nScreenshots → ${OUT}`)
