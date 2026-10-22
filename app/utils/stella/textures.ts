/**
 * Canvas painters for the Stella configurator: woven denim twill, linings, patch
 * art, hardware and monogram swatches, the blurred studio backdrop. Everything
 * is procedural so the configurator needs no texture downloads; replace with
 * real fabric scans later without touching the 3D code. Browser-only.
 */
import { STELLA_THREAD as THREAD, WASH, findOption, type StellaOption } from './options'

type Ctx = CanvasRenderingContext2D
type Rng = () => number

/** Small seeded PRNG (mulberry32) so textures look the same on every load. */
export function rng(seed: number): Rng {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function canvas(w: number, h = w): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function ctx(c: HTMLCanvasElement): Ctx {
  return c.getContext('2d') as Ctx
}

function hexRgb(h: string): number[] {
  const s = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(s.substr(i, 2), 16))
}

/** Linear blend between two hex colours. */
export function mix(a: string, b: string, t: number): string {
  const x = hexRgb(a)
  const y = hexRgb(b)
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join('')}`
}

export interface DenimSpec {
  /** Dyed lengthwise yarn (the colour you see most). */
  warp: string
  /** Undyed crosswise yarn peeking through the twill. */
  weft: string
  /** 0..1: lighter yarn cores and worn high points. */
  fade: number
  textured?: boolean
  distressed?: boolean
}

export function denimSpec(o: { warp: string; weft: string; fade: number; textured?: boolean; distressed?: boolean }, darken = 0): DenimSpec {
  return {
    warp: darken ? mix(o.warp, '#000000', darken) : o.warp,
    weft: darken ? mix(o.weft, '#000000', darken) : o.weft,
    fade: o.fade,
    textured: o.textured,
    distressed: o.distressed,
  }
}

/** Tileable value noise on a `cells`×`cells` lattice, sampled at 0..1. */
function periodicNoise(cells: number, r: Rng): (x: number, y: number) => number {
  const g = Float32Array.from({ length: cells * cells }, () => r())
  const at = (i: number, j: number) => g[((j % cells) + cells) % cells * cells + (((i % cells) + cells) % cells)]!
  return (x, y) => {
    const fx = x * cells
    const fy = y * cells
    const i = Math.floor(fx)
    const j = Math.floor(fy)
    const tx = fx - i
    const ty = fy - j
    const sx = tx * tx * (3 - 2 * tx)
    const sy = ty * ty * (3 - 2 * ty)
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * sx
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * sx
    return a + (b - a) * sy
  }
}

const WARPS = 128
const WEFTS = 64

/**
 * Woven 3/1 right-hand twill, pixel by pixel: each dyed warp yarn floats over
 * three wefts and under one, so the pale weft shows as the steep diagonal of
 * real jeans. Yarns get their own tone and slubs (thick/thin spots where the
 * white core shows), the surface fades on the high points, and everything
 * tiles seamlessly. Returns the colour map and a matching height map.
 */
export function denimWeave(w: DenimSpec, size = 512, seed = 3): { map: HTMLCanvasElement; bump: HTMLCanvasElement } {
  const r = rng(seed)
  const warp = hexRgb(w.warp)
  const weft = hexRgb(w.weft)
  // The faded core of a ring-dyed yarn: halfway to the undyed cotton.
  const core = warp.map((v, i) => v + (weft[i]! - v) * 0.55)
  const tone = Float32Array.from({ length: WARPS }, () => (r() - 0.5) * 2)
  const weftTone = Float32Array.from({ length: WEFTS }, () => (r() - 0.5) * 2)
  const slub = Array.from({ length: WARPS }, () => periodicNoise(12, r))
  const wobble = Array.from({ length: WARPS }, () => periodicNoise(5, r))
  const cloud = periodicNoise(4, r)
  const cloud2 = periodicNoise(13, r)
  const wear = periodicNoise(3, r)
  const map = canvas(size)
  const bump = canvas(size)
  const img = ctx(map).createImageData(size, size)
  const hgt = ctx(bump).createImageData(size, size)
  const cw = size / WARPS
  const ch = size / WEFTS
  // What shows of the weft is half-hidden and picks up indigo from the warp.
  const wv = weft.map((v, i) => v * 0.55 + warp[i]! * 0.45)
  for (let y = 0; y < size; y++) {
    const v = y / size
    for (let x = 0; x < size; x++) {
      const u = x / size
      // Yarns wander a little, so the weave never looks drawn with a ruler.
      const i0 = Math.floor(x / cw)
      const xs = x / cw + (wobble[i0]!(0.5, v) - 0.5) * 0.5
      const i = ((Math.floor(xs) % WARPS) + WARPS) % WARPS
      const fx = xs - Math.floor(xs)
      const ys = y / ch + (cloud2(u, 0.5) - 0.5) * 0.4
      const j = ((Math.floor(ys) % WEFTS) + WEFTS) % WEFTS
      const fy = ys - Math.floor(ys)
      const phase = (i + j) % 4
      const lo = cloud(u, v) * 0.6 + cloud2(u, v) * 0.4
      let rr: number, gg: number, bb: number, h: number
      if (phase === 0) {
        h = Math.sin(Math.PI * fx) ** 0.8 * Math.sin(Math.PI * fy) ** 0.8
        const k = (0.8 + 0.2 * h) * (1 + weftTone[j]! * 0.07)
        const m = 0.55 + 0.45 * h
        rr = (warp[0]! + (wv[0]! - warp[0]!) * m) * k
        gg = (warp[1]! + (wv[1]! - warp[1]!) * m) * k
        bb = (warp[2]! + (wv[2]! - warp[2]!) * m) * k
        h *= 0.4
      } else {
        const t = (phase - 1 + fy) / 3
        h = Math.sin(Math.PI * fx) ** 0.45 * Math.sin(Math.PI * t) ** 0.25
        const s = slub[i]!(0.5, v)
        const f = Math.min(1, w.fade * (0.25 + 1.0 * lo) * (0.6 + 0.5 * h) + Math.max(0, s - 0.68) * 1.1 * (0.2 + w.fade))
        const k = (0.82 + 0.18 * h) * (1 + tone[i]! * 0.06)
        rr = (warp[0]! + (core[0]! - warp[0]!) * f) * k
        gg = (warp[1]! + (core[1]! - warp[1]!) * f) * k
        bb = (warp[2]! + (core[2]! - warp[2]!) * f) * k
        h = 0.5 + 0.5 * h
      }
      if (w.distressed) {
        const d = wear(u, v)
        if (d > 0.6) {
          // Abrasion: soft, mostly lifts the warp towards its white core.
          const m = Math.min(1, (d - 0.6) * 2.2) * (phase === 0 ? 0.35 : 0.22)
          rr += (weft[0]! - rr) * m
          gg += (weft[1]! - gg) * m
          bb += (weft[2]! - bb) * m
        }
      }
      const n = 1 + (r() - 0.5) * (w.textured ? 0.14 : 0.05)
      const o = (y * size + x) * 4
      img.data[o] = rr * n
      img.data[o + 1] = gg * n
      img.data[o + 2] = bb * n
      img.data[o + 3] = 255
      const hv = h * 255
      hgt.data[o] = hgt.data[o + 1] = hgt.data[o + 2] = hv
      hgt.data[o + 3] = 255
    }
  }
  ctx(map).putImageData(img, 0, 0)
  ctx(bump).putImageData(hgt, 0, 0)
  return { map, bump }
}

const weaveCache = new Map<string, { map: HTMLCanvasElement; bump: HTMLCanvasElement }>()

/** Cached weave: painting one costs tens of ms, so each colour is done once. */
export function denim(w: DenimSpec, size = 512, seed = 3) {
  const key = `${w.warp}${w.weft}${w.fade}${w.textured ? 't' : ''}${w.distressed ? 'd' : ''}|${size}|${seed}`
  let hit = weaveCache.get(key)
  if (!hit) {
    hit = denimWeave(w, size, seed)
    weaveCache.set(key, hit)
  }
  return hit
}

export function lining(id: string, size: number): HTMLCanvasElement {
  const c = canvas(size)
  const g = ctx(c)
  const r = rng(9)
  const k = size / 256
  if (id === 'floral') {
    g.fillStyle = '#EFE7DA'
    g.fillRect(0, 0, size, size)
    for (let i = 0; i < 26; i++) {
      const x = r() * size
      const y = r() * size
      const s = (8 + r() * 12) * k
      g.fillStyle = ['#D79A9A', '#C27A80', '#E6B7AE'][i % 3]!
      for (let p = 0; p < 5; p++) {
        g.beginPath()
        g.ellipse(x + Math.cos(p * 1.256) * s * 0.7, y + Math.sin(p * 1.256) * s * 0.7, s * 0.55, s * 0.38, p * 1.256, 0, 7)
        g.fill()
      }
      g.fillStyle = '#6F8B6A'
      g.beginPath()
      g.ellipse(x + s * 1.4, y + s * 0.4, s * 0.7, s * 0.25, 0.6, 0, 7)
      g.fill()
      g.beginPath()
      g.ellipse(x - s * 1.2, y + s * 0.9, s * 0.6, s * 0.22, -0.5, 0, 7)
      g.fill()
    }
    const sh = g.createLinearGradient(0, 0, size, size)
    sh.addColorStop(0, 'rgba(255,255,255,0)')
    sh.addColorStop(0.5, 'rgba(255,255,255,.18)')
    sh.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = sh
    g.fillRect(0, 0, size, size)
  } else if (id === 'cotton') {
    g.fillStyle = '#ECE6D8'
    g.fillRect(0, 0, size, size)
    for (let i = 0; i < size * 10; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(120,100,70,.08)' : 'rgba(255,255,255,.2)'
      g.fillRect(r() * size, r() * size, (1 + r() * 3) * k, k)
    }
  } else if (id === 'twill') {
    g.fillStyle = '#E8ECF2'
    g.fillRect(0, 0, size, size)
    for (let i = 0; i < size; i += 9 * k) {
      g.fillStyle = '#4A6A9A'
      g.fillRect(i, 0, 3.6 * k, size)
      g.fillStyle = 'rgba(74,106,154,.35)'
      g.fillRect(i + 5.4 * k, 0, 1.2 * k, size)
    }
  } else {
    g.fillStyle = '#1C2542'
    g.fillRect(0, 0, size, size)
    for (let i = 0; i < size * 6; i++) {
      g.fillStyle = 'rgba(255,255,255,.04)'
      g.fillRect(r() * size, r() * size, 2 * k, k)
    }
  }
  return c
}

function stitchStroke(g: Ctx, s: number) {
  g.lineWidth = s * 0.03
  g.strokeStyle = THREAD
  g.setLineDash([s * 0.06, s * 0.045])
  g.stroke()
  g.setLineDash([])
}

/** Draw the patch artwork centred on (cx, cy) with radius s. */
export function patchArt(g: Ctx, id: string, cx: number, cy: number, s: number, r: Rng) {
  g.save()
  if (id === 'organic') {
    const outline = () => {
      g.beginPath()
      g.moveTo(cx - s * 0.9, cy - s * 0.2)
      g.bezierCurveTo(cx - s * 0.8, cy - s * 1.0, cx + s * 0.1, cy - s * 0.7, cx + s * 0.25, cy - s * 0.95)
      g.bezierCurveTo(cx + s * 0.6, cy - s * 1.1, cx + s * 1.05, cy - s * 0.5, cx + s * 0.7, cy)
      g.bezierCurveTo(cx + s * 1.1, cy + s * 0.4, cx + s * 0.4, cy + s * 1.0, cx - s * 0.1, cy + s * 0.6)
      g.bezierCurveTo(cx - s * 0.6, cy + s * 1.0, cx - s * 1.1, cy + s * 0.4, cx - s * 0.9, cy - s * 0.2)
      g.closePath()
    }
    outline()
    g.fillStyle = '#EDE4D3'
    g.fill()
    g.save()
    g.clip()
    const leaves: [string, number, number, number, number, number][] = [
      ['#4F7A6A', -0.45, -0.35, 0.42, 0.16, -0.7],
      ['#2F5D5C', 0.1, 0.25, 0.5, 0.17, 0.4],
      ['#C98F85', 0.35, -0.45, 0.34, 0.2, 1.1],
      ['#E4B9AE', -0.2, 0.1, 0.3, 0.18, -0.2],
      ['#7E9B7C', 0.55, 0.1, 0.36, 0.13, -0.9],
      ['#B9C7B4', -0.6, 0.35, 0.3, 0.12, 0.8],
      ['#2F5D5C', -0.05, -0.65, 0.3, 0.11, 0.2],
    ]
    for (const l of leaves) {
      g.fillStyle = l[0]
      g.beginPath()
      g.ellipse(cx + l[1] * s, cy + l[2] * s, l[3] * s, l[4] * s, l[5], 0, 7)
      g.fill()
    }
    g.restore()
    outline()
    stitchStroke(g, s)
  } else if (id === 'graphic') {
    g.translate(cx, cy)
    g.rotate(-0.12)
    g.fillStyle = '#E9E1D2'
    g.fillRect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6)
    g.strokeStyle = '#1A2238'
    g.lineWidth = s * 0.05
    g.strokeRect(-s * 0.62, -s * 0.62, s * 1.24, s * 1.24)
    g.fillStyle = '#1A2238'
    g.font = `600 ${s * 0.95}px "Cormorant Garamond", Georgia, serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('L2', 0, s * 0.05)
    g.beginPath()
    g.rect(-s * 0.74, -s * 0.74, s * 1.48, s * 1.48)
    stitchStroke(g, s)
  } else if (id === 'street') {
    g.beginPath()
    g.ellipse(cx, cy, s * 0.95, s * 0.78, -0.2, 0, 7)
    g.fillStyle = '#F3F1EC'
    g.fill()
    g.save()
    g.clip()
    const cols = ['#E8622C', '#2D7BE0', '#F2C230', '#D2333F', '#22A6A0']
    g.lineCap = 'round'
    for (let i = 0; i < 9; i++) {
      g.strokeStyle = cols[i % cols.length]!
      g.lineWidth = s * (0.14 + r() * 0.12)
      g.beginPath()
      g.moveTo(cx - s + r() * s * 0.4, cy - s * 0.7 + i * s * 0.18)
      g.bezierCurveTo(cx - s * 0.3, cy - s + r() * s * 2, cx + s * 0.3, cy - s + r() * s * 2, cx + s, cy - s * 0.6 + i * s * 0.16)
      g.stroke()
    }
    g.fillStyle = '#111'
    g.font = `italic 700 ${s * 0.5}px Inter, Arial, sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.save()
    g.translate(cx, cy)
    g.rotate(-0.18)
    g.fillText('L2', 0, 0)
    g.restore()
    g.restore()
    g.beginPath()
    g.ellipse(cx, cy, s * 0.95, s * 0.78, -0.2, 0, 7)
    stitchStroke(g, s)
  }
  g.restore()
}

function metalArt(g: Ctx, hex: string, size: number) {
  const gr = g.createLinearGradient(0, 0, size, size)
  gr.addColorStop(0, mix(hex, '#ffffff', 0.55))
  gr.addColorStop(0.45, hex)
  gr.addColorStop(0.6, mix(hex, '#000000', 0.35))
  gr.addColorStop(1, mix(hex, '#ffffff', 0.25))
  g.fillStyle = gr
  g.fillRect(0, 0, size, size)
}

function finishArt(g: Ctx, id: string, size: number) {
  g.fillStyle = id === 'leather' ? '#7B4B2C' : '#1F2C4C'
  g.fillRect(0, 0, size, size)
  g.fillStyle = id === 'leather' ? '#4C2B17' : '#C2A26B'
  g.font = `600 ${size * 0.45}px "Cormorant Garamond", Georgia, serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('L2', size / 2, size / 2 + 2)
}

