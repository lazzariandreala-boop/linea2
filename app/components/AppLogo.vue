<script setup lang="ts">
/**
 * Brand lockup: the "L I N E A  2" serif wordmark, widely spaced, with the
 * round logo mark (oval with the two lines) beside it when `mark` is set.
 * `tagline` adds "Upcycling fatto a mano in Italia" below.
 */
const props = withDefaults(
  defineProps<{ height?: number; mark?: boolean; tagline?: boolean }>(),
  { height: 24, mark: false, tagline: false },
)

const config = useRuntimeConfig()
const src = config.public.logoUrl
const failed = ref(false)
</script>

<template>
  <span class="inline-flex items-center gap-3 leading-none">
    <img
      v-if="props.mark && src && !failed"
      :src="src"
      alt=""
      :width="props.height * 1.4"
      :height="props.height * 1.4"
      :style="{ height: `${props.height * 1.4}px`, width: `${props.height * 1.4}px` }"
      class="shrink-0 rounded-full object-cover"
      decoding="async"
      @error="failed = true"
    />
    <span class="grid justify-items-start gap-2">
      <span
        class="font-logo font-medium uppercase text-fg"
        :style="{ fontSize: `${props.height}px`, letterSpacing: '0.42em', marginRight: '-0.42em' }"
      >Linea 2</span>
      <span v-if="props.tagline" class="text-[12px] tracking-[0.02em] text-muted">Upcycling fatto a mano in Italia</span>
    </span>
  </span>
</template>
