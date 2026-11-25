import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  PointsMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  type Material,
} from 'three'
import type { L } from '@/config/types'
import { wedding } from '@/config/wedding'
import { coupleNames } from '@/lib/utils'
import type { Course } from './course'
import { board, type Line } from './scenery'

/**
 * Set pieces in their own frame: the road or track runs along +Z through the origin, right is −X.
 * Long pieces that must follow a curve (platforms, sheds) are built against the course instead.
 */

const lambert = (color: string) => new MeshLambertMaterial({ color })

function box(w: number, h: number, d: number, material: Material, x = 0, y = h / 2, z = 0) {
  const mesh = new Mesh(new BoxGeometry(w, h, d), material)
  mesh.position.set(x, y, z)
  return mesh
}

/** Bilingual lines for a sign: Bengali over English */
export const bilingual = (name: L, { upper = true, display = false } = {}): Line[] => [
  { text: name.bn, font: display ? 'galada' : 'bangla', size: 0.46 },
  { text: upper ? name.en.toUpperCase() : name.en, font: 'latin', size: 0.32 },
]

/** A raised strip that follows the course between two offsets: platforms, kerbs, verges */
export function strip(course: Course, left: number, right: number, from: number, to: number, height: number, material: Material) {
  const n = Math.max(2, Math.ceil((to - from) / 3) + 1)
  const position: number[] = []
  const index: number[] = []
  const corners = [
    [left, 0],
    [left, height],
    [right, height],
    [right, 0],
  ]
  for (let i = 0; i < n; i++) {
    const s = from + ((to - from) * i) / (n - 1)
    for (const [offset, y] of corners) {
      const p = course.side(s, offset)
      position.push(p.x, y, p.z)
    }
    if (i) {
      const a = (i - 1) * 4
      const b = i * 4
      // left wall, top, right wall
      for (const [c, d] of [
        [0, 1],
        [1, 2],
        [2, 3],
      ]) {
        index.push(a + c, b + c, a + d, a + d, b + c, b + d)
      }
    }
  }
  // End caps
  const last = (n - 1) * 4
  index.push(0, 1, 2, 0, 2, 3, last, last + 2, last + 1, last, last + 3, last + 2)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  const mesh = new Mesh(geometry, material)
  ;(mesh.material as MeshLambertMaterial).side = DoubleSide
  return mesh
}

// ─── Bagdogra ────────────────────────────────────────────────────────────────

