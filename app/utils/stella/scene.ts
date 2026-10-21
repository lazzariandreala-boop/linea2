/**
 * three.js scene for the bag configurator. Loads the chosen model from
 * public/models/, dresses it with procedural denim/lining textures, and lays
 * two decals (patch + monogram) that are raycast onto the curved front.
 * - `parts` models (Stella, from CLO) keep their fabric groups: body, strap,
 *   tab, rings and stitches each get their own material.
 * - `mesh` models (Meshy) are a single untextured shell: they get computed
 *   normals and box-projected UVs, then one denim material.
 * Browser-only: import it from a client-only component.
 *
 * Note: on Stella the patch decal also hides the perforated "H" that is still
 * cut into the source model; that must be removed in CLO before going live.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HW, LINING, STELLA_THREAD, WASH, findBag, findOption, maxWashes, type BagModel, type StellaState } from './options'
import { denim, lining, mix, monoCanvas, patchCanvas, type DenimSpec } from './textures'

/** Front, side, back. */
export const STELLA_VIEWS = [0, Math.PI / 2, Math.PI] as const

interface Parts {
  body: THREE.Mesh[]
  bodySide: THREE.Mesh[]
  strap: THREE.Mesh[]
  strapSide: THREE.Mesh[]
  tab: THREE.Mesh[]
  tabSide: THREE.Mesh[]
  ring: THREE.Mesh[]
  stitch: THREE.Mesh[]
}

interface Model {
  bag: BagModel
  holder: THREE.Group
  parts: Parts
  inner: THREE.Mesh[]
  patch: THREE.Mesh
  mono: THREE.Mesh
  /** World-space texture repeat that gives a believable twill scale. */
  repeat: number
  aspect: number
}

export interface StellaSceneOptions {
  host: HTMLElement
  /** A different bag model started loading. */
  onLoading?: () => void
  /** Called each time a model is loaded (true) or failed (false). */
  onReady?: (ok: boolean) => void
  /** Called with the index into STELLA_VIEWS closest to the current angle. */
  onViewChange?: (index: number) => void
  /** First drag on the canvas (to hide the "drag to rotate" hint). */
  onInteract?: () => void
}

export interface StellaScene {
  apply: (state: StellaState) => void
  rotateBy: (radians: number) => void
  setView: (index: number) => void
  setZoom: (on: boolean) => void
  setSpin: (on: boolean) => void
  dispose: () => void
}

/** Average UV-per-world-unit of a mesh, to normalise texture scale. */
function uvDensity(geo: THREE.BufferGeometry): number {
  const p = geo.attributes.position as THREE.BufferAttribute
  const uv = geo.attributes.uv as THREE.BufferAttribute | undefined
  if (!uv) return 1
  const idx = geo.index
  const n = idx ? idx.count / 3 : p.count / 3
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const ua = new THREE.Vector2(), ub = new THREE.Vector2(), uc = new THREE.Vector2()
  let sumW = 0
  let sumU = 0
  for (let t = 0; t < n; t += Math.max(1, Math.floor(n / 3000))) {
    const i0 = idx ? idx.getX(t * 3) : t * 3
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2
    a.fromBufferAttribute(p, i0); b.fromBufferAttribute(p, i1); c.fromBufferAttribute(p, i2)
    ua.fromBufferAttribute(uv, i0); ub.fromBufferAttribute(uv, i1); uc.fromBufferAttribute(uv, i2)
    sumW += b.clone().sub(a).cross(c.clone().sub(a)).length() / 2
    sumU += Math.abs((ub.x - ua.x) * (uc.y - ua.y) - (uc.x - ua.x) * (ub.y - ua.y)) / 2
  }
  return sumW > 0 ? Math.sqrt(sumU / sumW) : 1
}

/**
 * Build a plane of w×h centred on (cx, cy) and project every vertex onto the
 * targets along -z, so the decal hugs the curved panel. Vertices that miss
 * (or hit something far behind, like the strap's far side) are filled from
 * their neighbours.
 */
