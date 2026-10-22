/**
 * Browser side of scripts/render-bags-2d.mjs: loads each bag in the 3D scene
 * and renders the stills the 2D configurator stacks (see that script).
 */
import { BAGS, HW, LINING, WASH, defaultStellaState, findBag, type Frame } from '../../app/utils/stella/options'
import { createStellaScene, type StillLayer, type StillView } from '../../app/utils/stella/scene'
import { swatchURL } from '../../app/utils/stella/textures'

export interface Job {
  file: string
  view: StillView
  layer: StillLayer
  wash: string
  lining: string
  hw: string
}

async function toWebp(png: string, size: number): Promise<string> {
  const img = new Image()
  img.src = png
  await img.decode()
  const c = document.createElement('canvas')
  c.width = c.height = size
  c.getContext('2d')!.drawImage(img, 0, 0, size, size)
  return c.toDataURL('image/webp', 0.8)
}

/** All stills for one bag, as { file: dataURL } plus the frame of each view. */
async function renderBag(id: string, size: number, only = '') {
  const bag = findBag(id)
  const host = document.getElementById('host')!
  const scene = createStellaScene({ host })
  const out: Record<string, string> = {}
  const frames: Partial<Record<StillView, Frame>> = {}
  const shot = async (job: Job) => {
    if (only && !job.file.includes(only)) return
    scene.apply({ ...defaultStellaState(bag.id), wash: [job.wash], lining: job.lining, hw: job.hw, patches: [] })
    if (!(await scene.loaded())) throw new Error(`${id} failed to load`)
    // Render at 2× and downscale, for clean edges.
    const { url, frame } = scene.still(job.view, job.layer, size * 2)
    frames[job.view] = frame
    out[job.file] = await toWebp(url, size)
  }
  const parts = bag.kind === 'parts'
  for (const w of WASH) {
    for (const view of ['front', 'back'] as const) {
      await shot({ file: `${view}-${parts ? 'body' : 'all'}-${w.id}`, view, layer: parts ? 'body' : 'all', wash: w.id, lining: 'floral', hw: 'brass' })
      if (parts) await shot({ file: `${view}-accent-${w.id}`, view, layer: 'accent', wash: w.id, lining: 'floral', hw: 'brass' })
    }
    for (const l of LINING) await shot({ file: `top-${w.id}-${l.id}`, view: 'top', layer: 'all', wash: w.id, lining: l.id, hw: 'brass' })
  }
  if (parts) {
    for (const h of HW) {
      for (const view of ['front', 'back'] as const) await shot({ file: `${view}-hw-${h.id}`, view, layer: 'hw', wash: 'indigo', lining: 'floral', hw: h.id })
    }
  }
  scene.dispose()
  return { out, frames }
}

/** Static swatches, so the configurator doesn't weave denim on load. */
function swatches() {
  const out: Record<string, string> = {}
  for (const w of WASH) out[`wash-${w.id}`] = swatchURL('wash', w)
  return out
}

declare global {
  interface Window {
    renderBag: typeof renderBag
    swatches: typeof swatches
    bagIds: string[]
  }
}
window.renderBag = renderBag
window.swatches = swatches
window.bagIds = BAGS.map((b) => b.id)
