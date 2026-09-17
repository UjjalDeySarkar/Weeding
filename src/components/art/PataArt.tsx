import type { ReactNode } from 'react'
import type { StoryMotif } from '@/config/types'
import { cn } from '@/lib/utils'

/*
 * Patachitra (পটচিত্র) panels: Bengal's painted story scrolls.
 * Bold ink outlines over flat natural colours: haldi, sindoor, neel (indigo) and leaf green.
 */

const INK = 'stroke-ink'
const leafPath = 'M0 0 C 5 -6 14 -6 18 0 C 14 6 5 6 0 0 Z'

function Leaf({ x, y, angle = 0, scale = 1 }: { x: number; y: number; angle?: number; scale?: number }) {
  return (
    <path
      d={leafPath}
      transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}
      className={cn('fill-leaf', INK)}
      strokeWidth={1.4 / scale}
    />
  )
}

function Rosette({ x, y, r = 7, className = 'fill-sindoor' }: { x: number; y: number; r?: number; className?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} className={INK} strokeWidth={1.1}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cy={-r * 0.55} rx={r * 0.3} ry={r * 0.55} transform={`rotate(${a})`} className={className} />
      ))}
      <circle r={r * 0.28} className="fill-haldi" />
    </g>
  )
}

/** Four-point twinkle */
function Twinkle({ x, y, s = 5 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d={`M0 ${-s} Q 0 0 ${s} 0 Q 0 0 0 ${s} Q 0 0 ${-s} 0 Q 0 0 0 ${-s} Z`}
      transform={`translate(${x} ${y})`}
      className="fill-zari-light"
    />
  )
}

function Frame({ ground, corners, children }: { ground: string; corners: string; children: ReactNode }) {
  return (
    <>
      <rect width="200" height="160" className={ground} />
      <rect
        x="7"
        y="7"
        width="186"
        height="146"
        fill="none"
        className="stroke-paper/70"
        strokeWidth="2"
        strokeDasharray="0 6"
        strokeLinecap="round"
      />
      {children}
      {[
        [15, 15],
        [185, 15],
        [15, 145],
        [185, 145],
      ].map(([x, y]) => (
        <Rosette key={`${x}-${y}`} x={x} y={y} r={6} className={corners} />
      ))}
    </>
  )
}

