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
  <div class="site-container py-8 sm:py-10">
    <UiReveal>
      <UiSectionHeading
        eyebrow="Tutorial"
        :title="t((m) => m.nav.tutorials)"
        subtitle="Consigli di stile e cura per far durare i tuoi pezzi preferiti."
        as="h1"
      />
    </UiReveal>

    <div class="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <UiReveal
        v-for="(tutorial, i) in tutorials"
        :key="tutorial.documentId"
        :delay="Math.min(i, 6) * 70"
        :y="20"
      >
        <TutorialCard :tutorial="tutorial" :eager="i < 2" />
      </UiReveal>
    </div>

    <p v-if="!tutorials.length" class="mt-10 text-center text-fg/60">
      Nessun tutorial al momento.
    </p>
  </div>
</template>
