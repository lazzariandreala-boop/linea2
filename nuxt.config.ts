// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

/**
 * Derive the hostname allowlist for @nuxt/image from the configured Strapi
 * URL(s). Media is served from Strapi (or an optional CDN), so the optimizer
 * must be told which remote hosts are permitted. No hardcoded hosts: this is
 * read from env at build time.
 */
function strapiImageDomains(): string[] {
  const candidates = [
    process.env.NUXT_PUBLIC_STRAPI_URL,
    process.env.NUXT_PUBLIC_STRAPI_MEDIA_URL,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0)

  const hosts = new Set<string>()
  for (const url of candidates) {
    try {
      hosts.add(new URL(url).hostname)
    } catch {
      // Ignore malformed URLs; mock mode runs with an empty base anyway.
    }
  }
  return [...hosts]
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/image',
    '@vueuse/motion/nuxt',
    '@nuxt/test-utils/module',
  ],

  css: ['~/assets/css/main.css'],

  // Tailwind v4 is wired through its first-party Vite plugin (no PostCSS step,
  // no tailwind.config.js — the design system lives in @theme in main.css).
  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    // Server-only. Optional: public read endpoints usually need no token.
    strapiToken: '',
    // PayPal server-side secret + environment (Orders API v2). The secret is
    // NEVER exposed to the client; override via NUXT_PAYPAL_SECRET / _ENV.
    paypalSecret: '',
    paypalEnv: 'sandbox', // 'sandbox' | 'live'
    public: {
      // Firebase web config (PUBLIC by design). Defaults target the linea2
      // project; override any field via NUXT_PUBLIC_FIREBASE_* env vars.
      firebase: {
        apiKey: 'AIzaSyCV6vtwYRBd-bB7Vieg1XJX1Nw66bc15wM',
        authDomain: 'linea2-6e804.firebaseapp.com',
        projectId: 'linea2-6e804',
        storageBucket: 'linea2-6e804.firebasestorage.app',
        messagingSenderId: '607282627488',
        appId: '1:607282627488:web:f13a8e870d171ea1dd9ac5',
        measurementId: 'G-9HWMELK5RZ',
      },
      // PayPal browser JS SDK client id (public) + display currency.
      paypalClientId: '',
      paypalCurrency: 'EUR',
      // Base URL of the Strapi instance. Empty string => same-origin, which is
      // how mock mode serves shipped placeholder media from /public/uploads.
      strapiUrl: 'http://localhost:1337',
      // Optional override if media is fronted by a separate CDN host.
      strapiMediaUrl: '',
      // Master switch: when true, the data layer serves v5-shaped mocks and
      // never touches the network. Flip to false (+ a real strapiUrl) to go
      // live — no code change required.
      useMocks: true,
      // Absolute canonical/OG base, e.g. https://linea2.example.
      siteUrl: 'http://localhost:3000',
      siteName: 'Linea 2',
      // Brand logo path (served from /public). Drop public/logo.svg|png and it
      // appears in header/footer; until then the text wordmark is shown.
      logoUrl: '/logo.png',
      // i18n scaffolding — single active locale by default.
      defaultLocale: 'it',
    },
  },

  image: {
    // Provider note: the default IPX optimizer is currently incompatible with
    // this Nuxt/Nitro NIGHTLY (its server route mis-parses modifiers and the
    // responsive srcset computes degenerate 1–2px widths). We therefore serve
    // originals through @nuxt/image's `none` provider: <NuxtImg> still enforces
    // explicit width/height (zero CLS) and lazy-loading, and the shipped
    // placeholders are already tiny. For PRODUCTION on stable Nuxt 4, switch
    // `provider` to `ipx` (local) or a Strapi/CDN provider for AVIF/WebP +
    // responsive resizing — Strapi v5 also exposes pre-generated `formats`.
    provider: 'none',
    // Allowlist the Strapi media host(s) for when an optimizing provider is on.
    domains: strapiImageDomains(),
    // Prefer modern formats (used once an optimizing provider is enabled).
    format: ['avif', 'webp'],
    quality: 72,
    // Mobile-first responsive breakpoints (px), aligned with the design grid.
    screens: {
      xs: 380,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'it' },
      titleTemplate: '%s · Linea 2',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover',
        },
        { name: 'theme-color', content: '#0e0e10' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
      script: [
        {
          // No-FOUC theme boot: set <html data-theme> before first paint from
          // the stored choice, else the OS preference (dark-first fallback).
          // Kept in sync at runtime by useTheme(). Must stay dependency-free.
          tagPosition: 'head',
          innerHTML:
            "(function(){try{var k='linea2-theme',s=localStorage.getItem(k),t=s==='light'||s==='dark'?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t;}catch(e){}})();",
        },
      ],
    },
  },

  // Nitro v3 (nightly) does not surface `useRuntimeConfig` via the server-side
  // `#imports` virtual, which @nuxt/image's IPX route imports. Register it as a
  // nitro auto-import so the IPX optimizer builds. (Not needed on stable Nuxt 4.)
  nitro: {
    imports: {
      presets: [{ from: 'nitro/runtime-config', imports: ['useRuntimeConfig'] }],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false, // run explicitly via `nuxi typecheck` in CI
  },
})
