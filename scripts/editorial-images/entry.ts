/**
 * Browser side of scripts/render-editorial.mjs: paints the site's editorial
 * imagery (studio shots of the bags, denim macros, the workbench) from the
 * 2D bag renders and the procedural denim. Placeholders in a consistent
 * "studio photography" look until the atelier's real photos arrive.
 */
import { BAGS, WASH, findBag, findOption } from '../../app/utils/stella/options'
import { denim, denimSpec, rng } from '../../app/utils/stella/textures'

type Ctx = CanvasRenderingContext2D
const THREAD = '#C9A04A'

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}
const ctx = (c: HTMLCanvasElement) => c.getContext('2d')!

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`missing ${src}`))
    img.src = src
  })
}

/** Denim of a given wash as a fill, `scale` px per weave tile, grain turned. */
function denimFill(g: Ctx, washId: string, scale: number, angle = 0): CanvasPattern {
  const pat = g.createPattern(denim(denimSpec(findOption(WASH, washId)), 512, 3).map, 'repeat')!
  pat.setTransform(new DOMMatrix().rotate(angle).scale(scale / 512))
  return pat
}

/** Fine grain noise over the whole canvas (film/paper feel). */
function grain(g: Ctx, w: number, h: number, amount = 10, seed = 1) {
  const r = rng(seed)
  const img = g.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  g.putImageData(img, 0, 0)
}

/** Warm ivory studio: lit wall, linen table, soft light from the left. */
function studio(g: Ctx, w: number, h: number, horizon = 0.72) {
  const wall = g.createLinearGradient(0, 0, 0, h * horizon)
  wall.addColorStop(0, '#E9E1D2')
  wall.addColorStop(1, '#F2ECE1')
  g.fillStyle = wall
  g.fillRect(0, 0, w, h * horizon)
  const table = g.createLinearGradient(0, h * horizon, 0, h)
  table.addColorStop(0, '#E4DACA')
  table.addColorStop(1, '#D8CCB8')
  g.fillStyle = table
  g.fillRect(0, h * horizon, w, h * (1 - horizon))
  // Linen weave on the table.
  const r = rng(5)
  g.globalAlpha = 0.07
  for (let y = h * horizon; y < h; y += 3) {
    g.fillStyle = r() > 0.5 ? '#ffffff' : '#8a7a62'
    g.fillRect(0, y, w, 1)
  }
  g.globalAlpha = 1
  // Soft horizon.
  const hz = g.createLinearGradient(0, h * horizon - 30, 0, h * horizon + 30)
  hz.addColorStop(0, 'rgba(242,236,225,0)')
  hz.addColorStop(0.5, 'rgba(200,186,164,0.35)')
  hz.addColorStop(1, 'rgba(228,218,202,0)')
  g.fillStyle = hz
  g.fillRect(0, h * horizon - 30, w, 60)
  // Window light from the upper left, falloff to the right.
  const light = g.createRadialGradient(w * 0.15, h * 0.1, 0, w * 0.15, h * 0.1, w * 1.1)
  light.addColorStop(0, 'rgba(255,250,240,0.55)')
  light.addColorStop(1, 'rgba(120,100,70,0.18)')
  g.fillStyle = light
  g.fillRect(0, 0, w, h)
}

/** Bag layers (front) for a model in the given washes and hardware. */
async function bagLayers(id: string, wash: string, accent: string, hw: string) {
  const b = findBag(id)
  const d = `/bags2d/${b.id}`
  const files = b.kind === 'parts'
    ? [`${d}/front-body-${wash}.webp`, `${d}/front-accent-${accent}.webp`, `${d}/front-hw-${hw}.webp`]
    : [`${d}/front-all-${wash}.webp`]
  return Promise.all(files.map(loadImg))
}

