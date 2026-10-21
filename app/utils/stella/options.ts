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
  /** Monogram decal; its height is half its width (512×256 canvas). */
  mono: { y: number; w: number }
}

export const BAGS: BagModel[] = [
  {
    id: 'stella', name: 'Stella', title: 'Stella Bucket Bag', type: 'Bucket crossbody', p: 360,
    url: '/models/stella.glb', thumb: '/models/thumbs/stella.jpg', kind: 'parts',
    patch: { y: 0.31, w: 0.8, h: 0.56 }, mono: { y: 0.655, w: 0.26 },
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

export interface StellaState {
  /** Bag model id (see BAGS). */
  model: string
  /** One or two washes: [body, accent on strap + tab]. */
  wash: string[]
  lining: string
  patch: string
  hw: string
  finish: string
  /** Up to 3 letters, only used when a finish other than "none" is picked. */
  initials: string
}

export const STELLA_INITIALS_PRICE = 15
export const STELLA_MAX_WASHES = 2
export const STELLA_THREAD = '#C2A26B'

export const WASH: StellaOption[] = [
  { id: 'vintage', name: 'Vintage Light Blue', hex: '#86A6CC', p: 0 },
  { id: 'indigo', name: 'Deep Indigo', hex: '#1F2C4C', p: 0 },
  { id: 'black', name: 'Textured Black', hex: '#232427', p: 10, textured: true },
  { id: 'raw', name: 'Distressed raw', hex: '#33558A', p: 20, distressed: true },
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
  { id: 'none', name: 'None', p: 0 },
]

export const HW: StellaOption[] = [
  { id: 'brass', name: 'Brass', hex: '#B6965A', p: 0 },
  { id: 'silver', name: 'Silver', hex: '#C9CDD3', p: 0 },
  { id: 'black', name: 'Black Steel', hex: '#34363B', p: 10 },
]

export const FINISH: StellaOption[] = [
  { id: 'embroidery', name: 'Brass Stitch', p: 0 },
  { id: 'leather', name: 'Leather Patch', p: 15 },
  { id: 'none', name: 'None', p: 0 },
]

export const STELLA_GROUPS: { key: StellaGroup; tab: string; title: string; list: StellaOption[] }[] = [
  { key: 'wash', tab: 'Denim wash', title: 'Base Denim', list: WASH },
  { key: 'lining', tab: 'Lining', title: 'Interior', list: LINING },
  { key: 'patch', tab: 'Patches', title: 'Patchwork Style', list: PATCH },
  { key: 'hw', tab: 'Hardware', title: 'Hardware', list: HW },
  { key: 'finish', tab: 'Finish', title: 'Monogram', list: FINISH },
]

export function defaultStellaState(): StellaState {
  return { model: 'stella', wash: ['indigo', 'vintage'], lining: 'floral', patch: 'organic', hw: 'brass', finish: 'embroidery', initials: '' }
}

/** Look up an option by id, falling back to the first entry. */
export function findOption(list: StellaOption[], id: string): StellaOption {
  return list.find((o) => o.id === id) ?? list[0]!
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

/** Switch bag model, trimming choices the new model can't take. */
export function withModel(s: StellaState, model: string): StellaState {
  const bag = findBag(model)
  return { ...s, model: bag.id, wash: s.wash.slice(0, maxWashes(bag)) }
}

export function stellaPrice(s: StellaState): number {
  const bag = findBag(s.model)
  const washes = s.wash.slice(0, maxWashes(bag)).reduce((sum, id) => sum + findOption(WASH, id).p, 0)
  const initials = s.initials && s.finish !== 'none' ? STELLA_INITIALS_PRICE : 0
  return (
    bag.p +
    washes +
    findOption(LINING, s.lining).p +
    findOption(PATCH, s.patch).p +
    (hasHardware(bag) ? findOption(HW, s.hw).p : 0) +
    findOption(FINISH, s.finish).p +
    initials
  )
}

/** Human summary of a configuration, e.g. for the cart line. */
export function describeStella(s: StellaState): string {
  const bag = findBag(s.model)
  const parts = [
    s.wash.slice(0, maxWashes(bag)).map((id) => findOption(WASH, id).name).join(' + '),
    findOption(LINING, s.lining).name,
    findOption(PATCH, s.patch).name,
  ]
  if (hasHardware(bag)) parts.push(findOption(HW, s.hw).name)
  if (s.finish !== 'none') parts.push(findOption(FINISH, s.finish).name + (s.initials ? ` "${s.initials}"` : ''))
  return parts.join(' · ')
}

/** Stable key for a configuration, so identical bags merge in the cart. */
export function stellaKey(s: StellaState): string {
  const bag = findBag(s.model)
  return [
    bag.id,
    s.wash.slice(0, maxWashes(bag)).join('+'),
    s.lining,
    s.patch,
    hasHardware(bag) ? s.hw : '',
    s.finish,
    s.finish === 'none' ? '' : s.initials,
  ].join(':')
}
