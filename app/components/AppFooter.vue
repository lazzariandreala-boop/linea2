<script setup lang="ts">
const { t } = useT()
const config = useRuntimeConfig()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="relative mt-24 border-t border-fg/10">
    <div class="site-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
      <div class="sm:col-span-2 lg:col-span-1">
        <NuxtLink to="/" class="text-2xl text-fg">
          <AppLogo :height="34" />
        </NuxtLink>
        <p class="mt-3 max-w-xs text-sm text-fg/60">{{ t((m) => m.brand.tagline) }}</p>
      </div>

      <nav class="flex flex-col gap-2" :aria-label="t((m) => m.nav.menu)">
        <NuxtLink to="/accessories" class="text-sm text-fg/70 transition-colors hover:text-fg">
          {{ t((m) => m.nav.accessories) }}
        </NuxtLink>
        <NuxtLink to="/bags" class="text-sm text-fg/70 transition-colors hover:text-fg">
          {{ t((m) => m.nav.bags) }}
        </NuxtLink>
        <NuxtLink to="/tiktok" class="text-sm text-fg/70 transition-colors hover:text-fg">
          {{ t((m) => m.nav.tiktok) }}
        </NuxtLink>
        <NuxtLink to="/tutorials" class="text-sm text-fg/70 transition-colors hover:text-fg">
          {{ t((m) => m.nav.tutorials) }}
        </NuxtLink>
      </nav>

      <div class="flex flex-col gap-2">
        <a
          href="https://www.instagram.com/linea2.upcycling/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-fg/70 transition-colors hover:text-fg"
        >
          Instagram ↗
        </a>
        <a
          href="https://www.tiktok.com/@linea2.upcycling"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-fg/70 transition-colors hover:text-fg"
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
