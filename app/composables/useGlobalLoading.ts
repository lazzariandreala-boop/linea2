/**
 * Site-wide loading overlay (AppLoader). Anything slow calls `start()` and the
 * returned `stop()` when done; the overlay stays up while at least one task is
 * running. `stop()` is idempotent, so it is safe in finally blocks and timers.
 */
export function useGlobalLoading() {
  const count = useState('global-loading', () => 0)

  function start(): () => void {
    count.value++
    let stopped = false
    return () => {
      if (stopped) return
      stopped = true
      count.value = Math.max(0, count.value - 1)
    }
  }

  /** Keeps the overlay up while `ref` is true (e.g. a component's `loading`). */
  function bind(source: () => boolean) {
    let stop: (() => void) | null = null
    watch(
      source,
      (on) => {
        if (on && !stop) stop = start()
        else if (!on && stop) (stop(), (stop = null))
      },
      { immediate: true },
    )
    onScopeDispose(() => stop?.())
  }

  return { active: computed(() => count.value > 0), start, bind }
}
