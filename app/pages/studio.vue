<script setup lang="ts">
const WHATSAPP = 'https://wa.me/393401475223'

const VALUES = [
  { title: 'Luxury', text: 'Tagliate e cucite a mano nel nostro studio, rifinite con accessori in ottone e dettagli in pelle.' },
  { title: 'Upcycled', text: 'Fatte con jeans di seconda mano. Ogni lavaggio, ogni sbiaditura e ogni tasca fa parte del disegno.' },
  { title: 'Sustainable', text: 'Per le nostre borse non si tesse denim nuovo. Gli scarti diventano pochette e sacchettini di Natale.' },
]

useSeoHead({
  title: 'Studio',
  description: 'La storia di Linea 2: borse e accessori cuciti a mano da jeans recuperati, un pezzo alla volta.',
})
</script>

<template>
  <div class="site-container py-8 sm:py-10">
    <div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <UiReveal>
        <p class="eyebrow text-accent">Studio</p>
        <h1 class="mt-3 text-display text-fg">One pair of jeans, one bag</h1>
        <div class="mt-6 max-w-xl space-y-4 text-lead text-fg/75">
          <p>
            Linea 2 è nata su un tavolo di cucina, davanti a una pila di jeans troppo belli per essere buttati.
            Ancora oggi ogni borsa viene tagliata e cucita dalle stesse mani, una alla volta.
          </p>
          <p>
            Raccogliamo denim di seconda mano, lo dividiamo per lavaggio e peso, e disegniamo ogni pezzo intorno
            a quello che il tessuto ha già: un ginocchio sbiadito, una tasca posteriore, una vecchia cucitura.
          </p>
          <p>Ogni pezzo viene filmato mentre nasce: puoi guardare il tuo sui nostri canali.</p>
        </div>
        <div class="mt-8 flex flex-wrap gap-3">
          <UiBaseButton to="/customize" variant="solid" size="lg">Customize your bag</UiBaseButton>
          <UiBaseButton to="/editorial" variant="outline" size="lg">Editorial</UiBaseButton>
        </div>
      </UiReveal>

      <UiReveal :delay="120">
        <div class="panel-glass rounded-[22px] p-6 sm:p-8">
          <h2 class="text-title text-fg">Write to the studio</h2>
          <p class="mt-3 text-sm text-fg/70">
            Domande su un ordine, un pezzo su misura o la vendita all'ingrosso. Rispondiamo entro due giorni lavorativi.
          </p>
          <a
            :href="WHATSAPP"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-solid label-caps mt-6 inline-flex h-11 items-center rounded-pill px-6 text-sm"
          >
            Scrivici su WhatsApp
          </a>
          <p class="mt-4 font-mono text-[11px] text-muted">Instagram · TikTok: @linea2.upcycling</p>
        </div>
      </UiReveal>
    </div>

    <ul class="mt-10 grid gap-px overflow-hidden rounded-card border border-fg/10 bg-fg/10 sm:grid-cols-3">
      <li v-for="v in VALUES" :key="v.title" class="bg-bg p-6">
        <h3 class="text-sm tracking-[0.12em] text-brass-hi">{{ v.title }}</h3>
        <p class="mt-3 text-sm text-fg/70">{{ v.text }}</p>
      </li>
    </ul>
  </div>
</template>
