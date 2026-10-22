<script setup lang="ts">
/**
 * Stella bag configurator (WebGL + canvas: mount it inside <ClientOnly>). Layout and copy follow
 * Andrea's mockup: 3D viewport over a blurred atelier backdrop on the left, a
 * glass inspector with five numbered sections on the right, live price and
 * "Add to bag" that drops a made-to-order line into the cart.
 */
import {
  BAGS,
  FINISH,
  HW,
  LINING,
  PATCH,
  STELLA_GROUPS,
  STELLA_INITIALS_PRICE,
  STELLA_MAX_PATCHES,
  WASH,
  addPatch,
  cleanInitials,
  decodeStella,
  defaultStellaState,
  describeStella,
  encodeStella,
  findBag,
  findOption,
  hasHardware,
  maxWashes,
  stellaKey,
  stellaPrice,
  toggleWash,
  withModel,
  type PatchSize,
  type StellaGroup,
  type StellaOption,
  type StellaState,
} from '~/utils/stella/options'
import { paintBackdrop, swatchURL } from '~/utils/stella/textures'
import { createStellaScene, type DecalKind, type StellaScene } from '~/utils/stella/scene'

const { addLine } = useCart()
const route = useRoute()
const router = useRouter()

// A saved design (?cfg=, e.g. from the cart) wins over a bare ?model=.
const initialModel = typeof route.query.model === 'string' ? findBag(route.query.model).id : 'stella'
const saved = typeof route.query.cfg === 'string' ? decodeStella(route.query.cfg) : null
const state = reactive<StellaState>(saved ?? defaultStellaState(initialModel))
const snapshot = (): StellaState => JSON.parse(JSON.stringify(toRaw(state))) as StellaState
const bag = computed(() => findBag(state.model))
const price = computed(() => stellaPrice(state))

/** Option groups this bag supports (hardware needs separate rings). */
const groups = computed(() => STELLA_GROUPS.filter((g) => g.key !== 'hw' || hasHardware(bag.value)))
type TabKey = StellaGroup | 'model'
const tabs = computed<{ key: TabKey; tab: string }[]>(() => [{ key: 'model', tab: 'Bag' }, ...groups.value])

function pickModel(id: string) {
  if (id === state.model) return
  Object.assign(state, withModel(state, id))
  added.value = false
  if (route.query.model !== id) void router.replace({ query: { ...route.query, model: id, cfg: undefined } })
}
// Links like /customize?model=luna while already on the page.
watch(
  () => route.query.model,
  (m) => {
    if (typeof m === 'string') pickModel(findBag(m).id)
  },
)
const fmt = (n: number) => `€${n.toFixed(2)}`

// ── Swatches (painted once fonts are ready, so the "L2" serif renders) ────
const swatches = ref<Record<string, string>>({})
function paintSwatches() {
  const out: Record<string, string> = {}
  for (const g of STELLA_GROUPS) for (const o of g.list) out[`${g.key}:${o.id}`] = swatchURL(g.key, o)
  swatches.value = out
}

type SimpleGroup = Exclude<StellaGroup, 'patch'>
function isSelected(group: SimpleGroup, id: string) {
  return group === 'wash' ? state.wash.includes(id) : state[group] === id
}
function pick(group: SimpleGroup, id: string) {
  if (group === 'wash') state.wash = toggleWash(state.wash, id, maxWashes(bag.value))
  else state[group] = id
  // Show the lining while choosing it.
  if (group === 'lining') inside.value = true
}

// ── Patches and monogram (placed by dragging them on the bag) ─────────────
const SIZES: PatchSize[] = ['S', 'M', 'L']
const selected = ref<{ kind: DecalKind; index: number } | null>(null)
function newPatch() {
  state.patches = addPatch(state)
  selected.value = { kind: 'patch', index: state.patches.length - 1 }
  inside.value = false
}
function removePatch(i: number) {
  state.patches.splice(i, 1)
  selected.value = null
}
function ariaLabel(o: StellaOption) {
  return o.p ? `${o.name}, più ${o.p} euro` : o.name
}

