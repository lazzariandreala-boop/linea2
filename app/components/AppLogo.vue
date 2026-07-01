<script setup lang="ts">
/**
 * Brand logo lockup: a circular (avatar-style) logo image + wordmark. Renders
 * the image at runtimeConfig.public.logoUrl (drop public/logo.png|svg) and
 * falls back to the wordmark alone if it is missing or fails to load.
 */
const props = withDefaults(defineProps<{ height?: number; wordmark?: boolean }>(), {
  height: 30,
  wordmark: true,
})

const config = useRuntimeConfig()
const src = config.public.logoUrl
const failed = ref(false)
</script>

<template>
  <span class="inline-flex items-center gap-2.5 font-display font-extrabold leading-none tracking-tight">
    <img
      v-if="src && !failed"
      :src="src"
      alt="Linea 2 — upcycling"
      :width="height"
      :height="height"
      :style="{ height: `${height}px`, width: `${height}px` }"
      class="shrink-0 rounded-full object-cover ring-1 ring-fg/15"
      decoding="async"
      @error="failed = true"
    />
    <span v-if="wordmark || failed">linea<span class="text-accent">2</span></span>
  </span>
</template>
