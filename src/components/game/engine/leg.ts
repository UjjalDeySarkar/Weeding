import { Vector3, type PerspectiveCamera, type Scene } from 'three'
import type { L } from '@/config/types'
import type { Character, Trip } from '../trips'
import type { Models } from './assets'
import type { ControlMode, Controls } from './input'
import type { Environment } from './scenery'

/** Things the game tells the guest; the dialog words them in the current language */
export type Message =
  | { key: 'go' }
  | { key: 'passing'; place: L }
  | { key: 'station'; place: L }
  | { key: 'boarded'; place: L }
  | { key: 'signalRed' }
  | { key: 'signalGreen' }
  | { key: 'signalPassed' }
  | { key: 'bump' }
  | { key: 'bird' }
  | { key: 'reset' }
  | { key: 'ring' }
  | { key: 'turnBack' }
  | { key: 'landing' }
  | { key: 'touchdown' }
  | { key: 'park'; place: L }
  | { key: 'stopAt'; place: L }
  | { key: 'stopped'; perfect: boolean }
  | { key: 'venueAhead' }

/** What every leg gets from the game */
export interface Ctx {
  scene: Scene
  camera: PerspectiveCamera
  env: Environment
  models: Models
  controls: Controls
  trip: Trip
  character: Character
  reduceMotion: boolean
  /** Adds (or takes away) rosogollas */
  score(delta: number): void
  say(message: Message): void
  /** Camera shake, 0–1 */
  shake(amount: number): void
}

/** One stretch of the journey: the first leg (plane, train or bus) or the bike ride */
export interface Leg {
  readonly mode: ControlMode
  /** 0–1 along the leg */
  readonly progress: number
  /** Metres per second, for the speedometer */
  readonly speed: number
  /** The speedometer multiplies by this (a plane at game speed would feel slow) */
  readonly speedScale: number
  /** Finished: the next leg can start (for the bike: the guest has arrived) */
  readonly done: boolean
  update(dt: number, time: number): void
  dispose(): void
}

/** A camera that trails behind a moving thing, smoothly */
export class Chase {
  private readonly position = new Vector3()
  private readonly target = new Vector3()
  private readonly wantPosition = new Vector3()
  private readonly wantTarget = new Vector3()
  private ready = false

  /** Behind `x, y, z` by `back` along `heading`, `up` above and `side` to the right, looking `ahead` in front */
  follow(
    camera: PerspectiveCamera,
    x: number,
    y: number,
    z: number,
    heading: number,
    dt: number,
    { back = 8, up = 3, ahead = 10, lift = 1.2, stiffness = 4, side = 0 } = {},
  ) {
    const sx = Math.sin(heading)
    const cz = Math.cos(heading)
    this.wantPosition.set(x - sx * back - cz * side, y + up, z - cz * back + sx * side)
    this.wantTarget.set(x + sx * ahead, y + lift, z + cz * ahead)
    if (!this.ready) {
      this.position.copy(this.wantPosition)
      this.target.copy(this.wantTarget)
      this.ready = true
    } else {
      this.position.lerp(this.wantPosition, 1 - Math.exp(-stiffness * dt))
      this.target.lerp(this.wantTarget, 1 - Math.exp(-stiffness * 1.6 * dt))
    }
    camera.position.copy(this.position)
    camera.lookAt(this.target)
  }

  /** Puts the camera somewhere directly (cutscenes); `follow` then eases on from there */
  set(camera: PerspectiveCamera, position: Vector3, target: Vector3) {
    this.position.copy(position)
    this.target.copy(target)
    this.ready = true
    camera.position.copy(position)
    camera.lookAt(target)
  }
}
