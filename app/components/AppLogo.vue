<script setup lang="ts">
/**
 * Brand lockup from the Stella mockup: the round logo image (oval with the two
 * lines) beside the "Linea 2" serif wordmark, with "UPCYCLED" above and the
 * LUXURY | UPCYCLED | SUSTAINABLE tagline below. The image comes from
 * runtimeConfig.public.logoUrl and is dropped silently if it fails to load.
 */
const props = withDefaults(
  defineProps<{ height?: number; wordmark?: boolean; tagline?: boolean }>(),
  { height: 30, wordmark: true, tagline: false },
)

const config = useRuntimeConfig()
const src = config.public.logoUrl
const failed = ref(false)
</script>

<template>
  <span class="inline-flex items-center gap-3 leading-none">
    <img
      v-if="src && !failed"
      :src="src"
      alt="Linea 2 — upcycling"
      :width="props.height"
      :height="props.height"
      :style="{ height: `${props.height}px`, width: `${props.height}px` }"
      class="shrink-0 rounded-full object-cover ring-1 ring-brass/40"
      decoding="async"
      @error="failed = true"
    />
    <span v-if="props.wordmark || failed" class="grid justify-items-start">
      <span
        class="font-body tracking-[0.08em] text-brass-hi"
        :style="{ fontSize: `${Math.round(props.height * 0.3)}px`, marginLeft: `${Math.round(props.height * 1.1)}px`, marginBottom: `-${Math.round(props.height * 0.1)}px` }"
      >UPCYCLED</span>
      <span class="font-logo font-medium text-fg" :style="{ fontSize: `${props.height}px` }">Linea 2</span>
      <span
        v-if="props.tagline"
        class="mt-1.5 hidden font-body tracking-[0.08em] text-fg/85 sm:block"
        :style="{ fontSize: `${Math.max(8, Math.round(props.height * 0.19))}px` }"
      >LUXURY | UPCYCLED | SUSTAINABLE</span>
    </span>
  </span>
</template>