/** Bounding box of the opaque pixels of an image. */
function alphaBox(img: HTMLImageElement) {
  const c = canvas(img.width, img.height)
  const g = ctx(c)
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, c.width, c.height).data
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0
  for (let y = 0; y < c.height; y += 2) {
    for (let x = 0; x < c.width; x += 2) {
      if (d[(y * c.width + x) * 4 + 3]! > 20) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  return { x0, y0, x1, y1 }
}

/** The bag alone (transparent), cropped to its silhouette. */
async function bagCutout(id: string, wash: string, accent: string, hw: string) {
  const layers = await bagLayers(id, wash, accent, hw)
  const S = layers[0]!.width
  const all = canvas(S, S)
  const g = ctx(all)
  for (const l of layers) g.drawImage(l, 0, 0)
  const box = alphaBox(all as unknown as HTMLImageElement)
  return { img: all, box }
}

/** Studio shot of a bag resting on the table. */
async function bagShot(id: string, w: number, h: number, o: { wash?: string; accent?: string; hw?: string; fill?: number; x?: number } = {}) {
  const { img, box } = await bagCutout(id, o.wash ?? 'indigo', o.accent ?? o.wash ?? 'indigo', o.hw ?? 'brass')
  const c = canvas(w, h)
  const g = ctx(c)
  const horizon = 0.7
  studio(g, w, h, horizon)
  const bw = box.x1 - box.x0
  const bh = box.y1 - box.y0
  const scale = Math.min((h * (o.fill ?? 0.74)) / bh, (w * 0.82) / bw)
  const dw = bw * scale
  const dh = bh * scale
  const cx = w * (o.x ?? 0.5)
  const floor = h * 0.9
  // Contact shadow and a long soft one cast to the right.
  g.save()
  g.filter = 'blur(18px)'
  g.fillStyle = 'rgba(60,45,25,0.38)'
  g.beginPath()
  g.ellipse(cx, floor, dw * 0.42, dh * 0.035, 0, 0, 7)
  g.fill()
  g.filter = 'blur(40px)'
  g.fillStyle = 'rgba(60,45,25,0.18)'
  g.beginPath()
  g.ellipse(cx + dw * 0.25, floor - dh * 0.02, dw * 0.55, dh * 0.08, 0, 0, 7)
  g.fill()
  g.restore()
  g.drawImage(img, box.x0, box.y0, bw, bh, cx - dw / 2, floor - dh, dw, dh)
  // Warm grade over everything, then grain.
  g.globalCompositeOperation = 'soft-light'
  g.fillStyle = 'rgba(255,214,150,0.18)'
  g.fillRect(0, 0, w, h)
  g.globalCompositeOperation = 'source-over'
  grain(g, w, h, 8, 3)
  return c.toDataURL('image/webp', 0.86)
}

/** A transparent bag for the dark denim section. */
async function bagAlone(id: string, size: number, wash: string, accent: string) {
  const { img, box } = await bagCutout(id, wash, accent, 'brass')
  const c = canvas(size, size)
  const g = ctx(c)
  const bw = box.x1 - box.x0
  const bh = box.y1 - box.y0
  const scale = Math.min((size * 0.92) / bw, (size * 0.92) / bh)
  const dw = bw * scale
  const dh = bh * scale
  g.save()
  g.filter = 'blur(26px)'
  g.fillStyle = 'rgba(0,0,0,0.5)'
  g.beginPath()
  g.ellipse(size / 2, size / 2 + dh / 2 - 6, dw * 0.4, 18, 0, 0, 7)
  g.fill()
  g.restore()
  g.drawImage(img, box.x0, box.y0, bw, bh, (size - dw) / 2, (size - dh) / 2, dw, dh)
  return c.toDataURL('image/webp', 0.88)
}

/** Raised seam: a fold shadow under, a highlight over, along a path. */
function seamRidge(g: Ctx, path: Path2D, width: number) {
  g.save()
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.strokeStyle = 'rgba(0,0,0,0.45)'
  g.lineWidth = width
  g.filter = 'blur(6px)'
  g.translate(0, width * 0.25)
  g.stroke(path)
  g.restore()
  g.save()
  g.strokeStyle = 'rgba(255,255,255,0.12)'
  g.lineWidth = width * 0.35
  g.filter = 'blur(3px)'
  g.translate(0, -width * 0.15)
  g.stroke(path)
  g.restore()
}

/** Topstitch: thread dashes with their own little shadows. */
function topstitch(g: Ctx, path: Path2D, scale = 1) {
  g.save()
  g.lineCap = 'round'
  g.setLineDash([16 * scale, 9 * scale])
  g.strokeStyle = 'rgba(0,0,0,0.55)'
  g.lineWidth = 4.2 * scale
  g.translate(1.2 * scale, 2 * scale)
  g.stroke(path)
  g.restore()
  g.save()
  g.lineCap = 'round'
  g.setLineDash([16 * scale, 9 * scale])
  const grad = g.createLinearGradient(0, 0, 0, 2000)
  grad.addColorStop(0, '#E2BE6A')
  grad.addColorStop(1, THREAD)
  g.strokeStyle = grad
  g.lineWidth = 3.4 * scale
  g.stroke(path)
  g.strokeStyle = 'rgba(255,240,200,0.5)'
  g.lineWidth = 1 * scale
  g.translate(-0.6 * scale, -0.8 * scale)
  g.stroke(path)
  g.restore()
}

/** Light vignette + grain to finish a macro. */
function finish(g: Ctx, w: number, h: number) {
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.45)')
  g.fillStyle = v
  g.fillRect(0, 0, w, h)
  grain(g, w, h, 10, 9)
}

