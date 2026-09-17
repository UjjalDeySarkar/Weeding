import { useId } from 'react'

/** Betel leaf (পান পাতা) — the bride hides behind a pair of these before Shubho Drishti. */
export function PaanLeaf({ className }: { className?: string }) {
  const gradient = `paan-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  return (
    <svg viewBox="0 0 200 260" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8cbd52" />
          <stop offset="0.55" stopColor="#4c8a32" />
          <stop offset="1" stopColor="#2c5a22" />
        </linearGradient>
      </defs>
      <path
        d="M100 214 C 70 236 12 218 8 160 C 4 102 52 50 100 4 C 148 50 196 102 192 160 C 188 218 130 236 100 214 Z"
        fill={`url(#${gradient})`}
        stroke="#27501f"
        strokeWidth="2"
      />
      <g fill="none" stroke="#e1f0bd" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round">
        <path d="M100 212 L100 22" />
        <path d="M100 188 Q 62 178 30 140" />
        <path d="M100 160 Q 66 140 46 100" />
        <path d="M100 128 Q 74 108 66 70" />
        <path d="M100 188 Q 138 178 170 140" />
        <path d="M100 160 Q 134 140 154 100" />
        <path d="M100 128 Q 126 108 134 70" />
      </g>
      <path d="M100 214 Q 104 236 96 256" fill="none" stroke="#27501f" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
