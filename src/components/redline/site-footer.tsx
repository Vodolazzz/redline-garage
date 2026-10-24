"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BRAND } from "@/lib/content"

const CREDITS = [
  ["“Dodge Charger SRT Hellcat Washington DC Metro Area”", "OWS Photography", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Dodge_Charger_SRT_Hellcat_Washington_DC_Metro_Area,_USA.jpg"],
  ["“2024 Dodge Charger Daytona Scat Pack in Redeye”", "Elise240SX", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:2024_Dodge_Charger_Daytona_Scat_Pack_in_Redeye,_front_left,_2026-08-30.jpg"],
  ["“Dodge Charger Redline at NAIAS 2012”", "Autoviva", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Dodge_Charger_Redline_at_NAIAS_2012_(6683787507).jpg"],
  ["“Dodge Charger SRT Hellcat moteur”", "Zytonits", "CC BY-SA 2.0", "https://commons.wikimedia.org/wiki/File:Dodge_Charger_SRT_Hellcat_moteur_(24486213025).jpg"],
  ["“2019 Dodge Charger interior”", "deathpallie325", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:2019_Dodge_Charger_interior.jpg"],
  ["“2018 Dodge Charger Scat Pack”", "Greg Gjerdingen", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:2018_Dodge_Charger_Scat_Pack_(2).jpg"],
  ["“Dodge Charger Daytona (2024) MYLE Festival 2025”", "Alexander Migl", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Dodge_Charger_Daytona_(2024)_MYLE_Festival_2025_DSC_9392.jpg"],
  ["“Porsche 997 GT3 — 48 Rallye Rias Baixas” (видео, /film)", "Jesus Dieguez Fernandez", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Porsche_997_GT3_-_48_Rallye_Internacional_Rias_Baixas.ogv"],
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
          Видео на первом экране — Pexels (бесплатная лицензия Pexels): «Dynamic nighttime muscle car burnout» и «Moody night drift with muscle car on urban streets». Фото: {CREDITS.map(([t, a, l, href], i) => (
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