function conform(targets: THREE.Mesh[], cx: number, cy: number, w: number, h: number, seg: number, lift: number) {
  const geo = new THREE.PlaneGeometry(w, h, seg, seg)
  const p = geo.attributes.position as THREE.BufferAttribute
  const rc = new THREE.Raycaster()
  const box = new THREE.Box3()
  targets.forEach((m) => box.expandByObject(m))
  const zs: (number | null)[] = []
  const dir = new THREE.Vector3(0, 0, -1)
  for (let i = 0; i < p.count; i++) {
    rc.set(new THREE.Vector3(cx + p.getX(i), cy + p.getY(i), box.max.z + 1), dir)
    const hit = rc.intersectObjects(targets, false)[0]
    zs.push(hit ? hit.point.z : null)
  }
  const vals = zs.filter((z): z is number => z !== null).sort((x, y) => x - y)
  const med = vals[Math.floor(vals.length * 0.7)] ?? 0
  const tol = Math.max(w, h) * 0.18
  const ok = zs.map((z) => z !== null && z > med - tol)
  const cols = seg + 1
  for (let pass = 0; pass < 60; pass++) {
    let changed = false
    for (let i = 0; i < zs.length; i++) {
      if (ok[i]) continue
      const r = Math.floor(i / cols)
      const c = i % cols
      let s = 0
      let n = 0
      for (const [qr, qc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]] as const) {
        if (qr < 0 || qr >= cols || qc < 0 || qc >= cols) continue
        const j = qr * cols + qc
        if (ok[j]) { s += zs[j]!; n++ }
      }
      if (n) { zs[i] = s / n; ok[i] = true; changed = true }
    }
    if (!changed) break
  }
  for (let i = 0; i < p.count; i++) p.setXYZ(i, cx + p.getX(i), cy + p.getY(i), (ok[i] ? zs[i]! : med) + lift)
  geo.computeVertexNormals()
  return geo
}

/**
 * Meshy exports carry positions only. Compute smooth normals, then split the
 * triangles and give each one UVs projected along its dominant axis (box
 * mapping), in model units, so the denim weave tiles evenly.
 */
function prepareShell(src: THREE.BufferGeometry): THREE.BufferGeometry {
  src.computeVertexNormals()
  const geo = src.index ? src.toNonIndexed() : src
  const p = geo.attributes.position as THREE.BufferAttribute
  const uv = new Float32Array(p.count * 2)
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3()
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2)
    n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b))
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z)
    for (let k = 0; k < 3; k++) {
      const x = p.getX(i + k), y = p.getY(i + k), z = p.getZ(i + k)
      const [u, v] = ax >= ay && ax >= az ? [z, y] : ay >= az ? [x, z] : [x, y]
      uv[(i + k) * 2] = u
      uv[(i + k) * 2 + 1] = v
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geo
}

function disposeObject(o: THREE.Object3D) {
  o.traverse((x) => {
    const m = x as THREE.Mesh
    if (m.geometry) m.geometry.dispose()
    if (m.material) disposeMaterial(m.material)
  })
}

function disposeMaterial(m: THREE.Material | THREE.Material[] | undefined) {
  if (!m) return
  for (const x of ([] as THREE.Material[]).concat(m)) {
    const std = x as THREE.MeshStandardMaterial
    std.map?.dispose()
    if (std.bumpMap && std.bumpMap !== std.map) std.bumpMap.dispose()
    x.dispose()
  }
}

