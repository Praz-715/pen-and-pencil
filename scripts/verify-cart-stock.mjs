import { chromium } from 'playwright'
const BASE = 'http://localhost:3000'
const PID = 3005
const browser = await chromium.launch()
const seller = await browser.newContext()
await seller.request.post(`${BASE}/api/auth/sign-in/email`, { data: { email: 'penjual@penandpencil.id', password: 'penjual123', rememberMe: true } })

try {
  await seller.request.put(`${BASE}/api/products/${PID}`, { data: { stock: 3 } })
  console.log('stock set = 3')

  const buyer = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await buyer.addInitScript(() => localStorage.setItem('pp:cart', JSON.stringify([{ scentId: 3005, ml: 2, qty: 6 }])))
  const page = await buyer.newPage()
  await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  const qty = (await page.locator('.tabular-nums').first().textContent().catch(() => '?'))?.trim()
  const plus = page.locator('button[aria-label="Tambah"]').first()
  const disabled = await plus.isDisabled().catch(() => null)
  const overWarn = (await page.locator('text=Melebihi stok').count()) > 0
  console.log('cart shows over-stock qty:', qty)
  console.log('+ disabled (qty 6 ≥ stock 3):', disabled === true ? '✅' : '❌')
  console.log('"Melebihi stok" warning:', overWarn ? '✅' : '❌')

  // Checkout should be blocked
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' }) // ensure no leftover; then sign in buyer to reach checkout
  await buyer.request.post(`${BASE}/api/auth/sign-in/email`, { data: { email: 'budi@test.com', password: 'rahasia123', rememberMe: true } })
  await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const placeBtn = page.locator('button:has-text("Buat pesanan")')
  const placeDisabled = await placeBtn.isDisabled().catch(() => null)
  const stockMsg = (await page.locator('text=tidak cukup').count()) > 0
  console.log('checkout "Buat pesanan" disabled:', placeDisabled === true ? '✅' : '❌')
  console.log('checkout shows stock warning:', stockMsg ? '✅' : '❌')
  await buyer.close()
} catch (e) {
  console.log('ERROR', e.message)
} finally {
  await seller.request.put(`${BASE}/api/products/${PID}`, { data: { stock: 50 } })
  console.log('stock reset = 50')
  await seller.close()
  await browser.close()
}
