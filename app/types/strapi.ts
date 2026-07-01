/**
 * Strapi v5 wire shapes.
 *
 * v5 differs from v4 in ways the whole app depends on:
 *  - attributes are FLATTENED onto the entry (no `data.attributes` wrapper)
 *  - `documentId` (string) is the stable identifier, alongside numeric `id`
 *  - collections carry `meta.pagination`
 *  - media `url`s are RELATIVE (e.g. `/uploads/x.jpg`) and resolved at render
 *
 * Mocks must produce exactly these shapes — that fidelity is what makes the
 * mock→live swap a pure env change.
 */

/** A single generated size variant of an uploaded media file. */
export interface StrapiMediaFormat {
  name: string
  hash: string
  ext: string
  mime: string
  path: string | null
  width: number
  height: number
  size: number
  sizeInBytes?: number
  url: string
}

/** A flattened v5 media (upload) entry. `url`/format `url`s are relative. */
export interface StrapiMedia {
  id: number
  documentId: string
  name: string
  alternativeText: string | null
  caption: string | null
  width: number | null
  height: number | null
  formats: Record<string, StrapiMediaFormat> | null
  hash: string
  ext: string
  mime: string
  size: number
  url: string
  previewUrl: string | null
  provider: string
  provider_metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  publishedAt?: string | null
}

export interface StrapiPagination {
  page: number
  pageSize: number
  pageCount: number
  total: number
}

export interface StrapiResponseMeta {
  pagination?: StrapiPagination
}

/** Envelope for collection-type endpoints (`/api/products`). */
export interface StrapiCollectionResponse<T> {
  data: T[]
  meta: StrapiResponseMeta
}

/** Envelope for single-type endpoints (`/api/home-page`) and findOne. */
export interface StrapiSingleResponse<T> {
  data: T | null
  meta: StrapiResponseMeta
}

/** System fields present on every flattened v5 content entry. */
export interface StrapiEntryMeta {
  id: number
  documentId: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  locale?: string | null
}

/** Query options accepted by the fetch layer, serialized to Strapi syntax. */
export interface StrapiQueryParams {
  populate?: StrapiPopulate
  filters?: Record<string, unknown>
  sort?: string | string[]
  pagination?: { page?: number; pageSize?: number; withCount?: boolean }
  fields?: string[]
  locale?: string
}

export type StrapiPopulate =
  | '*'
  | string[]
  | Record<string, boolean | StrapiQueryParams>
