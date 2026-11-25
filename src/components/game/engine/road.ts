import {
  CircleGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  Vector3,
} from 'three'
import { disposeTree, spawn, type ModelId } from './assets'
import { Course, SHORTEN, random, ribbon, routeShape, straightEnd, winding, wrapAngle } from './course'
import { Chase, type Ctx, type Leg } from './leg'
import { Guest } from './people'
import { BAY_OFFSET, bay, bilingual, busShed, busTerminus, stationBuilding, terminal, venue } from './places'
import { DAY, EVENING, GOLDEN, Rosogollas, addProps, blobShadow, board, groundFor, himalaya, pond, roadTexture, scatter, type Prop, type Spot } from './scenery'
import { BIKE, BUS, Car } from './vehicles'

/**
 * Driving on a road: the bus from Kolkata to Siliguri, or the bike from the hub to the biye-bari.
 * India keeps left: our lanes have negative offsets, oncoming traffic positive.
 */

interface Npc {
  object: Object3D
  s: number
  offset: number
  base: number
  speed: number
  dir: 1 | -1
  length: number
  radius: number
  x: number
  z: number
  heading: number
}

interface Hole {
  x: number
  z: number
  hit: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const smooth = (t: number) => t * t * (3 - 2 * t)

/** Circles covering a body `length` long, for bumping into things */
function circles(x: number, z: number, heading: number, length: number, radius: number) {
  const n = Math.max(1, Math.round(length / (radius * 2)))
  const span = Math.max(0, length / 2 - radius)
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1
    return [x + Math.sin(heading) * span * t, z + Math.cos(heading) * span * t] as const
  })
}

/** Shorter real routes become shorter rides; the airport is the longest */
const bikeLength = (km: number) => clamp(300 + km * 75, 450, 1500)

