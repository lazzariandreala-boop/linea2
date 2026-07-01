<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t } = useT()

useHead({ title: String(props.error.statusCode ?? 'Errore') })

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
    <UiGradientWash variant="soft" />
    <p class="font-display text-hero font-extrabold text-accent">{{ error.statusCode }}</p>
    <p class="mt-2 max-w-md text-lead text-fg/80">
      {{ error.statusMessage || 'Pagina non trovata' }}
    </p>
    <UiBaseButton class="mt-8" size="lg" @click="goHome">
      {{ t((m) => m.nav.home) }}
    </UiBaseButton>
  </div>
</template>
