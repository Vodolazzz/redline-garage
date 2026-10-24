"use client"

import { useEffect, useRef, useState } from "react"

// The opening shot is real footage, full screen:
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

// The first run plays the whole story and closes with the white curtain and the
// name. After that the name stays and the two clips keep cycling under a dark veil.
type Clip = "side" | "rear"
type Stage = "intro" | "curtain" | "title"

export function SmokeHero() {
  const sideRef = useRef<HTMLVideoElement>(null)
  const rearRef = useRef<HTMLVideoElement>(null)
  const [clip, setClip] = useState<Clip>("side")
  const [stage, setStage] = useState<Stage>("intro")
  const [quality, setQuality] = useState<"hd" | "sd" | null>(null)

  // pick the file size once we know the screen
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off read of the device
    setQuality(window.innerWidth < 900 ? "sd" : "hd")
    if (reduce) setStage("title")
  }, [])

  // the cut list: side → rear → side → rear … forever
  useEffect(() => {
    const side = sideRef.current
    const rear = rearRef.current
    if (!side || !rear || !quality) return

    const play = (v: HTMLVideoElement) => v.play().catch(() => setStage("title"))

    const onSideTime = () => {
      if (clip === "side" && side.duration && side.currentTime > side.duration - 0.45) {
        rear.currentTime = 0
        play(rear)
        setClip("rear")
      }
    }
    const onRearTime = () => {
      if (stage === "intro" && rear.duration && rear.currentTime > rear.duration - CURTAIN_LEAD) setStage("curtain")
      if (clip === "rear" && rear.duration && rear.currentTime > rear.duration - 0.45) {
        side.currentTime = 0
        play(side)
        setClip("side")
      }
    }

    side.addEventListener("timeupdate", onSideTime)
    rear.addEventListener("timeupdate", onRearTime)
    if (clip === "side" && side.paused) play(side)
    return () => {
      side.removeEventListener("timeupdate", onSideTime)
      rear.removeEventListener("timeupdate", onRearTime)
    }
  }, [clip, stage, quality])

  // the curtain hands over to the name on its own
  useEffect(() => {
    if (stage !== "curtain") return
    const id = window.setTimeout(() => setStage("title"), (CURTAIN_LEAD - 0.4) * 1000)
    return () => window.clearTimeout(id)
  }, [stage])

  const grade = "saturate(0.32) contrast(1.06) brightness(0.9)"
  const showTitle = stage === "title"
  const curtain = stage === "curtain" ? 0.82 : 0
  // under the name the film keeps running, dimmed so the word always reads
  const veil = showTitle ? 0.5 : 0

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
            style={{ filter: grade, opacity: clip === "side" ? 1 : 0 }}
          />
          <video
            ref={rearRef}
            src={CLIPS.rear[quality]}
            muted
            playsInline
            preload="auto"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{
              filter: grade,
              opacity: clip === "rear" ? 1 : 0,
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
      {/* dark veil under the name while the film keeps running */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#0e0f10] transition-opacity duration-[2000ms]" style={{ opacity: veil }} />
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

    </section>
  )
}
