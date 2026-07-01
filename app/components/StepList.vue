<script setup lang="ts">
import type { TutorialStep } from '~/types/content'

defineProps<{ steps: TutorialStep[] }>()
</script>

<template>
  <ol class="space-y-8">
    <li v-for="(step, i) in steps" :key="step.id" class="flex gap-4">
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-on-primary"
        aria-hidden="true"
      >
        {{ i + 1 }}
      </span>
      <div class="flex-1">
        <h3 class="font-display text-lg font-bold text-fg">{{ step.title }}</h3>
        <p class="mt-1 text-fg/70">{{ step.body }}</p>
        <UiStrapiImage
          v-if="step.image"
          :media="step.image"
          :width="800"
          :height="600"
          sizes="(min-width: 768px) 45vw, 92vw"
          rounded
          class="mt-4 max-w-md"
        />
      </div>
    </li>
  </ol>
</template>
