import { Group, Matrix4, Mesh, MeshLambertMaterial, Quaternion, TorusGeometry, Vector3 } from 'three'
import type { Point } from '@/lib/spline'
import { disposeTree, instances, spawn } from './assets'
import { Course, SHORTEN, random, ribbon, straightEnd, winding, wrapAngle } from './course'
import { Chase, type Ctx, type Leg } from './leg'
import { Animated } from './people'
import { apron, runway, terminal } from './places'
import { DAY, Rosogollas, groundFor, himalaya, type Spot } from './scenery'
import type { Controls } from './input'
import { Plane } from './vehicles'

/**
 * The flight: bank and climb through marigold rings, dodge the phoenixes, collect rosogollas
 * in the sky. Near Bagdogra the autopilot takes over and lands on the runway.
 */

const CRUISE = 320
const RING = 15
const BIRD_RADIUS = 3

// On the ground, in metres: along the runway from its threshold, and left of its centre line
const TURN_AT = 500
const TURN_RADIUS = 60
const GATE_LEFT = 70
const TERMINAL_LEFT = 110
const TURN_LENGTH = (TURN_RADIUS * Math.PI) / 2
/** Taxi distance to the stand: runway, quarter turn, then straight at the terminal */
const PARK = TURN_AT + TURN_LENGTH + GATE_LEFT - TURN_RADIUS
const TAXI_SPEED = 18

interface Ring {
  mesh: Mesh<TorusGeometry, MeshLambertMaterial>
  centre: Vector3
  heading: number
  last: number
  state: 'open' | 'hit' | 'missed'
  fade: number
}

interface Flyer {
  bird: Animated
  base: Vector3
  phase: number
  hit: boolean
}

