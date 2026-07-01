import type { StrapiQueryParams } from '~/types/strapi'

/**
 * Serializes a query object into Strapi's LHS-bracket query syntax
 * (qs-compatible), e.g.
 *   { filters: { slug: { $eq: 'x' } }, populate: ['gallery'], sort: 'order:asc' }
 *   -> filters[slug][$eq]=x&populate[0]=gallery&sort[0]=order:asc
 *
 * Written by hand (no `qs` dependency) and kept pure so it is unit-testable.
 */
function serialize(prefix: string, value: unknown, out: string[]): void {
  if (value === null || value === undefined) return

  if (Array.isArray(value)) {
    value.forEach((entry, index) => serialize(`${prefix}[${index}]`, entry, out))
    return
  }

  if (typeof value === 'object') {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      serialize(`${prefix}[${key}]`, entry, out)
    }
    return
  }

  out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`)
}

export function stringifyStrapiQuery(params: StrapiQueryParams = {}): string {
  const parts: string[] = []

  if (params.populate !== undefined) serialize('populate', params.populate, parts)
  if (params.filters !== undefined) serialize('filters', params.filters, parts)
  if (params.sort !== undefined) serialize('sort', params.sort, parts)
  if (params.pagination !== undefined) serialize('pagination', params.pagination, parts)
  if (params.fields !== undefined) serialize('fields', params.fields, parts)
  if (params.locale !== undefined) serialize('locale', params.locale, parts)

  return parts.join('&')
}
