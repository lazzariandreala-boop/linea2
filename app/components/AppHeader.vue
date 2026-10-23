<script setup lang="ts">
import type { Messages } from '~/i18n/messages'

const { t } = useT()
const { isLoggedIn, user, logout } = useAuth()
const { count } = useCart()
const authModal = useAuthModal()
const route = useRoute()
const open = ref(false)
const accountOpen = ref(false)
const scrolled = ref(false)
const drawer = ref<HTMLElement | null>(null)
const menuBtn = ref<HTMLButtonElement | null>(null)
const headerEl = ref<HTMLElement | null>(null)
/** The drawer starts right under the header, wherever the header sits. */
const drawerTop = ref(0)

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
  /** Paths that keep the link lit on its sub-pages. */
  match: string[]
}

// Desktop: shopping on the left of the wordmark, the brand on the right.
const left: NavLink[] = [
  { to: '/shop', label: (m) => m.nav.shop, match: ['/shop', '/bags', '/products'] },
  { to: '/accessories', label: (m) => m.nav.accessories, match: ['/accessories'] },
  { to: '/customize', label: (m) => m.nav.customize, match: ['/customize'] },
]
const right: NavLink[] = [
  { to: '/studio', label: (m) => m.nav.studio, match: ['/studio'] },
  { to: '/editorial', label: (m) => m.nav.editorial, match: ['/editorial', '/tiktok', '/tutorials'] },
]
const secondary: NavLink[] = [
  { to: '/bags', label: () => 'Borse pronte', match: ['/bags'] },
  { to: '/tutorials', label: (m) => m.nav.tutorials, match: ['/tutorials'] },
  { to: '/tiktok', label: () => 'Video', match: ['/tiktok'] },
]

function isActive(link: NavLink) {
  return link.match.some((p) => route.path === p || route.path.startsWith(`${p}/`))
}

function setOpen(v: boolean) {
  open.value = v
  if (!import.meta.client) return
  document.documentElement.style.overflow = v ? 'hidden' : ''
  if (v) drawerTop.value = headerEl.value?.getBoundingClientRect().bottom ?? 0
  if (v) void nextTick(() => drawer.value?.querySelector<HTMLElement>('a, button')?.focus())
  else menuBtn.value?.focus({ preventScroll: true })
}

