"use client"

import { useCallback, useEffect, useRef } from "react"
import { range, useScrollScrub } from "@/hooks/use-scroll-scrub"

// ─────────────────────────────────────────────────────────────
// DRIVE-BY — the opening shot, scroll-locked like the MetroHero video hero
// (same lock engine: the page holds while the wheel scrubs the film, then lets go).
// One timeline, p = 0…1:
//   0.00–0.36  rain and fog; the red sedan comes straight at the camera
//   0.36–0.66  cut to the kerb: it blasts past from the right, wheels spinning,
//              leaving rubber on the asphalt and a wall of tyre smoke
//   0.62–0.84  the smoke fills the screen
//   0.78–1.00  the smoke thins out into the word REDLINE
// Cars are real photographs (scripts/make-hero-assets.mjs); smoke, rain, fog and
// light are drawn live on two canvases, and everything is a function of p, so
// scrubbing backwards plays the film backwards.
// ─────────────────────────────────────────────────────────────

const SIDE = { w: 1600, h: 550, wf: { cx: 195, cy: 366, r: 120 }, wr: { cx: 1239, cy: 407, r: 134 } }
// headlights on front.webp (1400×591), normalised
const LAMPS = [
  [0.696, 0.558],
  [0.954, 0.476],
]

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeIn = (t: number) => t * t * t

