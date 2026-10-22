<script setup lang="ts">
/**
 * Bag configurator. Layout and copy follow Andrea's mockup: the bag over a
 * blurred atelier backdrop on the left, a glass inspector with numbered
 * sections on the right, live price and "Add to bag".
 *
 * The bag is shown as pre-rendered 2D images (public/bags2d, made by
 * `npm run render:bags2d`): front, back and an open view from the top for the
 * lining. Patches and the monogram are HTML layers dragged on the image. The
 * 3D model only loads if the customer asks for it ("View in 3D").
 */
import {
  BAGS,
  FINISH,
  HW,
  LINING,
  PATCH,
  PATCH_SCALE,
  STELLA_GROUPS,
  STELLA_INITIALS_PRICE,
  STELLA_MAX_PATCHES,
  WASH,
  addPatch,
  cleanInitials,
  decodeStella,
  defaultStellaState,
  describeStella,
  encodeStella,
  findBag,
  findOption,
  hasHardware,
  maxWashes,
  stellaKey,
  stellaPrice,
  toggleWash,
  withModel,
  type BagView,
  type Frame,
  type PatchSize,
  type Placement,
  type StellaGroup,
  type StellaOption,
  type StellaState,
} from '~/utils/stella/options'
import { FRAMES } from '~/utils/stella/frames'
import { monoCanvas, paintBackdrop, patchCanvas, swatchURL } from '~/utils/stella/textures'

type DecalKind = 'patch' | 'mono'

const { addLine } = useCart()
const route = useRoute()
const router = useRouter()

// A saved design (?cfg=, e.g. from the cart) wins over a bare ?model=.
const initialModel = typeof route.query.model === 'string' ? findBag(route.query.model).id : 'stella'
const saved = typeof route.query.cfg === 'string' ? decodeStella(route.query.cfg) : null
const state = reactive<StellaState>(saved ?? defaultStellaState(initialModel))
const snapshot = (): StellaState => JSON.parse(JSON.stringify(toRaw(state))) as StellaState
const bag = computed(() => findBag(state.model))
const price = computed(() => stellaPrice(state))

/** Option groups this bag supports (hardware needs separate rings). */
const groups = computed(() => STELLA_GROUPS.filter((g) => g.key !== 'hw' || hasHardware(bag.value)))
type TabKey = StellaGroup | 'model'
const tabs = computed<{ key: TabKey; tab: string }[]>(() => [{ key: 'model', tab: 'Bag' }, ...groups.value])

function pickModel(id: string) {
  if (id === state.model) return
  Object.assign(state, withModel(state, id))
  added.value = false
  if (route.query.model !== id) void router.replace({ query: { ...route.query, model: id, cfg: undefined } })
}
// Links like /customize?model=luna while already on the page.
watch(
  () => route.query.model,
  (m) => {
    if (typeof m === 'string') pickModel(findBag(m).id)
  },
)
const fmt = (n: number) => `€${n.toFixed(2)}`

// ── Swatches (painted once fonts are ready, so the "L2" serif renders) ────
// Wash swatches are static files: weaving eight denims on load is wasted work.
const swatches = ref<Record<string, string>>(Object.fromEntries(WASH.map((w) => [`wash:${w.id}`, `/bags2d/swatches/wash-${w.id}.png`])))
function paintSwatches() {
  const out = { ...swatches.value }
  for (const g of STELLA_GROUPS) if (g.key !== 'wash') for (const o of g.list) out[`${g.key}:${o.id}`] = swatchURL(g.key, o)
  swatches.value = out
}

type SimpleGroup = Exclude<StellaGroup, 'patch'>
function isSelected(group: SimpleGroup, id: string) {
  return group === 'wash' ? state.wash.includes(id) : state[group] === id
}
function pick(group: SimpleGroup, id: string) {
  if (group === 'wash') state.wash = toggleWash(state.wash, id, maxWashes(bag.value))
  else state[group] = id
  // Show the lining while choosing it, the outside for everything else.
  if (group === 'lining') view.value = 'top'
  else if (view.value === 'top') view.value = 'front'
}

// ── Patches and monogram (placed by dragging them on the bag) ─────────────
const SIZES: PatchSize[] = ['S', 'M', 'L']
const SIDES = [
  { id: 'front', label: 'F', name: 'Fronte' },
  { id: 'back', label: 'R', name: 'Retro' },
] as const
const selected = ref<{ kind: DecalKind; index: number } | null>(null)
function select(kind: DecalKind, index: number) {
  selected.value = { kind, index }
  const at = kind === 'mono' ? state.mono : state.patches[index]
  if (at) view.value = at.side
}
function newPatch() {
  state.patches = addPatch(state)
  const pt = state.patches[state.patches.length - 1]
  // New patches go on the side being looked at.
  if (pt && view.value === 'back') pt.side = 'back'
  select('patch', state.patches.length - 1)
}
function removePatch(i: number) {
  state.patches.splice(i, 1)
  selected.value = null
}
function setSide(at: Placement, side: Placement['side']) {
  at.side = side
  view.value = side
}
function ariaLabel(o: StellaOption) {
  return o.p ? `${o.name}, più ${o.p} euro` : o.name
}

