<script setup lang="ts">
/**
 * Home section: TikTok (featured videos, then the auto-updating profile embed)
 * and the latest Instagram posts, each the full width of the container.
 */
const { feed, profileUrl } = useSocialFeed()
const videos = computed(() => feed.value.tiktok.slice(0, 4))
</script>

<template>
  <section class="site-container py-10 sm:py-12">
    <UiReveal>
      <div class="flex flex-wrap items-end justify-between gap-4">
        <UiSectionHeading
          eyebrow="Social"
          title="Follow the studio"
          subtitle="Ogni borsa nasce davanti alla telecamera. Seguici per vedere i nuovi pezzi prima di tutti."
        />
        <div class="flex gap-2">
          <a
            v-for="p in (['tiktok', 'instagram'] as const)"
            :key="p"
            :href="profileUrl[p]"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-11 w-11 items-center justify-center rounded-full border border-fg/20 text-fg transition-colors hover:border-brass hover:text-brass-hi"
            :aria-label="p === 'tiktok' ? 'Linea 2 su TikTok' : 'Linea 2 su Instagram'"
          >
            <SocialIcon :name="p" class="h-5 w-5" />
          </a>
        </div>
      </div>
    </UiReveal>

    <!-- Not wrapped in UiReveal: a transformed parent can stall the TikTok iframe. -->
    <div class="mt-8 grid gap-4">
      <div v-if="videos.length" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SocialVideoCard v-for="post in videos" :key="post.id" :post="post" />
      </div>
      <SocialTikTokProfile :handle="feed.handles.tiktok" />
      <SocialInstagramGrid :posts="feed.instagram" :handle="feed.handles.instagram" :limit="6" />
    </div>

    <div class="mt-6 text-right">
      <NuxtLink to="/editorial" class="label-caps text-xs text-muted underline underline-offset-4 hover:text-fg">
        Tutti i video →
      </NuxtLink>
    </div>
  </section>
</template>
