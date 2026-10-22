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
  outline: 'border border-fg/40 text-fg hover:border-fg hover:bg-fg/5',
  ghost: 'text-fg hover:bg-fg/8',
}

const SIZES: Record<string, string> = {
  sm: 'px-5 py-2 text-[11.5px] min-h-[40px]',
  md: 'px-6 py-3 text-[12px] min-h-[46px]',
  lg: 'px-8 py-3.5 text-[12.5px] min-h-[50px]',
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
    class="inline-flex select-none items-center justify-center gap-2 rounded-lg font-bold uppercase tracking-[0.14em] transition-[transform,background-color,border-color] duration-200 ease-out-soft active:scale-[0.98] disabled:opacity-60"
    :class="[VARIANTS[variant], SIZES[size], block ? 'w-full' : '']"
  >
    <slot />
  </component>
</template>
