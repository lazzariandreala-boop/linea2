import type { Tutorial } from '~/types/content'
import type { StrapiPopulate } from '~/types/strapi'

const TUTORIAL_POPULATE: StrapiPopulate = {
  finalResultImage: true,
  videoFile: true,
  steps: { populate: { image: true } },
  relatedProducts: { populate: { gallery: true, cta: true } },
  cta: true,
  seo: { populate: { ogImage: true } },
}

export async function useTutorials() {
  const strapi = useStrapi()

  const { data, pending, error, refresh, status } = await useAsyncData(
    'tutorials',
    () =>
      strapi.find<Tutorial>('tutorials', {
        populate: TUTORIAL_POPULATE,
        pagination: { pageSize: 50 },
      }),
  )

  const tutorials = computed<Tutorial[]>(() => data.value?.data ?? [])

  return { data, tutorials, pending, error, refresh, status }
}

export async function useTutorial(slug: string) {
  const strapi = useStrapi()

  const { data, pending, error, refresh, status } = await useAsyncData(
    `tutorial:${slug}`,
    () =>
      strapi.find<Tutorial>('tutorials', {
        filters: { slug: { $eq: slug } },
        populate: TUTORIAL_POPULATE,
        pagination: { pageSize: 1 },
      }),
  )

  const tutorial = computed<Tutorial | null>(() => data.value?.data[0] ?? null)

  return { data, tutorial, pending, error, refresh, status }
}
