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
