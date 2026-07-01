<script setup lang="ts">
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
    <p v-if="eyebrow" class="eyebrow text-accent">{{ eyebrow }}</p>
    <component :is="as" class="mt-3 text-title text-fg">{{ title }}</component>
    <p v-if="subtitle" class="mt-3 text-lead text-fg/70">{{ subtitle }}</p>
  </div>
</template>
