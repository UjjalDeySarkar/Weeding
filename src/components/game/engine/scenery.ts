import {
  BackSide,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type PerspectiveCamera,
} from 'three'
import { instances, ownMaterials, spawn, type Model, type ModelId, type Models } from './assets'
import type { Course } from './course'

// ─── Sky, sun and fog ────────────────────────────────────────────────────────

export interface Look {
  top: string
  horizon: string
  ground: string
  sun: string
  sunIntensity: number
  /** Direction towards the sun */
  sunFrom: [number, number, number]
  ambient: number
}

export const DAY: Look = { top: '#4f93d8', horizon: '#d4e8f2', ground: '#7f9a5c', sun: '#fff4dc', sunIntensity: 2.6, sunFrom: [0.4, 0.9, 0.3], ambient: 1.5 }
export const GOLDEN: Look = { top: '#6a7fb8', horizon: '#f7c08a', ground: '#7a6a48', sun: '#ffbf7a', sunIntensity: 2.2, sunFrom: [-0.8, 0.35, 0.2], ambient: 1.25 }
export const EVENING: Look = { top: '#1c2350', horizon: '#c9787a', ground: '#3a3040', sun: '#ff9a6a', sunIntensity: 0.9, sunFrom: [-0.9, 0.12, 0.1], ambient: 0.8 }

const SKY_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`
const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 top;
  uniform vec3 horizon;
  uniform vec3 ground;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 c = h > 0.0 ? mix(horizon, top, pow(min(h * 1.6, 1.0), 0.7)) : mix(horizon, ground, min(-h * 6.0, 1.0));
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`

export class Environment {
  readonly fog = new Fog('#ffffff', 150, 900)
  private readonly sky: Mesh<SphereGeometry, ShaderMaterial>
  private readonly hemi = new HemisphereLight('#ffffff', '#666644', 1)
  private readonly sun = new DirectionalLight('#ffffff', 2)
  private readonly sunFrom = new Vector3()
  private readonly a = new Color()
  private readonly b = new Color()

  constructor(scene: Scene) {
    this.sky = new Mesh(
      new SphereGeometry(1, 24, 12),
      new ShaderMaterial({
        uniforms: { top: { value: new Color() }, horizon: { value: new Color() }, ground: { value: new Color() } },
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: BackSide,
        depthWrite: false,
        fog: false,
      }),
    )
    this.sky.renderOrder = -1
    this.sky.frustumCulled = false
    scene.fog = this.fog
    scene.add(this.sky, this.hemi, this.sun, this.sun.target)
    this.set(DAY)
  }

  /** Blends two looks: `t` = 0 is `from`, 1 is `to` */
  set(from: Look, to: Look = from, t = 0) {
    const mix = (key: 'top' | 'horizon' | 'ground' | 'sun', target: Color) => target.copy(this.a.set(from[key]).lerp(this.b.set(to[key]), t))
    const u = this.sky.material.uniforms
    mix('top', u.top.value)
    mix('horizon', u.horizon.value)
    mix('ground', u.ground.value)
    this.fog.color.copy(u.horizon.value)
    mix('sun', this.sun.color)
    this.sun.intensity = from.sunIntensity + (to.sunIntensity - from.sunIntensity) * t
    this.hemi.color.copy(u.top.value).lerp(new Color('#ffffff'), 0.55)
    this.hemi.groundColor.copy(u.ground.value)
    this.hemi.intensity = from.ambient + (to.ambient - from.ambient) * t
    this.sunFrom.set(...from.sunFrom).lerp(new Vector3(...to.sunFrom), t).normalize()
  }

  setFog(near: number, far: number) {
    this.fog.near = near
    this.fog.far = far
  }

  /** Keeps the sky around the camera and the sunlight on the action */
  follow(camera: PerspectiveCamera, focus: Vector3) {
    this.sky.position.copy(camera.position)
    this.sky.scale.setScalar(camera.far * 0.9)
    this.sun.target.position.copy(focus)
    this.sun.position.copy(focus).addScaledVector(this.sunFrom, 100)
  }

  dispose() {
    this.sky.geometry.dispose()
    this.sky.material.dispose()
    this.sky.removeFromParent()
    this.hemi.removeFromParent()
    this.sun.removeFromParent()
    this.sun.target.removeFromParent()
  }
}

// ─── Painted textures ────────────────────────────────────────────────────────

function canvas(width: number, height: number) {
  const el = document.createElement('canvas')
  el.width = width
  el.height = height
  return [el, el.getContext('2d')!] as const
}

function texture(el: HTMLCanvasElement, repeat = true) {
  const tex = new CanvasTexture(el)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  if (repeat) tex.wrapS = tex.wrapT = RepeatWrapping
  return tex
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, colors: string[], count: number, size: number, seed = 7) {
  let s = seed
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(r() * w, r() * h, size * (0.5 + r()), size * (0.5 + r()))
  }
}