const summary = computed(() => {
  const list: { key: string; name: string }[] = state.wash.map((id) => ({ key: `wash:${id}`, name: findOption(WASH, id).name }))
  list.push({ key: `lining:${state.lining}`, name: findOption(LINING, state.lining).name })
  for (const id of new Set(state.patches.map((pt) => pt.style))) {
    const n = state.patches.filter((pt) => pt.style === id).length
    list.push({ key: `patch:${id}`, name: findOption(PATCH, id).name + (n > 1 ? ` ×${n}` : '') })
  }
  if (hasHardware(bag.value)) list.push({ key: `hw:${state.hw}`, name: findOption(HW, state.hw).name })
  list.push({ key: `finish:${state.finish}`, name: findOption(FINISH, state.finish).name })
  return list.slice(0, 9)
})

const meta = computed(() => {
  const main = findOption(WASH, state.wash[0] ?? 'indigo')
  return `SKU L2-${bag.value.id.slice(0, 3).toUpperCase()}-${state.wash.map((w) => w.slice(0, 3).toUpperCase()).join('')}-${state.lining.slice(0, 2).toUpperCase()} · ${main.hex} · 3–4 weeks`
})

function onInitials(e: Event) {
  const el = e.target as HTMLInputElement
  state.initials = cleanInitials(el.value)
  el.value = state.initials
}

// ── Tabs with scroll-spy over the inspector sections ─────────────────────
const scroller = ref<HTMLElement | null>(null)
const activeTab = ref<TabKey>('model')
function goTab(key: TabKey) {
  activeTab.value = key
  const el = document.getElementById(`stella-g-${key}`)
  if (el && scroller.value) scroller.value.scrollTo({ top: el.offsetTop - scroller.value.offsetTop, behavior: 'smooth' })
}
function onScroll() {
  const sc = scroller.value
  if (!sc) return
  let cur: TabKey = 'model'
  for (const g of tabs.value) {
    const el = document.getElementById(`stella-g-${g.key}`)
    if (el && el.offsetTop - sc.offsetTop - 30 <= sc.scrollTop) cur = g.key
  }
  activeTab.value = cur
}

// ── 3D viewport ───────────────────────────────────────────────────────────
const host = ref<HTMLElement | null>(null)
const backdrop = ref<HTMLCanvasElement | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const view = ref(0)
const zoomed = ref(false)
const spinning = ref(false)
const showHint = ref(true)
const showAr = ref(false)
const inside = ref(false)
let scene: StellaScene | null = null

watch(state, () => scene?.apply(snapshot()), { deep: true })
watch(zoomed, (z) => scene?.setZoom(z))
watch(spinning, (s) => scene?.setSpin(s))
watch(inside, (on) => scene?.setInside(on))

onMounted(() => {
  if (backdrop.value) paintBackdrop(backdrop.value)
  const ready = document.fonts?.ready ?? Promise.resolve()
  void ready.then(() => {
    paintSwatches()
    scene?.apply(snapshot())
  })
  if (!host.value) return
  try {
    scene = createStellaScene({
      host: host.value,
      onLoading: () => (status.value = 'loading'),
      onReady: (ok) => (status.value = ok ? 'ready' : 'error'),
      onViewChange: (i) => (view.value = i),
      onInteract: () => {
        showHint.value = false
        spinning.value = false
      },
      onSelect: (kind, index) => {
        selected.value = { kind, index }
        goTab(kind === 'mono' ? 'finish' : 'patch')
      },
      onPlace: (kind, index, at) => {
        if (kind === 'mono') state.mono = at
        else if (state.patches[index]) Object.assign(state.patches[index], at)
      },
    })
    scene.apply(snapshot())
  } catch (err) {
    console.error('[configurator] WebGL unavailable', err)
    status.value = 'error'
  }
})
onBeforeUnmount(() => scene?.dispose())

function rotate(radians: number) {
  scene?.rotateBy(radians)
}
function showView(index: number) {
  scene?.setView(index)
}

// ── Add to bag ────────────────────────────────────────────────────────────
const added = ref(false)

