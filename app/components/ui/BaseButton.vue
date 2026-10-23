<script setup lang="ts">
/**
 * Polymorphic button: renders <NuxtLink> for internal `to`, <a> for `href`,
 * otherwise <button>. Large tap targets (min 44–52px), GPU-friendly press
 * micro-interaction (active:scale), no layout shift.
 */
interface Props {
  to?: string
  href?: string
  variant?: 'solid' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  target?: string
  rel?: string
  type?: 'button' | 'submit'
  block?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'solid',
  size: 'md',
  type: 'button',
})

const tag = computed(() =>
  props.to ? resolveComponent('NuxtLink') : props.href ? 'a' : 'button',
)

const VARIANTS: Record<string, string> = {
  solid: 'btn-solid',
  outline: 'border border-ink/50 text-ink hover:border-ink hover:bg-ink hover:text-bg',
  ghost: 'text-ink underline-offset-4 hover:underline',
}

const SIZES: Record<string, string> = {
  sm: 'px-5 py-2 text-[11px] min-h-[40px]',
  md: 'px-6 py-3 text-[11.5px] min-h-[46px]',
  lg: 'px-8 py-3.5 text-[12px] min-h-[52px]',
}
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :target="target"
    :rel="rel"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? disabled : undefined"
    class="inline-flex select-none items-center justify-center gap-2 rounded-sm font-semibold uppercase tracking-[0.16em] transition-[transform,background-color,border-color,color] duration-300 ease-out-soft active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55"
    :class="[VARIANTS[variant], SIZES[size], block ? 'w-full' : '']"
  >
    <slot />
  </component>
</template>
