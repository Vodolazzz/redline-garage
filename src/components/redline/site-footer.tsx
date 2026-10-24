"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BRAND } from "@/lib/content"

const CREDITS = [
  ["“2013 Porsche 911 Carrera 4S (991)”", "David Villarreal Fernández", "CC BY-SA 2.0", "https://commons.wikimedia.org/w/index.php?curid=29171275"],
  ["“Brembo Disc brake”", "Malsa", "CC BY-SA 1.0", "https://commons.wikimedia.org/w/index.php?curid=12146545"],
  ["“Classic car restoration project…”", "Shixart1985", "CC BY 2.0", "https://commons.wikimedia.org/w/index.php?curid=186889571"],
  ["“Assortment of tools”", "Lucia Obst (WMDE)", "CC BY-SA 4.0", "https://commons.wikimedia.org/w/index.php?curid=112838043"],
  ["“Porsche at night”", "Ben", "CC BY-SA 2.0", "https://commons.wikimedia.org/w/index.php?curid=66491271"],
  ["“Porsche 997 GT3 — 48 Rallye Rias Baixas” (видео)", "Jesus Dieguez Fernandez", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Porsche_997_GT3_-_48_Rallye_Internacional_Rias_Baixas.ogv"],
]

export function SiteFooter() {
  const pathname = usePathname()
  if (pathname.startsWith("/admin") || pathname === "/film") return null

  return (
    <footer data-tone="dark" className="dark relative grid min-h-[100svh] grid-rows-[auto_1fr_auto] bg-night pt-10 text-[#f2f0ec]">
      <div className="frame grid grid-cols-2 gap-x-6 gap-y-8 text-[15px] md:grid-cols-12">
        <div className="md:col-span-3">
          <div className="font-bold">Адрес</div>
          <p className="mt-2 text-white/65">
            {BRAND.address}
            <br />
            {BRAND.hours}
          </p>
        </div>
        <nav className="md:col-span-3" aria-label="Разделы">
          <div className="font-bold">Разделы</div>
          <ul className="mt-2 space-y-1 text-white/65">
            <li><Link className="hover:text-[#e10600]" href="/#services">Услуги</Link></li>
            <li><Link className="hover:text-[#e10600]" href="/#calc">Калькулятор</Link></li>
            <li><Link className="hover:text-[#e10600]" href="/booking">Запись на сервис</Link></li>
            <li><Link className="hover:text-[#e10600]" href="/feedback">Отзывы и жалобы</Link></li>
          </ul>
        </nav>
        <nav className="md:col-span-3" aria-label="Документы">
          <div className="font-bold">Документы</div>
          <ul className="mt-2 space-y-1 text-white/65">
            <li><Link className="hover:text-[#e10600]" href="/privacy">Политика конфиденциальности</Link></li>
            <li><Link className="hover:text-[#e10600]" href="/terms">Пользовательское соглашение</Link></li>
            <li><Link className="hover:text-[#e10600]" href="/terms#warranty">Гарантия на работы</Link></li>
          </ul>
        </nav>
        <div className="md:col-span-3">
          <div className="font-bold">Связаться</div>
          <p className="mt-2 text-white/65">
            <a className="hover:text-[#e10600]" href={BRAND.phoneHref}>{BRAND.phone}</a>
            <br />
            <a className="hover:text-[#e10600]" href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
          </p>
        </div>
      </div>
      <div />
      <div className="frame overflow-hidden pb-5">
        <svg viewBox="0 0 1000 156" className="w-full" aria-label="REDLINE">
          <text
            x="500"
            y="142"
            textAnchor="middle"
            textLength="1000"
            lengthAdjust="spacingAndGlyphs"
            fill="#e10600"
            style={{ fontFamily: "var(--font-display-face)", fontWeight: 900, fontSize: 190, letterSpacing: "-0.04em" }}
          >
            REDLINE
          </text>
        </svg>
        <p className="mt-5 text-[13px] leading-relaxed text-white/55">
          © 2026 {BRAND.legal}, ИНН {BRAND.inn}, ОГРН {BRAND.ogrn}. Сайт — концепт для портфолио; цены, мастера и реквизиты условны.
          Фото и видео: {CREDITS.map(([t, a, l, href], i) => (
            <span key={href}>
              <a className="underline underline-offset-2 hover:text-white" href={href} target="_blank" rel="noopener noreferrer">{t}</a>{" "}
              — {a}, {l}, Wikimedia Commons{i < CREDITS.length - 1 ? "; " : "."}
            </span>
          ))}
        </p>
      </div>
    </footer>
  )
}
