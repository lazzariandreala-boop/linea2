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

const links: NavLink[] = [
  { to: '/accessories', label: (m) => m.nav.accessories },
  { to: '/bags', label: (m) => m.nav.bags },
  { to: '/tiktok', label: (m) => m.nav.tiktok },
  { to: '/tutorials', label: (m) => m.nav.tutorials },
]

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
  <header class="sticky top-0 z-50 border-b border-fg/10 bg-bg/80 backdrop-blur-md">
    <div class="site-container flex h-16 items-center justify-between gap-4">
      <NuxtLink to="/" class="text-xl text-fg" :aria-label="`${t((m) => m.nav.home)} — Linea 2`">
        <AppLogo :height="26" />
      </NuxtLink>

      <div class="flex items-center gap-1">
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

        <!-- Theme toggle (always visible, large tap target) -->
        <button
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-full text-fg/65 transition-colors hover:text-fg"
          :aria-label="theme === 'dark' ? t((m) => m.nav.lightMode) : t((m) => m.nav.darkMode)"
          :title="theme === 'dark' ? t((m) => m.nav.lightMode) : t((m) => m.nav.darkMode)"
          @click="toggle"
        >
          <!-- Sun (shown in dark mode → click for light) -->
          <svg v-if="theme === 'dark'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <!-- Moon (shown in light mode → click for dark) -->
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>

        <!-- Cart (with live item-count badge) -->
        <NuxtLink
          to="/cart"
          class="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-fg/65 transition-colors hover:text-fg"
          :aria-label="t((m) => m.nav.cart)"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 6h15l-1.5 9h-12z" />
            <path d="M6 6 5 3H2" />
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
          <span
            v-if="count > 0"
            class="absolute -right-0.5 -top-0.5 inline-flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-4.5 text-on-primary"
            aria-hidden="true"
          >
            {{ count }}
          </span>
        </NuxtLink>

        <!-- Profile avatar: opens login modal (guest) or account menu (signed in) -->
        <div class="relative">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-fg/15 transition-shadow hover:ring-primary/50"
            :class="isLoggedIn ? 'bg-primary text-on-primary' : 'bg-surface-2 text-fg/70'"
            :aria-label="isLoggedIn ? t((m) => m.nav.account) : t((m) => m.nav.signIn)"
            :aria-expanded="isLoggedIn ? accountOpen : undefined"
            @click="onAvatarClick"
          >
            <img v-if="user?.photoURL" :src="user.photoURL" alt="" class="h-full w-full object-cover" referrerpolicy="no-referrer" />
            <span v-else-if="isLoggedIn" class="text-sm font-bold">{{ initial }}</span>
            <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                class="glass absolute right-0 z-50 mt-2 w-52 rounded-2xl p-1.5 shadow-float"
              >
                <p class="truncate px-3 py-2 text-xs text-fg/50">{{ user?.email }}</p>
                <NuxtLink
                  to="/account"
                  class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-fg/80 transition-colors hover:bg-fg/8 hover:text-fg"
                >
                  {{ t((m) => m.nav.account) }}
                </NuxtLink>
                <NuxtLink
                  to="/cart"
                  class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-fg/80 transition-colors hover:bg-fg/8 hover:text-fg"
                >
                  {{ t((m) => m.nav.cart) }}
                </NuxtLink>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-accent-2 transition-colors hover:bg-fg/8"
                  @click="onLogout"
                >
                  {{ t((m) => m.auth.signOut) }}
                </button>
              </div>
            </Transition>
          </template>
        </div>

        <!-- Mobile menu toggle (large tap target) -->
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
