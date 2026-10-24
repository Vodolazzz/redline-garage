"use client"

import { useCallback, useRef } from "react"
import { HeroScrub } from "@/components/ui/hero-scrub"

// The opening film: real photographs of a red Charger Daytona turned into 144 frames
// (scripts/make-frames.mjs). Scroll pulls the camera in, an x-ray scan reveals the
// engine bay and the cabin, then the shot dives into the supercharged HEMI.

const FRAMES = 144
const frameUrl = (i: number) => `/frames/charger/${String(i + 1).padStart(4, "0")}.webp`

// Captions follow the film itself: t is the position inside the frame sequence.
const CAPTIONS = [
  { from: 0.02, to: 0.26, kicker: "Заезд", text: "Красный Charger встаёт на приёмку" },
  { from: 0.3, to: 0.6, kicker: "Сканер", text: "Смотрим сквозь кузов: двигатель, салон, тормоза" },
  { from: 0.66, to: 0.98, kicker: "6.2 HEMI", text: "И доходим до каждого болта компрессора" },
]

const clamp = (v: number) => Math.min(1, Math.max(0, v))

export function ChargerHero() {
  const capRefs = useRef<(HTMLDivElement | null)[]>([])
  const hudRef = useRef<HTMLDivElement>(null)
  const scanRef = useRef<HTMLSpanElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  const onProgress = useCallback((p: number) => {
    const t = clamp((p - 0.15) / 0.63)
    CAPTIONS.forEach((c, i) => {
      const el = capRefs.current[i]
      if (!el) return
      const v = clamp((t - c.from) / 0.06) * (1 - clamp((t - (c.to - 0.06)) / 0.06))
      el.style.opacity = String(v)
      el.style.transform = `translateY(${(1 - v) * 24}px)`
    })
    const scan = clamp((t - 0.28) / 0.32)
    if (hudRef.current) hudRef.current.style.opacity = t > 0.26 && t < 0.7 ? "1" : "0"
    if (scanRef.current) scanRef.current.textContent = `${Math.round(scan * 100)}%`
    if (hintRef.current) hintRef.current.style.opacity = p > 0.03 ? "0" : "1"
  }, [])

  return (
    <div data-tone="dark" className="dark">
      <h1 className="sr-only">REDLINE — автосервис для Dodge Charger и других мощных машин в Москве</h1>
      <HeroScrub
        frameCount={FRAMES}
        frameUrl={frameUrl}
        titleTop="Dodge"
        titleBottom="Charger"
        accentHex="#6e0b07"
        bgClassName="bg-night"
        titleClassName="display md:my-[-5svh] text-[#f2f0ec]"
        titleFontSize="clamp(2.6rem, 8.6vw, 8rem)"
        onProgress={onProgress}
      >
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

        <div ref={hintRef} className="absolute bottom-8 right-[var(--margin)] flex flex-col items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.25em] text-white/70 transition-opacity duration-500">
          Листайте
          <span className="relative h-9 w-[22px] rounded-full border-2 border-white/60">
            <span className="absolute left-1/2 top-1.5 h-2 w-[3px] -translate-x-1/2 animate-bounce rounded bg-[#e10600]" />
          </span>
        </div>
      </HeroScrub>
    </div>
  )
}