const summary = computed(() => {
  const list: { key: string; name: string }[] = state.wash.map((id) => ({ key: `wash:${id}`, name: findOption(WASH, id).name }))
  list.push({ key: `lining:${state.lining}`, name: findOption(LINING, state.lining).name })
  for (const id of new Set(state.patches.map((pt) => pt.style))) {
    const n = state.patches.filter((pt) => pt.style === id).length
    list.push({ key: `patch:${id}`, name: findOption(PATCH, id).name + (n > 1 ? ` ×${n}` : '') })
  }
  if (hasHardware(bag.value)) list.push({ key: `hw:${state.hw}`, name: findOption(HW, state.hw).name })
  list.push({ key: `finish:${state.finish}`, name: findOption(FINISH, state.finish).name })
  return list.slice(0, 9)
})

const meta = computed(() => {
  const main = findOption(WASH, state.wash[0] ?? 'indigo')
  return `SKU L2-${bag.value.id.slice(0, 3).toUpperCase()}-${state.wash.map((w) => w.slice(0, 3).toUpperCase()).join('')}-${state.lining.slice(0, 2).toUpperCase()} · ${main.hex} · 3–4 weeks`
})

function onInitials(e: Event) {
  const el = e.target as HTMLInputElement
  state.initials = cleanInitials(el.value)
  el.value = state.initials
}

// ── Tabs with scroll-spy over the inspector sections ─────────────────────
const scroller = ref<HTMLElement | null>(null)
const activeTab = ref<TabKey>('model')
function goTab(key: TabKey) {
  activeTab.value = key
  const el = document.getElementById(`stella-g-${key}`)
  if (el && scroller.value) scroller.value.scrollTo({ top: el.offsetTop - scroller.value.offsetTop, behavior: 'smooth' })
}
function onScroll() {
  const sc = scroller.value
  if (!sc) return
  let cur: TabKey = 'model'
  for (const g of tabs.value) {
    const el = document.getElementById(`stella-g-${g.key}`)
    if (el && el.offsetTop - sc.offsetTop - 30 <= sc.scrollTop) cur = g.key
  }
  activeTab.value = cur
}

// ── 2D stage: stacked images per view, decals on top ─────────────────────
const VIEWS: { id: BagView; name: string }[] = [
  { id: 'front', name: 'Fronte' },
  { id: 'back', name: 'Retro' },
  { id: 'top', name: 'Interno' },
]
const view = ref<BagView>('front')
const zoomed = ref(false)
const showHint = ref(true)
const showAr = ref(false)
const show3d = ref(false)
const backdrop = ref<HTMLCanvasElement | null>(null)
const stageEl = ref<HTMLElement | null>(null)

const FALLBACK_FRAME: Frame = { x0: 0.15, x1: 0.85, y0: 0.85, y1: 0.15, w: 1 }
const frame = computed(() => FRAMES[bag.value.id]?.[view.value] ?? FALLBACK_FRAME)
const dir = computed(() => `/bags2d/${bag.value.id}`)
const bodyWash = computed(() => state.wash[0] ?? 'indigo')

/** Images stacked bottom to top; the first one (body) also masks the decals. */
const layers = computed(() => {
  const d = dir.value
  const v = view.value
  if (v === 'top') return [`${d}/top-${bodyWash.value}-${state.lining}.webp`]
  if (bag.value.kind !== 'parts') return [`${d}/${v}-all-${bodyWash.value}.webp`]
  return [`${d}/${v}-body-${bodyWash.value}.webp`]
})
/** Strap, tab and rings: drawn above the decals (they pass in front of the body). */
const overLayers = computed(() => {
  if (view.value === 'top' || bag.value.kind !== 'parts') return []
  const d = dir.value
  const v = view.value
  return [`${d}/${v}-accent-${state.wash[1] ?? bodyWash.value}.webp`, `${d}/${v}-hw-${state.hw}.webp`]
})

const imgState = ref<'loading' | 'ready' | 'error'>('loading')
watch(layers, () => (imgState.value = 'loading'))
function onImg(ok: boolean) {
  imgState.value = ok ? 'ready' : 'error'
  if (ok) void loadMask(layers.value[0]!)
}

// Alpha of the body image, to keep decals on the cloth while dragging.
let mask: { src: string; data: Uint8ClampedArray; n: number } | null = null
const MASK_N = 200
async function loadMask(src: string) {
  if (mask?.src === src) return
  const img = new Image()
  img.src = src
  try {
    await img.decode()
  } catch {
    return
  }
  const c = document.createElement('canvas')
  c.width = c.height = MASK_N
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.drawImage(img, 0, 0, MASK_N, MASK_N)
  mask = { src, data: g.getImageData(0, 0, MASK_N, MASK_N).data, n: MASK_N }
}
function onCloth(fx: number, fy: number): boolean {
  if (!mask) return true
  const x = Math.min(mask.n - 1, Math.max(0, Math.floor(fx * mask.n)))
  const y = Math.min(mask.n - 1, Math.max(0, Math.floor(fy * mask.n)))
  return mask.data[(y * mask.n + x) * 4 + 3]! > 128
}

/** Decal size as fractions of the body box (u, v) and of the image (x, y). */
function decalBox(kind: DecalKind, size: PatchSize = 'L') {
  const f = frame.value
  const bw = Math.abs(f.x1 - f.x0)
  const bh = Math.abs(f.y0 - f.y1)
  if (kind === 'mono') {
    const w = bw * bag.value.mono.w
    return { u: bag.value.mono.w, v: (w * 0.5) / bh, w, h: w * 0.5 }
  }
  const s = PATCH_SCALE[size]
  return { u: bag.value.patch.w * s, v: bag.value.patch.h * s, w: bw * bag.value.patch.w * s, h: bh * bag.value.patch.h * s }
}
const pct = (n: number) => `${(n * 100).toFixed(3)}%`
function decalStyle(kind: DecalKind, at: Placement, size?: PatchSize) {
  const f = frame.value
  const b = decalBox(kind, size)
  return {
    left: pct(f.x0 + at.u * (f.x1 - f.x0) - b.w / 2),
    top: pct(f.y0 + at.v * (f.y1 - f.y0) - b.h / 2),
    width: pct(b.w),
    height: pct(b.h),
  }
}

