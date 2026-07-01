# Strapi v5 content model — Linea 2

This document is the contract between the **Nuxt frontend** and the **Strapi v5
backend**. The frontend's mock layer (`app/mocks/*`) reproduces these exact
shapes, so flipping `NUXT_PUBLIC_USE_MOCKS` from `true` to `false` (and pointing
`NUXT_PUBLIC_STRAPI_URL` at a real instance) switches to live data with **no
code changes**.

## Why Strapi v5 specifics matter

The whole frontend assumes **v5 wire shapes** (not v4):

| Concern | v4 | **v5 (this project)** |
| --- | --- | --- |
| Attributes | nested under `data.attributes` | **flattened onto the entry** |
| Stable id | numeric `id` | **`documentId` (string)** + `id` |
| Collections meta | `meta.pagination` | `meta.pagination` (same) |
| Media URLs | relative | **relative** (resolved client-side against the base URL) |
| Components | nested object/array | nested object/array with numeric `id` |

Frontend types live in [`app/types/strapi.ts`](app/types/strapi.ts) (envelopes +
media) and [`app/types/content.ts`](app/types/content.ts) (domain types).

### Response envelopes

- **Collection** (`GET /api/products`): `{ data: Entry[], meta: { pagination: { page, pageSize, pageCount, total } } }`
- **Single type** (`GET /api/home-page`): `{ data: Entry, meta: {} }`
- **By documentId** (`GET /api/products/:documentId`): `{ data: Entry, meta: {} }`
- This project fetches detail by **slug** via `filters[slug][$eq]=…` (clean URLs).

### Media object (v5, flattened)

```jsonc
{
  "id": 1001,
  "documentId": "mockfoulardseta_a11",
  "name": "foulard-seta_a11.png",
  "alternativeText": "Foulard in seta Aurora annodato al collo",
  "width": 900,
  "height": 1200,
  "formats": {
    "thumbnail": { "url": "/uploads/thumbnail_foulard-seta_a11.png", "width": 184, "height": 245, "...": "..." },
    "small":     { "url": "/uploads/small_foulard-seta_a11.png", "...": "..." }
  },
  "mime": "image/png",
  "url": "/uploads/foulard-seta_a11.png",   // RELATIVE — resolved at render time
  "provider": "local"
  // …createdAt, updatedAt, hash, ext, size, previewUrl, provider_metadata
}
```

URL resolution is centralised in [`useStrapiMedia()`](app/composables/useStrapiMedia.ts):
relative URLs are joined to `NUXT_PUBLIC_STRAPI_URL` (or `…_MEDIA_URL`); in mock
mode the base is empty so `/uploads/*` is served same-origin from `public/`.

---

## Components (reusable)

### `shared.cta`
The typed call-to-action reused by Product and Tutorial. WhatsApp/DM is the
dominant, first-class path.

| Field | Type | Notes |
| --- | --- | --- |
| `kind` | enum `external` \| `whatsapp` \| `email` | drives href construction |
| `value` | string | URL (`external`), phone digits intl (`whatsapp`), address (`email`) |
| `label` | string | button text |

Href mapping ([`app/utils/cta.ts`](app/utils/cta.ts)):
`external → value`, `whatsapp → https://wa.me/<digits>`, `email → mailto:<value>`.

### `shared.seo` (optional override)
| Field | Type |
| --- | --- |
| `metaTitle` | string |
| `metaDescription` | text |
| `ogImage` | media (single) |

When absent, SEO/OG is derived from the entry (title/description + first gallery
image / `finalResultImage`).

### `shared.gradient`
| Field | Type | Notes |
| --- | --- | --- |
| `from` / `via` / `to` | string (hex) | gradient stops (`via` nullable) |
| `angle` | integer | degrees |

### `tutorial.step` (repeatable)
| Field | Type |
| --- | --- |
| `title` | string |
| `body` | text |
| `image` | media (single, optional) |

### `home.section` (repeatable)
| Field | Type | Notes |
| --- | --- | --- |
| `key` | enum `accessories` \| `bags` \| `tiktok` \| `tutorials` | links to a section route |
| `title` | string | |
| `subtitle` | string (optional) | |
| `enabled` | boolean | toggles visibility/order |

