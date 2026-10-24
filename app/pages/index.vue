<script setup lang="ts">
import {
  BAGS,
  LINING,
  WASH,
  defaultStellaState,
  encodeStella,
  findBag,
  findOption,
  hasHardware,
  maxWashes,
  stellaPrice,
  type BagModel,
} from '~/utils/stella/options'

const { t } = useT()
const { home } = await useHomePage()

if (!home.value) {
  throw createError({ statusCode: 404, statusMessage: 'Home page not found' })
}

const { tutorials } = await useTutorials()
const journal = computed(() => tutorials.value.slice(0, 3))

/** The headline's last line is the gold italic word, as in the brand pages. */
const headlineLines = computed(() => home.value!.heroHeadline.split('\n'))

const fromPrice = Math.min(...BAGS.map((b) => b.p))

const STATS = [
  { n: String(BAGS.length), label: 'Modelli di borsa' },
  { n: String(WASH.length), label: 'Lavaggi di denim' },
  { n: String(LINING.length), label: 'Fodere a scelta' },
  { n: '100%', label: 'Cucito a mano' },
]

const PILLARS = [
  { icon: 'recycle', title: 'Denim recuperato', text: 'Jeans già esistenti, scuciti e ricomposti: niente tessuto nuovo.' },
  { icon: 'scissors', title: 'Lavorazione artigianale', text: 'Ogni pezzo è tagliato e cucito a mano in laboratorio.' },
]

// ── Collection ─────────────────────────────────────────────────────────
/** How each model is worn, for the collection filter. */
const WEAR: Record<string, string> = {
  stella: 'A tracolla',
  luna: 'A spalla',
  viaggio: 'A spalla',
  sole: 'Tote',
  atelier: 'Tote',
  trama: 'Tote',
}
const FILTERS = ['Tutte', ...new Set(BAGS.map((b) => WEAR[b.id] ?? 'Tote'))]
const activeFilter = ref('Tutte')
const filteredBags = computed(() =>
  activeFilter.value === 'Tutte' ? BAGS : BAGS.filter((b) => (WEAR[b.id] ?? 'Tote') === activeFilter.value),
)
const bagSpecs = (b: BagModel) => [
  maxWashes(b) > 1 ? 'Fino a 2 lavaggi' : '1 lavaggio a scelta',
  hasHardware(b) ? 'Metalli a scelta' : 'Toppe fino a 4',
]

const selectedBag = ref<BagModel | null>(null)
const lightboxClose = ref<HTMLButtonElement | null>(null)
let lastFocus: HTMLElement | null = null
function openBag(b: BagModel) {
  lastFocus = document.activeElement as HTMLElement | null
  selectedBag.value = b
  document.documentElement.style.overflow = 'hidden'
  void nextTick(() => lightboxClose.value?.focus())
}
function closeBag() {
  selectedBag.value = null
  document.documentElement.style.overflow = ''
  lastFocus?.focus({ preventScroll: true })
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && selectedBag.value) closeBag()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.documentElement.style.overflow = ''
})

// ── What we make ───────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: 'pen',
    kicker: 'Su ordinazione',
    title: 'Borse su misura',
    text: 'Scegli forma, lavaggio, fodera, toppe e la posizione dell’etichetta Linea 2: la borsa viene cucita esattamente come l’hai composta.',
    to: '/customize',
    cta: 'Personalizza',
  },
  {
    icon: 'bag',
    kicker: 'Pronte da spedire',
    title: 'Borse pronte',
    text: 'Pezzi già finiti, nati dai jeans che arrivano in laboratorio. Ognuno è unico: quando è venduto, non torna.',
    to: '/bags',
    cta: 'Vedi le borse pronte',
  },
  {
    icon: 'gift',
    kicker: 'Piccoli pezzi',
    title: 'Accessori',
    text: 'Dagli scarti delle borse nascono pochette, sacchettini di Natale e altri piccoli accessori in tessuto.',
    to: '/accessories',
    cta: 'Vedi gli accessori',
  },
  {
    icon: 'play',
    kicker: 'Dal laboratorio',
    title: 'Video e tutorial',
    text: 'Il lavoro di ogni giorno su Instagram e TikTok, e le guide per abbinare e curare il denim.',
    to: '/editorial',
    cta: 'Vai al Journal',
  },
]

