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
  <section class="site-container py-8 sm:py-12">
    <h1 class="text-display text-fg">{{ t((m) => m.cart.title) }}</h1>
    <p v-if="!isEmpty" class="mt-1 text-fg/60">{{ count }} {{ t((m) => m.cart.itemsCount) }}</p>

    <!-- Order confirmation -->
    <div v-if="placed" class="mt-8 rounded-card glass-accent p-6 text-fg">
      <p class="text-lg font-semibold">{{ t((m) => m.cart.orderPlaced) }}</p>
      <NuxtLink to="/account" class="mt-3 inline-block font-medium text-accent underline">
        {{ t((m) => m.account.orders) }}
      </NuxtLink>
    </div>

    <!-- Empty -->
    <div v-else-if="isEmpty" class="mt-10 flex flex-col items-start gap-4">
      <p class="text-lead text-fg/70">{{ t((m) => m.cart.empty) }}</p>
      <UiBaseButton to="/accessories">{{ t((m) => m.cart.emptyCta) }}</UiBaseButton>
    </div>

    <!-- Cart -->
    <div v-else class="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <!-- Items -->
      <ul class="flex flex-col gap-4">
        <li
          v-for="item in items"
          :key="item.id"
          class="flex gap-4 rounded-card bg-surface p-3 raised"
        >
          <NuxtLink :to="`/products/${item.slug}`" class="shrink-0 overflow-hidden rounded-2xl bg-surface-2">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.imageAlt ?? item.title"
              class="h-24 w-24 object-cover"
              width="96"
              height="96"
            />
            <div v-else class="h-24 w-24" />
          </NuxtLink>

          <div class="flex min-w-0 flex-1 flex-col">
            <NuxtLink :to="`/products/${item.slug}`" class="font-display font-bold text-fg hover:text-accent">
              {{ item.title }}
            </NuxtLink>
            <p class="mt-0.5 text-sm text-fg/60">{{ fmt(item.price) }}</p>

            <div class="mt-auto flex items-center justify-between gap-3 pt-2">
              <!-- Quantity stepper -->
              <div class="inline-flex items-center rounded-pill bg-surface-2 raised">
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg/70 transition-colors hover:text-fg disabled:opacity-40"
                  :disabled="item.quantity <= 1"
                  :aria-label="t((m) => m.cart.quantity)"
                  @click="setQuantity(item.id, item.quantity - 1)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14" /></svg>
                </button>
                <span class="min-w-8 text-center text-sm font-semibold tabular-nums text-fg">{{ item.quantity }}</span>
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg/70 transition-colors hover:text-fg"
                  :aria-label="t((m) => m.cart.quantity)"
                  @click="setQuantity(item.id, item.quantity + 1)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-sm font-semibold text-fg">{{ fmt(item.price * item.quantity) }}</span>
                <button
                  type="button"
                  class="text-fg/40 transition-colors hover:text-accent-2"
                  :aria-label="t((m) => m.cart.remove)"
                  @click="remove(item.id)"
                >
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <!-- Summary + shipping + checkout -->
      <aside class="flex h-fit flex-col gap-5 rounded-card bg-surface p-5 shadow-card lg:sticky lg:top-20">
        <div class="flex items-baseline justify-between">
          <span class="text-fg/70">{{ t((m) => m.cart.subtotal) }}</span>
          <span class="text-2xl font-bold text-fg">{{ fmt(subtotal) }}</span>
        </div>

        <!-- Not logged in -->
        <div v-if="!isLoggedIn" class="rounded-2xl bg-surface-2 p-4">
          <p class="text-sm text-fg/70">{{ t((m) => m.cart.loginToCheckout) }}</p>
          <UiBaseButton block class="mt-3" @click="authModal.open()">
            {{ t((m) => m.nav.signIn) }}
          </UiBaseButton>
        </div>

        <!-- Logged in: shipping -->
        <div v-else class="border-t border-fg/10 pt-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-fg">{{ t((m) => m.cart.shippingTo) }}</h2>
            <button
              v-if="!editingShipping"
              type="button"
              class="text-sm font-medium text-accent hover:underline"
              @click="editingShipping = true"
            >
              {{ t((m) => m.cart.editShipping) }}
            </button>
          </div>

          <div v-if="!editingShipping && shippingComplete" class="mt-2 text-sm leading-relaxed text-fg/70">
            <p class="font-medium text-fg">{{ profile.shipping.fullName }}</p>
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
              @click="onSaveShipping"
            >
              {{ savingShipping ? t((m) => m.account.saving) : t((m) => m.cart.saveShipping) }}
            </UiBaseButton>
          </div>

          <p v-if="!shippingComplete && !editingShipping" class="mt-2 text-sm text-accent-2">
            {{ t((m) => m.cart.completeShipping) }}
          </p>
        </div>

        <!-- Checkout -->
        <div v-if="isLoggedIn && !editingShipping" class="border-t border-fg/10 pt-4">
          <p v-if="!paypalConfigured" class="text-sm text-fg/60">
            {{ t((m) => m.cart.paypalUnavailable) }}
          </p>
          <template v-else-if="canCheckout">
            <ClientOnly>
              <PayPalButtons :amount="subtotal" @paid="onPaid" @error="onPaymentError" />
            </ClientOnly>
            <p v-if="paymentError" class="mt-2 text-sm text-accent-2" role="alert">{{ paymentError }}</p>
          </template>
          <p v-else class="text-sm text-accent-2">{{ t((m) => m.cart.completeShipping) }}</p>
        </div>
      </aside>
    </div>
  </section>
</template>
