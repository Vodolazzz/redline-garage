"use client"

import { useEffect, useLayoutEffect, useRef } from "react"

// ─────────────────────────────────────────────────────────────
// Scroll-scrub engine shared by the locked heroes.
// While the hero sits at the very top of the page the body is
// pinned with position:fixed (the bulletproof modal-library
// technique) and wheel / touch / keyboard input drives a 0→1
// progress value instead of the page. When progress reaches the
// end and the visitor keeps pushing forward, the lock releases
// and the page scrolls on normally; scrolling back up to the top
// re-engages it so the scene can be rewound.
// ─────────────────────────────────────────────────────────────

export interface ScrollScrubOptions {
  /** Total input distance (px) needed to go from 0 to 1. */
  distance?: number
  /** Called every animation frame with eased progress (0…1). */
  onFrame: (progress: number, velocity: number) => void
  /** Easing factor of the follow (0…1). */
  smoothing?: number
}

export interface ScrollScrubControls {
  skip: () => void
  replay: () => void
}

export function clamp(v: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v))
}

/** Maps progress inside [start, end] to 0…1. */
export function range(p: number, start: number, end: number) {
  return clamp((p - start) / (end - start))
}

export function useScrollScrub(
  sectionRef: React.RefObject<HTMLElement | null>,
  { distance = 3200, onFrame, smoothing = 0.14 }: ScrollScrubOptions,
) {
  const onFrameRef = useRef(onFrame)
  const controls = useRef<ScrollScrubControls>({ skip: () => {}, replay: () => {} })

  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    // Arriving mid-page (reload, anchor link) or asking for less motion: show the finished scene.
    const startFinished = reduceMotion || window.scrollY > 4 || window.location.hash.length > 1

    let target = startFinished ? 1 : 0
    let current = target
    let rafId = 0
    let locked = false
    let lockedScrollY = 0
    let touchY = 0
    let releaseIntent = 0

    function engageLock() {
      if (locked) return
      locked = true
      lockedScrollY = window.scrollY
      const b = document.body.style
      b.position = "fixed"
      b.top = `-${lockedScrollY}px`
      b.left = "0"
      b.right = "0"
      b.width = "100%"
      b.overscrollBehavior = "none"
      document.documentElement.dataset.scrubLocked = "true"
    }

    function releaseLock() {
      if (!locked) return
      locked = false
      const b = document.body.style
      b.position = ""
      b.top = ""
      b.left = ""
      b.right = ""
      b.width = ""
      b.overscrollBehavior = ""
      delete document.documentElement.dataset.scrubLocked
      window.scrollTo(0, lockedScrollY)
    }

    if (!startFinished) engageLock()

    /** Returns true when the input was consumed by the scene. */
    function feed(deltaY: number): boolean {
      if (!locked) {
        // Re-lock only when the visitor pulls back at the very top.
        if (deltaY < 0 && window.scrollY <= 0 && target > 0) {
          engageLock()
        } else {
          return false
        }
      }
      if (deltaY > 0 && target >= 1 && current > 0.985) {
        // Two pushes past the end release the page (prevents an accidental flick).
        releaseIntent += deltaY
        if (releaseIntent > 60) {
          releaseIntent = 0
          releaseLock()
          return false
        }
        return true
      }
      releaseIntent = 0
      target = clamp(target + deltaY / distance)
      return true
    }

    const onWheel = (e: WheelEvent) => {
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY
      if (feed(dy)) e.preventDefault()
    }
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchY
      const dy = (touchY - y) * 2.2
      touchY = y
      if (feed(dy)) e.preventDefault()
    }
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return
      const map: Record<string, number> = {
        ArrowDown: 160,
        PageDown: 520,
        " ": 420,
        ArrowUp: -160,
        PageUp: -520,
      }
      const d = map[e.key]
      if (d === undefined) return
      if (feed(d)) e.preventDefault()
    }

    // In-page links (#services, #calc…) must work while the scene holds the page:
    // finish the scene, release, then let the jump happen.
    const finishForJump = () => {
      if (!locked) return
      target = current = 1
      releaseLock()
    }
    const onClickCapture = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href*='#']")
      if (a) finishForJump()
    }
    const onHash = () => {
      finishForJump()
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView()
    }
    document.addEventListener("click", onClickCapture, true)
    window.addEventListener("hashchange", onHash)

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("keydown", onKey)
    // Also bind directly on the section with capture: some iOS versions let the
    // native scroll win the race against a window-level listener.
    section.addEventListener("touchstart", onTouchStart, { passive: true, capture: true })
    section.addEventListener("touchmove", onTouchMove, { passive: false, capture: true })

    controls.current = {
      skip: () => {
        target = 1
        current = 1
        releaseLock()
      },
      replay: () => {
        window.scrollTo({ top: 0 })
        target = 0
        current = 0
        engageLock()
      },
    }

    let last = current
    function frame() {
      // dev-only hook for screenshots: window.__scrubAt = 0.5 pins the scene
      const pinned = process.env.NODE_ENV !== "production" ? (window as { __scrubAt?: number }).__scrubAt : undefined
      if (typeof pinned === "number") target = current = pinned
      current += (target - current) * smoothing
      if (Math.abs(target - current) < 0.0004) current = target
      const velocity = current - last
      last = current
      onFrameRef.current(current, velocity)
      rafId = requestAnimationFrame(frame)
    }
    onFrameRef.current(current, 0)
    rafId = requestAnimationFrame(frame)

    return () => {
      document.removeEventListener("click", onClickCapture, true)
      window.removeEventListener("hashchange", onHash)
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("keydown", onKey)
      section.removeEventListener("touchstart", onTouchStart, true)
      section.removeEventListener("touchmove", onTouchMove, true)
      cancelAnimationFrame(rafId)
      releaseLock()
    }
  }, [sectionRef, distance, smoothing])

  return controls
}
