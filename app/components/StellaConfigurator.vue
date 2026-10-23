<script setup lang="ts">
/**
 * Bag configurator. Layout and copy follow Andrea's mockup: the bag over a
 * warm studio backdrop on the left, an inspector panel with numbered
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
  STELLA_MAX_PATCHES,
  WASH,
  addPatch,
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
import { monoCanvas, patchCanvas, swatchURL } from '~/utils/stella/textures'

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
const tabs = computed<{ key: TabKey; tab: string }[]>(() => [{ key: 'model', tab: 'Modello' }, ...groups.value])

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



// ── Steps: one group at a time, with back / next and a final summary ─────
type StepKey = TabKey | 'summary'
const steps = computed<{ key: StepKey; tab: string }[]>(() => [...tabs.value, { key: 'summary', tab: 'Riepilogo' }])
const stepIndex = ref(0)
const visited = ref(new Set<StepKey>(['model']))
const current = computed(() => steps.value[Math.min(stepIndex.value, steps.value.length - 1)]!)
const currentGroup = computed(() => groups.value.find((g) => g.key === current.value.key) ?? null)
const panel = ref<HTMLElement | null>(null)
/** Every step always holds a valid choice; this guards the one that could not. */
const stepError = computed(() => (current.value.key === 'wash' && !state.wash.length ? 'Scegli almeno un lavaggio.' : ''))
function goStep(i: number) {
  if (i > stepIndex.value && stepError.value) return
  stepIndex.value = Math.max(0, Math.min(steps.value.length - 1, i))
  visited.value.add(current.value.key)
  const key = current.value.key
  // Show the lining while choosing it, the outside for everything else.
  if (key === 'lining') view.value = 'top'
  else if (view.value === 'top') view.value = 'front'
  void nextTick(() => panel.value?.scrollTo({ top: 0 }))
}
function goTab(key: StepKey) {
  const i = steps.value.findIndex((st) => st.key === key)
  if (i >= 0 && i !== stepIndex.value) goStep(i)
}
// Switching to a bag without hardware drops that step: stay on the same group.
watch(steps, (list, prev) => {
  const key = prev?.[stepIndex.value]?.key
  const i = list.findIndex((st) => st.key === key)
  stepIndex.value = i >= 0 ? i : Math.min(stepIndex.value, list.length - 1)
})

/** Restart from the defaults of the current model. */
function resetAll() {
  Object.assign(state, defaultStellaState(state.model))
  selected.value = null
  added.value = false
  view.value = 'front'
  stepIndex.value = 0
  visited.value = new Set(['model'])
  if (route.query.cfg) void router.replace({ query: { ...route.query, cfg: undefined } })
}

/** Line-by-line price, for the summary step. */
const breakdown = computed(() => {
  const b = bag.value
  const rows: { step: StepKey; label: string; value: string; p: number }[] = [
    { step: 'model', label: 'Modello', value: `${b.name} · ${b.type}`, p: b.p },
  ]
  state.wash.slice(0, maxWashes(b)).forEach((id, i) => {
    const o = findOption(WASH, id)
    rows.push({ step: 'wash', label: i ? 'Lavaggio tracolla' : maxWashes(b) > 1 ? 'Lavaggio corpo' : 'Lavaggio', value: o.name, p: o.p })
  })
  const lin = findOption(LINING, state.lining)
  rows.push({ step: 'lining', label: 'Fodera', value: lin.name, p: lin.p })
  state.patches.forEach((pt, i) => {
    const o = findOption(PATCH, pt.style)
    rows.push({ step: 'patch', label: `Toppa ${i + 1}`, value: `${o.name} · ${pt.size} · ${pt.side === 'front' ? 'fronte' : 'retro'}`, p: o.p })
  })
  if (!state.patches.length) rows.push({ step: 'patch', label: 'Toppe', value: 'Nessuna', p: 0 })
  if (hasHardware(b)) {
    const o = findOption(HW, state.hw)
    rows.push({ step: 'hw', label: 'Metalli', value: o.name, p: o.p })
  }
  const fin = findOption(FINISH, state.finish)
  rows.push({ step: 'finish', label: 'Monogramma', value: `${fin.name} · ${state.mono.side === 'front' ? 'fronte' : 'retro'}`, p: fin.p })
  return rows
})

