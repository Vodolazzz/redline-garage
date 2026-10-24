"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { ArrowRight } from "lucide-react"
import { SERVICES, SERVICE_GROUPS, formatRub } from "@/lib/content"

// Services as a sideways film strip: the section is tall, the strip is sticky and
// vertical scroll moves it left. One panel per system, with its real close-up.

const PHOTO: Record<string, string> = {
  Диагностика: "/media/parts/cabin.jpg",
  Двигатель: "/media/parts/engine.jpg",
  "Ходовая и тормоза": "/media/parts/brakes.jpg",
  Электрика: "/media/parts/hemi.jpg",
  "Шины и кузов": "/media/parts/body.jpg",
}

const LEAD: Record<string, string> = {
  Диагностика: "Сначала находим причину — потом меняем детали. Отчёт с фото и видео вам в мессенджер.",
  Двигатель: "Регламент завода, допущенные масла и отметка в сервисной книжке.",
  "Ходовая и тормоза": "Стенд Hunter, протокол до и после, тормоза — целой осью.",
  Электрика: "Ищем обрыв, а не меняем блоки наугад. Кодируем и адаптируем.",
  "Шины и кузов": "Бережно к дискам R22 и к лаку: шиномонтаж без монтажки, керамика в два слоя.",
}

export function ServicesTrack() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = 0
      const s = sectionRef.current
      const tr = trackRef.current
      if (!s || !tr) return
      if (window.innerWidth < 900) {
        tr.style.transform = ""
        return
      }
      const r = s.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)))
      const max = tr.scrollWidth - window.innerWidth
      tr.style.transform = `translate3d(${-p * max}px,0,0)`
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
    }
    const req = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener("scroll", req, { passive: true })
    window.addEventListener("resize", req)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", req)
      window.removeEventListener("resize", req)
    }
  }, [])

  return (
    <section id="services" ref={sectionRef} className="relative h-[420vh] scroll-mt-16 bg-paper max-[899px]:h-auto" aria-labelledby="services-h">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden max-[899px]:relative max-[899px]:h-auto max-[899px]:py-24">
        <div className="frame mb-8 flex items-end justify-between gap-6">
          <h2 id="services-h" className="heading text-[clamp(34px,4.6vw,72px)]">
            Услуги по системам
          </h2>
          <div className="hidden w-48 pb-3 min-[900px]:block" aria-hidden>
            <div className="h-[3px] overflow-hidden rounded-full bg-ink/10">
              <div ref={barRef} className="h-full origin-left scale-x-0 bg-[#e10600]" />
            </div>
          </div>
        </div>
        <div ref={trackRef} className="flex gap-5 pl-[var(--margin)] pr-[30vw] will-change-transform max-[899px]:flex-col max-[899px]:pr-[var(--margin)]">
          {SERVICE_GROUPS.map((g) => {
            const list = SERVICES.filter((s) => s.group === g)
            return (
              <article
                key={g}
                id={`svc-${g}`}
                className="group grid w-[min(78vw,1080px)] shrink-0 overflow-hidden rounded-[6px] bg-white min-[900px]:h-[64svh] min-[900px]:grid-cols-[1.05fr_1fr] max-[899px]:w-full"
              >
                <div className="relative min-h-[220px] overflow-hidden">
                  <Image src={PHOTO[g]} alt={g} fill sizes="(max-width: 900px) 100vw, 40vw" className="object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <h3 className="heading absolute bottom-5 left-6 text-[clamp(28px,3vw,48px)] text-white">{g}</h3>
                </div>
                <div className="flex flex-col p-6 md:p-8">
                  <p className="max-w-[40ch] text-[17px] text-ink-soft">{LEAD[g]}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {list.map((s) => (
                      <li key={s.id} className="flex items-baseline text-[16px]">
                        <span className="font-semibold">{s.name}</span>
                        <span className="leader" />
                        <span className="whitespace-nowrap tabular">от {formatRub(s.price)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/booking?services=${list.map((s) => s.id).slice(0, 1).join(",")}`}
                    className="btn-red glow-ring mt-6 inline-flex h-12 items-center justify-center gap-2 self-start rounded-[4px] px-6 text-[16px] font-bold"
                  >
                    Записаться <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
