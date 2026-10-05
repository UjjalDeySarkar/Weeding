import type { MotionValue } from 'motion/react'
import type { Point } from '@/lib/spline'
import { dist, lerp, shown, smooth, span, toPath } from './geometry'
import {
  BURSTS,
  CARDS,
  CHAPTER_STARTS,
  camera,
  KM_PER_UNIT,
  LEVELS,
  MEETING,
  PLACES,
  ROUTES,
  STAMP_AT,
  travellers,
  type Mode,
  type Place,
  type Shot,
} from './timeline'

export interface EngineText {
  chapter: (n: number) => string
  title: (n: number) => string
  km: (km: number) => string
  together: string
  count: (n: number) => string
  line: (who: 'groom' | 'bride', chapter: number) => string
  message: string
}

interface Options {
  progress: MotionValue<number>
  reduce: boolean
  text: () => EngineText
}

const VEHICLES: Mode[] = ['bike', 'train', 'car', 'together']

/**
 * Plays the journey on the stage under `root`. Scroll progress drives everything,
 * so scrolling back rewinds; only the butterfly, bubbles and particles also move with time.
 * Returns a cleanup function.
 */
export function runJourney(root: HTMLElement, { progress, reduce, text }: Options) {
  const $ = <T extends Element = SVGGElement>(selector: string) => root.querySelector<T>(selector)!
  const $$ = <T extends Element = SVGGElement>(selector: string) => Array.from(root.querySelectorAll<T>(selector))

  const svg = $<SVGSVGElement>('[data-world]')
  const canvas = $<HTMLCanvasElement>('[data-fx]')
  const ctx = canvas.getContext('2d')!
  const actor = (who: string) => {
    const el = $(`[data-actor="${who}"]`)
    return {
      who,
      el,
      looks: Object.fromEntries($$('[data-look]').filter((n) => el.contains(n)).map((n) => [n.dataset.look!, n])) as Record<string, SVGGElement>,
      parts: (name: string) => $$(`[data-part="${name}"]`).filter((n) => el.contains(n)),
      phase: 0,
      move: 0,
      face: 1,
      last: null as Point | null,
      wave: 0,
      screen: [0, 0] as Point,
      world: [0, 0] as Point,
      visible: false,
    }
  }
  const groom = actor('groom')
  const bride = actor('bride')
  const parents = actor('parents')
  const people = [groom, bride]
  const swing = new Map(people.map((a) => [a, ['legF', 'legB', 'armF', 'armB', 'footF', 'footB', 'body'].map((n) => a.parts(n))]))

  const traces = { groom: $<SVGPathElement>('[data-trace="groom"]'), bride: $<SVGPathElement>('[data-trace="bride"]') }
  const thread = $<SVGPathElement>('[data-thread]')
  const threadHit = $<SVGPathElement>('[data-thread-hit]')
  const threadGroup = $('[data-thread-group]')
  const messages = $$('[data-message]')
  const hearts = $$('[data-heart]').map((el) => ({ el, who: el.dataset.who as 'groom' | 'bride', t: Number(el.dataset.t), got: false, at: [Number(el.dataset.x), Number(el.dataset.y)] as Point }))
  const stamps = $$('[data-stamp]').map((el, i) => ({ el, i, got: false }))
  const badges = $$('[data-badge]')
  const meetPin = $('[data-meetpin]')
  const mandap = $('[data-mandap]')
  const guests = $('[data-guests]')
  const homes = $$('[data-home]')
  const butterfly = $('[data-butterfly]')
  const wings = $$('[data-part="wing"]').filter((n) => butterfly.contains(n))
  const labels = $$<HTMLElement>('[data-label]').map((el) => ({ el, at: [Number(el.dataset.x), Number(el.dataset.y)] as Point, rule: el.dataset.label!, on: false }))
  const cards = $$<HTMLElement>('[data-card]').map((el) => ({ el, inner: el.firstElementChild as HTMLElement, a: Number(el.dataset.a), b: Number(el.dataset.b), o: -1 }))
  const hud = {
    chapter: $<HTMLElement>('[data-hud="chapter"]'),
    title: $<HTMLElement>('[data-hud="title"]'),
    km: $<HTMLElement>('[data-hud="km"]'),
    hearts: $<HTMLElement>('[data-hud="hearts"]'),
    stamps: $<HTMLElement>('[data-hud="stamps"]'),
    stampsPill: $<HTMLElement>('[data-hud="stampsPill"]'),
    bar: $<HTMLElement>('[data-hud="bar"]'),
  }
  const bubbles = { groom: $<HTMLElement>('[data-bubble="groom"]'), bride: $<HTMLElement>('[data-bubble="bride"]') }

  /* ---------- layout ---------- */
  let W = 1
  let H = 1
  let DPR = 1
  let K = 1
  let landscape = false
  let view = { x: 0, y: 0, u: 1 }
  const resize = () => {
    W = root.clientWidth || 1
    H = root.clientHeight || 1
    DPR = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(W * DPR)
    canvas.height = Math.round(H * DPR)
    landscape = W / H > 1.05
    root.dataset.layout = landscape ? 'wide' : 'tall'
    K = Math.min(Math.max(H / 720, 0.85), 1.25)
    svg.style.setProperty('--k', String(K))
    shot = null
  }
  const observer = new ResizeObserver(resize)
  observer.observe(root)

  /** Leave room for the HUD on top and the card below (phones) or beside (wide screens) */
  const frame = () => (landscape ? { x: 0.03, y: 0.15, w: 0.56, h: 0.78 } : { x: 0.05, y: 0.19, w: 0.9, h: 0.32 })
  const applyCamera = (c: Shot) => {
    const f = frame()
    const u = Math.max(c.h / (f.h * H), c.w / (f.w * W))
    const x = c.cx - (f.x + f.w / 2) * W * u
    const y = c.cy - (f.y + f.h / 2) * H * u
    svg.setAttribute('viewBox', `${x.toFixed(2)} ${y.toFixed(2)} ${(W * u).toFixed(2)} ${(H * u).toFixed(2)}`)
    svg.style.setProperty('--u', u.toFixed(5))
    svg.toggleAttribute('data-far', u > 0.75)
    svg.toggleAttribute('data-near', u < 0.3)
    view = { x, y, u }
  }
  const toScreen = ([x, y]: Point): Point => [(x - view.x) / view.u, (y - view.y) / view.u]

  /* ---------- particles ---------- */
  interface Bit {
    kind: 'petal' | 'heart' | 'puff' | 'courier'
    x: number
    y: number
    vx: number
    vy: number
    life: number
    max: number
    size: number
    rot: number
    vr: number
    colour: string
    g: number
    sway: number
    dir: number
  }
  const bits: Bit[] = []
  const PETALS = ['#f0a030', '#e9b93a', '#d9731a', '#fbf5ea', '#a51c1c']
  const spawn = (kind: Bit['kind'], x: number, y: number, n: number, o: Partial<Bit> & { speed?: number; up?: number } = {}) => {
    if (reduce && kind !== 'courier') return
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = (o.speed ?? 160) * (0.4 + Math.random() * 0.8)
      bits.push({
        kind,
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (o.up ?? 60),
        life: o.life ?? 0,
        max: o.max ?? 1.4 + Math.random() * 0.8,
        size: (o.size ?? 5) * (0.7 + Math.random() * 0.6),
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 8,
        colour: PETALS[(Math.random() * PETALS.length) | 0],
        g: o.g ?? 90,
        sway: Math.random() * 6,
        dir: o.dir ?? 1,
      })
    }
  }
  const burst = (x: number, y: number, big = false) => {
    spawn('petal', x, y, big ? 46 : 16, { speed: 190, size: 5, up: 80 })
    spawn('heart', x, y, big ? 8 : 3, { speed: 70, size: 7, g: -30, up: 40 })
  }
  let threadCurve: [Point, Point, Point] | null = null
  const threadPoint = (t: number): Point | null => {
    if (!threadCurve) return null
    const [a, c, b] = threadCurve
    const s = 1 - t
    return [s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]
  }
  const heartPath = (s: number) => {
    ctx.beginPath()
    ctx.moveTo(0, s * 0.35)
    ctx.bezierCurveTo(-s, -s * 0.2, -s * 0.55, -s, 0, -s * 0.45)
    ctx.bezierCurveTo(s * 0.55, -s, s, -s * 0.2, 0, s * 0.35)
    ctx.fill()
  }
  const drawBits = (dt: number) => {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    ctx.clearRect(0, 0, W, H)
    for (let i = bits.length - 1; i >= 0; i--) {
      const q = bits[i]
      q.life += dt
      if (q.life > q.max) {
        bits.splice(i, 1)
        continue
      }
      if (q.life < 0) continue
      const k = q.life / q.max
      if (q.kind === 'courier') {
        const at = threadPoint(q.dir > 0 ? k : 1 - k)
        if (!at) {
          bits.splice(i, 1)
          continue
        }
        ;[q.x, q.y] = toScreen(at)
      } else {
        const drag = Math.exp(-1.6 * dt)
        q.vx *= drag
        q.vy = q.vy * drag + q.g * dt
        q.x += q.vx * dt + (q.kind === 'petal' ? Math.sin(q.life * 4 + q.sway) * 0.6 : 0)
        q.y += q.vy * dt
        q.rot += q.vr * dt
      }
      ctx.globalAlpha = Math.max(0, 1 - k * k)
      ctx.save()
      ctx.translate(q.x, q.y)
      if (q.kind === 'petal') {
        ctx.rotate(q.rot)
        ctx.fillStyle = q.colour
        ctx.beginPath()
        ctx.ellipse(0, 0, q.size, q.size * 0.55, 0, 0, Math.PI * 2)
        ctx.fill()
      } else if (q.kind === 'heart' || q.kind === 'courier') {
        ctx.fillStyle = '#d23a33'
        heartPath(q.size)
      } else {
        ctx.fillStyle = 'rgba(110,98,92,.4)'
        ctx.beginPath()
        ctx.arc(0, 0, q.size * (0.6 + k), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }

  /* ---------- characters ---------- */
  const setT = (nodes: Element[], value: string) => nodes.forEach((n) => n.setAttribute('transform', value))
  type Actor = typeof groom

  function pose(a: Actor, place: Place, world: Point, scale: number, now: number, dt: number, other: Actor | null, show: boolean) {
    const [sx, sy] = toScreen(world)
    if (a.last) {
      const dx = sx - a.last[0]
      const d = Math.hypot(dx, sy - a.last[1])
      a.phase += d * 0.3
      a.move += ((d > 0.25 ? 1 : 0) - a.move) * Math.min(1, dt * 10)
      if (Math.abs(dx) > 0.3) a.face = dx > 0 ? 1 : -1
      else if (a.move < 0.2 && other?.visible) a.face = other.screen[0] > sx ? 1 : -1
    }
    a.last = [sx, sy]
    a.screen = [sx, sy]
    a.world = world
    a.visible = show
    const m = reduce ? 0 : a.move
    const swingAngle = Math.sin(a.phase) * 30 * m
    const parts = swing.get(a)
    if (parts) {
      const [legF, legB, armF, armB, footF, footB, body] = parts
      setT(legF, `rotate(${swingAngle.toFixed(1)} 0 -22)`)
      setT(legB, `rotate(${(-swingAngle).toFixed(1)} 0 -22)`)
      const arm = now < a.wave ? -150 + Math.sin(now / 70) * 18 : -swingAngle * 0.8
      setT(armF, `rotate(${arm.toFixed(1)} 0 -42)`)
      setT(armB, `rotate(${(swingAngle * 0.8).toFixed(1)} 0 -42)`)
      setT(footF, `translate(${(Math.sin(a.phase) * 3 * m).toFixed(2)} 0)`)
      setT(footB, `translate(${(-Math.sin(a.phase) * 3 * m).toFixed(2)} 0)`)
      setT(body, `rotate(${(Math.sin(a.phase) * 2.5 * m).toFixed(2)} 0 -4)`)
    }
    const look = VEHICLES.includes(place.mode) ? place.mode : 'walk'
    for (const [name, node] of Object.entries(a.looks)) node.style.display = name === look ? '' : 'none'
    const s = show ? scale : 0.0001
    a.el.setAttribute('transform', `translate(${world[0].toFixed(2)} ${world[1].toFixed(2)}) scale(${(s * a.face).toFixed(5)} ${s.toFixed(5)})`)
    a.el.style.opacity = show ? '1' : '0'
  }

  const say = (who: 'groom' | 'bride', line: string, ms = 1800) => {
    const b = bubbles[who]
    b.textContent = line
    b.dataset.on = ''
    b.dataset.until = String(performance.now() + ms)
  }
  const chapterAt = (p: number) => CHAPTER_STARTS.reduce((ix, a, i) => (p >= a ? i : ix), 0)

  /* ---------- the frame ---------- */
  let target = progress.get()
  let cur = target
  let last = performance.now()
  let lastP = cur
  let shot: Shot | null = null
  let chapter = -1
  let flyLoop = 0
  let newestStamp = -1
  let running = false
  let raf = 0

  function render(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    target = progress.get()
    cur = reduce ? target : cur + (target - cur) * (1 - Math.exp(-dt * 7))
    if (Math.abs(target - cur) < 0.00002) cur = target
    const p = cur
    const forward = p > lastP
    const T = text()

    const s = travellers(p)
    const tourT = s.groom.leg?.route === ROUTES.tour ? (s.groom.t ?? 0) : p >= 0.64 ? 1 : 0
    const want = camera(p, s.groom.pos, s.bride.pos, s.parents.pos, tourT)
    // The camera eases after its target, which also smooths over any jump between chapters
    if (!shot || reduce) shot = { ...want }
    else {
      const k = 1 - Math.exp(-dt * 6)
      shot = { cx: lerp(shot.cx, want.cx, k), cy: lerp(shot.cy, want.cy, k), w: lerp(shot.w, want.w, k), h: lerp(shot.h, want.h, k) }
    }
    applyCamera(shot)
    const u = view.u
    const S = u * K

    // Side by side when together, facing each other
    let gw: Point = [...s.groom.pos]
    let bw: Point = [...s.bride.pos]
    const together = s.groom.mode === 'together'
    if (p >= 0.926) {
      const walk = smooth(span(p, 0.926, 0.946))
      const spread = lerp(60, 17, walk) * S
      gw = [s.groom.pos[0] - spread, s.groom.pos[1]]
      bw = [s.groom.pos[0] + spread, s.groom.pos[1]]
    } else if (!together) {
      const dx = (gw[0] - bw[0]) / u
      const need = 40 * K
      if (Math.abs(dx) < need && Math.abs((gw[1] - bw[1]) / u) < 30 * K) {
        const side = dx >= 0 ? 1 : -1
        const push = ((need - Math.abs(dx)) / 2) * u
        gw[0] += side * push
        bw[0] -= side * push
        gw[1] = bw[1] = (gw[1] + bw[1]) / 2
      }
    }
    pose(groom, s.groom, gw, S, now, dt, bride, p >= 0.04)
    pose(bride, s.bride, bw, S, now, dt, groom, p >= 0.085 && s.bride.mode !== 'hidden')
    const parentsAt: Point = p > 0.8 ? [s.parents.pos[0] - 46 * S, s.parents.pos[1] + 6 * S] : s.parents.pos
    pose(parents, s.parents, parentsAt, S, now, dt, null, s.parents.mode !== 'hidden')

    // Finale: mala badal, then sindoor daan with shankha-pola
    svg.toggleAttribute('data-garland', p > 0.955)
    svg.toggleAttribute('data-sindoor', p > 0.975)

    // The road being travelled, painted as it goes
    for (const [who, place] of [['groom', s.groom], ['bride', s.bride]] as const) {
      const leg = place.leg
      const going = leg && place.mode !== 'hidden' && place.t !== undefined
      traces[who].setAttribute('d', going ? toPath(leg.route.slice(leg.from ?? 0, place.t!)) : '')
    }

    // Hearts along the first journeys
    let got = 0
    for (const h of hearts) {
      const place = s[h.who]
      const legDone = h.who === 'groom' ? p >= 0.226 : p >= 0.315
      const passing = place.leg && (place.leg.route === ROUTES.toCity || (place.leg.route === ROUTES.herTrain && (place.leg.from ?? 0) === 0)) && (place.t ?? 0) >= h.t
      const on = legDone || !!passing
      if (on) got++
      if (on !== h.got) {
        h.got = on
        h.el.toggleAttribute('data-got', on)
        if (on && forward) {
          const [x, y] = toScreen(h.at)
          spawn('heart', x, y, 5, { speed: 80, size: 6, g: -40, up: 50, max: 0.9 })
        }
      }
      h.el.style.display = p > 0.14 && p < 0.33 ? '' : 'none'
    }
    const levelsDone = LEVELS.filter((l) => p >= l.at).length

    // Travel stamps
    let stamped = 0
    newestStamp = -1
    for (const st of stamps) {
      const on = p >= 0.64 || (tourT >= STAMP_AT[st.i] && p >= 0.553)
      if (on) {
        stamped++
        newestStamp = st.i
      }
      if (on !== st.got) {
        st.got = on
        st.el.toggleAttribute('data-got', on)
        if (on && forward) {
          const [x, y] = toScreen([Number(st.el.dataset.x), Number(st.el.dataset.y)])
          burst(x, y - 10 * K)
        }
      }
      st.el.style.display = p > 0.52 ? '' : 'none'
    }

    // The red thread between them while apart
    const apart = dist(gw, bw) / u > 70 && p > 0.165 && p < 0.858 && bride.visible
    if (apart) {
      const a: Point = [gw[0], gw[1] - 30 * S]
      const b: Point = [bw[0], bw[1] - 30 * S]
      const len = dist(a, b)
      const nx = -(b[1] - a[1]) / (len || 1)
      const ny = (b[0] - a[0]) / (len || 1)
      const sag = Math.min(len * 0.16, 60)
      const c: Point = [(a[0] + b[0]) / 2 + nx * sag, (a[1] + b[1]) / 2 + ny * sag]
      threadCurve = [a, c, b]
      const d = `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`
      thread.setAttribute('d', d)
      threadHit.setAttribute('d', d)
    } else threadCurve = null
    threadGroup.style.opacity = apart ? String(shown(p, 0.165, 0.858, 0.012)) : '0'
    threadHit.style.display = apart ? '' : 'none'
    const chatting = threadCurve && ((p > 0.4 && p < 0.53) || (p > 0.67 && p < 0.745))
    messages.forEach((m, i) => {
      if (!chatting) {
        m.style.display = 'none'
        return
      }
      let t = ((now / 1000) * 0.16 + i / 3) % 1
      if (i % 2) t = 1 - t
      const [x, y] = threadPoint(t)!
      m.style.display = ''
      m.setAttribute('transform', `translate(${x} ${y}) scale(${S})`)
    })

    // Level badges: thread midpoint for the moments without a known place, above them otherwise
    badges.forEach((badge, i) => {
      const level = LEVELS[i]
      const end = CARDS.find((c) => c.motif === level.motif)!.b
      const on = p >= level.at && p < end
      badge.toggleAttribute('data-hidden', !on)
      const mid = threadPoint(0.5)
      const spot: Point = i >= 2 || !mid ? [PLACES.brideHome[0], PLACES.brideHome[1] - 118 * S] : [mid[0], mid[1] - 16 * S]
      badge.setAttribute('transform', `translate(${spot[0]} ${spot[1]}) scale(${S})`)
    })

    // Meeting pin, homes, the celebration, the mandap
    meetPin.toggleAttribute('data-hidden', !(p > 0.25 && p < 0.4))
    meetPin.toggleAttribute('data-met', p >= BURSTS.meeting)
    meetPin.querySelector('[data-part="lift"]')?.setAttribute('transform', `translate(0 ${(-104 * smooth(span(p, 0.312, 0.33))).toFixed(1)})`)
    homes.forEach((h) => h.toggleAttribute('data-hidden', p > 0.858))
    guests.toggleAttribute('data-hidden', !(p > 0.8 && p < 0.856))
    mandap.toggleAttribute('data-hidden', p < 0.928)

    // Prajapati flies along the thread, circles the meeting, then the mandap
    const flying = (p > 0.165 && p < 0.39) || p > 0.94
    butterfly.style.display = flying ? '' : 'none'
    if (flying) {
      const tt = now / 1000
      let fx: number
      let fy: number
      const mid = threadPoint(0.5 + 0.18 * Math.sin(tt * 0.8))
      if (p < 0.316 && mid) {
        fx = mid[0] + Math.sin(tt * 2.1) * 16 * S
        fy = mid[1] - 26 * S + Math.cos(tt * 1.7) * 10 * S
      } else {
        const c = p < 0.5 ? MEETING : PLACES.venue
        const r = (p < 0.5 ? 34 : 50) * S
        fx = c[0] + Math.cos(tt * 1.3) * r
        fy = c[1] - (p < 0.5 ? 122 : 116) * S + Math.sin(tt * 2.6) * 10 * S
      }
      if (now < flyLoop) {
        const k = (flyLoop - now) / 1200
        fx += Math.cos(k * Math.PI * 4) * 24 * S
        fy += Math.sin(k * Math.PI * 4) * 24 * S
      }
      butterfly.setAttribute('transform', `translate(${fx} ${fy}) scale(${S * 0.9})`)
      const flap = reduce ? 0.8 : 0.25 + 0.75 * Math.abs(Math.sin(tt * 11))
      setT(wings, `scale(${flap} 1)`)
    }

    // Smoke from trains
    if (!reduce && Math.abs(p - lastP) > 0.00005) {
      for (const a of [groom, bride]) {
        const place = a === groom ? s.groom : s.bride
        if ((place.mode === 'train' || place.mode === 'together') && Math.random() < dt * 9) {
          spawn('puff', a.screen[0] + a.face * 34 * K, a.screen[1] - 24 * K, 1, { speed: 10, size: 4, g: -30, up: 20, max: 1.1 })
        }
      }
    }

    // Celebrations, only when moving forward
    if (forward) {
      const crossed = (at: number) => lastP < at && p >= at
      if (crossed(BURSTS.meeting)) burst(...toScreen([MEETING[0], MEETING[1] - 40 * S]), true)
      LEVELS.forEach((l) => {
        if (crossed(l.at)) burst(...toScreen(l.motif === 'homes' ? [PLACES.brideHome[0], PLACES.brideHome[1] - 40 * S] : [(gw[0] + bw[0]) / 2, Math.min(gw[1], bw[1]) - 50 * S]), l.motif === 'homes')
      })
      if (crossed(BURSTS.wedding)) burst(...toScreen([PLACES.venue[0], PLACES.venue[1] - 60 * S]), true)
    }
    if (!reduce && p > 0.95 && Math.random() < dt * 22) spawn('petal', Math.random() * W, -10, 1, { speed: 20, size: 5, g: 40, up: -30, max: 4 })

    // Place names
    for (const l of labels) {
      const on = labelShown(l.rule, p, u)
      const [x, y] = toScreen(l.at)
      l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, 0)`
      if (on !== l.on) {
        l.on = on
        l.el.style.opacity = on ? '1' : '0'
      }
    }

    // Cards
    for (const c of cards) {
      const o = shown(p, c.a, c.b)
      if (Math.abs(o - c.o) < 0.004) continue
      c.o = o
      c.inner.style.opacity = o.toFixed(3)
      c.inner.style.transform = `translateY(${((1 - o) * 14).toFixed(1)}px)`
      c.el.style.visibility = o > 0.02 ? 'visible' : 'hidden'
    }

    // HUD
    const ix = chapterAt(p)
    if (ix !== chapter) {
      chapter = ix
      hud.chapter.textContent = T.chapter(ix + 1)
      hud.title.textContent = T.title(ix)
    }
    const km = Math.round(dist(s.groom.pos, s.bride.pos) * KM_PER_UNIT)
    const close = together || km < 3 || p >= 0.926
    hud.km.textContent = close ? T.together : T.km(km)
    hud.hearts.textContent = T.count(got + levelsDone)
    hud.stamps.textContent = T.count(stamped)
    hud.stampsPill.style.display = p >= 0.53 ? '' : 'none'
    hud.bar.style.width = `${(p * 100).toFixed(2)}%`

    for (const [who, a] of [['groom', groom], ['bride', bride]] as const) {
      const b = bubbles[who]
      if (b.dataset.on !== undefined && now > Number(b.dataset.until)) delete b.dataset.on
      b.style.transform = `translate(${a.screen[0].toFixed(1)}px, ${(a.screen[1] - 98 * K).toFixed(1)}px) translate(-50%, -100%)`
    }

    drawBits(dt)
    lastP = p
  }

  function labelShown(rule: string, p: number, u: number) {
    switch (rule) {
      case 'groomHome':
        return p < 0.92
      case 'brideHome':
        return true
      case 'city':
        return p > 0.13 && p < 0.86 && !(p > 0.255 && p < 0.396)
      case 'meeting':
        return p > 0.27 && p < 0.39
      case 'stamp0':
      case 'stamp1':
      case 'stamp2':
      case 'stamp3':
      case 'stamp4':
        return p > 0.553 && p < 0.668 && Number(rule.slice(5)) === newestStamp
      case 'venue':
        return p > 0.93
      case 'minor':
        return u > 0.55 && p < 0.9
      default:
        return u > 0.8 && !(p > 0.25 && p < 0.4)
    }
  }

  /* ---------- run only while on screen ---------- */
  const loop = (now: number) => {
    if (!running) return
    render(now)
    raf = requestAnimationFrame(loop)
  }
  const visibility = new IntersectionObserver(([entry]) => {
    const was = running
    running = entry.isIntersecting
    if (running && !was) {
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    if (!running) cancelAnimationFrame(raf)
  })
  visibility.observe(root)

  /* ---------- taps ---------- */
  const onTap = (event: MouseEvent) => {
    const el = event.target as Element
    const r = root.getBoundingClientRect()
    const T = text()
    const ix = chapterAt(cur)
    if (el.closest('[data-actor="groom"]')) {
      groom.wave = performance.now() + 1300
      say('groom', T.line('groom', ix))
      burst(groom.screen[0], groom.screen[1] - 50 * K)
    } else if (el.closest('[data-actor="bride"]')) {
      bride.wave = performance.now() + 1300
      say('bride', T.line('bride', ix))
      burst(bride.screen[0], bride.screen[1] - 50 * K)
    } else if (el.closest('[data-butterfly]')) flyLoop = performance.now() + 1200
    else if (el.closest('[data-thread-hit]')) {
      const dir = Math.random() < 0.5 ? 1 : -1
      for (let i = 0; i < 3; i++) spawn('courier', 0, 0, 1, { life: -i * 0.12, max: 1.5, size: 7, dir })
      ;(dir > 0 ? bride : groom).wave = performance.now() + 1500
      say(dir > 0 ? 'bride' : 'groom', T.message, 1500)
    } else if (el.closest('[data-act="hello"]')) {
      groom.wave = bride.wave = performance.now() + 1600
      say('groom', T.line('groom', 2))
      setTimeout(() => say('bride', T.line('bride', 2)), 700)
      burst((groom.screen[0] + bride.screen[0]) / 2, (groom.screen[1] + bride.screen[1]) / 2 - 60 * K, true)
    } else if (!el.closest('a, button, [data-card]')) burst(event.clientX - r.left, event.clientY - r.top)
  }
  root.addEventListener('click', onTap)

  resize()
  render(performance.now())

  return () => {
    running = false
    cancelAnimationFrame(raf)
    observer.disconnect()
    visibility.disconnect()
    root.removeEventListener('click', onTap)
  }
}
