"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight, Check, Loader2, Phone } from "lucide-react"
import { BRAND, CAR_CLASSES, SERVICES, SERVICE_GROUPS, TIME_SLOTS, formatRub, priceFor, type CarClass } from "@/lib/content"
import { cn } from "@/lib/utils"
import { Checkbox, Choice, Field, Input, Textarea, formatPhone } from "./form"

const MAKES = ["Porsche", "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Toyota", "Lexus", "Land Rover"]
const STEPS = ["Автомобиль", "Работы", "Дата и время", "Контакты"] as const
const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"]
const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

type Errors = Partial<Record<string, string>>

function nextDays(n: number) {
  const out: { ymd: string; day: number; wd: string; month: string }[] = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)
    const ymd = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`
    out.push({ ymd, day: x.getDate(), wd: i === 0 ? "сегодня" : i === 1 ? "завтра" : WEEKDAYS[x.getDay()], month: MONTHS[x.getMonth()] })
  }
  return out
}

export function BookingWizard() {
  const params = useSearchParams()
  const initialClass = (["comfort", "business", "sport"].includes(params.get("class") || "") ? params.get("class") : "business") as CarClass
  const initialServices = (params.get("services") || "").split(",").filter((id) => SERVICES.some((s) => s.id === id))

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const [serverError, setServerError] = useState("")
  const [group, setGroup] = useState(SERVICE_GROUPS[0])
  const days = useMemo(() => nextDays(14), [])

  const [f, setF] = useState({
    carMake: "",
    carModel: "",
    carYear: "",
    mileage: "",
    plate: "",
    vin: "",
    carClass: initialClass,
    services: initialServices.length ? initialServices : ["diag"],
    problem: "",
    date: "",
    time: "",
    waitOnSite: false,
    needReplacementCar: false,
    name: "",
    phone: "",
    email: "",
    contactBy: "call" as "call" | "telegram" | "whatsapp",
    consent: false,
    website: "",
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const chosen = SERVICES.filter((s) => f.services.includes(s.id))
  const total = chosen.reduce((sum, s) => sum + priceFor(s, f.carClass), 0)
  const dayLabel = days.find((d) => d.ymd === f.date)

  function validate(i: number): Errors {
    const e: Errors = {}
    if (i === 0) {
      if (f.carMake.trim().length < 2) e.carMake = "Укажите марку"
      if (!f.carModel.trim()) e.carModel = "Укажите модель"
      if (f.carYear && (+f.carYear < 1960 || +f.carYear > 2027)) e.carYear = "Год от 1960 до 2027"
    }
    if (i === 1 && f.services.length === 0 && f.problem.trim().length < 5) e.services = "Выберите работу или опишите, что беспокоит"
    if (i === 2) {
      if (!f.date) e.date = "Выберите день"
      if (!f.time) e.time = "Выберите время"
    }
    if (i === 3) {
      if (f.name.trim().length < 2) e.name = "Как к вам обращаться?"
      if (f.phone.replace(/\D/g, "").length < 11) e.phone = "Нужен номер полностью"
      if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Проверьте e-mail"
      if (!f.consent) e.consent = "Нужно согласие на обработку данных"
    }
    return e
  }

  function go(to: number) {
    if (to > step) {
      const e = validate(step)
      if (Object.keys(e).length) {
        setErrors(e)
        return
      }
    }
    setDir(to > step ? 1 : -1)
    setStep(to)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function submit() {
    const e = validate(3)
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    setSending(true)
    setServerError("")
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          carYear: f.carYear ? Number(f.carYear) : undefined,
          mileage: f.mileage ? Number(f.mileage.replace(/\D/g, "")) : undefined,
          website: f.website || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error || "Не получилось отправить заявку")
        if (data.issues) setErrors(Object.fromEntries(Object.entries(data.issues).map(([k, v]) => [k, (v as string[])[0]])))
        return
      }
      setDone(data.number)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setServerError("Нет связи с сервером. Позвоните нам — запишем по телефону.")
    } finally {
      setSending(false)
    }
  }

  if (done) return <Success number={done} f={f} total={total} dayLabel={dayLabel ? `${dayLabel.day} ${dayLabel.month}` : f.date} />

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        {/* stepper */}
        <ol className="mb-12 flex gap-2" aria-label="Шаги записи">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <button
                type="button"
                onClick={() => (i < step ? go(i) : undefined)}
                disabled={i > step}
                className="group w-full text-left disabled:cursor-default"
                aria-current={i === step ? "step" : undefined}
              >
                <span className="relative block h-[4px] overflow-hidden rounded-full bg-ink/10">
                  <span
                    className="absolute inset-0 origin-left bg-[#e10600] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
                    style={{ transform: `scaleX(${i < step ? 1 : i === step ? 0.5 : 0})` }}
                  />
                </span>
                <span className={cn("mt-2 block text-[14px] font-semibold transition-colors", i === step ? "text-ink" : "text-ink-soft", i < step && "group-hover:text-[#e10600]")}>
                  {i < step && <Check className="mr-1 inline size-3.5 text-[#e10600]" strokeWidth={3} />}
                  {s}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: dir * -40, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && (
              <div className="space-y-7">
                <h2 className="heading text-[clamp(28px,3vw,40px)]">Какая у вас машина?</h2>
                <Field label="Марка" error={errors.carMake} htmlFor="carMake">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {MAKES.map((m) => (
                      <Choice key={m} active={f.carMake === m} onClick={() => set("carMake", m)} className="px-3 py-2 text-[15px]">
                        {m}
                      </Choice>
                    ))}
                  </div>
                  <Input id="carMake" placeholder="Или впишите свою" value={f.carMake} onChange={(e) => set("carMake", e.target.value)} aria-invalid={!!errors.carMake} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Модель" error={errors.carModel} htmlFor="carModel">
                    <Input id="carModel" placeholder="911 Carrera S" value={f.carModel} onChange={(e) => set("carModel", e.target.value)} aria-invalid={!!errors.carModel} />
                  </Field>
                  <Field label="Год выпуска" hint="необязательно" error={errors.carYear} htmlFor="carYear">
                    <Input id="carYear" inputMode="numeric" placeholder="2021" maxLength={4} value={f.carYear} onChange={(e) => set("carYear", e.target.value.replace(/\D/g, ""))} aria-invalid={!!errors.carYear} />
                  </Field>
                  <Field label="Пробег, км" hint="необязательно" htmlFor="mileage">
                    <Input id="mileage" inputMode="numeric" placeholder="48 200" value={f.mileage} onChange={(e) => set("mileage", e.target.value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " "))} />
                  </Field>
                  <Field label="Госномер" hint="для пропуска" htmlFor="plate">
                    <Input id="plate" placeholder="А777АА 777" value={f.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} maxLength={12} />
                  </Field>
                </div>
                <Field label="Класс машины" hint="влияет на норму-час">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {CAR_CLASSES.map((c) => (
                      <Choice key={c.id} active={f.carClass === c.id} onClick={() => set("carClass", c.id)}>
                        <span className="block font-bold">{c.label}</span>
                        <span className={cn("block text-[13px]", f.carClass === c.id ? "text-paper/70" : "text-ink-soft")}>{c.hint}</span>
                      </Choice>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-7">
                <h2 className="heading text-[clamp(28px,3vw,40px)]">Что нужно сделать?</h2>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_GROUPS.map((g) => {
                    const n = SERVICES.filter((s) => s.group === g && f.services.includes(s.id)).length
                    return (
                      <button
                        key={g}
                        type="button"
                        data-active={group === g}
                        onClick={() => setGroup(g)}
                        className={cn("glow-ring rounded-[4px] px-4 py-2.5 text-[15px] font-semibold transition-colors", group === g ? "bg-[#e10600] text-white" : "bg-white hover:bg-paper-2")}
                      >
                        {g}
                        {n > 0 && <span className="ml-1.5 opacity-80">· {n}</span>}
                      </button>
                    )
                  })}
                </div>
                <ul className="grid gap-2">
                  {SERVICES.filter((s) => s.group === group).map((s) => {
                    const on = f.services.includes(s.id)
                    return (
                      <li key={s.id} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                        <button
                          type="button"
                          data-active={on}
                          onClick={() => set("services", on ? f.services.filter((x) => x !== s.id) : [...f.services, s.id])}
                          className={cn("glow-ring flex w-full items-center gap-4 rounded-[4px] p-4 text-left transition-colors", on ? "bg-white" : "bg-white/60 hover:bg-white")}
                        >
                          <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-[3px]", on ? "bg-[#e10600] text-white" : "bg-ink/10")}>
                            {on && <Check className="size-3.5" strokeWidth={3} />}
                          </span>
                          <span className="flex-1">
                            <span className="block text-[16px] font-semibold">{s.name}</span>
                            <span className="block text-[14px] text-ink-soft">{s.note}</span>
                          </span>
                          <span className="text-[15px] font-bold tabular">{formatRub(priceFor(s, f.carClass))}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <Field label="Что беспокоит" hint="звуки, ошибки, когда началось" error={errors.services} htmlFor="problem">
                  <Textarea id="problem" placeholder="Например: на холодную стучит справа спереди, на кочках сильнее." value={f.problem} onChange={(e) => set("problem", e.target.value)} />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <h2 className="heading text-[clamp(28px,3vw,40px)]">Когда вам удобно?</h2>
                <Field label="День" error={errors.date}>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
                    {days.map((d) => (
                      <Choice key={d.ymd} active={f.date === d.ymd} onClick={() => set("date", d.ymd)} className="min-w-[78px] shrink-0 px-3 py-3 text-center">
                        <span className="block text-[13px] opacity-70">{d.wd}</span>
                        <span className="heading block text-[24px]">{d.day}</span>
                        <span className="block text-[13px] opacity-70">{d.month}</span>
                      </Choice>
                    ))}
                  </div>
                </Field>
                <Field label="Время приёмки" error={errors.time}>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {TIME_SLOTS.map((t, i) => {
                      const busy = f.date === days[0]?.ymd && Number(t.slice(0, 2)) <= new Date().getHours() + 1
                      const fakeBusy = (i * 7 + (dayLabel?.day ?? 0)) % 5 === 0
                      const disabled = busy || fakeBusy
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={disabled}
                          data-active={f.time === t}
                          onClick={() => set("time", t)}
                          className={cn(
                            "glow-ring rounded-[4px] py-3 text-[16px] font-semibold tabular transition-colors",
                            f.time === t ? "bg-ink text-paper" : "bg-white hover:bg-paper-2",
                            disabled && "cursor-not-allowed bg-transparent text-ink-soft/50 line-through hover:bg-transparent",
                          )}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-2 text-[14px] text-ink-soft">Зачёркнутые слоты уже заняты.</p>
                </Field>
                <div className="space-y-3">
                  <Checkbox checked={f.waitOnSite} onChange={(v) => set("waitOnSite", v)}>
                    Подожду на месте — в зоне ожидания с окном в бокс
                  </Checkbox>
                  <Checkbox checked={f.needReplacementCar} onChange={(v) => set("needReplacementCar", v)}>
                    Нужна подменная машина на время ремонта
                  </Checkbox>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="heading text-[clamp(28px,3vw,40px)]">Куда прислать подтверждение?</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Имя" error={errors.name} htmlFor="name">
                    <Input id="name" autoComplete="name" placeholder="Алексей" value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
                  </Field>
                  <Field label="Телефон" error={errors.phone} htmlFor="phone">
                    <Input id="phone" type="tel" autoComplete="tel" placeholder="+7 (999) 123-45-67" value={f.phone} onChange={(e) => set("phone", formatPhone(e.target.value))} aria-invalid={!!errors.phone} />
                  </Field>
                </div>
                <Field label="E-mail" hint="необязательно — пришлём заказ-наряд" error={errors.email} htmlFor="email">
                  <Input id="email" type="email" autoComplete="email" placeholder="you@mail.ru" value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} />
                </Field>
                <Field label="Как с вами связаться">
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["call", "Звонок"],
                        ["telegram", "Telegram"],
                        ["whatsapp", "WhatsApp"],
                      ] as const
                    ).map(([id, label]) => (
                      <Choice key={id} active={f.contactBy === id} onClick={() => set("contactBy", id)} className="text-center font-semibold">
                        {label}
                      </Choice>
                    ))}
                  </div>
                </Field>
                {/* honeypot */}
                <input tabIndex={-1} autoComplete="off" className="hidden" value={f.website} onChange={(e) => set("website", e.target.value)} aria-hidden />
                <div>
                  <Checkbox checked={f.consent} onChange={(v) => set("consent", v)} invalid={!!errors.consent}>
                    Согласен на обработку персональных данных по{" "}
                    <Link href="/privacy" target="_blank" className="font-semibold text-[#e10600] underline-offset-2 hover:underline">
                      политике конфиденциальности
                    </Link>{" "}
                    и принимаю{" "}
                    <Link href="/terms" target="_blank" className="font-semibold text-[#e10600] underline-offset-2 hover:underline">
                      пользовательское соглашение
                    </Link>
                  </Checkbox>
                  {errors.consent && <p className="mt-2 pl-8 text-[14px] font-medium text-[#e10600]">{errors.consent}</p>}
                </div>
                {serverError && <p className="rounded-[4px] bg-[#e10600]/10 p-4 text-[15px] font-medium text-[#a80500]">{serverError}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between gap-4">
          {step > 0 ? (
            <button type="button" onClick={() => go(step - 1)} className="glow-ring inline-flex h-14 items-center gap-2 rounded-[4px] px-5 text-[16px] font-semibold hover:bg-paper-2">
              <ArrowLeft className="size-5" /> Назад
            </button>
          ) : (
            <a href={BRAND.phoneHref} className="inline-flex items-center gap-2 text-[15px] text-ink-soft hover:text-[#e10600]">
              <Phone className="size-4" /> Проще по телефону
            </a>
          )}
          {step < 3 ? (
            <button type="button" onClick={() => go(step + 1)} className="btn-red glow-ring inline-flex h-14 items-center gap-3 rounded-[4px] px-7 text-[17px] font-bold">
              Дальше: {STEPS[step + 1].toLowerCase()} <ArrowRight className="size-5" />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={sending} className="btn-red glow-ring inline-flex h-14 items-center gap-3 rounded-[4px] px-7 text-[17px] font-bold disabled:opacity-70">
              {sending ? <Loader2 className="size-5 animate-spin" /> : null}
              {sending ? "Отправляем…" : "Записаться"}
            </button>
          )}
        </div>
      </div>

      {/* live work order */}
      <aside className="lg:col-span-5">
        <div className="sticky top-24">
          <div className="zigzag bg-white px-7 pb-14 pt-7 shadow-[0_30px_60px_-30px_rgba(12,12,13,.35)]">
            <div className="flex items-baseline justify-between">
              <div className="text-[18px] font-black tracking-[-0.03em]" style={{ fontFamily: "var(--font-display-face)" }}>
                REDLINE
              </div>
              <div className="text-[14px] text-ink-soft">Черновик заказ-наряда</div>
            </div>
            <Row label="Машина" value={[f.carMake, f.carModel, f.carYear].filter(Boolean).join(" ") || "—"} />
            <Row label="Класс" value={CAR_CLASSES.find((c) => c.id === f.carClass)?.label ?? ""} />
            <Row label="Приёмка" value={f.date ? `${dayLabel?.day} ${dayLabel?.month}${f.time ? `, ${f.time}` : ""}` : "—"} />
            <div className="mt-5 text-[15px] font-bold">Работы</div>
            <ul className="mt-1 space-y-1.5 text-[15px]">
              <AnimatePresence initial={false}>
                {chosen.map((s) => (
                  <motion.li key={s.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-baseline overflow-hidden">
                    <span>{s.name}</span>
                    <span className="leader" />
                    <span className="tabular">{formatRub(priceFor(s, f.carClass))}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {chosen.length === 0 && <li className="text-ink-soft">Диагностика по описанию</li>}
            </ul>
            <div className="-mx-7 mt-7 flex h-12 items-center justify-between bg-ink px-7 text-[16px] font-bold text-paper">
              <span>Предварительно</span>
              <span className="tabular">{formatRub(total)}</span>
            </div>
            <p className="mt-4 text-[13px] leading-snug text-ink-soft">Без запчастей. Итог согласуем после диагностики — без вашего «да» работы не начнутся.</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 flex items-baseline text-[15px]">
      <span className="text-ink-soft">{label}</span>
      <span className="leader" />
      <span className="max-w-[60%] truncate text-right font-semibold">{value}</span>
    </div>
  )
}

function Success({ number, f, total, dayLabel }: { number: number; f: { name: string; carMake: string; carModel: string; time: string }; total: number; dayLabel: string }) {
  return (
    <div className="mx-auto max-w-[620px] py-6 text-center">
      <motion.div
        initial={{ y: -80, opacity: 0, rotate: -4 }}
        animate={{ y: 0, opacity: 1, rotate: -1.5 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="zigzag relative mx-auto bg-white px-8 pb-16 pt-9 text-left shadow-[0_40px_80px_-40px_rgba(12,12,13,.45)]"
      >
        <div className="flex items-baseline justify-between">
          <div className="text-[19px] font-black tracking-[-0.03em]" style={{ fontFamily: "var(--font-display-face)" }}>
            REDLINE
          </div>
          <div className="text-[15px] font-semibold tabular">№ {number}</div>
        </div>
        <h2 className="heading mt-6 text-[clamp(30px,4vw,46px)]">Заявка принята, {f.name.split(" ")[0]}</h2>
        <p className="mt-4 text-[17px] text-ink-soft">
          {f.carMake} {f.carModel} — ждём {dayLabel} в {f.time}. Администратор подтвердит запись в течение 15 минут в рабочее время.
        </p>
        <div className="-mx-8 mt-8 flex h-12 items-center justify-between bg-ink px-8 text-[16px] font-bold text-paper">
          <span>Предварительно</span>
          <span className="tabular">{formatRub(total)}</span>
        </div>
        <motion.div
          initial={{ scale: 2.4, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: -14 }}
          transition={{ delay: 0.55, type: "spring", stiffness: 260, damping: 16 }}
          className="absolute right-6 top-20 rounded-[6px] border-[3px] border-[#e10600] px-3 py-1 text-[22px] font-black uppercase tracking-wide text-[#e10600] opacity-90"
          style={{ fontFamily: "var(--font-display-face)" }}
        >
          Принято
        </motion.div>
      </motion.div>
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-red glow-ring inline-flex h-14 items-center rounded-[4px] px-7 text-[17px] font-bold">
          На главную
        </Link>
        <a href={BRAND.phoneHref} className="glow-ring inline-flex h-14 items-center gap-2 rounded-[4px] bg-white px-6 text-[17px] font-semibold hover:bg-paper-2">
          <Phone className="size-5" /> {BRAND.phone}
        </a>
      </div>
    </div>
  )
}
