<script setup lang="ts">
const { t } = useT()
const { feed } = useSocialFeed()

useSeoHead({
  title: t((m) => m.tiktok.feedTitle),
  description: 'Guarda Linea 2 in movimento: unboxing, styling e dietro le quinte dal nostro TikTok.',
})
</script>

<template>
  <div class="site-container pb-20 pt-12 sm:pt-16">
    <NuxtLink to="/editorial" class="meta hover:text-ink">← Journal</NuxtLink>
    <h1 class="mt-5 text-hero">{{ t((m) => m.tiktok.feedTitle) }}</h1>
    <p class="mt-5 max-w-md text-fg/80">Tocca un video per riprodurlo. I contenuti si caricano solo quando li apri.</p>

    <!-- Vertical-feed feel on mobile (single centred column), grid on desktop -->
    <div
      v-if="feed.tiktok.length"
      class="mx-auto mt-12 grid max-w-sm grid-cols-1 gap-5 sm:max-w-none sm:grid-cols-2 lg:grid-cols-4"
    >
      <SocialVideoCard v-for="post in feed.tiktok" :key="post.id" :post="post" />
    </div>

    <!-- The profile embed always lists the latest videos on its own -->
    <div class="mt-10">
      <SocialTikTokProfile :handle="feed.handles.tiktok" />
    </div>
  </div>
</template>
