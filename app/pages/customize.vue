<script setup lang="ts">
useSeoHead({
  title: 'Personalizza la tua borsa',
  description:
    'Personalizza la tua borsa: modello, lavaggio del denim, fodera, toppe patchwork, accessori in metallo e monogramma con le tue iniziali.',
})
</script>

<template>
  <div class="site-container pb-16 pt-5 sm:pt-8">
    <ClientOnly>
      <StellaConfigurator />
      <template #fallback>
        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]" aria-busy="true">
          <div class="h-[420px] animate-pulse rounded-card bg-surface-2 sm:h-[640px]" />
          <div class="flex h-[640px] flex-col rounded-panel border border-line bg-surface p-6">
            <p class="eyebrow text-accent">Personalizza</p>
            <h1 class="mt-2 font-display text-[28px] text-ink">La tua borsa</h1>
            <p class="mt-6 text-sm text-muted">Carico il configuratore…</p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
