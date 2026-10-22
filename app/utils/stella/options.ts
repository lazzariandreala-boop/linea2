/**
 * Configurator catalogue (the "Stella" configurator, now for every bag model):
 * every choice the customer can make, with its
 * surcharge in EUR. Pure data + pricing so it can be unit-tested and, later,
 * recalculated server-side before payment (never trust the client total).
 */

export interface StellaOption {
  id: string
  name: string
  /** Surcharge in EUR on top of the base price. */
  p: number
  hex?: string
  textured?: boolean
  distressed?: boolean
}

export type StellaGroup = 'wash' | 'lining' | 'patch' | 'hw' | 'finish'

/** Where a decal sits on the front, as fractions of the model's bounding box
 *  (y = centre height from the bottom, w/h = size). */
export interface DecalSpot {
  y: number
  w: number
  h: number
}

/**
 * A bag the configurator can dress. `parts` models (Stella, from CLO) have
 * separate body / strap / tab / ring meshes; `mesh` models (generated with
 * Meshy) are one shell, so they take a single wash and have no hardware.
 */
export interface BagModel {
  id: string
  name: string
  /** Cart / page title, e.g. "Luna Hobo Bag". */
  title: string
  type: string
  /** Base price in EUR. */
  p: number
  url: string
  thumb: string
  kind: 'parts' | 'mesh'
  patch: DecalSpot
  /** Plain denim piece laid under the patches (Stella: hides the cut-out
   *  still in the source model until it is removed in CLO). */
  cover?: DecalSpot
  /** Monogram decal; its height is half its width (512×256 canvas). */
  mono: { y: number; w: number }
}

export const BAGS: BagModel[] = [
  {
    id: 'stella', name: 'Stella', title: 'Stella Bucket Bag', type: 'Bucket crossbody', p: 360,
    url: '/models/stella.glb', thumb: '/models/thumbs/stella.jpg', kind: 'parts',
    patch: { y: 0.31, w: 0.8, h: 0.56 }, cover: { y: 0.31, w: 0.8, h: 0.56 }, mono: { y: 0.655, w: 0.26 },
  },
  {
    id: 'luna', name: 'Luna', title: 'Luna Hobo Bag', type: 'Crescent hobo', p: 290,
    url: '/models/luna.glb', thumb: '/models/thumbs/luna.jpg', kind: 'mesh',
    patch: { y: 0.2, w: 0.5, h: 0.24 }, mono: { y: 0.37, w: 0.22 },
  },
  {
    id: 'sole', name: 'Sole', title: 'Sole Shoulder Bag', type: 'Shoulder tote', p: 320,
    url: '/models/sole.glb', thumb: '/models/thumbs/sole.jpg', kind: 'mesh',
    patch: { y: 0.2, w: 0.52, h: 0.28 }, mono: { y: 0.44, w: 0.22 },
  },
  {
    id: 'atelier', name: 'Atelier', title: 'Atelier Tote', type: 'Large tote', p: 340,
    url: '/models/atelier.glb', thumb: '/models/thumbs/atelier.jpg', kind: 'mesh',
    patch: { y: 0.22, w: 0.5, h: 0.3 }, mono: { y: 0.48, w: 0.22 },
  },
  {
    id: 'viaggio', name: 'Viaggio', title: 'Viaggio Barrel Bag', type: 'Barrel shoulder', p: 310,
    url: '/models/viaggio.glb', thumb: '/models/thumbs/viaggio.jpg', kind: 'mesh',
    patch: { y: 0.16, w: 0.4, h: 0.18 }, mono: { y: 0.31, w: 0.2 },
  },
  {
    id: 'trama', name: 'Trama', title: 'Trama Braided Tote', type: 'Tote, braided handles', p: 330,
    url: '/models/trama.glb', thumb: '/models/thumbs/trama.jpg', kind: 'mesh',
    patch: { y: 0.2, w: 0.52, h: 0.28 }, mono: { y: 0.44, w: 0.22 },
  },
]

export function findBag(id: string): BagModel {
  return BAGS.find((b) => b.id === id) ?? BAGS[0]!
}

/** How many washes a bag takes: body + accent (strap/tab) needs separate parts. */
export function maxWashes(bag: BagModel): number {
  return bag.kind === 'parts' ? STELLA_MAX_WASHES : 1
}

