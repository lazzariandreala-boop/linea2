<script setup lang="ts">
import { BAGS, HW, LINING, STELLA_MAX_PATCHES, WASH, findBag } from '~/utils/stella/options'

const { t } = useT()
const { home } = await useHomePage()

if (!home.value) {
  throw createError({ statusCode: 404, statusMessage: 'Home page not found' })
}

const { products: accessories } = await useProducts({ category: 'accessories', pageSize: 4 })
const { tutorials } = await useTutorials()
const journalLead = computed(() => tutorials.value[0] ?? null)
const journalMore = computed(() => tutorials.value.slice(1, 3))

const headlineLines = computed(() => home.value!.heroHeadline.split('\n'))

// Collection: Stella leads, the other five follow. Prices live in BAGS.
const lead = findBag('stella')
const others = BAGS.filter((b) => b.id !== lead.id)
const leadImage = bagImage(lead.id, lead.name, lead.type)
const fromPrice = Math.min(...BAGS.map((b) => b.p))

const PROOF = [
  { n: '01', title: 'Denim recuperato', text: 'Jeans già esistenti, scuciti e ricomposti.' },
  { n: '02', title: 'Lavorazione artigianale', text: 'Tagliata e cucita a mano in laboratorio.' },
  { n: '03', title: 'Pezzi unici', text: 'Ogni lavaggio e ogni tasca la rendono diversa.' },
]

