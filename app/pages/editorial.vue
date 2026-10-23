<script setup lang="ts">
// Journal: stories, tutorials and the brand's videos in one place. TikTok and
// Instagram come from /api/social/feed (see SOCIAL.md), tutorials from the CMS.
const { t } = useT()
const { feed } = useSocialFeed()
const { tutorials } = await useTutorials()

const clips = computed(() => feed.value.tiktok.slice(0, 4))
const lead = computed(() => tutorials.value[0] ?? null)
const more = computed(() => tutorials.value.slice(1, 4))

useSeoHead({
  title: 'Journal',
  description: 'Tutorial di stile e cura, video e dietro le quinte dallo studio Linea 2: guarda come nasce ogni borsa.',
})
</script>

<template>
  <div>
    <header class="site-container pb-12 pt-12 sm:pt-16">
      <p class="kicker">Journal</p>
      <div class="mt-5 grid gap-6 lg:grid-cols-12 lg:items-end">
        <h1 class="text-hero lg:col-span-7">Stile, cura <span class="italic text-indigo">e riuso.</span></h1>
        <p class="max-w-md text-fg/80 lg:col-span-4 lg:col-start-9">
          Tutorial di stile e cura, e i video di ogni borsa mentre la cuciamo.
        </p>
      </div>
    </header>

    <!-- Featured story -->
    <section v-if="lead" class="site-container pb-16" aria-label="In primo piano">
      <NuxtLink :to="`/tutorials/${lead.slug}`" class="group grid gap-8 border-t border-line pt-10 lg:grid-cols-12 lg:items-center">
        <div class="lg:col-span-7">
          <UiStrapiImage :media="lead.finalResultImage" eager :width="1200" :height="900" sizes="(min-width: 1024px) 55vw, 92vw" rounded img-class="zoom-img" />
        </div>
        <div class="lg:col-span-4 lg:col-start-9">
          <p class="meta">In primo piano · Tutorial</p>
          <h2 class="mt-4 text-display">{{ lead.title }}</h2>
          <p class="mt-5 text-fg/80">{{ lead.description }}</p>
          <span class="arrow-link mt-8">Leggi e guarda</span>
        </div>
      </NuxtLink>
    </section>

    <section v-if="more.length" class="site-container pb-20" aria-labelledby="more-title">
      <div class="flex items-end justify-between gap-4 border-t border-line pt-10">
        <h2 id="more-title" class="text-title">{{ t((m) => m.nav.tutorials) }}</h2>
        <NuxtLink to="/tutorials" class="arrow-link">{{ t((m) => m.common.viewAll) }}</NuxtLink>
      </div>
      <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <TutorialCard v-for="tutorial in more" :key="tutorial.documentId" :tutorial="tutorial" />
      </div>
    </section>

    <section class="on-denim" aria-labelledby="video-title">
      <div class="site-container section-y grid gap-12 lg:grid-cols-12">
        <div class="lg:col-span-4">
          <p class="kicker">Video</p>
          <h2 id="video-title" class="mt-4 text-display">Dal laboratorio</h2>
          <p class="mt-5 max-w-sm text-fg/80">Ogni pezzo filmato mentre nasce. I video si caricano solo quando li apri.</p>
          <NuxtLink to="/tiktok" class="arrow-link mt-8">Tutti i video</NuxtLink>
        </div>
        <div class="grid content-start gap-4 lg:col-span-8">
          <div v-if="clips.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SocialVideoCard v-for="post in clips" :key="post.id" :post="post" />
          </div>
          <SocialTikTokProfile :handle="feed.handles.tiktok" />
        </div>
      </div>
    </section>

    <section class="site-container section-y" aria-labelledby="ig-title">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="kicker">Instagram</p>
          <h2 id="ig-title" class="mt-4 text-title">Pezzi finiti e dietro le quinte</h2>
        </div>
        <a :href="`https://www.instagram.com/${feed.handles.instagram}/`" target="_blank" rel="noopener noreferrer" class="arrow-link">
          @{{ feed.handles.instagram }}
        </a>
      </div>
      <div class="mt-10">
        <SocialInstagramGrid :posts="feed.instagram" :handle="feed.handles.instagram" :limit="6" />
      </div>
    </section>
  </div>
</template>
