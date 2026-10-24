"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { CAR_CLASSES, SERVICES, SERVICE_GROUPS, formatRub, priceFor, type CarClass } from "@/lib/content"
import { cn } from "@/lib/utils"
import { Tach, type TachHandle } from "./tach"

/** Animated number that rolls to its new value. */
function Rolling({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 600)
      const e = 1 - Math.pow(1 - k, 3)
      setShown(Math.round(a + (value - a) * e))
      if (k < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      from.current = value
    }
  }, [value])
  return <>{format(shown)}</>
}

export function Calculator() {
  const [carClass, setCarClass] = useState<CarClass>("sport")
  const [picked, setPicked] = useState<string[]>(["to", "brakes"])
  const [group, setGroup] = useState(SERVICE_GROUPS[0])
  const tach = useRef<TachHandle>(null)

  const chosen = SERVICES.filter((s) => picked.includes(s.id))
  const total = useMemo(() => chosen.reduce((sum, s) => sum + priceFor(s, carClass), 0), [chosen, carClass])
  const hours = chosen.reduce((h, s) => h + s.hours, 0)

  // The bigger the job, the higher the needle: 0 → 7000 at ~120 000 ₽
  useEffect(() => {
    tach.current?.set(Math.min(8000, 900 + (total / 120000) * 6100))
  }, [total])

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const query = new URLSearchParams({ class: carClass, services: picked.join(",") }).toString()

  return (
    <div className="mt-16 grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        {/* car class */}
        <fieldset>
          <legend className="mb-4 text-[17px] font-bold">Класс машины</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {CAR_CLASSES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCarClass(c.id)}
                data-active={carClass === c.id}
                aria-pressed={carClass === c.id}
                className={cn(
                  "glow-ring rounded-[4px] p-4 text-left transition-colors duration-300",
                  carClass === c.id ? "bg-ink text-paper" : "bg-paper hover:bg-white",
                )}
              >
                <div className="text-[17px] font-bold">{c.label}</div>
                <div className={cn("mt-1 text-[14px]", carClass === c.id ? "text-paper/70" : "text-ink-soft")}>{c.hint}</div>
              </button>
            ))}
          </div>
        </fieldset>

        {/* group tabs */}
        <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Группы работ">
          {SERVICE_GROUPS.map((g) => {
            const count = SERVICES.filter((s) => s.group === g && picked.includes(s.id)).length
            return (
              <button
                key={g}
                role="tab"
                aria-selected={group === g}
                data-active={group === g}
                onClick={() => setGroup(g)}
                className={cn(
                  "glow-ring rounded-[4px] px-4 py-2.5 text-[15px] font-semibold transition-colors duration-300",
                  group === g ? "bg-[#e10600] text-white" : "bg-paper hover:bg-white",
                )}
              >
                {g}
                {count > 0 && <span className="ml-2 tabular opacity-80">· {count}</span>}
              </button>
            )
          })}
        </div>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2" role="tabpanel">
          {SERVICES.filter((s) => s.group === group).map((s) => {
            const on = picked.includes(s.id)
            return (
              <li key={s.id} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  aria-pressed={on}
                  data-active={on}
                  className={cn(
                    "glow-ring flex w-full items-start gap-3 rounded-[4px] p-4 text-left transition-colors duration-300",
                    on ? "bg-white" : "bg-paper/60 hover:bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[3px] transition-colors",
                      on ? "bg-[#e10600] text-white" : "bg-ink/10",
                    )}
                  >
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[16px] font-semibold">{s.name}</span>
                    <span className="mt-0.5 block text-[14px] text-ink-soft">{s.note}</span>
                  </span>
                  <span className="whitespace-nowrap text-[15px] font-bold tabular">{formatRub(priceFor(s, carClass))}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* total */}
      <aside className="lg:col-span-4">
        <div className="dark sticky top-24 overflow-hidden rounded-[4px] bg-night p-7 text-[#f2f0ec]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[15px] text-white/60">Работы под ключ</div>
              <div className="heading mt-2 whitespace-nowrap text-[clamp(26px,2.5vw,40px)] tabular">
                <Rolling value={total} format={formatRub} />
              </div>
              <div className="mt-2 whitespace-nowrap text-[14px] text-white/70 tabular">
                {chosen.length} {plural(chosen.length, ["работа", "работы", "работ"])} · ≈ {hours.toLocaleString("ru-RU")} ч в боксе
              </div>
            </div>
            <Tach ref={tach} size={92} label="нагрузка" />
          </div>
          <ul className="mt-6 max-h-[220px] space-y-2 overflow-auto pr-1 text-[15px]">
            {chosen.length === 0 && <li className="text-white/60">Выберите работы слева.</li>}
            {chosen.map((s) => (
              <li key={s.id} className="flex items-baseline animate-in fade-in slide-in-from-right-2 duration-300">
                <span className="text-white/85">{s.name}</span>
                <span className="leader" />
                <span className="whitespace-nowrap tabular">{formatRub(priceFor(s, carClass))}</span>
              </li>
            ))}
          </ul>
          <Link
            href={`/booking?${query}`}
            className={cn(
              "btn-red glow-ring mt-7 flex h-14 items-center justify-center gap-3 rounded-[4px] text-[17px] font-bold",
              chosen.length === 0 && "pointer-events-none opacity-40",
            )}
          >
            Записаться с этим списком <ArrowRight className="size-5" />
          </Link>
          <p className="mt-4 text-[13px] leading-snug text-white/55">
            Расчёт предварительный: итог фиксируем в заказ-наряде после диагностики и согласуем с вами.
          </p>
        </div>
      </aside>
    </div>
  )
}

export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}
