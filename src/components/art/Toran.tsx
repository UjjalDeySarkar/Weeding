import { useId } from 'react'
import { cn } from '@/lib/utils'

/** Flowers per hanging string */
const strands = [5, 7, 4, 8, 5, 9, 6, 9, 5, 8, 4, 7, 5]
const flowerColors = ['#f0a030', '#d9731a', '#e9b93a']
const SPACING = 16

/** Every third flower, counting up from the bottom, is a red rose */
const isRose = (i: number, count: number) => (count - 1 - i) % 3 === 0

const PETALS = [0, 72, 144, 216, 288]

/** Red rose seen from the front, drawn in a 20×20 box */
function RoseSymbol({ id }: { id: string }) {
  return (
    <symbol id={id} viewBox="-10 -10 20 20" overflow="visible">
      <radialGradient id={`${id}-shade`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="10">
        <stop offset="0" stopColor="#5a0711" />
        <stop offset="0.45" stopColor="#9c1024" />
        <stop offset="0.82" stopColor="#c81f35" />
        <stop offset="1" stopColor="#de4254" />
      </radialGradient>
      <g fill={`url(#${id}-shade)`} stroke="#5a0711" strokeWidth="0.45" strokeOpacity="0.7">
        {PETALS.map((a) => (
          <ellipse key={a} cy="-4.8" rx="4.9" ry="4.4" transform={`rotate(${a})`} />
        ))}
        {PETALS.map((a) => (
          <ellipse key={a} cy="-2.6" rx="3.5" ry="3.1" transform={`rotate(${a + 36})`} />
        ))}
      </g>
      <g fill="none" stroke="#ef6b7a" strokeWidth="0.5" strokeLinecap="round" strokeOpacity="0.75">
        {PETALS.map((a) => (
          <path key={a} d="M-2.6 -8.4 Q 0 -9.6 2.6 -8.4" transform={`rotate(${a})`} />
        ))}
      </g>
      {/* tightly curled bud at the heart */}
      <circle r="2.8" fill="#7a0a18" />
      <path d="M-2.4 -0.6 A 2.6 2.6 0 0 1 2.4 -0.9 A 2.4 1.8 0 0 0 -2.4 -0.6 Z" fill="#c81f35" />
      <ellipse cx="0.3" cy="0.7" rx="1.2" ry="0.9" fill="#3f040c" />
    </symbol>
  )
}

function Strand({ count, index, rose }: { count: number; index: number; rose: string }) {
  const height = count * SPACING + 26
  return (
    <div
      className={cn('origin-top animate-sway', index % 2 === 1 && 'hidden sm:block')}
      style={{ animationDelay: `${-index * 0.7}s` }}
    >
      <svg width="22" height={height} viewBox={`0 0 22 ${height}`}>
        <line x1="11" y1="0" x2="11" y2={height - 20} stroke="#8a5a1a" strokeWidth="1" />
        {Array.from({ length: count }, (_, i) => {
          const cy = 10 + i * SPACING
          if (isRose(i, count)) return <use key={i} href={`#${rose}`} x="0.5" y={cy - 10.5} width="21" height="21" />
          return (
            <g key={i}>
              <circle cx="11" cy={cy} r="9" fill={flowerColors[(i + index) % flowerColors.length]} />
              <circle cx="11" cy={cy} r="7.5" fill="none" stroke="#a8500f" strokeOpacity="0.4" strokeDasharray="2 2" />
              <circle cx="11" cy={cy} r="3" fill="#a8400f" fillOpacity="0.55" />
            </g>
          )
        })}
        {/* mango leaf at the end */}
        <path
          d={`M11 ${height - 22} C 18 ${height - 14} 16 ${height - 4} 11 ${height} C 6 ${height - 4} 4 ${height - 14} 11 ${height - 22} Z`}
          fill="#5b8a3c"
        />
      </svg>
    </div>
  )
}

/** Marigold and red rose garland (তোরণ) hanging from a cord of mango leaves. */
export function Toran({ className }: { className?: string }) {
  const rose = `rose${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <div className={cn('pointer-events-none', className)} aria-hidden="true">
      <svg width="0" height="0" className="absolute">
        <RoseSymbol id={rose} />
      </svg>
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1.5 h-0.5 bg-[#8a5a1a]/60" />
        <div className="toran-leaves absolute inset-x-0 top-0.5 h-[26px]" />
      </div>
      <div className="flex justify-between px-3 sm:px-8">
        {strands.map((count, i) => (
          <Strand key={i} count={count} index={i} rose={rose} />
        ))}
      </div>
    </div>
  )
}
