import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const OUT = process.env.OUT || 'C:/Users/teguh/AppData/Local/Temp/pp-audit'
mkdirSync(OUT, { recursive: true })

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tabletwide', width: 1024, height: 1366 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
]

const routes = [
  ['home', '/'],
  ['products', '/products'],
  ['products-mandalika', '/products?c=mandalika'],
  ['detail-mandalika', '/products/1001/mandalika-gorgeous-tuberose-edp'],
  ['detail-velixir', '/products/3003/velixir-apollo'],
  ['favorites', '/favorites'],
  ['cart', '/cart'],
  ['about', '/about'],
  ['account', '/account'],
]

const browser = await chromium.launch()
let problems = 0

for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  for (const [label, path] of routes) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {})
    await page.waitForTimeout(500)

    const report = await page.evaluate((vw) => {
      const docW = document.documentElement.scrollWidth
      const overflow = docW - vw
      const offenders = []
      if (overflow > 1) {
        const all = document.body.querySelectorAll('*')
        for (const el of all) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          // element extends past right edge of viewport
          if (r.right > vw + 1) {
            const cs = getComputedStyle(el)
            // skip elements that legitimately scroll internally
            if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden') continue
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.getAttribute('class') || '').slice(0, 90),
              right: Math.round(r.right),
              width: Math.round(r.width),
            })
          }
        }
      }
      return { docW, overflow, offenders: offenders.slice(0, 6) }
    }, vp.width)

    const tag = `${label} @ ${vp.name}(${vp.width})`
    if (report.overflow > 1) {
      problems++
      console.log(`\n❌ OVERFLOW ${report.overflow}px  ${tag}  scrollW=${report.docW}`)
      for (const o of report.offenders) console.log(`     <${o.tag} class="${o.cls}"> right=${o.right} w=${o.width}`)
      await page.screenshot({ path: `${OUT}/FAIL-${label}-${vp.name}.png`, fullPage: false })
    } else {
      console.log(`✅ ${tag}`)
    }
  }
  await ctx.close()
}

await browser.close()
console.log(`\n${problems === 0 ? '🎉 No horizontal overflow on any page/viewport.' : `⚠️  ${problems} overflow case(s) found.`}`)
