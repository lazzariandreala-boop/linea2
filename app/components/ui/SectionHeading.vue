<script setup lang="ts">
/** Section title in the editorial style: a brass-ruled kicker, serif title. */
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
    <p v-if="eyebrow" class="kicker">{{ eyebrow }}</p>
    <component :is="as" class="text-display" :class="{ 'mt-4': eyebrow }">{{ title }}</component>
    <p v-if="subtitle" class="mt-4 max-w-(--text-max) text-lead text-muted" :class="{ 'mx-auto': align === 'center' }">{{ subtitle }}</p>
  </div>
</template>
