/** Formats an optional price as EUR currency, or returns null when absent. */
export function formatPrice(value: number | null | undefined, locale = 'it-IT'): string | null {
  if (value === null || value === undefined) return null
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value)
}
