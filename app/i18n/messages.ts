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
    lightMode: string
    darkMode: string
    account: string
    cart: string
    signIn: string
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
  auth: {
    signInTitle: string
    signUpTitle: string
    signIn: string
    signUp: string
    signOut: string
    email: string
    password: string
    displayName: string
    continueWithGoogle: string
    noAccount: string
    haveAccount: string
    or: string
    working: string
    errorGeneric: string
  }
  account: {
    title: string
    personalData: string
    shippingSection: string
    orders: string
    noOrders: string
    orderTotal: string
    save: string
    saving: string
    saved: string
    loginRequired: string
  }
  cart: {
    title: string
    empty: string
    emptyCta: string
    addToCart: string
    added: string
    remove: string
    quantity: string
    subtotal: string
    total: string
    itemsCount: string
    checkout: string
    loginToCheckout: string
    shippingTo: string
    editShipping: string
    saveShipping: string
    completeShipping: string
    orderPlaced: string
    paymentError: string
    paypalUnavailable: string
    priceOnRequest: string
  }
  shipping: {
    fullName: string
    phone: string
    line1: string
    line2: string
    city: string
    province: string
    postalCode: string
    country: string
    notes: string
  }
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
      lightMode: 'Passa al tema chiaro',
      darkMode: 'Passa al tema scuro',
      account: 'Profilo',
      cart: 'Carrello',
      signIn: 'Accedi',
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
    auth: {
      signInTitle: 'Accedi al tuo account',
      signUpTitle: 'Crea il tuo account',
      signIn: 'Accedi',
      signUp: 'Registrati',
      signOut: 'Esci',
      email: 'Email',
      password: 'Password',
      displayName: 'Nome',
      continueWithGoogle: 'Continua con Google',
      noAccount: 'Non hai un account? Registrati',
      haveAccount: 'Hai già un account? Accedi',
      or: 'oppure',
      working: 'Attendere…',
      errorGeneric: 'Qualcosa è andato storto. Riprova.',
    },
    account: {
      title: 'Il mio profilo',
      personalData: 'Dati personali',
      shippingSection: 'Indirizzo di spedizione',
      orders: 'I miei ordini',
      noOrders: 'Non hai ancora effettuato ordini.',
      orderTotal: 'Totale',
      save: 'Salva',
      saving: 'Salvataggio…',
      saved: 'Salvato!',
      loginRequired: 'Accedi per vedere il tuo profilo.',
    },
    cart: {
      title: 'Il tuo carrello',
      empty: 'Il carrello è vuoto.',
      emptyCta: 'Scopri i prodotti',
      addToCart: 'Aggiungi al carrello',
      added: 'Aggiunto ✓',
      remove: 'Rimuovi',
      quantity: 'Quantità',
      subtotal: 'Subtotale',
      total: 'Totale',
      itemsCount: 'articoli',
      checkout: 'Vai al pagamento',
      loginToCheckout: 'Accedi per completare l’ordine',
      shippingTo: 'Spedizione a',
      editShipping: 'Modifica indirizzo',
      saveShipping: 'Salva indirizzo',
      completeShipping: 'Completa l’indirizzo di spedizione per procedere al pagamento.',
      orderPlaced: 'Ordine completato! Grazie per il tuo acquisto.',
      paymentError: 'Pagamento non riuscito. Riprova.',
      paypalUnavailable: 'Pagamento non ancora configurato. Contattaci per completare l’ordine.',
      priceOnRequest: 'Prezzo su richiesta',
    },
    shipping: {
      fullName: 'Nome e cognome',
      phone: 'Numero di telefono',
      line1: 'Indirizzo',
      line2: 'Interno / scala (opzionale)',
      city: 'Città',
      province: 'Provincia',
      postalCode: 'CAP',
      country: 'Paese',
      notes: 'Note per la consegna (opzionale)',
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
      lightMode: 'Switch to light theme',
      darkMode: 'Switch to dark theme',
      account: 'Profile',
      cart: 'Cart',
      signIn: 'Sign in',
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
    auth: {
      signInTitle: 'Sign in to your account',
      signUpTitle: 'Create your account',
      signIn: 'Sign in',
      signUp: 'Sign up',
      signOut: 'Sign out',
      email: 'Email',
      password: 'Password',
      displayName: 'Name',
      continueWithGoogle: 'Continue with Google',
      noAccount: "Don't have an account? Sign up",
      haveAccount: 'Already have an account? Sign in',
      or: 'or',
      working: 'Please wait…',
      errorGeneric: 'Something went wrong. Please try again.',
    },
    account: {
      title: 'My profile',
      personalData: 'Personal details',
      shippingSection: 'Shipping address',
      orders: 'My orders',
      noOrders: "You haven't placed any orders yet.",
      orderTotal: 'Total',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved!',
      loginRequired: 'Sign in to view your profile.',
    },
    cart: {
      title: 'Your cart',
      empty: 'Your cart is empty.',
      emptyCta: 'Browse products',
      addToCart: 'Add to cart',
      added: 'Added ✓',
      remove: 'Remove',
      quantity: 'Quantity',
      subtotal: 'Subtotal',
      total: 'Total',
      itemsCount: 'items',
      checkout: 'Go to payment',
      loginToCheckout: 'Sign in to complete your order',
      shippingTo: 'Shipping to',
      editShipping: 'Edit address',
      saveShipping: 'Save address',
      completeShipping: 'Complete your shipping address to proceed to payment.',
      orderPlaced: 'Order placed! Thank you for your purchase.',
      paymentError: 'Payment failed. Please try again.',
      paypalUnavailable: 'Payment is not configured yet. Contact us to complete your order.',
      priceOnRequest: 'Price on request',
    },
    shipping: {
      fullName: 'Full name',
      phone: 'Phone number',
      line1: 'Address',
      line2: 'Apt / floor (optional)',
      city: 'City',
      province: 'Province',
      postalCode: 'Postal code',
      country: 'Country',
      notes: 'Delivery notes (optional)',
    },
  },
}
