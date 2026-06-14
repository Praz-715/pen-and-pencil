import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'
const PID = 3005 // Galatea

const browser = await chromium.launch()

// Seller sets stock = 3
const seller = await browser.newContext()
await seller.request.post(`${BASE}/api/auth/sign-in/email`, { data: { email: 'penjual@penandpencil.id', password: 'penjual123', rememberMe: true } })
await seller.request.put(`${BASE}/api/products/${PID}`, { data: { stock: 3 } })
console.log('seller set Galatea stock = 3')

// Buyer (guest) — detail page
const buyer = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await buyer.newPage()
await page.goto(`${BASE}/products/${PID}/velixir-galatea`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

const stockText = await page.locator('text=Stok tersedia').locator('xpath=following-sibling::span').first().textContent().catch(() => '?')
console.log('detail "Stok tersedia":', stockText?.trim())

// Try to push qty past stock via the + button
const plus = page.locator('button[aria-label="Tambah"]').first()
for (let i = 0; i < 6; i++) await plus.click().catch(() => {})
const qtyDetail = (await page.locator('.tabular-nums').first().textContent())?.trim()
console.log('detail qty after 6× + (cap 3):', qtyDetail, qtyDetail === '3' ? '✅' : '❌')

// Add to cart, then hammer + in the cart
await page.locator('button:has-text("Tambah ke Keranjang")').first().click()
await page.waitForTimeout(400)
await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
const cartPlus = page.locator('button[aria-label="Tambah"]').first()
for (let i = 0; i < 6; i++) await cartPlus.click().catch(() => {})
const qtyCart = (await page.locator('.tabular-nums').first().textContent())?.trim()
const plusDisabled = await cartPlus.isDisabled().catch(() => false)
const warn = (await page.locator('text=Maksimal stok').count()) > 0
console.log('cart qty after 6× + (cap 3):', qtyCart, qtyCart === '3' ? '✅' : '❌')
console.log('cart + disabled at max:', plusDisabled ? '✅' : '❌', '| "Maksimal stok" shown:', warn ? '✅' : '❌')

await buyer.close()

// Reset stock
await seller.request.put(`${BASE}/api/products/${PID}`, { data: { stock: 50 } })
await seller.close()
console.log('reset Galatea stock = 50')

await browser.close()
