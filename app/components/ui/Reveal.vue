<script setup lang="ts">
/**
 * Scroll-reveal wrapper (fade + translate, transform/opacity only). Plays once
 * when scrolled into view. Reduced motion is honoured two ways: the global
 * stylesheet zeroes transition durations AND forces `[data-reveal]` visible, so
 * content is never hidden from a reduced-motion user even before intersection.
 */
interface Props {
  as?: string
  /** Vertical offset (px) the element animates up from. */
  y?: number
  /** Horizontal offset (px). */
  x?: number
  /** Stagger delay (ms). */
  delay?: number
  /** Animation duration (ms). */
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  y: 24,
  x: 0,
  delay: 0,
  duration: 620,
})

const initial = computed(() => ({ opacity: 0, y: props.y, x: props.x }))
const enter = computed(() => ({
  opacity: 1,
  y: 0,
  x: 0,
  transition: { duration: props.duration, ease: 'easeOut' as const },
}))
</script>

<template>
  <component
    :is="as"
    v-motion
    data-reveal
    :initial="initial"
    :visible-once="enter"
    :delay="delay"
  >
    <slot />
  </component>
</template>