export function airLeg(ctx: Ctx): Leg {
  const { scene, models, trip, controls, env, camera } = ctx
  const group = new Group()
  scene.add(group)
  const rand = random(5)
  const course = new Course(straightEnd(winding(6600 * SHORTEN, 5, { wiggle: 0.55, swing: 0.7, segment: 380 }), 1700))
  const L = course.length
  const descentFrom = L - 2400
  const altitude = (s: number) => (s < descentFrom ? CRUISE : Math.max(0, CRUISE * (1 - (s - descentFrom) / (L - descentFrom))))

  camera.near = 1
  camera.far = 16000
  camera.updateProjectionMatrix()
  env.set(DAY)
  env.setFog(500, 5200)

  // ── Below: fields, the Ganga, the runway at Bagdogra, the Himalaya beyond
  group.add(groundFor(course, 'fields', 9000, 420))
  {
    const at = course.at(L * 0.35)
    const rx = -Math.cos(at.heading)
    const rz = Math.sin(at.heading)
    const fx = Math.sin(at.heading)
    const fz = Math.cos(at.heading)
    const bank: Point[] = []
    for (let k = -6; k <= 6; k++) bank.push([at.x + rx * k * 900 + fx * Math.sin(k) * 300, at.z + rz * k * 900 + fz * Math.sin(k) * 300])
    const river = new Mesh(ribbon(new Course(bank, 8), -170, 170, { step: 20, y: 0.3 }), new MeshLambertMaterial({ color: '#6f9fb8' }))
    group.add(river)
  }
  const threshold = course.at(L)
  const runwayGroup = new Group()
  // The stand lies beside the runway, between the turn and the terminal (local +X is left)
  const stand = apron(73, 150)
  stand.position.set(23 + 73 / 2, 0.05, TURN_AT - 10 + 150 / 2)
  runwayGroup.add(runway(), stand)
  runwayGroup.position.set(threshold.x, 0, threshold.z)
  runwayGroup.rotation.y = threshold.heading
  group.add(runwayGroup)
  {
    const p = course.side(L + TURN_AT + TURN_RADIUS, -TERMINAL_LEFT)
    const building = terminal(trip.hub.name)
    building.position.set(p.x, 0, p.z)
    building.rotation.y = p.heading - Math.PI / 2
    group.add(building)
  }
  const peaks = himalaya(models.get('mountains'), course, 6500)
  group.add(peaks.group)

  // ── Clouds, instanced: three kinds taking turns
  {
    const kinds = (['cloud', 'cloud-soft', 'cloud-fluffy'] as const).map((id) => ({ id, transforms: [] as Matrix4[] }))
    for (let s = 0, i = 0; s < L; s += 90, i++) {
      const p = course.side(s, (rand() < 0.5 ? -1 : 1) * (60 + rand() * 1100))
      const k = 0.5 + rand() * 1.2
      kinds[i % kinds.length].transforms.push(new Matrix4().compose(new Vector3(p.x, 180 + rand() * 360, p.z), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), rand() * 6), new Vector3(k, k, k)))
    }
    for (const { id, transforms } of kinds) group.add(instances(models.get(id)!, transforms))
  }

  // ── Rings to fly through, with rosogollas inside
  const rings: Ring[] = []
  const spots: Spot[] = []
  const ringGeometry = new TorusGeometry(RING, 1.1, 8, 40)
  const lastRing = descentFrom + 700
  for (let s = 600; s <= lastRing; s += s < descentFrom - 300 ? 430 : 700) {
    const approach = s > descentFrom - 300
    const p = course.side(s, approach ? 0 : (rand() - 0.5) * 80)
    const y = altitude(s) + (approach ? 0 : (rand() - 0.5) * 60)
    const mesh = new Mesh(ringGeometry, new MeshLambertMaterial({ color: '#f0a030', emissive: '#7a3a08' }))
    mesh.position.set(p.x, y, p.z)
    mesh.rotation.y = p.heading
    group.add(mesh)
    rings.push({ mesh, centre: mesh.position, heading: p.heading, last: -1, state: 'open', fade: 1 })
    for (const dy of [-5, 0, 5]) spots.push({ x: p.x, y: y + dy - 1.5, z: p.z })
  }
  for (let s = 800; s < descentFrom - 200; s += 520) {
    const lateral = (rand() - 0.5) * 120
    const y = CRUISE + (rand() - 0.5) * 70
    for (let k = 0; k < 4; k++) {
      const q = course.side(s + k * 14, lateral)
      spots.push({ x: q.x, y, z: q.z })
    }
  }
  const sweets = new Rosogollas(spots, 3)
  group.add(sweets.group)

  // ── Phoenixes in the way
  const flyers: Flyer[] = []
  for (let s = 900; s < descentFrom - 300; s += 330 + rand() * 260) {
    const p = course.side(s, (rand() - 0.5) * 90)
    const y = CRUISE + (rand() - 0.5) * 80
    const count = 2 + Math.floor(rand() * 3)
    for (let k = 0; k < count; k++) {
      const bird = new Animated(models.get('phoenix')!)
      const { object } = bird
      const base = new Vector3(p.x + (rand() - 0.5) * 22, y + (rand() - 0.5) * 14, p.z + (rand() - 0.5) * 22)
      object.position.copy(base)
      object.rotation.y = p.heading + Math.PI + (rand() - 0.5)
      group.add(object)
      const phase = rand() * 6
      bird.play('Fly')
      // Not all flapping in step
      bird.update(phase)
      flyers.push({ bird, base, phase, hit: false })
    }
  }

  // ── The plane
  const plane = new Plane()
  {
    const p = course.at(0)
    plane.x = p.x
    plane.z = p.z
    plane.heading = p.heading
    plane.y = CRUISE
  }
  const body = spawn(models.get('plane')!)
  body.rotation.order = 'YXZ'
  group.add(body)

  type Phase = 'fly' | 'landing' | 'rollout' | 'stopped'
  let phase: Phase = 'fly'
  let s = 0
  let done = false
  let clock = 0
  let lastBump = -10
  let lastTurnBack = -10
  let stopped = 0
  let taxi = 0
  /** How far right of the centre line it touched down; eased out while rolling */
  let drift = 0
  const chase = new Chase(ctx.look)
  const focus = new Vector3()
  const flying: Controls = { steer: 0, throttle: 0, brake: 0, pitch: 0 }
  const forward = new Vector3()
  const offsetV = new Vector3()

  const updateRings = (dt: number) => {
    for (const ring of rings) {
      if (ring.state === 'open') {
        forward.set(Math.sin(ring.heading), 0, Math.cos(ring.heading))
        offsetV.set(plane.x, plane.y, plane.z).sub(ring.centre)
        const along = offsetV.dot(forward)
        if (ring.last < 0 && along >= 0) {
          const across = offsetV.addScaledVector(forward, -along).length()
          if (across < RING + 1.5) {
            ring.state = 'hit'
            ring.mesh.material.color.set('#7bd36a')
            ring.mesh.material.emissive.set('#1f5a14')
            ctx.score(3)
            ctx.say({ key: 'ring' })
          } else if (across < 400) {
            ring.state = 'missed'
            ring.mesh.material.color.set('#9a948a')
            ring.mesh.material.emissive.set('#000000')
          }
        }
        ring.last = along
      } else if (ring.fade > 0) {
        ring.fade = Math.max(0, ring.fade - dt * (ring.state === 'hit' ? 1.5 : 0.5))
        ring.mesh.scale.setScalar(ring.state === 'hit' ? 1 + (1 - ring.fade) * 0.6 : ring.fade)
        ring.mesh.visible = ring.fade > 0
      }
    }
  }

  const updateFlyers = (dt: number, time: number) => {
    for (const f of flyers) {
      const { object } = f.bird
      if (!object.visible) continue
      // Wings only need to beat where they can be seen
      if (Math.abs(object.position.x - plane.x) + Math.abs(object.position.z - plane.z) < 900) f.bird.update(dt)
      object.position.set(f.base.x + Math.sin(time * 0.7 + f.phase) * 4, f.base.y + Math.sin(time * 2 + f.phase) * 1.5, f.base.z + Math.cos(time * 0.6 + f.phase) * 4)
      if (phase !== 'fly' || f.hit) continue
      const d = object.position.distanceTo(offsetV.set(plane.x, plane.y, plane.z))
      if (d < BIRD_RADIUS + 6) {
        f.hit = true
        object.visible = false
        plane.roll += (rand() - 0.5) * 0.8
        if (clock - lastBump > 1) {
          lastBump = clock
          ctx.score(-1)
          ctx.shake(0.5)
          ctx.say({ key: 'bird' })
        }
      }
    }
  }

  return {
    mode: 'plane',
    get progress() {
      return Math.min(1, s / L)
    },
    get speed() {
      return plane.speed
    },
    speedScale: 3.3,
    get done() {
      return done
    },

    update(dt, time) {
      clock += dt
      const proj = course.project(plane.x, plane.z, s)
      s = proj.s
      peaks.haze(0.9 - 0.7 * Math.min(1, s / L) ** 2, env.fog.color)

      if (phase === 'fly') {
        // Let go and it holds course and height; steer and it's all yours
        const ahead = course.at(s + 400)
        const towards = Math.atan2(ahead.x - plane.x, ahead.z - plane.z)
        const lost = Math.abs(proj.offset) > 420
        if (lost && clock - lastTurnBack > 8) {
          lastTurnBack = clock
          ctx.say({ key: 'turnBack' })
        }
        flying.steer = controls.steer
        flying.pitch = controls.pitch !== 0 ? controls.pitch : Math.max(-0.6, Math.min(0.6, (altitude(s + 250) - plane.y) * 0.012))
        plane.floor = 70
        plane.update(dt, flying, { heading: towards, strength: lost ? 1.2 : 0.35 })
        updateRings(dt)
        if (s > L - 900) {
          phase = 'landing'
          ctx.say({ key: 'landing' })
        }
      } else if (phase === 'landing') {
        // Autopilot down the glide path onto the centreline
        const p = course.at(s + 120)
        const target = Math.atan2(p.x - plane.x, p.z - plane.z)
        plane.heading += wrapAngle(target - plane.heading) * (1 - Math.exp(-1.5 * dt))
        plane.roll *= 1 - Math.min(1, dt * 2)
        plane.speed += (70 - plane.speed) * (1 - Math.exp(-0.5 * dt))
        const want = altitude(s + 60)
        plane.pitch = plane.y < 14 ? 0.08 : -0.05
        plane.y += (want - plane.y) * (1 - Math.exp(-1.6 * dt))
        plane.x += Math.sin(plane.heading) * plane.speed * dt
        plane.z += Math.cos(plane.heading) * plane.speed * dt
        if (s >= L - 5 && plane.y < 1.2) {
          plane.y = 0
          phase = 'rollout'
          taxi = s - L
          drift = proj.offset
          ctx.shake(0.3)
          ctx.say({ key: 'touchdown' })
        }
      } else {
        // Brake down the runway, turn off onto the stand and stop facing the terminal
        plane.pitch *= 1 - Math.min(1, dt * 3)
        const limit = taxi < TURN_AT ? Math.sqrt(TAXI_SPEED ** 2 + 9 * (TURN_AT - taxi)) : Math.max(2, Math.sqrt(6 * (PARK - taxi)))
        plane.speed = taxi < PARK ? Math.min(plane.speed, limit) : 0
        taxi = Math.min(PARK, taxi + plane.speed * dt)
        const turned = Math.max(0, Math.min(Math.PI / 2, (taxi - TURN_AT) / TURN_RADIUS))
        const along = Math.min(taxi, TURN_AT) + TURN_RADIUS * Math.sin(turned)
        const left = TURN_RADIUS * (1 - Math.cos(turned)) + Math.max(0, taxi - TURN_AT - TURN_LENGTH)
        drift *= Math.exp(-2 * dt)
        const p = course.side(L + along, drift - left)
        plane.x = p.x
        plane.z = p.z
        plane.heading += wrapAngle(threshold.heading + turned - plane.heading) * (1 - Math.exp(-6 * dt))
        // A moment at the stand: welcome to Bagdogra
        if (taxi >= PARK && (stopped += dt) > 2.5) done = true
      }

      const got = sweets.update(clock, plane.x, plane.y, plane.z, 7)
      if (got) ctx.score(got)
      updateFlyers(dt, time)

      body.position.set(plane.x, plane.y, plane.z)
      body.rotation.set(-plane.pitch, plane.heading, plane.roll)
      chase.follow(camera, plane.x, plane.y, plane.z, plane.heading, dt, {
        back: phase === 'rollout' ? 46 : 40,
        up: phase === 'rollout' ? 12 : 11,
        ahead: 70,
        lift: 3,
        stiffness: 3,
      })
      if (camera.position.y < 3) camera.position.y = 3
      focus.set(plane.x, plane.y, plane.z)
      env.follow(camera, focus)
    },

    dispose() {
      ringGeometry.dispose()
      for (const f of flyers) f.bird.dispose()
      disposeTree(group)
    },
  }
}
