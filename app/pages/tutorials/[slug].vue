<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { t } = useT()
const { tutorial } = await useTutorial(slug.value)

if (!tutorial.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tutorial non trovato' })
}

useSeoHead({
  title: tutorial.value.seo?.metaTitle ?? tutorial.value.title,
  description: tutorial.value.seo?.metaDescription ?? tutorial.value.description,
  image: tutorial.value.seo?.ogImage?.url ?? tutorial.value.finalResultImage?.url ?? null,
  imageAlt: tutorial.value.finalResultImage?.alternativeText ?? tutorial.value.title,
  imageWidth: tutorial.value.finalResultImage?.width ?? undefined,
  imageHeight: tutorial.value.finalResultImage?.height ?? undefined,
  type: 'article',
})
</script>

<template>
  <article v-if="tutorial" class="pb-20 pt-10 sm:pt-14">
    <header class="site-container">
      <nav class="meta flex flex-wrap gap-2" aria-label="Breadcrumb">
        <NuxtLink to="/editorial" class="hover:text-ink">Journal</NuxtLink>
        <span aria-hidden="true">/</span>
        <NuxtLink to="/tutorials" class="hover:text-ink">{{ t((m) => m.nav.tutorials) }}</NuxtLink>
      </nav>
      <div class="mx-auto mt-10 max-w-3xl text-center">
        <p class="meta">Tutorial</p>
        <h1 class="mt-4 text-display">{{ tutorial.title }}</h1>
        <p class="mx-auto mt-5 max-w-xl text-lead text-fg/80">{{ tutorial.description }}</p>
      </div>
    </header>

    <!-- Final-result image on top, as the hook -->
    <figure class="site-container mt-12">
      <div class="mx-auto max-w-5xl">
        <UiStrapiImage
          :media="tutorial.finalResultImage"
          eager
          priority
          :width="1200"
          :height="900"
          sizes="(min-width: 1024px) 64rem, 100vw"
          rounded
        />
        <figcaption class="meta mt-3">{{ t((m) => m.tutorials.result) }}</figcaption>
      </div>
    </figure>

    <div class="site-container">
      <!-- Video (facade — embed loads only on tap) -->
      <section class="mx-auto mt-16 max-w-2xl" aria-labelledby="video-title">
        <h2 id="video-title" class="text-title">{{ t((m) => m.tutorials.watch) }}</h2>
        <div class="mt-6">
          <VideoFacade
            :file="tutorial.videoFile"
            :embed-url="tutorial.videoEmbedUrl"
            :poster="tutorial.finalResultImage"
            :title="tutorial.title"
          />
        </div>
      </section>

      <!-- Steps -->
      <section v-if="tutorial.steps.length" class="mx-auto mt-16 max-w-2xl" aria-labelledby="steps-title">
        <h2 id="steps-title" class="text-title">{{ t((m) => m.common.steps) }}</h2>
        <div class="mt-6">
          <StepList :steps="tutorial.steps" />
        </div>
      </section>

      <!-- CTA -->
      <div v-if="tutorial.cta" class="mx-auto mt-12 flex max-w-2xl">
        <CtaButton :cta="tutorial.cta" size="lg" />
      </div>

      <!-- Products used -->
      <section v-if="tutorial.relatedProducts.length" class="mt-20 border-t border-line pt-14" aria-labelledby="used-title">
        <h2 id="used-title" class="text-title">{{ t((m) => m.common.relatedProducts) }}</h2>
        <div class="mt-8">
          <ProductGrid :products="tutorial.relatedProducts" />
        </div>
      </section>
    </div>
  </article>
</template>
