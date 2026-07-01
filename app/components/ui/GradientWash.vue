<script setup lang="ts">
import type { GradientComponent } from '~/types/content'

/**
 * Decorative gradient backdrop. Uses the brand CSS wash by default, or a
 * Strapi-driven `shared.gradient` component when provided (with a glow overlay
 * for depth). Purely presentational — aria-hidden, never interactive.
 */
const props = withDefaults(
  defineProps<{ variant?: 'hero' | 'soft'; gradient?: GradientComponent | null }>(),
  { variant: 'hero', gradient: null },
)

const customStyle = computed(() => {
  const g = props.gradient
  if (!g) return undefined
  const stops = [g.from, g.via, g.to].filter(Boolean).join(', ')
  return { backgroundImage: `linear-gradient(${g.angle}deg, ${stops})` }
})
</script>

<template>
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div
      class="absolute inset-0"
      :class="gradient ? '' : variant === 'hero' ? 'wash-hero' : 'wash-soft'"
      :style="customStyle"
    />
    <div v-if="gradient" class="absolute inset-0 wash-glow" />
  </div>
</template>
