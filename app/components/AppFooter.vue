<script setup lang="ts">
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

const config = useRuntimeConfig()
const year = new Date().getFullYear()

const LINKS = [
  { to: '/shop', label: 'Borse' },
  { to: '/accessories', label: 'Accessori' },
  { to: '/customize', label: 'Personalizza' },
  { to: '/studio', label: 'Il nostro approccio' },
  { to: '/editorial', label: 'Journal' },
]

// Newsletter: the address goes to Firestore (collection "newsletter").
const email = ref('')
const state = ref<'idle' | 'sending' | 'done' | 'error'>('idle')
async function subscribe() {
  const value = email.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return
  state.value = 'sending'
  try {
    const { db } = useFirebase()
    await addDoc(collection(db, 'newsletter'), { email: value, createdAt: serverTimestamp() })
    state.value = 'done'
    email.value = ''
  } catch (err) {
    console.warn('[newsletter]', err)
    state.value = 'error'
  }
}
</script>

<template>
  <footer class="mt-0 border-t border-fg/10">
    <div class="site-container grid gap-10 py-12 md:grid-cols-[1fr_1.4fr_auto] md:gap-12">
      <div>
        <NuxtLink to="/" class="text-fg" aria-label="Linea 2 — Home">
          <AppLogo :height="22" />
        </NuxtLink>
        <p class="mt-3 text-sm text-muted">Upcycling fatto a mano in Italia</p>
        <p class="mt-4 font-display text-xl italic text-fg/80">Più valore al tempo.</p>
      </div>

      <form class="md:border-x md:border-fg/10 md:px-12" @submit.prevent="subscribe">
        <h2 class="font-display text-xl">Iscriviti alla newsletter</h2>
        <p class="mt-2 text-sm text-muted">Ricevi novità, nuovi arrivi e storie dal nostro laboratorio.</p>
        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
          <label class="sr-only" for="newsletter-email">La tua email</label>
          <input
            id="newsletter-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="La tua email"
            class="field flex-1 py-2.5"
          />
          <UiBaseButton type="submit" size="sm" :disabled="state === 'sending'">Iscriviti</UiBaseButton>
        </div>
        <p v-if="state === 'done'" class="mt-2 text-sm text-fg" role="status">Grazie! Ti scriveremo presto.</p>
        <p v-else-if="state === 'error'" class="mt-2 text-sm text-fg" role="status">
          Non siamo riusciti a iscriverti. Riprova più tardi o scrivici su Instagram.
        </p>
      </form>

      <nav class="grid content-start gap-2.5 text-sm" aria-label="Collegamenti">
        <NuxtLink v-for="link in LINKS" :key="link.to" :to="link.to" class="text-fg/80 transition-colors hover:text-fg">
          {{ link.label }}
        </NuxtLink>
        <div class="mt-2 flex gap-2">
          <a
            href="https://www.instagram.com/linea2.upcycling/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Linea 2 su Instagram"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-fg/15 text-fg transition-colors hover:border-fg/40"
          >
            <SocialIcon name="instagram" class="h-4 w-4" />
          </a>
          <a
            href="https://www.tiktok.com/@linea2.upcycling"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Linea 2 su TikTok"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-fg/15 text-fg transition-colors hover:border-fg/40"
          >
            <SocialIcon name="tiktok" class="h-4 w-4" />
          </a>
        </div>
      </nav>
    </div>

    <div class="site-container flex flex-wrap justify-between gap-2 border-t border-fg/10 py-5 text-xs text-muted">
      <span>© {{ year }} {{ config.public.siteName }}. Tutti i diritti riservati.</span>
      <span>Denim recuperato · Fatto a mano in Italia</span>
    </div>
  </footer>
</template>
