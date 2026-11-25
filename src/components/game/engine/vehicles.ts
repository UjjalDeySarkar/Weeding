import { wrapAngle } from './course'
import type { Controls } from './input'

/**
 * Arcade handling, no physics engine: enough to feel like driving, forgiving enough for every guest.
 * Speeds are metres per second. A heading is a rotation about Y; steering right lowers it.
 */

const ease = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)

export interface CarSpec {
  /** Top speed on the road */
  top: number
  accel: number
  brake: number
  /** Turn rate at a good speed, rad/s */
  turn: number
  /** Leans into turns (a bike) instead of rolling a little (a bus) */
  lean: number
}

export const BUS: CarSpec = { top: 30, accel: 5.5, brake: 13, turn: 0.75, lean: -0.05 }
export const BIKE: CarSpec = { top: 23, accel: 7.5, brake: 15, turn: 1.45, lean: 0.5 }

export class Car {
  x = 0
  z = 0
  heading = 0
  speed = 0
  /** Smoothed steering, −1 … 1 */
  steer = 0
  /** Body roll for drawing, radians (right is positive) */
  roll = 0
  readonly spec: CarSpec

  constructor(spec: CarSpec) {
    this.spec = spec
  }

  /**
   * `roadHeading` is the road's direction here (for a gentle keep-in-lane nudge when not steering),
   * `offroad` slows the vehicle down on the verge.
   */
  update(dt: number, controls: Controls, offroad: boolean, roadHeading: number | null) {
    const { spec } = this
    this.steer += (controls.steer - this.steer) * ease(10, dt)
    const top = offroad ? spec.top * 0.4 : spec.top

    if (controls.throttle > 0 && this.speed > -0.5) this.speed += spec.accel * controls.throttle * dt * (1 - Math.max(0, this.speed) / top)
    if (controls.brake > 0) {
      // Brake to a stop, then reverse slowly
      this.speed -= (this.speed > 0.3 ? spec.brake : spec.accel * 0.4) * controls.brake * dt
      this.speed = Math.max(this.speed, -4)
    }
    if (controls.throttle === 0 && controls.brake === 0) {
      // Rolling resistance brings it to a stop
      const slow = (offroad ? 5 : 1.2) * dt
      this.speed = Math.abs(this.speed) <= slow ? 0 : this.speed - Math.sign(this.speed) * slow
    }
    if (this.speed > top) this.speed -= (this.speed - top) * ease(2, dt)

    // No turning on the spot; a little less at full speed
    const grip = Math.min(1, Math.abs(this.speed) / 5) * (1 - 0.35 * Math.min(1, Math.abs(this.speed) / spec.top))
    this.heading -= this.steer * spec.turn * grip * Math.sign(this.speed) * dt
    if (roadHeading !== null && Math.abs(controls.steer) < 0.1 && this.speed > 4) {
      this.heading += wrapAngle(roadHeading - this.heading) * ease(0.9, dt)
    }

    this.x += Math.sin(this.heading) * this.speed * dt
    this.z += Math.cos(this.heading) * this.speed * dt
    this.roll += (this.steer * Math.min(1, this.speed / 12) * spec.lean - this.roll) * ease(6, dt)
  }

  /** Knocked back after a bump: `nx, nz` points away from what was hit */
  bounce(nx: number, nz: number, depth: number) {
    this.x += nx * depth
    this.z += nz * depth
    this.speed *= 0.3
  }
}

/** A train runs on its course: only speed is the driver's */
export class Train {
  s = 0
  speed = 0
  readonly top = 44
  /** Emergency brake on, until it stops */
  emergency = false

  update(dt: number, controls: Controls) {
    if (this.emergency) {
      this.speed = Math.max(0, this.speed - 14 * dt)
      if (this.speed === 0) this.emergency = false
    } else {
      if (controls.throttle > 0) this.speed += 3.4 * controls.throttle * dt * (1 - this.speed / this.top)
      if (controls.brake > 0) this.speed = Math.max(0, this.speed - 7 * controls.brake * dt)
      if (controls.throttle === 0 && controls.brake === 0) this.speed = Math.max(0, this.speed - 0.4 * dt)
    }
    this.s += this.speed * dt
  }
}

/** Flies at a steady speed: bank to turn, pull up or push down to climb or dive */
export class Plane {
  x = 0
  y = 300
  z = 0
  heading = 0
  /** Nose up is positive */
  pitch = 0
  /** Right wing down is positive */
  roll = 0
  speed = 78
  floor = 70
  ceiling = 700

  update(dt: number, controls: Controls, assist: { heading: number; strength: number } | null) {
    this.roll += (controls.steer * 0.75 - this.roll) * ease(3, dt)
    this.heading -= this.roll * 0.85 * dt
    if (assist && Math.abs(controls.steer) < 0.1) this.heading += wrapAngle(assist.heading - this.heading) * ease(assist.strength, dt)
    this.pitch += (controls.pitch * 0.32 - this.pitch) * ease(2.5, dt)

    const flat = Math.cos(this.pitch)
    this.x += Math.sin(this.heading) * flat * this.speed * dt
    this.z += Math.cos(this.heading) * flat * this.speed * dt
    this.y += Math.sin(this.pitch) * this.speed * dt
    if (this.y < this.floor || this.y > this.ceiling) {
      this.y = Math.min(this.ceiling, Math.max(this.floor, this.y))
      this.pitch *= 1 - ease(4, dt)
    }
  }
}