function mulberry(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makePuff() {
  const c = document.createElement("canvas")
  c.width = c.height = 256
  const g = c.getContext("2d")!
  const rnd = mulberry(7)
  for (let i = 0; i < 9; i++) {
    const x = 128 + (rnd() - 0.5) * 90
    const y = 128 + (rnd() - 0.5) * 90
    const r = 60 + rnd() * 60
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, "rgba(176,180,188,0.30)")
    grad.addColorStop(0.55, "rgba(160,165,174,0.12)")
    grad.addColorStop(1, "rgba(150,155,165,0)")
    g.fillStyle = grad
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  return c
}

interface Puff {
  b: number // birth progress
  dx: number
  dy: number
  grow: number
  r0: number
  life: number
  spin: number
  kind: 0 | 1 // 0 = from the tyre, 1 = screen fill
  x0: number
  y0: number
}

function makePuffs(): Puff[] {
  const rnd = mulberry(42)
  const out: Puff[] = []
  for (let i = 0; i < 230; i++) {
    out.push({ b: 0.4 + rnd() * 0.26, dx: 0.05 + rnd() * 0.45, dy: -(0.04 + rnd() * 0.45), grow: 0.6 + rnd() * 1.4, r0: 0.04 + rnd() * 0.05, life: 0.35 + rnd() * 0.25, spin: rnd() * 6, kind: 0, x0: 0, y0: 0 })
  }
  for (let i = 0; i < 40; i++) {
    out.push({ b: 0.56 + rnd() * 0.16, dx: (rnd() - 0.5) * 0.2, dy: -(0.02 + rnd() * 0.12), grow: 0.5 + rnd(), r0: 0.12 + rnd() * 0.12, life: 0.4, spin: rnd() * 6, kind: 1, x0: rnd(), y0: 0.25 + rnd() * 0.75 })
  }
  return out
}

export function DriveByHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLCanvasElement>(null)
  const fxRef = useRef<HTMLCanvasElement>(null)
  const wordRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const assets = useRef<{ front?: HTMLImageElement; side?: HTMLImageElement; wf?: HTMLImageElement; wr?: HTMLImageElement; puff?: HTMLCanvasElement }>({})
  const puffs = useRef<Puff[]>([])
  const size = useRef({ w: 0, h: 0, dpr: 1 })

  useEffect(() => {
    const load = (src: string) => {
      const img = new Image()
      img.decoding = "async"
      img.src = src
      return img
    }
    assets.current = {
      front: load("/media/hero/front.webp"),
      side: load("/media/hero/side.webp"),
      wf: load("/media/hero/wheel-f.webp"),
      wr: load("/media/hero/wheel-r.webp"),
      puff: makePuff(),
    }
    puffs.current = makePuffs()
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = window.innerWidth
      const h = window.innerHeight
      size.current = { w, h, dpr }
      for (const c of [sceneRef.current, fxRef.current]) {
        if (!c) continue
        c.width = Math.round(w * dpr)
        c.height = Math.round(h * dpr)
        c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])

  const onFrame = useCallback((p: number) => {
    const sc = sceneRef.current?.getContext("2d")
    const fx = fxRef.current?.getContext("2d")
    const { w: W, h: H } = size.current
    if (!sc || !fx || !W) return
    const A = assets.current
    const now = performance.now() / 1000
    const sideShot = p >= 0.36
    const narrow = W < 768

    // ── background: fog over wet asphalt, cool and dim
    const horizon = sideShot ? H * 0.6 : H * 0.42
    const sky = sc.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, "#0e1013")
    sky.addColorStop(horizon / H - 0.08, "#2b2f35")
    sky.addColorStop(horizon / H, "#3a3e45")
    sky.addColorStop(Math.min(1, horizon / H + 0.04), "#202328")
    sky.addColorStop(1, "#0b0c0e")
    sc.fillStyle = sky
    sc.fillRect(0, 0, W, H)

    // soft horizon glow (street lights in the fog)
    const glow = sc.createRadialGradient(W / 2, horizon, 0, W / 2, horizon, W * 0.6)
    glow.addColorStop(0, "rgba(190,200,215,0.18)")
    glow.addColorStop(1, "rgba(190,200,215,0)")
    sc.fillStyle = glow
    sc.fillRect(0, 0, W, H)

    if (sideShot) {
      // distant lamps, out of focus
      const rnd = mulberry(3)
      for (let i = 0; i < 26; i++) {
        const x = ((rnd() * 1.4 - 0.2) * W + now * 6 * (0.5 + rnd())) % (W * 1.2)
        const y = horizon - H * (0.05 + rnd() * 0.22)
        const r = 6 + rnd() * 22
        const g = sc.createRadialGradient(x, y, 0, x, y, r)
        const warm = rnd() > 0.6
        g.addColorStop(0, warm ? "rgba(255,190,120,0.35)" : "rgba(200,215,235,0.28)")
        g.addColorStop(1, "rgba(0,0,0,0)")
        sc.fillStyle = g
        sc.beginPath()
        sc.arc(x, y, r, 0, Math.PI * 2)
        sc.fill()
      }
    } else {
      // road lines rushing towards the camera
      sc.strokeStyle = "rgba(220,225,232,0.18)"
      sc.lineWidth = 2
      for (let i = 0; i < 12; i++) {
        const z = ((i / 12 + now * 0.35 + p * 3) % 1) + 0.02
        const y = horizon + (H - horizon) * Math.pow(z, 2.2)
        const half = 4 + 60 * Math.pow(z, 2.2)
        sc.beginPath()
        sc.moveTo(W / 2 - half * 0.08, y)
        sc.lineTo(W / 2 - half * 0.08, Math.min(H, y + 6 + 80 * Math.pow(z, 3)))
        sc.stroke()
      }
    }

    // ── shot A: the car comes at us
    if (!sideShot && A.front?.complete && A.front.naturalWidth) {
      const t = range(p, 0, 0.36)
      const z = 1 - (0.3 * t + 0.63 * easeIn(t)) // 1 → 0.07 (distance)
      const scale = (narrow ? 0.42 : 0.26) / z
      const cw = W * scale
      const ch = (cw * A.front.naturalHeight) / A.front.naturalWidth
      const shake = t > 0.7 ? Math.sin(now * 60) * (t - 0.7) * 10 : 0
      const cx = W / 2 - cw * 0.08 + shake
      const groundY = horizon + (H * 0.07) / z
      const x = cx - cw / 2
      const y = groundY - ch
      // contact shadow
      sc.save()
      sc.translate(x + cw * 0.5, groundY - ch * 0.02)
      sc.scale(1, 0.12)
      const cs = sc.createRadialGradient(0, 0, 0, 0, 0, cw * 0.55)
      cs.addColorStop(0, "rgba(0,0,0,0.65)")
      cs.addColorStop(1, "rgba(0,0,0,0)")
      sc.fillStyle = cs
      sc.beginPath()
      sc.arc(0, 0, cw * 0.55, 0, Math.PI * 2)
      sc.fill()
      sc.restore()
      // wet reflection
      sc.save()
      sc.globalAlpha = 0.22
      sc.translate(0, groundY * 2)
      sc.scale(1, -1)
      sc.filter = "blur(6px)"
      sc.drawImage(A.front, x, y, cw, ch)
      sc.restore()
      sc.filter = "none"
      sc.drawImage(A.front, x, y, cw, ch)
      // headlights: glow + beams through the rain
      for (const [lx, ly] of LAMPS) {
        const hx = x + lx * cw
        const hy = y + ly * ch
        const R = 30 + cw * 0.08
        const g = sc.createRadialGradient(hx, hy, 0, hx, hy, R)
        g.addColorStop(0, "rgba(255,248,236,0.6)")
        g.addColorStop(0.25, "rgba(255,244,228,0.16)")
        g.addColorStop(1, "rgba(255,244,228,0)")
        sc.fillStyle = g
        sc.fillRect(hx - R, hy - R, R * 2, R * 2)
        // light pool on the wet road in front of the lamp
        const px = hx + cw * 0.12
        const py = groundY + ch * 0.05
        const pr = cw * 0.55
        sc.save()
        sc.translate(px, py)
        sc.scale(1, 0.28)
        const pool = sc.createRadialGradient(0, 0, 0, 0, 0, pr)
        pool.addColorStop(0, "rgba(230,234,240,0.16)")
        pool.addColorStop(1, "rgba(230,234,240,0)")
        sc.fillStyle = pool
        sc.beginPath()
        sc.arc(0, 0, pr, 0, Math.PI * 2)
        sc.fill()
        sc.restore()
      }
    }

    // ── shot B: from the kerb, it blasts past right → left
    const sideW = narrow ? W * 1.8 : W * 1.02
    const sideScale = sideW / SIDE.w
    const sideH = SIDE.h * sideScale
    const groundSide = H * (narrow ? 0.7 : 0.9)
    const passT = range(p, 0.37, 0.66)
    const carX = W + sideW * 0.02 - passT * (W + sideW * 1.1)
    const carY = groundSide - sideH * 0.97
    const rearWheelX = carX + SIDE.wr.cx * sideScale
    const rearWheelY = carY + (SIDE.wr.cy + SIDE.wr.r * 0.95) * sideScale

    if (sideShot) {
      // asphalt in the foreground + skid marks left behind
      const road = sc.createLinearGradient(0, horizon, 0, H)
      road.addColorStop(0, "rgba(28,30,34,0)")
      road.addColorStop(0.4, "rgba(18,19,22,0.9)")
      road.addColorStop(1, "#0a0b0d")
      sc.fillStyle = road
      sc.fillRect(0, horizon, W, H - horizon)
      if (passT > 0) {
        const from = Math.max(0, rearWheelX)
        const fade = 1 - range(p, 0.86, 1) * 0.6
        for (const [dy, wdt] of [
          [0, sideScale * 70],
          [-sideScale * 34, sideScale * 40],
        ]) {
          const g = sc.createLinearGradient(from, 0, W, 0)
          g.addColorStop(0, `rgba(4,4,5,${0.75 * fade})`)
          g.addColorStop(1, `rgba(4,4,5,${0.25 * fade})`)
          sc.fillStyle = g
          sc.fillRect(from, groundSide - wdt * 0.4 + dy, W - from, wdt)
        }
      }

      if (A.side?.complete && A.side.naturalWidth && passT > 0 && passT < 1) {
        const speed = Math.sin(passT * Math.PI)
        // motion trail
        for (let k = 3; k >= 1; k--) {
          sc.globalAlpha = 0.09 * speed
          sc.drawImage(A.side, carX + k * 40 * speed, carY, sideW, sideH)
        }
        sc.globalAlpha = 1
        // reflection on wet asphalt
        sc.save()
        sc.globalAlpha = 0.18
        sc.translate(0, groundSide * 2)
        sc.scale(1, -1)
        sc.drawImage(A.side, carX, carY, sideW, sideH)
        sc.restore()
        sc.drawImage(A.side, carX, carY, sideW, sideH)
        // spinning wheels
        const angle = -(carX / (SIDE.wf.r * sideScale)) // rolls left
        for (const [img, wh] of [
          [A.wf, SIDE.wf],
          [A.wr, SIDE.wr],
        ] as const) {
          if (!img?.complete) continue
          const r = wh.r * sideScale
          sc.save()
          sc.translate(carX + wh.cx * sideScale, carY + wh.cy * sideScale)
          sc.rotate(angle)
          sc.drawImage(img, -r, -r, r * 2, r * 2)
          sc.restore()
        }
        // tail light glow
        const tx = carX + sideW * 0.985
        const ty = carY + sideH * 0.33
        const tg = sc.createRadialGradient(tx, ty, 0, tx, ty, 90 * sideScale + 30)
        tg.addColorStop(0, "rgba(225,20,10,0.55)")
        tg.addColorStop(1, "rgba(225,20,10,0)")
        sc.fillStyle = tg
        sc.fillRect(tx - 200, ty - 200, 400, 400)
      }
    }

    // the street goes dark as the smoke settles, so the word reads
    const dusk = range(p, 0.74, 1)
    if (dusk > 0) {
      sc.fillStyle = `rgba(8,9,11,${dusk * 0.7})`
      sc.fillRect(0, 0, W, H)
    }

    // ── foreground fx: smoke + rain
    fx.clearRect(0, 0, W, H)
    const puff = A.puff
    if (puff) {
      const clear = range(p, 0.76, 0.96) // smoke thins out
      for (const s of puffs.current) {
        const age = (p - s.b) / s.life
        if (age <= 0) continue
        let x: number, y: number
        if (s.kind === 0) {
          // born at the rear tyre at the moment of birth
          const tb = range(s.b, 0.37, 0.66)
          const bornX = W + sideW * 0.02 - tb * (W + sideW * 1.1) + SIDE.wr.cx * sideScale
          x = bornX + s.dx * W * Math.min(age, 1.6) * 0.6
          y = rearWheelY - sideScale * 30 + s.dy * H * Math.min(age, 1.6)
        } else {
          x = s.x0 * W + s.dx * W * age
          y = s.y0 * H + s.dy * H * age
        }
        const r = (s.r0 + s.grow * 0.22 * Math.min(age, 2)) * Math.max(W, H)
        let a = Math.min(1, age * 4) * 0.7 * (1 - clear * 0.97)
        if (s.kind === 1) a *= Math.min(1, age * 2) * 0.7
        if (a <= 0.01) continue
        fx.globalAlpha = Math.min(1, a)
        fx.save()
        fx.translate(x, y)
        fx.rotate(s.spin + age * 0.4)
        fx.drawImage(puff, -r, -r, r * 2, r * 2)
        fx.restore()
      }
      fx.globalAlpha = 1
    }

    // rain: from the vanishing point at us (shot A), slanting past (shot B)
    const rain = mulberry(11)
    fx.strokeStyle = "rgba(210,220,235,0.35)"
    fx.lineWidth = 1.2
    fx.beginPath()
    const drops = narrow ? 70 : 140
    for (let i = 0; i < drops; i++) {
      const sp = 0.5 + rain()
      const ang = rain() * Math.PI * 2
      const ox = rain()
      const oy = rain()
      if (!sideShot) {
        const life = (now * sp * 0.9 + rain()) % 1
        const d = Math.pow(life, 2.4) * Math.max(W, H) * 0.9
        const vx = W / 2 + Math.cos(ang) * d
        const vy = horizon + Math.sin(ang) * d * 0.7
        const len = 4 + 40 * life
        fx.moveTo(vx, vy)
        fx.lineTo(vx + Math.cos(ang) * len, vy + Math.sin(ang) * len * 0.7)
      } else {
        const yy = ((oy + now * sp * 1.4) % 1) * (H + 80) - 40
        const xx = ((ox + now * 0.25) % 1) * (W + 200) - 100
        fx.moveTo(xx, yy)
        fx.lineTo(xx - 10, yy + 28)
      }
    }
    fx.stroke()

    // cut between shots: a fast white-grey wipe
    const cut = 1 - Math.abs(p - 0.36) / 0.025
    if (cut > 0) {
      fx.fillStyle = `rgba(200,204,210,${cut * 0.55})`
      fx.fillRect(0, 0, W, H)
    }

    // ── REDLINE out of the smoke
    const word = ease(range(p, 0.76, 0.97))
    if (wordRef.current) {
      wordRef.current.style.opacity = String(word * 0.94)
      wordRef.current.style.filter = `blur(${(1 - word) * 28}px)`
      wordRef.current.style.transform = `scale(${1.08 - word * 0.08})`
      wordRef.current.style.letterSpacing = `${-0.02 + (1 - word) * 0.12}em`
    }
    if (subRef.current) {
      const v = range(p, 0.92, 1)
      subRef.current.style.opacity = String(v)
      subRef.current.style.transform = `translateY(${(1 - v) * 14}px)`
    }
    if (hintRef.current) hintRef.current.style.opacity = p < 0.015 || p > 0.985 ? "1" : "0"
    if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
    if (skipRef.current) {
      const locked = document.documentElement.dataset.scrubLocked === "true"
      const show = locked && p < 0.97
      skipRef.current.style.opacity = show ? "1" : "0"
      skipRef.current.style.pointerEvents = show ? "auto" : "none"
    }
  }, [])

  const controls = useScrollScrub(sectionRef, { distance: 5200, onFrame, smoothing: 0.08 })

  return (
    <section
      ref={sectionRef}
      data-tone="dark"
      aria-label="REDLINE — автосервис"
      className="dark relative h-[100svh] min-h-[540px] w-full overflow-hidden bg-[#0b0c0e] text-[#eceae6]"
      style={{ touchAction: "pan-x" }}
    >
      <h1 className="sr-only">REDLINE — автосервис в Москве: диагностика, ремонт и ТО мощных машин</h1>
      <canvas ref={sceneRef} aria-hidden className="absolute inset-0 h-full w-full" />

      <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4">
        <div
          ref={wordRef}
          className="display select-none text-[15.5vw] leading-[0.85] md:text-[15vw]"
          style={{ opacity: 0, color: "#eceae6", textShadow: "0 0 40px rgba(236,234,230,.25), 0 0 120px rgba(236,234,230,.15)" }}
        >
          REDLINE
        </div>
        <p ref={subRef} className="mt-6 text-center text-[clamp(13px,1.2vw,17px)] font-semibold uppercase tracking-[0.32em] text-white/70" style={{ opacity: 0 }}>
          Автосервис · Москва · Электрозаводская, 7
        </p>
      </div>

      <canvas ref={fxRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* vignette, keeps the frame calm */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(0,0,0,.55)_100%)]" />

      <div
        ref={hintRef}
        className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-white/65 transition-opacity duration-500"
      >
        Листайте
        <svg width="14" height="18" viewBox="0 0 14 18" className="animate-bounce">
          <path d="M7 1 L7 17 M2 12 L7 17 L12 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <button
        ref={skipRef}
        onClick={() => controls.current.skip()}
        className="glow-ring absolute bottom-6 right-[var(--margin)] rounded-[4px] bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white/85 opacity-0 transition-opacity hover:bg-white/15"
      >
        Пропустить
      </button>

      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10">
        <div ref={barRef} className="h-full origin-left scale-x-0 bg-white/70" />
      </div>
    </section>
  )
}
