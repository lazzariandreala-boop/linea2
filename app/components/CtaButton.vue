<script setup lang="ts">
import type { CtaComponent } from '~/types/content'

/**
 * Renders a typed CTA as the correct link (wa.me / mailto / external), with an
 * icon matching the kind. WhatsApp/DM is the dominant, first-class path.
 */
const props = withDefaults(
  defineProps<{
    cta: CtaComponent
    variant?: 'solid' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
  }>(),
  { variant: 'solid', size: 'md' },
)

const attrs = computed(() => ctaAttrs(props.cta))
</script>

<template>
  <UiBaseButton
    :href="attrs.href"
    :target="attrs.target"
    :rel="attrs.rel"
    :variant="variant"
    :size="size"
    :block="block"
  >
    <svg
      v-if="cta.kind === 'whatsapp'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.45 1.33 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm5.84 14.06c-.25.69-1.45 1.32-2 1.4-.51.08-1.16.11-1.87-.12-.43-.14-.99-.32-1.7-.63-2.99-1.29-4.94-4.3-5.09-4.5-.15-.2-1.22-1.62-1.22-3.09s.77-2.19 1.05-2.49c.27-.3.59-.37.79-.37l.57.01c.18.01.43-.07.67.51.25.6.84 2.07.91 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.7.8 1.99.95.3.15.49.22.56.35.07.12.07.71-.18 1.4Z" />
    </svg>
    <svg
      v-else-if="cta.kind === 'email'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
    <svg
      v-else
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
    <span>{{ cta.label }}</span>
  </UiBaseButton>
</template>