// Decal art, cached per look (the denim weave is the costly part).
const artCache = new Map<string, string>()
function patchArtURL(style: string): string {
  const key = `${bag.value.id}|${style}|${bodyWash.value}`
  let url = artCache.get(key)
  if (!url) {
    const fb = FRAMES[bag.value.id]?.front ?? FALLBACK_FRAME
    const l = decalBox('patch', 'L')
    // Same weave scale as the 3D decal: TILE scene units per denim tile.
    const wScene = fb.w * bag.value.patch.w
    url = patchCanvas(style, bodyWash.value, l.h / l.w, (0.32 * 1024) / wScene).toDataURL('image/webp', 0.85)
    artCache.set(key, url)
  }
  return url
}
const fontsReady = ref(false)
const monoURL = computed(() => {
  void fontsReady.value // repaint once the serif has loaded
  return monoCanvas(state.finish, state.initials).toDataURL()
})

const decals = computed(() => {
  if (view.value === 'top') return []
  const out: { key: string; kind: DecalKind; index: number; src: string; style: Record<string, string>; label: string }[] = []
  state.patches.forEach((pt, i) => {
    if (pt.side !== view.value) return
    out.push({ key: `p${i}`, kind: 'patch', index: i, src: patchArtURL(pt.style), style: decalStyle('patch', pt, pt.size), label: `Toppa ${i + 1}` })
  })
  if (state.mono.side === view.value) {
    out.push({ key: 'mono', kind: 'mono', index: 0, src: monoURL.value, style: decalStyle('mono', state.mono), label: 'Monogramma' })
  }
  return out
})

// Dragging: pointer position → (u, v) on the body box, kept on the cloth.
let drag: { kind: DecalKind; index: number; du: number; dv: number; id: number } | null = null
function toUV(e: PointerEvent) {
  const r = stageEl.value!.getBoundingClientRect()
  const fx = (e.clientX - r.left) / r.width
  const fy = (e.clientY - r.top) / r.height
  const f = frame.value
  return { fx, fy, u: (fx - f.x0) / (f.x1 - f.x0), v: (fy - f.y0) / (f.y1 - f.y0) }
}
function target(kind: DecalKind, index: number) {
  return kind === 'mono' ? state.mono : state.patches[index]
}
function onDecalDown(e: PointerEvent, kind: DecalKind, index: number) {
  const at = target(kind, index)
  if (!at || !stageEl.value) return
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  const p = toUV(e)
  drag = { kind, index, du: at.u - p.u, dv: at.v - p.v, id: e.pointerId }
  selected.value = { kind, index }
  goTab(kind === 'mono' ? 'finish' : 'patch')
  showHint.value = false
}
const r3 = (n: number) => Math.round(n * 1000) / 1000
function onDecalMove(e: PointerEvent) {
  if (!drag || e.pointerId !== drag.id) return
  const at = target(drag.kind, drag.index)
  if (!at) return
  const p = toUV(e)
  const b = decalBox(drag.kind, 'size' in at ? (at as { size: PatchSize }).size : undefined)
  const u = Math.min(1 - b.u / 2, Math.max(b.u / 2, p.u + drag.du))
  const v = Math.min(1 - b.v / 2, Math.max(b.v / 2, p.v + drag.dv))
  const f = frame.value
  if (!onCloth(f.x0 + u * (f.x1 - f.x0), f.y0 + v * (f.y1 - f.y0))) return
  at.u = r3(u)
  at.v = r3(v)
}
function onDecalUp(e: PointerEvent) {
  if (drag && e.pointerId === drag.id) drag = null
}
/** Arrow keys nudge the focused decal (keyboard alternative to dragging). */
function onDecalKey(e: KeyboardEvent, kind: DecalKind, index: number) {
  const at = target(kind, index)
  const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key]
  if (!at || !step) return
  e.preventDefault()
  const b = decalBox(kind, 'size' in at ? (at as { size: PatchSize }).size : undefined)
  const sgn = view.value === 'back' ? -1 : 1
  at.u = r3(Math.min(1 - b.u / 2, Math.max(b.u / 2, at.u + step[0]! * 0.02 * sgn)))
  at.v = r3(Math.min(1 - b.v / 2, Math.max(b.v / 2, at.v + step[1]! * 0.02)))
}

function stepView(d: number) {
  const i = VIEWS.findIndex((v) => v.id === view.value)
  view.value = VIEWS[(i + d + VIEWS.length) % VIEWS.length]!.id
}

// Warm the browser cache with the other views of this look.
function preload() {
  const d = dir.value
  const w = bodyWash.value
  const list = bag.value.kind === 'parts'
    ? ['front', 'back'].flatMap((v) => [`${d}/${v}-body-${w}.webp`, `${d}/${v}-accent-${state.wash[1] ?? w}.webp`, `${d}/${v}-hw-${state.hw}.webp`])
    : ['front', 'back'].map((v) => `${d}/${v}-all-${w}.webp`)
  list.push(`${d}/top-${w}-${state.lining}.webp`)
  for (const src of list) new Image().src = src
}
watch(() => [state.model, state.wash.join(), state.lining, state.hw], preload)

