"use client"

import { useState } from "react"
import { SERVICES, SERVICE_GROUPS, formatRub } from "@/lib/content"

const SUMMARY: Record<string, string> = {
  Диагностика: "Сначала находим причину — потом меняем детали.",
  Двигатель: "Регламент завода, допущенные масла, отметка в книжке.",
  "Ходовая и тормоза": "Стенд Hunter и протокол до и после.",
  Электрика: "Ищем обрыв, а не меняем блоки наугад.",
  "Шины и кузов": "Бережно к дискам R22 и к лаку.",
}

export function ServicesIndex() {
  const [hover, setHover] = useState<string | null>(null)
  const current = SERVICES.find((s) => s.id === hover)

  return (
    <div className="grid gap-10 md:grid-cols-12">
      <div className="grid gap-10 sm:grid-cols-2 md:col-span-9 md:grid-cols-3 md:gap-y-16">
        {SERVICE_GROUPS.map((g, gi) => (
          <div key={g} data-rise style={{ ["--i" as string]: gi }}>
            <h3 className="mb-5 text-[18px] font-bold text-ink">{g}</h3>
            <ul className="space-y-1.5">
              {SERVICES.filter((s) => s.group === g).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHover(s.id)}
                    onFocus={() => setHover(s.id)}
                    onMouseLeave={() => setHover(null)}
                    className="group relative text-left text-[17px] leading-[1.3] text-ink-soft transition-colors duration-300 hover:text-ink focus-visible:text-ink"
                  >
                    <span className="absolute -left-4 top-1/2 h-[6px] w-[6px] -translate-y-1/2 scale-0 rounded-full bg-[#e10600] transition-transform duration-300 group-hover:scale-100" />
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[15px] text-ink-soft md:hidden">{SUMMARY[g]}</p>
          </div>
        ))}
      </div>
      {/* fixed spot for the hovered service */}
      <div className="hidden md:col-span-3 md:block" aria-live="polite">
        <div className="sticky top-28 min-h-[180px]">
          {current ? (
            <div key={current.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="text-[17px] font-bold">{current.name}</div>
              <p className="mt-2 text-[17px] text-ink-soft">{current.note}</p>
              <div className="mt-4 text-[17px]">
                от <span className="font-bold text-[#e10600]">{formatRub(current.price)}</span>
                {current.hours > 0 && <span className="text-ink-soft"> · {current.hours} ч в боксе</span>}
              </div>
            </div>
          ) : (
            <p className="text-[17px] text-ink-soft">Наведите на работу — покажем, что в неё входит и сколько она стоит.</p>
          )}
        </div>
      </div>
    </div>
  )
}
