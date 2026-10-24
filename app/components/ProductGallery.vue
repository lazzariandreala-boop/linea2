<script setup lang="ts">
import type { StrapiMedia } from '~/types/strapi'

/**
 * Product photos: a swipeable strip on phones, stacked large frames on
 * desktop. Any photo opens an enlarged view (dialog: arrows, Esc, focus kept).
 */
const props = defineProps<{ images: StrapiMedia[]; title: string }>()

const { url } = useStrapiMedia()
const strip = ref<HTMLElement | null>(null)
const current = ref(0)
const zoom = ref<number | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
let opener: HTMLElement | null = null

function onStrip() {
  const el = strip.value
  if (el) current.value = Math.round(el.scrollLeft / el.clientWidth)
}
function open(i: number, e: Event) {
  opener = e.currentTarget as HTMLElement
  zoom.value = i
  document.documentElement.style.overflow = 'hidden'
  void nextTick(() => closeBtn.value?.focus())
}
function close() {
  zoom.value = null
  document.documentElement.style.overflow = ''
  opener?.focus()
}
function step(d: number) {
  if (zoom.value === null) return
  zoom.value = (zoom.value + d + props.images.length) % props.images.length
}
function onKey(e: KeyboardEvent) {
  if (zoom.value === null) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowRight') step(1)
  else if (e.key === 'ArrowLeft') step(-1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <div>
    <div
      ref="strip"
      class="no-scrollbar -mx-(--site-gutter) flex snap-x snap-mandatory overflow-x-auto lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible"
      @scroll.passive="onStrip"
    >
      <button
        v-for="(img, i) in images"
        :key="img.id"
        type="button"
        class="group relative w-full shrink-0 snap-center cursor-zoom-in px-(--site-gutter) lg:px-0"
        :aria-label="`Ingrandisci la foto ${i + 1} di ${images.length}: ${img.alternativeText || title}`"
        @click="open(i, $event)"
      >
        <UiStrapiImage
          :media="img"
          :eager="i === 0"
          :priority="i === 0"
          :width="900"
          :height="1200"
          sizes="(min-width: 1024px) 50vw, 100vw"
          rounded
        />
        <span class="absolute bottom-4 right-[calc(var(--site-gutter)+1rem)] inline-flex h-9 w-9 items-center justify-center rounded-sm bg-paper/90 text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:right-4" aria-hidden="true">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5M11 8v6M8 11h6" /></svg>
        </span>
      </button>
    </div>
    <p v-if="images.length > 1" class="mt-3 text-center text-xs tabular-nums text-muted lg:hidden" aria-hidden="true">
      {{ current + 1 }} / {{ images.length }}
    </p>

    <Teleport to="body">
      <div
        v-if="zoom !== null"
        class="fixed inset-0 z-[100] flex flex-col bg-graphite"
        role="dialog"
        aria-modal="true"
        :aria-label="`${title}: foto ${zoom + 1} di ${images.length}`"
      >
        <div class="flex h-16 items-center justify-between px-(--site-gutter)">
          <span class="text-sm tabular-nums text-muted">{{ zoom + 1 }} / {{ images.length }}</span>
          <button ref="closeBtn" type="button" class="inline-flex h-11 w-11 items-center justify-center text-ink" aria-label="Chiudi" @click="close">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="m5 5 14 14M19 5 5 19" /></svg>
          </button>
        </div>
        <div class="relative min-h-0 flex-1 px-(--site-gutter) pb-6">
          <img
            :src="url(images[zoom]) ?? ''"
            :alt="images[zoom]?.alternativeText || title"
            class="h-full w-full object-contain"
          />
          <template v-if="images.length > 1">
            <button type="button" class="nav-btn left-(--site-gutter)" aria-label="Foto precedente" @click="step(-1)">←</button>
            <button type="button" class="nav-btn right-(--site-gutter)" aria-label="Foto successiva" @click="step(1)">→</button>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-paper);
  color: var(--color-ink);
}
.nav-btn:hover {
  border-color: var(--color-ink);
}
</style>
