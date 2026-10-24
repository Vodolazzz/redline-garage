// A flat-six coupé drawn in code, side view, facing right.
// Wheels are separate groups so the hero can spin them by distance travelled.

const SPOKES = Array.from({ length: 10 }, (_, i) => i * 36)

function Wheel({ cx, wheelRef, id }: { cx: number; wheelRef?: React.Ref<SVGGElement>; id: string }) {
  return (
    <g transform={`translate(${cx} 280)`}>
      <circle r="71" fill="#0b0b0c" />
      <circle r="66" fill="none" stroke="#1d1d20" strokeWidth="5" />
      <circle r="52" fill={`url(#${id}-rim)`} />
      {/* brake disc + caliper stay still while the spokes turn */}
      <circle r="40" fill="#3a3a3f" />
      <circle r="40" fill="none" stroke="#4d4d53" strokeWidth="2" strokeDasharray="2 4" />
      <path d="M -30 -27 A 40 40 0 0 1 12 -38 L 10 -26 A 28 28 0 0 0 -20 -18 Z" fill="#e10600" />
      <g ref={wheelRef}>
        {SPOKES.map((a) => (
          <path
            key={a}
            transform={`rotate(${a})`}
            d="M -3.5 -12 L -6 -48 Q 0 -51 6 -48 L 3.5 -12 Z"
            fill="#c9c9ce"
            stroke="#8a8a90"
            strokeWidth="0.6"
          />
        ))}
        <circle r="50" fill="none" stroke="#a7a7ad" strokeWidth="3" />
        <circle r="13" fill="#d4d4d8" />
        <circle r="6" fill="#0b0b0c" />
        <circle r="2.4" cx="0" cy="-9" fill="#e10600" />
      </g>
    </g>
  )
}

export function Car911({
  frontWheelRef,
  rearWheelRef,
  headlightRef,
  className,
  style,
}: {
  frontWheelRef?: React.Ref<SVGGElement>
  rearWheelRef?: React.Ref<SVGGElement>
  headlightRef?: React.Ref<SVGGElement>
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg viewBox="0 0 1000 380" className={className} style={style} aria-hidden="true" overflow="visible">
      <defs>
        <linearGradient id="car-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff4a3d" />
          <stop offset="0.35" stopColor="#e10600" />
          <stop offset="0.72" stopColor="#b10400" />
          <stop offset="1" stopColor="#5c0200" />
        </linearGradient>
        <linearGradient id="car-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2c3036" />
          <stop offset="0.55" stopColor="#0d0f12" />
          <stop offset="1" stopColor="#1b1e23" />
        </linearGradient>
        <radialGradient id="w-rim" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#3b3b41" />
          <stop offset="1" stopColor="#141417" />
        </radialGradient>
        <radialGradient id="r-rim" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#3b3b41" />
          <stop offset="1" stopColor="#141417" />
        </radialGradient>
        <radialGradient id="car-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.85" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="head-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.35" stopColor="#fff6e0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff6e0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff8e6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff8e6" stopOpacity="0" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="500" cy="352" rx="480" ry="20" fill="url(#car-shadow)" />

      {/* headlight beam, toggled by the hero */}
      <g ref={headlightRef} style={{ opacity: 0, transition: "opacity .4s" }}>
        <path d="M 915 205 L 1480 130 L 1480 330 Z" fill="url(#beam)" />
        <circle cx="912" cy="214" r="46" fill="url(#head-glow)" />
      </g>

      {/* body */}
      <path
        d="M 52 318 C 42 312 38 296 40 284 C 41 268 42 250 48 236 C 52 228 56 224 64 220
           C 150 186 300 98 440 90 C 470 89 500 91 520 96
           C 560 106 604 140 640 168
           C 720 180 860 190 928 214
           C 952 222 964 246 962 270
           L 956 310 Q 952 322 932 322
           L 828 322 A 84 84 0 1 0 682 322
           L 338 322 A 84 84 0 1 0 182 322
           L 72 322 Q 56 322 52 318 Z"
        fill="url(#car-body)"
      />
      {/* lower sill shade */}
      <path d="M 338 306 L 682 306 L 682 322 L 338 322 Z" fill="#000" opacity="0.28" />
      {/* shoulder highlight */}
      <path
        d="M 70 226 C 180 176 320 108 444 100 C 520 98 580 128 640 172 C 740 184 860 194 924 218"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.38"
        strokeWidth="4"
        filter="url(#soft)"
      />
      {/* glasshouse */}
      <path
        d="M 286 196 C 340 148 408 118 468 114 L 502 116 C 544 126 584 152 614 178 L 602 182 L 292 200 Z"
        fill="url(#car-glass)"
      />
      <path d="M 300 192 C 352 150 410 124 466 120" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="5" />
      {/* B-pillar */}
      <path d="M 440 114 L 450 114 L 438 196 L 428 196 Z" fill="#c80500" />
      {/* door cut lines */}
      <path d="M 432 198 L 428 318" stroke="#5a0200" strokeWidth="2" />
      <path d="M 642 180 Q 654 250 644 318" fill="none" stroke="#5a0200" strokeWidth="2" />
      {/* door handle */}
      <rect x="470" y="214" width="38" height="6" rx="3" fill="#7d0300" />
      {/* mirror */}
      <path d="M 598 176 Q 606 158 632 160 L 636 174 Q 616 178 598 176 Z" fill="#c80500" />
      {/* side marker + script */}
      <rect x="880" y="236" width="18" height="5" rx="2" fill="#ffb199" />
      <text x="520" y="292" fill="#fff" fillOpacity="0.85" fontSize="15" fontWeight="800" letterSpacing="5" fontFamily="system-ui, sans-serif">
        REDLINE
      </text>
      {/* rear light bar */}
      <rect x="40" y="238" width="22" height="9" rx="3" fill="#ff1a0d" />
      <rect x="36" y="236" width="10" height="13" rx="3" fill="#ff5a4f" filter="url(#soft)" />
      {/* headlight */}
      <ellipse cx="910" cy="214" rx="24" ry="12" transform="rotate(-14 910 214)" fill="#f4f1ea" />
      <ellipse cx="914" cy="213" rx="10" ry="6" transform="rotate(-14 914 213)" fill="#fff" />
      {/* rear arch vents */}
      <path d="M 120 250 L 170 238 M 124 262 L 174 250 M 128 274 L 178 262" stroke="#4a0100" strokeWidth="3" strokeLinecap="round" />

      <Wheel cx={255} wheelRef={rearWheelRef} id="r" />
      <Wheel cx={755} wheelRef={frontWheelRef} id="w" />
    </svg>
  )
}
