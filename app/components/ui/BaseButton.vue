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
  outline: 'border border-white/20 text-ink hover:border-gold hover:text-gold',
  ghost: 'text-ink underline-offset-4 hover:text-gold hover:underline',
}

const SIZES: Record<string, string> = {
  sm: 'px-5 py-2 text-[11px] tracking-[0.18em] min-h-[40px]',
  md: 'px-6 py-3 text-[11.5px] tracking-[0.2em] min-h-[46px]',
  lg: 'px-8 py-4 text-[12px] tracking-[0.2em] min-h-[54px]',
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
    class="inline-flex select-none items-center justify-center gap-2 rounded-sm font-semibold uppercase transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-out-soft active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55"
    :class="[VARIANTS[variant], SIZES[size], block ? 'w-full' : '']"
  >
    <slot />
  </component>
</template>
