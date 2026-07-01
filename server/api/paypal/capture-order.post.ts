import { defineEventHandler, readBody, createError } from 'h3'
import { ofetch } from 'ofetch'
import { getPayPalAccessToken, paypalCredentials } from '../../utils/paypal'

interface CaptureResponse {
  status?: string
  purchase_units?: Array<{ payments?: { captures?: Array<{ id?: string }> } }>
}

/**
 * Capture an approved PayPal order. Returns the capture id + status, which the
 * client stores on the Firestore order record.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { clientId, secret, base } = paypalCredentials(config)

  const body = await readBody<{ orderId?: string }>(event)
  const orderId = body?.orderId
  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'orderId mancante' })
  }

  const token = await getPayPalAccessToken(base, clientId, secret)
  const capture = await ofetch<CaptureResponse>(
    `${base}/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: {},
    },
  )

  const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null
  return { orderId, captureId, status: capture.status ?? null }
})
