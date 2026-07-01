<script setup lang="ts">
import type { SortKey } from '~/types/ui'

defineProps<{ tags: string[]; count: number }>()

const sort = defineModel<SortKey>('sort', { default: 'newest' })
const tag = defineModel<string | null>('tag', { default: null })

const { t } = useT()
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <!-- Tag filter (horizontal scroll on mobile) -->
    <div
      v-if="tags.length"
      class="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      role="group"
      aria-label="Filtra per tag"
    >
      <button
        type="button"
        class="raised shrink-0 rounded-pill px-3 py-1.5 text-sm font-medium transition-colors"
        :class="tag === null ? 'bg-primary text-on-primary' : 'bg-surface-2 text-fg/70 hover:text-fg'"
        @click="tag = null"
      >
        {{ t((m) => m.catalog.all) }}
      </button>
      <button
        v-for="tg in tags"
        :key="tg"
        type="button"
        class="raised shrink-0 rounded-pill px-3 py-1.5 text-sm font-medium capitalize transition-colors"
        :class="tag === tg ? 'bg-primary text-on-primary' : 'bg-surface-2 text-fg/70 hover:text-fg'"
        @click="tag = tg"
      >
        {{ tg }}
      </button>
    </div>

    <div class="flex items-center gap-3">
      <span class="text-sm text-fg/50">{{ count }} {{ t((m) => m.catalog.results) }}</span>
      <label class="sr-only" for="sort">{{ t((m) => m.catalog.sortLabel) }}</label>
      <select
        id="sort"
        v-model="sort"
        class="field field-pill field-select min-h-10 py-2 text-sm"
      >
        <option value="newest">{{ t((m) => m.catalog.sortNewest) }}</option>
        <option value="priceAsc">{{ t((m) => m.catalog.sortPriceAsc) }}</option>
        <option value="priceDesc">{{ t((m) => m.catalog.sortPriceDesc) }}</option>
      </select>
    </div>
  </div>
</template>
