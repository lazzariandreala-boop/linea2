# Linea 2 — vetrina

A modern, **mobile-first** showcase site for **Linea 2** — an *upcycling*
accessories & bags brand (handmade from recovered materials).
Most visitors arrive directly from **TikTok / Instagram on a phone**, so the
experience is fast, visually striking, and degrades gracefully in in-app webviews.
The look is **quiet luxury meets contemporary Italian craft**: warm ivory and
warm white editorial surfaces, midnight navy / indigo sections, muted brass as a
rare accent, Newsreader (serif) for headlines and Instrument Sans for UI and
text. All tokens (colours, type scale with `clamp()`, spacing, radii, widths)
live in [`app/assets/css/main.css`](app/assets/css/main.css).
Main sections: **Shop · Customize · Editorial · Studio**. `/customize` is a
three.js configurator for the Stella bag (model in `public/models/stella.glb`,
options and pricing in `app/utils/stella/`) that adds made-to-order lines to the
cart. The configurator runs as a 2D step-by-step flow (Modello → Lavaggio →
Fodera → Toppe → Metalli → Monogramma → Riepilogo); the 3D model loads only
from the "Vedi in 3D" button. Cart, optional login and PayPal checkout run on Firebase (see
[`FIREBASE_SETUP.md`](FIREBASE_SETUP.md)).

## Stack

- **Nuxt 4 conventions** (this repo pins `nuxt → nuxt-nightly@5x`; everything
  lives under `app/`) · **TypeScript** (strict, no `any`)
- **Tailwind CSS v4** via `@tailwindcss/vite` (design system in
  [`app/assets/css/main.css`](app/assets/css/main.css) `@theme`)
- **Strapi v5** headless CMS (see [`STRAPI.md`](STRAPI.md))
- **@nuxt/image** (explicit dimensions, zero CLS) · **@vueuse/motion**
  (scroll reveals, parallax, micro-interactions — `transform`/`opacity` only,
  reduced-motion respected)
- **Vitest** + **Playwright** test baseline

## Getting started

```bash
npm install
cp .env.example .env        # defaults to mock mode — no backend needed
npm run gen:placeholders    # one-time: writes brand placeholder images to public/uploads
npm run dev                 # http://localhost:3000
```

**Logo:** replace `public/logo.svg` (a placeholder) with the real brand logo —
same path, no code change. It appears in the header/footer; if the file is
missing the site falls back to the text wordmark. Override the path with
`NUXT_PUBLIC_LOGO` if needed.

### Scripts

| Script | What |
| --- | --- |
| `npm run dev` / `build` / `preview` | Nuxt dev / production build / preview |
| `npm run gen:placeholders` | regenerate the zero-dependency placeholder PNGs |
| `npm run typecheck` | `vue-tsc` strict typecheck |
| `npm run test` | Vitest (unit + mock-shape + component) |
| `npm run test:e2e` | Playwright route smoke specs |

## Mock-first, swap-ready

The data layer is gated by **one env flag**, `NUXT_PUBLIC_USE_MOCKS`:

- `true` (default): serves **v5-shaped mocks** from [`app/mocks/`](app/mocks/) —
  no network, ships real placeholder imagery.
- `false`: fetches the live Strapi instance at `NUXT_PUBLIC_STRAPI_URL`.

The mock payloads are **byte-shape-identical** to Strapi v5 (flattened
attributes, `documentId`, `meta.pagination`, relative media URLs). The mock↔live
branch lives in exactly **one place** — [`useStrapi()`](app/composables/useStrapi.ts) —
so every page/composable is mode-agnostic and flipping the flag needs **no code
changes**. This is verified by tests (`tests/unit/mock-shape.test.ts`).

### Environment variables

See [`.env.example`](.env.example). Nothing is hardcoded — Strapi URL, token,
site URL, brand, locale and the mock flag all flow through `runtimeConfig`.

## Architecture

```
app/
  assets/css/main.css     design tokens (@theme) + base/motion CSS
  components/             domain components (+ ui/ primitives)
  composables/            useStrapi (client), useProducts/…, useSeoHead, useT, …
  i18n/messages.ts        i18n scaffolding (default `it`, `en` ready)
  mocks/                  v5-shaped mock data + builders (the swap contract)
  pages/                  /, /accessories, /bags, /products/[slug],
                          /tiktok, /tutorials, /tutorials/[slug]
  types/                  Strapi v5 envelopes + domain types + UI types
  utils/                  pure helpers (query serializer, cta, media, format)
scripts/gen-placeholders.mjs   no-dep PNG generator
```

## Notable engineering decisions

- **TikTok facade**: `embed.js` is **never** loaded until the user taps a poster
  — it's heavy and unreliable in the in-app webview. Same facade for tutorial
  video embeds.
- **SEO / social share is a core feature** (traffic is shared links): every page
  sets `useSeoMeta` + canonical; Product/Tutorial detail pages emit OpenGraph +
  Twitter `summary_large_image` with an **absolute** representative image.
- **Self-hosted fonts** (`@fontsource`, latin subsets): Cinzel, Cormorant
  Garamond, Inter, JetBrains Mono. No request to Google Fonts.
- **Semantic color tokens** (`bg`/`surface`/`fg`/`primary`/`accent`) in
  [`main.css`](app/assets/css/main.css) `@theme` — retheme the whole site by
  editing one block. Current theme: Stella (charcoal · brass · denim).
- **@nuxt/image provider** is set to `none` because the default IPX optimizer is
  incompatible with the current Nuxt/Nitro **nightly**; `<NuxtImg>` still enforces
  explicit dimensions + lazy-loading. Re-enable an optimizing provider for
  production — see the comment in [`nuxt.config.ts`](nuxt.config.ts).

## Tests

- **Vitest** — pure helpers, **mock v5-shape assertions** (protects the live-swap
  guarantee), and component render smoke tests.
- **Playwright** — loads every route without console errors, asserts the
  hero/grid render, and verifies **no `embed.js` loads before interaction**.

```bash
npm run test
npx playwright install chromium   # first run only
npm run test:e2e
```

## Foto da sostituire

Every editorial picture is referenced from one place,
[`app/utils/editorial.ts`](app/utils/editorial.ts) (plus `public/editorial/bag-<id>.webp`
for the six models). They are still studio renders / placeholders. Replace them
with real photographs at the same path and ratio, no code change needed:

| File | Used for | Ratio |
| --- | --- | --- |
| `public/editorial/hero-stella.webp` | Home hero (real Stella bag) | 14:15, min 1400px wide |
| `public/editorial/workbench.webp` | Brand story, Studio page | 7:5 |
| `public/editorial/detail-seam.webp` | Macro: visible stitching | 3:2 |
| `public/editorial/detail-patchwork.webp` | Macro: reconstructed denim / patchwork | 3:2 |
| `public/editorial/detail-brass.webp` | Macro: brass hardware | 3:2 |
| `public/editorial/bag-<id>.webp` | Collection photos of the six models | 5:6 |
| `public/uploads/*` | Mock catalogue products and tutorials | 3:4 / 4:3 |

Missing altogether: real studio/workshop photos (hands at work, sewing machine),
a second angle for each of the six models, and pages for shipping, returns,
privacy and cookies (the footer links them once they exist).