// ── 2D stage: stacked images per view, decals on top ─────────────────────
const VIEWS: { id: BagView; name: string }[] = [
  { id: 'front', name: 'Fronte' },
  { id: 'back', name: 'Retro' },
  { id: 'top', name: 'Interno' },
]
const view = ref<BagView>('front')
const zoomed = ref(false)
const showHint = ref(true)
const show3d = ref(false)
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
  return monoCanvas().toDataURL()
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
  if (snap.mono.side === 'front') await place(monoCanvas().toDataURL(), snap.mono, bw * b.mono.w, bw * b.mono.w * 0.5)
  dg.globalCompositeOperation = 'destination-in'
  dg.drawImage(body, 0, 0, S, S)

  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  g.fillStyle = '#ebe3d4'
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

</script>

<template>
  <div class="stella">
    <div class="stage">
      <section class="viewport" :aria-label="`Anteprima della borsa ${bag.name}`">
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
          <p class="vp-label">
            <span class="eyebrow">Atelier Linea 2</span>
            <span class="vp-name">{{ bag.name }}</span>
          </p>
          <button class="pill v3d-pill" type="button" @click="show3d = true">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 7.3v9.4L12 21l7.5-4.3V7.3L12 3Zm0 0v9m0 0 7.5-4.7M12 12 4.5 7.3M12 12v9" /></svg>
            <span>Vedi in 3D</span>
          </button>

          <p v-if="imgState === 'loading'" class="vp-status" role="status">Caricamento…</p>
          <p v-else-if="imgState === 'error'" class="vp-status" role="status">
            L'immagine di questa combinazione non è ancora disponibile. Puoi comunque scegliere le opzioni e ordinare.
          </p>

          <div class="views" role="group" aria-label="Vista">
            <button v-for="v in VIEWS" :key="v.id" type="button" :aria-pressed="view === v.id" @click="view = v.id">
              {{ v.name }}
            </button>
          </div>
          <div class="vp-ctrl">
            <button type="button" aria-label="Vista precedente" @click="stepView(-1)">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
            </button>
            <button type="button" :aria-label="zoomed ? 'Allontana' : 'Avvicina'" :aria-pressed="zoomed" @click="zoomed = !zoomed">
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3.5 3.5M5 7h4" /><path v-if="!zoomed" d="M7 5v4" /></svg>
            </button>
            <button type="button" aria-label="Vista successiva" @click="stepView(1)">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
            </button>
          </div>
          <span v-if="showHint && view !== 'top'" class="hint">Trascina toppe e monogramma per spostarli</span>
          <span v-else-if="view === 'top'" class="hint">La borsa aperta, vista dall'alto: qui vedi la fodera</span>
        </div>
      </section>

      <aside class="inspector" aria-label="Personalizza la borsa">
        <header class="ins-head">
          <div>
            <p class="eyebrow kick">Personalizza</p>
            <h1 class="ttl">La tua {{ bag.name }}</h1>
          </div>
          <button type="button" class="reset" @click="resetAll">Ricomincia</button>
        </header>

        <nav class="steps" aria-label="Passaggi">
          <ol>
            <li v-for="(st, i) in steps" :key="st.key">
              <button
                type="button"
                :aria-current="i === stepIndex ? 'step' : undefined"
                :class="{ done: visited.has(st.key) && i !== stepIndex }"
                :title="st.tab"
                @click="goStep(i)"
              >
                <span class="n" aria-hidden="true">{{ visited.has(st.key) && i !== stepIndex ? '✓' : i + 1 }}</span>
                <span class="sr-only">{{ i + 1 }}. {{ st.tab }}</span>
              </button>
            </li>
          </ol>
          <div class="bar" aria-hidden="true"><span :style="{ width: `${((stepIndex + 1) / steps.length) * 100}%` }" /></div>
        </nav>

        <div ref="panel" class="panel" :aria-labelledby="`stella-h-${current.key}`">
          <p class="count">Passo {{ stepIndex + 1 }} di {{ steps.length }} · {{ current.tab }}</p>

          <!-- 1 · Model -->
          <template v-if="current.key === 'model'">
            <h2 :id="`stella-h-${current.key}`" class="grp-title">Scegli il modello</h2>
            <p class="note">Il prezzo parte dal modello; ogni scelta successiva lo aggiorna.</p>
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
                <span class="nm">{{ b.name }}<small>{{ b.type }} · da €{{ b.p }}</small></span>
              </button>
            </div>
          </template>

          <!-- Summary -->
          <template v-else-if="current.key === 'summary'">
            <h2 :id="`stella-h-${current.key}`" class="grp-title">Riepilogo</h2>
            <p class="note">Controlla le tue scelte: la borsa viene cucita esattamente così.</p>
            <dl class="recap">
              <div v-for="(r, i) in breakdown" :key="i" class="row">
                <dt>{{ r.label }}</dt>
                <dd>
                  <span>{{ r.value }}</span>
                  <span class="rp">{{ i === 0 ? fmt(r.p) : r.p ? `+${fmt(r.p)}` : 'incluso' }}</span>
                </dd>
                <button type="button" class="edit" :aria-label="`Modifica ${r.label.toLowerCase()}`" @click="goTab(r.step)">Modifica</button>
              </div>
              <div class="row total">
                <dt>Totale</dt>
                <dd><span /><span class="rp">{{ fmt(price) }}</span></dd>
              </div>
            </dl>
          </template>

          <!-- Option groups -->
          <template v-else-if="currentGroup">
            <h2 :id="`stella-h-${current.key}`" class="grp-title">{{ currentGroup.title }}</h2>

            <div v-if="currentGroup.key === 'patch'" class="patches">
              <p class="note">
                Trascina ogni toppa sulla borsa per posizionarla. Fino a {{ STELLA_MAX_PATCHES }} toppe, ognuna con il suo prezzo.
              </p>
              <div
                v-for="(pt, pi) in state.patches"
                :key="pi"
                class="prow"
                :class="{ sel: selected?.kind === 'patch' && selected.index === pi }"
                @click="select('patch', pi)"
              >
                <div class="prow-head">
                  <span class="pnum">Toppa {{ pi + 1 }}</span>
                  <span class="pprice">+€{{ findOption(PATCH, pt.style).p }}</span>
                  <button type="button" class="prm" :aria-label="`Rimuovi toppa ${pi + 1}`" @click.stop="removePatch(pi)">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
                  </button>
                </div>
                <div class="pstyles" role="group" :aria-label="`Stile toppa ${pi + 1}`">
                  <button
                    v-for="o in PATCH"
                    :key="o.id"
                    type="button"
                    class="swb"
                    :aria-pressed="pt.style === o.id"
                    :aria-label="ariaLabel(o)"
                    @click="pt.style = o.id"
                  >
                    <span class="sw" :style="swatches[`patch:${o.id}`] ? { backgroundImage: `url(${swatches[`patch:${o.id}`]})` } : undefined"><i class="chk" /></span>
                    <span class="nm">{{ o.name }}</span>
                  </button>
                </div>
                <div class="prow-opts">
                  <div class="seg" role="group" :aria-label="`Misura toppa ${pi + 1}`">
                    <button v-for="z in SIZES" :key="z" type="button" :aria-pressed="pt.size === z" @click="pt.size = z">{{ z }}</button>
                  </div>
                  <div class="seg" role="group" :aria-label="`Lato toppa ${pi + 1}`">
                    <button v-for="sd in SIDES" :key="sd.id" type="button" :aria-pressed="pt.side === sd.id" @click.stop="setSide(pt, sd.id)">
                      {{ sd.name }}
                    </button>
                  </div>
                </div>
              </div>
              <button type="button" class="padd" :disabled="state.patches.length >= STELLA_MAX_PATCHES" @click="newPatch">
                + Aggiungi una toppa
              </button>
            </div>

            <template v-else>
              <p v-if="currentGroup.key === 'wash'" class="note">
                {{ maxWashes(bag) > 1 ? 'Fino a due lavaggi: il primo per il corpo, il secondo per tracolla e linguetta.' : 'Un solo lavaggio per tutta la borsa.' }}
              </p>
              <p v-else-if="currentGroup.key === 'lining'" class="note">La borsa si apre nella vista dall’alto, così vedi la fodera all’interno.</p>
              <p v-else-if="currentGroup.key === 'finish'" class="note">
                Ogni borsa porta il monogramma Linea 2, che non si può togliere né modificare. Trascinalo sulla borsa
                per scegliere dove metterlo.
              </p>
              <div v-if="currentGroup.key !== 'finish'" class="sws">
                <button
                  v-for="o in currentGroup.list"
                  :key="o.id"
                  type="button"
                  class="swb"
                  :aria-pressed="isSelected(currentGroup.key as SimpleGroup, o.id)"
                  :aria-label="ariaLabel(o)"
                  @click="pick(currentGroup.key as SimpleGroup, o.id)"
                >
                  <span
                    class="sw"
                    :style="swatches[`${currentGroup.key}:${o.id}`] ? { backgroundImage: `url(${swatches[`${currentGroup.key}:${o.id}`]})` } : undefined"
                  ><i class="chk" /></span>
                  <span class="nm">{{ o.name }}<small v-if="o.p">+€{{ o.p }}</small></span>
                </button>
              </div>
              <template v-if="currentGroup.key === 'finish'">
                <div class="field-row">
                  <span>Posizione</span>
                  <div class="seg" role="group" aria-label="Lato del monogramma">
                    <button v-for="sd in SIDES" :key="sd.id" type="button" :aria-pressed="state.mono.side === sd.id" @click="setSide(state.mono, sd.id)">
                      {{ sd.name }}
                    </button>
                  </div>
                </div>
              </template>
            </template>
          </template>
          <p v-if="stepError" class="err" role="alert">{{ stepError }}</p>
        </div>

        <footer class="buy">
          <div class="live" aria-label="Le tue scelte">
            <span
              v-for="it in summary"
              :key="it.key"
              class="sw mini"
              :title="it.name"
              :style="swatches[it.key] ? { backgroundImage: `url(${swatches[it.key]})` } : undefined"
            />
          </div>
          <div class="nav">
            <button type="button" class="ghost" :disabled="stepIndex === 0" @click="goStep(stepIndex - 1)">← Indietro</button>
            <span class="price" aria-live="polite">{{ fmt(price) }}</span>
            <button v-if="stepIndex < steps.length - 1" type="button" class="next" :disabled="!!stepError" @click="goStep(stepIndex + 1)">
              Avanti →
            </button>
          </div>
          <button type="button" class="add" :class="{ final: current.key === 'summary' }" @click="addToBag">Aggiungi al carrello</button>
          <p v-if="added" class="added" role="status">
            Aggiunta al carrello · <NuxtLink to="/cart" class="underline">vedi carrello</NuxtLink>
          </p>
        </footer>
      </aside>
    </div>

    <LazyBag3DViewer v-if="show3d" :state="state" @close="show3d = false" @place="onPlace3d" />
  </div>