/** Small JPEG of the current render, light enough for localStorage/Firestore. */
function thumbnail(): string | null {
  const canvasEl = status.value === 'ready' ? host.value?.querySelector('canvas') : null
  if (!canvasEl) return null
  const S = 192
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const g = c.getContext('2d')!
  g.fillStyle = '#8b8277'
  g.fillRect(0, 0, S, S)
  const side = Math.min(canvasEl.width, canvasEl.height) * 0.86
  g.drawImage(canvasEl, (canvasEl.width - side) / 2, (canvasEl.height - side) / 2, side, side, 0, 0, S, S)
  return c.toDataURL('image/jpeg', 0.8)
}

function addToBag() {
  const snap = snapshot()
  const b = findBag(snap.model)
  addLine({
    id: stellaKey(snap),
    slug: b.id,
    title: b.title,
    price: stellaPrice(snap),
    image: thumbnail(),
    imageAlt: `Borsa ${b.name} personalizzata`,
    quantity: 1,
    details: describeStella(snap),
    link: `/customize?model=${b.id}&cfg=${encodeStella(snap)}`,
  })
  added.value = true
}

const INSTAGRAM = 'https://www.instagram.com/linea2.upcycling/'
const TIKTOK = 'https://www.tiktok.com/@linea2.upcycling'
</script>

