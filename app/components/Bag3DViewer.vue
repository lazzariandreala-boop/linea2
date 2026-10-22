<script setup lang="ts">
/**
 * Optional 3D look at the configured bag, in a full-screen dialog. Use it as
 * <LazyBag3DViewer>: three.js and the model are only downloaded when the
 * customer opens it, so the rest of the site stays light.
 */
import type { Placement, StellaState } from '~/utils/stella/options'
import { findBag } from '~/utils/stella/options'
import { createStellaScene, type DecalKind, type StellaScene } from '~/utils/stella/scene'

const props = defineProps<{ state: StellaState }>()
const emit = defineEmits<{
  close: []
  place: [kind: DecalKind, index: number, at: Placement]
}>()

const host = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const zoomed = ref(false)
useGlobalLoading().bind(() => status.value === 'loading')
const name = computed(() => findBag(props.state.model).name)
let scene: StellaScene | null = null

const snapshot = () => JSON.parse(JSON.stringify(toRaw(props.state))) as StellaState
watch(() => props.state, () => scene?.apply(snapshot()), { deep: true })
watch(zoomed, (z) => scene?.setZoom(z))

function rotate(r: number) {
  scene?.rotateBy(r)
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

let lastFocus: Element | null = null
onMounted(() => {
  lastFocus = document.activeElement
  closeBtn.value?.focus()
  document.addEventListener('keydown', onKey)
  document.documentElement.style.overflow = 'hidden'
  if (!host.value) return
  try {
    scene = createStellaScene({
      host: host.value,
      onLoading: () => (status.value = 'loading'),
      onReady: (ok) => (status.value = ok ? 'ready' : 'error'),
      onPlace: (kind, index, at) => emit('place', kind, index, at),
    })
    scene.apply(snapshot())
  } catch (err) {
    console.error('[3d] WebGL unavailable', err)
    status.value = 'error'
  }
})
onBeforeUnmount(() => {
  scene?.dispose()
  document.removeEventListener('keydown', onKey)
  document.documentElement.style.overflow = ''
  if (lastFocus instanceof HTMLElement) lastFocus.focus()
})
</script>

<template>
  <div class="v3d" role="dialog" aria-modal="true" :aria-label="`${name} in 3D`" @click.self="emit('close')">
    <div class="box panel-glass">
      <div ref="host" class="gl" />
      <h2 class="ttl">{{ name }} · 3D</h2>
      <button ref="closeBtn" type="button" class="x" aria-label="Chiudi la vista 3D" @click="emit('close')">×</button>
      <p v-if="status === 'loading'" class="msg">Loading 3D model…</p>
      <p v-else-if="status === 'error'" class="msg">Il modello 3D non si è caricato su questo dispositivo. Le immagini del configuratore restano valide.</p>
      <div v-if="status === 'ready'" class="ctrl">
        <button type="button" aria-label="Ruota a sinistra" @click="rotate(-Math.PI / 4)">
          <svg viewBox="0 0 16 16"><path d="M10 3 5 8l5 5M5 8h9" /></svg>
        </button>
        <button type="button" :aria-label="zoomed ? 'Allontana' : 'Avvicina'" :aria-pressed="zoomed" @click="zoomed = !zoomed">
          <svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3.5 3.5M5 7h4M7 5v4" /></svg>
        </button>
        <button type="button" aria-label="Ruota a destra" @click="rotate(Math.PI / 4)">
          <svg viewBox="0 0 16 16"><path d="m6 3 5 5-5 5M11 8H2" /></svg>
        </button>
      </div>
      <span v-if="status === 'ready'" class="hint">Trascina per ruotare</span>
    </div>
  </div>
</template>

<style scoped>
.v3d {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(8 10 18 / 0.72);
  backdrop-filter: blur(6px);
}
.box {
  position: relative;
  width: min(960px, 100%);
  height: min(680px, calc(100dvh - 32px));
  border-radius: var(--radius-panel);
  overflow: hidden;
  background: radial-gradient(120% 90% at 50% 30%, #9a9184 0%, #6f675d 70%, #4d473f 100%);
}
.gl {
  position: absolute;
  inset: 0;
}
.gl :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
.ttl {
  position: absolute;
  top: 18px;
  left: 22px;
  margin: 0;
  font: 500 14px/1 var(--font-display);
  letter-spacing: 0.08em;
  color: #fff;
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
}
.x {
  position: absolute;
  top: 12px;
  right: 14px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 0;
  background: rgb(22 22 22 / 0.82);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.msg {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: 320px;
  text-align: center;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgb(22 22 22 / 0.6);
  color: #fff;
  font-size: 12px;
}
.ctrl {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  gap: 6px;
}
.ctrl button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 0;
  display: grid;
  place-items: center;
  background: rgb(22 22 22 / 0.82);
  cursor: pointer;
}
.ctrl button[aria-pressed='true'] {
  background: var(--color-selvedge);
  box-shadow: 0 0 0 1px var(--color-brass);
}
.ctrl svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: #fff;
  stroke-width: 1.6;
}
.hint {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  font: 400 10.5px/1 var(--font-body);
  letter-spacing: 0.04em;
  color: rgb(255 255 255 / 0.85);
  background: rgb(22 22 22 / 0.5);
  padding: 6px 10px;
  border-radius: 99px;
  pointer-events: none;
}
</style>