/** Bird facing right, feet at the origin */
function Bird({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`} className={INK} strokeWidth={1.8} strokeLinejoin="round">
      <path d="M2 -9 L0 0 M9 -9 L9 0" fill="none" strokeWidth={2} strokeLinecap="round" />
      <path
        d="M-14 -22 C -28 -32 -40 -46 -48 -42 C -44 -32 -38 -24 -28 -18 C -40 -18 -48 -10 -48 -3 C -38 -5 -24 -9 -12 -14 Z"
        className="fill-leaf"
      />
      <path d="M-20 -24 L-40 -38 M-22 -16 L-42 -8" fill="none" strokeWidth={1} />
      <path d="M-16 -18 C -18 -36 0 -46 14 -40 C 24 -35 27 -24 22 -15 C 14 -5 -8 -4 -16 -18 Z" className="fill-sindoor" />
      <circle cx="18" cy="-46" r="10" className="fill-sindoor" />
      <path d="M13 -55 C 10 -63 15 -67 18 -60" fill="none" />
      <path d="M27 -49 L38 -45 L27 -41 Z" className="fill-marigold" />
      <path d="M-8 -26 C -2 -36 12 -36 16 -26 C 10 -18 -2 -16 -8 -26 Z" className="fill-paper" />
      <path d="M-3 -26 q 3 4 6 0 q 3 4 6 0" fill="none" strokeWidth={1} />
      <ellipse cx="20" cy="-47" rx="4" ry="2.8" className="fill-paper" strokeWidth={1.2} />
      <circle cx="21" cy="-47" r="1.7" className="fill-ink" stroke="none" />
      <path d="M16 -47 L11 -48.5" fill="none" strokeWidth={1.2} />
      {[
        [2, -12],
        [9, -11],
        [15, -14],
      ].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="1.3" className="fill-paper" stroke="none" />
      ))}
    </g>
  )
}

/** 2023: two birds find each other on one branch */
function Birds() {
  return (
    <Frame ground="fill-haldi" corners="fill-sindoor">
      <path d="M16 112 C 60 102 140 102 184 112" fill="none" className={INK} strokeWidth={7} strokeLinecap="round" />
      <path d="M16 112 C 60 102 140 102 184 112" fill="none" className="stroke-marigold-deep" strokeWidth={4} strokeLinecap="round" />
      <Leaf x={34} y={110} angle={140} />
      <Leaf x={58} y={106} angle={60} scale={0.8} />
      <Leaf x={100} y={104} angle={90} scale={0.9} />
      <Leaf x={142} y={106} angle={120} scale={0.8} />
      <Leaf x={168} y={110} angle={40} />
      <Bird x={58} y={106} />
      <Bird x={142} y={106} flip />
      <g transform="translate(100 44)" className={INK} strokeWidth={1.6} strokeLinejoin="round">
        {[-42, 42, 0].map((a) => (
          <path key={a} d="M0 0 C 7 -8 7 -20 0 -28 C -7 -20 -7 -8 0 0 Z" transform={`rotate(${a})`} className="fill-paper" />
        ))}
        <path d="M0 -4 C 3 -9 3 -16 0 -21 C -3 -16 -3 -9 0 -4 Z" className="fill-sindoor" strokeWidth={1} />
        <circle r="3.5" className="fill-sindoor" />
      </g>
      <Twinkle x={70} y={34} s={4} />
      <Twinkle x={130} y={34} s={4} />
      <circle cx="100" cy="132" r="2" className="fill-sindoor" />
      <circle cx="88" cy="136" r="1.5" className="fill-sindoor" />
      <circle cx="112" cy="136" r="1.5" className="fill-sindoor" />
    </Frame>
  )
}

/** 2024: a ring rises from a lotus */
function Ring() {
  const petals = [
    { a: -62, s: 0.78, fill: 'fill-paper' },
    { a: 62, s: 0.78, fill: 'fill-paper' },
    { a: -32, s: 0.92, fill: 'fill-zari-light' },
    { a: 32, s: 0.92, fill: 'fill-zari-light' },
    { a: 0, s: 1, fill: 'fill-paper' },
  ]
  return (
    <Frame ground="fill-sindoor" corners="fill-haldi">
      <ellipse cx="44" cy="136" rx="26" ry="8" className={cn('fill-leaf', INK)} strokeWidth={1.6} />
      <ellipse cx="156" cy="136" rx="26" ry="8" className={cn('fill-leaf', INK)} strokeWidth={1.6} />
      <path d="M44 136 L60 132 M156 136 L140 132" className={INK} strokeWidth={1} />
      <g transform="translate(100 138)" className={INK} strokeWidth={1.6} strokeLinejoin="round">
        {petals.map(({ a, s, fill }) => (
          <g key={a} transform={`rotate(${a}) scale(${s})`}>
            <path d="M0 0 C 12 -12 12 -32 0 -46 C -12 -32 -12 -12 0 0 Z" className={fill} />
            <path d="M0 -6 L0 -36" strokeWidth={0.9} className="stroke-sindoor" />
          </g>
        ))}
      </g>
      <g className={INK} strokeLinecap="round">
        <circle cx="100" cy="66" r="20" fill="none" strokeWidth={10} />
        <circle cx="100" cy="66" r="20" fill="none" className="stroke-zari" strokeWidth={6} />
        <path d="M86 58 A 17 17 0 0 1 96 50" fill="none" className="stroke-zari-light" strokeWidth={1.6} />
        <path d="M100 30 L111 40 L100 52 L89 40 Z" className="fill-paper" strokeWidth={1.8} strokeLinejoin="round" />
        <path d="M89 40 L111 40 M95 40 L100 52 L105 40 M95 40 L100 30 L105 40" fill="none" strokeWidth={0.9} />
      </g>
      <Twinkle x={64} y={40} s={6} />
      <Twinkle x={138} y={50} s={5} />
      <Twinkle x={70} y={92} s={4} />
      <Twinkle x={134} y={90} s={6} />
      <Twinkle x={120} y={26} s={3} />
    </Frame>
  )
}

const waves = (y: number, from = 8) => `M${from} ${y}` + ' q 7 -7 14 0'.repeat(13)

/** 2025: the first journey, on a painted Bengal nouka */
function Boat() {
  return (
    <Frame ground="fill-neel" corners="fill-haldi">
      <g transform="translate(160 36)" className={INK} strokeWidth={1.4}>
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d="M-3 -14 L0 -21 L3 -14 Z" transform={`rotate(${i * 36})`} className="fill-marigold" />
        ))}
        <circle r="11" className="fill-haldi" />
        <path d="M-4 -2 h2 M2 -2 h2 M-3 4 q 3 2 6 0" fill="none" strokeWidth={1.2} strokeLinecap="round" />
      </g>
      <path d="M34 34 q 5 -5 10 0 q 5 -5 10 0 M58 50 q 4 -4 8 0 q 4 -4 8 0" fill="none" className="stroke-paper" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M100 82 L100 20" className={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M103 22 C 128 30 136 54 130 74 L103 72 Z" className={cn('fill-paper', INK)} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M104 34 C 116 38 124 44 128 52 M104 48 C 116 50 124 56 130 62 M104 60 C 114 62 122 66 130 70" fill="none" className="stroke-sindoor" strokeWidth={1.4} />
      <path d="M100 20 L86 24 L100 28" className={cn('fill-sindoor', INK)} strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M72 112 L72 92 C 72 74 128 74 128 92 L128 112 Z" className={cn('fill-sindoor', INK)} strokeWidth={1.8} />
      <path d="M78 90 C 80 80 120 80 122 90 M76 98 C 80 88 120 88 124 98" fill="none" className="stroke-haldi" strokeWidth={1.4} />
      <path d="M88 112 L88 102 C 88 94 112 94 112 102 L112 112 Z" className="fill-ink" />
      <path
        d="M20 94 C 38 108 70 112 100 112 C 130 112 162 108 180 94 C 176 110 158 124 136 126 L64 126 C 42 124 24 110 20 94 Z"
        className={cn('fill-marigold-deep', INK)}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d="M32 106 C 66 118 134 118 168 106" fill="none" className="stroke-haldi" strokeWidth={2.4} strokeDasharray="5 4" />
      <ellipse cx="162" cy="108" rx="4.5" ry="3" className={cn('fill-paper', INK)} strokeWidth={1.2} />
      <circle cx="163" cy="108" r="1.6" className="fill-ink" />
      <g fill="none" strokeWidth={2} strokeLinecap="round">
        <path d={waves(134)} className="stroke-paper/80" />
        <path d={waves(146, 1)} className="stroke-paper/50" />
      </g>
      <g className={INK} strokeWidth={1.2} strokeLinejoin="round">
        <path d="M40 142 C 48 136 58 136 64 140 L70 136 L69 144 L64 142 C 58 148 48 148 40 142 Z" className="fill-haldi" />
        <path d="M164 138 C 156 132 148 132 142 136 L136 132 L137 140 L142 138 C 148 144 156 144 164 138 Z" className="fill-haldi" />
      </g>
    </Frame>
  )
}

/** Bengali do-chala hut with a thatched, curved roof */
function Hut({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`} className={INK} strokeWidth={1.8} strokeLinejoin="round">
      <rect x="-30" y="82" width="60" height="46" className="fill-paper" />
      <rect x="-30" y="121" width="60" height="7" className="fill-sindoor" />
      <path d="M-8 121 L-8 102 Q 0 92 8 102 L8 121 Z" className="fill-sindoor-deep" />
      <path d="M-24 96 h8 M-24 104 h8 M16 96 h8 M16 104 h8" strokeWidth={1.2} className="stroke-sindoor" />
      <path d="M-40 88 C -28 54 28 54 40 88 C 24 78 -24 78 -40 88 Z" className="fill-haldi" />
      <path
        d="M-28 76 l-3 6 M-18 70 l-2 7 M-8 67 l-1 7 M2 66 l0 7 M12 68 l1 7 M22 72 l2 6 M31 78 l3 5"
        strokeWidth={1}
        className="stroke-marigold-deep"
      />
    </g>
  )
}

