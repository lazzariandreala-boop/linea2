<script setup lang="ts">
// Editorial: the brand's videos in one place. TikTok and Instagram come from
// /api/social/feed (see SOCIAL.md), tutorials from the CMS.
const { t } = useT()
const { feed } = useSocialFeed()
const { tutorials } = await useTutorials()

const clips = computed(() => feed.value.tiktok.slice(0, 6))
const guides = computed(() => tutorials.value.slice(0, 3))

const CHANNELS = [
  { name: 'Instagram', handle: '@linea2.upcycling', href: 'https://www.instagram.com/linea2.upcycling/', note: 'Reels e dietro le quinte' },
  { name: 'TikTok', handle: '@linea2.upcycling', href: 'https://www.tiktok.com/@linea2.upcycling', note: 'Ogni pezzo filmato mentre nasce' },
]

useSeoHead({
  title: 'Journal',
  description: 'Video, tutorial e dietro le quinte dallo studio Linea 2: guarda come nasce ogni borsa.',
})
</script>

<template>
  <div class="site-container py-8 sm:py-10">
    <UiReveal>
      <UiSectionHeading
        title="Journal"
        subtitle="Storie dal laboratorio, tutorial di stile e cura, e i video di ogni borsa mentre la cuciamo."
        as="h1"
      />
    </UiReveal>

    <ul class="mt-8 grid gap-3 sm:grid-cols-2">
      <li v-for="ch in CHANNELS" :key="ch.name">
        <a
          :href="ch.href"
          target="_blank"
          rel="noopener noreferrer"
          class="panel-glass flex items-center justify-between gap-4 rounded-card px-5 py-4 transition-colors hover:border-fg/40"
        >
          <span>
            <span class="label-caps block text-sm text-fg">{{ ch.name }}</span>
            <span class="mt-1 block text-xs text-muted">{{ ch.note }}</span>
          </span>
          <span class="font-mono text-xs text-accent">{{ ch.handle }} ↗</span>
        </a>
      </li>
    </ul>

    <section class="mt-10">
      <div class="flex items-end justify-between gap-4">
        <h2 class="text-title text-fg">TikTok</h2>
        <NuxtLink to="/tiktok" class="arrow-link">
          {{ t((m) => m.common.viewAll) }}
        </NuxtLink>
      </div>
      <div v-if="clips.length" class="mx-auto mt-6 grid max-w-sm grid-cols-1 gap-5 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
        <SocialVideoCard v-for="post in clips" :key="post.id" :post="post" />
      </div>
      <div class="mt-6">
        <SocialTikTokProfile :handle="feed.handles.tiktok" />
      </div>
    </section>

    <section class="mt-10">
      <div class="flex items-end justify-between gap-4">
        <h2 class="text-title text-fg">Instagram</h2>
        <a
          :href="`https://www.instagram.com/${feed.handles.instagram}/`"
          target="_blank"
          rel="noopener noreferrer"
          class="arrow-link"
        >
          @{{ feed.handles.instagram }} ↗
        </a>
      </div>
      <div class="mt-6">
        <SocialInstagramGrid :posts="feed.instagram" :handle="feed.handles.instagram" :limit="12" />
      </div>
    </section>

    <section v-if="guides.length" class="mt-10">
      <div class="flex items-end justify-between gap-4">
        <h2 class="text-title text-fg">{{ t((m) => m.nav.tutorials) }}</h2>
        <NuxtLink to="/tutorials" class="arrow-link">
          {{ t((m) => m.common.viewAll) }}
        </NuxtLink>
      </div>
      <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <UiReveal v-for="(tutorial, i) in guides" :key="tutorial.documentId" :delay="i * 70" :y="20">
          <TutorialCard :tutorial="tutorial" />
        </UiReveal>
      </div>
    </section>
  </div>
</template>