/** Asphalt with edge lines and a dashed centre line; `lanes` 4 adds lane dashes and a double centre line */
export function roadTexture(lanes: 2 | 4 = 2) {
  const [el, ctx] = canvas(256, 512)
  ctx.fillStyle = '#5a5a5e'
  ctx.fillRect(0, 0, 256, 512)
  speckle(ctx, 256, 512, ['#545458', '#636367', '#4d4d51'], 900, 3)
  ctx.fillStyle = '#e8e4d8'
  ctx.fillRect(8, 0, 6, 512)
  ctx.fillRect(242, 0, 6, 512)
  if (lanes === 4) {
    ctx.fillStyle = '#e9b93a'
    ctx.fillRect(122, 0, 4, 512)
    ctx.fillRect(130, 0, 4, 512)
    ctx.fillStyle = '#e8e4d8'
    for (const x of [66, 190]) for (let y = 0; y < 512; y += 128) ctx.fillRect(x - 2, y, 4, 64)
  } else {
    ctx.fillStyle = '#e8e4d8'
    for (let y = 0; y < 512; y += 128) ctx.fillRect(125, y, 6, 70)
  }
  return texture(el)
}

/** Ballast with sleepers, for under the rails */
export function ballastTexture() {
  const [el, ctx] = canvas(128, 128)
  ctx.fillStyle = '#857a6c'
  ctx.fillRect(0, 0, 128, 128)
  speckle(ctx, 128, 128, ['#6f675c', '#9a8f80', '#77695a'], 600, 3)
  ctx.fillStyle = '#5b4330'
  for (let y = 0; y < 128; y += 32) ctx.fillRect(10, y + 4, 108, 14)
  return texture(el)
}

/** Patchwork paddy fields and grass */
export function fieldsTexture(tint: 'fields' | 'town' | 'tea' = 'fields') {
  const [el, ctx] = canvas(512, 512)
  const palettes = {
    fields: ['#7ea04a', '#8fb257', '#a7b85a', '#6f9445', '#b9b46a', '#86a650'],
    town: ['#8b9a62', '#94956a', '#7f8d5a', '#a19a72', '#8a9466'],
    tea: ['#4f7d3a', '#5a8a40', '#4a7436', '#5f8f44'],
  }
  const colors = palettes[tint]
  ctx.fillStyle = colors[0]
  ctx.fillRect(0, 0, 512, 512)
  let s = 3
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  for (let y = 0; y < 512; y += 64) {
    for (let x = 0; x < 512; ) {
      const w = 48 + Math.floor(r() * 80)
      ctx.fillStyle = colors[Math.floor(r() * colors.length)]
      ctx.fillRect(x, y, w - 2, 62)
      x += w
    }
  }
  speckle(ctx, 512, 512, ['#00000014', '#ffffff10'], 2500, 4)
  return texture(el)
}

/** Soft dark blot to sit under vehicles and people */
let blobMap: CanvasTexture | null = null
export function blobShadow(width: number, length: number) {
  if (!blobMap) {
    const [el, ctx] = canvas(64, 64)
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 32)
    g.addColorStop(0, 'rgba(0,0,0,0.55)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    blobMap = texture(el, false)
  }
  const mesh = new Mesh(new PlaneGeometry(width, length), new MeshBasicMaterial({ map: blobMap, transparent: true, depthWrite: false }))
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.06
  mesh.renderOrder = 1
  return mesh
}

// ─── Signs ───────────────────────────────────────────────────────────────────

export interface Line {
  text: string
  /** Bengali display, Bengali, or Latin */
  font: 'galada' | 'bangla' | 'latin'
  /** Share of the board's height */
  size: number
}

const FONTS = { galada: "'Galada', 'Tiro Bangla', serif", bangla: "'Tiro Bangla', serif", latin: "500 {px} 'Jost', sans-serif" }

/** Waits for the site's fonts so signs don't paint in a fallback face */
export async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load("48px 'Galada'", 'শুভ বিবাহ'),
      document.fonts.load("48px 'Tiro Bangla'", 'শিলিগুড়ি'),
      document.fonts.load("500 48px 'Jost'", 'Siliguri'),
    ])
  } catch {
    // Signs fall back to system fonts
  }
}

function fontFor(line: Line, px: number) {
  return line.font === 'latin' ? FONTS.latin.replace('{px}', `${px}px`) : `${px}px ${FONTS[line.font]}`
}

