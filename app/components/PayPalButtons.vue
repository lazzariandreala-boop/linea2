<script setup lang="ts">
/**
 * PayPal Standard Checkout buttons. Loads the browser JS SDK once, then wires
 * createOrder/onApprove to our server routes (which hold the secret). Emits
 * `paid` with the PayPal order + capture id so the parent can persist the order
 * and clear the cart. Rendered inside <ClientOnly> — SDK needs the browser.
 */
interface PayPalActionsResult {
  render: (el: HTMLElement) => Promise<void>
}
interface PayPalNamespace {
  Buttons: (config: Record<string, unknown>) => PayPalActionsResult
}
type WindowWithPayPal = Window & { paypal?: PayPalNamespace }

const props = defineProps<{ amount: number }>()
const emit = defineEmits<{
  paid: [payload: { orderId: string; captureId: string | null }]
  error: []
  cancel: []
}>()

const config = useRuntimeConfig()
const container = ref<HTMLElement | null>(null)

/** Module-shared loader so the SDK <script> is injected at most once. */
let sdkPromise: Promise<PayPalNamespace> | null = null
function loadSdk(clientId: string, currency: string): Promise<PayPalNamespace> {
  const w = window as WindowWithPayPal
  if (w.paypal) return Promise.resolve(w.paypal)
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture`
    s.onload = () => {
      const ns = (window as WindowWithPayPal).paypal
      ns ? resolve(ns) : reject(new Error('PayPal SDK unavailable after load'))
    }
    s.onerror = () => reject(new Error('PayPal SDK failed to load'))
    document.head.appendChild(s)
  })
  return sdkPromise
}

onMounted(async () => {
  const clientId = config.public.paypalClientId
  if (!clientId || !container.value) return
  try {
    const paypal = await loadSdk(clientId, config.public.paypalCurrency || 'EUR')
    paypal
      .Buttons({
        style: { layout: 'vertical', shape: 'pill', color: 'gold', label: 'pay' },
        createOrder: async () => {
          const res = await $fetch<{ id: string }>('/api/paypal/create-order', {
            method: 'POST',
            body: { amount: props.amount },
          })
          return res.id
        },
        onApprove: async (data: { orderID: string }) => {
          const res = await $fetch<{ orderId: string; captureId: string | null }>(
            '/api/paypal/capture-order',
            { method: 'POST', body: { orderId: data.orderID } },
          )
          emit('paid', { orderId: res.orderId, captureId: res.captureId })
        },
        onCancel: () => emit('cancel'),
        onError: () => emit('error'),
      })
      .render(container.value)
      .catch(() => emit('error'))
  } catch {
    emit('error')
  }
})
</script>

<template>
  <div ref="container" />
</template>
