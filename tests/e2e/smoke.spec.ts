import { test, expect, type Page } from '@playwright/test'

/** Collect console errors + uncaught page errors while a body runs. */
async function withErrorTracking(page: Page, run: () => Promise<void>) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))
  await run()
  return errors
}

const ROUTES = ['/', '/shop', '/customize', '/editorial', '/studio', '/accessories', '/bags', '/tiktok', '/tutorials']

for (const route of ROUTES) {
  test(`loads ${route} without console errors and renders content`, async ({ page }) => {
    const errors = await withErrorTracking(page, async () => {
      await page.goto(route, { waitUntil: 'networkidle' })
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('h1')).toBeVisible()
    })
    expect(errors, `console errors on ${route}:\n${errors.join('\n')}`).toEqual([])
  })
}

test('home hero renders an eager LCP image', async ({ page }) => {
  await page.goto('/')
  const hero = page.locator('img[fetchpriority="high"]').first()
  await expect(hero).toBeVisible()
  // Explicit dimensions => no layout shift.
  await expect(hero).toHaveAttribute('width', /\d+/)
  await expect(hero).toHaveAttribute('height', /\d+/)
})

test('catalog grid renders product cards linking to detail pages', async ({ page }) => {
  await page.goto('/accessories')
  const cards = page.locator('a[href^="/products/"]')
  expect(await cards.count()).toBeGreaterThan(0)
})

test('a product detail page renders gallery + CTA', async ({ page }) => {
  await page.goto('/products/foulard-seta-aurora')
  await expect(page.locator('h1')).toContainText('Foulard')
  await expect(page.locator('img').first()).toBeVisible()
  // CTA resolves to a wa.me link.
  await expect(page.locator('a[href^="https://wa.me/"]').first()).toBeVisible()
})

test('TikTok facade does NOT load embed.js until interaction', async ({ page }) => {
  const embedRequests: string[] = []
  page.on('request', (req) => {
    if (req.url().includes('tiktok.com/embed.js')) embedRequests.push(req.url())
  })

  await page.goto('/tiktok', { waitUntil: 'networkidle' })
  // Facade visible, embed.js NOT requested yet.
  const play = page.getByRole('button', { name: /Tocca per riprodurre/ }).first()
  await expect(play).toBeVisible()
  expect(embedRequests, 'embed.js must not load before interaction').toHaveLength(0)

  // Tap-to-play -> embed.js is requested. Arm the wait concurrently with the
  // click so we don't miss the request the click itself fires.
  const [embedReq] = await Promise.all([
    page.waitForRequest(/tiktok\.com\/embed\.js/, { timeout: 8_000 }),
    play.click(),
  ])
  expect(embedReq.url()).toContain('tiktok.com/embed.js')
})

test('customize: picking options updates the price and adds the bag to the cart', async ({ page }) => {
  await page.goto('/customize')
  const price = page.locator('.price')
  await expect(price).toHaveText('€410.00')
  await page.getByRole('button', { name: /Street Art/ }).click()
  await expect(price).toHaveText('€415.00')
  await page.getByRole('button', { name: 'ADD TO BAG' }).click()
  await expect(page.getByRole('link', { name: /Carrello \(1\)/ })).toBeVisible()
})
