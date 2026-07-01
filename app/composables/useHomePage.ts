import type { HomePage } from '~/types/content'
import type { StrapiPopulate } from '~/types/strapi'

const HOME_POPULATE: StrapiPopulate = {
  heroMedia: true,
  heroGradient: true,
  sections: true,
  featuredProducts: { populate: { gallery: true, cta: true } },
  seo: { populate: { ogImage: true } },
}

export async function useHomePage() {
  const strapi = useStrapi()

  const { data, pending, error, refresh, status } = await useAsyncData(
    'home-page',
    () => strapi.findSingle<HomePage>('home-page', { populate: HOME_POPULATE }),
  )

  const home = computed<HomePage | null>(() => data.value?.data ?? null)

  return { data, home, pending, error, refresh, status }
}