---

## Collection types

### Product (`api::product.product`)

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string (required) | |
| `slug` | uid (target `title`, required) | detail route `/products/:slug` |
| `description` | text/blocks | |
| `price` | decimal (optional) | **display-only — there is no checkout** |
| `gallery` | media (multiple, required) | first image = card cover + OG image |
| `category` | **enum `accessories` \| `bags`** (required) | see "enum vs relation" below |
| `tags` | JSON (`string[]`) | client-side filter chips |
| `featured` | boolean (default false) | homepage + badge |
| `cta` | component `shared.cta` | |
| `seo` | component `shared.seo` (optional) | |

**Enum vs. relation for `category` (deliberate call):** a fixed, tiny set
(`accessories`, `bags`) with **no per-category metadata** is modelled as an
**enumeration**, not a `Category` relation. This avoids an extra table/populate,
keeps filtering a simple `filters[category][$eq]=bags`, and matches the routes
1:1. **Promote to a `Category` relation only if** you later need per-category
fields (hero image, description, SEO, ordering) or a CMS-managed taxonomy; at
that point change `category: ProductCategory` to a populated relation object and
update `useProducts`' filter from `$eq` on a scalar to the relation's field.

Frontend populate: `gallery`, `cta`, `seo.ogImage`.

### TikTokVideo (`api::tiktok-video.tiktok-video`)

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string (required) | |
| `videoUrl` | string (required) | canonical TikTok URL |
| `embedId` | string (optional) | parsed from `videoUrl` when absent |
| `thumbnail` | media (single, optional) | poster for the **facade** |
| `order` | integer | sort `order:asc` |

The frontend **never** loads `embed.js` until the user taps a poster
([`TikTokFacade`](app/components/TikTokFacade.vue) → [`TikTokEmbed`](app/components/TikTokEmbed.vue)).

### Tutorial (`api::tutorial.tutorial`)

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string (required) | |
| `slug` | uid (required) | detail route `/tutorials/:slug` |
| `description` | text | |
| `finalResultImage` | media (single) | **the hook — shown on top** |
| `videoFile` | media (single, optional) | uploaded video… |
| `videoEmbedUrl` | string (optional) | …or a third-party embed (exactly one) |
| `steps` | component `tutorial.step` (repeatable) | |
| `relatedProducts` | relation **many-to-many → Product** | "products used" |
| `cta` | component `shared.cta` | |
| `seo` | component `shared.seo` (optional) | |

Frontend populate: `finalResultImage`, `videoFile`, `steps.image`,
`relatedProducts.gallery`, `relatedProducts.cta`, `cta`, `seo.ogImage`.

---

## Single type

### HomePage (`api::home-page.home-page`)

| Field | Type | Notes |
| --- | --- | --- |
| `heroEyebrow` | string | |
| `heroHeadline` | text | `\n` = explicit line break |
| `heroSubline` | text | |
| `heroMedia` | media (single, optional) | LCP image |
| `heroGradient` | component `shared.gradient` | hero wash |
| `featuredProducts` | relation **many-to-many → Product** | |
| `sections` | component `home.section` (repeatable) | section ordering/toggles |
| `seo` | component `shared.seo` (optional) | default OG |

Frontend populate: `heroMedia`, `heroGradient`, `sections`,
`featuredProducts.gallery`, `featuredProducts.cta`, `seo.ogImage`.

---

## Permissions & going live

1. In Strapi, set **public read** (`find`, `findOne`) for Product, TikTokVideo,
   Tutorial, HomePage — or supply a read token via `NUXT_STRAPI_TOKEN`
   (server-only; never exposed to the client).
2. Set `NUXT_PUBLIC_STRAPI_URL` to the instance and `NUXT_PUBLIC_USE_MOCKS=false`.
3. Re-enable an optimizing `@nuxt/image` provider in `nuxt.config.ts` (see the
   note there) — Strapi v5 also exposes pre-generated `formats`.

No frontend code changes are required for the data swap: the mock payloads in
`app/mocks/*` already match every shape above.
