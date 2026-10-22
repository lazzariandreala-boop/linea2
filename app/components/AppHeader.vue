<script setup lang="ts">
import type { Messages } from '~/i18n/messages'

const { t } = useT()
const { theme, toggle } = useTheme()
const { isLoggedIn, user, logout } = useAuth()
const { count } = useCart()
const authModal = useAuthModal()
const route = useRoute()
const open = ref(false)
const accountOpen = ref(false)

/** Initial shown in the avatar when there's no Google photo. */
const initial = computed(() => {
  const name = user.value?.displayName || user.value?.email || ''
  return name.trim().charAt(0).toUpperCase() || '·'
})

function onAvatarClick() {
  if (isLoggedIn.value) accountOpen.value = !accountOpen.value
  else authModal.open()
}

async function onLogout() {
  accountOpen.value = false
  await logout()
}

interface NavLink {
  to: string
  label: (m: Messages) => string
}

// Main navigation from the Stella mockup. `match` keeps SHOP lit on the
// category and product pages, and EDITORIAL on the video pages.
const links: (NavLink & { match: string[] })[] = [
  { to: '/', label: (m) => m.nav.home, match: [] },
  { to: '/shop', label: (m) => m.nav.shop, match: ['/shop', '/bags', '/accessories', '/products'] },
  { to: '/customize', label: (m) => m.nav.customize, match: ['/customize'] },
  { to: '/editorial', label: (m) => m.nav.editorial, match: ['/editorial', '/tiktok', '/tutorials'] },
  { to: '/studio', label: (m) => m.nav.studio, match: ['/studio'] },
]

function isActive(link: { to: string; match: string[] }) {
  if (link.to === '/') return route.path === '/'
  return link.match.some((p) => route.path === p || route.path.startsWith(`${p}/`))
}

/** Brass line art for the header's top-left corner (as in the mockup). */
function net(w: number, h: number, step: number) {
  let d = ''
  for (let x = -h; x < w + h; x += step) d += `M${x} 0L${x + h} ${h}M${x} ${h}L${x + h} 0`
  return d
}
const decoPath = `${net(620, 150, 34)}M220 150L360 10L500 150M250 150L360 40L470 150`

// Close menus on navigation.
watch(() => route.fullPath, () => {
  open.value = false
  accountOpen.value = false
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    open.value = false
    accountOpen.value = false
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-fg/10 bg-bg/70 backdrop-blur-md">
    <svg
      class="deco-lines pointer-events-none absolute -left-10 top-0 hidden h-[150px] w-[620px] lg:block"
      viewBox="0 0 620 150"
      aria-hidden="true"
    >
      <path :d="decoPath" />
    </svg>

    <div class="site-container relative grid h-20 grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr] md:h-24">
      <NuxtLink to="/" class="w-max text-fg" :aria-label="`${t((m) => m.nav.home)} — Linea 2`">
        <AppLogo :height="36" tagline />
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden items-center gap-8 md:flex lg:gap-[34px]" :aria-label="t((m) => m.nav.menu)">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="label-caps text-[14.5px] text-fg transition-colors hover:text-brass-hi"
          :class="{ '!text-brass-hi': isActive(link) }"
          :aria-current="isActive(link) ? 'page' : undefined"
        >
          {{ t(link.label) }}
        </NuxtLink>
      </nav>

      <div class="flex items-center justify-end gap-1 sm:gap-3">
        <!-- Account: opens login modal (guest) or account menu (signed in) -->
        <div class="relative">
          <button
            type="button"
            class="label-caps inline-flex h-11 items-center gap-2 px-1 text-[14.5px] text-fg transition-colors hover:text-brass-hi"
            :aria-label="isLoggedIn ? t((m) => m.nav.account) : t((m) => m.nav.signIn)"
            :aria-expanded="isLoggedIn ? accountOpen : undefined"
            @click="onAvatarClick"
          >
            <span
              v-if="isLoggedIn"
              class="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-selvedge text-xs text-brass-hi ring-1 ring-brass/60"
            >
              <img v-if="user?.photoURL" :src="user.photoURL" alt="" class="h-full w-full object-cover" referrerpolicy="no-referrer" />
              <span v-else>{{ initial }}</span>
            </span>
            <span class="hidden sm:inline">Account</span>
            <svg v-if="!isLoggedIn" class="h-5 w-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </button>

          <!-- Account dropdown (signed in) -->
          <template v-if="isLoggedIn">
            <div v-if="accountOpen" class="fixed inset-0 z-40" @click="accountOpen = false" />
            <Transition name="menu">
              <div
                v-if="accountOpen"
                class="panel-glass absolute right-0 z-50 mt-2 w-56 rounded-2xl p-1.5"
              >
                <p class="truncate px-3 py-2 font-mono text-[11px] text-fg/55">{{ user?.email }}</p>
                <NuxtLink
                  to="/account"
                  class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-fg/85 transition-colors hover:bg-fg/8 hover:text-fg"
                >
                  {{ t((m) => m.nav.account) }}
                </NuxtLink>
                <NuxtLink
                  to="/cart"
                  class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-fg/85 transition-colors hover:bg-fg/8 hover:text-fg"
                >
                  {{ t((m) => m.nav.cart) }}
                </NuxtLink>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-brass-hi transition-colors hover:bg-fg/8"
                  @click="onLogout"
                >
                  {{ t((m) => m.auth.signOut) }}
                </button>
              </div>
            </Transition>
          </template>
        </div>

        <!-- Bag with live item count -->
        <NuxtLink
          to="/cart"
          class="label-caps inline-flex h-11 items-center px-1 text-[14.5px] text-fg transition-colors hover:text-brass-hi"
          active-class="!text-brass-hi"
          :aria-label="`${t((m) => m.nav.cart)} (${count})`"
        >
          Bag ({{ count }})
        </NuxtLink>

        <!-- Theme toggle -->
        <button
          type="button"
          class="hidden h-9 w-9 items-center justify-center rounded-full text-fg/60 transition-colors hover:text-brass-hi sm:inline-flex"
          :aria-label="theme === 'dark' ? t((m) => m.nav.lightMode) : t((m) => m.nav.darkMode)"
          :title="theme === 'dark' ? t((m) => m.nav.lightMode) : t((m) => m.nav.darkMode)"
          @click="toggle"
        >
          <svg v-if="theme === 'dark'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>

        <!-- Mobile menu toggle -->
        <button
          type="button"
          class="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-fg md:hidden"
          :aria-expanded="open"
          aria-controls="mobile-nav"
          :aria-label="open ? t((m) => m.nav.close) : t((m) => m.nav.menu)"
          @click="open = !open"
        >
          <svg v-if="!open" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
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
            class="label-caps flex min-h-[52px] items-center text-base text-fg/85 transition-colors hover:text-brass-hi"
            :class="{ '!text-brass-hi': isActive(link) }"
          >
            {{ t(link.label) }}
          </NuxtLink>
          <button
            type="button"
            class="label-caps flex min-h-[52px] items-center text-left text-base text-fg/60"
            @click="toggle"
          >
            {{ theme === 'dark' ? t((m) => m.nav.lightMode) : t((m) => m.nav.darkMode) }}
          </button>
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

.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.16s var(--ease-out-soft), transform 0.16s var(--ease-out-soft);
  transform-origin: top right;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}
@media (prefers-reduced-motion: reduce) {
  .menu-enter-from,
  .menu-leave-to {
    transform: none;
  }
}
</style>
