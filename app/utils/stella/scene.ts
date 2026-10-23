/**
 * three.js scene for the bag configurator. Loads the chosen model from
 * public/models/, dresses it with woven denim/lining textures, and lays the
 * patches and the monogram as decals that hug the curved panels. Decals can
 * be dragged on the bag (front or back). `still()` renders fixed views for
 * the 2D configurator images (scripts/render-bags-2d.mjs).
 * - `parts` models (Stella, from CLO) keep their fabric groups: body, strap,
 *   tab, rings and stitches each get their own material.
 * - `mesh` models (Meshy) are a single untextured shell: they get computed
 *   normals and box-projected UVs, then one denim material.
 * Browser-only: import it from a client-only component.
 *
 * Note: on Stella a plain denim cover piece (bag.cover) hides the perforated
 * "H" still cut into the source model, so patches can move freely; the cut-out
 * must still be removed in CLO before going live.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  HW,
  LINING,
  PATCH_SCALE,
  STELLA_THREAD,
  WASH,
  findBag,
  findOption,
  maxWashes,
  type BagModel,
  type Frame,
  type Placement,
  type StellaState,
} from './options'
import { canvas, denim, denimSpec, lining, monoCanvas, patchCanvas, type DenimSpec } from './textures'

/** Size of one woven tile on the bag, in scene units (the body is ~1.7–2.1
 *  units tall, so 128 warp yarns per tile ≈ real denim density). */
const TILE = 0.32

export type DecalKind = 'patch' | 'mono'

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

/** Depth of the body seen straight from the front (max z) or the back
 *  (min z) on a grid over its bounding box, in holder space. */
interface HeightMap {
  res: number
  z: Float32Array
}

interface Decal {
  mesh: THREE.Mesh
  kind: DecalKind
  index: number
  geoKey: string
  texKey: string
}

interface Model {
  bag: BagModel
  holder: THREE.Group
  parts: Parts
  inner: THREE.Mesh[]
  /** Body bounding box in holder space. */
  box: THREE.Box3
  maps: Record<Placement['side'], HeightMap>
  cover: THREE.Mesh | null
  patches: Decal[]
  mono: Decal
  /** Texture repeat that gives the weave its real-world scale. */
  repeat: number
  /** Body UV units per scene unit. */
  dens: number
  fabricKey: string
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
  /** A patch or the monogram was grabbed on the bag. */
  onSelect?: (kind: DecalKind, index: number) => void
  /** A dragged decal moved to a new spot. */
  onPlace?: (kind: DecalKind, index: number, at: Placement) => void
}

export type StillView = 'front' | 'back' | 'top'
/** body: the bag without strap/tab/rings; accent: strap + tab; hw: rings.
 *  Layers are rendered with the others as invisible occluders, so they stack. */
export type StillLayer = 'all' | 'body' | 'accent' | 'hw'
export interface StellaScene {
  apply: (state: StellaState) => void
  rotateBy: (radians: number) => void
  setView: (index: number) => void
  setZoom: (on: boolean) => void
  setSpin: (on: boolean) => void
  /** Resolves once the current model has loaded (false on failure). */
  loaded: () => Promise<boolean>
  /** Render one fixed view/layer for the 2D images (see StillView). */
  still: (view: StillView, layer: StillLayer, size: number) => { url: string; frame: Frame }
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

const HM_RES = 256

/**
 * Rasterise the body's triangles into a depth grid, once per model: decals
 * then hug the panel by sampling it, cheap enough to redo on every drag move.
 */
function heightMap(meshes: THREE.Mesh[], box: THREE.Box3, side: Placement['side'], into?: HeightMap): HeightMap {
  const R = HM_RES
  const z = into?.z ?? new Float32Array(R * R).fill(NaN)
  const W = box.max.x - box.min.x
  const H = box.max.y - box.min.y
  const front = side === 'front'
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  for (const m of meshes) {
    const p = m.geometry.attributes.position as THREE.BufferAttribute
    const idx = m.geometry.index
    const n = idx ? idx.count : p.count
    for (let t = 0; t < n; t += 3) {
      a.fromBufferAttribute(p, idx ? idx.getX(t) : t).applyMatrix4(m.matrixWorld)
      b.fromBufferAttribute(p, idx ? idx.getX(t + 1) : t + 1).applyMatrix4(m.matrixWorld)
      c.fromBufferAttribute(p, idx ? idx.getX(t + 2) : t + 2).applyMatrix4(m.matrixWorld)
      const ax = ((a.x - box.min.x) / W) * (R - 1), ay = ((a.y - box.min.y) / H) * (R - 1)
      const bx = ((b.x - box.min.x) / W) * (R - 1), by = ((b.y - box.min.y) / H) * (R - 1)
      const cx = ((c.x - box.min.x) / W) * (R - 1), cy = ((c.y - box.min.y) / H) * (R - 1)
      const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
      if (Math.abs(area) < 1e-9) continue
      const x0 = Math.max(0, Math.ceil(Math.min(ax, bx, cx))), x1 = Math.min(R - 1, Math.floor(Math.max(ax, bx, cx)))
      const y0 = Math.max(0, Math.ceil(Math.min(ay, by, cy))), y1 = Math.min(R - 1, Math.floor(Math.max(ay, by, cy)))
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const w0 = ((bx - x) * (cy - y) - (cx - x) * (by - y)) / area
          const w1 = ((cx - x) * (ay - y) - (ax - x) * (cy - y)) / area
          const w2 = 1 - w0 - w1
          if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue
          const d = w0 * a.z + w1 * b.z + w2 * c.z
          const k = y * R + x
          const cur = z[k]!
          if (Number.isNaN(cur) || (front ? d > cur : d < cur)) z[k] = d
        }
      }
    }
  }
  return { res: R, z }
}

