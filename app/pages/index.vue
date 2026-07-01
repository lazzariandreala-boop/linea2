<script setup lang="ts">
import type { HomeSectionKey } from '~/types/content'

const { t } = useT()
const { home } = await useHomePage()

if (!home.value) {
  throw createError({ statusCode: 404, statusMessage: 'Home page not found' })
}

const SECTION_ROUTE: Record<HomeSectionKey, string> = {
  accessories: '/accessories',
  bags: '/bags',
  tiktok: '/tiktok',
  tutorials: '/tutorials',
}
const SECTION_TONE: Record<HomeSectionKey, 'sage' | 'terracotta' | 'forest' | 'gold'> = {
  accessories: 'sage',
  bags: 'terracotta',
  tiktok: 'forest',
  tutorials: 'gold',
}

const enabledSections = computed(() => home.value!.sections.filter((s) => s.enabled))
const featured = computed(() => home.value!.featuredProducts)

function teaserMedia(key: HomeSectionKey) {
  if (key === 'accessories' || key === 'bags') {
    return featured.value.find((p) => p.category === key)?.gallery[0] ?? null
  }
  return null
}

useSeoHead({
  title: home.value.seo?.metaTitle ?? t((m) => m.brand.tagline),
  description: home.value.seo?.metaDescription ?? home.value.heroSubline,
  image: home.value.seo?.ogImage?.url ?? home.value.heroMedia?.url ?? null,
  imageAlt: home.value.heroMedia?.alternativeText ?? 'Linea 2',
  type: 'website',
})
</script>

<template>
  <div v-if="home">
    <HeroSection :home="home" />

    <!-- Featured products -->
    <section v-if="featured.length" class="site-container py-16 sm:py-20">
      <UiReveal>
        <UiSectionHeading
          :eyebrow="t((m) => m.common.featured)"
          :title="t((m) => m.brand.tagline)"
        />
      </UiReveal>
      <div class="mt-8">
        <ProductGrid :products="featured" />
      </div>
    </section>

    <!-- Section teasers -->
    <section class="site-container py-8 pb-20">
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UiReveal
          v-for="(section, i) in enabledSections"
          :key="section.id"
          as="li"
          :delay="i * 80"
        >
          <SectionTeaser
            :to="SECTION_ROUTE[section.key]"
            :title="section.title"
            :subtitle="section.subtitle ?? undefined"
            :tone="SECTION_TONE[section.key]"
            :media="teaserMedia(section.key)"
          />
        </UiReveal>
      </ul>
    </section>
  </div>
</template>
