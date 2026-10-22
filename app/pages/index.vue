<script setup lang="ts">
import { BAGS } from '~/utils/stella/options'

const { t } = useT()
const { home } = await useHomePage()

if (!home.value) {
  throw createError({ statusCode: 404, statusMessage: 'Home page not found' })
}

const featured = computed(() => home.value!.featuredProducts)
const { tutorials } = await useTutorials()

// Journal: the newest tutorial leads, the others follow as small stories.
const LABELS = ['Approfondimenti', 'Tutorial', 'Ispirazioni']
const journal = computed(() => tutorials.value.slice(0, 3))
const dateFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
const dateOf = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : '')

const VALUES = [
  { icon: 'recycle', text: '100% denim recuperato' },
  { icon: 'hand', text: 'Realizzata a mano' },
  { icon: 'spark', text: 'Ogni pezzo è unico' },
] as const

const DETAILS = [
  { img: '/editorial/detail-seam.webp', title: 'Cuciture a vista', text: 'Per celebrare la bellezza del denim autentico.' },
  { img: '/editorial/detail-patchwork.webp', title: 'Patchwork creativo', text: 'Tessuti diversi, un’unica storia.' },
  { img: '/editorial/detail-brass.webp', title: 'Accessori in ottone', text: 'Resistenti, senza tempo.' },
]

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
    <!-- 01 · Hero -->
    <HeroSection :home="home" />

    <!-- Values -->
    <section class="border-y border-fg/10">
      <ul class="site-container grid grid-cols-3 divide-x divide-fg/10">
        <li v-for="v in VALUES" :key="v.text" class="flex flex-col items-center gap-2.5 px-2 py-6 text-center sm:py-7">
          <svg class="h-7 w-7 text-fg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <template v-if="v.icon === 'recycle'">
              <path d="M7.5 9.5 10 5.2a2.3 2.3 0 0 1 4 0l1.3 2.2" />
              <path d="m14 7.6 1.4-.2.4-1.5" />
              <path d="M17.6 11.6 20 16a2.3 2.3 0 0 1-2 3.4h-2.6" />
              <path d="m16.6 18-1.2 1.4 1.2 1.2" />
              <path d="M9.5 19.4H6A2.3 2.3 0 0 1 4 16l1.4-2.4" />
              <path d="m4.4 14.6 1-1.1 1.5.4" />
            </template>
            <template v-else-if="v.icon === 'hand'">
              <path d="M3 15.5h3.2l3.6 2.6c.6.4 1.4.4 2 0l6.6-4.6a1.4 1.4 0 0 0-1.5-2.4l-3.4 2" />
              <path d="M6.2 15.5 9 13h4a1 1 0 0 1 0 2h-2.5" />
              <path d="M14 4.5c-1-1.3-3.4-1-3.4 1.2 0 1.8 3.4 3.8 3.4 3.8s3.4-2 3.4-3.8c0-2.2-2.4-2.5-3.4-1.2Z" />
            </template>
            <template v-else>
              <path d="M12 3.5c.6 4.2 2.3 6.9 6.5 8.5-4.2 1.6-5.9 4.3-6.5 8.5-.6-4.2-2.3-6.9-6.5-8.5 4.2-1.6 5.9-4.3 6.5-8.5Z" />
            </template>
          </svg>
          <span class="text-xs font-semibold sm:text-sm">{{ v.text }}</span>
        </li>
      </ul>
    </section>

    <!-- 02 · The story -->
    <section class="grid items-center lg:grid-cols-2">
      <img
        src="/editorial/workbench.webp"
        alt="Pezzi di denim recuperato sul tavolo da taglio del laboratorio"
        width="1400"
        height="1000"
        loading="lazy"
        class="aspect-[7/5] h-full w-full object-cover lg:rounded-r-[10px]"
      />
      <div class="px-(--site-gutter) py-12 lg:px-16 lg:py-20">
        <UiReveal>
          <div class="max-w-md">
            <span class="ochre-rule" aria-hidden="true" />
            <h2 class="mt-5 text-title">Non si ricomincia da zero.<br />Si riparte da ciò che esiste.</h2>
            <p class="mt-5 text-fg/80">
              Ogni borsa Linea 2 nasce da un’attenta selezione di denim già esistenti, che vengono smontati, ricomposti e
              cuciti a mano, per dare vita a pezzi unici, resistenti e pieni di storia.
            </p>
            <NuxtLink to="/studio" class="arrow-link mt-6">Il nostro approccio</NuxtLink>
          </div>
        </UiReveal>
      </div>
    </section>

    <!-- 03 · Collection -->
    <section class="band py-14 sm:py-16">
      <div class="site-container">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <UiSectionHeading title="Trova la tua forma" subtitle="Ogni modello ha un carattere, proprio come te." />
          <NuxtLink to="/customize" class="arrow-link">Scopri il modello</NuxtLink>
        </div>
        <ul class="mt-9 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-6">
          <li v-for="b in BAGS" :key="b.id">
            <NuxtLink :to="`/customize?model=${b.id}`" class="group block text-center">
              <div class="overflow-hidden rounded-card">
                <img
                  :src="`/editorial/bag-${b.id}.webp`"
                  :alt="`Borsa ${b.name}, ${b.type}`"
                  width="900"
                  height="1080"
                  loading="lazy"
                  class="aspect-[5/6] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
                />
              </div>
              <h3 class="mt-4 font-display text-xl uppercase tracking-[0.14em]">{{ b.name }}</h3>
              <p class="mt-1 text-sm text-muted">{{ b.type }}</p>
              <p class="mt-2 text-sm font-bold">da €{{ b.p }}</p>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- 04 · Customizer -->
    <section class="on-denim overflow-hidden">
      <div class="site-container grid items-center gap-8 py-14 sm:py-16 lg:grid-cols-[1.1fr_1fr]">
        <img
          src="/editorial/bag-stella-dark.webp"
          alt="Borsa Stella su misura, in denim indigo con tracolla chiara"
          width="1200"
          height="1200"
          loading="lazy"
          class="mx-auto w-full max-w-[520px]"
        />
        <UiReveal>
          <div class="max-w-md">
            <span class="ochre-rule" aria-hidden="true" />
            <h2 class="mt-5 text-title">La tua borsa,<br />punto dopo punto.</h2>
            <p class="mt-5 text-fg/85">
              Scegli ogni dettaglio e crea la borsa che parla di te. Dalla forma al lavaggio, dalla fodera agli accessori:
              la personalizzazione è il nostro modo di rendere ogni pezzo davvero tuo.
            </p>
            <div class="mt-6 flex flex-wrap gap-2">
              <NuxtLink
                v-for="chip in ['Lavaggio', 'Fodera', 'Toppe', 'Monogramma']"
                :key="chip"
                to="/customize"
                class="rounded-lg border border-fg/35 px-4 py-2 text-sm transition-colors hover:border-ochre hover:text-ochre"
              >
                {{ chip }}
              </NuxtLink>
            </div>
            <UiBaseButton to="/customize" variant="solid" size="lg" class="mt-7">Inizia a personalizzare</UiBaseButton>
          </div>
        </UiReveal>
      </div>
    </section>

    <!-- 05 · Details -->
    <section class="site-container py-14 sm:py-16">
      <UiSectionHeading title="Ogni dettaglio racconta una storia" />
      <ul class="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
        <li v-for="(d, i) in DETAILS" :key="d.title" :class="{ 'col-span-2 sm:col-span-1': i === 2 }">
          <img :src="d.img" :alt="d.title" width="1200" height="800" loading="lazy" class="aspect-[3/2] w-full rounded-card object-cover" />
          <h3 class="mt-4 font-display text-lg">{{ d.title }}</h3>
          <p class="mt-1 text-sm text-muted">{{ d.text }}</p>
        </li>
      </ul>
    </section>

    <!-- Small pieces from the shop -->
    <section v-if="featured.length" class="band py-14 sm:py-16">
      <div class="site-container">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <UiSectionHeading title="Accessori e piccoli pezzi" subtitle="Foulard, cinture e pochette, dagli scampoli delle nostre borse." />
          <NuxtLink to="/accessories" class="arrow-link">Vedi tutti</NuxtLink>
        </div>
        <div class="mt-9">
          <ProductGrid :products="featured" />
        </div>
      </div>
    </section>

    <!-- 06 · Journal -->
    <section v-if="journal.length" class="site-container py-14 sm:py-16">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <UiSectionHeading title="Appunti di stile, cura e riuso" />
        <NuxtLink to="/editorial" class="arrow-link">Vai al Journal</NuxtLink>
      </div>
      <div class="mt-9 grid gap-6 lg:grid-cols-[1.25fr_2fr]">
        <NuxtLink to="/studio" class="group relative block overflow-hidden rounded-card">
          <img
            src="/editorial/detail-patchwork.webp"
            alt="Patchwork di denim recuperato"
            width="1200"
            height="800"
            loading="lazy"
            class="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] lg:aspect-auto"
          />
          <span class="absolute inset-0 bg-linear-to-t from-denim/70 via-transparent to-transparent" />
          <span class="absolute left-6 top-6 font-display text-4xl italic leading-[1.05] text-ivory sm:text-5xl">Più vita<br />al denim</span>
          <span class="absolute bottom-5 left-6 text-sm font-semibold text-ivory">Il nostro approccio →</span>
        </NuxtLink>
        <ul class="grid gap-6 sm:grid-cols-3">
          <li v-for="(tut, i) in journal" :key="tut.slug">
            <NuxtLink :to="`/tutorials/${tut.slug}`" class="group block">
              <div class="overflow-hidden rounded-card">
                <UiStrapiImage
                  :media="tut.finalResultImage"
                  :width="1200"
                  :height="900"
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 92vw"
                  class="aspect-[4/3] object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
                />
              </div>
              <p class="eyebrow mt-4 text-accent">{{ LABELS[i] }}</p>
              <h3 class="mt-2 font-display text-lg leading-snug">{{ tut.title }}</h3>
              <p class="mt-2 text-xs text-muted">{{ dateOf(tut.publishedAt) }}</p>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- Social -->
    <SocialShowcase />
  </div>
</template>
