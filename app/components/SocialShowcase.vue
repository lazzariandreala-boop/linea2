<script setup lang="ts">
/**
 * Home section: TikTok (featured videos, else the auto-updating profile
 * embed) beside the latest Instagram posts.
 */
const { feed, profileUrl } = useSocialFeed()
const videos = computed(() => feed.value.tiktok.slice(0, 2))
</script>

<template>
  <section class="site-container py-16 sm:py-20">
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

    <div class="mt-8 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <UiReveal>
        <div v-if="videos.length" class="grid grid-cols-2 gap-3">
          <SocialVideoCard v-for="post in videos" :key="post.id" :post="post" />
        </div>
        <SocialTikTokProfile v-else :handle="feed.handles.tiktok" />
      </UiReveal>
      <UiReveal :delay="80">
        <SocialInstagramGrid :posts="feed.instagram" :handle="feed.handles.instagram" :limit="6" />
      </UiReveal>
    </div>

    <div class="mt-6 text-right">
      <NuxtLink to="/editorial" class="label-caps text-xs text-muted underline underline-offset-4 hover:text-fg">
        Tutti i video →
      </NuxtLink>
    </div>
  </section>
</template>
