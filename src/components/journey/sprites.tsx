/*
 * Patachitra-style sprites for the journey map, drawn in screen pixels with the feet (or wheels) at 0,0.
 * Moving parts carry data-part so the animation can swing them.
 */

const INK = '#2b1b18'
const SKIN = '#d99a63'
const LINE = { stroke: INK, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function Limb({ part, d, colour, width = 4.6 }: { part: string; d: string; colour: string; width?: number }) {
  return (
    <g data-part={part}>
      <path d={d} {...LINE} strokeWidth={width} fill="none" />
      <path d={d} stroke={colour} strokeWidth={width - 2} strokeLinecap="round" fill="none" />
    </g>
  )
}

/** Ujjal: undercut, light beard and moustache, white dhoti-panjabi */
export function Groom() {
  return (
    <g>
      <ellipse cx="0" cy=".6" rx="11.5" ry="2.7" fill="rgba(43,27,24,.2)" />
      <Limb part="armB" d="M-1 -42 L-4 -29" colour={SKIN} />
      <Limb part="legB" d="M-1 -22 L-1.5 -1.5" colour="#fbf7ee" width={5.6} />
      <Limb part="legF" d="M1 -22 L1.5 -1.5" colour="#fbf7ee" width={5.6} />
      <path
        d="M-7.5 -44 C -9.5 -36 -10.5 -27 -10 -19 L 10 -19 C 10.5 -27 9.5 -36 7.5 -44 C 3 -46.5 -3 -46.5 -7.5 -44 Z"
        fill="#fbf7ee"
        {...LINE}
        strokeWidth="1.8"
      />
      <path d="M.5 -44 L.5 -31" stroke="#c39035" strokeWidth="1.2" />
      <circle cx=".5" cy="-40" r=".7" fill="#c39035" />
      <circle cx=".5" cy="-36" r=".7" fill="#c39035" />
      <g data-part="armF">
        <path d="M1 -42 L4 -29" {...LINE} strokeWidth="5" />
        <path d="M1 -42 L3.4 -31.5" stroke="#fbf7ee" strokeWidth="3" strokeLinecap="round" />
        <circle cx="4" cy="-29" r="1.6" fill={SKIN} />
      </g>
      <circle cx="1" cy="-52" r="8.3" fill={SKIN} {...LINE} strokeWidth="1.8" />
      {/* undercut: short sides, longer on top */}
      <path d="M-7.4 -52.5 C -8 -56.5 -7 -59 -5.5 -60.2 L -5 -56 C -6 -55.2 -6.8 -54 -7.4 -52.5 Z" fill={INK} opacity=".55" />
      <path
        d="M-6 -59.4 C -4.6 -63.6 1 -65.6 5.6 -63.8 C 8.6 -62.6 10 -60.2 9.6 -57.6 C 7 -59.2 3.4 -59.6 0 -59.2 C -2.4 -58.9 -4.4 -58.8 -6 -59.4 Z"
        fill={INK}
      />
      {/* light beard and moustache */}
      <path d="M-5.6 -50 C -4.8 -45.2 -1 -43.4 2.4 -43.6 C 5.6 -43.8 8 -46 9 -49 C 6.6 -46.4 3.4 -45.4 .6 -45.6 C -2.4 -45.9 -4.4 -47.6 -5.6 -50 Z" fill={INK} opacity=".5" />
      <path d="M5 -48.6 C 6.4 -49.4 8 -49.4 9 -48.6" fill="none" stroke={INK} strokeWidth="1.1" strokeLinecap="round" opacity=".75" />
      <path d="M3.2 -53 C 5 -54.8 7.4 -54.8 9 -53 C 7.4 -51.7 5 -51.7 3.2 -53 Z" fill="#fbf5ea" stroke={INK} strokeWidth=".8" />
      <circle cx="6.4" cy="-53.1" r="1.05" fill={INK} />
      <path d="M2.6 -56 C 5 -57.6 7.6 -57.6 9.4 -55.8" fill="none" stroke={INK} strokeWidth="1" strokeLinecap="round" />
      <g data-extra="topor">
        <path d="M-7 -60 C -5 -67 -2.5 -75 1 -82 C 4.5 -75 7 -67 9 -60 C 4 -62 -2 -62 -7 -60 Z" fill="#fff8e6" stroke="#c39035" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M-5 -64 C 0 -65.5 3 -65.5 7.4 -64" fill="none" stroke="#c39035" strokeWidth="1" />
        <circle cx="1" cy="-71" r="1.4" fill="#a51c1c" />
      </g>
      <path data-extra="garland" d="M-7 -44 C -6 -33 7 -33 7.5 -44" fill="none" stroke="#f0a030" strokeWidth="3" strokeLinecap="round" strokeDasharray=".1 3.2" />
    </g>
  )
}

/** Rupsha: waist-length braid, glasses, expressive long eyes, blue saree (red Benarasi at the wedding) */
export function Bride() {
  return (
    <g>
      <ellipse cx="0" cy=".6" rx="12" ry="2.8" fill="rgba(43,27,24,.2)" />
      {/* braid down to the waist, behind everything */}
      <path d="M-5 -56 C -10 -50 -11 -42 -10.4 -34 C -10 -29 -10.6 -25 -11.4 -21" fill="none" stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
      <path d="M-9 -48 l -2.4 2 M-10.4 -42 l -2.2 2 M-10.6 -36 l -2 2 M-10.6 -30 l -2 2" stroke="#5a3a2c" strokeWidth=".9" strokeLinecap="round" />
      <circle cx="-11.5" cy="-20.4" r="1.7" fill="#a51c1c" stroke={INK} strokeWidth=".6" />
      <ellipse data-part="footB" cx="-3.4" cy="-1.4" rx="3.6" ry="1.9" fill={SKIN} stroke={INK} strokeWidth="1" />
      <Limb part="armB" d="M-.5 -41 L-3 -28" colour={SKIN} width={4.4} />
      <g data-part="body">
        <path
          d="M-7 -44 C -10 -33 -12.5 -16 -13 -3.5 L 13 -3.5 C 12.5 -16 10 -33 7 -44 C 3 -46.5 -3 -46.5 -7 -44 Z"
          fill="var(--saree, #2e5c9e)"
          {...LINE}
          strokeWidth="1.8"
        />
        <path d="M-12.9 -4 L 12.9 -4 L 12.6 -8.4 L -12.6 -8.4 Z" fill="var(--border, #a51c1c)" />
        <path d="M-12.7 -8.6 L 12.7 -8.6" stroke="#ebcb85" strokeWidth=".8" />
        <path d="M6.6 -43 C 2 -33 -4 -25.5 -11.6 -20.5" fill="none" stroke="var(--border, #a51c1c)" strokeWidth="3.2" />
        <path d="M-6.6 -43.6 C -3.5 -40.6 3.5 -40.6 6.6 -43.6 C 3 -46 -3 -46 -6.6 -43.6 Z" fill="#e9b93a" stroke={INK} strokeWidth=".6" />
      </g>
      <ellipse data-part="footF" cx="3.4" cy="-1.4" rx="3.6" ry="1.9" fill={SKIN} stroke={INK} strokeWidth="1" />
      <g data-part="armF">
        <path d="M.5 -41 L3.5 -28" {...LINE} strokeWidth="4.4" />
        <path d="M.5 -41 L3.5 -28" stroke={SKIN} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M2.6 -31.2 L4.6 -31.6" stroke="#ebcb85" strokeWidth="1.6" />
        <path data-extra="sindoor" d="M2.8 -29.6 L4.8 -30" stroke="#fbf5ea" strokeWidth="1.6" />
      </g>
      <circle cx="1" cy="-52" r="8.2" fill={SKIN} {...LINE} strokeWidth="1.8" />
      <path
        d="M-7.3 -53.5 C -7 -61 -1 -62.6 3.5 -61.6 C 7.8 -60.6 9.4 -57.2 9.2 -54 C 6.2 -58.2 1.4 -59 -2.6 -57.6 C -4.6 -56.8 -6.2 -55.4 -7.3 -53.5 Z"
        fill={INK}
      />
      <path data-extra="sindoor" d="M2.6 -61.4 C 3.2 -59.8 3.6 -58.6 3.8 -57.4" stroke="#d01f1f" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="6.6" cy="-56.8" r=".95" fill="#a51c1c" />
      {/* defined brow, long eye, round glasses */}
      <path d="M2.4 -56.2 C 4.8 -57.8 7.6 -57.8 9.6 -56" fill="none" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M2.6 -52.8 C 4.6 -54.7 7.6 -54.7 9.6 -52.6 C 7.6 -51.2 4.6 -51.2 2.6 -52.8 Z" fill="#fbf5ea" stroke={INK} strokeWidth=".8" />
      <circle cx="6.2" cy="-52.9" r="1.05" fill={INK} />
      <circle cx="6.2" cy="-52.9" r="3.9" fill="none" stroke={INK} strokeWidth=".9" />
      <path d="M2.3 -53.4 L -1.2 -54.6" stroke={INK} strokeWidth=".8" />
      <path d="M6 -47.6 C 7.1 -47 8.1 -47.2 8.7 -48" fill="none" stroke="#6d0e13" strokeWidth=".9" strokeLinecap="round" />
      <g data-extra="topor">
        <path
          d="M-7.6 -59.4 C -7.4 -63 -5.6 -64.6 -4.2 -64.4 C -3.2 -67.4 -1.2 -68.6 .8 -68.6 C 2.8 -68.6 4.8 -67.4 5.8 -64.4 C 7.2 -64.6 9 -63 9.2 -59.4 C 4.4 -61 -2.8 -61 -7.6 -59.4 Z"
          fill="#fff8e6"
          stroke="#c39035"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <circle cx=".8" cy="-64.4" r="1.1" fill="#a51c1c" />
      </g>
      <path data-extra="garland" d="M-6.8 -43 C -6 -32 6 -32 6.8 -43" fill="none" stroke="#f0a030" strokeWidth="3" strokeLinecap="round" strokeDasharray=".1 3.2" />
    </g>
  )
}

/** Ujjal's parents, smaller and side by side */
export function Parents() {
  return (
    <g transform="scale(.82)">
      <ellipse cx="0" cy=".6" rx="20" ry="2.8" fill="rgba(43,27,24,.2)" />
      <g transform="translate(-9 0)">
        <path d="M-6.5 -40 C -8.5 -32 -9 -24 -8.5 -16 L 8.5 -16 C 9 -24 8.5 -32 6.5 -40 C 2.6 -42.4 -2.6 -42.4 -6.5 -40 Z" fill="#fbf7ee" {...LINE} strokeWidth="1.6" />
        <path d="M-1 -16 L-1.4 -1.5 M1 -16 L1.4 -1.5" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <circle cx="1" cy="-47" r="7.4" fill={SKIN} {...LINE} strokeWidth="1.6" />
        <path d="M-6 -48 C -6 -53.6 -1 -55.6 3 -54.8 C 6.8 -54 8.4 -51.6 8.2 -49 C 5 -52 0 -52.4 -6 -48 Z" fill="#8a8a8a" />
        <circle cx="5.6" cy="-47.6" r=".9" fill={INK} />
      </g>
      <g transform="translate(9 0)">
        <path d="M-6 -39 C -9 -29 -11 -14 -11.4 -3 L 11.4 -3 C 11 -14 9 -29 6 -39 C 2.6 -41.4 -2.6 -41.4 -6 -39 Z" fill="#7a1a2a" {...LINE} strokeWidth="1.6" />
        <path d="M-11.3 -3.4 L 11.3 -3.4 L 11 -7 L -11 -7 Z" fill="#e9b93a" />
        <circle cx="1" cy="-46" r="7.2" fill={SKIN} {...LINE} strokeWidth="1.6" />
        <circle cx="-5.6" cy="-48.4" r="3.6" fill={INK} />
        <path d="M-6 -47.6 C -6 -53.6 -1 -55 3 -54.2 C 6.6 -53.4 8 -51 7.8 -48.6 C 4.6 -51.4 -1 -51.8 -6 -47.6 Z" fill={INK} />
        <path d="M2.4 -53.8 L2.8 -50.6" stroke="#d01f1f" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="5.4" cy="-46.6" r=".9" fill={INK} />
      </g>
    </g>
  )
}

const head = (x: number, hair: string, glasses = false) => (
  <g key={x}>
    <circle cx={x} cy="-16" r="2.7" fill={SKIN} stroke={INK} strokeWidth=".8" />
    <path d={`M${x - 2.7} -16.6 C ${x - 2.4} -19.6 ${x + 2.4} -19.8 ${x + 2.7} -16.6 C ${x + 1} -18 ${x - 1} -18 ${x - 2.7} -16.6 Z`} fill={hair} />
    {glasses && <circle cx={x + 1.1} cy="-15.9" r="1.3" fill="none" stroke={INK} strokeWidth=".6" />}
  </g>
)

/** Toy train; `riders` shows both of them at the windows */
export function Train({ riders }: { riders?: boolean }) {
  return (
    <g>
      <ellipse cx="0" cy="1" rx="42" ry="3.5" fill="rgba(0,0,0,.2)" />
      <rect x="-40" y="-21" width="25" height="16" rx="3" fill="#a51c1c" stroke={INK} strokeWidth="1.4" />
      <rect x="-13" y="-21" width="25" height="16" rx="3" fill="#a51c1c" stroke={INK} strokeWidth="1.4" />
      <path d="M14 -5 L14 -24 L27 -24 L27 -16 L37 -16 C 39.5 -16 41 -14 41 -11.5 L41 -5 Z" fill="#29497a" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="32" y="-23" width="4.5" height="7" rx="1" fill="#29497a" stroke={INK} strokeWidth="1.2" />
      <rect x="16.5" y="-21" width="7.5" height="6" rx="1" fill="#fbf0d8" stroke={INK} strokeWidth=".8" />
      {[-37, -25.5, -10, 1.5].map((x) => (
        <rect key={x} x={x} y="-18" width="7.5" height="6" rx="1.2" fill="#fbf0d8" stroke={INK} strokeWidth=".8" />
      ))}
      {[-34, -21, -7, 6, 20, 34].map((x) => (
        <circle key={x} cx={x} cy="-4" r={x > 15 ? 3.6 : 3.3} fill={INK} />
      ))}
      {riders && [head(-33.2, INK), head(-21.7, INK, true)]}
      {riders && (
        <g>
          <path d="M20 -24 L20 -36" stroke={INK} strokeWidth="1.2" />
          <path d="M20 -36 L29 -33 L20 -30 Z" fill="#a51c1c" stroke={INK} strokeWidth=".8" />
        </g>
      )}
    </g>
  )
}

/** Ujjal on his bike */
export function Bike() {
  return (
    <g>
      <ellipse cx="0" cy="1" rx="17" ry="2.6" fill="rgba(0,0,0,.2)" />
      <circle cx="-10" cy="-5.5" r="5.5" fill="none" stroke={INK} strokeWidth="2.4" />
      <circle cx="11" cy="-5.5" r="5.5" fill="none" stroke={INK} strokeWidth="2.4" />
      <path d="M-10 -5.5 L-3 -12 L7 -12 L11 -5.5" fill="none" stroke={INK} strokeWidth="1.6" />
      <path d="M-6 -12 C -6 -16 4 -17 8 -13 L 6 -10 L -4 -10 Z" fill="#a51c1c" stroke={INK} strokeWidth="1.2" />
      <path d="M8 -13 L 10 -20 L 13 -20" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      {/* rider */}
      <path d="M-4 -12 L 2 -13 L 4 -7" fill="none" stroke="#fbf7ee" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M-4.5 -12 C -6 -18 -5 -24 -2 -28 L 4 -28 C 6 -24 6 -18 3 -13 Z" fill="#fbf7ee" stroke={INK} strokeWidth="1.4" />
      <path d="M3 -24 L 10 -20" stroke={SKIN} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="1" cy="-33" r="5.4" fill={SKIN} stroke={INK} strokeWidth="1.4" />
      <path d="M-4.4 -34 C -4 -38.6 1 -40.4 4.4 -39 C 6.4 -38.2 7 -36.4 6.6 -34.8 C 4.6 -36.2 1.6 -36.6 -1 -36.2 C -2.6 -36 -3.6 -35.4 -4.4 -34 Z" fill={INK} />
      <path d="M-3.4 -32 C -2.6 -29 0 -28 2.4 -28.2 C 4.6 -28.4 5.8 -29.6 6.2 -31.4 C 4 -30 1 -30 -3.4 -32 Z" fill={INK} opacity=".5" />
      <circle cx="4" cy="-33.6" r=".8" fill={INK} />
    </g>
  )
}

/** The family car with Ujjal and his parents */
export function Car() {
  return (
    <g>
      <ellipse cx="0" cy="1" rx="22" ry="3" fill="rgba(0,0,0,.2)" />
      <path d="M-21 -5 L-21 -11 C -21 -13 -19 -14 -17 -14 L-11 -14 L-6 -21 L 9 -21 L 14 -14 L 19 -14 C 21 -14 22 -12.5 22 -10.5 L 22 -5 Z" fill="#fbf7ee" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M-9.5 -14 L-5.4 -19.4 L 0.6 -19.4 L 0.6 -14 Z M2.4 -14 L 2.4 -19.4 L 8.4 -19.4 L 12.2 -14 Z" fill="#9cc0d8" stroke={INK} strokeWidth="1" />
      {[-4.4, 1.4, 6.6].map((x, i) => (
        <circle key={x} cx={x} cy="-16.2" r="2" fill={SKIN} stroke={INK} strokeWidth=".6" opacity={i === 1 ? 1 : 0.9} />
      ))}
      <circle cx="-12" cy="-4.5" r="4.4" fill={INK} />
      <circle cx="13" cy="-4.5" r="4.4" fill={INK} />
      <circle cx="-12" cy="-4.5" r="1.6" fill="#c39035" />
      <circle cx="13" cy="-4.5" r="1.6" fill="#c39035" />
      <path d="M20 -10 L22 -10" stroke="#f0a030" strokeWidth="2" />
    </g>
  )
}

/** Home with a Bengal chala roof; `side` puts it left or right of the person standing there */
export function House({ side }: { side: 1 | -1 }) {
  return (
    <g transform={`translate(${26 * side} 0)`}>
      <ellipse cx="0" cy="1" rx="18" ry="3.5" fill="rgba(0,0,0,.18)" />
      <path d="M-12 0 L-12 -14 L12 -14 L12 0 Z" fill="#fbf5ea" stroke={INK} strokeWidth="1.4" />
      <path d="M-16 -13 C -9 -26 9 -26 16 -13 C 9 -16 -9 -16 -16 -13 Z" fill="#a24a1f" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M-3.2 0 L-3.2 -6 A 3.2 3.2 0 0 1 3.2 -6 L3.2 0 Z" fill="#29497a" />
      <rect x={side > 0 ? 6 : -9.6} y="-10" width="3.6" height="3.6" fill="#e9b93a" stroke={INK} strokeWidth=".8" />
    </g>
  )
}

export function Mandap() {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="58" ry="10" fill="#f6e3b8" stroke={INK} strokeWidth="1.4" />
      <ellipse cx="0" cy="2" rx="44" ry="6.5" fill="none" stroke="#fbf5ea" strokeWidth="1.4" strokeDasharray=".1 4" strokeLinecap="round" />
      <rect x="-49" y="-74" width="5" height="76" rx="1.5" fill="#c39035" stroke={INK} strokeWidth="1.2" />
      <rect x="44" y="-74" width="5" height="76" rx="1.5" fill="#c39035" stroke={INK} strokeWidth="1.2" />
      {[1, -1].map((s) => (
        <g key={s} transform={`scale(${s} 1)`}>
          <path d="M-47 -2 C -62 -14 -64 -30 -58 -40 C -54 -26 -50 -16 -47 -10 Z" fill="#5b8a3c" stroke={INK} strokeWidth="1.2" />
          <path d="M-47 -6 C -38 -20 -36 -32 -40 -44 C -46 -32 -48 -20 -48 -12 Z" fill="#4d7a31" stroke={INK} strokeWidth="1.2" />
        </g>
      ))}
      <path d="M-60 -70 C -36 -100 36 -100 60 -70 C 36 -80 -36 -80 -60 -70 Z" fill="#a51c1c" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-60 -70 C -36 -80 36 -80 60 -70" fill="none" stroke="#ebcb85" strokeWidth="2" />
      <path d="M-44 -72 C -30 -58 -14 -58 0 -72 C 14 -58 30 -58 44 -72" fill="none" stroke="#f0a030" strokeWidth="2.2" strokeDasharray=".1 3.4" strokeLinecap="round" />
      {[-33, -22, -11, 11, 22, 33].map((x) => (
        <circle key={x} cx={x} cy={Math.abs(x) === 22 ? -61.5 : -64} r="2.3" fill="#f0a030" stroke={INK} strokeWidth=".7" />
      ))}
    </g>
  )
}

