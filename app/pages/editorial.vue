<script setup lang="ts">
// Editorial: the brand's videos in one place. TikTok clips and tutorials come
// from the CMS today; Instagram Reels and YouTube (videos + Shorts) plug in
// here once their accounts/API keys are connected.
const { t } = useT()
const { videos } = await useTikTokVideos()
const { tutorials } = await useTutorials()

const clips = computed(() => videos.value.slice(0, 6))
const guides = computed(() => tutorials.value.slice(0, 3))

const CHANNELS = [
  { name: 'Instagram', handle: '@linea2.upcycling', href: 'https://www.instagram.com/linea2.upcycling/', note: 'Reels e dietro le quinte' },
  { name: 'TikTok', handle: '@linea2.upcycling', href: 'https://www.tiktok.com/@linea2.upcycling', note: 'Ogni pezzo filmato mentre nasce' },
]

useSeoHead({
  title: 'Editorial',
  description: 'Video, tutorial e dietro le quinte dallo studio Linea 2: guarda come nasce ogni borsa.',
  image: videos.value[0]?.thumbnail?.url ?? null,
})
</script>

<template>
  <div class="site-container py-12 sm:py-16">
    <UiReveal>
      <UiSectionHeading
        eyebrow="Editorial"
        title="Made on camera"
        subtitle="Ogni borsa viene filmata mentre la cuciamo. Qui trovi i video dai nostri canali, i tutorial e le storie dello studio."
        as="h1"
      />
    </UiReveal>

    <ul class="mt-8 grid gap-3 sm:grid-cols-2">
      <li v-for="ch in CHANNELS" :key="ch.name">
        <a
          :href="ch.href"
          target="_blank"
          rel="noopener noreferrer"
          class="panel-glass flex items-center justify-between gap-4 rounded-card px-5 py-4 transition-colors hover:border-brass/60"
        >
          <span>
            <span class="label-caps block text-sm text-fg">{{ ch.name }}</span>
            <span class="mt-1 block text-xs text-muted">{{ ch.note }}</span>
          </span>
          <span class="font-mono text-xs text-brass-hi">{{ ch.handle }} ↗</span>
        </a>
      </li>
    </ul>

    <section v-if="clips.length" class="mt-14">
      <div class="flex items-end justify-between gap-4">
        <h2 class="text-title text-fg">TikTok</h2>
        <NuxtLink to="/tiktok" class="label-caps text-xs text-muted underline underline-offset-4 hover:text-fg">
          {{ t((m) => m.common.viewAll) }}
        </NuxtLink>
      </div>
      <div class="mx-auto mt-6 grid max-w-sm grid-cols-1 gap-5 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
        <UiReveal v-for="(video, i) in clips" :key="video.documentId" :delay="Math.min(i, 6) * 70" :y="20">
          <TikTokFacade :video="video" />
        </UiReveal>
      </div>
    </section>

    <section v-if="guides.length" class="mt-16">
      <div class="flex items-end justify-between gap-4">
        <h2 class="text-title text-fg">{{ t((m) => m.nav.tutorials) }}</h2>
        <NuxtLink to="/tutorials" class="label-caps text-xs text-muted underline underline-offset-4 hover:text-fg">
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