</template>

<style scoped>
.stella {
  --line: var(--color-line);
  color: var(--color-fg);
  font-size: 14px;
  line-height: 1.4;
}
.stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 24px;
  align-items: start;
}
.viewport {
  position: sticky;
  top: calc(var(--header-h) + 28px);
  height: min(680px, calc(100svh - var(--header-h) - 40px));
  min-height: 520px;
  border-radius: var(--radius-card);
  overflow: hidden;
  /* Studio: lit ivory wall over a linen table, light from the left. */
  background:
    radial-gradient(70% 60% at 30% 20%, rgb(255 252 246 / 0.75), transparent 65%),
    linear-gradient(180deg, #ece5d8 0%, #f2ede4 70%, #e3d9c8 70.3%, #d9cdb9 100%);
}
.bag-wrap {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  padding: 70px 24px 76px;
}
.bag2d {
  position: relative;
  height: 100%;
  max-width: 100%;
  aspect-ratio: 1;
  filter: drop-shadow(0 18px 22px rgb(0 0 0 / 0.3));
}
@media (prefers-reduced-motion: no-preference) {
  .bag2d {
    transition: transform 300ms var(--ease-out-soft);
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
  filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.5)) drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1.5px var(--color-navy));
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
.vp-label {
  position: absolute;
  top: 20px;
  left: 22px;
  display: grid;
  gap: 4px;
  pointer-events: none !important;
  color: var(--color-ink);
}
.vp-label .eyebrow {
  color: var(--color-muted);
}
.vp-name {
  font: 400 26px/1 var(--font-display);
}
.vp-status {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: 320px;
  text-align: center;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: rgb(20 38 56 / 0.7);
  color: #fff;
  font-size: 12px;
  pointer-events: none;
}
.pill {
  position: absolute;
  top: 18px;
  right: 18px;
  height: 40px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 0 14px 0 12px;
  border: 1px solid var(--color-navy);
  background: var(--color-navy);
  color: var(--color-ivory);
  font: 600 11px/1 var(--font-body);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s;
}
.pill:hover {
  background: var(--color-indigo);
}
.pill svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.3;
}
.views {
  position: absolute;
  left: 18px;
  bottom: 18px;
  display: flex;
  border: 1px solid rgb(20 38 56 / 0.2);
  border-radius: var(--radius-sm);
  background: rgb(252 250 246 / 0.85);
  overflow: hidden;
}
.views button {
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  background: none;
  color: var(--color-muted);
  font: 500 11px/1 var(--font-body);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
}
.views button + button {
  border-left: 1px solid rgb(20 38 56 / 0.12);
}
.views button[aria-pressed='true'] {
  background: var(--color-navy);
  color: var(--color-ivory);
}
.vp-ctrl {
  position: absolute;
  right: 18px;
  bottom: 18px;
  display: flex;
  gap: 6px;
}
.vp-ctrl button {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  border: 1px solid rgb(20 38 56 / 0.2);
  background: rgb(252 250 246 / 0.85);
  color: var(--color-navy);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.vp-ctrl svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
}
.vp-ctrl button[aria-pressed='true'] {
  background: var(--color-navy);
  color: var(--color-ivory);
}
.hint {
  position: absolute;
  left: 50%;
  bottom: 66px;
  transform: translateX(-50%);
  font: 400 11px/1.3 var(--font-body);
  letter-spacing: 0.04em;
  color: var(--color-ivory);
  background: rgb(20 38 56 / 0.6);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  pointer-events: none !important;
}