/** 2026: two homes, one courtyard */
function Homes() {
  const garland = 'M50 66 Q 100 100 150 66'
  return (
    <Frame ground="fill-leaf" corners="fill-haldi">
      <rect x="7" y="128" width="186" height="25" className="fill-marigold-deep" />
      <path d="M7 128 H193" className={INK} strokeWidth={2} />
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i} cx={16 + i * 11.2} cy={140} r={1.6} className="fill-paper" />
      ))}
      <Hut x={46} />
      <Hut x={154} />
      <g className={INK} strokeWidth={1.6} strokeLinejoin="round">
        <rect x="90" y="110" width="20" height="18" className="fill-sindoor" />
        <rect x="86" y="105" width="28" height="6" className="fill-paper" />
        <path d="M94 118 h12" strokeWidth={1} className="stroke-haldi" />
        <path d="M100 105 L100 84" strokeWidth={1.4} />
      </g>
      <Leaf x={100} y={100} angle={-150} scale={0.7} />
      <Leaf x={100} y={96} angle={-30} scale={0.7} />
      <Leaf x={100} y={90} angle={-140} scale={0.6} />
      <Leaf x={100} y={87} angle={-40} scale={0.6} />
      <path d="M90 132 C 90 128 96 126 100 128 C 104 126 110 128 110 132 Z" className={cn('fill-haldi', INK)} strokeWidth={1.2} />
      <path d="M100 126 C 97 122 99 118 100 116 C 101 118 103 122 100 126 Z" className="fill-marigold" />
      <path d={garland} fill="none" className={INK} strokeWidth={1} />
      {/* marigolds strung along the garland's curve */}
      {Array.from({ length: 10 }, (_, i) => {
        const t = 0.05 + i * 0.1
        const x = (1 - t) ** 2 * 50 + 2 * (1 - t) * t * 100 + t ** 2 * 150
        const y = (1 - t) ** 2 * 66 + 2 * (1 - t) * t * 100 + t ** 2 * 66
        return (
          <circle key={i} cx={x} cy={y} r={4} className={cn(i % 2 ? 'fill-haldi' : 'fill-marigold', INK)} strokeWidth={1} />
        )
      })}
      <Rosette x={100} y={40} r={9} className="fill-paper" />
      <Twinkle x={76} y={30} s={4} />
      <Twinkle x={124} y={30} s={4} />
    </Frame>
  )
}

