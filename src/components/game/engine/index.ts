import { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import type { Character, Mode, Trip } from '../trips'
import { airLeg } from './air'
import { loadModels, releaseModels, type ModelId } from './assets'
import { bindKeyboard, type ControlMode, type Controls } from './input'
import type { Ctx, Leg, Message } from './leg'
import { railLeg } from './rail'
import { roadLeg } from './road'
import { Environment, loadFonts } from './scenery'

export { createControls, type ControlMode, type Controls } from './input'
export type { Message } from './leg'

export interface Hud {
  /** 1 = plane, train or bus; 2 = the bike */
  leg: 1 | 2
  progress: number
  speedKmh: number
  score: number
  mode: ControlMode
}

export type GameEvent =
  | { type: 'message'; message: Message }
  /** `arrived`: the first leg is over and the bike ride begins; `finale`: at the biye-bari */
  | { type: 'phase'; phase: 'arrived' | 'finale' }
  | { type: 'score'; score: number; delta: number }

export interface GameOptions {
  canvas: HTMLCanvasElement
  trip: Trip
  character: Character
  controls: Controls
  reduceMotion: boolean
  onHud: (hud: Hud) => void
  onEvent: (event: GameEvent) => void
  onProgress?: (done: number, total: number) => void
}

export interface Game {
  pause(): void
  resume(): void
  dispose(): void
}

/** Models each first leg needs; the bike ride's are added to every trip */
const FIRST_LEG: Record<Mode, ModelId[]> = {
  plane: ['plane', 'phoenix', 'cloud', 'cloud-soft', 'cloud-fluffy', 'mountains'],
  train: ['train-front', 'train-wagon', 'palm', 'bush', 'building-small', 'building-shop', 'mountains'],
  bus: ['bus', 'truck', 'car', 'taxi', 'palm', 'bush', 'building-small', 'building-shop', 'streetlight', 'mountains'],
}
const BIKE_RIDE: ModelId[] = ['motorbike', 'car', 'taxi', 'toto', 'palm', 'bush', 'building-small', 'building-large', 'building-shop', 'streetlight', 'mountains']
/** Parked at the hub where the bike ride starts */
const HUB: Record<Mode, ModelId> = { plane: 'plane', train: 'train-front', bus: 'bus' }

/** Loads the trip's models, then runs the game on `canvas` until disposed */
export async function runGame(options: GameOptions): Promise<Game> {
  const { canvas, trip, character, controls, reduceMotion, onHud, onEvent, onProgress } = options
  const [models] = await Promise.all([loadModels([...FIRST_LEG[trip.mode], ...BIKE_RIDE, HUB[trip.mode], character], onProgress), loadFonts()])

  const renderer = new WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 2, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2))
  const scene = new Scene()
  const camera = new PerspectiveCamera(62, 1, 0.5, 9000)
  const env = new Environment(scene)

  const resize = () => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    // Phones held upright see a little more road
    camera.fov = width < height ? 72 : 62
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  let score = 0
  let shake = 0
  let stage: 1 | 2 = 1
  let finale = false
  const ctx: Ctx = {
    scene,
    camera,
    env,
    models,
    controls,
    trip,
    character,
    reduceMotion,
    score(delta) {
      const before = score
      score = Math.max(0, score + delta)
      if (score !== before) onEvent({ type: 'score', score, delta: score - before })
    },
    say(message) {
      onEvent({ type: 'message', message })
    },
    shake(amount) {
      if (!reduceMotion) shake = Math.max(shake, amount)
    },
  }

  let leg: Leg = trip.mode === 'plane' ? airLeg(ctx) : trip.mode === 'train' ? railLeg(ctx) : roadLeg(ctx, 'bus')
  const unbind = bindKeyboard(controls, () => leg.mode)

  let last = performance.now()
  let time = 0
  let hudAt = -1
  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
    last = now
    time += dt
    leg.update(dt, time)
    if (shake > 0) {
      camera.position.x += (Math.random() - 0.5) * shake * 0.5
      camera.position.y += (Math.random() - 0.5) * shake * 0.5
      shake = Math.max(0, shake - dt * 1.6)
    }
    renderer.render(scene, camera)

    if (time - hudAt > 0.1) {
      hudAt = time
      onHud({ leg: stage, progress: leg.progress, speedKmh: Math.round(leg.speed * 3.6 * leg.speedScale), score, mode: finale ? 'none' : leg.mode })
    }
    if (leg.done && stage === 1) {
      leg.dispose()
      stage = 2
      leg = roadLeg(ctx, 'bike')
      camera.near = 0.3
      camera.far = 9000
      camera.updateProjectionMatrix()
      onEvent({ type: 'phase', phase: 'arrived' })
    } else if (leg.done && !finale) {
      finale = true
      onEvent({ type: 'phase', phase: 'finale' })
    }
  }
  renderer.setAnimationLoop(tick)

  return {
    pause() {
      renderer.setAnimationLoop(null)
    },
    resume() {
      last = performance.now()
      renderer.setAnimationLoop(tick)
    },
    dispose() {
      renderer.setAnimationLoop(null)
      unbind()
      observer.disconnect()
      leg.dispose()
      env.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      releaseModels()
    },
  }
}
