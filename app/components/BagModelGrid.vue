<script setup lang="ts">
/** The configurable bag models, each linking to the configurator preset on it. */
import { BAGS } from '~/utils/stella/options'
</script>

<template>
  <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
    <li v-for="b in BAGS" :key="b.id">
      <NuxtLink :to="`/customize?model=${b.id}`" class="group block text-center">
        <div class="overflow-hidden rounded-card">
          <img
            :src="`/editorial/bag-${b.id}.webp`"
            :alt="`Borsa ${b.name}, ${b.type}`"
            width="900"
            height="1080"
            loading="lazy"
            class="aspect-[5/6] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
          />
        </div>
        <span class="mt-3 block font-display text-base uppercase tracking-[0.14em]">{{ b.name }}</span>
        <span class="mt-0.5 block text-xs text-muted">{{ b.type }}</span>
        <span class="mt-1 block text-sm font-bold">da €{{ b.p }}</span>
      </NuxtLink>
    </li>
  </ul>
</template>
