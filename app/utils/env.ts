/**
 * Coerce a runtime-config flag to a boolean. Public runtime config overridden
 * via NUXT_PUBLIC_* env vars can arrive as the STRING "false"/"true" (which is
 * truthy!), so boolean flags must be normalised before use — otherwise toggling
 * NUXT_PUBLIC_USE_MOCKS=false would have no effect.
 */
export function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === 'true' || value === '1'
  return fallback
}