/** Macro: a felled seam with two rows of brass topstitching. */
function macroSeam(w: number, h: number) {
  const c = canvas(w, h)
  const g = ctx(c)
  g.fillStyle = denimFill(g, 'raw', 380, -32)
  g.fillRect(0, 0, w, h)
  // Lower panel slightly darker, as a separate piece.
  const lower = new Path2D()
  lower.moveTo(0, h * 0.62)
  lower.bezierCurveTo(w * 0.35, h * 0.5, w * 0.7, h * 0.42, w, h * 0.3)
  lower.lineTo(w, h)
  lower.lineTo(0, h)
  lower.closePath()
  g.save()
  g.clip(lower)
  g.fillStyle = denimFill(g, 'indigo', 380, -18)
  g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(0,0,0,0.12)'
  g.fillRect(0, 0, w, h)
  g.restore()
  const seam = new Path2D()
  seam.moveTo(-20, h * 0.62)
  seam.bezierCurveTo(w * 0.35, h * 0.5, w * 0.7, h * 0.42, w + 20, h * 0.3)
  seamRidge(g, seam, 46)
  const off = (d: number) => {
    const p = new Path2D()
    p.moveTo(-20, h * 0.62 + d)
    p.bezierCurveTo(w * 0.35, h * 0.5 + d, w * 0.7, h * 0.42 + d, w + 20, h * 0.3 + d)
    return p
  }
  topstitch(g, off(18), 1.3)
  topstitch(g, off(44), 1.3)
  topstitch(g, off(-30), 1.3)
  finish(g, w, h)
  return c.toDataURL('image/webp', 0.86)
}

/** Macro: patchwork of different washes meeting at stitched seams. */
function macroPatchwork(w: number, h: number) {
  const c = canvas(w, h)
  const g = ctx(c)
  const pieces: { pts: [number, number][]; wash: string; a: number }[] = [
    { pts: [[0, 0], [w * 0.46, 0], [w * 0.4, h * 0.55], [0, h * 0.62]], wash: 'raw', a: -28 },
    { pts: [[w * 0.46, 0], [w, 0], [w, h * 0.42], [w * 0.43, h * 0.5]], wash: 'vintage', a: 10 },
    { pts: [[0, h * 0.62], [w * 0.4, h * 0.55], [w * 0.62, h], [0, h]], wash: 'indigo', a: 60 },
    { pts: [[w * 0.4, h * 0.55], [w * 0.43, h * 0.5], [w, h * 0.42], [w, h], [w * 0.62, h]], wash: 'stone', a: -50 },
  ]
  for (const p of pieces) {
    const path = new Path2D()
    p.pts.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)))
    path.closePath()
    g.save()
    g.clip(path)
    g.fillStyle = denimFill(g, p.wash, 140, p.a)
    g.fillRect(0, 0, w, h)
    g.restore()
  }
  const seams: [number, number][][] = [
    [[w * 0.46, -10], [w * 0.4, h * 0.55], [w * 0.62, h + 10]],
    [[-10, h * 0.62], [w * 0.4, h * 0.55], [w * 0.43, h * 0.5], [w + 10, h * 0.42]],
  ]
  for (const s of seams) {
    const p = new Path2D()
    s.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)))
    seamRidge(g, p, 34)
    g.save()
    g.translate(10, 8)
    topstitch(g, p, 1.1)
    g.restore()
    g.save()
    g.translate(-12, -10)
    topstitch(g, p, 1.1)
    g.restore()
  }
  finish(g, w, h)
  return c.toDataURL('image/webp', 0.86)
}

