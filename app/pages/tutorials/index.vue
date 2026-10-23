<script setup lang="ts">
const { t } = useT()
const { tutorials } = await useTutorials()

useSeoHead({
  title: t((m) => m.nav.tutorials),
  description: 'Consigli di stile e cura: impara a usare al meglio gli accessori e le borse Linea 2.',
  image: tutorials.value[0]?.finalResultImage?.url ?? null,
})
</script>

<template>
  <div class="site-container pb-20 pt-12 sm:pt-16">
    <NuxtLink to="/editorial" class="meta hover:text-ink">← Journal</NuxtLink>
    <h1 class="mt-5 text-hero">{{ t((m) => m.nav.tutorials) }}</h1>
    <p class="mt-5 max-w-md text-fg/80">Consigli di stile e cura per far durare i tuoi pezzi preferiti.</p>

    <div class="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3">
      <UiReveal v-for="(tutorial, i) in tutorials" :key="tutorial.documentId" :delay="Math.min(i, 6) * 60" :y="16">
        <TutorialCard :tutorial="tutorial" :eager="i < 2" />
      </UiReveal>
    </div>

    <p v-if="!tutorials.length" class="mt-10 rounded-card border border-line p-10 text-center text-muted">Nessun tutorial al momento.</p>
  </div>
</template>
