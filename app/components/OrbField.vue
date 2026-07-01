<script setup lang="ts">
/**
 * Decorative floating gradient orbs for depth. Purely presentational
 * (aria-hidden), GPU-animated; the global stylesheet freezes the float under
 * prefers-reduced-motion. `hero` adds a third orb.
 */
withDefaults(defineProps<{ density?: 'hero' | 'section' }>(), { density: 'section' })
</script>

<template>
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <span class="orb orb-a" />
    <span class="orb orb-b" />
    <span v-if="density === 'hero'" class="orb orb-c" />
  </div>
</template>

<style scoped>
.orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(64px);
  will-change: transform;
}
.orb-a {
  width: clamp(220px, 40vw, 440px);
  aspect-ratio: 1;
  top: -8%;
  right: -6%;
  opacity: 0.5;
  background: radial-gradient(circle, var(--color-primary), transparent 68%);
  animation: float-a 16s var(--ease-out-soft) infinite;
}
.orb-b {
  width: clamp(200px, 38vw, 400px);
  aspect-ratio: 1;
  bottom: -12%;
  left: -8%;
  opacity: 0.45;
  background: radial-gradient(circle, var(--color-accent-2), transparent 68%);
  animation: float-b 20s var(--ease-out-soft) infinite;
}
.orb-c {
  width: clamp(160px, 28vw, 320px);
  aspect-ratio: 1;
  top: 38%;
  left: 40%;
  opacity: 0.3;
  background: radial-gradient(circle, var(--color-primary), transparent 70%);
  animation: float-a 24s var(--ease-out-soft) infinite reverse;
}
@keyframes float-a {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-24px, 30px, 0); }
}
@keyframes float-b {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(28px, -26px, 0); }
}
</style>
