import { usePreferredReducedMotion } from '@vueuse/core'

/**
 * Reactive `prefers-reduced-motion`. Used to *skip* JS-driven effects such as
 * parallax (CSS already neutralises transitions/animations globally). SSR-safe:
 * resolves to 'no-preference' on the server and corrects on the client.
 */
export function useMotionPreference() {
  const preference = usePreferredReducedMotion()
  const reduced = computed(() => preference.value === 'reduce')
  return { preference, reduced }
}
