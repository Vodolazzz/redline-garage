"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight, Volume2, VolumeX, SkipForward } from "lucide-react"
import { clamp, range, useScrollScrub } from "@/hooks/use-scroll-scrub"
import { SmokeField } from "@/lib/smoke"
import { EngineSound } from "@/lib/engine-sound"
import { Car911 } from "./car-911"
import { Tach, type TachHandle } from "./tach"

// ─────────────────────────────────────────────────────────────
// IGNITION — the locked opening scene.
// Scroll drives one 0→1 timeline:
//   0.00–0.22  the roller door rises, the bay light comes on
//   0.22–0.42  burnout: wheels spin in place, smoke, the tach climbs
//   0.42–0.62  launch out of the bay, stop on the wordmark (nose dive)
//   0.62–1.00  smoke clears; the name, the offer and the button land
// After the release, scrolling the page drives the car off to the right.
// ─────────────────────────────────────────────────────────────

const CAPTIONS = [
  { from: 0.05, to: 0.22, text: "Ворота открываются в 8:00. Каждый день." },
  { from: 0.24, to: 0.41, text: "Прогрев. Мы слышим мотор раньше, чем видим машину." },
  { from: 0.43, to: 0.6, text: "До красной линии — 7000 оборотов." },
]

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export function IgnitionHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const doorRef = useRef<HTMLDivElement>(null)
  const bayRef = useRef<HTMLDivElement>(null)
  const carRef = useRef<HTMLDivElement>(null)
  const carBodyRef = useRef<HTMLDivElement>(null)
  const frontWheel = useRef<SVGGElement>(null)
  const rearWheel = useRef<SVGGElement>(null)
  const headlight = useRef<SVGGElement>(null)
  const wordRef = useRef<HTMLDivElement>(null)
  const finalRefs = useRef<HTMLElement[]>([])
  const captionRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const hintRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const linesRef = useRef<HTMLDivElement>(null)
  const tach = useRef<TachHandle>(null)
  const smoke = useRef<SmokeField | null>(null)
  const sound = useRef<EngineSound | null>(null)
  const state = useRef({ wheelAngle: 0, lastX: 0, exit: 0, rpm: 0, p: 0 })
  const [soundOn, setSoundOn] = useState(false)

  useEffect(() => {
    finalRefs.current = Array.from(sectionRef.current?.querySelectorAll<HTMLElement>("[data-final]") ?? [])
    if (!canvasRef.current) return
    smoke.current = new SmokeField(canvasRef.current)
    const onResize = () => smoke.current?.resize()
    window.addEventListener("resize", onResize)
    // After the release the page scroll drives the car away.
    const onScroll = () => {
      const h = sectionRef.current?.offsetHeight || window.innerHeight
      state.current.exit = clamp(window.scrollY / (h * 0.9))
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onScroll)
      sound.current?.dispose()
      sound.current = null
    }
  }, [])

  const onFrame = useCallback((p: number, velocity: number) => {
    const s = state.current
    s.p = p
    const field = smoke.current
    const W = field?.width || window.innerWidth
    const H = field?.height || window.innerHeight
    const narrow = W < 768

    // ── door and bay light
    const door = easeInOut(range(p, 0.03, 0.22))
    if (doorRef.current) doorRef.current.style.transform = `translateY(${-door * 100}%)`
    if (bayRef.current) {
      const flicker = p > 0.02 && p < 0.08 ? (Math.sin(p * 900) > 0 ? 1 : 0.35) : 1
      bayRef.current.style.opacity = String(clamp(p / 0.06) * flicker)
    }
    if (headlight.current) headlight.current.style.opacity = p > 0.06 ? "1" : "0"

    // ── car position (centre of the car, px)
    const carW = carRef.current?.offsetWidth || 800
    const inBay = narrow ? W * 0.32 : W * 0.27
    const rest = narrow ? W * 0.5 : W * 0.56
    const launch = easeOut(range(p, 0.42, 0.62))
    let x = inBay + (rest - inBay) * launch
    // page scroll after release: drive off
    const exitT = s.exit
    x += Math.pow(exitT, 1.6) * (W + carW)

    const burn = range(p, 0.22, 0.42)
    const burning = burn > 0 && burn < 1 && launch < 0.02
    const shake = burning ? Math.sin(performance.now() / 22) * 1.6 : 0
    const dive = Math.sin(range(p, 0.56, 0.68) * Math.PI) * 3.2 // nose dive on the stop
    const squat = burning ? -1.6 : 0

    if (carRef.current) {
      carRef.current.style.transform = `translate3d(${x - carW / 2}px, ${shake}px, 0)`
    }
    if (carBodyRef.current) carBodyRef.current.style.transform = `rotate(${dive + squat}deg)`

    // ── wheels: distance driven plus wheelspin during the burnout
    const dx = x - s.lastX
    s.lastX = x
    const wheelR = (carW / 1000) * 71
    const roll = (dx / wheelR) * (180 / Math.PI)
    const spin = burning ? 38 : 0
    s.wheelAngle = (s.wheelAngle + roll + spin) % 360
    frontWheel.current?.setAttribute("transform", `rotate(${s.wheelAngle})`)
    rearWheel.current?.setAttribute("transform", `rotate(${s.wheelAngle + (burning ? 17 : 0)})`)

    // ── rpm: idle → burnout climb → redline flash on launch → settle
    let rpm = p < 0.06 ? 0 : 900
    if (burn > 0) rpm = 900 + burn * 5600
    if (launch > 0) rpm = 6500 + Math.sin(launch * Math.PI) * 900
    if (p > 0.64) rpm = 900 + (1 - range(p, 0.62, 0.74)) * 2600
    if (exitT > 0) rpm = Math.max(rpm, 900 + exitT * 6300)
    rpm += burning ? Math.sin(performance.now() / 40) * 120 : 0
    s.rpm = rpm
    tach.current?.set(rpm)
    sound.current?.setRpm(rpm)

    // ── smoke: rear tyre contact patch in stage px
    if (field) {
      const rearX = x - carW / 2 + (carW * 255) / 1000
      const groundY = (carRef.current?.offsetTop || H * 0.6) + (carW * 0.38 * 350) / 380
      const moving = Math.abs(dx) > 0.5 || Math.abs(velocity) > 0.0005
      if (burning && moving) {
        field.emit(rearX, groundY, narrow ? 2 : 4, 1, -1)
        if (Math.random() < 0.35) field.sparksAt(rearX, groundY, 2, -1)
      } else if (launch > 0 && launch < 1 && dx > 0.5) {
        field.emit(rearX, groundY, 3, 0.8, -1.4)
      } else if (exitT > 0.02 && dx > 1) {
        field.emit(rearX, groundY, 3, 1, -2)
      }
      const fade = 1 - range(p, 0.72, 0.95) * 0.85
      field.step(fade)
    }

    // ── wordmark: masked rise behind the car as it stops
    const word = easeOut(range(p, 0.5, 0.72))
    if (wordRef.current) {
      wordRef.current.style.setProperty("--rise", `${(1 - word) * 105}%`)
      wordRef.current.style.opacity = String(clamp(word * 3))
    }

    // ── speed lines
    if (linesRef.current) {
      const speed = launch > 0 && launch < 1 ? Math.sin(launch * Math.PI) : exitT > 0.02 ? exitT : 0
      linesRef.current.style.opacity = String(speed * 0.9)
      linesRef.current.style.transform = `translateX(${-((performance.now() / 2) % 200)}px)`
    }

    // ── captions
    CAPTIONS.forEach((c, i) => {
      const el = captionRefs.current[i]
      if (!el) return
      const t = range(p, c.from, c.from + 0.04) * (1 - range(p, c.to - 0.04, c.to))
      el.style.opacity = String(t)
      el.style.transform = `translateY(${(1 - t) * 18}px)`
      el.style.filter = `blur(${(1 - t) * 6}px)`
    })

    // ── final content, staggered
    finalRefs.current.forEach((el, i) => {
      if (!el) return
      const t = easeOut(range(p, 0.7 + i * 0.035, 0.86 + i * 0.035))
      el.style.opacity = String(t)
      el.style.transform = `translateY(${(1 - t) * 26}px)`
      el.style.pointerEvents = t > 0.6 ? "auto" : "none"
    })

    if (hintRef.current) hintRef.current.style.opacity = p > 0.015 ? "0" : "1"
    if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
    if (skipRef.current) {
      const locked = document.documentElement.dataset.scrubLocked === "true"
      skipRef.current.style.opacity = locked && p < 0.98 ? "1" : "0"
      skipRef.current.style.pointerEvents = locked && p < 0.98 ? "auto" : "none"
    }
  }, [])

  const controls = useScrollScrub(sectionRef, { distance: 4200, onFrame, smoothing: 0.09 })

  function toggleSound() {
    if (!sound.current) sound.current = new EngineSound()
    if (soundOn) sound.current.off()
    else {
      sound.current.setRpm(state.current.rpm || 900)
      sound.current.on()
    }
    setSoundOn(!soundOn)
  }

  return (
    <section
      ref={sectionRef}
      aria-label="REDLINE — автоателье"
      className="dark grain relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-night text-[#f2f0ec]"
      style={{ touchAction: "pan-x" }}
    >
      {/* ── stage: back wall and floor */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_30%_40%,#1c1c1f_0%,#0a0a0b_60%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(180deg,#121214,#070708)]" />
      <div className="absolute inset-x-0 bottom-[30%] h-px bg-white/10" />

      {/* ── garage bay on the left */}
      <div className="absolute bottom-[30%] left-[-8vw] h-[58%] w-[64vw] md:left-[2vw] md:w-[50vw]">
        <div className="absolute inset-0 overflow-hidden bg-[#140303]">
          <div
            ref={bayRef}
            className="absolute inset-0 opacity-0"
            style={{
              background:
                "radial-gradient(70% 90% at 50% 0%, rgba(255,40,20,.75), rgba(160,4,0,.35) 45%, rgba(20,3,3,0) 80%)",
            }}
          >
            {/* tool wall silhouettes */}
            <svg className="absolute right-[8%] top-[14%] h-[38%] opacity-40" viewBox="0 0 220 120" aria-hidden>
              <g fill="#000">
                <rect x="0" y="0" width="220" height="4" />
                <path d="M20 8 h6 v60 a8 8 0 1 1 -6 0 z" />
                <path d="M46 8 h5 v70 l8 12 h-18 l8 -12 z" />
                <circle cx="90" cy="40" r="22" />
                <circle cx="90" cy="40" r="10" fill="#7a0300" />
                <path d="M130 8 h4 v50 h12 v8 h-28 v-8 h12 z" />
                <rect x="160" y="10" width="44" height="58" rx="3" />
              </g>
            </svg>
            <div className="absolute inset-x-[6%] top-0 h-[6px] bg-white/80 blur-[2px]" />
          </div>
          {/* roller door */}
          <div ref={doorRef} className="absolute inset-0 will-change-transform">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(180deg,#d9d6d0 0 22px,#bdb9b2 22px 24px,#e6e3de 24px 26px)",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-3 bg-[#2b2b2e]" />
            <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 text-[clamp(14px,1.6vw,22px)] font-black tracking-[0.3em] text-[#e10600]">
              REDLINE · 7
            </div>
          </div>
        </div>
        {/* frame */}
        <div className="absolute -inset-x-3 -top-5 h-5 bg-[#1b1b1e]" />
        <div className="absolute -left-3 -top-5 bottom-0 w-3 bg-[#1b1b1e]" />
        <div className="absolute -right-3 -top-5 bottom-0 w-3 bg-[#1b1b1e]" />
      </div>

      {/* ── giant wordmark that rises behind the parked car */}
      <div
        ref={wordRef}
        className="pointer-events-none absolute inset-x-0 bottom-[22%] select-none overflow-hidden text-center md:bottom-[18%]"
        style={{ ["--rise" as string]: "0%" }}
        aria-hidden="true"
      >
        <span
          className="display block translate-y-[var(--rise)] text-[23vw] leading-[0.78] text-[#e10600] md:text-[21vw]"
          style={{ WebkitTextStroke: "0px", textShadow: "0 0 60px rgba(225,6,0,.35)" }}
        >
          REDLINE
        </span>
      </div>

      {/* ── speed lines */}
      <div ref={linesRef} className="pointer-events-none absolute inset-y-[35%] -right-[200px] left-0 opacity-0" aria-hidden>
        {[12, 28, 41, 55, 63, 77, 88].map((top, i) => (
          <span
            key={top}
            className="absolute h-[2px] bg-gradient-to-r from-transparent via-white/70 to-transparent"
            style={{ top: `${top}%`, left: `${(i * 23) % 70}%`, width: `${120 + ((i * 53) % 180)}px` }}
          />
        ))}
      </div>

      {/* ── the car */}
      <div
        ref={carRef}
        className="absolute bottom-[19%] left-0 w-[118vw] will-change-transform md:bottom-[17%] md:w-[min(64vw,1040px)]"
        style={{ transform: "translate3d(28vw,0,0)" }}
      >
        <div ref={carBodyRef} className="origin-[30%_90%] transition-none">
          <Car911 frontWheelRef={frontWheel} rearWheelRef={rearWheel} headlightRef={headlight} className="h-auto w-full" />
        </div>
      </div>

      {/* ── smoke on top of everything physical */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />

      {/* ── captions during the scene */}
      <div className="pointer-events-none absolute inset-x-0 top-[16%] frame md:top-[18%]">
        {CAPTIONS.map((c, i) => (
          <p
            key={c.text}
            ref={(el) => {
              captionRefs.current[i] = el
            }}
            className="heading absolute inset-x-[var(--margin)] max-w-[22ch] text-[clamp(26px,3.6vw,56px)] opacity-0 md:left-[34vw]"
          >
            {c.text}
          </p>
        ))}
      </div>

      {/* ── final content (also the no-JS state) */}
      <div className="absolute inset-x-0 top-[84px] frame md:top-[104px]">
        <div className="max-w-[640px]">
          <h1 data-final className="heading text-[clamp(30px,4.4vw,64px)]">
            Автоателье для машин, которые слышно
          </h1>
          <p data-final className="mt-6 max-w-[46ch] text-[var(--step-lead)] leading-snug text-white/80">
            Диагностика, ремонт и обслуживание спортивных и премиальных автомобилей. Москва, Электрозаводская, 7.
          </p>
          <div data-final className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/booking"
              className="btn-red glow-ring inline-flex h-14 items-center gap-3 rounded-[4px] px-7 text-[17px] font-bold"
              data-cursor="Запись"
            >
              Записаться на сервис <ArrowRight className="size-5" />
            </Link>
            <a
              href="#calc"
              className="glow-ring inline-flex h-14 items-center rounded-[4px] bg-white/8 px-6 text-[17px] font-semibold text-white transition-colors hover:bg-white/14"
            >
              Рассчитать стоимость
            </a>
          </div>
        </div>
      </div>

      {/* ── HUD: tach + sound */}
      <div data-final className="absolute bottom-5 left-[var(--margin)] flex items-end gap-4 md:bottom-8">
        <Tach ref={tach} size={112} />
        <div className="hidden pb-3 text-[14px] leading-tight text-white/70 sm:block">
          <div className="font-bold text-white">Открыто 8:00–22:00</div>
          <div>+7 495 700-70-00</div>
          <button
            onClick={toggleSound}
            className="glow-ring mt-3 inline-flex items-center gap-2 rounded-[4px] bg-white/8 px-3 py-2 text-[13px] font-semibold text-white hover:bg-white/14"
            aria-pressed={soundOn}
          >
            {soundOn ? <Volume2 className="size-4 text-[#e10600]" /> : <VolumeX className="size-4" />}
            {soundOn ? "Звук мотора: вкл" : "Звук мотора"}
          </button>
        </div>
      </div>

      {/* ── scroll hint */}
      <div
        ref={hintRef}
        className="pointer-events-none absolute inset-x-0 bottom-[38%] flex flex-col items-center gap-3 text-center transition-opacity duration-500 md:bottom-auto md:top-[44%]"
      >
        <p className="heading text-[clamp(22px,2.6vw,40px)]">Крутите колесо — заведём</p>
        <span className="relative h-10 w-6 rounded-full border-2 border-white/60">
          <span className="absolute left-1/2 top-2 h-2 w-[3px] -translate-x-1/2 animate-bounce rounded bg-[#e10600]" />
        </span>
      </div>

      <button
        ref={skipRef}
        onClick={() => controls.current.skip()}
        className="glow-ring absolute bottom-6 right-[var(--margin)] inline-flex items-center gap-2 rounded-[4px] bg-white/8 px-4 py-2.5 text-[14px] font-semibold text-white opacity-0 transition-opacity hover:bg-white/14 md:bottom-9"
      >
        Пропустить интро <SkipForward className="size-4" />
      </button>

      {/* ── progress */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
        <div ref={barRef} className="h-full origin-left scale-x-0 bg-[#e10600] shadow-[0_0_12px_#e10600]" />
      </div>
    </section>
  )
}
