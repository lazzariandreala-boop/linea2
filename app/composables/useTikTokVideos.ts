import type { TikTokVideo } from '~/types/content'
import type { StrapiPopulate } from '~/types/strapi'

const TIKTOK_POPULATE: StrapiPopulate = { thumbnail: true }

export async function useTikTokVideos() {
  const strapi = useStrapi()

  const { data, pending, error, refresh, status } = await useAsyncData(
    'tiktok-videos',
    () =>
      strapi.find<TikTokVideo>('tiktok-videos', {
        populate: TIKTOK_POPULATE,
        sort: 'order:asc',
        pagination: { pageSize: 50 },
      }),
  )

  const videos = computed<TikTokVideo[]>(() => data.value?.data ?? [])

  return { data, videos, pending, error, refresh, status }
}