onMounted(() => {
  if (backdrop.value) paintBackdrop(backdrop.value)
  preload()
  const ready = document.fonts?.ready ?? Promise.resolve()
  void ready.then(() => {
    fontsReady.value = true
    paintSwatches()
  })
})

// ── Add to bag ────────────────────────────────────────────────────────────
const added = ref(false)

const loadImg = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

/** Small JPEG of the front, light enough for localStorage/Firestore. */
async function thumbnail(snap: StellaState): Promise<string | null> {
  const b = findBag(snap.model)
  const d = `/bags2d/${b.id}`
  const w = snap.wash[0] ?? 'indigo'
  const f = FRAMES[b.id]?.front ?? FALLBACK_FRAME
  const parts = b.kind === 'parts'
  const [body, ...over] = await Promise.all(
    (parts ? [`${d}/front-body-${w}.webp`, `${d}/front-accent-${snap.wash[1] ?? w}.webp`, `${d}/front-hw-${snap.hw}.webp`] : [`${d}/front-all-${w}.webp`]).map(loadImg),
  )
  if (!body) return null
  const S = 192
  // Decals on their own canvas, clipped to the body's silhouette.
  const dc = document.createElement('canvas')
  dc.width = dc.height = S
  const dg = dc.getContext('2d')!
  const place = async (src: string, at: Placement, bw: number, bh: number) => {
    const img = await loadImg(src)
    if (!img) return
    const x = (f.x0 + at.u * (f.x1 - f.x0)) * S
    const y = (f.y0 + at.v * (f.y1 - f.y0)) * S
    dg.drawImage(img, x - (bw * S) / 2, y - (bh * S) / 2, bw * S, bh * S)
  }
  const bw = Math.abs(f.x1 - f.x0)
  const bh = Math.abs(f.y0 - f.y1)
  for (const pt of snap.patches) {
    if (pt.side !== 'front') continue
    const s = PATCH_SCALE[pt.size]
    await place(patchArtURL(pt.style), pt, bw * b.patch.w * s, bh * b.patch.h * s)
  }
  if (snap.mono.side === 'front') await place(monoCanvas(snap.finish, snap.initials).toDataURL(), snap.mono, bw * b.mono.w, bw * b.mono.w * 0.5)
  dg.globalCompositeOperation = 'destination-in'
  dg.drawImage(body, 0, 0, S, S)

  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  g.fillStyle = '#8b8277'
  g.fillRect(0, 0, S, S)
  g.drawImage(body, 0, 0, S, S)
  g.drawImage(dc, 0, 0)
  for (const img of over) if (img) g.drawImage(img, 0, 0, S, S)
  return c.toDataURL('image/jpeg', 0.8)
}

async function addToBag() {
  const snap = snapshot()
  const b = findBag(snap.model)
  addLine({
    id: stellaKey(snap),
    slug: b.id,
    title: b.title,
    price: stellaPrice(snap),
    image: await thumbnail(snap).catch(() => null),
    imageAlt: `Borsa ${b.name} personalizzata`,
    quantity: 1,
    details: describeStella(snap),
    link: `/customize?model=${b.id}&cfg=${encodeStella(snap)}`,
  })
  added.value = true
}

// The 3D viewer reports decals moved on the model too.
function onPlace3d(kind: DecalKind, index: number, at: Placement) {
  const t = target(kind, index)
  if (t) Object.assign(t, at)
}

const INSTAGRAM = 'https://www.instagram.com/linea2.upcycling/'
const TIKTOK = 'https://www.tiktok.com/@linea2.upcycling'
</script>