/** Macro: brass ring holding a denim strap tab. */
function macroBrass(w: number, h: number) {
  const c = canvas(w, h)
  const g = ctx(c)
  g.fillStyle = denimFill(g, 'raw', 380, -30)
  g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(0,0,0,0.25)'
  g.fillRect(0, 0, w, h)
  const cx = w * 0.56
  const cy = h * 0.42
  const R = h * 0.3
  // Strap tab coming up from the bottom, through the ring.
  const tab = new Path2D()
  tab.roundRect(cx - R * 0.55, cy + R * 0.25, R * 1.1, h, 14)
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.6)'
  g.shadowBlur = 30
  g.shadowOffsetY = 10
  g.fillStyle = denimFill(g, 'indigo', 380, 0)
  g.fill(tab)
  g.restore()
  const edge = new Path2D()
  edge.roundRect(cx - R * 0.45, cy + R * 0.35, R * 0.9, h, 10)
  topstitch(g, edge, 1.1)
  // The ring: metal gradient, inner shadow, highlight.
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.65)'
  g.shadowBlur = 34
  g.shadowOffsetY = 16
  const metal = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
  metal.addColorStop(0, '#F6E3A8')
  metal.addColorStop(0.3, '#C9A04A')
  metal.addColorStop(0.55, '#7A5A22')
  metal.addColorStop(0.75, '#D8B565')
  metal.addColorStop(1, '#5E4318')
  g.strokeStyle = metal
  g.lineWidth = R * 0.22
  g.beginPath()
  g.ellipse(cx, cy, R, R * 0.9, -0.2, 0, Math.PI * 2)
  g.stroke()
  g.restore()
  g.strokeStyle = 'rgba(255,248,220,0.55)'
  g.lineWidth = R * 0.04
  g.beginPath()
  g.ellipse(cx, cy, R * 1.04, R * 0.94, -0.2, Math.PI * 1.05, Math.PI * 1.6)
  g.stroke()
  // The tab folds over the front of the ring at the bottom.
  g.save()
  g.beginPath()
  g.rect(0, cy + R * 0.7, w, h)
  g.clip()
  g.fillStyle = denimFill(g, 'indigo', 380, 0)
  g.fill(tab)
  g.restore()
  // A small leather "LINEA 2" label on the strap.
  const lx = cx - R * 0.42
  const ly = cy + R * 1.15
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.5)'
  g.shadowBlur = 12
  g.fillStyle = '#B9874F'
  g.beginPath()
  g.roundRect(lx, ly, R * 0.84, R * 0.4, 8)
  g.fill()
  g.restore()
  g.strokeStyle = 'rgba(90,55,25,0.8)'
  g.setLineDash([7, 5])
  g.lineWidth = 2
  g.strokeRect(lx + 8, ly + 8, R * 0.84 - 16, R * 0.4 - 16)
  g.setLineDash([])
  g.fillStyle = '#5A3418'
  g.font = `600 ${Math.round(R * 0.15)}px "Newsreader Variable", Georgia, serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('L I N E A  2', lx + R * 0.42, ly + R * 0.2)
  finish(g, w, h)
  return c.toDataURL('image/webp', 0.86)
}

/** Workbench seen from above: green cutting mat, denim pieces, thread. */
function workbench(w: number, h: number) {
  const c = canvas(w, h)
  const g = ctx(c)
  g.fillStyle = '#2F5B4B'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = 'rgba(220,235,200,0.35)'
  g.lineWidth = 1.2
  for (let x = 0; x < w; x += 36) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, h)
    g.stroke()
  }
  for (let y = 0; y < h; y += 36) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(w, y)
    g.stroke()
  }
  g.strokeStyle = 'rgba(240,212,95,0.45)'
  g.lineWidth = 2
  for (let x = 0; x < w; x += 180) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, h)
    g.stroke()
  }
  const piece = (x: number, y: number, pw: number, ph: number, rot: number, wash: string, hole = false) => {
    g.save()
    g.translate(x, y)
    g.rotate(rot)
    const p = new Path2D()
    p.roundRect(-pw / 2, -ph / 2, pw, ph, 18)
    if (hole) p.ellipse(0, -ph * 0.08, pw * 0.22, ph * 0.18, 0, 0, Math.PI * 2)
    g.shadowColor = 'rgba(0,0,0,0.5)'
    g.shadowBlur = 24
    g.shadowOffsetY = 10
    g.fillStyle = denimFill(g, wash, 120, 20)
    g.fill(p, 'evenodd')
    g.shadowColor = 'transparent'
    const e = new Path2D()
    e.roundRect(-pw / 2 + 16, -ph / 2 + 16, pw - 32, ph - 32, 12)
    topstitch(g, e, 0.9)
    g.restore()
  }
  piece(w * 0.3, h * 0.48, w * 0.36, h * 0.66, -0.12, 'indigo', true)
  piece(w * 0.68, h * 0.36, w * 0.3, h * 0.42, 0.18, 'vintage')
  piece(w * 0.72, h * 0.78, w * 0.26, h * 0.3, -0.3, 'raw')
  // Thread spool.
  const sx = w * 0.9
  const sy = h * 0.16
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.5)'
  g.shadowBlur = 20
  g.shadowOffsetY = 8
  const spool = g.createRadialGradient(sx - 10, sy - 10, 4, sx, sy, 60)
  spool.addColorStop(0, '#F3D88A')
  spool.addColorStop(1, '#A8802E')
  g.fillStyle = spool
  g.beginPath()
  g.arc(sx, sy, 58, 0, Math.PI * 2)
  g.fill()
  g.restore()
  g.strokeStyle = 'rgba(120,85,30,0.5)'
  for (let r = 22; r < 58; r += 5) {
    g.beginPath()
    g.arc(sx, sy, r, 0, Math.PI * 2)
    g.stroke()
  }
  g.fillStyle = '#E9E1D2'
  g.beginPath()
  g.arc(sx, sy, 16, 0, Math.PI * 2)
  g.fill()
  // Window light.
  const light = g.createLinearGradient(0, 0, w, h)
  light.addColorStop(0, 'rgba(255,240,210,0.22)')
  light.addColorStop(1, 'rgba(0,0,0,0.3)')
  g.fillStyle = light
  g.fillRect(0, 0, w, h)
  grain(g, w, h, 10, 4)
  return c.toDataURL('image/webp', 0.86)
}

async function renderAll() {
  const out: Record<string, string> = {}
  out['hero-stella'] = await bagShot('stella', 1400, 1500, { wash: 'indigo', accent: 'vintage', fill: 0.8 })
  for (const b of BAGS) out[`bag-${b.id}`] = await bagShot(b.id, 900, 1080, { wash: 'indigo', accent: 'vintage', fill: 0.7 })
  out['bag-stella-dark'] = await bagAlone('stella', 1200, 'indigo', 'vintage')
  out['detail-seam'] = macroSeam(1200, 800)
  out['detail-patchwork'] = macroPatchwork(1200, 800)
  out['detail-brass'] = macroBrass(1200, 800)
  out['workbench'] = workbench(1400, 1000)
  return out
}

declare global {
  interface Window {
    renderAll: typeof renderAll
  }
}
window.renderAll = renderAll
