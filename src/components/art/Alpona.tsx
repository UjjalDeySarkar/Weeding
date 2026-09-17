import { cn } from '@/lib/utils'

/** Teardrop petal pointing outward from `inner` to `outer` radius */
function petal(inner: number, outer: number, width: number) {
  const len = outer - inner
  return `M0 ${-inner} C ${width} ${-inner - len * 0.3} ${width * 0.6} ${-outer + len * 0.2} 0 ${-outer} C ${-width * 0.6} ${-outer + len * 0.2} ${-width} ${-inner - len * 0.3} 0 ${-inner}Z`
}

const ring = (count: number, offset = 0) => Array.from({ length: count }, (_, i) => (360 / count) * i + offset)

/** Rice-paste floor art (আলপনা), drawn in currentColor. */
export function Alpona({ className }: { className?: string }) {
  return (
    <svg viewBox="-100 -100 200 200" className={cn('pointer-events-none', className)} aria-hidden="true">
      <g fill="currentColor">
        <circle r="4" />
        {ring(8).map((a) => (
          <path key={a} d={petal(7, 22, 6)} transform={`rotate(${a})`} />
        ))}
        {ring(16).map((a) => (
          <circle key={a} cy={-28} r="1.6" transform={`rotate(${a})`} />
        ))}
        {ring(16, 11.25).map((a) => (
          <path key={a} d={petal(36, 54, 5)} transform={`rotate(${a})`} />
        ))}
        {ring(32).map((a) => (
          <circle key={a} cy={-60} r="1.3" transform={`rotate(${a})`} />
        ))}
        {ring(12).map((a) => (
          <path key={a} d={petal(68, 90, 9)} transform={`rotate(${a})`} />
        ))}
        {ring(48).map((a) => (
          <circle key={a} cy={-96} r="1.1" transform={`rotate(${a})`} />
        ))}
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle r="31" />
        <circle r="64" />
        <circle r="66.5" strokeDasharray="2 3" />
        {ring(12, 15).map((a) => (
          <path key={a} d={petal(64, 94, 13)} transform={`rotate(${a})`} />
        ))}
      </g>
    </svg>
  )
}
