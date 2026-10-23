<script setup lang="ts">
/** The configurable bag models, each linking to the configurator preset on it. */
import { BAGS } from '~/utils/stella/options'
</script>

<template>
  <ul class="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
    <li v-for="(b, i) in BAGS" :key="b.id">
      <BagTile :bag="b" :eager="i < 2" />
    </li>
  </ul>
</template>
