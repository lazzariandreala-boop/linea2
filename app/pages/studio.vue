<script setup lang="ts">
const STEPS = [
  { n: '01', title: 'Selezione', text: 'Raccogliamo jeans di seconda mano e li dividiamo per lavaggio, peso e carattere.' },
  { n: '02', title: 'Smontaggio', text: 'Ogni capo viene scucito a mano: tasche, cuciture e passanti diventano materiale.' },
  { n: '03', title: 'Ricomposizione', text: 'Disegniamo il pezzo intorno a ciò che il tessuto ha già: un ginocchio sbiadito, una vecchia tasca.' },
  { n: '04', title: 'Cucitura', text: 'Cuciamo e rifiniamo con accessori in ottone, nello stesso laboratorio, una borsa alla volta.' },
]

const VALUES = [
  { img: EDITORIAL.seam, title: 'Fatte a mano', text: 'Tagliate e cucite a mano, rifinite con accessori in ottone e dettagli in pelle.' },
  { img: EDITORIAL.patchwork, title: 'Denim recuperato', text: 'Ogni lavaggio, ogni sbiaditura e ogni tasca fa parte del disegno.' },
  { img: EDITORIAL.brass, title: 'Niente sprechi', text: 'Non si tesse denim nuovo. Gli scarti diventano pochette e sacchettini di Natale.' },
]

useSeoHead({
  title: 'Il nostro approccio',
  description: 'La storia di Linea 2: borse e accessori cuciti a mano da jeans recuperati, un pezzo alla volta.',
})
</script>

<template>
  <div>
    <section class="site-container pb-16 pt-12 sm:pt-16">
      <p class="kicker">Il nostro approccio</p>
      <div class="mt-6 grid gap-8 lg:grid-cols-12 lg:items-end">
        <h1 class="text-hero lg:col-span-7">Un paio di jeans, <span class="italic text-indigo">una borsa.</span></h1>
        <div class="max-w-md space-y-4 text-fg/80 lg:col-span-4 lg:col-start-9">
          <p>
            Linea 2 è nata su un tavolo di cucina, davanti a una pila di jeans troppo belli per essere buttati. Ancora oggi
            ogni borsa viene tagliata e cucita dalle stesse mani, una alla volta.
          </p>
          <p>Ogni pezzo viene filmato mentre nasce: puoi guardarlo sui nostri canali.</p>
        </div>
      </div>
      <div class="media mt-12 aspect-[4/3] sm:aspect-[16/9]">
        <img
          :src="EDITORIAL.workbench.src"
          :alt="EDITORIAL.workbench.alt"
          :width="EDITORIAL.workbench.width"
          :height="EDITORIAL.workbench.height"
          fetchpriority="high"
        />
      </div>
    </section>

    <section class="band section-y border-y border-line" aria-labelledby="process-title">
      <div class="site-container grid gap-12 lg:grid-cols-12">
        <div class="lg:col-span-4">
          <p class="kicker">Il processo</p>
          <h2 id="process-title" class="mt-4 text-display">Come nasce una borsa</h2>
          <p class="mt-4 text-muted">Quattro passaggi, tutti nel nostro laboratorio.</p>
        </div>
        <ol class="border-t border-line lg:col-span-7 lg:col-start-6">
          <li v-for="s in STEPS" :key="s.n" class="grid grid-cols-[3rem_1fr] gap-4 border-b border-line py-7 sm:grid-cols-[4rem_12rem_1fr] sm:gap-6">
            <span class="text-sm tabular-nums text-accent">{{ s.n }}</span>
            <h3 class="font-display text-2xl leading-tight">{{ s.title }}</h3>
            <p class="col-start-2 text-fg/80 sm:col-start-3">{{ s.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="site-container section-y" aria-labelledby="values-title">
      <p class="kicker">Materiali</p>
      <h2 id="values-title" class="mt-4 text-display">In cosa crediamo</h2>
      <ul class="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-6">
        <li v-for="(v, i) in VALUES" :key="v.title" :class="{ 'sm:mt-16': i === 1 }">
          <div class="media aspect-[4/5]">
            <img :src="v.img.src" :alt="v.img.alt" :width="v.img.width" :height="v.img.height" loading="lazy" decoding="async" />
          </div>
          <h3 class="mt-5 font-display text-2xl">{{ v.title }}</h3>
          <p class="mt-2 text-sm text-muted">{{ v.text }}</p>
        </li>
      </ul>
    </section>

    <section class="on-denim" aria-labelledby="contact-title">
      <div class="site-container section-y grid gap-8 md:grid-cols-12 md:items-end">
        <div class="md:col-span-7">
          <p class="kicker">Contatti</p>
          <h2 id="contact-title" class="mt-4 text-display">Scrivi al laboratorio</h2>
          <p class="mt-5 max-w-lg text-fg/80">
            Domande su un ordine, un pezzo su misura o la vendita all’ingrosso: scrivici su WhatsApp o in direct su
            Instagram e TikTok (@linea2.upcycling).
          </p>
        </div>
        <div class="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
          <UiBaseButton :href="SOCIAL_LINKS.whatsapp" target="_blank" rel="noopener noreferrer" size="lg">Scrivici su WhatsApp</UiBaseButton>
          <UiBaseButton to="/customize" variant="outline" size="lg">Personalizza</UiBaseButton>
        </div>
      </div>
    </section>
  </div>
</template>
