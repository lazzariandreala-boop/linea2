/**
 * Stella configurator catalogue: every choice the customer can make, with its
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

export interface StellaState {
  /** One or two washes: [body, accent on strap + tab]. */
  wash: string[]
  lining: string
  patch: string
  hw: string
  finish: string
  /** Up to 3 letters, only used when a finish other than "none" is picked. */
  initials: string
}

export const STELLA_BASE_PRICE = 360
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
  return { wash: ['indigo', 'vintage'], lining: 'floral', patch: 'organic', hw: 'brass', finish: 'embroidery', initials: '' }
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
export function toggleWash(current: string[], id: string): string[] {
  if (current.includes(id)) return current.length > 1 ? current.filter((w) => w !== id) : current
  const next = [...current, id]
  return next.length > STELLA_MAX_WASHES ? next.slice(next.length - STELLA_MAX_WASHES) : next
}

export function stellaPrice(s: StellaState): number {
  const washes = s.wash.reduce((sum, id) => sum + findOption(WASH, id).p, 0)
  const initials = s.initials && s.finish !== 'none' ? STELLA_INITIALS_PRICE : 0
  return (
    STELLA_BASE_PRICE +
    washes +
    findOption(LINING, s.lining).p +
    findOption(PATCH, s.patch).p +
    findOption(HW, s.hw).p +
    findOption(FINISH, s.finish).p +
    initials
  )
}

/** Human summary of a configuration, e.g. for the cart line. */
export function describeStella(s: StellaState): string {
  const parts = [
    s.wash.map((id) => findOption(WASH, id).name).join(' + '),
    findOption(LINING, s.lining).name,
    findOption(PATCH, s.patch).name,
    findOption(HW, s.hw).name,
  ]
  if (s.finish !== 'none') parts.push(findOption(FINISH, s.finish).name + (s.initials ? ` "${s.initials}"` : ''))
  return parts.join(' · ')
}

/** Stable key for a configuration, so identical bags merge in the cart. */
export function stellaKey(s: StellaState): string {
  return ['stella', s.wash.join('+'), s.lining, s.patch, s.hw, s.finish, s.finish === 'none' ? '' : s.initials].join(':')
}
