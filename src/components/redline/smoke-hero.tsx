"use client"

import { useEffect, useRef, useState } from "react"

// The opening shot is real footage, full screen (Pexels, free licence):
//   1. side-on, the rear tyre of a black Charger spins up, smoke pours out
//   2. from behind: the burnout, the car pulls away into its own smoke
//   3. the smoke closes the frame like a white curtain, thins out, REDLINE
// After that the name stays, and behind it a reel of other Dodge shots runs
// forever, blurred and dimmed, so the word always reads.
// No scroll lock: the page scrolls whenever the visitor wants.

const INTRO = {
  side: { hd: "/media/hero/side-1080.mp4", sd: "/media/hero/side-720.mp4" },
  rear: { hd: "/media/hero/rear-1080.mp4", sd: "/media/hero/rear-720.mp4" },
}
// how many seconds before the end of the second clip the curtain starts closing
const CURTAIN_LEAD = 3.2

// background reel: [file, in, out] in seconds, optional extra dimming for daylight shots
const REEL: [string, number, number, number?][] = [
  ["/media/hero/bg-challenger.mp4", 1.0, 3.8], // white Challenger, burnout at night
  ["/media/hero/bg-wheel.mp4", 0.1, 1.6], // black Charger, the wheel up close
  ["/media/hero/bg-charger-red.mp4", 6.2, 10.4, 0.7], // red Charger pulls out and drives off (daylight)
  ["/media/hero/bg-challenger.mp4", 8.4, 11.2], // Challenger sliding through the smoke
  ["/media/hero/rear-720.mp4", 0.3, 3.6], // tail lights in the smoke
  ["/media/hero/bg-challenger.mp4", 15.8, 18.6], // Challenger close
  ["/media/hero/side-720.mp4", 0.4, 3.2], // the tyre in its smoke
]
const FADE = 0.8 // crossfade, seconds

type Stage = "side" | "rear" | "curtain" | "title"

/** Two stacked videos taking turns through the REEL playlist, with crossfades. */
function BackgroundReel({ active }: { active: boolean }) {
  const a = useRef<HTMLVideoElement>(null)
  const b = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const A = a.current
    const B = b.current
    if (!active || !A || !B) return
    let index = 0
    let front = A
    let back = B
    let switching = false
    let raf = 0

    const load = (v: HTMLVideoElement, i: number) =>
      new Promise<void>((resolve) => {
        const [src, start] = REEL[i]
        const seek = () => {
          v.currentTime = start
          v.onseeked = () => resolve()
        }
        if (v.getAttribute("src") !== src) {
          v.onloadedmetadata = seek
          v.src = src
          v.load()
        } else seek()
      })

    const tick = async () => {
      const [, , end] = REEL[index]
      if (!switching && front.currentTime >= end - FADE) {
        switching = true
        const next = (index + 1) % REEL.length
        await load(back, next)
        back.play().catch(() => {})
        back.style.opacity = String(REEL[next][3] ?? 1)
        front.style.opacity = "0"
        const old = front
        front = back
        back = old
        index = next
        window.setTimeout(() => {
          old.pause()
          switching = false
        }, FADE * 1000)
      }
      raf = requestAnimationFrame(tick)
    }

    load(front, 0).then(() => {
      front.play().catch(() => {})
      front.style.opacity = "1"
      raf = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [active])

  const style = {
    filter: "blur(9px) saturate(0.35) brightness(0.55) contrast(1.05)",
    transform: "scale(1.08)", // hides the soft edge the blur leaves
    transition: `opacity ${FADE}s ease`,
    opacity: 0,
  }
  return (
    <div aria-hidden className="absolute inset-0 transition-opacity duration-[2000ms]" style={{ opacity: active ? 1 : 0 }}>
      <video ref={a} muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-cover" style={style} />
      <video ref={b} muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-cover" style={style} />
    </div>
  )
}

export function SmokeHero() {
  const sideRef = useRef<HTMLVideoElement>(null)
  const rearRef = useRef<HTMLVideoElement>(null)
  const [stage, setStage] = useState<Stage>("side")
  const [quality, setQuality] = useState<"hd" | "sd" | null>(null)

  // pick the file size once we know the screen
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off read of the device
    setQuality(window.innerWidth < 900 ? "sd" : "hd")
    if (reduce) setStage("title")
  }, [])

  // the intro, played once: side → rear → curtain
  useEffect(() => {
    const side = sideRef.current
    const rear = rearRef.current
    if (!side || !rear || !quality || stage === "title" || stage === "curtain") return
    const play = (v: HTMLVideoElement) => v.play().catch(() => setStage("title"))

    const onSideTime = () => {
      if (stage === "side" && side.duration && side.currentTime > side.duration - 0.45) {
        rear.currentTime = 0
        play(rear)
        setStage("rear")
      }
    }
    const onRearTime = () => {
      if (stage === "rear" && rear.duration && rear.currentTime > rear.duration - CURTAIN_LEAD) setStage("curtain")
    }
    side.addEventListener("timeupdate", onSideTime)
    rear.addEventListener("timeupdate", onRearTime)
    if (stage === "side" && side.paused) play(side)
    return () => {
      side.removeEventListener("timeupdate", onSideTime)
      rear.removeEventListener("timeupdate", onRearTime)
    }
  }, [stage, quality])

  // the curtain hands over to the name on its own
  useEffect(() => {
    if (stage !== "curtain") return
    const id = window.setTimeout(() => setStage("title"), (CURTAIN_LEAD - 0.4) * 1000)
    return () => window.clearTimeout(id)
  }, [stage])

  // once the name is up the intro clips can rest
  useEffect(() => {
    if (stage !== "title") return
    const id = window.setTimeout(() => {
      sideRef.current?.pause()
      rearRef.current?.pause()
    }, 2500)
    return () => window.clearTimeout(id)
  }, [stage])

  const grade = "saturate(0.32) contrast(1.06) brightness(0.9)"
  const showTitle = stage === "title"
  const curtain = stage === "curtain" ? 0.82 : 0

  return (
    <section data-tone="dark" aria-label="REDLINE — автосервис" className="dark relative h-[100svh] min-h-[540px] w-full overflow-hidden bg-[#141517] text-[#eceae6]">
      <h1 className="sr-only">REDLINE — автосервис в Москве: диагностика, ремонт и ТО мощных машин</h1>

      {quality && (
        <div className="absolute inset-0 transition-opacity duration-[2000ms]" style={{ opacity: showTitle ? 0 : 1 }}>
          <video
            ref={sideRef}
            src={INTRO.side[quality]}
            poster="/media/hero/poster.jpg"
            muted
            playsInline
            preload="auto"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ filter: grade, opacity: stage === "side" ? 1 : 0 }}
          />
          <video
            ref={rearRef}
            src={INTRO.rear[quality]}
            muted
            playsInline
            preload="auto"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ filter: grade, opacity: stage === "side" ? 0 : 1 }}
          />
        </div>
      )}
      {!quality && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/media/hero/poster.jpg)" }} />}

      {/* other Dodge shots, blurred and dimmed, behind the name */}
      <BackgroundReel active={showTitle && quality !== null} />

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
            textShadow: "0 0 50px rgba(255,255,255,.2), 0 10px 60px rgba(0,0,0,.45)",
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
