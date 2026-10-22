<script setup lang="ts">
const { t } = useT()
const config = useRuntimeConfig()
const year = new Date().getFullYear()
const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/customize', label: 'Customize' },
  { to: '/editorial', label: 'Editorial' },
  { to: '/studio', label: 'Studio' },
]
</script>

<template>
  <footer class="relative mt-24 border-t border-fg/10">
    <div class="site-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
      <div class="sm:col-span-2 lg:col-span-1">
        <NuxtLink to="/" class="text-2xl text-fg">
          <AppLogo :height="34" tagline />
        </NuxtLink>
        <p class="mt-3 max-w-xs text-sm text-fg/60">{{ t((m) => m.brand.tagline) }}</p>
      </div>

      <nav class="flex flex-col gap-2" :aria-label="t((m) => m.nav.menu)">
        <NuxtLink
          v-for="link in LINKS"
          :key="link.to"
          :to="link.to"
          class="label-caps text-sm text-fg/70 transition-colors hover:text-brass-hi"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="flex flex-col gap-2">
        <a
          href="https://www.instagram.com/linea2.upcycling/"
          target="_blank"
          rel="noopener noreferrer"
          class="label-caps text-sm text-fg/70 transition-colors hover:text-brass-hi"
        >
          Instagram ↗
        </a>
        <a
          href="https://www.tiktok.com/@linea2.upcycling"
          target="_blank"
          rel="noopener noreferrer"
          class="label-caps text-sm text-fg/70 transition-colors hover:text-brass-hi"
        >
          TikTok ↗
        </a>
      </div>

      <p class="text-sm text-fg/50 lg:text-right">
        {{ t((m) => m.footer.madeIn) }}
      </p>
    </div>

    <div class="site-container border-t border-fg/10 py-6 text-xs text-fg/40">
      © {{ year }} {{ config.public.siteName }}. {{ t((m) => m.footer.rights) }}
    </div>
  </footer>
</template>