<template>
  <div class="stella">
    <div class="stage">
      <section class="viewport" :aria-label="`Anteprima della borsa ${bag.name}`">
        <canvas ref="backdrop" class="backdrop" aria-hidden="true" />
        <div class="bag-wrap" :class="{ zoomed }">
          <div ref="stageEl" class="bag2d">
            <img
              v-for="(src, i) in layers"
              :key="src"
              class="layer"
              :src="src"
              :alt="i === 0 ? `${bag.name}, vista ${VIEWS.find((v) => v.id === view)!.name.toLowerCase()}` : ''"
              draggable="false"
              @load="onImg(true)"
              @error="onImg(false)"
            />
            <div v-if="decals.length" class="decals" :style="{ maskImage: `url(${layers[0]})`, WebkitMaskImage: `url(${layers[0]})` }">
              <img
                v-for="d in decals"
                :key="d.key"
                class="decal"
                :class="{ sel: selected?.kind === d.kind && selected.index === d.index, mono: d.kind === 'mono' }"
                :src="d.src"
                :style="d.style"
                :alt="d.label"
                :aria-label="`${d.label}: trascina o usa le frecce per spostarlo`"
                role="button"
                tabindex="0"
                draggable="false"
                @pointerdown="onDecalDown($event, d.kind, d.index)"
                @pointermove="onDecalMove"
                @pointerup="onDecalUp"
                @pointercancel="onDecalUp"
                @keydown="onDecalKey($event, d.kind, d.index)"
                @focus="selected = { kind: d.kind, index: d.index }"
              />
            </div>
            <img v-for="src in overLayers" :key="src" class="layer" :src="src" alt="" draggable="false" />
          </div>
        </div>

        <div class="vp-ui">
          <button class="ar-pill v3d-pill" type="button" @click="show3d = true">
            <svg viewBox="0 0 24 24"><path d="M12 3 4.5 7.3v9.4L12 21l7.5-4.3V7.3L12 3Zm0 0v9m0 0 7.5-4.7M12 12 4.5 7.3M12 12v9" /></svg>
            <span>VIEW IN 3D</span>
          </button>
          <div class="vp-top">
            <a class="icon-btn" :href="INSTAGRAM" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24"><path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm4.9-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM12 3.6c2.7 0 3 0 4.1.1 2.7.1 4 1.4 4.1 4.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.7-1.4 4-4.1 4.1-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.7-.1-4-1.4-4.1-4.1C3.7 15 3.6 14.7 3.6 12s0-3 .1-4.1c.1-2.7 1.4-4 4.1-4.1 1.1-.2 1.5-.2 4.2-.2ZM12 2c-2.7 0-3.1 0-4.1.1C4.2 2.2 2.2 4.2 2.1 7.9 2 8.9 2 9.3 2 12s0 3.1.1 4.1c.1 3.6 2.1 5.7 5.8 5.8 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c3.6-.1 5.7-2.1 5.8-5.8.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-3.6-2.1-5.7-5.8-5.8C15.1 2 14.7 2 12 2Z" /></svg>
            </a>
            <a class="icon-btn" :href="TIKTOK" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg viewBox="0 0 24 24"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7l-.8-.1a5.7 5.7 0 1 0 5.7 5.7V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5Z" /></svg>
            </a>
            <button class="ar-pill" type="button" :aria-expanded="showAr" @click="showAr = !showAr">
              <svg viewBox="0 0 24 24"><path d="M3 8V5a2 2 0 0 1 2-2h3m8 0h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3" /></svg>
              <span>VIEW IN AR</span>
            </button>
          </div>
          <div v-if="showAr" class="toast panel-glass" role="status">
            La vista in realtà aumentata arriva presto: dal telefono potrai appoggiare la borsa sul tavolo di casa.
          </div>

          <p v-if="imgState === 'loading'" class="vp-status">Loading…</p>
          <p v-else-if="imgState === 'error'" class="vp-status">
            L'immagine di questa combinazione non è ancora disponibile. Puoi comunque scegliere le opzioni e ordinare.
          </p>

          <div class="summary panel-glass" aria-live="polite">
            <h2>Summary</h2>
            <div class="sum-grid">
              <div v-for="it in summary" :key="it.key" class="sum-item">
                <span class="sw" :style="swatches[it.key] ? { backgroundImage: `url(${swatches[it.key]})` } : undefined" />
                {{ it.name }}
              </div>
            </div>
          </div>

          <div class="vp-ctrl">
            <button type="button" aria-label="Vista precedente" @click="stepView(-1)">
              <svg viewBox="0 0 16 16"><path d="M10 3 5 8l5 5M5 8h9" /></svg>
            </button>
            <button type="button" :aria-label="zoomed ? 'Allontana' : 'Avvicina'" :aria-pressed="zoomed" @click="zoomed = !zoomed">
              <svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3.5 3.5M5 7h4M7 5v4" /></svg>
            </button>
            <button type="button" aria-label="Vista successiva" @click="stepView(1)">
              <svg viewBox="0 0 16 16"><path d="m6 3 5 5-5 5M11 8H2" /></svg>
            </button>
          </div>
          <span v-if="showHint && view !== 'top'" class="hint">Trascina toppe e monogramma per spostarli</span>
          <span v-else-if="view === 'top'" class="hint">La borsa aperta, vista dall'alto: qui scegli la fodera</span>
        </div>
      </section>

      <aside class="inspector panel-glass" aria-label="Personalizza la borsa">
        <h1 class="ttl">Customize your {{ bag.name }} bag</h1>
        <div class="tabs" role="tablist">
          <button
            v-for="(g, i) in tabs"
            :key="g.key"
            type="button"
            role="tab"
            :aria-selected="activeTab === g.key"
            @click="goTab(g.key)"
          >
            {{ i + 1 }}. {{ g.tab.toUpperCase() }}
          </button>
        </div>

        <div ref="scroller" class="scroll" @scroll.passive="onScroll">
          <div id="stella-g-model" class="grp">
            <h3>1. Bag model</h3>
            <div class="sws bags">
              <button
                v-for="b in BAGS"
                :key="b.id"
                type="button"
                class="swb"
                :aria-pressed="state.model === b.id"
                :aria-label="`${b.name}, ${b.type}, da ${b.p} euro`"
                @click="pickModel(b.id)"
              >
                <span class="sw bag" :style="{ backgroundImage: `url(${b.thumb})` }"><i class="chk" /></span>
                <span>{{ b.name }}<small>{{ b.type }}</small></span>
              </button>
            </div>
          </div>
          <div v-for="(g, i) in groups" :id="`stella-g-${g.key}`" :key="g.key" class="grp">
            <h3>{{ i + 2 }}. {{ g.title }}</h3>
            <div v-if="g.key === 'patch'" class="patches">
              <div
                v-for="(pt, pi) in state.patches"
                :key="pi"
                class="prow"
                :class="{ sel: selected?.kind === 'patch' && selected.index === pi }"
                @click="select('patch', pi)"
              >
                <span class="pnum">{{ pi + 1 }}</span>
                <div class="pstyles" role="group" :aria-label="`Stile toppa ${pi + 1}`">
                  <button
                    v-for="o in PATCH"
                    :key="o.id"
                    type="button"
                    class="swb"
                    :title="o.name"
                    :aria-pressed="pt.style === o.id"
                    :aria-label="ariaLabel(o)"
                    @click="pt.style = o.id"
                  >
                    <span class="sw" :style="swatches[`patch:${o.id}`] ? { backgroundImage: `url(${swatches[`patch:${o.id}`]})` } : undefined"><i class="chk" /></span>
                  </button>
                </div>
                <div class="psize" role="group" :aria-label="`Misura toppa ${pi + 1}`">
                  <button v-for="z in SIZES" :key="z" type="button" :aria-pressed="pt.size === z" @click="pt.size = z">{{ z }}</button>
                </div>
                <div class="psize pside" role="group" :aria-label="`Lato toppa ${pi + 1}`">
                  <button
                    v-for="s in SIDES"
                    :key="s.id"
                    type="button"
                    :title="s.name"
                    :aria-label="s.name"
                    :aria-pressed="pt.side === s.id"
                    @click.stop="setSide(pt, s.id)"
                  >
                    {{ s.label }}
                  </button>
                </div>
                <span class="pprice">+€{{ findOption(PATCH, pt.style).p }}</span>
                <button type="button" class="prm" :aria-label="`Rimuovi toppa ${pi + 1}`" @click.stop="removePatch(pi)">×</button>
              </div>
              <button type="button" class="padd" :disabled="state.patches.length >= STELLA_MAX_PATCHES" @click="newPatch">
                + ADD A PATCH
              </button>
              <p class="note">
                Drag each patch on the bag to place it; F/R puts it on the front or the back (up to {{ STELLA_MAX_PATCHES }}). Each patch is priced on its own.
              </p>
            </div>
            <div v-else class="sws">
              <button
                v-for="o in g.list"
                :key="o.id"
                type="button"
                class="swb"
                :aria-pressed="isSelected(g.key as SimpleGroup, o.id)"
                :aria-label="ariaLabel(o)"
                @click="pick(g.key as SimpleGroup, o.id)"
              >
                <span
                  class="sw"
                  :style="swatches[`${g.key}:${o.id}`] ? { backgroundImage: `url(${swatches[`${g.key}:${o.id}`]})` } : undefined"
                ><i class="chk" /></span>
                <span>{{ o.name }}</span>
              </button>
            </div>
            <p v-if="g.key === 'wash'" class="note">
              {{ maxWashes(bag) > 1 ? 'Up to two washes: the second one goes on strap and tab.' : 'One wash for the whole bag.' }}
            </p>
            <p v-if="g.key === 'lining'" class="note">The bag opens on the view from the top, so you can see the lining inside.</p>
            <template v-if="g.key === 'finish'">
              <p class="note">Every bag carries its monogram: drag it on the bag to choose where it goes.</p>
              <div class="mono-side">
                <span>Monogram on the</span>
                <div class="psize pside" role="group" aria-label="Lato del monogramma">
                  <button
                    v-for="s in SIDES"
                    :key="s.id"
                    type="button"
                    :title="s.name"
                    :aria-pressed="state.mono.side === s.id"
                    @click="setSide(state.mono, s.id)"
                  >
                    {{ s.name.toUpperCase() }}
                  </button>
                </div>
              </div>
              <label class="ini" for="stella-initials">
                Custom initials
                <input
                  id="stella-initials"
                  type="text"
                  maxlength="3"
                  placeholder="L2"
                  autocomplete="off"
                  :value="state.initials"
                  @input="onInitials"
                />
                <span v-if="state.initials" class="plus">+€{{ STELLA_INITIALS_PRICE }}</span>
              </label>
              <p class="meta">{{ meta }}</p>
            </template>
          </div>
        </div>

        <div class="buy">
          <div class="price-row">
            <span class="price" aria-live="polite">{{ fmt(price) }}</span>
            <button type="button" class="link" @click="show3d = true">VIEW IN 3D</button>
          </div>
          <button type="button" class="add" @click="addToBag">ADD TO BAG</button>
          <p v-if="added" class="added" role="status">
            Added to your bag · <NuxtLink to="/cart" class="underline">view bag</NuxtLink>
          </p>
        </div>
      </aside>
    </div>

    <div class="views" role="group" aria-label="Vista">
      <button v-for="v in VIEWS" :key="v.id" type="button" :aria-pressed="view === v.id" @click="view = v.id">
        {{ v.name }}
      </button>
    </div>

    <LazyBag3DViewer v-if="show3d" :state="state" @close="show3d = false" @place="onPlace3d" />
  </div>
