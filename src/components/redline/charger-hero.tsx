"use client"

import { useCallback, useRef } from "react"
import { HeroScrub } from "@/components/ui/hero-scrub"

// The opening film, full screen: a red muscle sedan parked on a wet night street
// (150 frames from real photographs, scripts/make-frames.mjs). Scroll pulls the camera
// in, an x-ray scan reveals the engine bay and the cabin, then the shot dives into
// the supercharged V8. The name of the workshop sits under the car until you scroll.

const FRAMES = 150
const frameUrl = (i: number) => `/frames/hellcat/${String(i + 1).padStart(4, "0")}.webp`

// Captions follow the film: t is the position inside the frame sequence.
const CAPTIONS = [
  { from: 0.3, to: 0.58, kicker: "Скан", text: "Смотрим сквозь кузов: двигатель, салон, тормоза" },
  { from: 0.64, to: 0.98, kicker: "Двигатель", text: "И доходим до каждого болта" },
]

const clamp = (v: number) => Math.min(1, Math.max(0, v))

export function ChargerHero() {
  const capRefs = useRef<(HTMLDivElement | null)[]>([])
  const hudRef = useRef<HTMLDivElement>(null)
  const scanRef = useRef<HTMLSpanElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  const onProgress = useCallback((p: number) => {
    const t = clamp((p - 0.02) / 0.9)
    CAPTIONS.forEach((c, i) => {
      const el = capRefs.current[i]
      if (!el) return
      const v = clamp((t - c.from) / 0.05) * (1 - clamp((t - (c.to - 0.05)) / 0.05))
      el.style.opacity = String(v)
      el.style.transform = `translateY(${(1 - v) * 24}px)`
    })
    const scan = clamp((t - 0.3) / 0.3)
    if (hudRef.current) hudRef.current.style.opacity = t > 0.28 && t < 0.66 ? "1" : "0"
    if (scanRef.current) scanRef.current.textContent = `${Math.round(scan * 100)}%`
    if (nameRef.current) {
      const v = 1 - clamp(p / 0.08)
      nameRef.current.style.opacity = String(v)
      nameRef.current.style.transform = `translateY(${(1 - v) * 60}px) scale(${1 + (1 - v) * 0.04})`
      nameRef.current.style.filter = `blur(${(1 - v) * 8}px)`
    }
    if (hintRef.current) hintRef.current.style.opacity = p > 0.02 ? "0" : "1"
  }, [])

  return (
    <div data-tone="dark" className="dark">
      <h1 className="sr-only">REDLINE — автосервис в Москве: диагностика, ремонт и ТО мощных машин</h1>
      <HeroScrub fullscreen frameCount={FRAMES} frameUrl={frameUrl} accentHex="#0a0a0b" bgClassName="bg-night" onProgress={onProgress}>
        {/* street shade: darker at the top and towards the name */}
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,.55)_0%,rgba(10,10,11,0)_28%,rgba(10,10,11,0)_55%,rgba(10,10,11,.85)_100%)]" />

        <div ref={nameRef} className="absolute inset-x-0 bottom-[5vh] text-center will-change-transform max-md:bottom-[18vh]">
          <div
            className="display select-none text-[18.5vw] leading-[0.8] text-[#f2f0ec] md:text-[13vw]"
            style={{ textShadow: "0 20px 60px rgba(0,0,0,.6)" }}
          >
            REDLINE
          </div>
          <p className="mt-4 text-[clamp(14px,1.3vw,18px)] font-semibold uppercase tracking-[0.3em] text-white/75">
            Автосервис · Москва · Электрозаводская, 7
          </p>
        </div>

        {CAPTIONS.map((c, i) => (
          <div
            key={c.kicker}
            ref={(el) => {
              capRefs.current[i] = el
            }}
            className="absolute bottom-[9vh] left-[var(--margin)] max-w-[min(560px,86vw)] opacity-0"
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-[3px] bg-[#e10600] px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide text-white">
              {c.kicker}
            </div>
            <p className="heading text-[clamp(26px,3.4vw,52px)] text-white [text-shadow:0_4px_30px_rgba(0,0,0,.6)]">{c.text}</p>
          </div>
        ))}

        <div
          ref={hudRef}
          className="absolute right-[var(--margin)] top-[96px] flex items-center gap-3 rounded-[4px] bg-black/55 px-4 py-3 text-[14px] font-semibold text-[#9fe3ff] opacity-0 backdrop-blur-sm transition-opacity duration-500"
        >
          <span className="size-2 animate-pulse rounded-full bg-[#e10600] shadow-[0_0_10px_#e10600]" />
          Диагностический скан
          <span ref={scanRef} className="tabular text-white">
            0%
          </span>
        </div>

        <div ref={hintRef} className="absolute bottom-8 right-[var(--margin)] flex flex-col items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.25em] text-white/70 transition-opacity duration-500 max-md:hidden">
          Листайте
          <span className="relative h-9 w-[22px] rounded-full border-2 border-white/60">
            <span className="absolute left-1/2 top-1.5 h-2 w-[3px] -translate-x-1/2 animate-bounce rounded bg-[#e10600]" />
          </span>
        </div>
      </HeroScrub>
    </div>
  )
}