/* inspector */
.inspector {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--color-surface);
}
.ins-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 22px 24px 16px;
}
.kick {
  color: var(--color-accent);
}
.ttl {
  margin: 6px 0 0;
  font: 400 28px/1.1 var(--font-display);
  color: var(--color-ink);
}
.reset {
  min-height: 36px;
  padding: 0 2px;
  border: 0;
  background: none;
  color: var(--color-muted);
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.reset:hover {
  color: var(--color-ink);
}
.steps {
  padding: 0 24px;
}
.steps ol {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
}
.steps ol::before {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  top: 22px;
  height: 1px;
  background: var(--line);
}
.steps li {
  position: relative;
}
.steps button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 44px;
  margin: 0 -6px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-muted);
  cursor: pointer;
}
.steps .n {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--color-surface);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}
.steps button:hover .n {
  border-color: var(--color-ink);
}
.steps button.done .n {
  border-color: var(--color-ink);
  color: var(--color-ink);
}
.steps button[aria-current='step'] .n {
  background: var(--color-navy);
  border-color: var(--color-navy);
  color: var(--color-ivory);
}
.bar {
  height: 1px;
  background: var(--line);
}
.bar span {
  display: block;
  height: 1px;
  background: var(--color-ink);
  transition: width 0.35s var(--ease-out-soft);
}
.panel {
  flex: 1;
  padding: 20px 24px 8px;
  min-height: 300px;
  max-height: 440px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.count {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.grp-title {
  margin: 8px 0 0;
  font: 400 22px/1.2 var(--font-display);
  color: var(--color-ink);
}
.note {
  margin: 8px 0 16px;
  font-size: 13px;
  color: var(--color-muted);
}
.sws {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 10px;
}
.swb {
  background: none;
  border: 0;
  padding: 0;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 8px;
  cursor: pointer;
  text-align: center;
  color: var(--color-fg);
}
.nm {
  font: 400 12px/1.25 var(--font-body);
}
.nm small {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: var(--color-muted);
}
.sw {
  position: relative;
  display: block;
  width: 100%;
  max-width: 64px;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background-color: var(--color-surface-2);
  background-size: cover;
  background-position: center;
}
@media (prefers-reduced-motion: no-preference) {
  .swb .sw {
    transition: box-shadow 160ms ease-out, transform 160ms ease-out;
  }
}
.swb:hover .sw {
  transform: translateY(-1px);
}
.swb[aria-pressed='true'] .sw {
  box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 3px var(--color-ink);
  border-color: transparent;
}
.swb[aria-pressed='true'] .nm {
  font-weight: 600;
  color: var(--color-ink);
}
.chk {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-navy);
  display: none;
  place-items: center;
}
.chk::after {
  content: '';
  width: 7px;
  height: 3.5px;
  border-left: 1.5px solid #fff;
  border-bottom: 1.5px solid #fff;
  transform: rotate(-45deg) translate(0.5px, -0.5px);
}
.swb[aria-pressed='true'] .chk {
  display: grid;
}
.sws.bags {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px 10px;
}
.sw.bag {
  max-width: 96px;
  aspect-ratio: 5 / 6;
  background-color: #ebe3d4;
}
.patches {
  display: grid;
  gap: 10px;
}
.patches .note {
  margin-bottom: 6px;
}
.prow {
  display: grid;
  gap: 12px;
  padding: 12px 14px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}
.prow.sel {
  border-color: var(--color-ink);
}
.prow-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pnum {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink);
}
.pprice {
  margin-left: auto;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--color-accent);
}
.prm {
  width: 32px;
  height: 32px;
  margin: -6px -6px -6px 0;
  border: 0;
  background: none;
  color: var(--color-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.prm svg {
  width: 12px;
  height: 12px;
  stroke: currentColor;
  stroke-width: 1.5;
}
.prm:hover {
  color: var(--color-ink);
}
.pstyles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.pstyles .sw {
  max-width: 48px;
}
.prow-opts {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
}
.seg {
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.seg button {
  min-width: 36px;
  min-height: 34px;
  padding: 0 10px;
  border: 0;
  background: none;
  color: var(--color-muted);
  font: 500 11.5px/1 var(--font-body);
  cursor: pointer;
}
.seg button + button {
  border-left: 1px solid var(--line);
}
.seg button[aria-pressed='true'] {
  background: var(--color-navy);
  color: var(--color-ivory);
}
.padd {
  min-height: 44px;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--color-ink);
  background: none;
  color: var(--color-ink);
  font: 500 12px/1 var(--font-body);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}
.padd:disabled {
  opacity: 0.4;
  cursor: default;
}
.field-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--color-ink);
}
.field-row small {
  color: var(--color-muted);
}
.recap {
  margin: 0;
  border-top: 1px solid var(--line);
}
.recap .row {
  display: grid;
  grid-template-columns: 6.5rem 1fr auto;
  gap: 4px 12px;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.recap dt {
  color: var(--color-muted);
  font-size: 12px;
}
.recap dd {
  margin: 0;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-ink);
}
.rp {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--color-muted);
}
.edit {
  min-height: 28px;
  border: 0;
  background: none;
  padding: 0;
  font-size: 11.5px;
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.recap .total {
  grid-template-columns: 6.5rem 1fr;
  border-bottom: 0;
}
.recap .total dt,
.recap .total .rp {
  color: var(--color-ink);
  font-weight: 600;
  font-size: 14px;
}
.err {
  margin-top: 12px;
  font-size: 13px;
  color: #9b3b2f;
}
.buy {
  display: grid;
  gap: 12px;
  padding: 16px 24px 22px;
  border-top: 1px solid var(--line);
  background: var(--color-surface);
  border-radius: 0 0 var(--radius-panel) var(--radius-panel);
}
.live {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.sw.mini {
  width: 22px;
  border-radius: var(--radius-sm);
}
.nav {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
}
.nav .ghost,
.nav .next {
  min-height: 44px;
  border-radius: var(--radius-sm);
  font: 500 12px/1 var(--font-body);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}
.nav .ghost {
  justify-self: start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-ink);
}
.nav .ghost:disabled {
  opacity: 0.35;
  cursor: default;
}
.nav .next {
  justify-self: end;
  padding: 0 16px;
  border: 1px solid var(--color-ink);
  background: none;
  color: var(--color-ink);
}
.nav .next:hover {
  background: var(--color-ink);
  color: var(--color-bg);
}
.price {
  font: 400 24px/1 var(--font-display);
  font-variant-numeric: tabular-nums lining-nums;
  color: var(--color-ink);
}
.add {
  min-height: 52px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-navy);
  background: var(--color-navy);
  color: var(--color-ivory);
  font: 600 12px/1 var(--font-body);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s;
}
.add:hover {
  background: var(--color-indigo);
}
.added {
  font-size: 12px;
  color: var(--color-muted);
  text-align: center;
}