/** Depth at (x, y) in holder space, or null off the panel. */
function sampleDepth(hm: HeightMap, box: THREE.Box3, x: number, y: number): number | null {
  const R = hm.res
  const gx = ((x - box.min.x) / (box.max.x - box.min.x)) * (R - 1)
  const gy = ((y - box.min.y) / (box.max.y - box.min.y)) * (R - 1)
  if (gx < 0 || gy < 0 || gx > R - 1 || gy > R - 1) return null
  const x0 = Math.floor(gx), y0 = Math.floor(gy)
  const x1 = Math.min(R - 1, x0 + 1), y1 = Math.min(R - 1, y0 + 1)
  const tx = gx - x0, ty = gy - y0
  const q = [hm.z[y0 * R + x0]!, hm.z[y0 * R + x1]!, hm.z[y1 * R + x0]!, hm.z[y1 * R + x1]!]
  if (q.every((v) => !Number.isNaN(v))) {
    const top = q[0]! + (q[1]! - q[0]!) * tx
    const bot = q[2]! + (q[3]! - q[2]!) * tx
    return top + (bot - top) * ty
  }
  const ok = q.filter((v) => !Number.isNaN(v))
  return ok.length ? ok.reduce((s, v) => s + v, 0) / ok.length : null
}

/**
 * Build a w×h plane centred on (cx, cy) and drop every vertex onto the
 * panel (front or back), so the decal hugs the curve. Vertices off the panel,
 * or far behind it (e.g. seen through the bag's opening), are filled from
 * their neighbours. Back decals are mirrored so they read right from behind.
 */
function conform(m: Model, side: Placement['side'], cx: number, cy: number, w: number, h: number, seg: number, lift: number, smooth = 0) {
  const geo = new THREE.PlaneGeometry(w, h, seg, seg)
  const p = geo.attributes.position as THREE.BufferAttribute
  const hm = m.maps[side]
  const front = side === 'front'
  const xs: number[] = []
  const zs: (number | null)[] = []
  for (let i = 0; i < p.count; i++) {
    const x = front ? cx + p.getX(i) : cx - p.getX(i)
    xs.push(x)
    zs.push(sampleDepth(hm, m.box, x, cy + p.getY(i)))
  }
  const vals = zs.filter((z): z is number => z !== null).sort((x, y) => x - y)
  const med = vals[Math.floor(vals.length * (front ? 0.7 : 0.3))] ?? (front ? m.box.max.z : m.box.min.z)
  const tol = Math.max(w, h) * 0.18
  const ok = zs.map((z) => z !== null && (front ? z > med - tol : z < med + tol))
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
  let z = zs.map((v, i) => (ok[i] ? v! : med))
  // Optional relaxation, to iron out puckers (keeps the outer ring fixed).
  for (let pass = 0; pass < smooth; pass++) {
    z = z.map((v, i) => {
      const r = Math.floor(i / cols)
      const c = i % cols
      if (r === 0 || c === 0 || r === seg || c === seg) return v
      return (v * 2 + z[i - 1]! + z[i + 1]! + z[i - cols]! + z[i + cols]!) / 6
    })
  }
  // Never sink below the surface: relaxation would otherwise dip into it.
  if (smooth) z = z.map((v, i) => (ok[i] && zs[i] !== null ? (front ? Math.max(v, zs[i]!) : Math.min(v, zs[i]!)) : v))
  const dz = front ? lift : -lift
  for (let i = 0; i < p.count; i++) p.setXYZ(i, xs[i]!, cy + p.getY(i), z[i]! + dz)
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

/**
 * CLO exports both faces of the cloth, and which one faces out varies by
 * pattern piece. Find each connected piece (welding vertices by position),
 * let its triangles vote, area-weighted, on whether the normals point away
 * from the bag's centre, and sort whole pieces into geometry groups
 * [outer, inner] (materials 0 and 1).
 */
function splitByFacing(meshes: THREE.Mesh[], box: THREE.Box3) {
  const centre = box.getCenter(new THREE.Vector3())
  const eps = (box.max.y - box.min.y) * 1e-4
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), v = new THREE.Vector3()
  const nm = new THREE.Matrix3()
  for (const m of meshes) {
    const g = m.geometry
    if (!g.attributes.normal) g.computeVertexNormals()
    const p = g.attributes.position as THREE.BufferAttribute
    const normals = g.attributes.normal as THREE.BufferAttribute
    const idx = g.index
    const count = idx ? idx.count : p.count
    const at = (t: number) => (idx ? idx.getX(t) : t)
    // Union-find over vertices welded by position.
    const parent = Int32Array.from({ length: p.count }, (_, i) => i)
    const find = (i: number): number => {
      while (parent[i] !== i) { parent[i] = parent[parent[i]!]!; i = parent[i]! }
      return i
    }
    const union = (x: number, y: number) => { parent[find(x)] = find(y) }
    const weld = new Map<string, number>()
    for (let i = 0; i < p.count; i++) {
      const key = `${Math.round(p.getX(i) / eps)},${Math.round(p.getY(i) / eps)},${Math.round(p.getZ(i) / eps)}`
      const j = weld.get(key)
      if (j === undefined) weld.set(key, i)
      else union(i, j)
    }
    for (let t = 0; t < count; t += 3) { union(at(t), at(t + 1)); union(at(t), at(t + 2)) }
    nm.getNormalMatrix(m.matrixWorld)
    const vote = new Map<number, number>()
    for (let t = 0; t < count; t += 3) {
      a.fromBufferAttribute(p, at(t)).applyMatrix4(m.matrixWorld)
      b.fromBufferAttribute(p, at(t + 1)).applyMatrix4(m.matrixWorld)
      c.fromBufferAttribute(p, at(t + 2)).applyMatrix4(m.matrixWorld)
      const area = v.subVectors(b, a).cross(n.subVectors(c, a)).length() / 2
      n.set(0, 0, 0)
      for (let k = 0; k < 3; k++) n.add(v.fromBufferAttribute(normals, at(t + k)))
      n.applyMatrix3(nm).normalize()
      const cen = v.copy(a).add(b).add(c).divideScalar(3).sub(centre).normalize()
      const r = find(at(t))
      vote.set(r, (vote.get(r) ?? 0) + Math.sign(n.dot(cen)) * area)
    }
    const outer: number[] = []
    const inner: number[] = []
    for (let t = 0; t < count; t += 3) {
      ;((vote.get(find(at(t))) ?? 0) >= 0 ? outer : inner).push(at(t), at(t + 1), at(t + 2))
    }
    g.setIndex([...outer, ...inner])
    g.clearGroups()
    g.addGroup(0, outer.length, 0)
    g.addGroup(outer.length, inner.length, 1)
  }
}