function runwayTexture() {
  const el = document.createElement('canvas')
  el.width = 256
  el.height = 1024
  const ctx = el.getContext('2d')!
  ctx.fillStyle = '#4b4c50'
  ctx.fillRect(0, 0, 256, 1024)
  ctx.fillStyle = '#efefe8'
  ctx.fillRect(6, 0, 4, 1024)
  ctx.fillRect(246, 0, 4, 1024)
  for (let y = 120; y < 1024; y += 60) ctx.fillRect(125, y, 6, 34)
  // Threshold piano keys at the near end
  for (let x = 20; x < 236; x += 22) if (x < 108 || x > 140) ctx.fillRect(x, 8, 12, 80)
  const tex = new CanvasTexture(el)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Runway starting at the origin and running along +Z */
export function runway(length = 1300, width = 46) {
  const mesh = new Mesh(new PlaneGeometry(width, length), new MeshLambertMaterial({ map: runwayTexture() }))
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(0, 0.05, length / 2)
  return mesh
}

/** Concrete where planes park, flat on the ground and centred on the origin */
export function apron(width: number, length: number) {
  const mesh = new Mesh(new PlaneGeometry(width, length), lambert('#8d8a84'))
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

/** Terminal building facing +Z with the airport's name on top, plus a control tower */
export function terminal(name: L) {
  const group = new Group()
  const wall = lambert('#ece3d0')
  const glass = lambert('#5d86a8')
  group.add(box(90, 13, 26, wall), box(84, 5, 26.4, glass, 0, 7), box(94, 1.4, 30, lambert('#a51c1c'), 0, 13.7))
  const sign = board(bilingual(name), { w: 34, h: 6.5, raise: 14.5, bg: '#fbf5ea', fg: '#6d0e13', border: '#c39035', posts: 0 })
  sign.position.z = 12
  group.add(sign)
  const tower = new Group()
  tower.add(new Mesh(new CylinderGeometry(2.2, 2.8, 30, 10), wall), box(9, 4, 9, glass, 0, 32), box(10, 1, 10, lambert('#3d3a36'), 0, 34.5))
  tower.children[0].position.y = 15
  tower.position.set(70, 0, -10)
  group.add(tower)
  return group
}

// ─── Railway stations ────────────────────────────────────────────────────────

/** Indian Railways' yellow name board, two posts, black letters */
export function stationBoard(name: L) {
  return board(bilingual(name), { w: 7, h: 2.2, raise: 1.4, bg: '#f2c230', fg: '#111111', border: '#111111' })
}

/** A platform beside the track from `from` to `to`, on the left, with a roof over the middle and name boards */
export function station(course: Course, name: L, from: number, to: number, { big = false } = {}) {
  const group = new Group()
  const edge = 2.4
  const width = big ? 11 : 8
  group.add(strip(course, -edge - width, -edge, from, to, 1.05, lambert('#bdb5a6')))
  // Yellow safety line along the edge
  group.add(strip(course, -edge - 0.7, -edge - 0.4, from, to, 1.07, lambert('#e9b93a')))
  const mid = (from + to) / 2
  const roofFrom = mid - (to - from) * 0.3
  const roofTo = mid + (to - from) * 0.3
  const roof = strip(course, -edge - width + 0.5, -edge - 1, roofFrom, roofTo, 0.4, lambert('#7a2e22'))
  roof.position.y = 6
  group.add(roof)
  const pillar = lambert('#d8d0c0')
  for (let s = roofFrom + 4; s < roofTo; s += 14) {
    const p = course.side(s, -edge - width / 2)
    const column = box(0.4, 5, 0.4, pillar, p.x, 3.55, p.z)
    group.add(column)
  }
  for (const s of [from + 12, to - 12]) {
    const p = course.side(s, -edge - width / 2)
    const sign = stationBoard(name)
    sign.position.set(p.x, 1.05, p.z)
    sign.rotation.y = p.heading - Math.PI / 2
    group.add(sign)
  }
  if (big) {
    const p = course.side(mid, -edge - width - 16)
    const building = stationBuilding(name)
    building.position.set(p.x, 0, p.z)
    building.rotation.y = p.heading - Math.PI / 2
    group.add(building)
  }
  return group
}

/** A station building facing +Z with its yellow name board on top */
export function stationBuilding(name: L) {
  const building = new Group()
  building.add(box(60, 11, 20, lambert('#d9a066')), box(62, 1.2, 22, lambert('#8a3b24'), 0, 11.6))
  for (let x = -24; x <= 24; x += 8) building.add(box(3, 5, 0.3, lambert('#5d3a24'), x, 2.5, 10.1))
  const sign = board(bilingual(name), { w: 30, h: 5, raise: 12.4, bg: '#f2c230', fg: '#111111', border: '#111111', posts: 0 })
  sign.position.z = 10.2
  building.add(sign)
  return building
}

/** A bus shed facing +Z with the terminus's name over it */
export function busShed(name: L) {
  const group = new Group()
  const post = lambert('#c9c2b4')
  group.add(box(40, 0.4, 14, lambert('#2f6b4f'), 0, 6.7))
  for (const x of [-18, -6, 6, 18]) for (const z of [-6, 6]) group.add(box(0.45, 6.5, 0.45, post, x, 3.25, z))
  const sign = board(bilingual(name), { w: 22, h: 3.6, raise: 6.9, bg: '#fbf5ea', fg: '#2f6b4f', border: '#2f6b4f', posts: 0 })
  sign.position.z = 7.2
  group.add(sign)
  return group
}

/** A stop board on a post: where the engine should stop */
export function stopBoard() {
  return board([{ text: 'STOP', font: 'latin', size: 0.6 }], { w: 1.2, h: 1.2, raise: 2.2, bg: '#f4f1e8', fg: '#a51c1c', border: '#a51c1c', posts: 1 })
}

// ─── Bus terminus ────────────────────────────────────────────────────────────

/**
 * Paved apron at the course end, a waiting hall on the left beside the bays, and the terminus's name
 * at the entrance. Buses park at offset `BAY_OFFSET`.
 */
export function busTerminus(course: Course, name: L) {
  const group = new Group()
  const end = course.length
  group.add(strip(course, -27, 9, end - 130, end + 45, 0.06, lambert('#8a857c')))
  const roof = strip(course, -26, -14, end - 80, end + 20, 0.35, lambert('#2f6b4f'))
  roof.position.y = 4.6
  group.add(roof)
  const post = lambert('#c9c2b4')
  for (let s = end - 76; s <= end + 16; s += 12) {
    for (const offset of [-25, -15]) {
      const p = course.side(s, offset)
      group.add(box(0.4, 4.6, 0.4, post, p.x, 2.3, p.z))
    }
  }
  const p = course.side(end - 112, -14)
  const sign = board(bilingual(name), { w: 20, h: 3.6, raise: 3, bg: '#fbf5ea', fg: '#2f6b4f', border: '#2f6b4f' })
  sign.position.set(p.x, 0, p.z)
  sign.rotation.y = p.heading + Math.PI
  group.add(sign)
  return group
}

export const BAY_OFFSET = -7.5

/** A glowing rectangle on the ground: park here */
export function bay(width: number, length: number, color = '#e9b93a') {
  const mesh = new Mesh(new PlaneGeometry(width, length), new MeshBasicMaterial({ color, transparent: true, opacity: 0.45, depthWrite: false }))
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.12
  return mesh
}

// ─── The biye-bari ───────────────────────────────────────────────────────────

const leafShape = (() => {
  const shape = new Shape()
  shape.moveTo(0, 0)
  shape.quadraticCurveTo(0.42, 0.9, 0.08, 2.6)
  shape.lineTo(-0.08, 2.6)
  shape.quadraticCurveTo(-0.42, 0.9, 0, 0)
  return shape
})()

/** Kolagach: the banana plants that stand at a Bengali wedding gate */
export function bananaPlant(seed = 0) {
  const group = new Group()
  const trunk = new Mesh(new CylinderGeometry(0.16, 0.24, 2.4, 8), lambert('#7d8f45'))
  trunk.position.y = 1.2
  group.add(trunk)
  const leaf = new MeshLambertMaterial({ color: '#4f8a2e', side: DoubleSide })
  const geometry = new ShapeGeometry(leafShape)
  for (let i = 0; i < 7; i++) {
    const holder = new Object3D()
    holder.position.y = 2.2
    holder.rotation.y = (i / 7) * Math.PI * 2 + seed
    const mesh = new Mesh(geometry, leaf)
    mesh.rotation.x = 0.55 + (i % 3) * 0.2
    holder.add(mesh)
    group.add(holder)
  }
  return group
}

/** Beads hanging in a curve between two points, as one instanced mesh */
function beads(points: [number, number, number][], radius: number, colors: string[], material: Material) {
  const mesh = new InstancedMesh(new SphereGeometry(radius, 8, 6), material, points.length)
  const dummy = new Object3D()
  const color = new Color()
  points.forEach(([x, y, z], i) => {
    dummy.position.set(x, y, z)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    mesh.setColorAt(i, color.set(colors[i % colors.length]))
  })
  return mesh
}

/** Points along a sagging line from a to b */
function sag(a: [number, number, number], b: [number, number, number], drop: number, count: number) {
  return Array.from({ length: count }, (_, i): [number, number, number] => {
    const t = i / (count - 1)
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * drop, a[2] + (b[2] - a[2]) * t]
  })
}

function stripes() {
  const el = document.createElement('canvas')
  el.width = 64
  el.height = 8
  const ctx = el.getContext('2d')!
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#fbf5ea' : '#a51c1c'
    ctx.fillRect(i * 8, 0, 8, 8)
  }
  const tex = new CanvasTexture(el)
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = RepeatWrapping
  tex.repeat.x = 3
  return tex
}