</template>

<style scoped>
.stella {
  --line: rgb(255 255 255 / 0.16);
  color: var(--color-fg);
  font-size: 13px;
  line-height: 1.35;
}
.stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 350px;
  gap: 18px;
}
.viewport {
  position: relative;
  height: 610px;
  border-radius: var(--radius-card);
  overflow: hidden;
  background: #8b8277;
}
.backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  object-fit: cover;
}
.bag-wrap {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  padding: 44px 190px 44px 20px;
}
.bag2d {
  position: relative;
  height: 100%;
  max-width: 100%;
  aspect-ratio: 1;
  filter: drop-shadow(0 18px 22px rgb(0 0 0 / 0.35));
}
@media (prefers-reduced-motion: no-preference) {
  .bag2d {
    transition: transform 250ms ease-out;
  }
}
.bag-wrap.zoomed .bag2d {
  transform: scale(1.35);
}
.layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  user-select: none;
  pointer-events: none;
}
.decals {
  position: absolute;
  inset: 0;
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
}
.decal {
  position: absolute;
  cursor: grab;
  touch-action: none;
  user-select: none;
  filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.5));
  outline: none;
}
.decal:active {
  cursor: grabbing;
}
.decal.sel,
.decal:focus-visible {
  filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.5)) drop-shadow(0 0 2px var(--color-brass-hi)) drop-shadow(0 0 2px var(--color-brass-hi));
}
.vp-ui {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.vp-ui > * {
  pointer-events: auto;
}
.vp-status {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: 320px;
  text-align: center;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgb(22 22 22 / 0.6);
  color: #fff;
  font-size: 12px;
  pointer-events: none;
}
.icon-btn,
.ar-pill,
.vp-ctrl button {
  background: rgb(22 22 22 / 0.82);
  border: 0;
  cursor: pointer;
  color: #fff;
}
.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}
.icon-btn svg {
  width: 17px;
  height: 17px;
  fill: #fff;
}
.v3d-pill {
  position: absolute;
  top: 18px;
  left: 20px;
}
.mono-side {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
  font-size: 11px;
  color: var(--color-muted);
}
.prow > .psize {
  grid-row: 2;
  grid-column: 2;
  justify-self: start;
}
.prow > .pside {
  grid-row: 2;
  grid-column: 3 / 5;
  justify-self: end;
}
.psize.pside button {
  width: auto;
  min-width: 22px;
  padding: 0 6px;
}
.vp-top {
  position: absolute;
  top: 18px;
  right: 20px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.ar-pill {
  height: 34px;
  border-radius: 17px;
  display: inline-flex;
  gap: 9px;
  align-items: center;
  padding: 0 16px 0 12px;
  font: 500 11.5px/1 var(--font-body);
  letter-spacing: 0.06em;
}
.ar-pill svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #fff;
  stroke-width: 1.4;
}
.vp-ctrl {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 6px;
}
.vp-ctrl button {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
}
.vp-ctrl svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: #fff;
  stroke-width: 1.6;
}
.vp-ctrl button[aria-pressed='true'] {
  background: var(--color-selvedge);
  box-shadow: 0 0 0 1px var(--color-brass);
}
.summary {
  position: absolute;
  right: 8px;
  bottom: 48px;
  width: 170px;
  border-radius: 10px;
  padding: 12px 12px 10px;
}
.summary h2 {
  margin: 0 0 8px;
  font: 400 14.5px/1.2 var(--font-body);
  text-transform: none;
  color: var(--color-fg);
}
.sum-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 6px;
}
.sum-item {
  display: grid;
  justify-items: center;
  gap: 4px;
  text-align: center;
  font: 400 8.5px/1.15 var(--font-body);
  color: color-mix(in oklab, var(--color-fg) 82%, transparent);
  letter-spacing: 0.02em;
}
.sum-item .sw {
  width: 34px;
  height: 34px;
}
.toast {
  position: absolute;
  top: 62px;
  right: 20px;
  max-width: 280px;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
}
.hint {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  font: 400 10.5px/1 var(--font-body);
  letter-spacing: 0.04em;
  color: rgb(255 255 255 / 0.78);
  background: rgb(22 22 22 / 0.5);
  padding: 6px 10px;
  border-radius: 99px;
  pointer-events: none !important;
}

