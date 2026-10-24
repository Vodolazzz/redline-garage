"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/#services", label: "Услуги" },
  { href: "/#process", label: "Как работаем" },
  { href: "/#calc", label: "Цены" },
  { href: "/#faq", label: "Вопросы" },
  { href: "/feedback", label: "Отзывы и жалобы" },
]

/** Mini rev counter: page scroll shown as rpm, redline at the bottom of the page. */
function RevBar() {
  const fill = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
      const rpm = Math.round((900 + p * 7100) / 50) * 50
      if (fill.current) {
        fill.current.style.transform = `scaleX(${p})`
        fill.current.style.background = rpm >= 7000 ? "#e10600" : "currentColor"
      }
      if (num.current) num.current.textContent = rpm.toLocaleString("ru-RU")
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="hidden items-center gap-2 text-[13px] font-semibold tabular lg:flex" aria-hidden>
      <div className="relative h-[6px] w-20 overflow-hidden rounded-full bg-current/15">
        <div ref={fill} className="absolute inset-0 origin-left scale-x-0 rounded-full" />
        <div className="absolute inset-y-0 right-0 w-[12.5%] bg-[#e10600]/50" />
      </div>
      <span ref={num} className="w-[44px] text-right">900</span>
      <span className="opacity-60">об/мин</span>
    </div>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const [onDark, setOnDark] = useState(pathname === "/")
  const [scrolled, setScrolled] = useState(false)
  const [openFor, setOpenFor] = useState<string | null>(null)
  const open = openFor === pathname
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenFor((typeof v === "function" ? v(open) : v) ? pathname : null)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      // header colour follows whatever section is under it
      const el = document.elementsFromPoint(window.innerWidth / 2, 40).find((e) => !e.closest("header"))
      const dark = el?.closest("[data-tone='dark'], .dark")
      setOnDark(Boolean(dark))
      if (pathname === "/") {
        const ids = ["services", "process", "calc", "faq"]
        let current: string | null = null
        for (const id of ids) {
          const s = document.getElementById(id)
          if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) current = `/#${id}`
        }
        setActive(current)
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    const id = window.setInterval(onScroll, 600)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.clearInterval(id)
    }
  }, [pathname])

  if (pathname.startsWith("/admin")) return null

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,color,transform] duration-500",
        onDark ? "text-[#f2f0ec]" : "text-ink",
        scrolled && (onDark ? "bg-night/85" : "bg-paper/90"),
      )}
    >
      <div className="frame flex h-16 items-center justify-between gap-6 md:h-[72px]">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="REDLINE — на главную">
          <svg viewBox="0 0 40 40" className="size-8 transition-transform duration-700 group-hover:rotate-[200deg]" aria-hidden>
            <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M20 20 L31 9" stroke="#e10600" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="3.5" fill="#e10600" />
          </svg>
          <span className="text-[19px] font-black tracking-[-0.04em]" style={{ fontFamily: "var(--font-display-face)" }}>
            REDLINE
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
          {LINKS.map((l) => {
            const isActive = active === l.href || pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                data-active={isActive}
                className={cn(
                  "glow-ring relative rounded-[4px] px-3.5 py-2 text-[15px] font-semibold transition-colors",
                  isActive ? "text-[#e10600]" : "hover:text-[#e10600]",
                )}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-4">
          <RevBar />
          <Link
            href="/booking"
            data-active={pathname === "/booking"}
            className="btn-red glow-ring hidden h-11 items-center rounded-[4px] px-5 text-[15px] font-bold sm:inline-flex"
          >
            Записаться
          </Link>
          <button
            className="glow-ring inline-flex size-11 items-center justify-center rounded-[4px] lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* mobile sheet */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-40 bg-night text-[#f2f0ec] transition-[clip-path] duration-700 ease-[cubic-bezier(.76,0,.24,1)] lg:hidden",
          open ? "[clip-path:inset(0_0_0_0)]" : "pointer-events-none [clip-path:inset(0_0_100%_0)]",
        )}
      >
        <nav className="frame flex flex-col gap-1 pt-8" aria-label="Мобильная навигация">
          {[...LINKS, { href: "/booking", label: "Записаться" }].map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="heading py-2 text-[clamp(32px,9vw,48px)] transition-[transform,opacity,color] duration-700 hover:text-[#e10600]"
              style={{
                transitionDelay: open ? `${120 + i * 60}ms` : "0ms",
                transform: open ? "none" : "translateY(30px)",
                opacity: open ? 1 : 0,
              }}
            >
              {l.label}
            </Link>
          ))}
          <p className="mt-10 text-[16px] text-white/70">
            +7 495 700-70-00 · Электрозаводская, 7
            <br />
            Ежедневно 8:00–22:00
          </p>
        </nav>
      </div>
    </header>
  )
}
