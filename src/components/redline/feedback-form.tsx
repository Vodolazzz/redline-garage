"use client"

import Link from "next/link"
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox, Field, Input, Textarea, formatPhone } from "./form"
import { Gear } from "./gear"

const KINDS = [
  { id: "complaint", label: "Жалоба", lead: "Что пошло не так? Разберёмся и ответим в течение суток." },
  { id: "suggestion", label: "Предложение", lead: "Что сделать удобнее? Лучшие идеи внедряем и благодарим скидкой." },
  { id: "thanks", label: "Благодарность", lead: "Передадим мастеру лично — для нас это важнее премии." },
  { id: "question", label: "Вопрос", lead: "Спросите что угодно о ремонте, гарантии или документах." },
] as const

type Kind = (typeof KINDS)[number]["id"]

export function FeedbackForm() {
  const [kind, setKind] = useState<Kind>("complaint")
  const [f, setF] = useState({
    name: "",
    phone: "",
    email: "",
    orderNumber: "",
    visitDate: "",
    rating: 0,
    subject: "",
    message: "",
    wantsCallback: true,
    consent: false,
    website: "",
  })
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const [serverError, setServerError] = useState("")
  const [hoverRating, setHoverRating] = useState(0)

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (f.name.trim().length < 2) errs.name = "Как к вам обращаться?"
    if (!f.phone && !f.email) errs.phone = "Оставьте телефон или e-mail"
    if (f.phone && f.phone.replace(/\D/g, "").length < 11) errs.phone = "Нужен номер полностью"
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) errs.email = "Проверьте e-mail"
    if (f.subject.trim().length < 3) errs.subject = "Коротко: о чём обращение?"
    if (f.message.trim().length < 10) errs.message = "Расскажите чуть подробнее"
    if (!f.consent) errs.consent = "Нужно согласие на обработку данных"
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setSending(true)
    setServerError("")
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, kind, website: f.website || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error || "Не получилось отправить")
        if (data.issues) setErrors(Object.fromEntries(Object.entries(data.issues).map(([k, v]) => [k, (v as string[])[0]])))
        return
      }
      setDone(data.number)
    } catch {
      setServerError("Нет связи с сервером. Напишите нам на почту или позвоните.")
    } finally {
      setSending(false)
    }
  }

  const current = KINDS.find((k) => k.id === kind)!

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="dark relative overflow-hidden rounded-[4px] bg-night p-10 text-[#f2f0ec] md:p-14">
        <Gear className="absolute -right-16 -top-16 size-64 animate-[spin_14s_linear_infinite] text-[#e10600]/25" />
        <div className="relative">
          <div className="text-[15px] text-white/60 tabular">Обращение № {done}</div>
          <h2 className="heading mt-3 text-[clamp(30px,4vw,52px)]">Спасибо, {f.name.split(" ")[0]}. Мы получили.</h2>
          <p className="mt-5 max-w-[46ch] text-[17px] text-white/80">
            {kind === "complaint"
              ? "Руководитель сервиса прочитает его сегодня и свяжется с вами в течение 24 часов. Номер обращения пригодится, если захотите уточнить статус."
              : "Ответим в течение рабочего дня. Номер обращения пригодится, если захотите уточнить статус."}
          </p>
          <Link href="/" className="btn-red glow-ring mt-8 inline-flex h-14 items-center rounded-[4px] px-7 text-[17px] font-bold">
            На главную
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-7">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Тип обращения">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="radio"
            aria-checked={kind === k.id}
            data-active={kind === k.id}
            onClick={() => setKind(k.id)}
            className={cn(
              "glow-ring rounded-[4px] px-5 py-3 text-[16px] font-semibold transition-colors duration-300",
              kind === k.id ? "bg-[#e10600] text-white" : "bg-white hover:bg-paper-2",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={kind} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-[17px] text-ink-soft">
          {current.lead}
        </motion.p>
      </AnimatePresence>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Номер заказ-наряда" hint="если есть" htmlFor="order">
          <Input id="order" placeholder="7000" value={f.orderNumber} onChange={(e) => set("orderNumber", e.target.value.replace(/[^\dA-Za-zА-Яа-я-]/g, ""))} />
        </Field>
        <Field label="Дата визита" hint="если был" htmlFor="visit">
          <Input id="visit" type="date" value={f.visitDate} onChange={(e) => set("visitDate", e.target.value)} />
        </Field>
      </div>

      {(kind === "complaint" || kind === "thanks") && (
        <Field label="Оценка визита">
          <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((n) => {
              const lit = (hoverRating || f.rating) >= n
              return (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} из 5`}
                  onMouseEnter={() => setHoverRating(n)}
                  onClick={() => set("rating", n)}
                  className="rounded-full p-1 transition-transform duration-300 hover:scale-110"
                >
                  <Gear className={cn("size-9 transition-all duration-500", lit ? "rotate-45 text-[#e10600]" : "text-ink/15")} />
                </button>
              )
            })}
          </div>
        </Field>
      )}

      <Field label="Тема" error={errors.subject} htmlFor="subject">
        <Input id="subject" placeholder={kind === "complaint" ? "Машину выдали позже обещанного" : "Коротко о главном"} value={f.subject} onChange={(e) => set("subject", e.target.value)} aria-invalid={!!errors.subject} />
      </Field>
      <Field label="Подробности" error={errors.message} htmlFor="message">
        <Textarea id="message" rows={6} placeholder="Что произошло, кто был мастером, чего вы ждёте от нас" value={f.message} onChange={(e) => set("message", e.target.value)} aria-invalid={!!errors.message} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Имя" error={errors.name} htmlFor="fname">
          <Input id="fname" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
        </Field>
        <Field label="Телефон" error={errors.phone} htmlFor="fphone">
          <Input id="fphone" type="tel" autoComplete="tel" placeholder="+7" value={f.phone} onChange={(e) => set("phone", e.target.value ? formatPhone(e.target.value) : "")} aria-invalid={!!errors.phone} />
        </Field>
        <Field label="E-mail" error={errors.email} htmlFor="femail">
          <Input id="femail" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} />
        </Field>
      </div>
      <input tabIndex={-1} autoComplete="off" className="hidden" value={f.website} onChange={(e) => set("website", e.target.value)} aria-hidden />

      <div className="space-y-3">
        <Checkbox checked={f.wantsCallback} onChange={(v) => set("wantsCallback", v)}>
          Перезвоните мне, хочу обсудить голосом
        </Checkbox>
        <Checkbox checked={f.consent} onChange={(v) => set("consent", v)} invalid={!!errors.consent}>
          Согласен на обработку персональных данных по{" "}
          <Link href="/privacy" target="_blank" className="font-semibold text-[#e10600] hover:underline">
            политике конфиденциальности
          </Link>
        </Checkbox>
        {errors.consent && <p className="pl-8 text-[14px] font-medium text-[#e10600]">{errors.consent}</p>}
      </div>

      {serverError && <p className="rounded-[4px] bg-[#e10600]/10 p-4 text-[15px] font-medium text-[#a80500]">{serverError}</p>}

      <button type="submit" disabled={sending} className="btn-red glow-ring inline-flex h-14 items-center gap-3 rounded-[4px] px-8 text-[17px] font-bold disabled:opacity-70">
        {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        {sending ? "Отправляем…" : `Отправить ${current.label.toLowerCase()}`}
      </button>
    </form>
  )
}
