<script setup lang="ts">
withDefaults(
  defineProps<{ tone?: 'primary' | 'accent' | 'gold' | 'neutral' | 'outline' }>(),
  { tone: 'neutral' },
)

const TONES: Record<string, string> = {
  primary: 'bg-primary text-on-primary',
  accent: 'bg-accent text-on-primary',
  gold: 'bg-gold text-on-primary',
  neutral: 'bg-fg/8 text-fg',
  outline: 'border border-fg/25 text-fg',
}
</script>

<template>
  <span
    class="eyebrow inline-flex items-center gap-1 rounded-pill px-3 py-1 text-[0.7rem]"
    :class="TONES[tone]"
  >
    <slot />
  </span>
</template>
