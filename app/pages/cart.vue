<script setup lang="ts">
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const { t } = useT()
const config = useRuntimeConfig()
const { items, count, subtotal, isEmpty, setQuantity, remove, clear } = useCart()
const { isLoggedIn, user } = useAuth()
const { profile, saveShipping } = useUserProfile()
const authModal = useAuthModal()

useHead({ title: () => t((m) => m.cart.title) })

const editingShipping = ref(false)
const savingShipping = ref(false)
const placed = ref(false)
const paymentError = ref('')

const paypalConfigured = computed(() => !!config.public.paypalClientId)
const currency = config.public.paypalCurrency

const shippingComplete = computed(() => {
  const a = profile.value.shipping
  return Boolean(a.fullName && a.phone && a.line1 && a.city && a.postalCode)
})

const canCheckout = computed(
  () => isLoggedIn.value && !isEmpty.value && shippingComplete.value && paypalConfigured.value,
)

// Open the address editor automatically when the address is still incomplete.
watch(
  [isLoggedIn, shippingComplete],
  ([logged, complete]) => {
    if (logged && !complete) editingShipping.value = true
  },
  { immediate: true },
)

async function onSaveShipping() {
  savingShipping.value = true
  try {
    await saveShipping(profile.value.shipping)
    editingShipping.value = false
  } finally {
    savingShipping.value = false
  }
}

function fmt(n: number) {
  return formatPrice(n) ?? '—'
}

async function onPaid(payload: { orderId: string; captureId: string | null }) {
  paymentError.value = ''
  if (!user.value) return
  const { db } = useFirebase()
  await addDoc(collection(db, 'users', user.value.uid, 'orders'), {
    items: items.value,
    amount: subtotal.value,
    currency,
    status: 'paid',
    shipping: profile.value.shipping,
    paypal: payload,
    createdAt: serverTimestamp(),
  })
  await clear()
  placed.value = true
}

function onPaymentError() {
  paymentError.value = t((m) => m.cart.paymentError)
}
</script>

