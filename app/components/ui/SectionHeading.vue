<script setup lang="ts">
/** Section title in the editorial style: a short ochre rule, serif title. */
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    subtitle?: string
    align?: 'left' | 'center'
    as?: string
  }>(),
  { align: 'left', as: 'h2' },
)
</script>

<template>
  <div :class="align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'">
    <span class="ochre-rule" :class="{ 'mx-auto': align === 'center' }" aria-hidden="true" />
    <p v-if="eyebrow" class="eyebrow mt-4 text-accent">{{ eyebrow }}</p>
    <component :is="as" class="mt-3 text-display text-fg">{{ title }}</component>
    <p v-if="subtitle" class="mt-3 text-lead text-muted">{{ subtitle }}</p>
  </div>
</template>
