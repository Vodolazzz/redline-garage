"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

/**
 * Site-wide effects:
 *  - marks <html> with .js so [data-rise] entrances can start hidden (content stays visible without JS)
 *  - reveals [data-rise] and .mask-line elements once as they enter
 *  - a cursor: red dot + a lagging ring that grows over links and reads data-cursor labels
 *  - grinder sparks wherever you click
 */
export function SiteFx() {
  const pathname = usePathname()
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const sparks = useRef<HTMLCanvasElement>(null)

  // entrances
  useEffect(() => {
    document.documentElement.classList.add("js")
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in")
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    )
    const scan = () => document.querySelectorAll("[data-rise]:not(.is-in), [data-reveal]:not(.is-in)").forEach((el) => io.observe(el))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [pathname])

  // cursor
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    document.documentElement.classList.add("has-cursor")
    let x = -100,
      y = -100,
      rx = -100,
      ry = -100,
      scale = 1,
      targetScale = 1,
      raf = 0
    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>("a, button, summary, label, [role='button'], [data-cursor]")
      targetScale = t ? 2.4 : 1
      const text = t?.dataset.cursor ?? ""
      if (label.current && label.current.textContent !== text) label.current.textContent = text
      ring.current?.classList.toggle("is-hover", Boolean(t))
    }
    const onDown = () => (targetScale *= 0.75)
    const onUp = () => (targetScale /= 0.75)
    const loop = () => {
      rx += (x - rx) * 0.18
      ry += (y - ry) * 0.18
      scale += (targetScale - scale) * 0.2
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${scale})`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerdown", onDown)
    window.addEventListener("pointerup", onUp)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      document.documentElement.classList.remove("has-cursor")
    }
  }, [])

  // click sparks
  useEffect(() => {
    const c = sparks.current
    if (!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ctx = c.getContext("2d")!
    type S = { x: number; y: number; vx: number; vy: number; life: number; max: number }
    let list: S[] = []
    let raf = 0
    let running = false
    const resize = () => {
      const d = Math.min(2, window.devicePixelRatio || 1)
      c.width = innerWidth * d
      c.height = innerHeight * d
      ctx.setTransform(d, 0, 0, d, 0, 0)
    }
    resize()
    const loop = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      ctx.globalCompositeOperation = "lighter"
      list = list.filter((s) => s.life < s.max)
      for (const s of list) {
        s.life++
        s.x += s.vx
        s.y += s.vy
        s.vy += 0.35
        s.vx *= 0.97
        const a = 1 - s.life / s.max
        ctx.globalAlpha = a
        ctx.strokeStyle = s.life < 6 ? "#fff6d0" : "#ff4a1a"
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x - s.vx * 2, s.y - s.vy * 2)
        ctx.stroke()
      }
      if (list.length) raf = requestAnimationFrame(loop)
      else {
        running = false
        ctx.clearRect(0, 0, innerWidth, innerHeight)
      }
    }
    const onClick = (e: MouseEvent) => {
      const n = 14
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3
        const sp = 3 + Math.random() * 6
        list.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 24 + Math.random() * 18 })
      }
      if (!running) {
        running = true
        raf = requestAnimationFrame(loop)
      }
    }
    window.addEventListener("resize", resize)
    window.addEventListener("click", onClick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("click", onClick)
    }
  }, [])

  return (
    <>
      <canvas ref={sparks} className="pointer-events-none fixed inset-0 z-[90] h-screen w-screen" aria-hidden />
      <div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100] hidden [.has-cursor_&]:block">
        <div ref={dot} className="absolute -ml-[3px] -mt-[3px] size-[6px] rounded-full bg-[#e10600]" />
        <div
          ref={ring}
          className="absolute -ml-4 -mt-4 flex size-8 items-center justify-center rounded-full border-[1.5px] border-[#e10600] shadow-[0_0_14px_rgba(225,6,0,.45)] transition-[background-color,border-color] duration-300 [&.is-hover]:border-transparent [&.is-hover]:bg-[#e10600]/90"
        >
          <span ref={label} className="whitespace-nowrap text-[5px] font-bold uppercase text-white" />
        </div>
      </div>
    </>
  )
}