export function createStellaScene(opts: StellaSceneOptions): StellaScene {
  const { host } = opts
  // preserveDrawingBuffer: the cart thumbnail is copied from this canvas.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60)
  let camZ = 7.2
  let camZT = 7.2
  camera.position.set(0, 0.25, camZ)

  // Soft studio environment for the brass reflections.
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = new THREE.Scene()
  env.add(new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: 0x5e5a55, side: THREE.BackSide })))
  const envLight = (w: number, h: number, x: number, y: number, z: number, ry: number, rx: number, col: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }))
    m.position.set(x, y, z)
    m.rotation.set(rx, ry, 0)
    env.add(m)
  }
  envLight(6, 4, 0, 5.9, 0, 0, Math.PI / 2, 0xffffff)
  envLight(3, 4, 5.9, 1, 1.5, -Math.PI / 2, 0, 0xfff1dc)
  envLight(3, 3, -5.9, 0, 2, Math.PI / 2, 0, 0x9fb0cc)
  const envMap = pmrem.fromScene(env, 0.03).texture
  scene.environment = envMap
  // Physically based light units (three >= r155): legacy intensities × π.
  scene.add(new THREE.HemisphereLight(0xfff7ec, 0x6a6258, 0.45 * Math.PI))
  const key = new THREE.DirectionalLight(0xfff4e6, 0.75 * Math.PI)
  key.position.set(-3, 4, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xdfe7ff, 0.35 * Math.PI)
  rim.position.set(4, 1, -3)
  scene.add(rim)

  const root = new THREE.Group()
  scene.add(root)
  const maxAniso = renderer.capabilities.getMaxAnisotropy()

  function tex(c: HTMLCanvasElement, rep = 1) {
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(rep, rep)
    t.anisotropy = maxAniso
    return t
  }

  let model: Model | null = null
  let pending: StellaState | null = null
  let disposed = false

  function applyModel(state: StellaState) {
    if (!model) return
    const P = model.parts
    const main = findOption(WASH, state.wash[0] ?? 'indigo')
    const acc = state.wash[1] && maxWashes(model.bag) > 1 ? findOption(WASH, state.wash[1]) : main
    const rep = model.repeat
    const spec = (o: typeof main): DenimSpec => ({ hex: o.hex!, textured: o.textured, distressed: o.distressed })
    const fabric = (w: DenimSpec, seed: number, side: THREE.Side) => {
      const t = tex(denim(w, 512, seed), rep)
      return new THREE.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: 0.006, roughness: 0.9, side })
    }
    const set = (list: THREE.Mesh[], mat: THREE.Material) => {
      for (const m of list) { disposeMaterial(m.material); m.material = mat }
    }

    set(P.body, fabric(spec(main), 7, THREE.FrontSide))
    const lin = new THREE.MeshStandardMaterial({
      map: tex(lining(findOption(LINING, state.lining).id, 256), rep * 1.6),
      roughness: state.lining === 'floral' ? 0.5 : 0.92,
      side: THREE.BackSide,
    })
    set(model.inner, lin)
    set(P.bodySide, fabric({ hex: mix(main.hex!, '#000000', 0.15), textured: main.textured }, 8, THREE.DoubleSide))
    set(P.strap, fabric(spec(acc), 19, THREE.DoubleSide))
    set(P.strapSide, fabric({ hex: mix(acc.hex!, '#000000', 0.18) }, 20, THREE.DoubleSide))
    set(P.tab, fabric(spec(acc), 23, THREE.DoubleSide))
    set(P.tabSide, fabric({ hex: mix(acc.hex!, '#000000', 0.18) }, 24, THREE.DoubleSide))
    const hw = findOption(HW, state.hw)
    set(P.ring, new THREE.MeshStandardMaterial({ color: hw.hex, metalness: 1, roughness: state.hw === 'black' ? 0.45 : 0.22, side: THREE.DoubleSide }))
    set(P.stitch, new THREE.MeshStandardMaterial({ color: STELLA_THREAD, roughness: 0.75, side: THREE.DoubleSide }))

    disposeMaterial(model.patch.material)
    model.patch.material = new THREE.MeshStandardMaterial({
      map: tex(patchCanvas(state, model.aspect)),
      transparent: true,
      alphaTest: 0.35,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
    disposeMaterial(model.mono.material)
    model.mono.visible = state.finish !== 'none'
    model.mono.material = new THREE.MeshStandardMaterial({
      map: tex(monoCanvas(state)),
      transparent: true,
      alphaTest: 0.3,
      roughness: 0.7,
      polygonOffset: true,
      polygonOffsetFactor: -3,
    })
  }

  function onModel(sc: THREE.Object3D, bag: BagModel) {
    const parts: Parts = { body: [], bodySide: [], strap: [], strapSide: [], tab: [], tabSide: [], ring: [], stitch: [] }
    sc.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      if (bag.kind === 'mesh') {
        m.geometry = prepareShell(m.geometry)
        parts.body.push(m)
        return
      }
      const n = (m.material as THREE.Material | undefined)?.name ?? ''
      if (/HALKA/.test(n)) parts.ring.push(m)
      else if (/FABRIC 2_FRONT/.test(n)) parts.body.push(m)
      else if (/FABRIC 2_SIDE/.test(n)) parts.bodySide.push(m)
      else if (/FABRIC 1_FRONT/.test(n)) parts.strap.push(m)
      else if (/FABRIC 1_SIDE/.test(n)) parts.strapSide.push(m)
      else if (/FABRIC 3_FRONT/.test(n)) parts.tab.push(m)
      else if (/FABRIC 3_SIDE/.test(n)) parts.tabSide.push(m)
      else parts.stitch.push(m)
    })
    if (!parts.body.length) throw new Error(`${bag.id} model has no body panels`)

    // Normalise: Stella's body (strap excluded) 1.7 units tall, slightly below
    // the camera axis; single-shell models 2.1 units tall including handles.
    const wrap = new THREE.Group()
    wrap.add(sc)
    sc.updateMatrixWorld(true)
    const bb = new THREE.Box3()
    parts.body.forEach((m) => bb.expandByObject(m))
    const sz = bb.getSize(new THREE.Vector3())
    const ct = bb.getCenter(new THREE.Vector3())
    const k = (bag.kind === 'parts' ? 1.7 : 2.1) / sz.y
    wrap.scale.setScalar(k)
    wrap.position.set(-ct.x * k, -ct.y * k - (bag.kind === 'parts' ? 0.32 : 0.08), -ct.z * k)
    const holder = new THREE.Group()
    holder.add(wrap)
    root.rotation.set(0, 0, 0)
    root.position.y = 0
    root.add(holder)
    root.updateMatrixWorld(true)

    const bw = new THREE.Box3()
    parts.body.forEach((m) => bw.expandByObject(m))
    const W = bw.max.x - bw.min.x
    const H = bw.max.y - bw.min.y
    const cx = (bw.min.x + bw.max.x) / 2
    const dens = uvDensity(parts.body[0]!.geometry) / k
    // Patch sits low on the front (on Stella it covers the perforated H);
    // monogram above it. Spots are per model, as fractions of the bbox.
    const ps = bag.patch
    const ms = bag.mono
    const patchGeo = conform(parts.body, cx, bw.min.y + H * ps.y, W * ps.w, H * ps.h, 28, 0.012)
    const monoGeo = conform(parts.body, cx, bw.min.y + H * ms.y, W * ms.w, W * ms.w * 0.5, 10, 0.014)

    // Inner shell (BackSide) so the lining shows through the bag's opening.
    const inner = parts.body.map((m) => {
      const s = new THREE.Mesh(m.geometry)
      s.position.copy(m.position)
      s.quaternion.copy(m.quaternion)
      s.scale.copy(m.scale)
      m.parent!.add(s)
      return s
    })
    const patch = new THREE.Mesh(patchGeo)
    const mono = new THREE.Mesh(monoGeo)
    holder.add(patch, mono)
    model = { bag, holder, parts, inner, patch, mono, repeat: 1 / (dens * 0.14), aspect: (H * ps.h) / (W * ps.w) }
  }

  // Load on demand; a newer request supersedes one still in flight.
  const loader = new GLTFLoader()
  let wanted = ''
  function load(bag: BagModel) {
    wanted = bag.id
    opts.onLoading?.()
    loader
      .loadAsync(bag.url)
      .then((gltf) => {
        if (disposed || wanted !== bag.id) return
        if (model) {
          root.remove(model.holder)
          disposeObject(model.holder)
          model = null
        }
        const savedRot = root.rotation.clone()
        const savedY = root.position.y
        onModel(gltf.scene, bag)
        root.rotation.copy(savedRot)
        root.position.y = savedY
        if (pending) applyModel(pending)
        opts.onReady?.(true)
      })
      .catch((err: unknown) => {
        console.error(`[configurator] ${bag.url} failed to load`, err)
        if (!disposed && wanted === bag.id) opts.onReady?.(false)
      })
  }

  // ── Sizing ─────────────────────────────────────────────────────────────
  let zoomed = false
  function resize() {
    let w = host.clientWidth
    let h = host.clientHeight
    if (!w || !h) { w = 900; h = 610 }
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camZT = (w / h < 0.95 ? 9.4 : 7.2) * (zoomed ? 0.68 : 1)
    camera.updateProjectionMatrix()
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(host)

  // ── Interaction: drag to orbit, dots/arrows snap ─────────────────────────
  let rotY = -0.25, tY = -0.25, rotX = 0.04, tX = 0.04
  let spin = false
  let drag: { x: number; y: number; ty: number; tx: number } | null = null
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const el = renderer.domElement
  el.style.touchAction = 'pan-y'
  el.style.cursor = 'grab'

  function nearestView() {
    const a = ((tY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    let best = 0
    let bd = 9
    STELLA_VIEWS.forEach((v, i) => {
      const d = Math.min(Math.abs(a - v), Math.PI * 2 - Math.abs(a - v))
      if (d < bd) { bd = d; best = i }
    })
    opts.onViewChange?.(best)
  }

  const onDown = (e: PointerEvent) => {
    drag = { x: e.clientX, y: e.clientY, ty: tY, tx: tX }
    spin = false
    el.setPointerCapture(e.pointerId)
    el.style.cursor = 'grabbing'
    opts.onInteract?.()
  }
  const onMove = (e: PointerEvent) => {
    if (!drag) return
    tY = drag.ty + (e.clientX - drag.x) * 0.011
    tX = Math.max(-0.35, Math.min(0.6, drag.tx + (e.clientY - drag.y) * 0.005))
  }
  const onUp = () => {
    drag = null
    el.style.cursor = 'grab'
    nearestView()
  }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)

  // ── Render loop ─────────────────────────────────────────────────────────
  const t0 = performance.now()
  let raf = 0
  const loop = (now: number) => {
    if (spin) tY += 0.007
    rotY += (tY - rotY) * 0.09
    rotX += (tX - rotX) * 0.09
    camZ += (camZT - camZ) * 0.1
    camera.position.z = camZ
    camera.lookAt(0, 0.05, 0)
    const tt = now - t0
    root.rotation.set(rotX, rotY, reduce ? 0 : Math.sin(tt / 2000) * 0.01)
    root.position.y = reduce ? 0 : Math.sin(tt / 1400) * 0.02
    renderer.render(scene, camera)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  return {
    apply(state) {
      pending = state
      const bag = findBag(state.model)
      if (bag.id !== wanted) load(bag)
      if (model?.bag.id === bag.id) applyModel(state)
    },
    rotateBy(radians) {
      spin = false
      tY += radians
      nearestView()
    },
    setView(index) {
      spin = false
      const a = STELLA_VIEWS[index] ?? 0
      tY = Math.round((tY - a) / (Math.PI * 2)) * Math.PI * 2 + a
      tX = 0.04
      opts.onViewChange?.(index)
    },
    setZoom(on) {
      zoomed = on
      resize()
    },
    setSpin(on) {
      spin = on
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      disposeObject(scene)
      envMap.dispose()
      pmrem.dispose()
      renderer.dispose()
      el.remove()
    },
  }
}
