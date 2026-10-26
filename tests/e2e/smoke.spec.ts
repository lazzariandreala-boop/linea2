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

test('TikTok videos autoplay in the official player, without embed.js', async ({ page }) => {
  const embedRequests: string[] = []
  page.on('request', (req) => {
    if (req.url().includes('tiktok.com/embed.js')) embedRequests.push(req.url())
  })

  await page.goto('/tiktok', { waitUntil: 'domcontentloaded' })
  // The first video's player mounts by itself once it is on screen: muted
  // autoplay in TikTok's player iframe, no tap and no embed.js needed.
  const player = page.locator('iframe[src*="tiktok.com/player/v1/"]').first()
  await expect(player).toBeAttached({ timeout: 8_000 })
  await expect(player).toHaveAttribute('src', /autoplay=1/)
  await expect(player).toHaveAttribute('src', /loop=1/)
  expect(embedRequests, 'video cards must not need embed.js').toHaveLength(0)
})

test('customize: picking options updates the price and adds the bag to the cart', async ({ page }) => {
  await page.goto('/customize')
  const price = page.locator('.price')
  await expect(price).toHaveText('€410.00')
  // Step through: model → wash → lining → patches.
  await page.getByRole('button', { name: 'Avanti →' }).click()
  await page.getByRole('button', { name: 'Avanti →' }).click()
  await page.getByRole('button', { name: 'Avanti →' }).click()
  await expect(page.getByRole('heading', { name: 'Toppe patchwork' })).toBeVisible()
  await page.getByRole('button', { name: /Street Art/ }).click()
  await expect(price).toHaveText('€415.00')
  // Every extra patch is priced on its own (Organic Patterns, +€25).
  await page.getByRole('button', { name: '+ Aggiungi una toppa' }).click()
  await expect(price).toHaveText('€440.00')
  await page.getByRole('button', { name: 'Rimuovi toppa 2' }).click()
  await expect(price).toHaveText('€415.00')
  // The last step sums everything up, line by line.
  await page.getByRole('button', { name: /7\. Riepilogo/ }).click()
  await expect(page.getByRole('heading', { name: 'Riepilogo' })).toBeVisible()
  await expect(page.locator('.recap')).toContainText('Street Art')
  await page.getByRole('button', { name: 'Aggiungi al carrello' }).click()
  await expect(page.getByRole('link', { name: /Carrello \(1\)/ })).toBeVisible()
})

test('customize: the bag is 2D, decals drag, lining opens the inside, 3D only on request', async ({ page }) => {
  const glb: string[] = []
  page.on('request', (r) => {
    if (r.url().endsWith('.glb')) glb.push(r.url())
  })
  await page.goto('/customize?model=stella', { waitUntil: 'networkidle' })
  await expect(page.locator('.bag2d img.layer').first()).toHaveAttribute('src', /\/bags2d\/stella\/front-body-indigo\.webp$/)

  const mono = page.locator('.decal.mono')
  const before = await mono.boundingBox()
  await mono.hover()
  await page.mouse.down()
  await page.mouse.move(before!.x + before!.width / 2 + 40, before!.y + before!.height / 2 + 30, { steps: 6 })
  await page.mouse.up()
  const after = await mono.boundingBox()
  expect(after!.x).toBeGreaterThan(before!.x + 20)

  await page.getByRole('button', { name: /3\. Fodera/ }).click()
  await page.getByRole('button', { name: 'Plain Navy' }).click()
  await expect(page.locator('.bag2d img.layer').first()).toHaveAttribute('src', /top-indigo-/)

  expect(glb).toEqual([])
  await page.getByRole('button', { name: 'Vedi in 3D' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect.poll(() => glb.length).toBeGreaterThan(0)
})
