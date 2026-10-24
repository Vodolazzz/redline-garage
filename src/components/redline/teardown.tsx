"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { ArrowRight } from "lucide-react"
import { SERVICES, formatRub } from "@/lib/content"

// "Exploded view": the cut-out Charger sits in the middle of a blueprint stage; as you
// scroll, real close-ups of its systems fly out of their spots on the car into cards,
// joined to the car by drawn leader lines. Then a sideways track of the services.

const PARTS = [
  { id: "engine", title: "Двигатель", note: "ТО, ГРМ, охлаждение", img: "/media/parts/engine.jpg", spot: [24, 40], slot: [3, 19], group: "Двигатель" },
  { id: "hemi", title: "Наддув и впуск", note: "Компрессор, дроссель, свечи", img: "/media/parts/hemi.jpg", spot: [38, 40], slot: [3, 45], group: "Двигатель" },
  { id: "body", title: "Кузов и детейлинг", note: "Полировка, керамика, мойка", img: "/media/parts/scatpack.jpg", spot: [74, 48], slot: [3, 71], group: "Шины и кузов" },
  { id: "cabin", title: "Электрика", note: "Диагностика, кодирование, климат", img: "/media/parts/cabin.jpg", spot: [56, 16], slot: [80.5, 19], group: "Электрика" },
  { id: "brakes", title: "Тормоза", note: "Колодки, диски, жидкость", img: "/media/parts/brakes.jpg", spot: [46.5, 73], slot: [80.5, 45], group: "Ходовая и тормоза" },
  { id: "wheel", title: "Подвеска и шины", note: "Развал, амортизаторы, R22", img: "/media/parts/wheel-rear.jpg", spot: [89, 53], slot: [80.5, 71], group: "Ходовая и тормоза" },
] as const

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export function Teardown() {
  const sectionRef = useRef<HTMLElement>(null)
  const carRef = useRef<HTMLDivElement>(null)
  const xrayRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const lineRefs = useRef<(SVGPathElement | null)[]>([])
  const dotRefs = useRef<(SVGCircleElement | null)[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const outroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const tick = () => {
      raf = 0
      const section = sectionRef.current
      const car = carRef.current
      if (!section || !car) return
      const r = section.getBoundingClientRect()
      const total = r.height - window.innerHeight
      const p = reduce ? 1 : clamp(-r.top / total)
      const wide = window.innerWidth >= 900
      const vw = window.innerWidth
      const vh = window.innerHeight

      // car: slides up from below, then turns to x-ray as the parts come out
      const enter = easeOut(clamp(p / 0.18))
      const xr = clamp((p - 0.12) / 0.2)
      car.style.transform = `translateY(${(1 - enter) * 18}vh) scale(${0.92 + enter * 0.08})`
      car.style.opacity = String(enter)
      if (xrayRef.current) xrayRef.current.style.opacity = String(xr)
      const carImg = car.querySelector("img")
      if (carImg) carImg.style.opacity = String(1 - xr)

      const cb = car.getBoundingClientRect()
      if (svgRef.current) svgRef.current.setAttribute("viewBox", `0 0 ${vw} ${vh}`)

      PARTS.forEach((part, i) => {
        const card = cardRefs.current[i]
        if (!card) return
        const start = 0.22 + i * 0.07
        const t = easeOut(clamp((p - start) / 0.16))
        const sx = cb.left + (cb.width * part.spot[0]) / 100
        const sy = cb.top + (cb.height * part.spot[1]) / 100
        if (wide) {
          const tx = (vw * part.slot[0]) / 100
          const ty = (vh * part.slot[1]) / 100
          const w = card.offsetWidth
          const h = card.offsetHeight
          // fly from the spot on the car to the slot
          const x = sx - w / 2 + (tx - (sx - w / 2)) * t
          const y = sy - h / 2 + (ty - (sy - h / 2)) * t
          card.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${0.25 + 0.75 * t})`
          card.style.opacity = String(clamp(t * 1.6))
          card.style.pointerEvents = t > 0.9 ? "auto" : "none"
          const line = lineRefs.current[i]
          const dot = dotRefs.current[i]
          const ax = part.slot[0] < 50 ? tx + w : tx
          const ay = ty + h / 2
          const mx = (sx + ax) / 2
          if (line) {
            line.setAttribute("d", `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ay}, ${ax} ${ay}`)
            const len = line.getTotalLength()
            line.style.strokeDasharray = `${len}`
            line.style.strokeDashoffset = `${len * (1 - clamp((t - 0.35) / 0.65))}`
            line.style.opacity = t > 0.3 ? "1" : "0"
          }
          if (dot) {
            dot.setAttribute("cx", String(sx))
            dot.setAttribute("cy", String(sy))
            dot.style.opacity = String(clamp(t * 3))
          }
        } else {
          card.style.transform = `translate3d(0, ${(1 - t) * 40}px, 0)`
          card.style.opacity = String(t)
          card.style.pointerEvents = "auto"
          lineRefs.current[i]?.style.setProperty("opacity", "0")
          dotRefs.current[i]?.style.setProperty("opacity", "0")
        }
      })

      if (titleRef.current) {
        const v = 1 - clamp((p - 0.82) / 0.1)
        titleRef.current.style.opacity = String(v)
      }
      if (outroRef.current) {
        const v = clamp((p - 0.84) / 0.1)
        outroRef.current.style.opacity = String(v)
        outroRef.current.style.transform = `translateY(${(1 - v) * 24}px)`
        outroRef.current.style.pointerEvents = v > 0.5 ? "auto" : "none"
      }
    }
    const request = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener("scroll", request, { passive: true })
    window.addEventListener("resize", request)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", request)
      window.removeEventListener("resize", request)
    }
  }, [])

  return (
    <section
      id="teardown"
      ref={sectionRef}
      data-tone="dark"
      className="dark relative h-[380vh] bg-night text-[#f2f0ec] max-[899px]:h-auto"
      aria-labelledby="teardown-h"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden max-[899px]:relative max-[899px]:h-auto max-[899px]:overflow-visible max-[899px]:pb-20">
        {/* blueprint grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(rgba(159,227,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(159,227,255,.07) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_55%,rgba(225,6,0,.22),transparent_70%)]" />

        <div ref={titleRef} className="frame relative pt-[92px] text-center transition-none">
          <h2 id="teardown-h" className="heading text-[clamp(30px,3.6vw,58px)]">
            Разбираем до винтика
          </h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-[16px] text-white/70">
            Каждая система машины — отдельный мастер и отдельная строка в заказ-наряде. Наведите на деталь, чтобы
            перейти к работам.
          </p>
        </div>

        {/* the car */}
        <div
          ref={carRef}
          className="relative mx-auto mt-[4vh] w-[min(56vw,980px)] will-change-transform max-[899px]:w-[94vw]"
          style={{ aspectRatio: "3840 / 1717" }}
        >
          <Image src="/media/parts/charger-cutout.webp" alt="Красный Dodge Charger Daytona" fill sizes="(max-width: 900px) 94vw, 56vw" className="object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,.6)]" />
          {/* x-ray: the same picture as a cold luminous ghost */}
          <div ref={xrayRef} aria-hidden className="absolute inset-0 opacity-0">
            <Image
              src="/media/parts/charger-xray.webp"
              alt=""
              fill
              sizes="(max-width: 900px) 94vw, 56vw"
              className="object-contain drop-shadow-[0_0_30px_rgba(159,227,255,.25)]"
            />
          </div>
        </div>

        {/* leader lines */}
        <svg ref={svgRef} aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full min-[900px]:block">
          {PARTS.map((p, i) => (
            <g key={p.id}>
              <path
                ref={(el) => {
                  lineRefs.current[i] = el
                }}
                fill="none"
                stroke="#e10600"
                strokeWidth="1.5"
                style={{ opacity: 0, filter: "drop-shadow(0 0 6px rgba(225,6,0,.8))" }}
              />
              <circle
                ref={(el) => {
                  dotRefs.current[i] = el
                }}
                r="6"
                fill="#e10600"
                stroke="#fff"
                strokeWidth="2"
                style={{ opacity: 0 }}
              />
            </g>
          ))}
        </svg>

        {/* part cards */}
        <div className="max-[899px]:frame max-[899px]:mt-10 max-[899px]:grid max-[899px]:grid-cols-2 max-[899px]:gap-3">
          {PARTS.map((p, i) => {
            const count = SERVICES.filter((s) => s.group === p.group).length
            const from = Math.min(...SERVICES.filter((s) => s.group === p.group).map((s) => s.price))
            return (
              <Link
                key={p.id}
                href="#services"
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
                className="glow-ring group left-0 top-0 z-10 block w-[min(15.5vw,250px)] overflow-hidden rounded-[6px] bg-night-2 opacity-0 will-change-transform min-[900px]:absolute max-[899px]:w-auto"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={p.img} alt={p.title} fill sizes="(max-width: 900px) 46vw, 18vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-[13px] font-semibold text-white/85">
                    {count} работ · от {formatRub(from)}
                  </span>
                </div>
                <div className="p-3.5">
                  <div className="text-[17px] font-bold">{p.title}</div>
                  <div className="mt-0.5 text-[14px] text-white/60">{p.note}</div>
                </div>
              </Link>
            )
          })}
        </div>

        <div ref={outroRef} className="absolute inset-x-0 bottom-[6vh] flex flex-col items-center gap-4 px-4 text-center opacity-0 max-[899px]:hidden">
          <p className="heading max-w-[22ch] text-[clamp(22px,2.2vw,34px)]">Шесть систем. Девятнадцать работ. Один заказ-наряд.</p>
          <Link href="/booking" className="btn-red glow-ring inline-flex h-14 items-center gap-3 rounded-[4px] px-7 text-[17px] font-bold">
            Записать машину <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