export function signTexture(lines: Line[], { width = 1024, height = 256, bg = '#e9b93a', fg = '#1d1a16', border = '' } = {}) {
  const [el, ctx] = canvas(width, height)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)
  if (border) {
    ctx.strokeStyle = border
    ctx.lineWidth = height * 0.05
    ctx.strokeRect(height * 0.05, height * 0.05, width - height * 0.1, height - height * 0.1)
  }
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const total = lines.reduce((sum, l) => sum + l.size, 0)
  let y = (height * (1 - total)) / 2
  for (const line of lines) {
    let px = Math.round(height * line.size * 0.78)
    ctx.font = fontFor(line, px)
    const fits = (width * 0.9) / ctx.measureText(line.text).width
    if (fits < 1) {
      px = Math.floor(px * fits)
      ctx.font = fontFor(line, px)
    }
    ctx.fillText(line.text, width / 2, y + (height * line.size) / 2)
    y += height * line.size
  }
  return texture(el, false)
}

/** A board on posts, facing +Z, its bottom edge `raise` metres up */
export function board(lines: Line[], { w = 6, h = 1.5, raise = 1.6, bg = '#e9b93a', fg = '#1d1a16', border = '', posts = 2, postColor = '#3d3a36' } = {}) {
  const group = new Group()
  const map = signTexture(lines, { width: 1024, height: Math.round((1024 * h) / w), bg, fg, border })
  const face = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ map, side: DoubleSide }))
  face.position.y = raise + h / 2
  group.add(face)
  const post = new MeshLambertMaterial({ color: postColor })
  for (let i = 0; i < posts; i++) {
    const pole = new Mesh(new CylinderGeometry(0.08, 0.08, raise + h, 6), post)
    pole.position.set(posts === 1 ? 0 : (i / (posts - 1) - 0.5) * (w - 0.6), (raise + h) / 2, -0.06)
    group.add(pole)
  }
  return group
}

// ─── Props along a course ────────────────────────────────────────────────────

export interface Prop {
  model: ModelId
  x: number
  z: number
  heading?: number
  scale?: number
}

const m4 = new Matrix4()
const q = new Quaternion()
const up = new Vector3(0, 1, 0)

/** Adds many props as instanced meshes, in patches so far-off patches are culled */
export function addProps(parent: Object3D, models: Models, props: Prop[], patch = 260) {
  const buckets = new Map<string, { model: ModelId; transforms: Matrix4[] }>()
  for (const p of props) {
    const key = `${p.model}|${Math.floor(p.x / patch)}|${Math.floor(p.z / patch)}`
    let bucket = buckets.get(key)
    if (!bucket) buckets.set(key, (bucket = { model: p.model, transforms: [] }))
    const s = p.scale ?? 1
    bucket.transforms.push(m4.clone().compose(new Vector3(p.x, 0, p.z), q.clone().setFromAxisAngle(up, p.heading ?? 0), new Vector3(s, s, s)))
  }
  for (const { model, transforms } of buckets.values()) {
    const loaded = models.get(model)
    if (loaded) parent.add(instances(loaded, transforms))
  }
}

export interface Scatter {
  /** Models to pick from (repeat one to make it likelier) */
  models: ModelId[]
  /** Average spacing along the course, metres */
  every: number
  /** Offsets from the centreline, metres (either side) */
  near: number
  far: number
  from?: number
  to?: number
  scale?: [number, number]
  /** Turn to face the road (buildings) instead of a random way */
  faceRoad?: boolean
  /** Only on one side: −1 left, 1 right */
  side?: -1 | 1
}

/** Props scattered beside a course, kept clear of the road everywhere it winds */
export function scatter(course: Course, rand: () => number, spec: Scatter): Prop[] {
  const { models, every, near, far, from = 0, to = course.length, scale = [0.85, 1.2], faceRoad = false, side } = spec
  const props: Prop[] = []
  for (let s = from + rand() * every; s < to; s += every * (0.6 + rand() * 0.8)) {
    const dir = side ?? (rand() < 0.5 ? -1 : 1)
    const offset = dir * (near + rand() * (far - near))
    const p = course.side(s, offset)
    if (course.project(p.x, p.z).distance < near - 0.5) continue
    props.push({
      model: models[Math.floor(rand() * models.length)],
      x: p.x,
      z: p.z,
      heading: faceRoad ? p.heading + (dir < 0 ? Math.PI / 2 : -Math.PI / 2) : rand() * Math.PI * 2,
      scale: scale[0] + rand() * (scale[1] - scale[0]),
    })
  }
  return props
}

/** Flat ponds and puddles */
export function pond(radius: number, color = '#5f8fa8') {
  const mesh = new Mesh(new CircleGeometry(radius, 20), new MeshLambertMaterial({ color }))
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.04
  return mesh
}

// ─── Rosogollas to collect ───────────────────────────────────────────────────

export interface Spot {
  x: number
  y: number
  z: number
}

const dummy = new Object3D()

