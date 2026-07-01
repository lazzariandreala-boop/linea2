import { defineEventHandler, readBody, createError } from 'h3'
import { ofetch } from 'ofetch'
import { getPayPalAccessToken, paypalCredentials } from '../../utils/paypal'

/**
 * Create a PayPal order (intent CAPTURE) for the given amount and return its id
 * to the browser JS SDK. NOTE: the amount is currently trusted from the client;
 * once the catalog moves server-side, recompute it here from authoritative
 * prices before creating the order.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { clientId, secret, base, currency } = paypalCredentials(config)

  const body = await readBody<{ amount?: number }>(event)
  const amount = Number(body?.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Importo non valido' })
  }

  const token = await getPayPalAccessToken(base, clientId, secret)
  const order = await ofetch<{ id: string }>(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: currency, value: amount.toFixed(2) },
          description: 'Ordine Linea 2',
        },
      ],
    },
  })

  return { id: order.id }
})