// Close menus on navigation.
watch(
  () => route.fullPath,
  () => {
    if (open.value) setOpen(false)
    accountOpen.value = false
  },
)

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (open.value) setOpen(false)
  accountOpen.value = false
}
/** Keep keyboard focus inside the open drawer. */
function trapFocus(e: KeyboardEvent) {
  if (e.key !== 'Tab' || !drawer.value) return
  const items = [...drawer.value.querySelectorAll<HTMLElement>('a, button')]
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
function onScroll() {
  scrolled.value = window.scrollY > 8
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onScroll)
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <p class="on-denim px-4 py-2 text-center text-[10.5px] font-medium uppercase tracking-[0.24em]">
    Denim recuperato · Fatto a mano in Italia
  </p>

  <header
    ref="headerEl"
    class="sticky top-0 z-50 border-b transition-[background-color,border-color] duration-300"
    :class="scrolled || open ? 'border-line bg-ivory' : 'border-transparent bg-ivory'"
  >
    <div class="site-container grid h-(--header-h) grid-cols-[1fr_auto_1fr] items-center gap-4">
      <!-- Left: menu button (mobile/tablet) or shop navigation -->
      <div class="flex items-center">
        <button
          ref="menuBtn"
          type="button"
          class="-ml-2.5 inline-flex h-11 w-11 items-center justify-center text-ink lg:hidden"
          :aria-expanded="open"
          aria-controls="mobile-nav"
          :aria-label="open ? t((m) => m.nav.close) : t((m) => m.nav.menu)"
          @click="setOpen(!open)"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
            <path v-if="!open" d="M3 8h18M3 16h18" />
            <path v-else d="m5 5 14 14M19 5 5 19" />
          </svg>
        </button>
        <nav class="hidden items-center gap-8 lg:flex" aria-label="Negozio">
          <NuxtLink
            v-for="link in left"
            :key="link.to"
            :to="link.to"
            class="nav-link"
            :class="{ active: isActive(link) }"
            :aria-current="isActive(link) ? 'page' : undefined"
          >
            {{ t(link.label) }}
          </NuxtLink>
        </nav>
      </div>

      <NuxtLink to="/" class="text-ink" :aria-label="`${t((m) => m.nav.home)} — Linea 2`">
        <AppLogo :height="19" />
      </NuxtLink>

      <div class="flex items-center justify-end gap-1 lg:gap-8">
        <nav class="hidden items-center gap-8 lg:flex" aria-label="Il brand">
          <NuxtLink
            v-for="link in right"
            :key="link.to"
            :to="link.to"
            class="nav-link"
            :class="{ active: isActive(link) }"
            :aria-current="isActive(link) ? 'page' : undefined"
          >
            {{ t(link.label) }}
          </NuxtLink>
        </nav>

        <div class="flex items-center">
          <!-- Account: opens login modal (guest) or account menu (signed in) -->
          <div class="relative">
            <button
              type="button"
              class="inline-flex h-11 w-10 items-center justify-center text-ink transition-opacity hover:opacity-70"
              :aria-label="isLoggedIn ? t((m) => m.nav.account) : t((m) => m.nav.signIn)"
              :aria-expanded="isLoggedIn ? accountOpen : undefined"
              @click="onAvatarClick"
            >
              <span
                v-if="isLoggedIn"
                class="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-navy text-[11px] font-semibold text-ivory"
              >
                <img v-if="user?.photoURL" :src="user.photoURL" alt="" class="h-full w-full object-cover" referrerpolicy="no-referrer" />
                <span v-else>{{ initial }}</span>
              </span>
              <svg v-else class="h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </button>

            <template v-if="isLoggedIn">
              <div v-if="accountOpen" class="fixed inset-0 z-40" @click="accountOpen = false" />
              <Transition name="menu">
                <div v-if="accountOpen" class="panel-glass absolute right-0 z-50 mt-2 w-60 rounded-panel p-1.5 shadow-card">
                  <p class="truncate px-3 py-2 text-xs text-muted">{{ user?.email }}</p>
                  <NuxtLink to="/account" class="menu-item">{{ t((m) => m.nav.account) }}</NuxtLink>
                  <NuxtLink to="/cart" class="menu-item">{{ t((m) => m.nav.cart) }}</NuxtLink>
                  <button type="button" class="menu-item w-full text-left" @click="onLogout">
                    {{ t((m) => m.auth.signOut) }}
                  </button>
                </div>
              </Transition>
            </template>
          </div>

          <!-- Bag with live item count -->
          <NuxtLink
            to="/cart"
            class="relative -mr-2 inline-flex h-11 w-11 items-center justify-center text-ink transition-opacity hover:opacity-70"
            :aria-label="`${t((m) => m.nav.cart)} (${count})`"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" aria-hidden="true">
              <path d="M4.5 8.5h15l-1.2 12h-12.6l-1.2-12Z" />
              <path d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5" />
            </svg>
            <span
              v-if="count"
              class="absolute right-1 top-1.5 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-navy px-1 text-[10px] font-semibold tabular-nums text-ivory"
              aria-hidden="true"
            >{{ count }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Mobile / tablet drawer -->
    <Transition name="sheet">
      <div
        v-if="open"
        id="mobile-nav"
        ref="drawer"
        class="fixed inset-x-0 bottom-0 z-50 overflow-y-auto border-t border-line bg-ivory lg:hidden"
        :style="{ top: `${drawerTop}px` }"
        role="dialog"
        aria-modal="true"
        :aria-label="t((m) => m.nav.menu)"
        @keydown="trapFocus"
      >
        <nav class="site-container flex min-h-full flex-col py-6" aria-label="Menu">
          <ul>
            <li v-for="link in [...left, ...right]" :key="link.to" class="border-b border-line">
              <NuxtLink
                :to="link.to"
                class="flex min-h-[60px] items-center justify-between font-display text-[1.75rem] leading-none text-ink"
                :aria-current="isActive(link) ? 'page' : undefined"
              >
                {{ t(link.label) }}
                <span v-if="isActive(link)" class="h-1.5 w-1.5 rounded-full bg-brass" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>
          <ul class="mt-6 grid gap-1">
            <li v-for="link in secondary" :key="link.to">
              <NuxtLink :to="link.to" class="flex min-h-11 items-center text-sm text-muted hover:text-ink">{{ t(link.label) }}</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/cart" class="flex min-h-11 items-center text-sm text-muted hover:text-ink">
                {{ t((m) => m.nav.cart) }} ({{ count }})
              </NuxtLink>
            </li>
          </ul>
          <div class="mt-auto flex items-center gap-5 border-t border-line pt-6 text-sm">
            <a href="https://www.instagram.com/linea2.upcycling/" target="_blank" rel="noopener noreferrer" class="flex min-h-11 items-center gap-2 text-ink">
              <SocialIcon name="instagram" class="h-4 w-4" /> Instagram
            </a>
            <a href="https://www.tiktok.com/@linea2.upcycling" target="_blank" rel="noopener noreferrer" class="flex min-h-11 items-center gap-2 text-ink">
              <SocialIcon name="tiktok" class="h-4 w-4" /> TikTok
            </a>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.nav-link {
  position: relative;
  padding-block: 6px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--color-ink);
}
.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.35s var(--ease-out-soft);
}
.nav-link:hover::after,
.nav-link.active::after {
  transform: scaleX(1);
  transform-origin: left;
}
.menu-item {
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 0 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--color-fg);
}
.menu-item:hover {
  background: var(--color-surface-2);
}
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s var(--ease-out-soft), transform 0.25s var(--ease-out-soft);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.16s var(--ease-out-soft), transform 0.16s var(--ease-out-soft);
  transform-origin: top right;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
@media (prefers-reduced-motion: reduce) {
  .sheet-enter-from,
  .sheet-leave-to,
  .menu-enter-from,
  .menu-leave-to {
    transform: none;
  }
}
</style>
