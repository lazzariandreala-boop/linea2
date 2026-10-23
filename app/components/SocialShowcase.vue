<script setup lang="ts">
/**
 * Home section: the studio's social channels as proof of the process.
 * Featured TikTok videos (tap to play), the auto-updating TikTok profile
 * embed behind a facade, and the latest Instagram posts or a profile card.
 */
const { feed, profileUrl } = useSocialFeed()
const videos = computed(() => feed.value.tiktok.slice(0, 4))
</script>

<template>
  <section class="border-t border-line" aria-labelledby="social-title">
    <div class="site-container section-y grid gap-12 lg:grid-cols-12 lg:gap-8">
      <div class="lg:col-span-4">
        <p class="kicker">Dal laboratorio</p>
        <h2 id="social-title" class="mt-4 text-display">Ogni borsa, mentre nasce</h2>
        <p class="mt-5 max-w-sm text-fg/80">
          Su Instagram e TikTok mostriamo il lavoro di ogni giorno: i jeans da smontare, i tagli, le cuciture e i pezzi
          finiti prima che partano.
        </p>
        <ul class="mt-8 border-t border-line">
          <li v-for="p in (['instagram', 'tiktok'] as const)" :key="p" class="border-b border-line">
            <a
              :href="profileUrl[p]"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex min-h-14 items-center justify-between gap-4 text-ink"
            >
              <span class="flex items-center gap-3">
                <SocialIcon :name="p" class="h-4 w-4" />
                <span class="text-sm font-medium">{{ p === 'tiktok' ? 'TikTok' : 'Instagram' }}</span>
              </span>
              <span class="text-sm text-muted transition-colors group-hover:text-ink">@{{ feed.handles[p] }} ↗</span>
            </a>
          </li>
        </ul>
        <NuxtLink to="/editorial" class="arrow-link mt-8">Tutti i video</NuxtLink>
      </div>

      <!-- Not wrapped in UiReveal: a transformed parent can stall the TikTok iframe. -->
      <div class="grid content-start gap-4 lg:col-span-8">
        <div v-if="videos.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SocialVideoCard v-for="post in videos" :key="post.id" :post="post" />
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <SocialTikTokProfile :handle="feed.handles.tiktok" />
          <SocialInstagramGrid :posts="feed.instagram" :handle="feed.handles.instagram" :limit="4" compact />
        </div>
      </div>
    </div>
  </section>
</template>