// ── Denim washes (swatch picker) ───────────────────────────────────────
const selectedWash = ref(WASH.find((w) => w.id === 'indigo') ?? WASH[0]!)
function applyWash() {
  pickWash.value = selectedWash.value.id
  step.value = 2
  document.getElementById('configuratore')?.scrollIntoView({ behavior: 'smooth' })
}
const washTone = (fade: number) => (fade > 0.6 ? 'Chiaro e sbiadito' : fade > 0.3 ? 'Medio, vissuto' : 'Scuro, pieno')

// ── Mini configurator: the first choices, then on to /customize ───────
const STEP_NAMES = ['Modello', 'Lavaggio e fodera', 'Riepilogo']
const step = ref(1)
const pickModel = ref('stella')
const pickWash = ref('indigo')
const pickLining = ref('floral')

const draft = computed(() => {
  const s = defaultStellaState(pickModel.value)
  const bag = findBag(pickModel.value)
  s.wash = maxWashes(bag) > 1 ? [pickWash.value, s.wash[1] ?? pickWash.value] : [pickWash.value]
  s.lining = pickLining.value
  return s
})
const draftBag = computed(() => findBag(pickModel.value))
const draftPrice = computed(() => stellaPrice(draft.value))
const draftLink = computed(() => `/customize?model=${pickModel.value}&cfg=${encodeStella(draft.value)}`)
/** Front view, layered as in the configurator (body, then strap and rings on Stella). */
const draftLayers = computed(() => {
  const d = `/bags2d/${pickModel.value}`
  const s = draft.value
  if (draftBag.value.kind !== 'parts') return [`${d}/front-all-${s.wash[0]}.webp`]
  return [`${d}/front-body-${s.wash[0]}.webp`, `${d}/front-accent-${s.wash[1] ?? s.wash[0]}.webp`, `${d}/front-hw-${s.hw}.webp`]
})
const draftTop = computed(() => `/bags2d/${pickModel.value}/top-${pickWash.value}-${pickLining.value}.webp`)

