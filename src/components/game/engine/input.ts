import { wrapAngle } from './course'

/** What the guest is pressing, from the keyboard or the on-screen buttons */
export interface Controls {
  /** −1 left … 1 right */
  steer: number
  /** 0 … 1 */
  throttle: number
  /** 0 … 1 */
  brake: number
  /** −1 dive … 1 climb */
  pitch: number
}

/** Which buttons the current vehicle uses */
export type ControlMode = 'car' | 'train' | 'plane' | 'none'

export const createControls = (): Controls => ({ steer: 0, throttle: 0, brake: 0, pitch: 0 })

/** Where the guest has dragged the view: turned around the vehicle (yaw) and raised (pitch), in radians */
export class Look {
  yaw = 0
  pitch = 0
  dragging = false
  private idle = 0

  /** A drag in screen widths (`dx`) and pixels (`dy`): one width is a full turn */
  drag(dx: number, dy: number) {
    this.yaw = wrapAngle(this.yaw - dx * Math.PI * 2)
    this.pitch = Math.min(1.2, Math.max(-1, this.pitch + dy * 0.005))
    this.idle = 0
  }

  /** Let go while on the move and, after a moment, the view swings back behind */
  settle(dt: number, moving: boolean) {
    this.idle = this.dragging || !moving ? 0 : this.idle + dt
    if (this.idle < 2.5) return
    const keep = Math.exp(-3 * dt)
    this.yaw *= keep
    this.pitch *= keep
  }

  reset() {
    this.yaw = this.pitch = this.idle = 0
  }
}

/** Drag with the mouse or a finger to look around. Returns a cleanup function. */
export function bindLook(element: HTMLElement, look: Look) {
  let pointer: number | null = null
  let x = 0
  let y = 0
  const onDown = (e: PointerEvent) => {
    if (pointer !== null || e.button !== 0) return
    pointer = e.pointerId
    x = e.clientX
    y = e.clientY
    look.dragging = true
    element.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointer) return
    look.drag((e.clientX - x) / element.clientWidth, e.clientY - y)
    x = e.clientX
    y = e.clientY
  }
  const onEnd = (e: PointerEvent) => {
    if (e.pointerId !== pointer) return
    pointer = null
    look.dragging = false
  }
  element.addEventListener('pointerdown', onDown)
  element.addEventListener('pointermove', onMove)
  element.addEventListener('pointerup', onEnd)
  element.addEventListener('pointercancel', onEnd)
  element.addEventListener('lostpointercapture', onEnd)
  return () => {
    element.removeEventListener('pointerdown', onDown)
    element.removeEventListener('pointermove', onMove)
    element.removeEventListener('pointerup', onEnd)
    element.removeEventListener('pointercancel', onEnd)
    element.removeEventListener('lostpointercapture', onEnd)
  }
}

const KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'])

/** Arrow keys or WASD; ↑ climbs in the plane. Returns a cleanup function. */
export function bindKeyboard(controls: Controls, mode: () => ControlMode) {
  const held = new Set<string>()
  const has = (...codes: string[]) => codes.some((code) => held.has(code))
  const sync = () => {
    const up = has('ArrowUp', 'KeyW') ? 1 : 0
    const down = has('ArrowDown', 'KeyS') ? 1 : 0
    controls.steer = (has('ArrowRight', 'KeyD') ? 1 : 0) - (has('ArrowLeft', 'KeyA') ? 1 : 0)
    const flying = mode() === 'plane'
    controls.pitch = flying ? up - down : 0
    controls.throttle = flying ? 0 : up
    controls.brake = flying ? 0 : down
  }
  const onDown = (e: KeyboardEvent) => {
    if (!KEYS.has(e.code) || e.altKey || e.ctrlKey || e.metaKey) return
    e.preventDefault()
    held.add(e.code)
    sync()
  }
  const onUp = (e: KeyboardEvent) => {
    if (!held.delete(e.code)) return
    sync()
  }
  const onBlur = () => {
    held.clear()
    sync()
  }
  window.addEventListener('keydown', onDown)
  window.addEventListener('keyup', onUp)
  window.addEventListener('blur', onBlur)
  return () => {
    window.removeEventListener('keydown', onDown)
    window.removeEventListener('keyup', onUp)
    window.removeEventListener('blur', onBlur)
  }
}
