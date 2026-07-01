/**
 * i18n scaffolding. Single active locale by default (`it`), with `en` in place
 * so the structure is ready to adopt @nuxtjs/i18n later without reshaping copy.
 * UI chrome reads through `useT()`; swapping to a full i18n module is additive.
 */
export const SUPPORTED_LOCALES = ['it', 'en'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export interface Messages {
  brand: { tagline: string }
  nav: {
    home: string
    accessories: string
    bags: string
    tiktok: string
    tutorials: string
    menu: string
    close: string
  }
  common: {
    discover: string
    viewAll: string
    from: string
    featured: string
    relatedProducts: string
    steps: string
    inThisTutorial: string
    skipToContent: string
  }
  catalog: {
    sortLabel: string
    sortNewest: string
    sortPriceAsc: string
    sortPriceDesc: string
    results: string
    empty: string
    all: string
  }
  tiktok: { tapToPlay: string; watchOnTikTok: string; feedTitle: string }
  tutorials: { watch: string; result: string }
  footer: { rights: string; madeIn: string }
}

export const messages: Record<Locale, Messages> = {
  it: {
    brand: { tagline: 'Accessori e borse in upcycling' },
    nav: {
      home: 'Home',
      accessories: 'Accessori',
      bags: 'Borse',
      tiktok: 'TikTok',
      tutorials: 'Tutorial',
      menu: 'Apri il menu',
      close: 'Chiudi il menu',
    },
    common: {
      discover: 'Scopri',
      viewAll: 'Vedi tutti',
      from: 'da',
      featured: 'In evidenza',
      relatedProducts: 'Prodotti usati',
      steps: 'Passaggi',
      inThisTutorial: 'In questo tutorial',
      skipToContent: 'Vai al contenuto',
    },
    catalog: {
      sortLabel: 'Ordina',
      sortNewest: 'Novità',
      sortPriceAsc: 'Prezzo crescente',
      sortPriceDesc: 'Prezzo decrescente',
      results: 'risultati',
      empty: 'Nessun prodotto al momento. Torna presto!',
      all: 'Tutti',
    },
    tiktok: {
      tapToPlay: 'Tocca per riprodurre',
      watchOnTikTok: 'Guarda su TikTok',
      feedTitle: 'Dai nostri TikTok',
    },
    tutorials: { watch: 'Guarda il tutorial', result: 'Il risultato' },
    footer: {
      rights: 'Tutti i diritti riservati.',
      madeIn: 'Upcycling fatto a mano in Italia',
    },
  },
  en: {
    brand: { tagline: 'Upcycled accessories & bags' },
    nav: {
      home: 'Home',
      accessories: 'Accessories',
      bags: 'Bags',
      tiktok: 'TikTok',
      tutorials: 'Tutorials',
      menu: 'Open menu',
      close: 'Close menu',
    },
    common: {
      discover: 'Discover',
      viewAll: 'View all',
      from: 'from',
      featured: 'Featured',
      relatedProducts: 'Products used',
      steps: 'Steps',
      inThisTutorial: 'In this tutorial',
      skipToContent: 'Skip to content',
    },
    catalog: {
      sortLabel: 'Sort',
      sortNewest: 'Newest',
      sortPriceAsc: 'Price: low to high',
      sortPriceDesc: 'Price: high to low',
      results: 'results',
      empty: 'No products yet. Check back soon!',
      all: 'All',
    },
    tiktok: {
      tapToPlay: 'Tap to play',
      watchOnTikTok: 'Watch on TikTok',
      feedTitle: 'From our TikTok',
    },
    tutorials: { watch: 'Watch the tutorial', result: 'The result' },
    footer: { rights: 'All rights reserved.', madeIn: 'Upcycled by hand in Italy' },
  },
}