/** Gold ring with a stone set on top */
function GoldRing({ cx, cy, stone }: { cx: number; cy: number; stone: string }) {
  return (
    <g strokeLinecap="round">
      <circle cx={cx} cy={cy} r="18" fill="none" className={INK} strokeWidth={9} />
      <circle cx={cx} cy={cy} r="18" fill="none" className="stroke-zari" strokeWidth={5} />
      <path d={`M${cx - 14} ${cy - 8} A 16 16 0 0 1 ${cx - 5} ${cy - 15}`} fill="none" className="stroke-zari-light" strokeWidth={1.4} />
      <path
        d={`M${cx} ${cy - 29} L${cx + 6} ${cy - 23} L${cx} ${cy - 16} L${cx - 6} ${cy - 23} Z`}
        className={cn(stone, INK)}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <path d={`M${cx - 2} ${cy - 25} L${cx} ${cy - 27}`} className="stroke-paper" strokeWidth={1} />
    </g>
  )
}

/** 2026: rings exchanged over a brass thala of paan, dhaan and durba */
function Rings() {
  const grains: Array<[number, number, number]> = [
    [92, 121, 20],
    [96, 124, -30],
    [100, 120, 60],
    [104, 124, 10],
    [108, 121, -50],
    [98, 127, 80],
    [103, 128, -15],
    [94, 128, 40],
  ]
  return (
    <Frame ground="fill-ink" corners="fill-haldi">
      <g className={INK} strokeWidth={1.8}>
        <ellipse cx="100" cy="122" rx="64" ry="15" className="fill-zari" />
        <ellipse cx="100" cy="120" rx="52" ry="10" className="fill-zari-light" strokeWidth={1.2} />
      </g>
      {Array.from({ length: 14 }, (_, i) => {
        const a = Math.PI * (0.08 + (i / 13) * 0.84)
        return <circle key={i} cx={100 - 58 * Math.cos(a)} cy={122 + 12.5 * Math.sin(a)} r="1.1" className="fill-sindoor-deep" />
      })}
      <Leaf x={78} y={118} angle={-165} scale={1.9} />
      <Leaf x={122} y={118} angle={-15} scale={1.9} />
      <g fill="none" className="stroke-leaf" strokeWidth={1.4} strokeLinecap="round">
        <path d="M100 124 C 98 116 94 110 88 106" />
        <path d="M100 124 C 101 114 104 108 110 104" />
        <path d="M100 124 C 100 116 100 110 99 102" />
      </g>
      {grains.map(([x, y, a]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2" ry="1" transform={`rotate(${a} ${x} ${y})`} className={cn('fill-haldi', INK)} strokeWidth={0.5} />
      ))}

      <GoldRing cx={112} cy={70} stone="fill-paper" />
      <GoldRing cx={88} cy={70} stone="fill-sindoor" />
      {/* the right ring passes in front at the lower crossing, so the two read as linked */}
      <g fill="none">
        <path d="M103 85.6 A 18 18 0 0 1 97.3 80.3" className={INK} strokeWidth={9} />
        <path d="M103 85.6 A 18 18 0 0 1 97.3 80.3" className="stroke-zari" strokeWidth={5} />
      </g>

      <Twinkle x={56} y={46} s={6} />
      <Twinkle x={146} y={40} s={5} />
      <Twinkle x={62} y={84} s={4} />
      <Twinkle x={140} y={86} s={5} />
      <Twinkle x={100} y={30} s={3} />
      {[
        [40, 66, 20],
        [160, 64, -30],
        [34, 100, 60],
        [168, 98, -10],
      ].map(([x, y, a]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2" ry="4" transform={`rotate(${a} ${x} ${y})`} className="fill-marigold" />
      ))}
    </Frame>
  )
}