/** Rosogollas in little terracotta bowls, bobbing until collected */
export class Rosogollas {
  readonly group = new Group()
  private readonly balls: InstancedMesh
  private readonly bowls: InstancedMesh
  private readonly items: (Spot & { taken: number })[]
  private readonly scale: number

  constructor(spots: Spot[], scale = 1) {
    this.scale = scale
    this.items = spots.map((s) => ({ ...s, taken: -1 }))
    const n = Math.max(1, spots.length)
    this.balls = new InstancedMesh(new SphereGeometry(0.42, 14, 10), new MeshPhongMaterial({ color: '#fffaf0', shininess: 90, specular: '#ffffff', emissive: '#4a4030' }), n)
    this.bowls = new InstancedMesh(new CylinderGeometry(0.55, 0.34, 0.36, 14), new MeshLambertMaterial({ color: '#b5563a' }), n)
    this.balls.count = this.bowls.count = spots.length
    this.group.add(this.balls, this.bowls)
  }

  get total() {
    return this.items.length
  }

  /** Animates them and returns how many the player at (px, py, pz) picked up this frame */
  update(time: number, px: number, py: number, pz: number, radius: number) {
    let got = 0
    const r2 = (radius + 0.6 * this.scale) ** 2
    this.items.forEach((item, i) => {
      let k = this.scale
      let lift = Math.sin(time * 3 + i) * 0.18 * this.scale
      if (item.taken < 0) {
        if ((item.x - px) ** 2 + (item.y - py) ** 2 + (item.z - pz) ** 2 < r2) {
          item.taken = time
          got++
        }
      } else {
        // Collected: shrinks away upwards
        const t = (time - item.taken) / 0.35
        k = t >= 1 ? 0 : this.scale * (1 - t)
        lift += t * 1.5 * this.scale
      }
      dummy.position.set(item.x, item.y + lift + 0.5 * this.scale, item.z)
      dummy.rotation.set(0, time * 1.5 + i, 0)
      dummy.scale.setScalar(k)
      dummy.updateMatrix()
      this.bowls.setMatrixAt(i, dummy.matrix)
      dummy.position.y += 0.32 * k
      dummy.updateMatrix()
      this.balls.setMatrixAt(i, dummy.matrix)
    })
    this.balls.instanceMatrix.needsUpdate = true
    this.bowls.instanceMatrix.needsUpdate = true
    // Instances move, so cull by hand: the whole set stays drawn
    this.balls.frustumCulled = this.bowls.frustumCulled = false
    return got
  }
}

// ─── Ground and mountains ────────────────────────────────────────────────────

function bounds(course: Course) {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (let s = 0; s <= course.length; s += 20) {
    const p = course.at(s)
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minZ = Math.min(minZ, p.z)
    maxZ = Math.max(maxZ, p.z)
  }
  return { minX, maxX, minZ, maxZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, size: Math.max(maxX - minX, maxZ - minZ) }
}

/** The ground under a course, painted as fields, town or tea garden */
/** `tile` is how many metres one copy of the field pattern covers */
export function groundFor(course: Course, tint: 'fields' | 'town' | 'tea', margin = 2400, tile = 90) {
  const b = bounds(course)
  const size = b.size + margin
  const map = fieldsTexture(tint)
  map.repeat.set(size / tile, size / tile)
  const mesh = new Mesh(new PlaneGeometry(size, size), new MeshLambertMaterial({ map }))
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(b.cx, 0, b.cz)
  return mesh
}

/** Snow peaks far to the north (−z) beyond the course. `haze` fades them into the horizon: 1 hides them. */
export function himalaya(model: Model | undefined, course: Course, distance = 6000) {
  const group = new Group()
  const tints: { material: MeshLambertMaterial; base: Color }[] = []
  if (model) {
    // One copy with its own materials; the other peaks share them
    const first = spawn(model)
    ownMaterials(first)
    first.traverse((node) => {
      if (!(node instanceof Mesh)) return
      for (const material of [node.material].flat() as MeshLambertMaterial[]) {
        material.fog = false
        tints.push({ material, base: material.color.clone() })
      }
    })
    const b = bounds(course)
    for (let i = 0; i < 5; i++) {
      const peak = i ? first.clone() : first
      peak.position.set(b.cx + (i - 2) * 1500 + (i % 2) * 400, 0, b.minZ - distance - (i % 2) * 700)
      peak.scale.setScalar(0.45 + ((i * 2) % 5) * 0.08)
      peak.rotation.y = i * 1.3
      group.add(peak)
    }
  }
  return {
    group,
    /** Mixes the peaks towards the horizon colour: 0 crisp, 1 gone */
    haze(amount: number, horizon: Color) {
      for (const { material, base } of tints) {
        material.color.copy(base).multiplyScalar(1 - amount)
        material.emissive.copy(horizon).multiplyScalar(amount)
      }
    },
  }
}
