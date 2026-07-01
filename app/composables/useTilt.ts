/**
 * Pointer-driven 3D tilt + glare for cards. GPU-friendly (transform/opacity
 * only). Skips touch pointers (mobile gets the static depth/parallax instead)
 * and is disabled under prefers-reduced-motion. Bind the returned handlers and
 * `tiltStyle` to a positioned element; render a glare overlay with `glareStyle`.
 */
export function useTilt(options: { max?: number; scale?: number } = {}) {
  const max = options.max ?? 8
  const scale = options.scale ?? 1.02
  const { reduced } = useMotionPreference()

  const tiltStyle = ref<Record<string, string>>({})
  const glareStyle = ref<Record<string, string>>({ opacity: '0' })

  function onPointerMove(e: PointerEvent) {
    if (reduced.value || e.pointerType === 'touch') return
    const el = e.currentTarget as HTMLElement
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const rx = (0.5 - py) * max
    const ry = (px - 0.5) * max
    tiltStyle.value = {
      transform: `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${scale})`,
    }
    glareStyle.value = {
      opacity: '1',
      background: `radial-gradient(circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(255,255,255,0.16), transparent 55%)`,
    }
  }

  function reset() {
    tiltStyle.value = { transform: '' }
    glareStyle.value = { opacity: '0' }
  }

  return { tiltStyle, glareStyle, onPointerMove, reset }
}
