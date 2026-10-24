<script setup lang="ts">
withDefaults(
  defineProps<{ tone?: 'primary' | 'accent' | 'gold' | 'neutral' | 'outline' }>(),
  { tone: 'neutral' },
)

const TONES: Record<string, string> = {
  primary: 'bg-primary text-on-primary',
  accent: 'border border-white/10 bg-graphite/80 text-gold',
  gold: 'border border-brass text-accent',
  neutral: 'border border-line text-muted',
  outline: 'border border-line text-fg',
}
</script>

<template>
  <span
    class="eyebrow inline-flex items-center gap-1 rounded-xs px-2.5 py-1 text-[0.65rem]"
    :class="TONES[tone]"
  >
    <slot />
  </span>
</template>
