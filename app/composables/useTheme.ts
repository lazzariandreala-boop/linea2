export type Theme = 'light' | 'dark'

/** localStorage key holding the user's explicit choice (survives reloads). */
const STORAGE_KEY = 'linea2-theme'

/** Keeps the browser UI (address bar / status bar) in sync with the canvas. */
const THEME_COLOR: Record<Theme, string> = {
  dark: '#121a2c',
  light: '#f9f9fb',
}

/**
 * App-wide light/dark theme, toggled from the header.
 *
 * The active theme lives as `data-theme` on <html>; every design token in
 * main.css is re-pointed under `[data-theme='light']`, so flipping the
 * attribute re-skins the whole UI with no per-component work.
 *
 * SSR-safe: state is shared via `useState` and the DOM is only touched on the
 * client. The initial value is read from the attribute the no-FOUC inline
 * script (nuxt.config) already set before hydration, so the toggle reflects
 * reality on first paint and there is no flash of the wrong theme.
 */
export function useTheme() {
  const theme = useState<Theme>('theme', () => 'dark')

  function apply(value: Theme) {
    if (!import.meta.client) return
    document.documentElement.dataset.theme = value
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[value])
  }

  function set(value: Theme) {
    theme.value = value
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, value)
      } catch {
        // Private mode / storage disabled — the in-memory state still works.
      }
    }
    apply(value)
  }

  function toggle() {
    set(theme.value === 'dark' ? 'light' : 'dark')
  }

  // Adopt whatever the pre-hydration script resolved (stored choice, else
  // dark) so reactive consumers match the painted DOM.
  onMounted(() => {
    const current = document.documentElement.dataset.theme
    theme.value = current === 'light' ? 'light' : 'dark'
  })

  return { theme, toggle, set }
}