/** Data URL for a round swatch button. */
export function swatchURL(kind: string, o: StellaOption): string {
  const S = 104
  const c = canvas(S)
  const g = ctx(c)
  if (kind === 'wash') {
    const wo = findOption(WASH, o.id)
    g.drawImage(denim(denimSpec(wo)).map, 0, 0, 220, 220, 0, 0, S, S)
  }
  else if (kind === 'lining') g.drawImage(lining(o.id, 128), 0, 0, S, S)
  else if (kind === 'patch') {
    g.fillStyle = '#2A3550'
    g.fillRect(0, 0, S, S)
    patchArt(g, o.id, S / 2, S / 2, S * 0.48, rng(4))
  } else if (kind === 'hw') metalArt(g, o.hex ?? '#B6965A', S)
  else finishArt(g, o.id, S)
  return c.toDataURL()
}

/**
 * Oval denim patch with the chosen artwork, sized to the decal's aspect.
 * `tile` is how many canvas pixels one weave tile spans, so the patch's
 * denim matches the bag's scale; the grain is turned, as on a cut piece.
 */
export function patchCanvas(style: string, washId: string, aspect: number, tile = 512): HTMLCanvasElement {
  const main = findOption(WASH, washId)
  const W = 1024
  const H = Math.round(1024 * aspect)
  const c = canvas(W, H)
  const g = ctx(c)
  g.save()
  g.beginPath()
  g.ellipse(W / 2, H / 2, W * 0.47, H * 0.47, 0, 0, 7)
  g.clip()
  const pat = g.createPattern(denim(denimSpec(main)).map, 'repeat')!
  pat.setTransform(new DOMMatrix().rotate(-24).scale(tile / 512))
  g.fillStyle = pat
  g.fillRect(0, 0, W, H)
  g.fillStyle = 'rgba(0,0,0,.08)'
  g.fillRect(0, 0, W, H)
  g.restore()
  g.beginPath()
  g.ellipse(W / 2, H / 2, W * 0.47, H * 0.47, 0, 0, 7)
  g.strokeStyle = 'rgba(0,0,0,.35)'
  g.lineWidth = 6
  g.stroke()
  g.beginPath()
  g.ellipse(W / 2, H / 2, W * 0.44, H * 0.43, 0, 0, 7)
  g.strokeStyle = THREAD
  g.lineWidth = 5
  g.setLineDash([16, 11])
  g.stroke()
  g.setLineDash([])
  patchArt(g, style, W / 2, H / 2, H * 0.36, rng(4))
  return c
}

