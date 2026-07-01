import { messages, type Locale, type Messages } from '~/i18n/messages'

/**
 * Minimal, fully-typed translation accessor. Reads the active locale from
 * runtime config and selects strings via a typed selector (no string keys, no
 * `any`): `const { t } = useT(); t(m => m.nav.home)`.
 */
export function useT() {
  const config = useRuntimeConfig()
  const requested = config.public.defaultLocale
  const locale: Locale = requested === 'en' || requested === 'it' ? requested : 'it'
  const dict = messages[locale]

  function t(select: (m: Messages) => string): string {
    return select(dict)
  }

  return { t, locale, dict }
}