/** Draw a surface only from the side its normals point to (CLO's winding
 *  is not reliable, its normals are). */
function facingOnly<T extends THREE.Material>(mat: T): T {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      '#include <clipping_planes_fragment>\n  if (dot(vNormal, vViewPosition) < 0.0) discard;',
    )
  }
  mat.customProgramCacheKey = () => 'facing-only'
  return mat
}

/**
 * Remove stitch triangles on the front inside a spot (Stella: the rim of the
 * cut-out the cover piece hides), so they don't poke through the decals.
 * Expects world space to equal holder space (root at rest).
 */
function dropStitchesUnder(meshes: THREE.Mesh[], box: THREE.Box3, spot: { y: number; w: number; h: number }) {
  const W = box.max.x - box.min.x
  const H = box.max.y - box.min.y
  const cx = (box.min.x + box.max.x) / 2
  const cy = box.min.y + H * spot.y
  const midZ = (box.min.z + box.max.z) / 2
  const v = new THREE.Vector3()
  const c = new THREE.Vector3()
  for (const m of meshes) {
    const g = m.geometry
    const idx = g.index
    if (!idx) continue
    const p = g.attributes.position as THREE.BufferAttribute
    const keep: number[] = []
    for (let t = 0; t < idx.count; t += 3) {
      c.set(0, 0, 0)
      for (let k = 0; k < 3; k++) c.add(v.fromBufferAttribute(p, idx.getX(t + k)).applyMatrix4(m.matrixWorld))
      c.divideScalar(3)
      const under = Math.abs(c.x - cx) < (W * spot.w) / 2 && Math.abs(c.y - cy) < (H * spot.h) / 2 && c.z > midZ
      if (!under) keep.push(idx.getX(t), idx.getX(t + 1), idx.getX(t + 2))
    }
    if (keep.length < idx.count) g.setIndex(keep)
  }
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
    std.alphaMap?.dispose()
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
  // Neutral, near-daylight lights so the denim colours read true.
  // Physically based light units (three >= r155): legacy intensities × π.
  scene.add(new THREE.HemisphereLight(0xfbfaf7, 0x6a6560, 0.5 * Math.PI))
  const key = new THREE.DirectionalLight(0xfffaf2, 0.75 * Math.PI)
  key.position.set(-3, 4, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xe8eeff, 0.35 * Math.PI)
  rim.position.set(4, 1, -3)
  scene.add(rim)

  const root = new THREE.Group()
  scene.add(root)
  const maxAniso = renderer.capabilities.getMaxAnisotropy()


  function tex(c: HTMLCanvasElement, rep: number | [number, number] = 1, color = true) {
    const t = new THREE.CanvasTexture(c)
    if (color) t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    if (Array.isArray(rep)) t.repeat.set(rep[0], rep[1])
    else t.repeat.set(rep, rep)
    t.anisotropy = maxAniso
    return t
  }

  let model: Model | null = null
  let pending: StellaState | null = null
  let disposed = false

  const decalMaterial = (map: THREE.Texture, order: number) =>
    new THREE.MeshStandardMaterial({
      map,
      transparent: true,
      alphaTest: 0.35,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2 - order,
    })

  function decalSize(m: Model, kind: DecalKind, size: keyof typeof PATCH_SCALE = 'L') {
    const W = m.box.max.x - m.box.min.x
    const H = m.box.max.y - m.box.min.y
    if (kind === 'mono') return { w: W * m.bag.mono.w, h: W * m.bag.mono.w * 0.5 }
    const f = PATCH_SCALE[size]
    return { w: W * m.bag.patch.w * f, h: H * m.bag.patch.h * f }
  }

  /** Re-lay a decal's geometry at a placement. */
  function placeDecal(m: Model, d: Decal, at: Placement, size?: keyof typeof PATCH_SCALE) {
    const W = m.box.max.x - m.box.min.x
    const H = m.box.max.y - m.box.min.y
    const { w, h } = decalSize(m, d.kind, size)
    const lift = d.kind === 'mono' ? 0.02 : 0.012 + d.index * 0.002
    const geo = conform(m, at.side, m.box.min.x + W * at.u, m.box.min.y + H * at.v, w, h, d.kind === 'mono' ? 12 : 28, lift)
    d.mesh.geometry.dispose()
    d.mesh.geometry = geo
  }

  function newDecal(m: Model, kind: DecalKind, index: number): Decal {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry())
    mesh.renderOrder = kind === 'mono' ? 10 : 2 + index
    m.holder.add(mesh)
    return { mesh, kind, index, geoKey: '', texKey: '' }
  }

  function applyModel(state: StellaState) {
    const m = model
    if (!m) return
    const P = m.parts
    const main = findOption(WASH, state.wash[0] ?? 'indigo')
    const acc = state.wash[1] && maxWashes(m.bag) > 1 ? findOption(WASH, state.wash[1]) : main
    const rep = m.repeat
    const fabric = (w: DenimSpec, side: THREE.Side) => {
      const { map, bump } = denim(w)
      return new THREE.MeshStandardMaterial({
        map: tex(map, rep),
        bumpMap: tex(bump, rep, false),
        bumpScale: 0.6,
        roughness: 0.92,
        side,
      })
    }
    const set = (list: THREE.Mesh[], mat: THREE.Material | THREE.Material[]) => {
      const old = new Set(list.map((x) => x.material))
      for (const o of old) disposeMaterial(o)
      for (const x of list) x.material = mat
    }

    const fabricKey = [main.id, acc.id, state.lining, state.hw].join('|')
    if (fabricKey !== m.fabricKey) {
      m.fabricKey = fabricKey
      const liningMat = (side: THREE.Side) =>
        new THREE.MeshStandardMaterial({
          map: tex(lining(findOption(LINING, state.lining).id, 256), rep * 0.9),
          roughness: state.lining === 'floral' ? 0.5 : 0.92,
          side,
            })
      if (m.bag.kind === 'parts') {
        // Cloth pieces were sorted into [outer, inner] groups at load; each
        // shows only from the side it faces, so seams don't leak lining.
        const pair = [facingOnly(fabric(denimSpec(main), THREE.DoubleSide)), facingOnly(liningMat(THREE.DoubleSide))]
        set([...P.body, ...P.bodySide], pair)
      } else {
        set(P.body, fabric(denimSpec(main), THREE.FrontSide))
        set(m.inner, liningMat(THREE.BackSide))
      }
      set(P.strap, fabric(denimSpec(acc), THREE.DoubleSide))
      set(P.strapSide, fabric(denimSpec(acc, 0.18), THREE.DoubleSide))
      set(P.tab, fabric(denimSpec(acc), THREE.DoubleSide))
      set(P.tabSide, fabric(denimSpec(acc, 0.18), THREE.DoubleSide))
      const hw = findOption(HW, state.hw)
      set(P.ring, new THREE.MeshStandardMaterial({ color: hw.hex, metalness: 1, roughness: state.hw === 'black' ? 0.45 : 0.22, side: THREE.DoubleSide }))
      set(P.stitch, new THREE.MeshStandardMaterial({ color: STELLA_THREAD, roughness: 0.75, side: THREE.DoubleSide }))
      if (m.cover) {
        // Same weave as the body, faded in at the edges by the alpha map.
        const { map, bump } = denim(denimSpec(main))
        const old = m.cover.material as THREE.MeshStandardMaterial
        const alphaMap = old.alphaMap
        old.map?.dispose()
        old.bumpMap?.dispose()
        old.dispose()
        m.cover.material = new THREE.MeshStandardMaterial({
          map: tex(map, rep),
          bumpMap: tex(bump, rep, false),
          bumpScale: 0.6,
          roughness: 0.92,
          alphaMap,
          transparent: true,
          polygonOffset: true,
          polygonOffsetFactor: -1,
            })
      }
    }

    // Patches: add/remove meshes to match, then refresh what changed.
    while (m.patches.length > state.patches.length) {
      const d = m.patches.pop()!
      m.holder.remove(d.mesh)
      disposeObject(d.mesh)
    }
    while (m.patches.length < state.patches.length) m.patches.push(newDecal(m, 'patch', m.patches.length))
    state.patches.forEach((pt, i) => {
      const d = m.patches[i]!
      const geoKey = `${pt.side}|${pt.u}|${pt.v}|${pt.size}`
      if (geoKey !== d.geoKey) {
        placeDecal(m, d, pt, pt.size)
        d.geoKey = geoKey
      }
      const texKey = `${pt.style}|${main.id}`
      if (texKey !== d.texKey) {
        const { w, h } = decalSize(m, 'patch', 'L')
        disposeMaterial(d.mesh.material)
        d.mesh.material = decalMaterial(tex(patchCanvas(pt.style, main.id, h / w, (TILE * 1024) / w)), 1 + i * 0.5)
        d.texKey = texKey
      }
    })

    const mono = m.mono
    const geoKey = `${state.mono.side}|${state.mono.u}|${state.mono.v}`
    if (geoKey !== mono.geoKey) {
      placeDecal(m, mono, state.mono)
      mono.geoKey = geoKey
    }
    const texKey = state.finish
    if (texKey !== mono.texKey) {
      disposeMaterial(mono.mesh.material)
      mono.mesh.material = decalMaterial(tex(monoCanvas()), 4)
      ;(mono.mesh.material as THREE.MeshStandardMaterial).alphaTest = 0.3
      mono.texKey = texKey
    }
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

    // With root at rest, world space is holder space.
    const box = new THREE.Box3()
    parts.body.forEach((m) => box.expandByObject(m))
    const dens = uvDensity(parts.body[0]!.geometry) / k
    const maps = { front: heightMap(parts.body, box, 'front'), back: heightMap(parts.body, box, 'back') }

    if (bag.kind === 'parts') splitByFacing([...parts.body, ...parts.bodySide], box)
    // Single shells get an inner copy (BackSide) that carries the lining.
    const inner = bag.kind === 'parts' ? [] : parts.body.map((m) => {
      const s = new THREE.Mesh(m.geometry)
      s.position.copy(m.position)
      s.quaternion.copy(m.quaternion)
      s.scale.copy(m.scale)
      m.parent!.add(s)
      return s
    })
    if (bag.cover) dropStitchesUnder(parts.stitch, box, bag.cover)
    const m: Model = {
      bag, holder, parts, inner, box, maps, cover: null, patches: [],
      mono: null as unknown as Decal, repeat: 1 / (dens * TILE), dens, fabricKey: '',
    }
    m.mono = newDecal(m, 'mono', 0)
    if (bag.cover) {
      const W = box.max.x - box.min.x
      const H = box.max.y - box.min.y
      const cw = W * bag.cover.w
      const ch = H * bag.cover.h
      const x0 = (box.min.x + box.max.x) / 2 - cw / 2
      const y0 = box.min.y + H * bag.cover.y - ch / 2
      const geo = conform(m, 'front', x0 + cw / 2, y0 + ch / 2, cw, ch, 40, 0.008, 6)
      // UVs in body units so the shared weave lines up in scale.
      const gp = geo.attributes.position as THREE.BufferAttribute
      const uv = new Float32Array(gp.count * 2)
      for (let i = 0; i < gp.count; i++) {
        uv[i * 2] = gp.getX(i) * dens
        uv[i * 2 + 1] = gp.getY(i) * dens
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      const fade = canvas(256)
      const g = fade.getContext('2d')!
      g.filter = 'blur(6px)'
      g.fillStyle = '#fff'
      g.beginPath()
      g.roundRect(10, 10, 236, 236, 40)
      g.fill()
      const alpha = new THREE.CanvasTexture(fade)
      alpha.repeat.set(1 / (cw * dens), 1 / (ch * dens))
      alpha.offset.set(-x0 / cw, -y0 / ch)
      m.cover = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ alphaMap: alpha }))
      m.cover.renderOrder = 1
      holder.add(m.cover)
      // Patches then lie on top of the cover, not under it.
      m.cover.updateMatrixWorld(true)
      heightMap([m.cover], box, 'front', maps.front)
    }
    model = m
  }

  // Load on demand; a newer request supersedes one still in flight.
  const loader = new GLTFLoader()
  let wanted = ''
  let loading: Promise<boolean> = Promise.resolve(false)
  function load(bag: BagModel) {
    wanted = bag.id
    opts.onLoading?.()
    loading = loader
      .loadAsync(bag.url)
      .then((gltf) => {
        if (disposed || wanted !== bag.id) return false
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
        return true
      })
      .catch((err: unknown) => {
        console.error(`[configurator] ${bag.url} failed to load`, err)
        if (!disposed && wanted === bag.id) opts.onReady?.(false)
        return false
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

  // ── Interaction: drag decals on the bag, drag elsewhere to orbit ─────────
  let rotY = -0.25, tY = -0.25, rotX = 0.04, tX = 0.04
  let spin = false
  let drag: { x: number; y: number; ty: number; tx: number } | null = null
  let grab: { d: Decal; du: number; dv: number; at: Placement } | null = null
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const el = renderer.domElement
  el.style.touchAction = 'pan-y'
  el.style.cursor = 'grab'

  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const inv = new THREE.Matrix4()
  function cast(clientX: number, clientY: number, objs: THREE.Object3D[]) {
    const r = el.getBoundingClientRect()
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    return ray.intersectObjects(objs, false)[0] ?? null
  }
  const decalMeshes = () => (model ? [model.mono, ...model.patches].map((d) => d.mesh) : [])
  function decalAt(clientX: number, clientY: number): Decal | null {
    if (!model) return null
    const hit = cast(clientX, clientY, decalMeshes())
    return hit ? ([model.mono, ...model.patches].find((d) => d.mesh === hit.object) ?? null) : null
  }
  /** Body point under the pointer as a placement, or null off the bag / on a side. */
  function bodyAt(clientX: number, clientY: number): Placement | null {
    const m = model
    if (!m) return null
    const hit = cast(clientX, clientY, m.parts.body)
    if (!hit?.face) return null
    inv.copy(m.holder.matrixWorld).invert()
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).transformDirection(inv)
    if (Math.abs(n.z) < 0.3) return null
    const lp = hit.point.clone().applyMatrix4(inv)
    return {
      u: (lp.x - m.box.min.x) / (m.box.max.x - m.box.min.x),
      v: (lp.y - m.box.min.y) / (m.box.max.y - m.box.min.y),
      side: n.z > 0 ? 'front' : 'back',
    }
  }
  const highlight = (d: Decal, on: boolean) => {
    const mat = d.mesh.material as THREE.MeshStandardMaterial
    if (mat.emissive) mat.emissive.setScalar(on ? 0.12 : 0)
  }

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
    spin = false
    opts.onInteract?.()
    el.setPointerCapture(e.pointerId)
    const d = decalAt(e.clientX, e.clientY)
    const at = d ? bodyAt(e.clientX, e.clientY) : null
    if (d && at && model) {
      const cur = d.kind === 'mono' ? pending?.mono : pending?.patches[d.index]
      grab = { d, du: (cur?.u ?? at.u) - at.u, dv: (cur?.v ?? at.v) - at.v, at: cur ?? at }
      highlight(d, true)
      opts.onSelect?.(d.kind, d.index)
      el.style.cursor = 'grabbing'
      return
    }
    drag = { x: e.clientX, y: e.clientY, ty: tY, tx: tX }
    el.style.cursor = 'grabbing'
  }
  const onMove = (e: PointerEvent) => {
    if (grab && model) {
      const at = bodyAt(e.clientX, e.clientY)
      if (!at) return
      // Keep the grab offset only while staying on the same panel.
      const sameSide = at.side === grab.at.side
      // Keep most of the decal on the bag.
      const size = grab.d.kind === 'patch' ? pending?.patches[grab.d.index]?.size : undefined
      const ds = decalSize(model, grab.d.kind, size)
      const mu = Math.min(0.45, (ds.w / (model.box.max.x - model.box.min.x)) * 0.4)
      const mv = Math.min(0.45, (ds.h / (model.box.max.y - model.box.min.y)) * 0.4)
      const fit = (x: number, mg: number) => Math.round(Math.min(1 - mg, Math.max(mg, x)) * 1000) / 1000
      const next: Placement = {
        side: at.side,
        u: fit(at.u + (sameSide ? grab.du : 0), Math.max(0.05, mu)),
        v: fit(at.v + (sameSide ? grab.dv : 0), Math.max(0.05, mv)),
      }
      if (sampleDepth(model.maps[next.side], model.box, model.box.min.x + (model.box.max.x - model.box.min.x) * next.u, model.box.min.y + (model.box.max.y - model.box.min.y) * next.v) === null) return
      if (!sameSide) { grab.du = 0; grab.dv = 0 }
      grab.at = next
      placeDecal(model, grab.d, next, size)
      grab.d.geoKey = grab.d.kind === 'mono' ? `${next.side}|${next.u}|${next.v}` : `${next.side}|${next.u}|${next.v}|${size}`
      opts.onPlace?.(grab.d.kind, grab.d.index, next)
      return
    }
    if (!drag) {
      el.style.cursor = decalAt(e.clientX, e.clientY) ? 'move' : 'grab'
      return
    }
    tY = drag.ty + (e.clientX - drag.x) * 0.011
    tX = Math.max(-0.35, Math.min(1.1, drag.tx + (e.clientY - drag.y) * 0.005))
  }
  const onUp = () => {
    if (grab) highlight(grab.d, false)
    const wasOrbit = !!drag
    grab = null
    drag = null
    el.style.cursor = 'grab'
    if (wasOrbit) nearestView()
  }
  // On touch screens a finger on a decal must not scroll the page.
  const onTouch = (e: TouchEvent) => {
    const t = e.touches[0]
    if (t && decalAt(t.clientX, t.clientY)) e.preventDefault()
  }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
  el.addEventListener('touchstart', onTouch, { passive: false })

  // ── Render loop ─────────────────────────────────────────────────────────
  const t0 = performance.now()
  let raf = 0
  let stopped = false
  const loop = (now: number) => {
    if (stopped) return
    if (spin) tY += 0.007
    rotY += (tY - rotY) * 0.09
    rotX += (tX - rotX) * 0.09
    camZ += (camZT - camZ) * 0.1
    camera.position.z = camZ
    camera.lookAt(0, 0.05, 0)
    const tt = now - t0
    // Hold still while a decal is being placed.
    const still = reduce || grab
    root.rotation.set(rotX, rotY, still ? 0 : Math.sin(tt / 2000) * 0.01)
    root.position.y = still ? 0 : Math.sin(tt / 1400) * 0.02
    renderer.render(scene, camera)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  // ── Stills for the 2D configurator ──────────────────────────────────────
  const rimLocal = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)
  const rimPlane = new THREE.Plane()
  /**
   * Meshy shells have thick walls, so the inner wall belongs to the outer
   * mesh: dress the triangles that face the bag's centre in the lining.
   * Top view only (concave bits of the outside would turn too). Returns the
   * undo.
   */
  function liningInside(m: Model) {
    const centre = m.box.getCenter(new THREE.Vector3())
    const undo: (() => void)[] = []
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), d = new THREE.Vector3()
    m.parts.body.forEach((x, k) => {
      const g = x.geometry
      const p = g.attributes.position as THREE.BufferAttribute
      const oldIndex = g.index
      const oldMat = x.material
      const out: number[] = []
      const inn: number[] = []
      for (let t = 0; t < p.count; t += 3) {
        a.fromBufferAttribute(p, t).applyMatrix4(x.matrixWorld)
        b.fromBufferAttribute(p, t + 1).applyMatrix4(x.matrixWorld)
        c.fromBufferAttribute(p, t + 2).applyMatrix4(x.matrixWorld)
        n.subVectors(c, b).cross(d.subVectors(a, b))
        d.copy(a).add(b).add(c).divideScalar(3).sub(centre)
        ;(n.dot(d) >= 0 ? out : inn).push(t, t + 1, t + 2)
      }
      g.setIndex([...out, ...inn])
      g.addGroup(0, out.length, 0)
      g.addGroup(out.length, inn.length, 1)
      const lin = (m.inner[k]!.material as THREE.MeshStandardMaterial).clone()
      lin.side = THREE.FrontSide
      lin.clippingPlanes = [rimPlane]
      x.material = [oldMat as THREE.Material, lin]
      undo.push(() => {
        g.setIndex(oldIndex)
        g.clearGroups()
        x.material = oldMat
        lin.dispose()
      })
    })
    return () => undo.forEach((f) => f())
  }

  /** Clip the bag's body above the rim line (holder space). */
  function trimAtRim(m: Model) {
    rimLocal.constant = m.box.min.y + (m.box.max.y - m.box.min.y) * m.bag.rim
    renderer.localClippingEnabled = true
    const mats = new Set<THREE.Material>()
    for (const x of [...m.parts.body, ...m.parts.bodySide, ...m.parts.stitch, ...m.inner, ...(m.cover ? [m.cover] : [])]) {
      for (const mat of ([] as THREE.Material[]).concat(x.material)) mats.add(mat)
    }
    for (const mat of mats) {
      mat.clippingPlanes = [rimPlane]
      mat.needsUpdate = true
    }
    return () => {
      for (const mat of mats) {
        mat.clippingPlanes = null
        mat.needsUpdate = true
      }
      renderer.localClippingEnabled = false
    }
  }

  /**
   * Part the front and back walls towards the mouth, as a bag held open, so
   * the top view shows the lining. Sides stay put (the push grows with distance
   * from the middle plane). Returns a function that undoes it.
   */
  function openMouth(m: Model) {
    const W = m.box.max.x - m.box.min.x
    const H = m.box.max.y - m.box.min.y
    const cz = (m.box.min.z + m.box.max.z) / 2
    const hd = Math.max(1e-6, (m.box.max.z - m.box.min.z) / 2)
    const y0 = m.box.min.y + H * m.bag.rim * 0.5
    const amount = W * 0.08
    const meshes = [...m.parts.body, ...m.parts.bodySide, ...m.parts.stitch, ...(m.cover ? [m.cover] : [])]
    // gltfpack shares one vertex buffer between parts: only move the vertices
    // these meshes index, and nothing above the rim (strap stitching).
    const targets = new Map<THREE.BufferAttribute, { mesh: THREE.Mesh; verts: Set<number> }>()
    for (const x of meshes) {
      const pa = x.geometry.attributes.position as THREE.BufferAttribute
      const t = targets.get(pa) ?? { mesh: x, verts: new Set<number>() }
      const idx = x.geometry.index
      if (idx) for (let i = 0; i < idx.count; i++) t.verts.add(idx.getX(i))
      else for (let i = 0; i < pa.count; i++) t.verts.add(i)
      targets.set(pa, t)
    }
    const undo: [THREE.BufferAttribute, Float32Array][] = []
    const v = new THREE.Vector3()
    for (const [pa, { mesh, verts }] of targets) {
      undo.push([pa, (pa.array as Float32Array).slice()])
      const toLocal = mesh.matrixWorld.clone().invert()
      for (const i of verts) {
        v.fromBufferAttribute(pa, i).applyMatrix4(mesh.matrixWorld)
        const top = m.box.min.y + H * m.bag.rim
        if (v.y <= y0 || v.y > m.box.max.y + H * 0.02) continue
        const t = Math.min(1, (v.y - y0) / (top - y0))
        v.z += amount * t * t * Math.max(-1, Math.min(1, (v.z - cz) / hd))
        v.applyMatrix4(toLocal)
        pa.setXYZ(i, v.x, v.y, v.z)
      }
      pa.needsUpdate = true
    }
    const bounds = () => meshes.forEach((x) => { x.geometry.computeBoundingBox(); x.geometry.computeBoundingSphere() })
    bounds()
    return () => {
      for (const [pa, arr] of undo) {
        ;(pa.array as Float32Array).set(arr)
        pa.needsUpdate = true
      }
      bounds()
    }
  }

  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 60)
  function still(view: StillView, layer: StillLayer, size: number) {
    const m = model
    if (!m) throw new Error('model not loaded')
    stopped = true
    renderer.setPixelRatio(1)
    renderer.setSize(size, size, false)
    root.rotation.set(0, 0, 0)
    root.updateMatrixWorld(true)
    // Top view: none of the models is modelled open (Stella's mouth is
    // pinched shut, the Meshy shells are closed), so the body is trimmed at
    // the mouth line and the walls parted a little.
    const restore = view === 'top' ? openMouth(m) : null
    const rim = view === 'top' ? trimAtRim(m) : null
    const walls = view === 'top' && m.bag.kind === 'mesh' ? liningInside(m) : null
    // Tilt the bag towards the camera for the top view, to look in.
    root.position.set(0, 0, 0)
    root.rotation.set(view === 'top' ? 1.4 : 0, view === 'back' ? Math.PI : 0, 0)
    root.updateMatrixWorld(true)
    if (rim) rimPlane.copy(rimLocal).applyMatrix4(m.holder.matrixWorld)
    const P = m.parts
    const accent = [...P.strap, ...P.strapSide, ...P.tab, ...P.tabSide]
    for (const d of [m.mono, ...m.patches]) d.mesh.visible = false
    // The tab would hang in mid-air once the mouth is open.
    for (const x of P.tab.concat(P.tabSide)) x.visible = view !== 'top'
    // Frame on the body, square; Stella's long strap runs out of the top.
    const bb = new THREE.Box3()
    P.body.forEach((x) => bb.expandByObject(x))
    const c = bb.getCenter(new THREE.Vector3())
    const sz = bb.getSize(new THREE.Vector3())
    const parts = m.bag.kind === 'parts'
    const half = (Math.max(sz.x, sz.y) / 2) * (parts ? 1.4 : 1.12)
    if (parts) c.y += half * 0.22
    ortho.left = -half
    ortho.right = half
    ortho.top = half
    ortho.bottom = -half
    ortho.position.set(c.x, c.y, c.z + 20)
    ortho.lookAt(c.x, c.y, c.z)
    ortho.updateProjectionMatrix()
    // Layer: what is drawn; the rest of the bag only writes depth.
    const draws = (x: THREE.Mesh) => {
      if (layer === 'all') return true
      if (layer === 'hw') return P.ring.includes(x)
      if (layer === 'accent') return accent.includes(x) || P.stitch.includes(x)
      return !accent.includes(x) && !P.ring.includes(x)
    }
    // Materials are shared between meshes: save each once.
    const saved = new Map<THREE.Material, boolean>()
    m.holder.traverse((o) => {
      const x = o as THREE.Mesh
      if (!x.isMesh || !x.visible) return
      for (const mat of ([] as THREE.Material[]).concat(x.material)) {
        if (!saved.has(mat)) saved.set(mat, mat.colorWrite)
        if (!draws(x)) mat.colorWrite = false
      }
    })
    renderer.setClearColor(0x000000, 0)
    renderer.render(scene, ortho)
    const url = renderer.domElement.toDataURL('image/png')
    for (const [mat, cw] of saved) mat.colorWrite = cw
    restore?.()
    rim?.()
    walls?.()
    // Where the body box lands (u, v → image fractions).
    const z = view === 'back' ? m.box.min.z : m.box.max.z
    const at = (x: number, y: number) => {
      const p = new THREE.Vector3(x, y, z).applyMatrix4(m.holder.matrixWorld).project(ortho)
      return { x: (p.x + 1) / 2, y: (1 - p.y) / 2 }
    }
    const cy = (m.box.min.y + m.box.max.y) / 2
    const cx = (m.box.min.x + m.box.max.x) / 2
    const frame: Frame = {
      x0: at(m.box.min.x, cy).x,
      x1: at(m.box.max.x, cy).x,
      y0: at(cx, m.box.min.y).y,
      y1: at(cx, m.box.max.y).y,
      w: m.box.max.x - m.box.min.x,
    }
    return { url, frame }
  }

  return {
    loaded: () => loading,
    still,
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
      el.removeEventListener('touchstart', onTouch)
      disposeObject(scene)
      envMap.dispose()
      pmrem.dispose()
      renderer.dispose()
      el.remove()
    },
  }
}
