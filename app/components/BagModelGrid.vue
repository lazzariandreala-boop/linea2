<script setup lang="ts">
/** The configurable bag models, each linking to the configurator preset on it. */
import { BAGS } from '~/utils/stella/options'
</script>

<template>
  <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
    <li v-for="b in BAGS" :key="b.id">
      <NuxtLink
        :to="`/customize?model=${b.id}`"
        class="group block overflow-hidden rounded-card border border-fg/10 bg-surface transition-colors hover:border-brass/60"
      >
        <img
          :src="b.thumb"
          :alt="`Borsa ${b.name} in denim, anteprima`"
          width="360"
          height="360"
          loading="lazy"
          class="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span class="block px-3 py-3">
          <span class="label-caps block text-sm text-fg">{{ b.name }}</span>
          <span class="mt-0.5 block text-xs text-muted">{{ b.type }}</span>
          <span class="mt-1.5 block font-mono text-[11px] text-brass-hi">from €{{ b.p }}</span>
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>
