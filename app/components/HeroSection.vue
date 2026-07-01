<script setup lang="ts">
import type { HomePage } from '~/types/content'

const props = defineProps<{ home: HomePage }>()

const { t } = useT()
const { reduced } = useMotionPreference()
const { tiltStyle, glareStyle, onPointerMove, reset } = useTilt({ max: 7, scale: 1.03 })

const headlineLines = computed(() => props.home.heroHeadline.split('\n'))

// Static trust chips (UI chrome).
const chips = ['100% materiali di recupero', 'Pezzi unici', 'Spedizione in Italia']

// Subtle GPU parallax on the hero image; disabled under reduced motion.
const offsetY = ref(0)
function onScroll() {
  offsetY.value = Math.min(window.scrollY * 0.14, 90)
}
onMounted(() => {
  if (!reduced.value) window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <section class="relative isolate overflow-hidden wash-hero">
    <OrbField density="hero" />

    <div class="site-container grid gap-12 py-20 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-32">
      <div class="max-w-xl">
        <span
          v-motion
          :initial="{ opacity: 0, y: 14 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
          class="eyebrow glass-accent inline-flex items-center gap-2 rounded-pill px-3.5 py-1.5 text-accent"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-accent" />
          {{ home.heroEyebrow }}
        </span>

        <h1
          v-motion
          :initial="{ opacity: 0, y: 24 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 650, delay: 80 } }"
          class="mt-5 text-hero text-fg"
        >
          <span v-for="(line, i) in headlineLines" :key="i" class="block">{{ line }}</span>
        </h1>

        <p
          v-motion
          :initial="{ opacity: 0, y: 18 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 600, delay: 180 } }"
          class="mt-6 max-w-md text-lead text-fg/70"
        >
          {{ home.heroSubline }}
        </p>

        <div
          v-motion
          :initial="{ opacity: 0, y: 16 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 600, delay: 280 } }"
          class="mt-9 flex flex-wrap gap-3"
        >
          <UiBaseButton to="/accessories" variant="solid" size="lg">
            {{ t((m) => m.nav.accessories) }}
          </UiBaseButton>
          <UiBaseButton to="/bags" variant="outline" size="lg">
            {{ t((m) => m.nav.bags) }}
          </UiBaseButton>
        </div>

        <ul
          v-motion
          :initial="{ opacity: 0 }"
          :enter="{ opacity: 1, transition: { duration: 600, delay: 420 } }"
          class="mt-8 flex flex-wrap gap-2"
        >
          <li
            v-for="chip in chips"
            :key="chip"
            class="glass eyebrow rounded-pill px-3 py-1.5 text-[0.68rem] text-fg/75"
          >
            {{ chip }}
          </li>
        </ul>
      </div>

      <!-- 3D-tilt floating hero image (parallax on scroll, glare on pointer) -->
      <div
        class="relative [perspective:1200px]"
        :style="{ transform: `translate3d(0, ${offsetY}px, 0)` }"
      >
        <div
          class="glow-accent relative overflow-hidden rounded-card shadow-float ring-1 ring-fg/10 transition-transform duration-200 ease-out-soft will-change-transform"
          :style="tiltStyle"
          @pointermove="onPointerMove"
          @pointerleave="reset"
        >
          <UiStrapiImage
            :media="home.heroMedia"
            eager
            priority
            :width="1600"
            :height="1000"
            sizes="(min-width: 1024px) 48vw, 92vw"
          />
          <span
            class="pointer-events-none absolute inset-0 rounded-card opacity-0 transition-opacity duration-300"
            :style="glareStyle"
          />
        </div>

        <div
          class="glass glow-accent absolute -bottom-4 -left-3 flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-semibold text-fg sm:-left-5"
        >
          <span class="h-2 w-2 rounded-full bg-accent" />
          Edizione limitata
        </div>
      </div>
    </div>
  </section>
</template>
