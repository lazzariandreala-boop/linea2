import type {
  StrapiCollectionResponse,
  StrapiQueryParams,
} from '~/types/strapi'
import type {
  CtaComponent,
  CtaKind,
  GradientComponent,
  SeoComponent,
} from '~/types/content'
import type { StrapiMedia } from '~/types/strapi'

export { media, MOCK_TS } from './media'

let ctaSeq = 1
let seoSeq = 1
let gradSeq = 1

export function cta(kind: CtaKind, value: string, label: string): CtaComponent {
  return { id: ctaSeq++, kind, value, label }
}

export function seo(
  metaTitle: string,
  metaDescription: string,
  ogImage: StrapiMedia | null = null,
): SeoComponent {
  return { id: seoSeq++, metaTitle, metaDescription, ogImage }
}

export function gradient(
  from: string,
  via: string | null,
  to: string,
  angle = 145,
): GradientComponent {
  return { id: gradSeq++, from, via, to, angle }
}

/**
 * Emulates Strapi's server-side query handling (filters `$eq`, sort, pagination)
 * so a mock collection behaves like the live endpoint and the per-type
 * composables need zero awareness of which mode they run in.
 */
export function applyCollection<T>(
  items: T[],
  params: StrapiQueryParams = {},
): StrapiCollectionResponse<T> {
  // Field access is dynamic (filter/sort by key), so read through a record view.
  const asRecord = (item: T) => item as Record<string, unknown>
  let result = [...items]

  const filters = params.filters ?? {}
  for (const [field, cond] of Object.entries(filters)) {
    const expected =
      cond && typeof cond === 'object' && '$eq' in (cond as Record<string, unknown>)
        ? (cond as { $eq: unknown }).$eq
        : cond
    result = result.filter((item) => asRecord(item)[field] === expected)
  }

  if (params.sort) {
    const spec = Array.isArray(params.sort) ? params.sort[0] : params.sort
    if (spec) {
      const [field, dir = 'asc'] = spec.split(':')
      result.sort((a, b) => {
        const av = asRecord(a)[field as string]
        const bv = asRecord(b)[field as string]
        if (av === bv) return 0
        const cmp = (av as number) > (bv as number) ? 1 : -1
        return dir === 'desc' ? -cmp : cmp
      })
    }
  }

  const page = params.pagination?.page ?? 1
  const pageSize = params.pagination?.pageSize ?? 25
  const total = result.length
  const start = (page - 1) * pageSize
  const data = result.slice(start, start + pageSize)

  return {
    data,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
        total,
      },
    },
  }
}
