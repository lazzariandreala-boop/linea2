<script setup lang="ts">
const config = useRuntimeConfig()
const year = new Date().getFullYear()

const COLUMNS = [
  {
    title: 'Esplora',
    links: [
      { to: '/shop', label: 'Borse' },
      { to: '/customize', label: 'Personalizza' },
      { to: '/studio', label: 'Il nostro approccio' },
      { to: '/editorial', label: 'Journal' },
    ],
  },
  {
    title: 'Collezione',
    links: [
      { to: '/shop', label: 'Borse su misura' },
      { to: '/bags', label: 'Borse pronte' },
      { to: '/accessories', label: 'Accessori' },
      { to: '/tutorials', label: 'Tutorial di stile e cura' },
    ],
  },
  {
    title: 'Assistenza',
    links: [
      { to: '/cart', label: 'Carrello' },
      { to: '/account', label: 'Il mio profilo' },
    ],
  },
]
const WHATSAPP = 'https://wa.me/393401475223'
</script>

<template>
  <footer class="on-denim border-t border-line">
    <div class="site-container grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.3fr_2fr] lg:gap-20">
      <div>
        <NuxtLink to="/" class="group" aria-label="Linea 2 — Home">
          <AppLogo :height="20" mark tagline-label="Upcycling denim" />
        </NuxtLink>
        <p class="mt-6 max-w-xs font-display text-2xl leading-snug text-white">
          Borse e accessori cuciti a mano da denim recuperato.
        </p>
        <div class="mt-8 flex gap-2">
          <a
            href="https://www.instagram.com/linea2.upcycling/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Linea 2 su Instagram"
            class="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-line text-gold transition-colors hover:border-gold hover:bg-gold hover:text-graphite"
          >
            <SocialIcon name="instagram" class="h-4 w-4" />
          </a>
          <a
            href="https://www.tiktok.com/@linea2.upcycling"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Linea 2 su TikTok"
            class="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-line text-gold transition-colors hover:border-gold hover:bg-gold hover:text-graphite"
          >
            <SocialIcon name="tiktok" class="h-4 w-4" />
          </a>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
        <nav v-for="col in COLUMNS" :key="col.title" :aria-label="col.title">
          <h2 class="eyebrow font-body text-gold">{{ col.title }}</h2>
          <ul class="mt-5 grid gap-1">
            <li v-for="link in col.links" :key="link.label">
              <NuxtLink :to="link.to" class="inline-flex min-h-9 items-center text-sm text-stone transition-colors hover:text-gold">
                {{ link.label }}
              </NuxtLink>
            </li>
            <li v-if="col.title === 'Assistenza'">
              <a :href="WHATSAPP" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-9 items-center text-sm text-stone transition-colors hover:text-gold">
                Scrivici su WhatsApp ↗
              </a>
            </li>
            <li v-if="col.title === 'Assistenza'">
              <a href="https://www.instagram.com/linea2.upcycling/" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-9 items-center text-sm text-stone transition-colors hover:text-gold">
                @linea2.upcycling ↗
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <div class="site-container">
      <div class="flex flex-wrap justify-between gap-3 border-t border-line py-6 text-xs text-muted">
        <span>© {{ year }} {{ config.public.siteName }} — Borse e accessori da denim recuperato, fatti a mano in Italia.</span>
        <span class="flex gap-6">
          <a href="https://www.instagram.com/linea2.upcycling/" target="_blank" rel="noopener noreferrer" class="transition-colors hover:text-gold">Instagram</a>
          <a href="https://www.tiktok.com/@linea2.upcycling" target="_blank" rel="noopener noreferrer" class="transition-colors hover:text-gold">TikTok</a>
          <a :href="WHATSAPP" target="_blank" rel="noopener noreferrer" class="transition-colors hover:text-gold">WhatsApp</a>
        </span>
      </div>
    </div>
  </footer>
</template>
