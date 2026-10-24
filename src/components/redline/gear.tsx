// A 12-tooth gear drawn as one path, used as the workshop's recurring motif.
const TEETH = 12

function gearPath() {
  const outer = 48
  const inner = 39
  const pts: string[] = []
  for (let i = 0; i < TEETH; i++) {
    const a = (i / TEETH) * Math.PI * 2
    const w = (Math.PI * 2) / TEETH
    const seq = [
      [inner, a - w * 0.5],
      [inner, a - w * 0.28],
      [outer, a - w * 0.18],
      [outer, a + w * 0.18],
      [inner, a + w * 0.28],
    ]
    for (const [r, t] of seq) pts.push(`${(50 + Math.cos(t) * r).toFixed(2)} ${(50 + Math.sin(t) * r).toFixed(2)}`)
  }
  return `M ${pts.join(" L ")} Z M 50 34 A 16 16 0 1 0 50.01 34 Z`
}

const D = gearPath()

export function Gear({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d={D} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}