export const HEART = 'M0 4.5 C -7 0 -6.5 -8 -2.6 -8 C -1.2 -8 -.4 -7 0 -6 C .4 -7 1.2 -8 2.6 -8 C 6.5 -8 7 0 0 4.5 Z'

export function MeetPin() {
  return (
    <g>
      <circle r="15" cy="-21" fill="none" stroke="#a51c1c" strokeWidth="1.6" opacity=".5" data-part="ring" />
      <path d="M0 0 C -2 -6 -11 -12 -11 -21 A 11 11 0 0 1 11 -21 C 11 -12 2 -6 0 0 Z" fill="#a51c1c" stroke={INK} strokeWidth="1.4" />
      <text data-part="question" x="0" y="-16.5" textAnchor="middle" fontSize="13" fontWeight="600" fill="#fbf5ea" fontFamily="Jost, sans-serif">
        ?
      </text>
      <path data-part="heart" d={HEART} transform="translate(0 -21) scale(.85)" fill="#fbf5ea" />
    </g>
  )
}

/** Travel stamp: grey outline until the place is collected */
export function Stamp() {
  return (
    <g>
      <circle r="13" fill="var(--stamp-fill, #fffaf1)" stroke="var(--stamp-ink, #75605a)" strokeWidth="1.6" strokeDasharray="2.2 1.6" />
      <circle r="9.4" fill="none" stroke="var(--stamp-ink, #75605a)" strokeWidth=".9" />
      <path d={HEART} transform="scale(.75)" fill="var(--stamp-ink, #75605a)" />
    </g>
  )
}

