<script setup lang="ts">
import type { SortKey } from '~/types/ui'

defineProps<{ tags: string[]; count: number }>()

const sort = defineModel<SortKey>('sort', { default: 'newest' })
const tag = defineModel<string | null>('tag', { default: null })

const { t } = useT()
const id = useId()
// On phones the tag filters fold into a panel behind a "Filtri" toggle.
const open = ref(false)
</script>

<template>
  <div class="border-y border-line">
    <div class="flex min-h-14 items-center justify-between gap-4">
      <div class="flex items-center gap-6">
        <button
          v-if="tags.length"
          type="button"
          class="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink md:hidden"
          :aria-expanded="open"
          :aria-controls="`${id}-tags`"
          @click="open = !open"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
            <path d="M4 7h16M7 12h10M10 17h4" />
          </svg>
          Filtri<span v-if="tag" class="text-muted">(1)</span>
        </button>
        <span class="text-sm tabular-nums text-muted" aria-live="polite">{{ count }} {{ count === 1 ? 'pezzo' : 'pezzi' }}</span>
      </div>

      <div class="flex items-center gap-2">
        <label class="hidden text-sm text-muted sm:inline" :for="`${id}-sort`">{{ t((m) => m.catalog.sortLabel) }}</label>
        <select
          :id="`${id}-sort`"
          v-model="sort"
          class="field field-select min-h-10 bg-transparent py-2 text-sm shadow-none!"
          :aria-label="t((m) => m.catalog.sortLabel)"
        >
          <option value="newest">{{ t((m) => m.catalog.sortNewest) }}</option>
          <option value="priceAsc">{{ t((m) => m.catalog.sortPriceAsc) }}</option>
          <option value="priceDesc">{{ t((m) => m.catalog.sortPriceDesc) }}</option>
        </select>
      </div>
    </div>

    <div
      v-if="tags.length"
      :id="`${id}-tags`"
      class="flex-wrap gap-2 pb-4 md:flex md:pb-4"
      :class="open ? 'flex' : 'hidden'"
      role="group"
      aria-label="Filtra per caratteristica"
    >
      <button
        type="button"
        class="chip"
        :aria-pressed="tag === null"
        @click="tag = null"
      >
        {{ t((m) => m.catalog.all) }}
      </button>
      <button
        v-for="tg in tags"
        :key="tg"
        type="button"
        class="chip capitalize"
        :aria-pressed="tag === tg"
        @click="tag = tag === tg ? null : tg"
      >
        {{ tg }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 36px;
  padding: 0 0.9rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  color: var(--color-fg);
  transition: border-color 0.2s, background-color 0.2s, color 0.2s;
}
.chip:hover {
  border-color: var(--color-ink);
}
.chip[aria-pressed='true'] {
  background: var(--color-ink);
  border-color: var(--color-ink);
  color: var(--color-bg);
}
.chip[aria-pressed='true']::before {
  content: '✓';
  font-size: 0.7rem;
}
</style>