/** Hardware colour only applies to models with separate rings. */
export function hasHardware(bag: BagModel): boolean {
  return bag.kind === 'parts'
}

/** Where a decal sits: centre as fractions of the body's bounding box
 *  (u = left→right seen from the front, v = bottom→top) and which panel. */
export interface Placement {
  u: number
  v: number
  side: 'front' | 'back'
}

export type PatchSize = 'S' | 'M' | 'L'

export interface PatchItem extends Placement {
  style: string
  size: PatchSize
}

export interface StellaState {
  /** Bag model id (see BAGS). */
  model: string
  /** One or two washes: [body, accent on strap + tab]. */
  wash: string[]
  lining: string
  /** Patchwork pieces, each with its own style, size and spot (0..MAX). */
  patches: PatchItem[]
  hw: string
  /** Monogram style; the monogram itself is always on the bag. */
  finish: string
  /** Up to 3 letters; empty means the "L2" house mark. */
  initials: string
  mono: Placement
}

export const STELLA_INITIALS_PRICE = 15
export const STELLA_MAX_WASHES = 2
export const STELLA_MAX_PATCHES = 4
export const STELLA_THREAD = '#C2A26B'
/** Patch size as a share of the model's default patch spot. */
export const PATCH_SCALE: Record<PatchSize, number> = { S: 0.45, M: 0.7, L: 1 }

/**
 * Denim colours. `hex` is how the cloth reads from arm's length (swatches,
 * SKU); `warp`/`weft` are the dyed and undyed yarns the twill is woven from.
 * Values are matched to common commercial washes; swap them for scans of the
 * real jeans when the atelier photographs them.
 */
export interface WashOption extends StellaOption {
  hex: string
  warp: string
  weft: string
  /** 0..1 how faded the surface is (lighter yarn cores, worn high points). */
  fade: number
}

export const WASH: WashOption[] = [
  { id: 'vintage', name: 'Vintage Light Blue', hex: '#8FA8C7', warp: '#7E9CC2', weft: '#E4E1D8', fade: 0.75, p: 0 },
  { id: 'stone', name: 'Stone Wash', hex: '#5D7DA6', warp: '#4C6E9D', weft: '#D9D4C6', fade: 0.5, p: 0 },
  { id: 'indigo', name: 'Deep Indigo', hex: '#25355A', warp: '#1C2B4E', weft: '#A9A597', fade: 0.12, p: 0 },
  { id: 'raw', name: 'Distressed raw', hex: '#33558A', warp: '#294B80', weft: '#D6D0C1', fade: 0.35, p: 20, distressed: true },
  { id: 'grey', name: 'Light Grey', hex: '#A3A4A6', warp: '#96979A', weft: '#E6E4DF', fade: 0.4, p: 0 },
  { id: 'charcoal', name: 'Charcoal Grey', hex: '#55575B', warp: '#4A4C50', weft: '#8E8E8C', fade: 0.3, p: 0 },
  { id: 'black', name: 'Washed Black', hex: '#333437', warp: '#2C2D30', weft: '#55555A', fade: 0.25, p: 10, textured: true },
  { id: 'jet', name: 'Jet Black', hex: '#17181A', warp: '#141517', weft: '#232326', fade: 0.04, p: 10 },
]

export const LINING: StellaOption[] = [
  { id: 'floral', name: 'Floral Silk', p: 25 },
  { id: 'cotton', name: 'Recycled Cotton', p: 0 },
  { id: 'twill', name: 'Striped Twill', p: 10 },
  { id: 'navy', name: 'Plain Navy', p: 0 },
]

export const PATCH: StellaOption[] = [
  { id: 'organic', name: 'Organic Patterns', p: 25 },
  { id: 'graphic', name: 'Graphic Patch', p: 20 },
  { id: 'street', name: 'Street Art', p: 30 },
]

export const HW: StellaOption[] = [
  { id: 'brass', name: 'Brass', hex: '#B6965A', p: 0 },
  { id: 'silver', name: 'Silver', hex: '#C9CDD3', p: 0 },
  { id: 'black', name: 'Black Steel', hex: '#34363B', p: 10 },
]