<template>
  <div class="stella">
    <div class="stage">
      <section class="viewport" :aria-label="`Anteprima 3D della borsa ${bag.name}`">
        <canvas ref="backdrop" class="backdrop" aria-hidden="true" />
        <div ref="host" class="gl" />

        <div class="vp-ui">
          <button v-if="status === 'ready'" class="ar-pill inside-pill" type="button" :aria-pressed="inside" @click="inside = !inside">
            <svg viewBox="0 0 24 24"><path d="M4 9h16l-1.5 11h-13L4 9Zm4 0a4 4 0 0 1 8 0" /></svg>
            <span>{{ inside ? 'VIEW OUTSIDE' : 'VIEW INSIDE' }}</span>
          </button>
          <div class="vp-top">
            <a class="icon-btn" :href="INSTAGRAM" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24"><path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm4.9-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM12 3.6c2.7 0 3 0 4.1.1 2.7.1 4 1.4 4.1 4.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.7-1.4 4-4.1 4.1-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.7-.1-4-1.4-4.1-4.1C3.7 15 3.6 14.7 3.6 12s0-3 .1-4.1c.1-2.7 1.4-4 4.1-4.1 1.1-.2 1.5-.2 4.2-.2ZM12 2c-2.7 0-3.1 0-4.1.1C4.2 2.2 2.2 4.2 2.1 7.9 2 8.9 2 9.3 2 12s0 3.1.1 4.1c.1 3.6 2.1 5.7 5.8 5.8 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c3.6-.1 5.7-2.1 5.8-5.8.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-3.6-2.1-5.7-5.8-5.8C15.1 2 14.7 2 12 2Z" /></svg>
            </a>
            <a class="icon-btn" :href="TIKTOK" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg viewBox="0 0 24 24"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7l-.8-.1a5.7 5.7 0 1 0 5.7 5.7V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5Z" /></svg>
            </a>
            <button class="ar-pill" type="button" :aria-expanded="showAr" @click="showAr = !showAr">
              <svg viewBox="0 0 24 24"><path d="M12 3 4.5 7.3v9.4L12 21l7.5-4.3V7.3L12 3Zm0 0v9m0 0 7.5-4.7M12 12 4.5 7.3M12 12v9" /></svg>
              <span>VIEW IN AR</span>
            </button>
          </div>
          <div v-if="showAr" class="toast panel-glass" role="status">
            La vista in realtà aumentata arriva presto: dal telefono potrai appoggiare la borsa sul tavolo di casa.
          </div>

          <p v-if="status === 'loading'" class="vp-status">Loading 3D model…</p>
          <p v-else-if="status === 'error'" class="vp-status">
            Il modello 3D non si è caricato su questo dispositivo. Puoi comunque scegliere le opzioni e ordinare.
          </p>

          <div class="summary panel-glass" aria-live="polite">
            <h2>Summary</h2>
            <div class="sum-grid">
              <div v-for="it in summary" :key="it.key" class="sum-item">
                <span class="sw" :style="swatches[it.key] ? { backgroundImage: `url(${swatches[it.key]})` } : undefined" />
                {{ it.name }}
              </div>
            </div>
          </div>

          <div class="vp-ctrl">
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
          <span v-if="showHint && status === 'ready'" class="hint">Trascina per ruotare · trascina toppe e monogramma per spostarli</span>
        </div>
      </section>

      <aside class="inspector panel-glass" aria-label="Personalizza la borsa">
        <h1 class="ttl">Customize your {{ bag.name }} bag</h1>
        <div class="tabs" role="tablist">
          <button
            v-for="(g, i) in tabs"
            :key="g.key"
            type="button"
            role="tab"
            :aria-selected="activeTab === g.key"
            @click="goTab(g.key)"
          >
            {{ i + 1 }}. {{ g.tab.toUpperCase() }}
          </button>
        </div>

        <div ref="scroller" class="scroll" @scroll.passive="onScroll">
          <div id="stella-g-model" class="grp">
            <h3>1. Bag model</h3>
            <div class="sws bags">
              <button
                v-for="b in BAGS"
                :key="b.id"
                type="button"
                class="swb"
                :aria-pressed="state.model === b.id"
                :aria-label="`${b.name}, ${b.type}, da ${b.p} euro`"
                @click="pickModel(b.id)"
              >
                <span class="sw bag" :style="{ backgroundImage: `url(${b.thumb})` }"><i class="chk" /></span>
                <span>{{ b.name }}<small>{{ b.type }}</small></span>
              </button>
            </div>
          </div>
          <div v-for="(g, i) in groups" :id="`stella-g-${g.key}`" :key="g.key" class="grp">
            <h3>{{ i + 2 }}. {{ g.title }}</h3>
            <div v-if="g.key === 'patch'" class="patches">
              <div
                v-for="(pt, pi) in state.patches"
                :key="pi"
                class="prow"
                :class="{ sel: selected?.kind === 'patch' && selected.index === pi }"
                @click="selected = { kind: 'patch', index: pi }"
              >
                <span class="pnum">{{ pi + 1 }}</span>
                <div class="pstyles" role="group" :aria-label="`Stile toppa ${pi + 1}`">
                  <button
                    v-for="o in PATCH"
                    :key="o.id"
                    type="button"
                    class="swb"
                    :title="o.name"
                    :aria-pressed="pt.style === o.id"
                    :aria-label="ariaLabel(o)"
                    @click="pt.style = o.id"
                  >
                    <span class="sw" :style="swatches[`patch:${o.id}`] ? { backgroundImage: `url(${swatches[`patch:${o.id}`]})` } : undefined"><i class="chk" /></span>
                  </button>
                </div>
                <div class="psize" role="group" :aria-label="`Misura toppa ${pi + 1}`">
                  <button v-for="z in SIZES" :key="z" type="button" :aria-pressed="pt.size === z" @click="pt.size = z">{{ z }}</button>
                </div>
                <span class="pprice">+€{{ findOption(PATCH, pt.style).p }}</span>
                <button type="button" class="prm" :aria-label="`Rimuovi toppa ${pi + 1}`" @click.stop="removePatch(pi)">×</button>
              </div>
              <button type="button" class="padd" :disabled="state.patches.length >= STELLA_MAX_PATCHES" @click="newPatch">
                + ADD A PATCH
              </button>
              <p class="note">
                Drag each patch on the bag to place it, front or back (up to {{ STELLA_MAX_PATCHES }}). Each patch is priced on its own.
              </p>
            </div>
            <div v-else class="sws">
              <button
                v-for="o in g.list"
                :key="o.id"
                type="button"
                class="swb"
                :aria-pressed="isSelected(g.key as SimpleGroup, o.id)"
                :aria-label="ariaLabel(o)"
                @click="pick(g.key as SimpleGroup, o.id)"
              >
                <span
                  class="sw"
                  :style="swatches[`${g.key}:${o.id}`] ? { backgroundImage: `url(${swatches[`${g.key}:${o.id}`]})` } : undefined"
                ><i class="chk" /></span>
                <span>{{ o.name }}</span>
              </button>
            </div>
            <p v-if="g.key === 'wash'" class="note">
              {{ maxWashes(bag) > 1 ? 'Up to two washes: the second one goes on strap and tab.' : 'One wash for the whole bag.' }}
            </p>
            <template v-if="g.key === 'finish'">
              <p class="note">Every bag carries its monogram: drag it on the bag to choose where it goes.</p>
              <label class="ini" for="stella-initials">
                Custom initials
                <input
                  id="stella-initials"
                  type="text"
                  maxlength="3"
                  placeholder="L2"
                  autocomplete="off"
                  :value="state.initials"
                  @input="onInitials"
                />
                <span v-if="state.initials" class="plus">+€{{ STELLA_INITIALS_PRICE }}</span>
              </label>
              <p class="meta">{{ meta }}</p>
            </template>
          </div>
        </div>

        <div class="buy">
          <div class="price-row">
            <span class="price" aria-live="polite">{{ fmt(price) }}</span>
            <button type="button" class="link" @click="spinning = !spinning">
              {{ spinning ? 'STOP ROTATION' : 'VIEW ALL VIEWS' }}
            </button>
          </div>
          <button type="button" class="add" @click="addToBag">ADD TO BAG</button>
          <p v-if="added" class="added" role="status">
            Added to your bag · <NuxtLink to="/cart" class="underline">view bag</NuxtLink>
          </p>
        </div>
      </aside>
    </div>

    <div class="dots" role="group" aria-label="Vista">
      <button
        v-for="(label, i) in ['Fronte', 'Lato', 'Retro']"
        :key="label"
        type="button"
        :aria-pressed="view === i"
        :aria-label="label"
        @click="showView(i)"
      />
    </div>
  </div>