/** Level badge with the milestone's year */
export function Badge({ year }: { year: string }) {
  return (
    <g>
      <circle r="17" fill="#e9b93a" stroke={INK} strokeWidth="1.8" />
      <circle r="13.6" fill="#fffaf1" stroke={INK} strokeWidth="1" />
      <path d={HEART} transform="translate(0 -3) scale(.62)" fill="#a51c1c" />
      <text y="8.6" textAnchor="middle" fontSize="6.4" fontWeight="600" fill={INK} fontFamily="Jost, sans-serif">
        {year}
      </text>
    </g>
  )
}

/** A small crowd for the families' celebration */
export function Guests() {
  const people = [-46, -36, -26, 26, 36, 46, -40, 40]
  return (
    <g>
      {people.map((x, i) => {
        const y = i > 5 ? -16 : 0
        const colour = ['#a51c1c', '#e9b93a', '#29497a', '#5b8a3c', '#d9731a', '#fbf7ee', '#7a1a2a', '#35603a'][i]
        return (
          <g key={x + y} transform={`translate(${x} ${y}) scale(.5)`}>
            <path d="M-6 -2 C -7 -14 -6 -24 -4 -30 L 4 -30 C 6 -24 7 -14 6 -2 Z" fill={colour} stroke={INK} strokeWidth="1.6" />
            <circle cy="-36" r="6" fill={SKIN} stroke={INK} strokeWidth="1.6" />
            <path d="M-6 -37 C -5 -43 5 -43 6 -37 C 3 -40 -3 -40 -6 -37 Z" fill={INK} />
          </g>
        )
      })}
    </g>
  )
}

/** Prajapati, the butterfly of Bengali weddings; data-part="wing" flaps */
export function Butterfly() {
  const wing = (
    <g>
      <path d="M0 -1 C -6 -11 -15 -13 -15 -6 C -15 -1 -7 1 0 0 Z" fill="#f0a030" stroke={INK} strokeWidth=".9" />
      <path d="M0 0 C -6 2 -11 7 -8 9.5 C -4.5 11 -1 5 0 1 Z" fill="#e8892a" stroke={INK} strokeWidth=".9" />
      <path d="M-15 -6 C -14 -10.5 -10 -12 -8 -11" fill="none" stroke={INK} strokeWidth="2.4" />
      <circle cx="-12.5" cy="-8.5" r=".8" fill="#fff" />
    </g>
  )
  return (
    <g>
      <g data-part="wing">{wing}</g>
      <g transform="scale(-1 1)">
        <g data-part="wing">{wing}</g>
      </g>
      <path d="M0 -5 L0 7" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}
