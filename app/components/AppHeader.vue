<script setup lang="ts">
import type { Messages } from '~/i18n/messages'

const { t } = useT()
const route = useRoute()
const open = ref(false)

interface NavLink {
  to: string
  label: (m: Messages) => string
}

const links: NavLink[] = [
  { to: '/accessories', label: (m) => m.nav.accessories },
  { to: '/bags', label: (m) => m.nav.bags },
  { to: '/tiktok', label: (m) => m.nav.tiktok },
  { to: '/tutorials', label: (m) => m.nav.tutorials },
]

// Close the mobile menu on navigation.
watch(() => route.fullPath, () => (open.value = false))

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-fg/10 bg-bg/80 backdrop-blur-md">
    <div class="site-container flex h-16 items-center justify-between gap-4">
      <NuxtLink to="/" class="text-xl text-fg" :aria-label="`${t((m) => m.nav.home)} — Linea 2`">
        <AppLogo :height="26" />
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden items-center gap-1 md:flex" :aria-label="t((m) => m.nav.menu)">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="rounded-pill px-4 py-2 text-sm font-medium text-fg/65 transition-colors hover:text-fg"
          active-class="!text-accent"
        >
          {{ t(link.label) }}
        </NuxtLink>
      </nav>

      <!-- Mobile toggle (large tap target) -->
      <button
        type="button"
        class="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-fg md:hidden"
        :aria-expanded="open"
        aria-controls="mobile-nav"
        :aria-label="open ? t((m) => m.nav.close) : t((m) => m.nav.menu)"
        @click="open = !open"
      >
        <svg v-if="!open" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>

    <!-- Mobile panel -->
    <Transition name="sheet">
      <nav
        v-if="open"
        id="mobile-nav"
        class="border-t border-fg/10 bg-bg/95 backdrop-blur-lg md:hidden"
        :aria-label="t((m) => m.nav.menu)"
      >
        <div class="site-container flex flex-col py-2">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="flex min-h-[52px] items-center text-lg font-medium text-fg/80 transition-colors hover:text-fg"
            active-class="!text-accent"
          >
            {{ t(link.label) }}
          </NuxtLink>
        </div>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.22s var(--ease-out-soft), transform 0.22s var(--ease-out-soft);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
@media (prefers-reduced-motion: reduce) {
  .sheet-enter-from,
  .sheet-leave-to {
    transform: none;
  }
}
</style>