export const FINISH: StellaOption[] = [
  { id: 'embroidery', name: 'Brass Stitch', p: 0 },
  { id: 'leather', name: 'Leather Patch', p: 15 },
]

export const STELLA_GROUPS: { key: StellaGroup; tab: string; title: string; list: StellaOption[] }[] = [
  { key: 'wash', tab: 'Denim wash', title: 'Base Denim', list: WASH },
  { key: 'lining', tab: 'Lining', title: 'Interior', list: LINING },
  { key: 'patch', tab: 'Patches', title: 'Patchwork', list: PATCH },
  { key: 'hw', tab: 'Hardware', title: 'Hardware', list: HW },
  { key: 'finish', tab: 'Monogram', title: 'Monogram', list: FINISH },
]

/** Look up an option by id, falling back to the first entry. */
export function findOption<T extends StellaOption>(list: T[], id: string): T {
  return list.find((o) => o.id === id) ?? list[0]!
}

const r3 = (n: number) => Math.round(n * 1000) / 1000
const clamp01 = (n: number) => Math.min(0.95, Math.max(0.05, Number.isFinite(n) ? n : 0.5))

/** Default spot for the n-th patch on a bag: the model's patch spot, then
 *  smaller pieces around it. */
export function patchSpot(bag: BagModel, n: number): Placement {
  const y = bag.patch.y
  const spots: [number, number][] = [[0.5, y], [0.24, y + 0.1], [0.76, y + 0.1], [0.5, y - 0.12]]
  const [u, v] = spots[n % spots.length]!
  return { u, v: r3(Math.min(0.85, Math.max(0.1, v))), side: 'front' }
}

export function monoSpot(bag: BagModel): Placement {
  return { u: 0.5, v: bag.mono.y, side: 'front' }
}

export function defaultStellaState(model = 'stella'): StellaState {
  const bag = findBag(model)
  return {
    model: bag.id,
    wash: bag.kind === 'parts' ? ['indigo', 'vintage'] : ['indigo'],
    lining: 'floral',
    patches: [{ style: 'organic', size: 'L', ...patchSpot(bag, 0) }],
    hw: 'brass',
    finish: 'embroidery',
    initials: '',
    mono: monoSpot(bag),
  }
}

/** Add a patch (up to the limit) at the next free default spot. */
export function addPatch(s: StellaState, style = 'organic'): PatchItem[] {
  if (s.patches.length >= STELLA_MAX_PATCHES) return s.patches
  const bag = findBag(s.model)
  return [...s.patches, { style: findOption(PATCH, style).id, size: s.patches.length ? 'S' : 'L', ...patchSpot(bag, s.patches.length) }]
}

/** Normalise initials: letters/digits only, uppercase, max 3. */
export function cleanInitials(raw: string): string {
  return raw.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 3)
}

/**
 * Toggle a wash. Picking an unselected wash adds it (dropping the oldest when
 * already at the limit); picking a selected one removes it unless it is the
 * last one, so the bag always has a body colour.
 */
export function toggleWash(current: string[], id: string, max = STELLA_MAX_WASHES): string[] {
  if (current.includes(id)) return current.length > 1 ? current.filter((w) => w !== id) : current
  const next = [...current, id]
  return next.length > max ? next.slice(next.length - max) : next
}

/** Switch bag model: trim choices it can't take and move decals to its spots. */
export function withModel(s: StellaState, model: string): StellaState {
  const bag = findBag(model)
  return {
    ...s,
    model: bag.id,
    wash: s.wash.slice(0, maxWashes(bag)),
    patches: s.patches.map((pt, i) => ({ ...pt, ...patchSpot(bag, i) })),
    mono: monoSpot(bag),
  }
}

export function stellaPrice(s: StellaState): number {
  const bag = findBag(s.model)
  const washes = s.wash.slice(0, maxWashes(bag)).reduce((sum, id) => sum + findOption(WASH, id).p, 0)
  const patches = s.patches.slice(0, STELLA_MAX_PATCHES).reduce((sum, pt) => sum + findOption(PATCH, pt.style).p, 0)
  return (
    bag.p +
    washes +
    findOption(LINING, s.lining).p +
    patches +
    (hasHardware(bag) ? findOption(HW, s.hw).p : 0) +
    findOption(FINISH, s.finish).p +
    (s.initials ? STELLA_INITIALS_PRICE : 0)
  )
}

