<script setup lang="ts">
import type { Product } from '~/types/content'

const props = withDefaults(
  defineProps<{
    product: Product
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
    /** Compact round icon button (used as a quick-add on product cards). */
    icon?: boolean
  }>(),
  { size: 'md', block: false, icon: false },
)

const { t } = useT()
const { add } = useCart()

const purchasable = computed(
  () => props.product.price !== null && props.product.price !== undefined,
)

const justAdded = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

function onAdd(e: MouseEvent) {
  // Safe in both contexts: on a card the button sits inside a <NuxtLink>, so we
  // must not navigate; standalone this is a harmless no-op.
  e.preventDefault()
  e.stopPropagation()
  if (!purchasable.value) return
  if (add(props.product)) {
    justAdded.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => (justAdded.value = false), 1600)
  }
}

onBeforeUnmount(() => timer && clearTimeout(timer))
</script>

<template>
  <!-- Compact quick-add (cards) -->
  <button
    v-if="icon"
    v-show="purchasable"
    type="button"
    class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary transition-transform duration-200 ease-out-soft hover:bg-primary-strong active:scale-90"
    :aria-label="t((m) => m.cart.addToCart)"
    :title="t((m) => m.cart.addToCart)"
    @click="onAdd"
  >
    <svg v-if="!justAdded" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
    <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  </button>

  <!-- Full-label button (detail page). Disabled state for display-only items. -->
  <UiBaseButton
    v-else-if="purchasable"
    :size="size"
    :block="block"
    @click="onAdd"
  >
    <svg v-if="!justAdded" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
    {{ justAdded ? t((m) => m.cart.added) : t((m) => m.cart.addToCart) }}
  </UiBaseButton>

  <p v-else class="text-sm font-medium text-fg/50">{{ t((m) => m.cart.priceOnRequest) }}</p>
</template>
