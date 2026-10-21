<script setup lang="ts">
useSeoHead({
  title: 'Customize · Stella Bag',
  description:
    'Personalizza la tua borsa in 3D: modello, lavaggio del denim, fodera, toppe patchwork, accessori in metallo e iniziali ricamate.',
})
</script>

<template>
  <div class="site-container py-6 sm:py-8">
    <ClientOnly>
      <StellaConfigurator />
      <template #fallback>
        <div class="grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_350px]" aria-busy="true">
          <div class="h-[400px] animate-pulse rounded-card bg-[#8b8277] sm:h-[610px]" />
          <div class="panel-glass flex h-[610px] flex-col items-center rounded-[22px] p-6">
            <h1 class="text-[15.5px] tracking-[0.06em]">Customize your bag</h1>
            <p class="mt-6 text-sm text-muted">Loading configurator…</p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