export interface Venue {
  group: Group
  /** Twinkles the lights and lets petals fall once `celebrate` is on */
  update(time: number, dt: number): void
  celebrate: boolean
}

/**
 * Baghajatin Sporting Club dressed for the wedding: a gate across the road at the origin (guests arrive
 * from −Z) with a banner,
 * marigold garlands, banana plants and fairy lights, the club behind it draped in cascades of lights,
 * and a striped shamiana beside it.
 */
export function venue(): Venue {
  const group = new Group()
  const span = 11
  const pillar = lambert('#fbf5ea')
  const red = lambert('#a51c1c')
  for (const x of [-span / 2, span / 2]) {
    group.add(box(1.1, 6.5, 1.1, pillar, x, 3.25), box(1.3, 0.5, 1.3, red, x, 6.7))
    const plant = bananaPlant(x)
    plant.position.set(x * 1.25, 0, -1.4)
    group.add(plant)
  }
  group.add(box(span + 1.6, 1.6, 0.8, red, 0, 7.4))
  const { name } = wedding.venue
  const banner = board(
    [
      { text: `শুভ বিবাহ · ${coupleNames('bn')}`, font: 'galada', size: 0.5 },
      { text: coupleNames('en').toUpperCase(), font: 'latin', size: 0.34 },
    ],
    { w: span - 0.4, h: 1.9, raise: 5.2, bg: '#a51c1c', fg: '#ebcb85', border: '#c39035', posts: 0 },
  )
  // Guests arrive from −Z, so the gate's dressed side faces that way
  banner.position.z = -0.45
  banner.rotation.y = Math.PI
  group.add(banner)

  // Marigolds: orange and yellow, swagged across the top and down the pillars
  const marigold = new MeshLambertMaterial({ color: '#ffffff' })
  // Along the top of the beam, and swagged below the banner so the names stay readable
  const flowers: [number, number, number][] = [
    ...sag([-span / 2 - 0.8, 8.3, -0.5], [span / 2 + 0.8, 8.3, -0.5], 0, 44),
    ...sag([-span / 2, 5.1, -0.7], [0, 5.1, -0.7], 0.7, 20),
    ...sag([0, 5.1, -0.7], [span / 2, 5.1, -0.7], 0.7, 20),
  ]
  for (const x of [-span / 2, span / 2]) for (let y = 0.4; y < 6.4; y += 0.32) flowers.push([x + (x < 0 ? 0.6 : -0.6), y, -0.6])
  group.add(beads(flowers, 0.16, ['#f0a030', '#e9b93a', '#d9731a'], marigold))

  // The club behind the gate
  const club = new Group()
  club.add(box(34, 8, 14, lambert('#efe4cc')), box(34.4, 1, 14.4, lambert('#6d0e13'), 0, 8.4))
  const sign = board(bilingual(name, { upper: false }), { w: 20, h: 3.2, raise: 8.9, bg: '#fbf5ea', fg: '#6d0e13', border: '#c39035', posts: 0 })
  sign.position.z = 7.3
  club.add(sign)
  for (const x of [-10, 10]) club.add(box(3, 5, 0.3, lambert('#5d3a24'), x, 2.5, 7.1))
  club.position.z = 34
  club.rotation.y = Math.PI
  group.add(club)

  // Fairy lights: strings over the gate and cascades down the club's front
  const bulbs: [number, number, number][] = [...sag([-span / 2, 8.9, 0], [span / 2, 8.9, 0], 0.8, 40)]
  for (let x = -16.5; x <= 16.5; x += 1.1) for (let y = 8.6; y > 1.5; y -= 0.55) bulbs.push([x, y, 26.7])
  for (const side of [-1, 1]) bulbs.push(...sag([(side * span) / 2, 8.8, 0], [side * 15, 8.6, 26.7], 1.6, 40))
  const lights = beads(bulbs, 0.07, ['#fff3c4', '#ffd27a', '#ffffff', '#ffb35c'], new MeshBasicMaterial({ color: '#ffffff' }))
  group.add(lights)

  // Shamiana
  const tent = new Group()
  const canopy = new Mesh(new CylinderGeometry(0.4, 10, 3.2, 4, 1, true), new MeshLambertMaterial({ map: stripes(), side: DoubleSide }))
  canopy.position.y = 6.2
  canopy.rotation.y = Math.PI / 4
  tent.add(canopy)
  for (const [x, z] of [
    [-6.5, -6.5],
    [6.5, -6.5],
    [-6.5, 6.5],
    [6.5, 6.5],
  ])
    tent.add(box(0.3, 4.6, 0.3, lambert('#c39035'), x, 2.3, z))
  tent.position.set(-26, 0, 22)
  group.add(tent)

  // Petals, for the celebration
  const petalCount = 260
  const petalPositions = new Float32Array(petalCount * 3)
  const reset = (i: number, top: boolean) => {
    petalPositions[i * 3] = (Math.random() - 0.5) * 22
    petalPositions[i * 3 + 1] = top ? 12 + Math.random() * 3 : Math.random() * 14
    petalPositions[i * 3 + 2] = -6 + Math.random() * 14
  }
  for (let i = 0; i < petalCount; i++) reset(i, false)
  const petalGeometry = new BufferGeometry()
  petalGeometry.setAttribute('position', new Float32BufferAttribute(petalPositions, 3))
  const petals = new Points(petalGeometry, new PointsMaterial({ color: '#f0a030', size: 0.11, sizeAttenuation: true }))
  petals.visible = false
  petals.frustumCulled = false
  group.add(petals)

  const warm = new Color()
  const bulbCount = bulbs.length
  const state: Venue = {
    group,
    celebrate: false,
    update(time, dt) {
      // Twinkle a handful of bulbs each frame
      for (let k = 0; k < 24; k++) {
        const i = Math.floor(Math.random() * bulbCount)
        const glow = 0.55 + 0.45 * Math.abs(Math.sin(time * 2 + i))
        lights.setColorAt(i, warm.setRGB(1, 0.86 * glow + 0.1, 0.55 * glow))
      }
      lights.instanceColor!.needsUpdate = true
      petals.visible = state.celebrate
      if (!state.celebrate) return
      for (let i = 0; i < petalCount; i++) {
        petalPositions[i * 3 + 1] -= dt * (1.2 + (i % 5) * 0.25)
        petalPositions[i * 3] += Math.sin(time * 2 + i) * dt * 0.6
        if (petalPositions[i * 3 + 1] < 0.05) reset(i, true)
      }
      petalGeometry.attributes.position.needsUpdate = true
    },
  }
  return state
}