</template>

<style scoped>
.stella {
  --line: rgb(255 255 255 / 0.16);
  color: var(--color-fg);
  font-size: 13px;
  line-height: 1.35;
}
.stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 350px;
  gap: 18px;
}
.viewport {
  position: relative;
  height: 610px;
  border-radius: var(--radius-card);
  overflow: hidden;
  background: #8b8277;
}
.backdrop,
.gl {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.backdrop {
  z-index: 0;
  object-fit: cover;
}
.gl {
  z-index: 1;
}
.gl :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
.vp-ui {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.vp-ui > * {
  pointer-events: auto;
}
.vp-status {
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
  pointer-events: none;
}
.icon-btn,
.ar-pill,
.vp-ctrl button {
  background: rgb(22 22 22 / 0.82);
  border: 0;
  cursor: pointer;
  color: #fff;
}
.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}
.icon-btn svg {
  width: 17px;
  height: 17px;
  fill: #fff;
}
.inside-pill {
  position: absolute;
  top: 18px;
  left: 20px;
}
.inside-pill[aria-pressed='true'] {
  background: var(--color-selvedge);
  box-shadow: 0 0 0 1px var(--color-brass);
}
.vp-top {
  position: absolute;
  top: 18px;
  right: 20px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.ar-pill {
  height: 34px;
  border-radius: 17px;
  display: inline-flex;
  gap: 9px;
  align-items: center;
  padding: 0 16px 0 12px;
  font: 500 11.5px/1 var(--font-body);
  letter-spacing: 0.06em;
}
.ar-pill svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #fff;
  stroke-width: 1.4;
}
.vp-ctrl {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 6px;
}
.vp-ctrl button {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: grid;
  place-items: center;
}
.vp-ctrl svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: #fff;
  stroke-width: 1.6;
}
.vp-ctrl button[aria-pressed='true'] {
  background: var(--color-selvedge);
  box-shadow: 0 0 0 1px var(--color-brass);
}
.summary {
  position: absolute;
  right: 8px;
  bottom: 48px;
  width: 170px;
  border-radius: 10px;
  padding: 12px 12px 10px;
}
.summary h2 {
  margin: 0 0 8px;
  font: 400 14.5px/1.2 var(--font-body);
  text-transform: none;
  color: var(--color-fg);
}
.sum-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 6px;
}
.sum-item {
  display: grid;
  justify-items: center;
  gap: 4px;
  text-align: center;
  font: 400 8.5px/1.15 var(--font-body);
  color: color-mix(in oklab, var(--color-fg) 82%, transparent);
  letter-spacing: 0.02em;
}
.sum-item .sw {
  width: 34px;
  height: 34px;
}
.toast {
  position: absolute;
  top: 62px;
  right: 20px;
  max-width: 280px;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
}
.hint {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  font: 400 10.5px/1 var(--font-body);
  letter-spacing: 0.04em;
  color: rgb(255 255 255 / 0.78);
  background: rgb(22 22 22 / 0.5);
  padding: 6px 10px;
  border-radius: 99px;
  pointer-events: none !important;
}

