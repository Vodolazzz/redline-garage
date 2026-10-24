"use client"

import { useCallback, useEffect, useRef } from "react"
import { range, useScrollScrub } from "@/hooks/use-scroll-scrub"

// ─────────────────────────────────────────────────────────────
// DRIVE-BY — the opening shot, scroll-locked like the MetroHero video hero
// (same lock engine: the page holds while the wheel scrubs the film, then lets go).
// Monochrome, fog and asphalt; a black Challenger with its halo lamps on:
//   0.00–0.46  it comes at the camera out of the fog, sliding, smoke pouring off the rear
//   0.40–0.54  the smoke rolls over the lens and the camera moves to its side
//   0.50–0.80  close and side-on, it slides past to the left and drives out of frame
//   0.74–0.88  the smoke it left hangs in the air
//   0.82–1.00  the smoke thins out into the word REDLINE
// The cars are two real photographs (scripts/make-hero-assets.mjs); light, smoke and
// fog are drawn live on canvas. Everything is a function of p, so scrolling back
// plays the film backwards.
// ─────────────────────────────────────────────────────────────

type Shot = { aspect: number; lamps: number[][]; rearWheel: number[] }
const META: { front: Shot; side: Shot } = {
  front: { aspect: 2.4078, lamps: [[0.0385, 0.537, 0.0185], [0.0692, 0.5407, 0.0185], [0.3231, 0.5852, 0.02], [0.3677, 0.5944, 0.02]], rearWheel: [0.9015, 0.6111] },
  side: { aspect: 2.6151, lamps: [[0.0196, 0.4897, 0.0186], [0.051, 0.4949, 0.0186], [0.2765, 0.5154, 0.0196], [0.3088, 0.5205, 0.0196]], rearWheel: [0.8922, 0.7051] },
}

const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

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
  // a billow: many small soft lobes, denser in the middle
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2
    const d = Math.pow(rnd(), 0.7) * 78
    const x = 128 + Math.cos(a) * d
    const y = 128 + Math.sin(a) * d * 0.85
    const r = 18 + rnd() * 34 * (1 - d / 140)
    const k = 0.1 + rnd() * 0.12
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, `rgba(214,216,220,${k})`)
    grad.addColorStop(0.55, `rgba(200,203,208,${k * 0.45})`)
    grad.addColorStop(1, "rgba(190,192,198,0)")
    g.fillStyle = grad
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  return c
}

interface Car {
  x: number
  y: number
  w: number
  h: number
  rot: number
  alpha: number
}

/** Where each car is on screen at progress p (pure, so the smoke can ask about the past). */
function frontCar(p: number, W: number, H: number): Car {
  const t = range(p, 0, 0.5)
  const z = 1 - (0.25 * t + 0.67 * t * t * t) // distance 1 → 0.08
  const narrow = W < 768
  const w = (W * (narrow ? 0.5 : 0.3)) / z
  const h = w / META.front.aspect
  const horizon = H * 0.47
  const ground = horizon + (H * 0.06) / z
  // sliding: the car swings a little left and right as it comes
  const sway = Math.sin(t * Math.PI * 1.6) * W * 0.05 * (1 - t * 0.5)
  const x = W * 0.5 - w * 0.42 + sway
  const rot = Math.sin(t * Math.PI * 1.6 + 0.6) * 0.03
  const alpha = 1 - smooth(range(p, 0.44, 0.52))
  return { x, y: ground - h, w, h, rot, alpha }
}

function sideCar(p: number, W: number, H: number): Car {
  const t = range(p, 0.48, 0.86)
  const narrow = W < 768
  const w = W * (narrow ? 1.7 : 1.0)
  const h = w / META.side.aspect
  const ground = H * (narrow ? 0.72 : 0.88)
  // already in frame as the camera settles, slides left and leaves
  const x = lerp(W * 0.3, -w * 1.05, t * t * 0.55 + t * 0.45) + (1 - smooth(range(p, 0.46, 0.56))) * W * 0.25
  const rot = -0.012 - Math.sin(t * Math.PI) * 0.018
  const alpha = smooth(range(p, 0.46, 0.55))
  return { x, y: ground - h, w, h, rot, alpha }
}

interface Puff {
  b: number
  dx: number
  dy: number
  grow: number
  r0: number
  life: number
  spin: number
  hang: number
}