/* inspector */
.inspector {
  border-radius: var(--radius-panel);
  padding: 20px 22px 22px;
  display: flex;
  flex-direction: column;
  height: 610px;
  min-width: 0;
}
.ttl {
  margin: 0;
  text-align: center;
  font: 500 15.5px/1.2 var(--font-display);
  letter-spacing: 0.06em;
}
.tabs {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  margin-top: 11px;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs button {
  background: none;
  border: 0;
  padding: 4px 0 7px;
  font: 500 8.5px/1 var(--font-body);
  letter-spacing: 0.03em;
  color: var(--color-muted);
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 1.5px solid transparent;
  margin-bottom: -1px;
}
.tabs button[aria-selected='true'] {
  color: var(--color-fg);
  border-bottom-color: var(--color-fg);
}
.scroll {
  flex: 1;
  overflow-y: auto;
  padding-top: 10px;
  scrollbar-width: thin;
  scrollbar-color: rgb(255 255 255 / 0.2) transparent;
}
.grp {
  padding-bottom: 6px;
}
.grp h3 {
  margin: 6px 0 9px;
  font: 500 13px/1.25 var(--font-body);
  letter-spacing: 0.02em;
}
.sws {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px 6px;
}
.swb {
  background: none;
  border: 0;
  padding: 0;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 5px;
  cursor: pointer;
  text-align: center;
  font: 400 11px/1.15 var(--font-body);
  color: color-mix(in oklab, var(--color-fg) 90%, transparent);
}
.sw {
  position: relative;
  display: block;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid rgb(255 255 255 / 0.25);
  background-color: var(--color-surface-2);
  background-size: cover;
  background-position: center;
}
@media (prefers-reduced-motion: no-preference) {
  .swb .sw {
    transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  }
}
.swb:hover .sw {
  transform: scale(1.05);
}
.swb[aria-pressed='true'] .sw {
  box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 3.5px var(--color-brass-hi);
  border-color: transparent;
}
.swb[aria-pressed='true'] {
  color: var(--color-brass-hi);
}
.chk {
  position: absolute;
  top: 6px;
  right: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-brass-hi);
  display: none;
  place-items: center;
}
.chk::after {
  content: '';
  width: 6px;
  height: 3px;
  border-left: 1.5px solid #1b1b1b;
  border-bottom: 1.5px solid #1b1b1b;
  transform: rotate(-45deg) translate(0.5px, -0.5px);
}
.swb[aria-pressed='true'] .chk {
  display: grid;
}
.sws.bags {
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 6px;
}
.sw.bag {
  background-color: #8b8277;
  background-size: cover;
}
.swb small {
  display: block;
  margin-top: 2px;
  font-size: 9.5px;
  color: var(--color-muted);
}
.patches {
  display: grid;
  gap: 6px;
}
.prow {
  display: grid;
  grid-template-columns: 16px 1fr auto 20px;
  row-gap: 6px;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.prow.sel {
  border-color: var(--color-brass-hi);
}
.pnum {
  font: 500 11px/1 var(--font-mono);
  color: var(--color-muted);
}
.pstyles {
  display: flex;
  gap: 6px;
}
.pstyles .sw {
  width: 34px;
  height: 34px;
}
.pstyles .chk {
  top: 0;
  right: -2px;
}
.psize {
  display: flex;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}
.psize button {
  width: 22px;
  height: 22px;
  border: 0;
  background: none;
  color: var(--color-muted);
  font: 500 10px/1 var(--font-mono);
  cursor: pointer;
}
.psize button[aria-pressed='true'] {
  background: var(--color-brass-hi);
  color: #1b1b1b;
}
.pprice {
  font: 400 10.5px/1 var(--font-mono);
  color: var(--color-brass-hi);
}
.prm {
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--color-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.prm:hover {
  color: var(--color-fg);
}
.padd {
  height: 34px;
  border-radius: 17px;
  border: 1px dashed var(--color-brass-hi);
  background: none;
  color: var(--color-brass-hi);
  font: 500 11px/1 var(--font-body);
  letter-spacing: 0.06em;
  cursor: pointer;
}
.padd:disabled {
  opacity: 0.4;
  cursor: default;
}
.note {
  margin-top: 6px;
  font-size: 10.5px;
  color: var(--color-muted);
}
.ini {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
  font-size: 11px;
  color: var(--color-muted);
}
.ini input {
  width: 86px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: rgb(0 0 0 / 0.25);
  color: var(--color-fg);
  font: 400 12px var(--font-mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.plus {
  color: var(--color-brass-hi);
  font-family: var(--font-mono);
}
.meta {
  font: 400 10.5px/1.35 var(--font-mono);
  color: var(--color-muted);
  margin-top: 8px;
  letter-spacing: -0.02em;
}
.buy {
  border-top: 1px solid var(--line);
  padding-top: 14px;
  margin-top: 8px;
  display: grid;
  gap: 14px;
}
.price-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.price {
  font: 400 20px/1 var(--font-body);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}
.link {
  background: none;
  border: 0;
  padding: 0;
  font: 400 11px/1 var(--font-body);
  letter-spacing: 0.06em;
  color: var(--color-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.add {
  height: 44px;
  border-radius: 22px;
  border: 0;
  background: var(--color-cream);
  color: var(--color-raw);
  font: 400 13.5px/1 var(--font-body);
  letter-spacing: 0.06em;
  cursor: pointer;
}
.add:hover {
  background: #fff;
}
.added {
  font-size: 11px;
  color: var(--color-muted);
  text-align: center;
  margin-top: -6px;
}
.views {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 16px;
  width: calc(100% - 368px);
}
.views button {
  height: 30px;
  padding: 0 16px;
  border-radius: 15px;
  border: 1px solid var(--line);
  background: none;
  color: var(--color-muted);
  font: 500 11px/1 var(--font-body);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}
.views button[aria-pressed='true'] {
  color: var(--color-fg);
  border-color: var(--color-brass-hi);
  background: rgb(0 0 0 / 0.18);
}

/* Light theme: inspector text sits on white glass */
:root[data-theme='light'] .stella {
  --line: rgb(140 58 23 / 0.18);
}
:root[data-theme='light'] .add {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
:root[data-theme='light'] .add:hover {
  background: var(--color-primary-strong);
}
:root[data-theme='light'] .sw {
  border-color: rgb(140 58 23 / 0.2);
}
:root[data-theme='light'] .ini input {
  background: rgb(255 255 255 / 0.6);
}

@media (max-width: 1100px) {
  .stage {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
  .views {
    width: calc(100% - 338px);
  }
}
@media (max-width: 860px) {
  .stage {
    grid-template-columns: 1fr;
  }
  .viewport {
    height: 460px;
  }
  .inspector {
    height: auto;
  }
  .scroll {
    overflow: visible;
  }
  .views {
    width: 100%;
  }
  .bag-wrap {
    padding: 50px 16px 44px;
  }
}
@media (max-width: 520px) {
  .viewport {
    height: 400px;
  }
  .summary {
    display: none;
  }
  .bag-wrap {
    padding: 56px 8px 40px;
  }
  .hint {
    bottom: 50px;
    max-width: calc(100% - 24px);
    text-align: center;
  }
  .ar-pill span {
    display: none;
  }
  .ar-pill {
    padding: 0 9px;
  }
  .sw {
    width: 48px;
    height: 48px;
  }
  .inspector {
    padding: 18px 14px;
  }
}
</style>