/** Monogram decal: embroidered brass letters or a stitched leather tag. */
export function monoCanvas(finish: string, initials: string): HTMLCanvasElement {
  const c = canvas(512, 256)
  const g = ctx(c)
  const txt = initials || 'L2'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  if (finish === 'leather') {
    g.fillStyle = '#7B4B2C'
    g.beginPath()
    g.roundRect(20, 20, 472, 216, 20)
    g.fill()
    g.strokeStyle = THREAD
    g.lineWidth = 4
    g.setLineDash([12, 8])
    g.strokeRect(42, 42, 428, 172)
    g.setLineDash([])
    g.fillStyle = '#4A2915'
    g.font = `600 ${txt.length > 2 ? 120 : 150}px "Cormorant Garamond", Georgia, serif`
    g.fillText(txt, 256, 136)
  } else {
    g.font = `600 ${txt.length > 2 ? 150 : 190}px "Cormorant Garamond", Georgia, serif`
    g.fillStyle = 'rgba(0,0,0,.4)'
    g.fillText(txt, 260, 134)
    g.fillStyle = '#C2A26B'
    g.fillText(txt, 256, 128)
    g.globalCompositeOperation = 'source-atop'
    g.strokeStyle = 'rgba(255,240,210,.35)'
    g.lineWidth = 2
    for (let h = -256; h < 512; h += 7) {
      g.beginPath()
      g.moveTo(h, 0)
      g.lineTo(h + 180, 256)
      g.stroke()
    }
  }
  return c
}