/** "Organic Patterns ×2 + Street Art", or "No patches". */
function patchSummary(patches: PatchItem[]): string {
  if (!patches.length) return 'No patches'
  const counts = new Map<string, number>()
  for (const pt of patches) counts.set(pt.style, (counts.get(pt.style) ?? 0) + 1)
  return [...counts].map(([id, n]) => findOption(PATCH, id).name + (n > 1 ? ` ×${n}` : '')).join(' + ')
}

/** Human summary of a configuration, e.g. for the cart line. */
export function describeStella(s: StellaState): string {
  const bag = findBag(s.model)
  const parts = [
    s.wash.slice(0, maxWashes(bag)).map((id) => findOption(WASH, id).name).join(' + '),
    findOption(LINING, s.lining).name,
    patchSummary(s.patches),
  ]
  if (hasHardware(bag)) parts.push(findOption(HW, s.hw).name)
  parts.push(findOption(FINISH, s.finish).name + (s.initials ? ` "${s.initials}"` : ''))
  return parts.join(' · ')
}

const place = (p: Placement) => `${p.side[0]}${r3(p.u)},${r3(p.v)}`

/** Stable key for a configuration, so identical bags merge in the cart.
 *  Decal positions count: the atelier sews them where the customer put them. */
export function stellaKey(s: StellaState): string {
  const bag = findBag(s.model)
  return [
    bag.id,
    s.wash.slice(0, maxWashes(bag)).join('+'),
    s.lining,
    s.patches.map((pt) => `${pt.style}/${pt.size}@${place(pt)}`).join('|'),
    hasHardware(bag) ? s.hw : '',
    s.finish,
    s.initials,
    place(s.mono),
  ].join(':')
}

/** Compact, URL-safe snapshot of a configuration (for the cart link, so the
 *  exact design can be reopened by the customer and the atelier). */
export function encodeStella(s: StellaState): string {
  const c = {
    m: s.model,
    w: s.wash,
    l: s.lining,
    p: s.patches.map((pt) => [pt.style, pt.size, pt.side[0], r3(pt.u), r3(pt.v)]),
    h: s.hw,
    f: s.finish,
    i: s.initials,
    o: [s.mono.side[0], r3(s.mono.u), r3(s.mono.v)],
  }
  return encodeURIComponent(JSON.stringify(c))
}

/** Inverse of encodeStella; anything malformed falls back to defaults. */
export function decodeStella(raw: string): StellaState | null {
  let c: Record<string, unknown>
  try {
    c = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>
  } catch {
    return null
  }
  if (!c || typeof c !== 'object') return null
  const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d)
  const bag = findBag(str(c.m, 'stella'))
  const base = defaultStellaState(bag.id)
  const side = (v: unknown): 'front' | 'back' => (v === 'b' ? 'back' : 'front')
  const washes = Array.isArray(c.w) ? c.w.filter((w): w is string => typeof w === 'string' && WASH.some((o) => o.id === w)) : []
  const patches = Array.isArray(c.p)
    ? c.p.slice(0, STELLA_MAX_PATCHES).flatMap((x): PatchItem[] => {
        if (!Array.isArray(x)) return []
        const size = (['S', 'M', 'L'] as const).find((z) => z === x[1]) ?? 'M'
        return [{ style: findOption(PATCH, str(x[0], '')).id, size, side: side(x[2]), u: clamp01(Number(x[3])), v: clamp01(Number(x[4])) }]
      })
    : base.patches
  const o = Array.isArray(c.o) ? c.o : []
  return {
    model: bag.id,
    wash: washes.length ? [...new Set(washes)].slice(0, maxWashes(bag)) : base.wash,
    lining: findOption(LINING, str(c.l, '')).id,
    patches,
    hw: findOption(HW, str(c.h, '')).id,
    finish: findOption(FINISH, str(c.f, '')).id,
    initials: cleanInitials(str(c.i, '')),
    mono: o.length === 3 ? { side: side(o[0]), u: clamp01(Number(o[1])), v: clamp01(Number(o[2])) } : base.mono,
  }
}
