<script setup lang="ts">
useSeoHead({
  title: 'Personalizza la tua borsa',
  description:
    'Personalizza la tua borsa: modello, lavaggio del denim, fodera, toppe patchwork, accessori in metallo e iniziali ricamate.',
})
</script>

<template>
  <div class="site-container py-6 sm:py-8">
    <ClientOnly>
      <StellaConfigurator />
      <template #fallback>
        <div class="grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_350px]" aria-busy="true">
          <div class="h-[400px] animate-pulse rounded-card bg-surface-2 sm:h-[610px]" />
          <div class="panel-glass flex h-[610px] flex-col items-center rounded-[22px] p-6">
            <h1 class="font-display text-xl">Personalizza la tua borsa</h1>
            <p class="mt-6 text-sm text-muted">Carico il configuratore…</p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