<template>
  <section class="site-container pb-20 pt-12 sm:pt-16">
    <div class="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
      <h1 class="text-hero">{{ t((m) => m.cart.title) }}</h1>
      <p v-if="!isEmpty && !placed" class="meta">{{ count }} {{ count === 1 ? 'articolo' : t((m) => m.cart.itemsCount) }}</p>
    </div>

    <!-- Order confirmation -->
    <div v-if="placed" class="mt-10 max-w-xl border border-brass p-8" role="status">
      <p class="font-display text-2xl text-ink">{{ t((m) => m.cart.orderPlaced) }}</p>
      <NuxtLink to="/account" class="arrow-link mt-6">{{ t((m) => m.account.orders) }}</NuxtLink>
    </div>

    <!-- Empty -->
    <div v-else-if="isEmpty" class="grid gap-10 py-14 md:grid-cols-2 md:items-center">
      <div>
        <p class="font-display text-3xl text-ink">{{ t((m) => m.cart.empty) }}</p>
        <p class="mt-3 max-w-sm text-muted">Componi una borsa su misura nel configuratore, oppure guarda i pezzi già pronti.</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <UiBaseButton to="/customize" size="lg">Personalizza la tua borsa</UiBaseButton>
          <UiBaseButton to="/shop" variant="outline" size="lg">{{ t((m) => m.cart.emptyCta) }}</UiBaseButton>
        </div>
      </div>
      <div class="media hidden aspect-[3/2] md:block">
        <img :src="EDITORIAL.patchwork.src" alt="" :width="EDITORIAL.patchwork.width" :height="EDITORIAL.patchwork.height" loading="lazy" />
      </div>
    </div>

    <!-- Cart -->
    <div v-else class="mt-2 grid gap-10 lg:grid-cols-12 lg:gap-12">
      <!-- Items -->
      <ul class="lg:col-span-7">
        <li v-for="item in items" :key="item.id" class="grid grid-cols-[6rem_1fr] gap-5 border-b border-line py-7 sm:grid-cols-[8.5rem_1fr]">
          <NuxtLink :to="item.link ?? `/products/${item.slug}`" class="media aspect-square self-start">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.imageAlt ?? item.title"
              width="136"
              height="136"
            />
          </NuxtLink>

          <div class="flex min-w-0 flex-col">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <NuxtLink :to="item.link ?? `/products/${item.slug}`" class="font-display text-xl leading-snug text-ink hover:underline hover:underline-offset-4">
                  {{ item.title }}
                </NuxtLink>
                <p class="price-tag mt-1 text-sm text-muted">{{ fmt(item.price) }}<span v-if="item.details"> · su misura</span></p>
              </div>
              <span class="price-tag shrink-0 text-ink">{{ fmt(item.price * item.quantity) }}</span>
            </div>

            <ul v-if="item.details" class="mt-3 grid gap-0.5 text-xs leading-relaxed text-muted" aria-label="Configurazione">
              <li v-for="d in item.details.split(' · ')" :key="d">{{ d }}</li>
            </ul>

            <div class="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
              <!-- Quantity stepper -->
              <div class="inline-flex items-center border border-line" role="group" :aria-label="`${t((m) => m.cart.quantity)}: ${item.title}`">
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:bg-surface-2 disabled:opacity-35"
                  :disabled="item.quantity <= 1"
                  aria-label="Diminuisci la quantità"
                  @click="setQuantity(item.id, item.quantity - 1)"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
                </button>
                <span class="min-w-8 text-center text-sm tabular-nums text-ink" aria-live="polite">{{ item.quantity }}</span>
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:bg-surface-2"
                  aria-label="Aumenta la quantità"
                  @click="setQuantity(item.id, item.quantity + 1)"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </div>

              <div class="flex items-center gap-5 text-sm">
                <NuxtLink v-if="item.details && item.link" :to="item.link" class="text-ink underline underline-offset-4">Modifica</NuxtLink>
                <button type="button" class="text-muted underline underline-offset-4 hover:text-ink" @click="remove(item.id)">
                  {{ t((m) => m.cart.remove) }}
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <!-- Summary + shipping + checkout -->
      <aside class="h-fit border border-line bg-surface p-6 sm:p-8 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:col-span-5" aria-labelledby="summary-title">
        <h2 id="summary-title" class="font-display text-2xl text-ink">Riepilogo ordine</h2>
        <dl class="mt-6 grid gap-3 border-t border-line pt-5 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted">{{ t((m) => m.cart.subtotal) }}</dt>
            <dd class="price-tag text-ink">{{ fmt(subtotal) }}</dd>
          </div>
          <div class="flex items-baseline justify-between border-t border-line pt-4">
            <dt class="font-medium text-ink">{{ t((m) => m.cart.total) }}</dt>
            <dd class="price-tag font-display text-3xl text-ink">{{ fmt(subtotal) }}</dd>
          </div>
        </dl>

        <!-- Not logged in -->
        <div v-if="!isLoggedIn" class="mt-6 border-t border-line pt-6">
          <p class="text-sm text-muted">{{ t((m) => m.cart.loginToCheckout) }}</p>
          <UiBaseButton block size="lg" class="mt-4" @click="authModal.open()">
            {{ t((m) => m.nav.signIn) }}
          </UiBaseButton>
        </div>

        <!-- Logged in: shipping -->
        <div v-else class="mt-6 border-t border-line pt-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-ink">{{ t((m) => m.cart.shippingTo) }}</h3>
            <button
              v-if="!editingShipping"
              type="button"
              class="text-sm text-ink underline underline-offset-4"
              @click="editingShipping = true"
            >
              {{ t((m) => m.cart.editShipping) }}
            </button>
          </div>

          <div v-if="!editingShipping && shippingComplete" class="mt-3 text-sm leading-relaxed text-muted">
            <p class="text-ink">{{ profile.shipping.fullName }}</p>
            <p>{{ profile.shipping.line1 }}<span v-if="profile.shipping.line2">, {{ profile.shipping.line2 }}</span></p>
            <p>{{ profile.shipping.postalCode }} {{ profile.shipping.city }} {{ profile.shipping.province }}</p>
            <p>{{ profile.shipping.country }}</p>
            <p class="mt-1">{{ profile.shipping.phone }}</p>
          </div>

          <div v-else class="mt-4">
            <ShippingAddressForm :address="profile.shipping" />
            <UiBaseButton
              block
              class="mt-4"
              :aria-busy="savingShipping"
              :disabled="savingShipping"
              @click="onSaveShipping"
            >
              {{ savingShipping ? t((m) => m.account.saving) : t((m) => m.cart.saveShipping) }}
            </UiBaseButton>
          </div>

          <p v-if="!shippingComplete && !editingShipping" class="form-error mt-2 text-sm">
            {{ t((m) => m.cart.completeShipping) }}
          </p>
        </div>

        <!-- Checkout -->
        <div v-if="isLoggedIn && !editingShipping" class="mt-6 border-t border-line pt-6">
          <p v-if="!paypalConfigured" class="text-sm text-muted">
            {{ t((m) => m.cart.paypalUnavailable) }}
          </p>
          <template v-else-if="canCheckout">
            <ClientOnly>
              <PayPalButtons :amount="subtotal" @paid="onPaid" @error="onPaymentError" />
            </ClientOnly>
            <p v-if="paymentError" class="form-error mt-2 text-sm" role="alert">{{ paymentError }}</p>
          </template>
          <p v-else class="form-error text-sm">{{ t((m) => m.cart.completeShipping) }}</p>
        </div>
      </aside>
    </div>
  </section>
</template>
