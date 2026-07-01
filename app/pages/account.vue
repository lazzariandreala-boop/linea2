<script setup lang="ts">
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import type { Order } from '~/types/shop'

const { t } = useT()
const { user, ready, isLoggedIn, logout } = useAuth()
const { profile, save } = useUserProfile()
const authModal = useAuthModal()

useHead({ title: () => t((m) => m.account.title) })

type StoredOrder = Order & { id: string }
const orders = ref<StoredOrder[]>([])
const ordersLoaded = ref(false)

const savingProfile = ref(false)
const profileSaved = ref(false)
const savingShipping = ref(false)
const shippingSaved = ref(false)

async function loadOrders() {
  if (!import.meta.client || !user.value) return
  const { db } = useFirebase()
  const snap = await getDocs(
    query(collection(db, 'users', user.value.uid, 'orders'), orderBy('createdAt', 'desc')),
  )
  orders.value = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Order) }))
  ordersLoaded.value = true
}

watch(
  user,
  (u) => {
    if (u) void loadOrders()
    else {
      orders.value = []
      ordersLoaded.value = false
    }
  },
  { immediate: true },
)

async function onSaveProfile() {
  savingProfile.value = true
  profileSaved.value = false
  try {
    await save({ displayName: profile.value.displayName, phone: profile.value.phone })
    // Keep the Firebase account displayName (and header avatar) in sync.
    const { auth } = useFirebase()
    if (auth.currentUser && profile.value.displayName) {
      await updateProfile(auth.currentUser, { displayName: profile.value.displayName })
      if (user.value) user.value = { ...user.value, displayName: profile.value.displayName }
    }
    profileSaved.value = true
  } finally {
    savingProfile.value = false
  }
}

async function onSaveShipping() {
  savingShipping.value = true
  shippingSaved.value = false
  try {
    await save()
    shippingSaved.value = true
  } finally {
    savingShipping.value = false
  }
}

function fmtAmount(o: StoredOrder) {
  return formatPrice(o.amount) ?? `${o.amount} ${o.currency}`
}

function fmtDate(o: StoredOrder): string {
  const ts = o.createdAt as { toDate?: () => Date } | null
  if (!ts?.toDate) return ''
  return new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(ts.toDate())
}

const inputClass =
  'w-full rounded-xl bg-surface-2 px-4 py-3 text-fg outline-none ring-1 ring-fg/10 transition-shadow focus:ring-2 focus:ring-primary'
</script>

<template>
  <section class="site-container max-w-3xl py-8 sm:py-12">
    <!-- Auth gate -->
    <div v-if="ready && !isLoggedIn" class="flex flex-col items-start gap-4">
      <h1 class="text-display text-fg">{{ t((m) => m.account.title) }}</h1>
      <p class="text-lead text-fg/70">{{ t((m) => m.account.loginRequired) }}</p>
      <UiBaseButton @click="authModal.open()">{{ t((m) => m.nav.signIn) }}</UiBaseButton>
    </div>

    <div v-else-if="isLoggedIn" class="flex flex-col gap-10">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-display text-fg">{{ t((m) => m.account.title) }}</h1>
          <p class="mt-1 text-fg/60">{{ user?.email }}</p>
        </div>
        <UiBaseButton variant="ghost" size="sm" @click="logout">
          {{ t((m) => m.auth.signOut) }}
        </UiBaseButton>
      </div>

      <!-- Personal data -->
      <div>
        <h2 class="font-display text-title text-fg">{{ t((m) => m.account.personalData) }}</h2>
        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-fg/70">{{ t((m) => m.auth.displayName) }}</span>
            <input v-model="profile.displayName" type="text" autocomplete="name" :class="inputClass" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-fg/70">{{ t((m) => m.shipping.phone) }}</span>
            <input v-model="profile.phone" type="tel" autocomplete="tel" :class="inputClass" />
          </label>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <UiBaseButton size="sm" :aria-busy="savingProfile" @click="onSaveProfile">
            {{ savingProfile ? t((m) => m.account.saving) : t((m) => m.account.save) }}
          </UiBaseButton>
          <span v-if="profileSaved" class="text-sm font-medium text-accent">{{ t((m) => m.account.saved) }}</span>
        </div>
      </div>

      <!-- Shipping -->
      <div>
        <h2 class="font-display text-title text-fg">{{ t((m) => m.account.shippingSection) }}</h2>
        <div class="mt-4">
          <ShippingAddressForm :address="profile.shipping" />
        </div>
        <div class="mt-4 flex items-center gap-3">
          <UiBaseButton size="sm" :aria-busy="savingShipping" @click="onSaveShipping">
            {{ savingShipping ? t((m) => m.account.saving) : t((m) => m.account.save) }}
          </UiBaseButton>
          <span v-if="shippingSaved" class="text-sm font-medium text-accent">{{ t((m) => m.account.saved) }}</span>
        </div>
      </div>

      <!-- Orders -->
      <div>
        <h2 class="font-display text-title text-fg">{{ t((m) => m.account.orders) }}</h2>
        <p v-if="ordersLoaded && !orders.length" class="mt-3 text-fg/60">
          {{ t((m) => m.account.noOrders) }}
        </p>
        <ul v-else class="mt-4 flex flex-col gap-3">
          <li
            v-for="o in orders"
            :key="o.id"
            class="flex items-center justify-between gap-4 rounded-2xl bg-surface p-4 ring-1 ring-fg/5"
          >
            <div>
              <p class="font-semibold text-fg">{{ fmtDate(o) }}</p>
              <p class="text-sm text-fg/60">
                {{ o.items.reduce((n, i) => n + i.quantity, 0) }} {{ t((m) => m.cart.itemsCount) }} · {{ o.status }}
              </p>
            </div>
            <span class="text-lg font-bold text-fg">{{ fmtAmount(o) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
