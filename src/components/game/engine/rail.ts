import { BoxGeometry, CylinderGeometry, Group, InstancedMesh, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, SphereGeometry, Vector3 } from 'three'
import type { L } from '@/config/types'
import { disposeTree, spawn } from './assets'
import { Course, SHORTEN, random, ribbon, straightEnd, winding } from './course'
import { Chase, type Ctx, type Leg } from './leg'
import { station, stopBoard, strip } from './places'
import { DAY, addProps, ballastTexture, groundFor, himalaya, pond, scatter, type Prop } from './scenery'
import { Train } from './vehicles'

/**
 * The train: no steering, only power and brakes. Obey the signals, stop at stations for
 * rosogollas, and bring the engine to the STOP board at NJP.
 */

const FRONT = 22
const WAGON = 20.2
const GAP = 0.6
const WAGONS = 3

interface Station {
  place: L
  from: number
  to: number
  announced: boolean
  boarded: boolean
}

interface Signal {
  s: number
  red: boolean
  state: 'waiting' | 'red' | 'green'
  waited: number
  lamps: [MeshBasicMaterial, MeshBasicMaterial]
}

export function railLeg(ctx: Ctx): Leg {
  const { scene, models, trip, controls, env, camera } = ctx
  const group = new Group()
  scene.add(group)
  const rand = random(53)
  const course = new Course(straightEnd(winding(3500 * SHORTEN, 21, { wiggle: 0.3, swing: 0.45, segment: 240 }), 320))
  const L = course.length
  /** Where the engine's nose should stop */
  const STOP = L - 30
  const BUFFER = L + 46

  camera.near = 0.5
  camera.far = 9000
  camera.updateProjectionMatrix()
  env.set(DAY)
  env.setFog(160, 1500)

  // ── Track: ballast with sleepers, two rails, overhead wires on masts
  group.add(groundFor(course, 'fields'))
  const ballast = ballastTexture()
  group.add(new Mesh(ribbon(course, -2.3, 2.3, { from: -60, to: BUFFER + 10, y: 0.04, repeat: 3.2, step: 2 }), new MeshLambertMaterial({ map: ballast })))
  const steel = new MeshLambertMaterial({ color: '#9aa0a6' })
  group.add(strip(course, -0.8, -0.7, -60, BUFFER, 0.22, steel), strip(course, 0.7, 0.8, -60, BUFFER, 0.22, steel))
  const wire = strip(course, -0.03, 0.03, -60, BUFFER, 0.04, new MeshLambertMaterial({ color: '#333333' }))
  wire.position.y = 6.3
  group.add(wire)
  const mastSpots: [number, number, number][] = []
  for (let s = 0; s < BUFFER; s += 48) {
    const p = course.side(s, 3.3)
    mastSpots.push([p.x, p.z, p.heading])
  }
  const masts = new InstancedMesh(new BoxGeometry(0.25, 7, 0.25), steel, mastSpots.length)
  const arms = new InstancedMesh(new BoxGeometry(3.6, 0.14, 0.14), steel, mastSpots.length)
  const dummy = new Object3D()
  mastSpots.forEach(([x, z, heading], i) => {
    dummy.position.set(x, 3.5, z)
    dummy.rotation.set(0, heading, 0)
    dummy.updateMatrix()
    masts.setMatrixAt(i, dummy.matrix)
    dummy.position.set(x + Math.cos(heading) * 1.7, 6.7, z - Math.sin(heading) * 1.7)
    dummy.updateMatrix()
    arms.setMatrixAt(i, dummy.matrix)
  })
  masts.computeBoundingSphere()
  arms.computeBoundingSphere()
  group.add(masts, arms)
  const buffer = new Mesh(new BoxGeometry(3.2, 1.4, 1), new MeshLambertMaterial({ color: '#a51c1c' }))
  const end = course.at(BUFFER)
  buffer.position.set(end.x, 0.9, end.z)
  buffer.rotation.y = end.heading
  group.add(buffer)

  // ── Stations on the way, and NJP at the end
  const stations: Station[] = trip.via.map((place, i) => {
    const s = ((L - 450) * (i + 1)) / (trip.via.length + 1)
    return { place, from: s - 100, to: s + 100, announced: false, boarded: false }
  })
  for (const st of stations) group.add(station(course, st.place, st.from, st.to))
  group.add(station(course, trip.hub.name, L - 250, L + 20, { big: true }))
  {
    const p = course.side(STOP, -2.4)
    const sign = stopBoard()
    sign.position.set(p.x, 1.05, p.z)
    sign.rotation.y = p.heading + Math.PI
    group.add(sign)
  }

  // ── Countryside
  const props: Prop[] = [
    ...scatter(course, rand, { models: ['palm', 'palm', 'bush'], every: 18, near: 9, far: 60 }),
    ...scatter(course, rand, { models: ['bush'], every: 12, near: 7, far: 30, scale: [0.7, 1.3] }),
  ]
  for (const st of [...stations, { from: L - 250, to: L + 20 }]) {
    props.push(...scatter(course, rand, { models: ['building-small', 'building-shop'], every: 26, near: 24, far: 40, from: st.from - 60, to: st.to + 60, faceRoad: true, side: -1 }))
  }
  addProps(group, models, props)
  for (let s = 150; s < L - 300; s += 260 + rand() * 120) {
    const p = course.side(s, (rand() < 0.5 ? -1 : 1) * (40 + rand() * 50))
    const water = pond(10 + rand() * 12)
    water.position.x = p.x
    water.position.z = p.z
    group.add(water)
  }
  const peaks = himalaya(models.get('mountains'), course, 6000)
  group.add(peaks.group)

  // ── Signals between stations
  const stops = [0, ...stations.map((st) => (st.from + st.to) / 2), L - 250]
  const gaps = stops.slice(1).map((s, i) => (s + stops[i]) / 2)
  const signalAt = gaps.filter((_, i) => gaps.length <= 3 || i % 2 === 0).slice(0, 3)
  const signals: Signal[] = signalAt.map((s, i) => {
    const post = new Group()
    post.add(new Mesh(new CylinderGeometry(0.1, 0.12, 5.4, 6), steel))
    post.children[0].position.y = 2.7
    const head = new Mesh(new BoxGeometry(0.7, 1.5, 0.45), new MeshLambertMaterial({ color: '#1b1b1b' }))
    head.position.y = 5.3
    post.add(head)
    const lamps: [MeshBasicMaterial, MeshBasicMaterial] = [new MeshBasicMaterial({ color: '#3a1010' }), new MeshBasicMaterial({ color: '#1fd45c' })]
    lamps.forEach((material, k) => {
      const lamp = new Mesh(new SphereGeometry(0.19, 10, 8), material)
      lamp.position.set(0, 5.7 - k * 0.7, -0.25)
      post.add(lamp)
    })
    const p = course.side(s, 2.9)
    post.position.set(p.x, 0, p.z)
    post.rotation.y = p.heading
    group.add(post)
    return { s, red: i === 0 || rand() < 0.6, state: 'waiting', waited: 0, lamps }
  })

  // ── The train
  const train = new Train()
  train.s = FRONT / 2 + 4
  const cars = [spawn(models.get('train-front')!), ...Array.from({ length: WAGONS }, () => spawn(models.get('train-wagon')!))]
  for (const car of cars) group.add(car)
  const centre = (i: number) => (i === 0 ? 0 : -FRONT / 2 - GAP - WAGON / 2 - (i - 1) * (WAGON + GAP))

  let done = false
  let arrived = 0
  let warnedEnd = false
  let finished = false
  const chase = new Chase(ctx.look)
  const focus = new Vector3()
  const nose = () => train.s + FRONT / 2

  const finish = (perfect: boolean, points: number) => {
    finished = true
    ctx.score(points)
    ctx.say({ key: 'stopped', perfect })
  }

  return {
    mode: 'train',
    get progress() {
      return Math.min(1, Math.max(0, nose() / STOP))
    },
    get speed() {
      return train.speed
    },
    speedScale: 1,
    get done() {
      return done
    },

    update(dt, time) {
      peaks.haze(0.94 - 0.6 * Math.min(1, nose() / STOP) ** 2, env.fog.color)
      if (!finished) train.update(dt, controls)
      else train.speed = Math.max(0, train.speed - 8 * dt)
      const front = nose()

      for (const st of stations) {
        if (!st.announced && front > st.from - 520) {
          st.announced = true
          ctx.say({ key: 'station', place: st.place })
        }
        if (!st.boarded && train.speed < 0.3 && front > st.from + 30 && front < st.to + 8) {
          st.boarded = true
          ctx.score(5)
          ctx.say({ key: 'boarded', place: st.place })
        }
      }

      for (const sig of signals) {
        if (sig.state === 'waiting' && front > sig.s - 620) {
          sig.state = sig.red ? 'red' : 'green'
          if (sig.red) ctx.say({ key: 'signalRed' })
        }
        if (sig.state === 'red') {
          if (front > sig.s) {
            sig.state = 'green'
            train.emergency = true
            ctx.score(-3)
            ctx.shake(0.4)
            ctx.say({ key: 'signalPassed' })
          } else if (train.speed < 0.3 && front > sig.s - 450) {
            sig.waited += dt
            if (sig.waited > 1.2) {
              sig.state = 'green'
              ctx.score(2)
              ctx.say({ key: 'signalGreen' })
            }
          }
        }
        const red = sig.state === 'red'
        sig.lamps[0].color.set(red ? '#ff2a1a' : '#3a1010')
        sig.lamps[1].color.set(red ? '#0f2a14' : '#1fd45c')
      }

      if (!warnedEnd && front > L - 760) {
        warnedEnd = true
        ctx.say({ key: 'stopAt', place: trip.hub.name })
      }
      if (!finished) {
        if (front > BUFFER - 1) {
          train.s = BUFFER - 1 - FRONT / 2
          train.speed = 0
          ctx.shake(0.6)
          finish(false, -2)
        } else if (train.speed < 0.3 && front > L - 250) {
          const perfect = Math.abs(front - STOP) < 8
          finish(perfect, perfect ? 10 : 4)
        }
      } else if ((arrived += dt) > 1.6) done = true

      cars.forEach((car, i) => {
        const p = course.at(train.s + centre(i))
        car.position.set(p.x, 0.22, p.z)
        car.rotation.y = p.heading
      })
      const p = course.at(train.s)
      chase.follow(camera, p.x, 0, p.z, p.heading, dt, { back: 30, up: 10, ahead: 30, lift: 2.5, stiffness: 3, side: 9 })
      focus.set(p.x, 0, p.z)
      env.follow(camera, focus)
      void time
    },

    dispose() {
      ballast.dispose()
      disposeTree(group)
    },
  }
}