/** Blurred atelier backdrop behind the 3D bag (wall, shelf of jeans, desk). */
export function paintBackdrop(target: HTMLCanvasElement) {
  const W = 1300
  const H = 720
  target.width = W
  target.height = H
  const src = canvas(W, H)
  const g = ctx(src)
  const r = rng(12)
  const wall = g.createLinearGradient(0, 0, W, 0)
  wall.addColorStop(0, '#CFC8BC')
  wall.addColorStop(0.35, '#DCD5C9')
  wall.addColorStop(0.6, '#BEB4A6')
  wall.addColorStop(1, '#8D7C69')
  g.fillStyle = wall
  g.fillRect(0, 0, W, H)
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(255,255,255,${r() * 0.06})`
    g.fillRect(r() * W, r() * H * 0.8, 3, 3)
  }
  g.fillStyle = '#8A6A4B'
  g.fillRect(750, 120, 330, 390)
  g.fillStyle = '#6E5238'
  g.fillRect(742, 112, 346, 8)
  g.fillRect(742, 510, 346, 8)
  const blues = ['#3E5E8E', '#24365D', '#7C9CC6', '#E9EAEC', '#5576A6', '#A9BCD6', '#CFC8B4']
  for (let k = 0; k < 18; k++) {
    g.fillStyle = blues[k % blues.length]!
    g.fillRect(770 + r() * 260, 140 + r() * 320, 40 + r() * 70, 40 + r() * 80)
  }
  g.fillStyle = '#C9C6B9'
  g.fillRect(880, 300, 90, 110)
  const desk = g.createLinearGradient(0, 560, 0, H)
  desk.addColorStop(0, '#8B6743')
  desk.addColorStop(1, '#5B3F27')
  g.fillStyle = desk
  g.fillRect(560, 585, W - 560, H - 585)
  g.fillStyle = '#C9A24E'
  g.fillRect(830, 470, 56, 120)
  g.fillStyle = '#E2C273'
  g.fillRect(836, 470, 10, 120)
  g.strokeStyle = '#D8B25E'
  g.lineWidth = 6
  for (const p of [[848, 470, 820, 380], [860, 470, 880, 360], [870, 470, 905, 400], [856, 470, 850, 350]]) {
    g.beginPath()
    g.moveTo(p[0]!, p[1]!)
    g.lineTo(p[2]!, p[3]!)
    g.stroke()
  }
  g.fillStyle = '#B99040'
  g.fillRect(1000, 520, 26, 70)
  g.fillRect(960, 600, 120, 10)
  g.fillStyle = '#6F5A44'
  g.fillRect(0, 610, 330, H - 610)
  ;[[150, 300], [260, 270]].forEach((p, i) => {
    const gr = g.createLinearGradient(p[0]! - 45, 0, p[0]! + 45, 0)
    gr.addColorStop(0, '#2E4670')
    gr.addColorStop(0.5, i ? '#6F8DB8' : '#557BAE')
    gr.addColorStop(1, '#2A3F66')
    g.fillStyle = gr
    g.fillRect(p[0]! - 45, p[1]!, 90, 620 - p[1]!)
    g.fillStyle = '#C8B28A'
    g.fillRect(p[0]! - 18, p[1]! - 70, 36, 74)
  })
  for (const [x, y, rad] of [[110, 560, 95], [230, 600, 88], [70, 660, 80], [250, 690, 86]] as const) {
    g.fillStyle = '#2B4269'
    g.fillRect(x - 140, y - rad, 140, rad * 2)
    g.beginPath()
    g.arc(x, y, rad, 0, 7)
    g.fillStyle = '#34507E'
    g.fill()
    for (let s = rad; s > 22; s -= 7) {
      g.beginPath()
      g.arc(x, y, s, 0, 7)
      g.strokeStyle = 'rgba(255,255,255,.10)'
      g.lineWidth = 1.5
      g.stroke()
    }
    g.beginPath()
    g.arc(x, y, 22, 0, 7)
    g.fillStyle = '#C9B48D'
    g.fill()
    g.beginPath()
    g.arc(x, y, 12, 0, 7)
    g.fillStyle = '#3A2E22'
    g.fill()
  }
  const out = ctx(target)
  out.filter = 'blur(9px)'
  out.drawImage(src, -20, -20, W + 40, H + 40)
  out.filter = 'none'
  const vg = out.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,.28)')
  out.fillStyle = vg
  out.fillRect(0, 0, W, H)
}