// What the configurator really offers, counted from its own data.
const STEPS = [
  { title: 'Modello', text: `${BAGS.length} forme, da ${formatPrice(fromPrice)}` },
  { title: 'Lavaggio del denim', text: `${WASH.length} lavaggi, dal vintage chiaro al nero` },
  { title: 'Fodera', text: `${LINING.length} fodere, visibili a borsa aperta` },
  { title: 'Toppe patchwork', text: `Fino a ${STELLA_MAX_PATCHES}, da posizionare dove vuoi` },
  { title: 'Accessori in metallo', text: `${HW.length} finiture, sul modello Stella` },
  { title: 'Monogramma', text: 'Sempre presente, con le tue iniziali' },
]
const SWATCHES = WASH.slice(0, 6)

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
    <!-- A · Hero -->
    <section class="hero grid lg:grid-cols-[1fr_1fr]">
      <div class="order-2 flex flex-col justify-center px-(--site-gutter) pb-12 pt-10 lg:order-1 sm:pb-16 sm:pt-14 lg:py-20 lg:pr-16 lg:pl-[max(var(--site-gutter),calc((100vw-var(--site-max))/2+var(--site-gutter)))]">
        <p class="kicker">Borse su ordinazione</p>
        <h1 class="mt-6 text-hero">
          <template v-for="(line, i) in headlineLines" :key="i">
            <span :class="{ 'italic text-indigo': i === headlineLines.length - 1 }">{{ line }}</span><br v-if="i < headlineLines.length - 1" />
          </template>
        </h1>
        <p class="mt-7 max-w-md text-lead text-fg/80">{{ home.heroSubline }}</p>
        <div class="mt-9 grid gap-3 sm:flex sm:flex-wrap">
          <UiBaseButton to="/customize" size="lg">Personalizza la tua borsa</UiBaseButton>
          <UiBaseButton to="/shop" variant="outline" size="lg">Scopri la collezione</UiBaseButton>
        </div>
        <ul class="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-5 sm:gap-6">
          <li v-for="p in PROOF" :key="p.n">
            <span class="text-[11px] tabular-nums text-accent">{{ p.n }}</span>
            <p class="mt-1.5 text-[13px] font-medium leading-snug text-ink">{{ p.title }}</p>
          </li>
        </ul>
      </div>

      <div class="relative order-1 h-[58svh] max-h-[640px] min-h-[360px] sm:h-[74svh] sm:max-h-[860px] bg-surface-2 lg:order-2 lg:h-auto lg:max-h-none lg:min-h-0">
        <img
          :src="EDITORIAL.hero.src"
          :alt="home.heroMedia?.alternativeText ?? EDITORIAL.hero.alt"
          :width="EDITORIAL.hero.width"
          :height="EDITORIAL.hero.height"
          fetchpriority="high"
          class="absolute inset-0 h-full w-full object-cover object-[50%_60%]"
        />
        <p class="absolute bottom-5 left-(--site-gutter) text-[11px] uppercase tracking-[0.2em] text-ink/70 lg:left-8">
          Stella · {{ lead.type }}
        </p>
      </div>
    </section>

    <!-- B · The story -->
    <section class="site-container section-y grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
      <div class="media aspect-[7/5] lg:col-span-7">
        <img
          :src="EDITORIAL.workbench.src"
          :alt="EDITORIAL.workbench.alt"
          :width="EDITORIAL.workbench.width"
          :height="EDITORIAL.workbench.height"
          loading="lazy"
          decoding="async"
        />
      </div>
      <UiReveal class="lg:col-span-5 lg:col-start-8">
        <p class="kicker">Il nostro approccio</p>
        <h2 class="mt-5 text-[clamp(1.9rem,3vw,2.75rem)] leading-[1.08]">
          Non si ricomincia da zero.
          <span class="italic text-indigo">Si riparte da ciò che esiste.</span>
        </h2>
        <p class="mt-6 text-fg/80">
          Ogni borsa Linea 2 nasce da un’attenta selezione di jeans già esistenti. Li smontiamo, scegliamo i pezzi
          migliori e li ricomponiamo a mano: il lavaggio, le sbiaditure e le vecchie cuciture diventano parte del
          disegno.
        </p>
        <NuxtLink to="/studio" class="arrow-link mt-8">Scopri come lavoriamo</NuxtLink>
      </UiReveal>
    </section>

    <!-- C · Core collection -->
    <section class="band section-y border-y border-line" aria-labelledby="collection-title">
      <div class="site-container">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p class="kicker">La collezione</p>
            <h2 id="collection-title" class="mt-4 text-display">Sei forme, un solo materiale</h2>
          </div>
          <NuxtLink to="/shop" class="arrow-link">Tutta la collezione</NuxtLink>
        </div>

        <!-- Featured model -->
        <NuxtLink :to="`/customize?model=${lead.id}`" class="group mt-12 grid items-center gap-8 md:grid-cols-12 md:gap-10">
          <div class="media aspect-[5/6] md:col-span-6 lg:col-span-5">
            <img :src="leadImage.src" :alt="leadImage.alt" :width="leadImage.width" :height="leadImage.height" loading="lazy" decoding="async" class="zoom-img" />
          </div>
          <div class="md:col-span-6 lg:col-span-6 lg:col-start-7">
            <p class="meta">In evidenza · {{ lead.type }}</p>
            <h3 class="mt-4 font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-none text-ink">{{ lead.name }}</h3>
            <p class="mt-6 max-w-md text-fg/80">
              Il nostro modello a secchiello, da portare a tracolla. È l’unico con due lavaggi, uno per il corpo e uno
              per tracolla e linguetta, e con gli accessori in metallo a scelta.
            </p>
            <p class="price-tag mt-6 text-lg text-ink">da {{ formatPrice(lead.p) }}</p>
            <span class="arrow-link mt-8">Personalizza la {{ lead.name }}</span>
          </div>
        </NuxtLink>

        <!-- The other five: a rail on phones, one row on desktop -->
        <ul class="rail no-scrollbar mt-16 -mx-(--site-gutter) flex snap-x snap-mandatory gap-4 overflow-x-auto px-(--site-gutter) pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible lg:px-0" aria-label="Altri modelli">
          <li v-for="b in others" :key="b.id" class="w-[68%] shrink-0 snap-start xs:w-[44%] md:w-[30%] lg:w-auto">
            <BagTile :bag="b" />
          </li>
        </ul>
      </div>
    </section>

    <!-- D · Customization -->
    <section class="on-denim overflow-hidden" aria-labelledby="custom-title">
      <div class="site-container section-y grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div class="lg:col-span-6">
          <div class="atelier-frame relative mx-auto aspect-square w-full max-w-[560px]">
            <img
              v-for="(src, i) in ['/bags2d/stella/front-body-indigo.webp', '/bags2d/stella/front-accent-vintage.webp', '/bags2d/stella/front-hw-brass.webp']"
              :key="src"
              :src="src"
              :alt="i === 0 ? 'Anteprima del configuratore: borsa Stella in denim Deep Indigo con tracolla Vintage Light Blue e anelli in ottone' : ''"
              width="1200"
              height="1200"
              loading="lazy"
              decoding="async"
              class="absolute inset-[6%] h-[88%] w-[88%] object-contain"
            />
            <div class="absolute bottom-4 left-4 flex gap-1.5" aria-hidden="true">
              <span
                v-for="w in SWATCHES"
                :key="w.id"
                class="h-7 w-7 rounded-xs border border-ivory/25 bg-cover"
                :style="{ backgroundImage: `url(/bags2d/swatches/wash-${w.id}.png)` }"
              />
            </div>
          </div>
        </div>

        <div class="lg:col-span-5 lg:col-start-8">
          <p class="kicker">Su misura</p>
          <h2 id="custom-title" class="mt-5 text-display">La tua borsa, <span class="italic">punto dopo punto.</span></h2>
          <p class="mt-6 max-w-md text-fg/80">
            Scegli forma, lavaggio, fodera, toppe e monogramma, e guarda la borsa cambiare mentre la componi. Poi la
            cuciamo su ordinazione, esattamente come l’hai disegnata.
          </p>
          <ol class="mt-10 border-t border-line">
            <li v-for="(s, i) in STEPS" :key="s.title" class="grid grid-cols-[2.5rem_1fr] items-baseline gap-2 border-b border-line py-3.5">
              <span class="text-xs tabular-nums text-accent">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <span class="font-display text-lg text-ivory">{{ s.title }}</span>
                <span class="text-xs text-muted">{{ s.text }}</span>
              </span>
            </li>
          </ol>
          <div class="mt-10 flex flex-wrap items-center gap-6">
            <UiBaseButton to="/customize" size="lg">Inizia a personalizzare</UiBaseButton>
            <span class="text-sm text-muted">Anteprima anche in 3D</span>
          </div>
        </div>
      </div>
    </section>

    <!-- E · Craftsmanship and materials -->
    <section class="site-container section-y" aria-labelledby="craft-title">
      <div class="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div class="lg:col-span-6">
          <p class="kicker">Materiali e lavorazione</p>
          <h2 id="craft-title" class="mt-4 text-display">Il dettaglio racconta la storia</h2>
        </div>
        <p class="max-w-md text-fg/80 lg:col-span-5 lg:col-start-8">
          Nessuna borsa è uguale a un’altra: dipende dai jeans da cui nasce. Le cuciture restano a vista, i lavaggi si
          accostano come in un patchwork, gli accessori sono in ottone.
        </p>
      </div>

      <div class="mt-12 grid gap-x-6 gap-y-10 md:grid-cols-12">
        <figure class="md:col-span-7 md:row-span-2">
          <div class="media aspect-[4/3] md:aspect-auto md:h-[calc(100%-4rem)]">
            <img :src="EDITORIAL.seam.src" :alt="EDITORIAL.seam.alt" :width="EDITORIAL.seam.width" :height="EDITORIAL.seam.height" loading="lazy" decoding="async" />
          </div>
          <figcaption class="mt-4 flex gap-4">
            <span class="text-xs tabular-nums text-accent">01</span>
            <span><strong class="font-medium text-ink">Cuciture a vista.</strong> <span class="text-muted">Il filo segue il bordo di ogni pannello, senza nasconderlo.</span></span>
          </figcaption>
        </figure>
        <figure class="md:col-span-5">
          <div class="media aspect-[3/2]">
            <img :src="EDITORIAL.patchwork.src" :alt="EDITORIAL.patchwork.alt" :width="EDITORIAL.patchwork.width" :height="EDITORIAL.patchwork.height" loading="lazy" decoding="async" />
          </div>
          <figcaption class="mt-4 flex gap-4">
            <span class="text-xs tabular-nums text-accent">02</span>
            <span><strong class="font-medium text-ink">Denim ricomposto.</strong> <span class="text-muted">Lavaggi diversi, accostati in un unico pezzo.</span></span>
          </figcaption>
        </figure>
        <figure class="md:col-span-5">
          <div class="media aspect-[3/2]">
            <img :src="EDITORIAL.brass.src" :alt="EDITORIAL.brass.alt" :width="EDITORIAL.brass.width" :height="EDITORIAL.brass.height" loading="lazy" decoding="async" />
          </div>
          <figcaption class="mt-4 flex gap-4">
            <span class="text-xs tabular-nums text-accent">03</span>
            <span><strong class="font-medium text-ink">Accessori in ottone.</strong> <span class="text-muted">Resistenti, e invecchiano bene.</span></span>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- F · Accessories -->
    <section v-if="accessories.length" class="band section-y border-y border-line" aria-labelledby="acc-title">
      <div class="site-container grid gap-10 lg:grid-cols-12">
        <div class="lg:col-span-3">
          <p class="kicker">Accanto alle borse</p>
          <h2 id="acc-title" class="mt-4 text-title">Accessori</h2>
          <p class="mt-4 text-sm text-muted">
            Una piccola selezione da abbinare alle borse in denim: foulard, occhiali e altri pezzi pensati per durare.
          </p>
          <NuxtLink to="/accessories" class="arrow-link mt-8">Tutti gli accessori</NuxtLink>
        </div>
        <ul class="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:col-span-9 lg:gap-x-6">
          <li v-for="p in accessories.slice(0, 3)" :key="p.documentId" class="last:hidden sm:last:block">
            <ProductCard :product="p" sizes="(min-width: 1024px) 22vw, (min-width: 640px) 31vw, 46vw" />
          </li>
        </ul>
      </div>
    </section>

    <!-- G · Journal -->
    <section v-if="journalLead" class="site-container section-y" aria-labelledby="journal-title">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="kicker">Journal</p>
          <h2 id="journal-title" class="mt-4 text-display">Stile, cura e riuso</h2>
        </div>
        <NuxtLink to="/editorial" class="arrow-link">Vai al Journal</NuxtLink>
      </div>

      <div class="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-8">
        <NuxtLink :to="`/tutorials/${journalLead.slug}`" class="group lg:col-span-7">
          <UiStrapiImage
            :media="journalLead.finalResultImage"
            :width="1200"
            :height="900"
            sizes="(min-width: 1024px) 55vw, 92vw"
            rounded
            img-class="zoom-img"
          />
          <p class="meta mt-6">Tutorial</p>
          <h3 class="mt-3 font-display text-[clamp(1.6rem,2.6vw,2.25rem)] leading-tight text-ink">{{ journalLead.title }}</h3>
          <p class="mt-3 max-w-lg text-muted">{{ journalLead.description }}</p>
        </NuxtLink>
        <ul class="grid content-start gap-8 lg:col-span-4 lg:col-start-9">
          <li v-for="tut in journalMore" :key="tut.slug" class="border-t border-line pt-6 first:border-0 first:pt-0 lg:first:border-t lg:first:pt-6">
            <NuxtLink :to="`/tutorials/${tut.slug}`" class="group grid grid-cols-[7.5rem_1fr] gap-5 sm:grid-cols-[10rem_1fr]">
              <UiStrapiImage :media="tut.finalResultImage" :width="1200" :height="900" sizes="160px" rounded img-class="zoom-img" />
              <span>
                <span class="meta block">Tutorial</span>
                <span class="mt-2 block font-display text-xl leading-snug text-ink">{{ tut.title }}</span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- H · Social and studio -->
    <SocialShowcase />
  </div>
</template>

<style scoped>
@media (min-width: 1024px) {
  .hero {
    min-height: min(calc(100svh - var(--header-h) - 32px), 860px);
  }
}
.atelier-frame {
  border-radius: var(--radius-card);
  background:
    radial-gradient(60% 55% at 50% 42%, rgb(245 241 232 / 0.1), transparent 70%),
    linear-gradient(180deg, #1b3147 0%, #18293b 72%, #13212f 72.3%, #172636 100%);
  border: 1px solid rgb(245 241 232 / 0.12);
}
</style>