// ── Contact: the message opens in WhatsApp, nothing is stored ──────────
const contact = reactive({ name: '', message: '' })
const waLink = computed(() => {
  const text = [contact.name && `Ciao, sono ${contact.name}.`, contact.message].filter(Boolean).join(' ')
  return `${SOCIAL_LINKS.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`
})
function sendContact() {
  window.open(waLink.value, '_blank', 'noopener')
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
    <!-- ───────── Hero ───────── -->
    <section class="relative flex min-h-svh items-center justify-center overflow-hidden border-b border-white/5 pt-32 pb-16">
      <div class="absolute inset-0 -z-0" aria-hidden="true">
        <img
          :src="EDITORIAL.hero.src"
          alt=""
          :width="EDITORIAL.hero.width"
          :height="EDITORIAL.hero.height"
          fetchpriority="high"
          class="hero-img h-full w-full rounded-none object-cover object-[50%_60%] opacity-30"
        />
        <div class="absolute inset-0 bg-linear-to-t from-graphite via-graphite/70 to-graphite/40" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-graphite)_100%)] opacity-80" />
      </div>
      <div class="grid-overlay absolute inset-0" aria-hidden="true" />

      <div class="site-container relative z-10 flex flex-col items-center text-center">
        <p class="chip-gold mb-8 backdrop-blur-sm">
          <UiIcon name="sparkles" class="h-3.5 w-3.5" />
          <span>Upcycling · Denim recuperato</span>
        </p>

        <h1 class="mb-8 max-w-5xl text-[clamp(2.5rem,7vw,6rem)] leading-[1.06] tracking-tight text-white">
          <template v-for="(line, i) in headlineLines" :key="i">
            <span :class="{ 'font-light italic text-gold': i === headlineLines.length - 1 }">{{ line }}</span>{{ ' ' }}
          </template>
        </h1>

        <p class="mb-12 max-w-2xl text-base leading-relaxed font-light tracking-wide text-stone md:text-lg">
          {{ home.heroSubline }}
        </p>

        <div class="flex w-full flex-col gap-5 sm:w-auto sm:flex-row">
          <UiBaseButton to="/shop" size="lg" class="group">
            <span>Esplora la collezione</span>
            <UiIcon name="chevron-right" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </UiBaseButton>
          <UiBaseButton to="/customize" variant="outline" size="lg" class="backdrop-blur-sm">Personalizza la tua borsa</UiBaseButton>
        </div>

        <dl class="mt-20 grid w-full max-w-4xl grid-cols-2 gap-8 border-t border-white/10 pt-10 text-left md:grid-cols-4 md:gap-16">
          <div v-for="s in STATS" :key="s.label" class="flex flex-col-reverse">
            <dt class="mt-1 text-[11px] uppercase tracking-widest text-stone">{{ s.label }}</dt>
            <dd class="font-display text-3xl font-light text-gold md:text-4xl">{{ s.n }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- ───────── Philosophy ───────── -->
    <section id="filosofia" class="band relative border-b border-white/5 py-28">
      <div class="site-container grid items-center gap-16 lg:grid-cols-12">
        <div class="relative lg:col-span-5">
          <div class="relative z-10 overflow-hidden rounded-card border border-white/10">
            <img
              :src="EDITORIAL.workbench.src"
              :alt="EDITORIAL.workbench.alt"
              :width="EDITORIAL.workbench.width"
              :height="EDITORIAL.workbench.height"
              loading="lazy"
              decoding="async"
              class="h-[420px] w-full rounded-none object-cover grayscale transition-[filter] duration-700 hover:grayscale-0 sm:h-[520px]"
            />
          </div>
          <div class="absolute -right-2 -bottom-8 z-20 max-w-xs rounded-card border border-gold/40 bg-graphite-3 p-6 shadow-card md:-right-8">
            <p class="mb-1 font-display text-lg italic text-gold">“Non si ricomincia da zero: si riparte da ciò che esiste.”</p>
            <p class="text-[10px] uppercase tracking-widest text-stone">— Il laboratorio Linea 2</p>
          </div>
        </div>

        <div class="mt-6 lg:col-span-7 lg:mt-0 lg:pl-8">
          <p class="kicker mb-4"><UiIcon name="heart" class="h-4 w-4" /> La nostra filosofia</p>
          <h2 class="mb-8 text-[clamp(1.9rem,4vw,3rem)] leading-tight text-white">
            Dove il denim vissuto incontra <span class="italic text-gold">la cura sartoriale.</span>
          </h2>
          <div class="space-y-6 text-base leading-relaxed font-light text-stone">
            <p>
              <strong class="font-normal text-white">Linea 2</strong> nasce da un’attenta selezione di jeans già
              esistenti. Li smontiamo, scegliamo i pezzi migliori e li ricomponiamo a mano: il lavaggio, le sbiaditure
              e le vecchie cuciture diventano parte del disegno.
            </p>
            <p>
              Per questo nessuna borsa è uguale a un’altra. Le cuciture restano a vista, i lavaggi si accostano come
              in un patchwork e ogni pezzo porta l’etichetta in pelle Linea 2.
            </p>
          </div>
          <div class="mt-10 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-2">
            <div v-for="p in PILLARS" :key="p.title" class="flex items-start gap-4">
              <span class="icon-tile h-10 w-10 shrink-0"><UiIcon :name="p.icon" class="h-5 w-5" /></span>
              <div>
                <h3 class="mb-1 font-body text-sm font-semibold uppercase tracking-wider text-white">{{ p.title }}</h3>
                <p class="text-xs leading-relaxed text-stone">{{ p.text }}</p>
              </div>
            </div>
          </div>
          <NuxtLink to="/studio" class="arrow-link mt-10">Scopri come lavoriamo</NuxtLink>
        </div>
      </div>
    </section>

    <!-- ───────── Collection ───────── -->
    <section id="collezione" class="wash-section relative border-b border-white/5 py-28" aria-labelledby="collection-title">
      <div class="site-container">
        <div class="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p class="kicker mb-3">La collezione</p>
            <h2 id="collection-title" class="text-[clamp(1.9rem,4vw,3rem)] text-white">Borse in denim recuperato</h2>
            <p class="mt-3 text-sm text-stone">Sei forme, da {{ formatPrice(fromPrice) }}. Ognuna si personalizza.</p>
          </div>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Filtra per tipo">
            <button
              v-for="f in FILTERS"
              :key="f"
              type="button"
              class="rounded-sm border px-5 py-2 text-xs uppercase tracking-widest transition-all duration-300"
              :class="activeFilter === f ? 'border-gold bg-gold font-semibold text-graphite' : 'border-white/10 bg-graphite-2 text-stone hover:border-white/30 hover:text-white'"
              :aria-pressed="activeFilter === f"
              @click="activeFilter = f"
            >
              {{ f }}
            </button>
          </div>
        </div>

        <ul class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="b in filteredBags"
            :key="b.id"
            class="group flex flex-col justify-between overflow-hidden rounded-card border border-white/5 bg-graphite-2 transition-all duration-500 hover:border-gold/50"
          >
            <div>
              <div class="relative aspect-[5/6] overflow-hidden bg-black">
                <img
                  :src="bagImage(b.id, b.name, b.type).src"
                  :alt="bagImage(b.id, b.name, b.type).alt"
                  width="900"
                  height="1080"
                  loading="lazy"
                  decoding="async"
                  class="h-full w-full rounded-none object-cover opacity-90 transition-[transform,opacity] duration-700 group-hover:scale-105 group-hover:opacity-100"
                />
                <div class="absolute inset-0 bg-linear-to-t from-graphite-2 via-transparent to-transparent opacity-80" />
                <span class="absolute top-4 left-4 rounded-sm border border-white/10 bg-graphite/80 px-3 py-1 text-[10px] uppercase tracking-widest text-gold backdrop-blur-md">
                  {{ WEAR[b.id] }}
                </span>
                <button
                  type="button"
                  class="absolute right-4 bottom-4 flex h-10 w-10 items-center justify-center rounded-sm bg-gold text-graphite opacity-100 transition-all duration-300 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
                  :aria-label="`Dettagli della borsa ${b.name}`"
                  @click="openBag(b)"
                >
                  <UiIcon name="maximize" class="h-5 w-5" />
                </button>
              </div>
              <div class="p-6">
                <div class="mb-2 flex items-baseline justify-between">
                  <span class="text-xs uppercase tracking-wider text-stone">{{ b.type }}</span>
                  <span class="price-tag text-xs text-gold">da {{ formatPrice(b.p) }}</span>
                </div>
                <h3 class="mb-3 text-2xl text-white transition-colors group-hover:text-gold">
                  <NuxtLink :to="`/customize?model=${b.id}`">{{ b.name }}</NuxtLink>
                </h3>
                <p class="text-xs leading-relaxed font-light text-stone">{{ b.title }}, cucita a mano da jeans recuperati.</p>
              </div>
            </div>
            <div class="flex items-center justify-between border-t border-white/5 bg-graphite/50 px-6 py-4 text-[11px] text-stone">
              <span>{{ bagSpecs(b)[0] }}</span>
              <span class="h-1 w-1 rounded-full bg-gold" aria-hidden="true" />
              <span>{{ bagSpecs(b)[1] }}</span>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- ───────── What we make ───────── -->
    <section id="cosa-facciamo" class="band relative border-b border-white/5 py-28">
      <div class="site-container">
        <div class="mb-20 max-w-3xl">
          <p class="kicker mb-3">Cosa facciamo</p>
          <h2 class="text-[clamp(1.9rem,4vw,3rem)] leading-tight text-white">Borse, accessori e <span class="italic text-gold">piccoli pezzi unici</span></h2>
        </div>
        <div class="grid gap-8 md:grid-cols-2">
          <article
            v-for="(srv, i) in SERVICES"
            :key="srv.title"
            class="group relative overflow-hidden rounded-card border border-white/5 bg-graphite p-8 transition-all duration-300 hover:border-gold/40 md:p-10"
          >
            <span class="absolute top-0 right-0 p-8 font-display text-6xl font-bold text-white/5 transition-colors select-none group-hover:text-gold/10" aria-hidden="true">
              0{{ i + 1 }}
            </span>
            <span class="icon-tile mb-8 h-12 w-12 transition-colors duration-300 group-hover:bg-gold group-hover:text-graphite">
              <UiIcon :name="srv.icon" class="h-6 w-6" />
            </span>
            <p class="mb-2 text-[10px] uppercase tracking-[0.2em] text-gold">{{ srv.kicker }}</p>
            <h3 class="mb-4 text-2xl text-white">{{ srv.title }}</h3>
            <p class="mb-6 text-sm leading-relaxed font-light text-stone">{{ srv.text }}</p>
            <NuxtLink :to="srv.to" class="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white transition-colors group-hover:text-gold">
              <span>{{ srv.cta }}</span>
              <UiIcon name="chevron-right" class="h-4 w-4 text-gold" />
            </NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <!-- ───────── Denim washes ───────── -->
    <section id="lavaggi" class="wash-section relative border-b border-white/5 py-28" aria-labelledby="wash-title">
      <div class="site-container grid items-center gap-12 lg:grid-cols-12">
        <div class="lg:col-span-5">
          <p class="kicker mb-3">Materia e lavaggi</p>
          <h2 id="wash-title" class="mb-6 text-[clamp(1.9rem,3.4vw,2.6rem)] leading-tight text-white">Il campionario del denim</h2>
          <p class="mb-8 text-sm leading-relaxed font-light text-stone">
            I lavaggi che puoi scegliere nel configuratore, dal vintage chiaro al nero. Ogni borsa nasce da jeans
            veri, quindi la tela può variare un poco da un pezzo all’altro. Seleziona un lavaggio per vederlo da vicino.
          </p>
          <div class="grid gap-3 sm:grid-cols-2" role="listbox" aria-label="Lavaggi del denim">
            <button
              v-for="(w, i) in WASH"
              :key="w.id"
              type="button"
              role="option"
              :aria-selected="selectedWash.id === w.id"
              class="flex w-full items-center justify-between gap-3 rounded-sm border p-3.5 text-left transition-all duration-300"
              :class="selectedWash.id === w.id ? 'border-gold bg-graphite-2 text-white shadow-card' : 'border-white/5 bg-graphite text-stone hover:border-white/20'"
              @click="selectedWash = w"
            >
              <span class="flex items-center gap-4">
                <span class="h-7 w-7 rounded-full border border-white/20 bg-cover" :style="{ backgroundImage: `url(/bags2d/swatches/wash-${w.id}.png)`, backgroundColor: w.hex }" />
                <span>
                  <span class="block text-sm font-medium">{{ w.name }}</span>
                  <span class="block text-[10px] uppercase tracking-wider text-stone">{{ washTone(w.fade) }}</span>
                </span>
              </span>
              <span class="text-xs tabular-nums text-gold">D-{{ String(i + 1).padStart(2, '0') }}</span>
            </button>
          </div>
        </div>

        <div class="lg:col-span-7">
          <div class="relative overflow-hidden rounded-panel border border-white/10 bg-graphite-2 p-8 md:p-12">
            <div
              class="group relative h-80 w-full overflow-hidden rounded-card border border-white/20 shadow-card"
              :style="{ backgroundColor: selectedWash.hex, backgroundImage: `url(/bags2d/swatches/wash-${selectedWash.id}.png)`, backgroundSize: '260px' }"
            >
              <div class="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/40" />
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="font-display text-3xl font-bold uppercase tracking-widest text-white/25 transition-transform duration-700 select-none group-hover:scale-110 md:text-5xl">Linea 2</span>
              </div>
              <span class="absolute right-4 bottom-4 rounded-sm border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] uppercase tracking-widest text-white backdrop-blur-md">
                Campione denim
              </span>
            </div>
            <div class="mt-8 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center">
              <div>
                <p class="mb-1 text-[10px] uppercase tracking-widest text-gold">
                  {{ washTone(selectedWash.fade) }} — {{ selectedWash.p ? `+${formatPrice(selectedWash.p)}` : 'incluso nel prezzo' }}
                </p>
                <h3 class="text-2xl text-white">{{ selectedWash.name }}</h3>
                <p class="mt-2 max-w-md text-xs leading-relaxed font-light text-stone">
                  Disponibile su tutti i modelli. Sulla Stella puoi abbinarlo a un secondo lavaggio per tracolla e linguetta.
                </p>
              </div>
              <UiBaseButton variant="outline" class="whitespace-nowrap" @click="applyWash">
                Usalo nel configuratore
              </UiBaseButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── Configurator ───────── -->
    <section id="configuratore" class="band relative border-b border-white/5 py-28" aria-labelledby="config-title">
      <div class="mx-auto max-w-5xl px-(--site-gutter)">
        <div class="mb-16 text-center">
          <p class="kicker mb-3">Configuratore online</p>
          <h2 id="config-title" class="text-[clamp(1.9rem,4vw,3rem)] text-white">Componi la tua borsa</h2>
          <p class="mx-auto mt-3 max-w-xl text-sm font-light text-stone">
            Inizia da qui: forma, lavaggio e fodera. Nel configuratore completo aggiungi toppe, metalli e la posizione
            dell’etichetta, con anteprima anche in 3D.
          </p>
        </div>

        <div class="relative rounded-panel border border-white/10 bg-graphite p-6 shadow-card sm:p-8 md:p-12">
          <ol class="mb-10 flex items-center justify-between border-b border-white/10 pb-6">
            <li v-for="(name, i) in STEP_NAMES" :key="name">
              <button type="button" class="flex items-center gap-3" :aria-current="step === i + 1 ? 'step' : undefined" @click="step = i + 1">
                <span
                  class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold tabular-nums"
                  :class="step === i + 1 ? 'bg-gold text-graphite' : step > i + 1 ? 'bg-white/20 text-white' : 'border border-white/20 text-stone'"
                >{{ i + 1 }}</span>
                <span class="hidden text-xs uppercase tracking-wider sm:inline" :class="step === i + 1 ? 'text-white' : 'text-stone'">{{ name }}</span>
              </button>
            </li>
          </ol>

          <div class="grid gap-10 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
            <div>
              <!-- 1 · Model -->
              <div v-if="step === 1" class="space-y-6">
                <h3 class="mb-4 text-lg text-white">Scegli il modello:</h3>
                <div class="grid gap-4 sm:grid-cols-2">
                  <button
                    v-for="b in BAGS"
                    :key="b.id"
                    type="button"
                    class="rounded-sm border p-5 text-left transition-all duration-300"
                    :class="pickModel === b.id ? 'border-gold bg-gold/10' : 'border-white/10 bg-graphite-2 hover:border-white/30'"
                    :aria-pressed="pickModel === b.id"
                    @click="pickModel = b.id"
                  >
                    <span class="mb-1 block font-display text-base text-white">{{ b.name }}</span>
                    <span class="block text-[11px] text-stone">{{ b.type }} · da {{ formatPrice(b.p) }}</span>
                  </button>
                </div>
                <div class="flex justify-end pt-6">
                  <UiBaseButton @click="step = 2">
                    <span>Avanti</span>
                    <UiIcon name="chevron-right" class="h-4 w-4" />
                  </UiBaseButton>
                </div>
              </div>

              <!-- 2 · Wash and lining -->
              <div v-else-if="step === 2" class="space-y-8">
                <div>
                  <div class="mb-3 flex items-baseline justify-between gap-4">
                    <h3 class="text-sm text-white">Lavaggio del denim:</h3>
                    <span class="text-sm text-gold">{{ findOption(WASH, pickWash).name }}</span>
                  </div>
                  <div class="flex flex-wrap gap-2.5" role="group" aria-label="Lavaggio">
                    <button
                      v-for="w in WASH"
                      :key="w.id"
                      type="button"
                      class="h-11 w-11 rounded-full border-2 bg-cover transition-transform hover:scale-105"
                      :class="pickWash === w.id ? 'border-gold' : 'border-white/15'"
                      :style="{ backgroundImage: `url(/bags2d/swatches/wash-${w.id}.png)`, backgroundColor: w.hex }"
                      :aria-pressed="pickWash === w.id"
                      :aria-label="`${w.name}${w.p ? `, più ${w.p} euro` : ''}`"
                      @click="pickWash = w.id"
                    />
                  </div>
                </div>
                <div>
                  <label for="home-lining" class="mb-3 block text-sm text-white">Fodera interna:</label>
                  <select id="home-lining" v-model="pickLining" class="field field-select text-sm">
                    <option v-for="l in LINING" :key="l.id" :value="l.id">{{ l.name }}{{ l.p ? ` (+€${l.p})` : '' }}</option>
                  </select>
                </div>
                <div class="flex justify-between border-t border-white/10 pt-6">
                  <UiBaseButton variant="outline" @click="step = 1">Indietro</UiBaseButton>
                  <UiBaseButton @click="step = 3">
                    <span>Riepilogo</span>
                    <UiIcon name="chevron-right" class="h-4 w-4" />
                  </UiBaseButton>
                </div>
              </div>

              <!-- 3 · Summary -->
              <div v-else class="space-y-8">
                <div class="rounded-sm border border-gold/40 bg-graphite-2 p-6 text-center">
                  <span class="mb-2 block text-[11px] uppercase tracking-widest text-stone">Prezzo con queste scelte</span>
                  <p class="price-tag font-display text-4xl font-light text-gold sm:text-5xl">{{ formatPrice(draftPrice) }}</p>
                  <p class="mt-3 text-[11px] italic text-stone">
                    Include una toppa patchwork e l’etichetta in pelle Linea 2: nel configuratore puoi cambiarle o aggiungerne altre.
                  </p>
                </div>
                <dl class="grid grid-cols-2 gap-4 border-y border-white/10 py-4 text-xs text-stone">
                  <div><dt class="inline font-semibold text-white">Modello:</dt> <dd class="inline">{{ draftBag.name }}</dd></div>
                  <div><dt class="inline font-semibold text-white">Forma:</dt> <dd class="inline">{{ draftBag.type }}</dd></div>
                  <div><dt class="inline font-semibold text-white">Lavaggio:</dt> <dd class="inline">{{ findOption(WASH, pickWash).name }}</dd></div>
                  <div><dt class="inline font-semibold text-white">Fodera:</dt> <dd class="inline">{{ findOption(LINING, pickLining).name }}</dd></div>
                </dl>
                <UiBaseButton :to="draftLink" size="lg" block>Continua nel configuratore</UiBaseButton>
                <button type="button" class="text-xs text-stone underline hover:text-white" @click="step = 1">Ricomincia</button>
              </div>
            </div>

            <!-- Live preview -->
            <figure class="grid gap-3">
              <div class="preview relative aspect-square overflow-hidden rounded-card border border-white/10">
                <img
                  v-for="(src, i) in draftLayers"
                  :key="src"
                  :src="src"
                  :alt="i === 0 ? `Anteprima: ${draftBag.name} in ${findOption(WASH, pickWash).name}` : ''"
                  width="1200"
                  height="1200"
                  loading="lazy"
                  decoding="async"
                  class="absolute inset-[6%] h-[88%] w-[88%] rounded-none object-contain"
                />
              </div>
              <div class="flex items-center gap-3">
                <img :src="draftTop" alt="Interno della borsa aperta con la fodera scelta" width="1200" height="1200" loading="lazy" decoding="async" class="preview h-20 w-20 shrink-0 border border-white/10 object-contain" />
                <figcaption class="text-[11px] leading-snug text-stone">Fronte e interno a borsa aperta, come nel configuratore.</figcaption>
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── Journal ───────── -->
    <section v-if="journal.length" class="wash-section relative border-b border-white/5 py-28" aria-labelledby="journal-title">
      <div class="site-container">
        <div class="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p class="kicker mb-3">Journal</p>
            <h2 id="journal-title" class="text-[clamp(1.9rem,3.4vw,2.6rem)] text-white">Stile, cura e riuso</h2>
          </div>
          <NuxtLink to="/editorial" class="arrow-link">Vai al Journal</NuxtLink>
        </div>
        <ul class="grid gap-8 md:grid-cols-3">
          <li v-for="tut in journal" :key="tut.slug">
            <NuxtLink :to="`/tutorials/${tut.slug}`" class="group block h-full overflow-hidden rounded-card border border-white/5 bg-graphite-2 transition-colors hover:border-gold/40">
              <UiStrapiImage :media="tut.finalResultImage" :width="1200" :height="900" sizes="(min-width: 768px) 30vw, 92vw" img-class="zoom-img" />
              <div class="p-6">
                <p class="mb-2 text-[10px] uppercase tracking-[0.2em] text-gold">Tutorial</p>
                <h3 class="text-xl leading-snug text-white transition-colors group-hover:text-gold">{{ tut.title }}</h3>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- ───────── Social ───────── -->
    <SocialShowcase class="band" />

    <!-- ───────── Contact ───────── -->
    <section id="contatti" class="wash-section relative py-28" aria-labelledby="contact-title">
      <div class="site-container grid gap-16 lg:grid-cols-12">
        <div class="space-y-8 lg:col-span-5">
          <div>
            <p class="kicker mb-3">Scrivici</p>
            <h2 id="contact-title" class="text-[clamp(1.9rem,4.4vw,3.2rem)] leading-tight text-white">Parla con <span class="italic text-gold">il laboratorio</span></h2>
          </div>
          <p class="text-sm leading-relaxed font-light text-stone">
            Per un’idea su misura, una domanda su un pezzo o un ordine, scrivici dove preferisci: rispondiamo noi, dal
            laboratorio.
          </p>
          <ul class="space-y-6 pt-4">
            <li>
              <a :href="SOCIAL_LINKS.whatsapp" target="_blank" rel="noopener noreferrer" class="group flex items-start gap-4">
                <span class="icon-tile h-11 w-11 shrink-0 bg-graphite"><UiIcon name="message" class="h-5 w-5" /></span>
                <span>
                  <span class="block text-xs uppercase tracking-wider text-stone">WhatsApp</span>
                  <span class="block text-sm font-medium text-white group-hover:text-gold">+39 340 147 5223</span>
                </span>
              </a>
            </li>
            <li>
              <a :href="SOCIAL_LINKS.instagram" target="_blank" rel="noopener noreferrer" class="group flex items-start gap-4">
                <span class="icon-tile h-11 w-11 shrink-0 bg-graphite"><SocialIcon name="instagram" class="h-5 w-5" /></span>
                <span>
                  <span class="block text-xs uppercase tracking-wider text-stone">Instagram</span>
                  <span class="block text-sm font-medium text-white group-hover:text-gold">@linea2.upcycling</span>
                </span>
              </a>
            </li>
            <li>
              <a :href="SOCIAL_LINKS.tiktok" target="_blank" rel="noopener noreferrer" class="group flex items-start gap-4">
                <span class="icon-tile h-11 w-11 shrink-0 bg-graphite"><SocialIcon name="tiktok" class="h-5 w-5" /></span>
                <span>
                  <span class="block text-xs uppercase tracking-wider text-stone">TikTok</span>
                  <span class="block text-sm font-medium text-white group-hover:text-gold">@linea2.upcycling</span>
                </span>
              </a>
            </li>
          </ul>
        </div>

        <div class="lg:col-span-7">
          <form class="space-y-6 rounded-panel border border-white/10 bg-graphite p-8 shadow-card md:p-12" @submit.prevent="sendContact">
            <div>
              <label for="contact-name" class="mb-2 block text-[11px] uppercase tracking-wider text-stone">Nome</label>
              <input id="contact-name" v-model="contact.name" type="text" autocomplete="name" placeholder="Il tuo nome" class="field text-sm" />
            </div>
            <div>
              <label for="contact-msg" class="mb-2 block text-[11px] uppercase tracking-wider text-stone">Messaggio *</label>
              <textarea
                id="contact-msg"
                v-model="contact.message"
                rows="5"
                required
                placeholder="Raccontaci la borsa che hai in mente, o chiedici di un pezzo…"
                class="field resize-none text-sm"
              />
            </div>
            <UiBaseButton type="submit" size="lg" block>
              <UiIcon name="send" class="h-4 w-4" />
              <span>Invia su WhatsApp</span>
            </UiBaseButton>
            <p class="text-center text-[11px] text-stone">Il messaggio si apre in WhatsApp, pronto da inviare: non salviamo nulla sul sito.</p>
          </form>
        </div>
      </div>
    </section>

    <!-- ───────── Bag lightbox ───────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selectedBag"
          class="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md md:p-10"
          role="dialog"
          aria-modal="true"
          :aria-label="`Borsa ${selectedBag.name}`"
          @click.self="closeBag"
        >
          <div class="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-panel border border-white/20 bg-graphite-2 p-6 md:p-10">
            <button
              ref="lightboxClose"
              type="button"
              class="absolute top-6 right-6 z-10 rounded-sm border border-white/20 bg-graphite p-2 text-white transition-colors hover:text-gold"
              aria-label="Chiudi"
              @click="closeBag"
            >
              <UiIcon name="x" class="h-6 w-6" />
            </button>
            <p class="mb-2 text-[10px] uppercase tracking-[0.25em] text-gold">{{ WEAR[selectedBag.id] }} — da {{ formatPrice(selectedBag.p) }}</p>
            <h3 class="mb-2 text-3xl text-white md:text-4xl">{{ selectedBag.name }}</h3>
            <p class="mb-6 text-xs uppercase tracking-wider text-stone">{{ selectedBag.title }} · {{ selectedBag.type }}</p>
            <img
              :src="bagImage(selectedBag.id, selectedBag.name, selectedBag.type).src"
              :alt="bagImage(selectedBag.id, selectedBag.name, selectedBag.type).alt"
              width="900"
              height="1080"
              class="mb-8 h-96 w-full border border-white/10 bg-black object-contain"
            />
            <p class="mb-8 text-sm leading-relaxed text-stone">
              Cucita a mano su ordinazione da jeans recuperati. Scegli il lavaggio, la fodera, le toppe patchwork e dove
              mettere l’etichetta in pelle Linea 2: il prezzo si aggiorna a ogni scelta.
            </p>
            <div class="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
              <div class="flex flex-wrap gap-3">
                <span v-for="spec in bagSpecs(selectedBag)" :key="spec" class="rounded-sm border border-white/10 bg-graphite px-4 py-2 text-xs text-white">{{ spec }}</span>
              </div>
              <UiBaseButton :to="`/customize?model=${selectedBag.id}`" @click="closeBag">Personalizza la {{ selectedBag.name }}</UiBaseButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .hero-img {
    animation: hero-drift 20s ease-in-out infinite alternate;
  }
}
@keyframes hero-drift {
  from {
    transform: scale(1.05);
  }
  to {
    transform: scale(1.1);
  }
}
/* Studio light behind the bag renders */
.preview {
  background:
    radial-gradient(60% 55% at 50% 40%, rgb(197 160 89 / 0.1), transparent 70%),
    linear-gradient(180deg, #1a1c21 0%, #15161a 72%, #101114 72.3%, #121316 100%);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s var(--ease-out-soft);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
