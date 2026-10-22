<script setup lang="ts">
const { t } = useT()
const { feed } = useSocialFeed()

useSeoHead({
  title: t((m) => m.tiktok.feedTitle),
  description: 'Guarda Linea 2 in movimento: unboxing, styling e dietro le quinte dal nostro TikTok.',
})
</script>

<template>
  <div class="site-container py-8 sm:py-10">
    <UiReveal>
      <UiSectionHeading
        eyebrow="TikTok"
        :title="t((m) => m.tiktok.feedTitle)"
        subtitle="Tocca un video per riprodurlo. I contenuti si caricano solo quando li apri."
        as="h1"
      />
    </UiReveal>

    <!-- Vertical-feed feel on mobile (single centred column), grid on desktop -->
    <div
      v-if="feed.tiktok.length"
      class="mx-auto mt-10 grid max-w-sm grid-cols-1 gap-5 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3"
    >
      <SocialVideoCard v-for="post in feed.tiktok" :key="post.id" :post="post" />
    </div>

    <!-- The profile embed always lists the latest videos on its own -->
    <div class="mt-10">
      <SocialTikTokProfile :handle="feed.handles.tiktok" />
    </div>
  </div>
</template>