function makePuffs(): Puff[] {
  const rnd = mulberry(42)
  const out: Puff[] = []
  // trail behind the car coming at us
  for (let i = 0; i < 240; i++) {
    out.push({ b: 0.02 + rnd() * 0.45, dx: 0.08 + rnd() * 0.5, dy: -(0.01 + rnd() * 0.12), grow: 0.4 + rnd() * 1.0, r0: 0.04 + rnd() * 0.05, life: 0.18 + rnd() * 0.3, spin: rnd() * 6.28, hang: rnd() })
  }
  // wall of smoke off the rear tyres as it slides past
  for (let i = 0; i < 260; i++) {
    out.push({ b: 0.5 + rnd() * 0.32, dx: 0.02 + rnd() * 0.42, dy: -(0.03 + rnd() * 0.36), grow: 0.5 + rnd() * 1.3, r0: 0.03 + rnd() * 0.05, life: 0.2 + rnd() * 0.3, spin: rnd() * 6.28, hang: rnd() })
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
  const assets = useRef<{ front?: HTMLImageElement; side?: HTMLImageElement; puff?: HTMLCanvasElement }>({})
  const puffs = useRef<Puff[]>([])
  const size = useRef({ w: 0, h: 0 })

  useEffect(() => {
    const load = (src: string) => {
      const img = new Image()
      img.decoding = "async"
      img.src = src
      return img
    }
    assets.current = { front: load("/media/hero/front.webp"), side: load("/media/hero/side.webp"), puff: makePuff() }
    puffs.current = makePuffs()
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = window.innerWidth
      const h = window.innerHeight
      size.current = { w, h }
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

    // ── backdrop: grey studio fog over black asphalt (the camera drops lower for the side shot)
    const shift = smooth(range(p, 0.44, 0.56))
    const horizon = H * lerp(0.47, 0.6, shift)
    const bg = sc.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, "#26282b")
    bg.addColorStop(Math.max(0.05, horizon / H - 0.25), "#4a4c50")
    bg.addColorStop(horizon / H, "#5d6064")
    bg.addColorStop(Math.min(0.99, horizon / H + 0.02), "#2c2e31")
    bg.addColorStop(1, "#0d0e0f")
    sc.fillStyle = bg
    sc.fillRect(0, 0, W, H)
    const sheen = sc.createRadialGradient(W / 2, horizon + H * 0.08, 0, W / 2, horizon + H * 0.08, W * 0.55)
    sheen.addColorStop(0, "rgba(150,154,160,0.16)")
    sheen.addColorStop(1, "rgba(150,154,160,0)")
    sc.fillStyle = sheen
    sc.fillRect(0, horizon, W, H - horizon)

    const drawCar = (img: HTMLImageElement | undefined, c: Car, shot: Shot) => {
      if (!img?.complete || !img.naturalWidth || c.alpha <= 0.01) return
      const groundY = c.y + c.h
      sc.save()
      sc.globalAlpha = c.alpha
      // contact shadow
      sc.save()
      sc.translate(c.x + c.w * 0.5, groundY - c.h * 0.03)
      sc.scale(1, 0.1)
      const cs = sc.createRadialGradient(0, 0, 0, 0, 0, c.w * 0.56)
      cs.addColorStop(0, "rgba(0,0,0,0.75)")
      cs.addColorStop(1, "rgba(0,0,0,0)")
      sc.fillStyle = cs
      sc.beginPath()
      sc.arc(0, 0, c.w * 0.56, 0, Math.PI * 2)
      sc.fill()
      sc.restore()
      // reflection on the wet floor
      sc.save()
      sc.globalAlpha = c.alpha * 0.16
      sc.translate(0, groundY * 2)
      sc.scale(1, -1)
      sc.drawImage(img, c.x, c.y, c.w, c.h)
      sc.restore()
      // body, rotated about the contact patch
      sc.translate(c.x + c.w / 2, groundY)
      sc.rotate(c.rot)
      sc.drawImage(img, -c.w / 2, -c.h, c.w, c.h)
      // halo lamps
      sc.globalCompositeOperation = "lighter"
      for (const [lx, ly, lr] of shot.lamps) {
        const hx = -c.w / 2 + lx * c.w
        const hy = -c.h + ly * c.h
        const r = lr * c.w
        const halo = sc.createRadialGradient(hx, hy, r * 0.55, hx, hy, r * 1.25)
        halo.addColorStop(0, "rgba(255,255,255,0)")
        halo.addColorStop(0.35, "rgba(236,240,245,0.55)")
        halo.addColorStop(1, "rgba(236,240,245,0)")
        sc.fillStyle = halo
        sc.beginPath()
        sc.arc(hx, hy, r * 1.3, 0, Math.PI * 2)
        sc.fill()
        const bloom = sc.createRadialGradient(hx, hy, 0, hx, hy, r * 5)
        bloom.addColorStop(0, "rgba(225,230,236,0.2)")
        bloom.addColorStop(1, "rgba(225,230,236,0)")
        sc.fillStyle = bloom
        sc.beginPath()
        sc.arc(hx, hy, r * 5, 0, Math.PI * 2)
        sc.fill()
      }
      sc.globalCompositeOperation = "source-over"
      sc.restore()
    }

    const fc = frontCar(p, W, H)
    const sdc = sideCar(p, W, H)

    // headlight beams through the fog, towards the camera
    if (fc.alpha > 0.01) {
      const gy = fc.y + fc.h
      for (const [lx, ly] of [META.front.lamps[1], META.front.lamps[3]]) {
        const hx = fc.x + lx * fc.w
        const hy = fc.y + ly * fc.h
        sc.save()
        sc.globalAlpha = fc.alpha
        sc.globalCompositeOperation = "lighter"
        const spread = fc.w * 0.6
        const end = Math.max(H, gy + 40)
        for (const [l, r, a] of [
          [0.9, 0.25, 0.05],
          [0.65, 0.1, 0.06],
          [0.45, 0.0, 0.07],
        ]) {
          const beam = sc.createLinearGradient(hx, hy, hx, end)
          beam.addColorStop(0, `rgba(222,226,232,${a})`)
          beam.addColorStop(1, "rgba(222,226,232,0)")
          sc.fillStyle = beam
          sc.beginPath()
          sc.moveTo(hx - 3, hy)
          sc.lineTo(hx + 3, hy)
          sc.lineTo(hx + spread * r, end)
          sc.lineTo(hx - spread * l, end)
          sc.closePath()
          sc.fill()
        }
        sc.restore()
      }
    }

    drawCar(A.front, fc, META.front)

    // rubber left on the asphalt behind the sliding car
    if (sdc.alpha > 0.01) {
      const ry = sdc.y + sdc.h * 0.98
      const from = Math.max(0, sdc.x + sdc.w * META.side.rearWheel[0])
      if (from < W) {
        const g = sc.createLinearGradient(from, 0, W, 0)
        g.addColorStop(0, `rgba(5,5,6,${0.45 * sdc.alpha})`)
        g.addColorStop(1, `rgba(5,5,6,0)`)
        sc.fillStyle = g
        sc.beginPath()
        sc.moveTo(from, ry - sdc.h * 0.035)
        sc.quadraticCurveTo((from + W) / 2, ry - sdc.h * 0.06, W, ry - sdc.h * 0.02)
        sc.lineTo(W, ry + sdc.h * 0.03)
        sc.quadraticCurveTo((from + W) / 2, ry - sdc.h * 0.01, from, ry + sdc.h * 0.02)
        sc.closePath()
        sc.fill()
      }
    }
    drawCar(A.side, sdc, META.side)

    // the street darkens as the smoke settles, so the word reads
    const dusk = range(p, 0.8, 1)
    if (dusk > 0) {
      sc.fillStyle = `rgba(10,11,12,${dusk * 0.55})`
      sc.fillRect(0, 0, W, H)
    }

    // ── smoke, in front of everything
    fx.clearRect(0, 0, W, H)
    const puff = A.puff
    if (puff) {
      const clear = smooth(range(p, 0.82, 0.98))
      const lens = Math.sin(range(p, 0.4, 0.58) * Math.PI) // the cloud that rolls over the camera at the cut
      for (const s of puffs.current) {
        const age = (p - s.b) / s.life
        if (age <= 0) continue
        // the emitter is the rear tyre of whichever car was on screen at birth
        const fromSide = s.b > 0.48
        const car = fromSide ? sideCar(s.b, W, H) : frontCar(s.b, W, H)
        const shot = fromSide ? META.side : META.front
        if (!fromSide && car.alpha <= 0.05) continue
        const ex = car.x + car.w * shot.rearWheel[0]
        const ey = car.y + car.h * (shot.rearWheel[1] + 0.22)
        const k = Math.min(age, 1.8)
        const dir = fromSide ? 1 : 0.6
        const x = ex + s.dx * W * k * 0.45 * dir + Math.sin(now * 0.3 + s.spin) * 8
        const y = ey + s.dy * H * k * (fromSide ? 1 : 0.6) - car.h * 0.02
        const scale = fromSide ? 1 : Math.max(0.3, car.w / W) * 0.9
        const r = (s.r0 + s.grow * 0.2 * k) * Math.max(W, H) * scale
        let a = Math.min(1, age * 3) * 0.9
        // the smoke hangs where it was left, then clears for the word
        a *= 1 - clear * (0.9 + s.hang * 0.1)
        if (a <= 0.01) continue
        fx.globalAlpha = Math.min(1, a)
        fx.save()
        fx.translate(x, y)
        fx.rotate(s.spin + k * 0.3)
        fx.drawImage(puff, -r, -r, r * 2, r * 2)
        fx.restore()
      }
      if (lens > 0) {
        fx.globalAlpha = lens * 0.85
        fx.fillStyle = "rgb(120,123,128)"
        fx.fillRect(0, 0, W, H)
        for (let i = 0; i < 8; i++) {
          const r = Math.max(W, H) * (0.35 + (i % 3) * 0.1)
          fx.drawImage(puff, (i / 7) * W - r, H * (0.3 + (i % 2) * 0.3) - r, r * 2, r * 2)
        }
      }
      fx.globalAlpha = 1
    }

    // ── REDLINE out of the smoke
    const word = smooth(range(p, 0.82, 0.98))
    if (wordRef.current) {
      wordRef.current.style.opacity = String(word * 0.92)
      wordRef.current.style.filter = `blur(${(1 - word) * 22}px)`
      wordRef.current.style.transform = `scale(${1.06 - word * 0.06})`
      wordRef.current.style.letterSpacing = `${-0.02 + (1 - word) * 0.1}em`
    }
    if (subRef.current) {
      const v = range(p, 0.93, 1)
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

  const controls = useScrollScrub(sectionRef, { distance: 5600, onFrame, smoothing: 0.07 })

  return (
    <section
      ref={sectionRef}
      data-tone="dark"
      aria-label="REDLINE — автосервис"
      className="dark relative h-[100svh] min-h-[540px] w-full overflow-hidden bg-[#141517] text-[#eceae6]"
      style={{ touchAction: "pan-x" }}
    >
      <h1 className="sr-only">REDLINE — автосервис в Москве: диагностика, ремонт и ТО мощных машин</h1>
      <canvas ref={sceneRef} aria-hidden className="absolute inset-0 h-full w-full" />

      <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4">
        <div
          ref={wordRef}
          className="display select-none text-[15.5vw] leading-[0.85] md:text-[15vw]"
          style={{ opacity: 0, color: "#e9e7e3", textShadow: "0 0 40px rgba(233,231,227,.22), 0 0 120px rgba(233,231,227,.12)" }}
        >
          REDLINE
        </div>
        <p ref={subRef} className="mt-6 text-center text-[clamp(13px,1.2vw,17px)] font-semibold uppercase tracking-[0.32em] text-white/65" style={{ opacity: 0 }}>
          Автосервис · Москва · Электрозаводская, 7
        </p>
      </div>

      <canvas ref={fxRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(0,0,0,.5)_100%)]" />

      <div
        ref={hintRef}
        className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-white/60 transition-opacity duration-500"
      >
        Листайте
        <svg width="14" height="18" viewBox="0 0 14 18" className="animate-bounce">
          <path d="M7 1 L7 17 M2 12 L7 17 L12 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <button
        ref={skipRef}
        onClick={() => controls.current.skip()}
        className="glow-ring absolute bottom-6 right-[var(--margin)] rounded-[4px] bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white/80 opacity-0 transition-opacity hover:bg-white/15"
      >
        Пропустить
      </button>

      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10">
        <div ref={barRef} className="h-full origin-left scale-x-0 bg-white/60" />
      </div>
    </section>
  )
}