export function roadLeg(ctx: Ctx, kind: 'bus' | 'bike'): Leg {
  const bike = kind === 'bike'
  const { scene, models, trip, controls, env, camera } = ctx
  const model = (id: ModelId) => models.get(id)!
  const group = new Group()
  scene.add(group)
  const rand = random(bike ? 97 : 31)
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]

  const course = bike
    ? new Course(routeShape(trip.route.path, bikeLength(trip.route.distanceKm) * SHORTEN))
    : new Course(straightEnd(winding(2300 * SHORTEN, 11, { wiggle: 0.5, swing: 0.55, segment: 170 }), 160))
  const L = course.length
  const width = bike ? 9 : 15
  const half = width / 2
  const ours = bike ? [-2.25] : [-1.9, -5.6]
  const theirs = bike ? [2.25] : [1.9, 5.6]
  const teaGarden = bike && trip.hub.icon === 'plane'

  // ── Ground, road, scenery
  group.add(groundFor(course, bike ? (teaGarden ? 'tea' : 'town') : 'fields'))
  const roadMap = roadTexture(bike ? 2 : 4)
  group.add(new Mesh(ribbon(course, -half, half, { from: -60, to: L + 90, y: 0.03, repeat: 18 }), new MeshLambertMaterial({ map: roadMap })))

  const props: Prop[] = []
  const milestones = bike ? [] : trip.via.map((place, i) => ({ place, s: (L * (i + 1)) / (trip.via.length + 1), said: false }))
  if (bike) {
    const cityFrom = teaGarden ? L * 0.35 : 0
    props.push(
      ...scatter(course, rand, { models: ['building-shop', 'building-small', 'building-large', 'building-shop'], every: 15, near: half + 7, far: half + 11, from: cityFrom + 30, to: L - 70, faceRoad: true, scale: [0.85, 1.15] }),
      ...scatter(course, rand, { models: ['palm', 'bush', 'bush'], every: 26, near: half + 2.5, far: half + 5, to: L - 40 }),
    )
    for (let s = 20, side = -1; s < L - 30; s += 32, side = -side) {
      // Centred on its arm: this puts the pole just off the road, the lamp over it
      const p = course.side(s, side * (half - 0.8))
      props.push({ model: 'streetlight', x: p.x, z: p.z, heading: p.heading + (side < 0 ? -Math.PI / 2 : Math.PI / 2) })
    }
  } else {
    props.push(
      ...scatter(course, rand, { models: ['palm', 'palm', 'bush'], every: 16, near: half + 4, far: half + 45 }),
      ...scatter(course, rand, { models: ['bush'], every: 11, near: half + 2.5, far: half + 22, scale: [0.7, 1.3] }),
      ...scatter(course, rand, { models: ['building-small', 'building-shop'], every: 170, near: half + 12, far: half + 30, faceRoad: true }),
    )
    for (const m of milestones) {
      props.push(...scatter(course, rand, { models: ['building-shop', 'building-small', 'building-small'], every: 22, near: half + 9, far: half + 15, from: m.s - 150, to: m.s + 150, faceRoad: true, scale: [0.9, 1.1] }))
      for (let s = m.s - 140, side = -1; s < m.s + 140; s += 35, side = -side) {
        const p = course.side(s, side * (half - 0.6))
        props.push({ model: 'streetlight', x: p.x, z: p.z, heading: p.heading + (side < 0 ? -Math.PI / 2 : Math.PI / 2) })
      }
    }
    for (let s = 120; s < L - 200; s += 220 + rand() * 120) {
      const p = course.side(s, (rand() < 0.5 ? -1 : 1) * (half + 40 + rand() * 50))
      const water = pond(10 + rand() * 14)
      water.position.x = p.x
      water.position.z = p.z
      group.add(water)
    }
  }
  addProps(group, models, props)
  const peaks = himalaya(models.get('mountains'), course, bike ? 3600 : 6000)
  group.add(peaks.group)

  // Tea garden: rows of clipped bushes, cheap enough to have thousands
  if (teaGarden) {
    const bushes: Vector3[] = []
    for (let s = 0; s < L * 0.35; s += 3.2) {
      for (const side of [-1, 1]) {
        for (let k = 0; k < 12; k++) {
          const p = course.side(s, side * (half + 6 + k * 2.6))
          if (course.project(p.x, p.z).distance > half + 4) bushes.push(new Vector3(p.x, 0.45, p.z))
        }
      }
    }
    const tea = new InstancedMesh(new IcosahedronGeometry(0.8, 1), new MeshLambertMaterial({ color: '#4f9134', flatShading: true }), bushes.length)
    const dummy = new Object3D()
    bushes.forEach((p, i) => {
      dummy.position.copy(p).setY(0.3)
      dummy.scale.set(1.3, 0.75, 1.5)
      dummy.rotation.y = i
      dummy.updateMatrix()
      tea.setMatrixAt(i, dummy.matrix)
    })
    tea.computeBoundingSphere()
    group.add(tea)
  }

  // Streetlights glow in the evening; the golf cart becomes a green Siliguri toto
  if (bike) {
    model('streetlight').root.traverse((node) => {
      if (node instanceof Mesh && (node.material as MeshLambertMaterial).name === 'Light') (node.material as MeshLambertMaterial).emissive.set('#ffd27a')
    })
    model('toto').root.traverse((node) => {
      if (node instanceof Mesh) (node.material as MeshLambertMaterial).color.set('#8fd6a8')
    })
  }

  // ── Set pieces and signs
  const facing = (s: number, offset: number, object: Object3D, back = true) => {
    const p = course.side(s, offset)
    object.position.set(p.x, 0, p.z)
    object.rotation.y = p.heading + (back ? Math.PI : 0)
    group.add(object)
    return object
  }
  const green = { bg: '#2f6b4f', fg: '#ffffff', border: '#ffffff' }
  let venueSet: ReturnType<typeof venue> | null = null
  let bayCentre: Vector3 | null = null
  const BAY_S = L - 22
  const parkedBuses: { x: number; z: number; heading: number }[] = []

  if (bike) {
    hubBackdrop()
    facing(70, -(half + 2.5), board(bilingual({ en: 'Welcome to Siliguri', bn: 'শিলিগুড়িতে স্বাগত' }, { upper: false }), { w: 7, h: 2, raise: 2.2, ...green }))
    facing(L - 240, -(half + 2.5), board(bilingual({ en: 'Biye-bari ahead', bn: 'সামনে বিয়েবাড়ি' }, { upper: false }), { w: 7, h: 2, raise: 2.2, bg: '#a51c1c', fg: '#fbf5ea', border: '#e9b93a' }))
    venueSet = venue()
    facing(L, 0, venueSet.group, false)
  } else {
    facing(30, -(half + 3), board(bilingual(trip.origin.name), { w: 8, h: 2.2, raise: 2.4, ...green }))
    for (const m of milestones) facing(m.s - 45, -(half + 3.5), board(bilingual(m.place), { w: 7, h: 2, raise: 2.4, ...green }))
    group.add(busTerminus(course, trip.hub.name))
    // Park between two buses already in their bays
    const p = course.side(BAY_S, BAY_OFFSET)
    bayCentre = new Vector3(p.x, 0, p.z)
    const marker = bay(4.6, 13)
    marker.position.set(p.x, 0.12, p.z)
    marker.rotation.z = p.heading
    group.add(marker)
    for (const ds of [-28, 28]) {
      const parked = facing(BAY_S + ds, BAY_OFFSET, spawn(model('bus')), false)
      parkedBuses.push({ x: parked.position.x, z: parked.position.z, heading: parked.rotation.y })
    }
  }

  /** Where the bike ride starts: the building the guest walks out of, and how they got here */
  function hubBackdrop() {
    const { icon, name } = trip.hub
    if (icon === 'plane') {
      facing(-34, 0, terminal(name), false)
      facing(-60, 70, spawn(model('plane')), false).rotation.y += Math.PI / 2
    } else if (icon === 'train') {
      facing(-30, 0, stationBuilding(name), false)
      facing(-48, 30, spawn(model('train-front')), false).rotation.y += Math.PI / 2
    } else {
      facing(-22, -4, busShed(name), false)
      facing(-22, -12, spawn(model('bus')), false).rotation.y += Math.PI / 2
    }
  }

  // ── The player
  const car = new Car(bike ? BIKE : BUS)
  const startS = bike ? 2 : 12
  {
    const p = course.side(startS, ours[0])
    car.x = p.x
    car.z = p.z
    car.heading = p.heading
  }
  const body = new Group()
  const lean = new Group()
  const vehicle = spawn(model(bike ? 'motorbike' : 'bus'))
  lean.add(vehicle)
  body.add(lean)
  const shadow = blobShadow(bike ? 1 : 3.2, bike ? 2.4 : 11.6)
  group.add(body, shadow)
  const playerLength = bike ? 1.4 : 10
  const playerRadius = bike ? 0.7 : 1.5

  const guest = bike ? new Guest(model(ctx.character), ctx.character) : null
  // The seated pose's hips sit about this far above its feet
  const seat = new Vector3(0, 0.27, -0.05)

  // ── Traffic
  const npcModels: ModelId[] = bike ? ['toto', 'toto', 'car', 'taxi'] : ['truck', 'truck', 'car', 'taxi', 'car']
  const npcs: Npc[] = []
  const npcLength: Partial<Record<ModelId, number>> = { truck: 7.5, car: 4.3, taxi: 4.4, toto: 2.9, bus: 11 }
  const placeNpc = (npc: Npc, near: number) => {
    for (let tries = 0; tries < 6; tries++) {
      npc.dir = rand() < 0.45 ? -1 : 1
      npc.offset = pick(npc.dir > 0 ? ours : theirs)
      npc.base = npc.dir > 0 ? (bike ? 5 + rand() * 3 : 11 + rand() * 8) : bike ? 7 + rand() * 4 : 14 + rand() * 7
      npc.speed = npc.base
      npc.s = near + (npc.dir > 0 ? 90 : 160) + rand() * 520
      const clash = npcs.some((o) => o !== npc && o.offset === npc.offset && Math.abs(o.s - npc.s) < 30)
      if (!clash) break
    }
    npc.object.visible = npc.s < L - 160
  }
  for (let i = 0; i < (bike ? 9 : 12); i++) {
    const id = npcModels[i % npcModels.length]
    const object = spawn(model(id))
    const shade = blobShadow(id === 'toto' ? 1.6 : 2.4, (npcLength[id] ?? 4) * 1.05)
    object.add(shade)
    shade.position.y = 0.05
    group.add(object)
    const npc: Npc = { object, s: 0, offset: 0, base: 0, speed: 0, dir: 1, length: npcLength[id] ?? 4, radius: id === 'toto' ? 0.9 : 1.2, x: 0, z: 0, heading: 0 }
    placeNpc(npc, (i / 12) * 600 - 100)
    npcs.push(npc)
  }

  // ── Potholes (bus) or puddles (bike)
  const holes: Hole[] = []
  const holeMaterial = new MeshLambertMaterial({ color: bike ? '#6c8496' : '#38383b' })
  const holeShape = new CircleGeometry(1, 12)
  for (let s = 140; s < L - 150; s += 110 + rand() * 120) {
    const p = course.side(s, pick([...ours, ...ours, ...theirs]))
    const mesh = new Mesh(holeShape, holeMaterial)
    mesh.rotation.x = -Math.PI / 2
    mesh.scale.set(bike ? 1.5 : 1.2, bike ? 1.1 : 0.9, 1)
    mesh.position.set(p.x, 0.045, p.z)
    group.add(mesh)
    holes.push({ x: p.x, z: p.z, hit: -10 })
  }

  // ── Rosogollas, in short lines along a lane
  const spots: Spot[] = []
  for (let s = 60; s < L - 70; s += (bike ? 50 : 68) + rand() * 30) {
    const offset = rand() < 0.8 ? pick(ours) : pick(theirs)
    const n = 4 + Math.floor(rand() * 3)
    for (let k = 0; k < n; k++) {
      const p = course.side(s + k * 3.4, offset)
      spots.push({ x: p.x, y: 0, z: p.z })
    }
  }
  const sweets = new Rosogollas(spots)
  group.add(sweets.group)

  // ── State
  type Phase = 'intro' | 'drive' | 'arrive' | 'celebrate'
  let phase: Phase = bike ? 'intro' : 'drive'
  let s = startS
  let offset = ours[0]
  let progress = 0
  let done = false
  let clock = 0
  let lastBump = -10
  let lastBumpSaid = -10
  let offroadFor = 0
  let stuckFor = 0
  let warned = false
  let parked = 0
  const chase = new Chase()
  const focus = new Vector3()
  const camFrom = new Vector3()
  const camAt = new Vector3()

  env.set(bike ? GOLDEN : DAY)
  env.setFog(bike ? 90 : 140, bike ? 820 : 1300)

  if (guest) {
    guest.wearHelmet(true)
    group.add(guest.object)
    guest.play('Walk')
  }

  const mountGuest = () => {
    if (!guest) return
    lean.add(guest.object)
    guest.object.position.copy(seat)
    guest.object.rotation.set(0, 0, 0)
    guest.play('Sitting', { fade: 0.2 })
  }

  const resetToRoad = () => {
    const p = course.side(s, ours[0])
    car.x = p.x
    car.z = p.z
    car.heading = p.heading
    car.speed = 0
    offroadFor = 0
    stuckFor = 0
    ctx.say({ key: 'reset' })
  }

  const bump = (nx: number, nz: number, depth: number) => {
    car.bounce(nx, nz, depth)
    if (clock - lastBump > 1) {
      ctx.score(-1)
      ctx.shake(bike ? 0.5 : 0.4)
      lastBump = clock
    }
    if (clock - lastBumpSaid > 4) {
      ctx.say({ key: 'bump' })
      lastBumpSaid = clock
    }
  }

  function updateNpcs(dt: number) {
    for (const npc of npcs) {
      if (npc.dir > 0) {
        // Don't run into the guest from behind
        const gap = s - npc.s
        npc.speed = gap > 0 && gap < 16 && Math.abs(offset - npc.offset) < 2.4 ? Math.min(npc.base, Math.max(0, car.speed - 1)) : npc.base
      }
      npc.s += npc.speed * npc.dir * dt
      if ((npc.dir > 0 && (npc.s < s - 90 || npc.s > s + 900)) || (npc.dir < 0 && npc.s < s - 60)) placeNpc(npc, s)
      const p = course.side(npc.s, npc.offset)
      npc.x = p.x
      npc.z = p.z
      npc.heading = p.heading + (npc.dir < 0 ? Math.PI : 0)
      npc.object.position.set(p.x, 0, p.z)
      npc.object.rotation.y = npc.heading
      npc.object.visible = npc.s < L - 160 && npc.s > -20
    }
  }

  function collide() {
    let deepest = 0
    let nx = 0
    let nz = 0
    const mine = circles(car.x, car.z, car.heading, playerLength, playerRadius)
    const test = (x: number, z: number, heading: number, length: number, radius: number) => {
      for (const [ox, oz] of circles(x, z, heading, length, radius)) {
        for (const [px, pz] of mine) {
          const d = Math.hypot(px - ox, pz - oz)
          const depth = playerRadius + radius - d
          if (depth > deepest && d > 0.001) {
            deepest = depth
            nx = (px - ox) / d
            nz = (pz - oz) / d
          }
        }
      }
    }
    for (const npc of npcs) if (npc.object.visible && Math.abs(npc.s - s) < 30) test(npc.x, npc.z, npc.heading, npc.length, npc.radius)
    for (const bus of parkedBuses) test(bus.x, bus.z, bus.heading, 10.5, 1.35)
    if (deepest > 0) bump(nx, nz, deepest)

    for (const hole of holes) {
      if (clock - hole.hit < 2 || car.speed < 6) continue
      for (const [px, pz] of mine) {
        if (Math.hypot(px - hole.x, pz - hole.z) < 1.3) {
          hole.hit = clock
          car.speed *= 0.8
          ctx.shake(0.25)
          break
        }
      }
    }
  }

  function drive(dt: number) {
    const proj = course.project(car.x, car.z, s)
    s = proj.s
    offset = proj.offset
    const offroad = Math.abs(offset) > half + 1.2
    const road = course.at(s).heading
    // Off the road, the nudge points back towards it
    const nudge = offroad ? road + clamp(offset * 0.04, -0.5, 0.5) : road
    car.update(dt, controls, offroad, nudge)
    collide()

    const got = sweets.update(clock, car.x, 0.6, car.z, bike ? 1.3 : 2.6)
    if (got) ctx.score(got)

    for (const m of milestones) {
      if (!m.said && s > m.s - 35) {
        m.said = true
        ctx.say({ key: 'passing', place: m.place })
      }
    }

    // Lost or stuck: back to the road
    offroadFor = Math.abs(offset) > half + 28 ? offroadFor + dt : 0
    stuckFor = car.speed < 0.5 && controls.throttle > 0 ? stuckFor + dt : 0
    if (offroadFor > 1.2 || Math.abs(offset) > half + 70 || stuckFor > 3) resetToRoad()

    if (bike) {
      if (!warned && s > L - 260) {
        warned = true
        ctx.say({ key: 'venueAhead' })
      }
      if (s > L - 30) {
        phase = 'arrive'
        // The cutscene camera eases on from wherever the chase camera is
        camFrom.copy(camera.position)
        camAt.copy(camera.position).addScaledVector(camera.getWorldDirection(new Vector3()), 10)
      }
    } else {
      if (!warned && s > L - 300) {
        warned = true
        ctx.say({ key: 'park', place: trip.hub.name })
      }
      // Stopping anywhere in the terminus ends the trip; in the yellow bay earns more
      const away = bayCentre ? Math.hypot(car.x - bayCentre.x, car.z - bayCentre.z) : Infinity
      if ((car.speed < 1 && s > L - 75) || s > L + 40) {
        car.speed = Math.min(car.speed, 1)
        const perfect = away < 2.6
        ctx.score(perfect ? 10 : 4)
        ctx.say({ key: 'stopped', perfect })
        phase = 'arrive'
      }
    }
  }

  /** The bike rolls up beside the gate on its own; the guest gets off and stands in the gateway */
  function arriveAtVenue(dt: number) {
    const target = L - 8
    car.speed += (Math.max(0, (target - s) * 0.9) - car.speed) * (1 - Math.exp(-3 * dt))
    s += car.speed * dt
    offset += (2.6 - offset) * (1 - Math.exp(-2 * dt))
    const p = course.side(s, offset)
    car.x = p.x
    car.z = p.z
    car.heading += wrapAngle(p.heading - car.heading) * (1 - Math.exp(-4 * dt))
    car.roll *= Math.exp(-4 * dt)
    if (car.speed < 0.25 && guest && guest.object.parent === lean) {
      // Off the bike, over to the gateway
      const world = guest.object.getWorldPosition(new Vector3())
      group.add(guest.object)
      guest.object.position.set(world.x, 0, world.z)
      guest.play('Walk')
      phase = 'celebrate'
      clock = 0
    }
  }

  return {
    mode: 'car',
    get progress() {
      return progress
    },
    get speed() {
      return phase === 'drive' ? Math.abs(car.speed) : 0
    },
    speedScale: 1,
    get done() {
      return done
    },

    update(dt, time) {
      clock += dt
      if (bike) env.set(GOLDEN, EVENING, smooth(clamp(s / L, 0, 1)))
      // The Himalaya come out of the haze as Siliguri gets closer
      peaks.haze(bike ? 0.3 : 0.94 - 0.6 * smooth(clamp(s / L, 0, 1)), env.fog.color)

      if (phase === 'intro' && guest) {
        // The guest walks out to the bike, then the ride begins
        const t = Math.min(1, clock / 3)
        const from = course.side(-12, -6)
        const to = course.side(startS - 0.2, ours[0] - 1.1)
        guest.object.position.set(from.x + (to.x - from.x) * t, 0, from.z + (to.z - from.z) * t)
        guest.object.rotation.y = Math.atan2(to.x - from.x, to.z - from.z)
        const side = course.side(startS + 14, 5.5)
        chase.set(camera, camFrom.set(side.x, 2.8, side.z), camAt.set((from.x + to.x) / 2, 1.2, (from.z + to.z) / 2))
        if (clock > 3) {
          mountGuest()
          phase = 'drive'
          ctx.say({ key: 'go' })
        }
      } else if (phase === 'drive') {
        drive(dt)
      } else if (phase === 'arrive') {
        if (bike) arriveAtVenue(dt)
        else {
          car.speed *= 1 - Math.min(1, dt * 3)
          car.update(dt, { steer: 0, throttle: 0, brake: 1, pitch: 0 }, false, null)
          parked += dt
          if (parked > 1.2) done = true
        }
      } else if (phase === 'celebrate' && guest && venueSet) {
        // Walk into the gateway, turn round and clap, like posing for a photo
        const spot = course.side(L - 2.5, 0)
        const dx = spot.x - guest.object.position.x
        const dz = spot.z - guest.object.position.z
        const away = Math.hypot(dx, dz)
        if (away > 0.15 && clock < 6) {
          const step = Math.min(away, 1.4 * dt)
          guest.object.position.x += (dx / away) * step
          guest.object.position.z += (dz / away) * step
          guest.object.rotation.y = Math.atan2(dx, dz)
        } else if (!venueSet.celebrate) {
          guest.object.rotation.y = spot.heading + Math.PI
          guest.play('Clapping')
          venueSet.celebrate = true
          done = true
        }
      }

      progress = clamp(s / L, 0, 1)
      body.position.set(car.x, 0, car.z)
      body.rotation.y = car.heading
      lean.rotation.z = car.roll
      shadow.position.set(car.x, 0.05, car.z)
      shadow.rotation.z = car.heading

      updateNpcs(dt)
      if (phase !== 'drive') sweets.update(clock, Infinity, 0, Infinity, 0)
      guest?.update(dt)
      venueSet?.update(time, dt)

      if (phase === 'drive' || (phase === 'arrive' && !bike)) {
        chase.follow(camera, car.x, 0, car.z, car.heading, dt, bike ? { back: 6.2, up: 2.5, ahead: 9, lift: 1.1, stiffness: 5 } : { back: 17, up: 6.5, ahead: 16, lift: 2.2, stiffness: 3.5 })
      } else if (phase === 'arrive' || phase === 'celebrate') {
        // In front of the gate, swaying gently, looking at the guest in the gateway
        const sway = Math.sin(time * 0.25)
        const from = course.side(L - 17 - sway * 1.5, sway * 4)
        const at = course.at(L - 2)
        chase.set(camera, camFrom.lerp(new Vector3(from.x, 3.4, from.z), 1 - Math.exp(-2 * dt)), camAt.lerp(new Vector3(at.x, 2.6, at.z), 1 - Math.exp(-2 * dt)))
      }
      focus.set(car.x, 0, car.z)
      env.follow(camera, focus)
    },

    dispose() {
      guest?.dispose()
      holeShape.dispose()
      holeMaterial.dispose()
      roadMap.dispose()
      disposeTree(group)
    },
  }
}
