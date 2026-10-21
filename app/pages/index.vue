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

const VALUES = [
  { title: 'Luxury', text: 'Tagliate e cucite a mano nel nostro studio, con accessori in ottone e dettagli in pelle.' },
  { title: 'Upcycled', text: 'Fatte con jeans di seconda mano: ogni lavaggio, sbiaditura e tasca fa parte del disegno.' },
  { title: 'Sustainable', text: 'Niente denim nuovo. Gli scarti diventano pochette e sacchettini di Natale.' },
]

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

    <!-- Brand values (LUXURY | UPCYCLED | SUSTAINABLE) -->
    <section class="site-container">
      <ul class="grid gap-px overflow-hidden rounded-card border border-fg/10 bg-fg/10 sm:grid-cols-3">
        <li v-for="v in VALUES" :key="v.title" class="bg-bg p-5">
          <h2 class="text-sm tracking-[0.12em] text-brass-hi">{{ v.title }}</h2>
          <p class="mt-2 text-sm text-fg/70">{{ v.text }}</p>
        </li>
      </ul>
    </section>

    <!-- Configurator teaser -->
    <section class="site-container pt-16 sm:pt-20">
      <UiReveal>
        <div class="panel-glass grid gap-6 rounded-[22px] p-6 sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p class="eyebrow text-accent">Customize</p>
            <h2 class="mt-3 text-display text-fg">Design your Stella bag</h2>
            <p class="mt-3 max-w-xl text-fg/70">
              Scegli fino a due lavaggi di denim, la fodera, la toppa patchwork, gli accessori in metallo e le tue
              iniziali. La vedi cambiare in 3D mentre la componi, e la cuciamo su ordinazione.
            </p>
          </div>
          <UiBaseButton to="/customize" variant="solid" size="lg">Start customizing</UiBaseButton>
        </div>
      </UiReveal>
    </section>

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
