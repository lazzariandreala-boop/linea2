import type { Product, ProductCategory } from '~/types/content'
import type { StrapiPopulate, StrapiQueryParams } from '~/types/strapi'

// Populate tree the live API needs for cards + detail (ignored in mock mode).
const PRODUCT_POPULATE: StrapiPopulate = {
  gallery: true,
  cta: true,
  seo: { populate: { ogImage: true } },
}

export interface UseProductsOptions {
  category?: ProductCategory
  featured?: boolean
  sort?: string
  page?: number
  pageSize?: number
}

export async function useProducts(opts: UseProductsOptions = {}) {
  const strapi = useStrapi()

  const params: StrapiQueryParams = {
    populate: PRODUCT_POPULATE,
    sort: opts.sort ?? 'createdAt:desc',
    pagination: { page: opts.page ?? 1, pageSize: opts.pageSize ?? 24 },
  }

  const filters: Record<string, unknown> = {}
  if (opts.category) filters.category = { $eq: opts.category }
  if (opts.featured !== undefined) filters.featured = { $eq: opts.featured }
  if (Object.keys(filters).length) params.filters = filters

  const key = `products:${opts.category ?? 'all'}:${opts.featured ?? 'any'}:${opts.sort ?? 'default'}:${opts.page ?? 1}`

  const { data, pending, error, refresh, status } = await useAsyncData(key, () =>
    strapi.find<Product>('products', params),
  )

  const products = computed<Product[]>(() => data.value?.data ?? [])
  const pagination = computed(() => data.value?.meta.pagination ?? null)

  return { data, products, pagination, pending, error, refresh, status }
}

export async function useProduct(slug: string) {
  const strapi = useStrapi()

  const { data, pending, error, refresh, status } = await useAsyncData(
    `product:${slug}`,
    () =>
      strapi.find<Product>('products', {
        filters: { slug: { $eq: slug } },
        populate: PRODUCT_POPULATE,
        pagination: { pageSize: 1 },
      }),
  )

  const product = computed<Product | null>(() => data.value?.data[0] ?? null)

  return { data, product, pending, error, refresh, status }
}