/* inspector */
.inspector {
  border-radius: var(--radius-panel);
  padding: 20px 22px 22px;
  display: flex;
  flex-direction: column;
  height: 610px;
  min-width: 0;
}
.ttl {
  margin: 0;
  text-align: center;
  font: 500 15.5px/1.2 var(--font-display);
  letter-spacing: 0.06em;
}
.tabs {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  margin-top: 11px;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs button {
  background: none;
  border: 0;
  padding: 4px 0 7px;
  font: 500 8.5px/1 var(--font-body);
  letter-spacing: 0.03em;
  color: var(--color-muted);
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 1.5px solid transparent;
  margin-bottom: -1px;
}
.tabs button[aria-selected='true'] {
  color: var(--color-fg);
  border-bottom-color: var(--color-fg);
}
.scroll {
  flex: 1;
  overflow-y: auto;
  padding-top: 10px;
  scrollbar-width: thin;
  scrollbar-color: rgb(255 255 255 / 0.2) transparent;
}
.grp {
  padding-bottom: 6px;
}
.grp h3 {
  margin: 6px 0 9px;
  font: 500 13px/1.25 var(--font-body);
  letter-spacing: 0.02em;
}
.sws {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px 6px;
}
.swb {
  background: none;
  border: 0;
  padding: 0;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 5px;
  cursor: pointer;
  text-align: center;
  font: 400 11px/1.15 var(--font-body);
  color: color-mix(in oklab, var(--color-fg) 90%, transparent);
}
.sw {
  position: relative;
  display: block;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid rgb(255 255 255 / 0.25);
  background-color: var(--color-surface-2);
  background-size: cover;
  background-position: center;
}
@media (prefers-reduced-motion: no-preference) {
  .swb .sw {
    transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  }
}
.swb:hover .sw {
  transform: scale(1.05);
}
.swb[aria-pressed='true'] .sw {
  box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 3.5px var(--color-brass-hi);
  border-color: transparent;
}
.swb[aria-pressed='true'] {
  color: var(--color-brass-hi);
}
.chk {
  position: absolute;
  top: 6px;
  right: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-brass-hi);
  display: none;
  place-items: center;
}
.chk::after {
  content: '';
  width: 6px;
  height: 3px;
  border-left: 1.5px solid #1b1b1b;
  border-bottom: 1.5px solid #1b1b1b;
  transform: rotate(-45deg) translate(0.5px, -0.5px);
}
.swb[aria-pressed='true'] .chk {
  display: grid;
}
.sws.bags {
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 6px;
}
.sw.bag {
  background-color: #8b8277;
  background-size: cover;
}
.swb small {
  display: block;
  margin-top: 2px;
  font-size: 9.5px;
  color: var(--color-muted);
}
.patches {
  display: grid;
  gap: 6px;
}
.prow {
  display: grid;
  grid-template-columns: 16px 1fr auto auto 20px;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.prow.sel {
  border-color: var(--color-brass-hi);
}
.pnum {
  font: 500 11px/1 var(--font-mono);
  color: var(--color-muted);
}
.pstyles {
  display: flex;
  gap: 6px;
}
.pstyles .sw {
  width: 34px;
  height: 34px;
}
.pstyles .chk {
  top: 0;
  right: -2px;
}
.psize {
  display: flex;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
}
.psize button {
  width: 22px;
  height: 22px;
  border: 0;
  background: none;
  color: var(--color-muted);
  font: 500 10px/1 var(--font-mono);
  cursor: pointer;
}
.psize button[aria-pressed='true'] {
  background: var(--color-brass-hi);
  color: #1b1b1b;
}
.pprice {
  font: 400 10.5px/1 var(--font-mono);
  color: var(--color-brass-hi);
}
.prm {
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--color-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.prm:hover {
  color: var(--color-fg);
}
.padd {
  height: 34px;
  border-radius: 17px;
  border: 1px dashed var(--color-brass-hi);
  background: none;
  color: var(--color-brass-hi);
  font: 500 11px/1 var(--font-body);
  letter-spacing: 0.06em;
  cursor: pointer;
}
.padd:disabled {
  opacity: 0.4;
  cursor: default;
}
.note {
  margin-top: 6px;
  font-size: 10.5px;
  color: var(--color-muted);
}
.ini {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
  font-size: 11px;
  color: var(--color-muted);
}
.ini input {
  width: 86px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: rgb(0 0 0 / 0.25);
  color: var(--color-fg);
  font: 400 12px var(--font-mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.plus {
  color: var(--color-brass-hi);
  font-family: var(--font-mono);
}
.meta {
  font: 400 10.5px/1.35 var(--font-mono);
  color: var(--color-muted);
  margin-top: 8px;
  letter-spacing: -0.02em;
}
.buy {
  border-top: 1px solid var(--line);
  padding-top: 14px;
  margin-top: 8px;
  display: grid;
  gap: 14px;
}
.price-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.price {
  font: 400 20px/1 var(--font-body);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}
.link {
  background: none;
  border: 0;
  padding: 0;
  font: 400 11px/1 var(--font-body);
  letter-spacing: 0.06em;
  color: var(--color-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.add {
  height: 44px;
  border-radius: 22px;
  border: 0;
  background: var(--color-cream);
  color: var(--color-raw);
  font: 400 13.5px/1 var(--font-body);
  letter-spacing: 0.06em;
  cursor: pointer;
}
.add:hover {
  background: #fff;
}
.added {
  font-size: 11px;
  color: var(--color-muted);
  text-align: center;
  margin-top: -6px;
}
.dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 16px;
  width: calc(100% - 368px);
}
.dots button {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 0;
  padding: 0;
  background: #6b6862;
  cursor: pointer;
}
.dots button[aria-pressed='true'] {
  background: #a9a49b;
  box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 3px #a9a49b;
}

/* Light theme: inspector text sits on white glass */
:root[data-theme='light'] .stella {
  --line: rgb(140 58 23 / 0.18);
}
:root[data-theme='light'] .add {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
:root[data-theme='light'] .add:hover {
  background: var(--color-primary-strong);
}
:root[data-theme='light'] .sw {
  border-color: rgb(140 58 23 / 0.2);
}
:root[data-theme='light'] .ini input {
  background: rgb(255 255 255 / 0.6);
}

@media (max-width: 1100px) {
  .stage {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
  .dots {
    width: calc(100% - 338px);
  }
}
@media (max-width: 860px) {
  .stage {
    grid-template-columns: 1fr;
  }
  .viewport {
    height: 460px;
  }
  .inspector {
    height: auto;
  }
  .scroll {
    overflow: visible;
  }
  .dots {
    width: 100%;
  }
}
@media (max-width: 520px) {
  .viewport {
    height: 400px;
  }
  .summary {
    display: none;
  }
  .ar-pill span {
    display: none;
  }
  .ar-pill {
    padding: 0 9px;
  }
  .sw {
    width: 48px;
    height: 48px;
  }
  .inspector {
    padding: 18px 14px;
  }
}
</style>
