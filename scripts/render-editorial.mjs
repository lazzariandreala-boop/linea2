/**
 * Paint the site's editorial images (studio shots of each bag, denim macros,
 * the workbench) into public/editorial/. They are built from the 2D bag
 * renders (run render:bags2d first) and the procedural denim, as consistent
 * placeholders until the atelier's real photos replace them.
 *
 *   node scripts/render-editorial.mjs
 * Uses Playwright's Chromium (set CHROMIUM_PATH to use another binary).
 */
import { build } from 'vite'
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'editorial')

const dist = mkdtempSync(join(tmpdir(), 'linea2-editorial-'))
await build({
  configFile: false,
  logLevel: 'warn',
  build: {
    outDir: dist,
    emptyOutDir: true,
    minify: false,
    lib: { entry: join(ROOT, 'scripts/editorial-images/entry.ts'), formats: ['es'], fileName: () => 'entry.js' },
  },
})
writeFileSync(join(dist, 'index.html'), '<!doctype html><body><script type="module" src="/entry.js"></script>')

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.woff2': 'font/woff2' }
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0])
  const file = path.startsWith('/bags2d/') ? join(ROOT, 'public', path) : join(dist, path === '/' ? 'index.html' : path)
  if (!existsSync(file)) return void res.writeHead(404).end()
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
}).listen(0)

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const page = await browser.newPage()
page.on('pageerror', (e) => console.error('page error:', e.message))
await page.goto(`http://localhost:${server.address().port}/`)
await page.waitForFunction(() => typeof window.renderAll === 'function')
const out = await page.evaluate(() => window.renderAll())
mkdirSync(OUT, { recursive: true })
for (const [name, data] of Object.entries(out)) {
  writeFileSync(join(OUT, `${name}.webp`), Buffer.from(data.split(',')[1], 'base64'))
  console.log(name)
}
await browser.close()
server.close()
