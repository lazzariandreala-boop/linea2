<script setup lang="ts">
const WHATSAPP = 'https://wa.me/393401475223'

const STEPS = [
  { n: '01', title: 'Selezione', text: 'Raccogliamo jeans di seconda mano e li dividiamo per lavaggio, peso e carattere.' },
  { n: '02', title: 'Smontaggio', text: 'Ogni capo viene scucito a mano: tasche, cuciture e passanti diventano materiale.' },
  { n: '03', title: 'Ricomposizione', text: 'Disegniamo il pezzo intorno a ciò che il tessuto ha già: un ginocchio sbiadito, una vecchia tasca.' },
  { n: '04', title: 'Cucitura', text: 'Cuciamo e rifiniamo con accessori in ottone, nello stesso laboratorio, una borsa alla volta.' },
]

const VALUES = [
  { img: '/editorial/detail-seam.webp', title: 'Fatte a mano', text: 'Tagliate e cucite a mano, rifinite con accessori in ottone e dettagli in pelle.' },
  { img: '/editorial/detail-patchwork.webp', title: 'Denim recuperato', text: 'Ogni lavaggio, ogni sbiaditura e ogni tasca fa parte del disegno.' },
  { img: '/editorial/detail-brass.webp', title: 'Niente sprechi', text: 'Non si tesse denim nuovo. Gli scarti diventano pochette e sacchettini di Natale.' },
]

useSeoHead({
  title: 'Il nostro approccio',
  description: 'La storia di Linea 2: borse e accessori cuciti a mano da jeans recuperati, un pezzo alla volta.',
})
</script>

<template>
  <div>
    <section class="grid items-center lg:grid-cols-2">
      <div class="px-(--site-gutter) py-12 sm:py-16 lg:pl-[max(var(--site-gutter),calc((100vw-78rem)/2+var(--site-gutter)))] lg:pr-16">
        <span class="ochre-rule" aria-hidden="true" />
        <h1 class="mt-5 text-hero">Un paio di jeans,<br />una borsa.</h1>
        <div class="mt-6 max-w-lg space-y-4 text-lead text-fg/80">
          <p>
            Linea 2 è nata su un tavolo di cucina, davanti a una pila di jeans troppo belli per essere buttati. Ancora oggi
            ogni borsa viene tagliata e cucita dalle stesse mani, una alla volta.
          </p>
          <p>Ogni pezzo viene filmato mentre nasce: puoi guardare il tuo sui nostri canali.</p>
        </div>
        <div class="mt-8 flex flex-wrap gap-3">
          <UiBaseButton to="/customize" variant="solid" size="lg">Personalizza la tua</UiBaseButton>
          <UiBaseButton to="/editorial" variant="outline" size="lg">Leggi il Journal</UiBaseButton>
        </div>
      </div>
      <div class="px-(--site-gutter) pb-10 lg:py-10 lg:pr-6 lg:pl-0">
      <img
        src="/editorial/workbench.webp"
        alt="Pezzi di denim recuperato sul tavolo da taglio del laboratorio"
        width="1400"
        height="1000"
        class="aspect-[7/5] h-full w-full rounded-panel object-cover shadow-card"
      />
      </div>
    </section>

    <section class="band py-14 sm:py-16">
      <div class="site-container">
        <UiSectionHeading title="Come nasce una borsa" subtitle="Quattro passaggi, tutti nel nostro laboratorio." />
        <ol class="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <li v-for="s in STEPS" :key="s.n" class="rounded-card bg-surface p-6 shadow-card">
            <span class="font-mono text-xs text-accent">{{ s.n }}</span>
            <h3 class="mt-3 font-display text-xl">{{ s.title }}</h3>
            <p class="mt-2 text-sm text-muted">{{ s.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="site-container py-14 sm:py-16">
      <UiSectionHeading title="In cosa crediamo" />
      <ul class="mt-9 grid gap-6 sm:grid-cols-3">
        <li v-for="v in VALUES" :key="v.title">
          <img :src="v.img" :alt="v.title" width="1200" height="800" loading="lazy" class="aspect-[3/2] w-full rounded-card object-cover" />
          <h3 class="mt-4 font-display text-lg">{{ v.title }}</h3>
          <p class="mt-1 text-sm text-muted">{{ v.text }}</p>
        </li>
      </ul>
    </section>

    <section class="site-container pb-14 sm:pb-16">
      <div class="on-denim grid gap-6 rounded-panel p-8 sm:p-12 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <span class="ochre-rule" aria-hidden="true" />
          <h2 class="mt-5 text-title">Scrivi al laboratorio</h2>
          <p class="mt-3 max-w-lg text-fg/80">
            Domande su un ordine, un pezzo su misura o la vendita all’ingrosso. Rispondiamo entro due giorni lavorativi.
          </p>
          <p class="mt-4 font-mono text-xs text-muted">Instagram · TikTok: @linea2.upcycling</p>
        </div>
        <UiBaseButton :href="WHATSAPP" target="_blank" rel="noopener noreferrer" variant="solid" size="lg">
          Scrivici su WhatsApp
        </UiBaseButton>
      </div>
    </section>
  </div>
</template>
