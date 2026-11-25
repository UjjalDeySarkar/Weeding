import {
  AnimationMixer,
  CanvasTexture,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  Vector3,
  type AnimationAction,
  type Group,
  type Material,
  type Object3D,
} from 'three'
import type { Character } from '../trips'
import { spawn, type Model } from './assets'

/**
 * Animated people. Clip names in the models look like "HumanArmature|Man_Walk";
 * they're keyed here by their last word: Walk, Sitting, Clapping…
 */
const clipKey = (name: string) => name.split('|').pop()!.replace(/^(Man|Female)_/, '')

export class Animated {
  readonly object: Group
  private readonly mixer: AnimationMixer
  private readonly actions = new Map<string, AnimationAction>()
  private current: AnimationAction | null = null

  constructor(model: Model) {
    this.object = spawn(model)
    this.mixer = new AnimationMixer(this.object)
    for (const clip of model.clips) this.actions.set(clipKey(clip.name), this.mixer.clipAction(clip))
  }

  /** Cross-fades to a clip; `speed` scales its playback */
  play(name: string, { fade = 0.25, speed = 1 } = {}) {
    const next = this.actions.get(name)
    if (!next || next === this.current) {
      if (next) next.timeScale = speed
      return
    }
    next.reset()
    next.timeScale = speed
    next.play()
    if (this.current) next.crossFadeFrom(this.current, fade, false)
    this.current = next
  }

  /** Holds the clip's last frame instead of looping (e.g. sitting down) */
  hold(name: string, at: number) {
    const action = this.actions.get(name)
    if (!action) return
    this.play(name)
    action.time = at
    action.timeScale = 0
  }

  update(dt: number) {
    this.mixer.update(dt)
  }

  dispose() {
    this.mixer.stopAllAction()
    this.mixer.uncacheRoot(this.object)
  }
}

// ─── Clothes ─────────────────────────────────────────────────────────────────

interface Recolour {
  /** Hue range in degrees */
  hue: [number, number]
  minSaturation: number
  colour: [number, number, number]
}

function hsl(r: number, g: number, b: number) {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const [rr, gg, bb] = [r / 255, g / 255, b / 255]
  let h = max === rr ? (gg - bb) / d + (gg < bb ? 6 : 0) : max === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4
  h *= 60
  return [h, s, l]
}

/** Repaints colour-palette cells of a character's texture, e.g. a green shirt into a cream panjabi */
function repaint(object: Object3D, rules: Recolour[]) {
  const copies = new Map<Material, Material>()
  object.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const original = node.material as MeshLambertMaterial
    let copy = copies.get(original)
    if (!copy) {
      const map = original.map
      const image = map?.image as (CanvasImageSource & { width: number; height: number }) | undefined
      if (!map || !image) return
      const el = document.createElement('canvas')
      el.width = image.width
      el.height = image.height
      const ctx = el.getContext('2d')!
      ctx.drawImage(image, 0, 0)
      const pixels = ctx.getImageData(0, 0, el.width, el.height)
      const d = pixels.data
      for (let i = 0; i < d.length; i += 4) {
        const [h, s] = hsl(d[i], d[i + 1], d[i + 2])
        const rule = rules.find((r) => h >= r.hue[0] && h <= r.hue[1] && s >= r.minSaturation)
        if (rule) [d[i], d[i + 1], d[i + 2]] = rule.colour
      }
      ctx.putImageData(pixels, 0, 0)
      const tex = new CanvasTexture(el)
      tex.flipY = map.flipY
      tex.colorSpace = map.colorSpace
      tex.magFilter = map.magFilter
      tex.minFilter = map.minFilter
      tex.wrapS = map.wrapS
      tex.wrapT = map.wrapT
      const material = original.clone()
      material.map = tex
      material.userData.shared = false
      copies.set(original, (copy = material))
    }
    node.material = copy
  })
}

const OUTFITS: Record<Character, Recolour[]> = {
  // Green shirt → cream panjabi, blue jeans → white pyjama
  man: [
    { hue: [60, 170], minSaturation: 0.05, colour: [239, 227, 196] },
    { hue: [190, 270], minSaturation: 0.08, colour: [244, 240, 230] },
  ],
  // Dark red dress → sindoor red
  woman: [{ hue: [0, 12], minSaturation: 0.3, colour: [165, 28, 28] }],
}

/** The guest: dressed for a Bengali wedding, with a helmet for the bike */
export class Guest extends Animated {
  private readonly helmet: Mesh

  constructor(model: Model, character: Character) {
    super(model)
    repaint(this.object, OUTFITS[character])
    this.helmet = new Mesh(new SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), new MeshLambertMaterial({ color: '#a51c1c' }))
    this.helmet.visible = false
    let head: Object3D | undefined
    this.object.traverse((node) => {
      if (!head && /head/i.test(node.name) && !(node instanceof Mesh)) head = node
    })
    if (head) {
      head.add(this.helmet)
      // Undo the bone's scale so the helmet is a real helmet's size
      this.object.updateMatrixWorld(true)
      const scale = head.getWorldScale(new Vector3())
      this.helmet.scale.set(1 / scale.x, 1 / scale.y, 1 / scale.z)
      this.helmet.position.set(0, 0.06 / scale.y, 0.01 / scale.z)
    }
    this.play('Idle')
  }

  wearHelmet(on: boolean) {
    this.helmet.visible = on
  }

  dispose() {
    super.dispose()
    this.helmet.geometry.dispose()
    ;(this.helmet.material as Material).dispose()
  }
}
