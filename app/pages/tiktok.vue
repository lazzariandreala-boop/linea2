<script setup lang="ts">
const { t } = useT()
const { videos } = await useTikTokVideos()

useSeoHead({
  title: t((m) => m.tiktok.feedTitle),
  description: 'Guarda Linea 2 in movimento: unboxing, styling e dietro le quinte dal nostro TikTok.',
  image: videos.value[0]?.thumbnail?.url ?? null,
})
</script>

<template>
  <div class="site-container py-12 sm:py-16">
    <UiReveal>
      <UiSectionHeading
        eyebrow="TikTok"
        :title="t((m) => m.tiktok.feedTitle)"
        subtitle="Tocca un video per riprodurlo. I contenuti si caricano solo quando li apri."
        as="h1"
      />
    </UiReveal>

    <!-- Vertical-feed feel on mobile (single centred column), grid on desktop -->
    <div class="mx-auto mt-10 grid max-w-sm grid-cols-1 gap-5 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
      <UiReveal
        v-for="(video, i) in videos"
        :key="video.documentId"
        :delay="Math.min(i, 6) * 70"
        :y="20"
      >
        <TikTokFacade :video="video" />
      </UiReveal>
    </div>

    <p v-if="!videos.length" class="mt-10 text-center text-fg/60">
      Nessun video al momento.
    </p>
  </div>
</template>
