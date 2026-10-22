<script setup lang="ts">
import type { Messages } from '~/i18n/messages'

const { t } = useT()
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

// Main navigation (editorial mock-up): three links left of the wordmark,
// Journal on the right. `match` keeps a link lit on its sub-pages.
const links: (NavLink & { match: string[] })[] = [
  { to: '/shop', label: (m) => m.nav.shop, match: ['/shop', '/bags', '/accessories', '/products'] },
  { to: '/customize', label: (m) => m.nav.customize, match: ['/customize'] },
  { to: '/studio', label: (m) => m.nav.studio, match: ['/studio'] },
]
const journal = { to: '/editorial', label: (m: Messages) => m.nav.editorial, match: ['/editorial', '/tiktok', '/tutorials'] }

function isActive(link: { to: string; match: string[] }) {
  if (link.to === '/') return route.path === '/'
  return link.match.some((p) => route.path === p || route.path.startsWith(`${p}/`))
}

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
  <header class="sticky top-0 z-50 bg-[linear-gradient(90deg,rgb(232_218_196/0.85),rgb(244_240_231/0.85)_50%,rgb(232_218_196/0.85))] backdrop-blur-md">
    <p class="on-denim py-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.22em]">
      Denim recuperato · Fatto a mano in Italia
    </p>

    <div class="border-b border-fg/10"><div class="site-container relative grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-20">
      <!-- Desktop nav (left) / mobile menu button -->
      <div class="flex items-center">
        <button
          type="button"
          class="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-fg md:hidden"
          :aria-expanded="open"
          aria-controls="mobile-nav"
          :aria-label="open ? t((m) => m.nav.close) : t((m) => m.nav.menu)"
          @click="open = !open"
        >
          <svg v-if="!open" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
        <nav class="hidden items-center gap-7 md:flex" :aria-label="t((m) => m.nav.menu)">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="nav-link text-[13.5px] font-semibold text-fg"
            :class="{ active: isActive(link) }"
            :aria-current="isActive(link) ? 'page' : undefined"
          >
            {{ t(link.label) }}
          </NuxtLink>
        </nav>
      </div>

      <NuxtLink to="/" class="text-fg" :aria-label="`${t((m) => m.nav.home)} — Linea 2`">
        <AppLogo :height="22" />
      </NuxtLink>

      <div class="flex items-center justify-end gap-1 sm:gap-4">
        <NuxtLink
          :to="journal.to"
          class="nav-link hidden text-[13.5px] font-semibold text-fg md:inline"
          :class="{ active: isActive(journal) }"
        >
          {{ t(journal.label) }}
        </NuxtLink>
        <!-- Account: opens login modal (guest) or account menu (signed in) -->
        <div class="relative">
          <button
            type="button"
            class="inline-flex h-11 w-10 items-center justify-center text-fg transition-colors hover:text-accent"
            :aria-label="isLoggedIn ? t((m) => m.nav.account) : t((m) => m.nav.signIn)"
            :aria-expanded="isLoggedIn ? accountOpen : undefined"
            @click="onAvatarClick"
          >
            <span
              v-if="isLoggedIn"
              class="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-denim text-xs text-ochre"
            >
              <img v-if="user?.photoURL" :src="user.photoURL" alt="" class="h-full w-full object-cover" referrerpolicy="no-referrer" />
              <span v-else>{{ initial }}</span>
            </span>
            <svg v-if="!isLoggedIn" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
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
                  class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-accent transition-colors hover:bg-fg/8"
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
          class="relative inline-flex h-11 w-10 items-center justify-center text-fg transition-colors hover:text-accent"
          :aria-label="`${t((m) => m.nav.cart)} (${count})`"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
            <path d="M5 8h14l-1 12H6L5 8Z" />
            <path d="M9 8V7a3 3 0 0 1 6 0v1" />
          </svg>
          <span
            v-if="count"
            class="absolute right-0.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ochre px-1 text-[10px] font-bold text-denim"
          >{{ count }}</span>
        </NuxtLink>
      </div>
    </div></div>

    <!-- Mobile panel -->
    <Transition name="sheet">
      <nav
        v-if="open"
        id="mobile-nav"
        class="border-b border-fg/10 bg-bg md:hidden"
        :aria-label="t((m) => m.nav.menu)"
      >
        <div class="site-container flex flex-col py-2">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="flex min-h-[52px] items-center border-b border-fg/10 font-display text-xl text-fg"
            :class="{ 'text-accent': isActive(link) }"
          >
            {{ t(link.label) }}
          </NuxtLink>
          <NuxtLink
            :to="journal.to"
            class="flex min-h-[52px] items-center border-b border-fg/10 font-display text-xl text-fg"
          >
            {{ t(journal.label) }}
          </NuxtLink>
        </div>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.nav-link {
  position: relative;
  padding-block: 6px;
  letter-spacing: 0.01em;
}
.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--color-ochre);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s var(--ease-out-soft);
}
.nav-link:hover::after,
.nav-link.active::after {
  transform: scaleX(1);
}
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
