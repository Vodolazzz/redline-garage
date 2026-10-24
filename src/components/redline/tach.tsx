"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"

// Tachometer 0–8 ×1000 rpm, red zone from 7000. The needle is driven imperatively
// (set(rpm)) so it can follow animation frames without React renders.

export interface TachHandle {
  set: (rpm: number) => void
}

const START = -225
const SWEEP = 270
const MAX = 8000

function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180
  const round = (n: number) => Math.round(n * 100) / 100
  return [round(Math.cos(a) * r), round(Math.sin(a) * r)] as const
}

function arc(r: number, from: number, to: number) {
  const [x1, y1] = polar(r, from)
  const [x2, y2] = polar(r, to)
  const large = to - from > 180 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

const toDeg = (rpm: number) => START + (SWEEP * rpm) / MAX

export const Tach = forwardRef<TachHandle, { size?: number; className?: string; label?: string; dark?: boolean }>(
  function Tach({ size = 132, className, label = "об/мин", dark = true }, ref) {
    const needle = useRef<SVGGElement>(null)
    const readout = useRef<SVGTextElement>(null)
    const zone = useRef<SVGPathElement>(null)

    useImperativeHandle(ref, () => ({
      set(rpm: number) {
        const r = Math.max(0, Math.min(MAX, rpm))
        needle.current?.setAttribute("transform", `rotate(${toDeg(r)})`)
        if (readout.current) readout.current.textContent = String(Math.round(r / 10) * 10).padStart(4, "0")
        if (zone.current) zone.current.style.opacity = r >= 7000 ? "1" : "0.55"
      },
    }))

    const ink = dark ? "#f2f0ec" : "#0c0c0d"
    const soft = dark ? "#6d6963" : "#9a958d"

    return (
      <svg viewBox="-60 -60 120 120" width={size} height={size} className={className} aria-hidden="true">
        <path d={arc(50, START, START + SWEEP)} fill="none" stroke={soft} strokeOpacity="0.35" strokeWidth="2" />
        <path ref={zone} d={arc(50, toDeg(7000), START + SWEEP)} fill="none" stroke="#e10600" strokeWidth="6" style={{ opacity: 0.55, transition: "opacity .2s" }} />
        {Array.from({ length: 33 }, (_, i) => {
          const rpm = i * 250
          const major = rpm % 1000 === 0
          const [x1, y1] = polar(major ? 40 : 45, toDeg(rpm))
          const [x2, y2] = polar(50, toDeg(rpm))
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={rpm >= 7000 ? "#e10600" : ink}
              strokeOpacity={major ? 1 : 0.5}
              strokeWidth={major ? 2 : 1}
            />
          )
        })}
        {Array.from({ length: 9 }, (_, i) => {
          const [x, y] = polar(31, toDeg(i * 1000))
          return (
            <text
              key={i}
              x={x}
              y={y + 3}
              textAnchor="middle"
              fontSize="8"
              fontWeight="700"
              fill={i >= 7 ? "#e10600" : ink}
              fontFamily="var(--font-text), system-ui"
            >
              {i}
            </text>
          )
        })}
        <text ref={readout} x="0" y="26" textAnchor="middle" fontSize="11" fontWeight="800" fill={ink} className="tabular" fontFamily="var(--font-text), system-ui">
          0000
        </text>
        <text x="0" y="37" textAnchor="middle" fontSize="6.5" fill={soft} fontFamily="var(--font-text), system-ui">
          {label}
        </text>
        <g ref={needle} transform={`rotate(${START})`}>
          <path d="M -1.8 6 L -0.8 -48 L 0.8 -48 L 1.8 6 Z" fill="#e10600" />
        </g>
        <circle r="6" fill={dark ? "#1f1f22" : "#0c0c0d"} stroke="#e10600" strokeWidth="1.5" />
      </svg>
    )
  },
)
