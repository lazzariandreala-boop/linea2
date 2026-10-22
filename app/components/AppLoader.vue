<script setup lang="ts">
/**
 * Full-screen loading overlay: blurs the page and spins the round Linea 2 logo.
 * Shown for page navigations and for anything that calls useGlobalLoading().
 * A short delay keeps it from flashing on loads that finish instantly.
 */
const { active, start } = useGlobalLoading()
const config = useRuntimeConfig()
const nuxtApp = useNuxtApp()

let stopPage: (() => void) | null = null
const offStart = nuxtApp.hook('page:loading:start', () => {
  stopPage ??= start()
})
const offEnd = nuxtApp.hook('page:loading:end', () => {
  stopPage?.()
  stopPage = null
})

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
watch(active, (on) => {
  clearTimeout(timer)
  if (on) timer = setTimeout(() => (visible.value = true), 150)
  else visible.value = false
})

onBeforeUnmount(() => {
  offStart()
  offEnd()
  clearTimeout(timer)
  stopPage?.()
})
</script>

<template>
  <Transition name="loader">
    <div
      v-if="visible"
      class="fixed inset-0 z-[300] grid place-items-center bg-bg/40 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div class="relative grid h-28 w-28 place-items-center">
        <span class="loader-glow absolute inset-0 rounded-full" aria-hidden="true" />
        <img
          :src="config.public.logoUrl"
          alt=""
          width="84"
          height="84"
          class="loader-spin relative h-21 w-21 rounded-full object-cover ring-1 ring-brass/60 shadow-float"
        >
      </div>
      <span class="sr-only">Caricamento…</span>
    </div>
  </Transition>
</template>

<style scoped>
.loader-spin {
  animation: loader-spin 1.4s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
}
.loader-glow {
  background: radial-gradient(closest-side, rgb(194 166 117 / 0.45), transparent);
  animation: loader-pulse 1.4s ease-in-out infinite;
}
@keyframes loader-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes loader-pulse {
  50% {
    transform: scale(1.18);
    opacity: 0.55;
  }
}
.loader-enter-active,
.loader-leave-active {
  transition: opacity 0.25s ease;
}
.loader-enter-from,
.loader-leave-to {
  opacity: 0;
}
</style>
