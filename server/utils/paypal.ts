// This Nitro nightly does NOT auto-import h3 utilities NOR expose $fetch as a
// global in server code, so we import them explicitly (same reason
// useRuntimeConfig is registered as a preset in nuxt.config). ofetch is the
// library behind $fetch; `Buffer` remains a Node runtime global.
import { createError } from 'h3'
import { ofetch } from 'ofetch'

/**
 * PayPal REST helpers (Orders API v2). Server-only: the client secret never
 * leaves the server. Base URL is chosen from the configured environment.
 */
export function paypalApiBase(env: string): string {
  return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
}

/** Client-credentials OAuth2 token used to authorise Orders API calls. */
export async function getPayPalAccessToken(
  base: string,
  clientId: string,
  secret: string,
): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64')
  const res = await ofetch<{ access_token: string }>(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  return res.access_token
}

/** Resolve PayPal credentials from runtime config or throw a 503 if unset. */
export function paypalCredentials(config: {
  public: { paypalClientId: string; paypalCurrency: string }
  paypalSecret: string
  paypalEnv: string
}) {
  const clientId = config.public.paypalClientId
  const secret = config.paypalSecret
  if (!clientId || !secret) {
    throw createError({ statusCode: 503, statusMessage: 'PayPal non configurato' })
  }
  return {
    clientId,
    secret,
    base: paypalApiBase(config.paypalEnv),
    currency: config.public.paypalCurrency || 'EUR',
  }
}