/** 2027: the groom's shola topor and the bride's mukut */
function Crowns() {
  return (
    <Frame ground="fill-sindoor-deep" corners="fill-haldi">
      <path d="M7 16 H193" className="stroke-zari" strokeWidth={1} />
      {Array.from({ length: 11 }, (_, i) => (
        <Leaf key={i} x={22 + i * 15.6} y={16} angle={90} scale={0.9} />
      ))}
      <rect x="30" y="128" width="140" height="12" rx="3" className={cn('fill-haldi', INK)} strokeWidth={1.8} />
      <path d="M38 134 h124" className="stroke-sindoor" strokeWidth={2} strokeDasharray="1 6" strokeLinecap="round" />

      <g transform="translate(70 0)" className={INK} strokeWidth={1.8} strokeLinejoin="round">
        <path d="M-17 116 L17 116 L7 46 Q 0 32 -7 46 Z" className="fill-paper" />
        <path d="M-15 100 q 3.75 -5 7.5 0 t 7.5 0 t 7.5 0 t 7.5 0 M-12.5 82 q 3.1 -5 6.25 0 t 6.25 0 t 6.25 0 t 6.25 0 M-10 64 q 2.5 -4 5 0 t 5 0 t 5 0 t 5 0" fill="none" strokeWidth={1.1} />
        {[108, 91, 73, 56].map((y) => (
          <path key={y} d={`M0 ${y - 4} L3 ${y} L0 ${y + 4} L-3 ${y} Z`} className="fill-zari" strokeWidth={0.9} />
        ))}
        <path d="M-20 128 L20 128 L17 114 L-17 114 Z" className="fill-paper" />
        <path d="M-15 121 h30" strokeWidth={1} strokeDasharray="2 3" className="stroke-sindoor" />
        <circle cy="38" r="2.6" className="fill-zari" strokeWidth={1.1} />
      </g>

      <g transform="translate(130 0)" className={INK} strokeWidth={1.8} strokeLinejoin="round">
        <path
          d="M-21 116 C -26 100 -20 88 -13 82 C -11 93 -7 95 -5 84 C -5 72 0 64 0 56 C 0 64 5 72 5 84 C 7 95 11 93 13 82 C 20 88 26 100 21 116 Z"
          className="fill-paper"
        />
        <path d="M-15 106 C -8 98 8 98 15 106" fill="none" strokeWidth={1.1} />
        <circle cy="96" r="5" className="fill-zari" strokeWidth={1.2} />
        <circle cy="96" r="1.8" className="fill-sindoor" stroke="none" />
        {[
          [-13, 94],
          [13, 94],
          [-3, 76],
          [3, 76],
          [0, 66],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" className="fill-sindoor" stroke="none" />
        ))}
        <path d="M-23 128 L23 128 L21 114 L-21 114 Z" className="fill-paper" />
        <path d="M-18 121 h36" strokeWidth={1} strokeDasharray="2 3" className="stroke-sindoor" />
      </g>

      <Rosette x={100} y={74} r={8} className="fill-marigold" />
      {[
        [96, 102, 20],
        [106, 110, -30],
        [99, 121, 60],
        [40, 50, 10],
        [160, 48, -40],
        [34, 96, 70],
        [166, 92, -10],
      ].map(([x, y, a]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2" ry="4" transform={`rotate(${a} ${x} ${y})`} className="fill-marigold" />
      ))}
      <Twinkle x={100} y={46} s={5} />
    </Frame>
  )
}

const ART: Record<StoryMotif, () => ReactNode> = {
  birds: Birds,
  ring: Ring,
  boat: Boat,
  homes: Homes,
  rings: Rings,
  crowns: Crowns,
}

export function PataArt({ motif, className }: { motif: StoryMotif; className?: string }) {
  const Art = ART[motif]
  return (
    <svg viewBox="0 0 200 160" className={cn('block', className)} aria-hidden="true">
      <Art />
    </svg>
  )
}