@media (max-width: 1180px) {
  .stage {
    grid-template-columns: minmax(0, 1fr) 360px;
  }
}
@media (max-width: 900px) {
  .stage {
    grid-template-columns: 1fr;
  }
  .viewport {
    position: relative;
    top: 0;
    height: 62svh;
    min-height: 380px;
    max-height: 560px;
  }
  .panel {
    max-height: none;
    min-height: 0;
  }
  .buy {
    position: sticky;
    bottom: 0;
    z-index: 5;
    box-shadow: 0 -10px 24px -18px rgb(20 38 56 / 0.35);
  }
}
@media (max-width: 520px) {
  .bag-wrap {
    padding: 64px 4px 70px;
  }
  .vp-label {
    top: 14px;
    left: 14px;
  }
  .vp-name {
    font-size: 21px;
  }
  .pill {
    top: 12px;
    right: 12px;
  }
  .views {
    left: 12px;
    bottom: 12px;
  }
  .views button {
    padding: 0 10px;
  }
  .vp-ctrl {
    right: 12px;
    bottom: 12px;
  }
  .vp-ctrl button:not([aria-pressed]) {
    display: none;
  }
  .hint {
    bottom: 60px;
    white-space: normal;
    width: max-content;
    max-width: calc(100% - 24px);
    text-align: center;
  }
  .ins-head,
  .steps,
  .panel,
  .buy {
    padding-left: 16px;
    padding-right: 16px;
  }
  .sws {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px 8px;
  }
  .recap .row {
    grid-template-columns: 1fr auto;
  }
  .recap dd {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
