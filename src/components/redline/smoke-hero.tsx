"use client"

import { useEffect, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"

// The opening shot is real footage, full screen, playing once:
//   1. side-on, the rear tyre spins up and the smoke starts pouring out
//   2. from behind: the burnout, the car pulls away into its own smoke
//   3. the smoke closes the frame like a white curtain, thins out, REDLINE
// Two clips from the same night shoot (Pexels, free licence), graded down so
// nothing glares. No scroll lock: the page scrolls whenever the visitor wants.

const CLIPS = {
  side: { hd: "/media/hero/side-1080.mp4", sd: "/media/hero/side-720.mp4" },
  rear: { hd: "/media/hero/rear-1080.mp4", sd: "/media/hero/rear-720.mp4" },
}
// how many seconds before the end of the second clip the curtain starts closing
const CURTAIN_LEAD = 3.2

type Phase = "side" | "rear" | "curtain" | "title"

export function SmokeHero() {
  const sideRef = useRef<HTMLVideoElement>(null)
  const rearRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<Phase>("side")
  const [quality, setQuality] = useState<"hd" | "sd" | null>(null)

  // pick the file size once we know the screen
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off read of the device
    setQuality(window.innerWidth < 900 ? "sd" : "hd")
    if (reduce) setPhase("title")
  }, [])

  // the cut list
  useEffect(() => {
    const side = sideRef.current
    const rear = rearRef.current
    if (!side || !rear || !quality || phase === "title") return

    const play = (v: HTMLVideoElement) => v.play().catch(() => setPhase("title"))

    const onSideTime = () => {
      if (side.duration && side.currentTime > side.duration - 0.45 && phase === "side") {
        rear.currentTime = 0
        play(rear)
        setPhase("rear")
      }
    }
    const onRearTime = () => {
      if (rear.duration && rear.currentTime > rear.duration - CURTAIN_LEAD && phase === "rear") setPhase("curtain")
    }
    const onRearEnd = () => setPhase("title")

    side.addEventListener("timeupdate", onSideTime)
    rear.addEventListener("timeupdate", onRearTime)
    rear.addEventListener("ended", onRearEnd)
    if (phase === "side" && side.paused) play(side)
    return () => {
      side.removeEventListener("timeupdate", onSideTime)
      rear.removeEventListener("timeupdate", onRearTime)
      rear.removeEventListener("ended", onRearEnd)
    }
  }, [phase, quality])

  // the curtain hands over to the title on its own, even if "ended" is late
  useEffect(() => {
    if (phase !== "curtain") return
    const id = window.setTimeout(() => setPhase("title"), (CURTAIN_LEAD - 0.4) * 1000)
    return () => window.clearTimeout(id)
  }, [phase])

  function replay() {
    const side = sideRef.current
    const rear = rearRef.current
    if (!side || !rear) return
    rear.pause()
    side.currentTime = 0
    setPhase("side")
  }

  const grade = "saturate(0.32) contrast(1.06) brightness(0.9)"
  const curtain = phase === "curtain" ? 0.82 : phase === "title" ? 0.3 : 0
  const showTitle = phase === "title"

  return (
    <section data-tone="dark" aria-label="REDLINE — автосервис" className="dark relative h-[100svh] min-h-[540px] w-full overflow-hidden bg-[#141517] text-[#eceae6]">
      <h1 className="sr-only">REDLINE — автосервис в Москве: диагностика, ремонт и ТО мощных машин</h1>

      {quality && (
        <>
          <video
            ref={sideRef}
            src={CLIPS.side[quality]}
            poster="/media/hero/poster.jpg"
            muted
            playsInline
            preload="auto"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ filter: grade, opacity: phase === "side" ? 1 : 0 }}
          />
          <video
            ref={rearRef}
            src={CLIPS.rear[quality]}
            muted
            playsInline
            preload="auto"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-[opacity,transform,filter] duration-[1500ms]"
            style={{
              filter: `${grade} ${showTitle ? "blur(6px)" : ""}`,
              opacity: phase === "side" ? 0 : 1,
              transform: showTitle ? "scale(1.06)" : "scale(1)",
            }}
          />
        </>
      )}
      {!quality && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/media/hero/poster.jpg)" }} />}

      {/* the smoke curtain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-[1600ms] ease-out"
        style={{
          opacity: curtain,
          background: "radial-gradient(120% 90% at 50% 55%, rgba(226,226,228,.95), rgba(196,197,200,.92) 55%, rgba(120,122,126,.9) 100%)",
        }}
      />
      {/* calm the frame: dark top for the menu, dark bottom into the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(10,10,11,.6) 0%, rgba(10,10,11,0) 22%, rgba(10,10,11,0) 70%, rgba(20,21,23,.9) 100%)" }}
      />

      {/* REDLINE out of the smoke */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <div
          className="display select-none text-[16vw] leading-[0.85] text-[#f4f3f1] transition-all duration-[1800ms] ease-out md:text-[14vw]"
          style={{
            opacity: showTitle ? 1 : 0,
            filter: showTitle ? "blur(0px)" : "blur(24px)",
            letterSpacing: showTitle ? "-0.02em" : "0.12em",
            transform: showTitle ? "scale(1)" : "scale(1.06)",
            textShadow: "0 0 50px rgba(255,255,255,.25), 0 10px 60px rgba(0,0,0,.35)",
          }}
        >
          REDLINE
        </div>
        <p
          className="mt-6 text-[clamp(13px,1.2vw,17px)] font-semibold uppercase tracking-[0.32em] text-white/80 transition-all delay-700 duration-1000"
          style={{ opacity: showTitle ? 1 : 0, transform: showTitle ? "none" : "translateY(14px)" }}
        >
          Автосервис · Москва · Электрозаводская, 7
        </p>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-white/70 transition-opacity delay-1000 duration-700"
        style={{ opacity: showTitle ? 1 : 0 }}
      >
        Листайте
        <svg width="14" height="18" viewBox="0 0 14 18" className="animate-bounce" aria-hidden>
          <path d="M7 1 L7 17 M2 12 L7 17 L12 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {showTitle && quality && (
        <button
          onClick={replay}
          className="glow-ring absolute bottom-6 right-[var(--margin)] inline-flex items-center gap-2 rounded-[4px] bg-white/10 px-3.5 py-2.5 text-[13px] font-semibold text-white/80 hover:bg-white/15"
        >
          <RotateCcw className="size-4" /> Ещё раз
        </button>
      )}
    </section>
  )
}
