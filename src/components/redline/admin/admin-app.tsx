"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  CalendarClock,
  Car,
  Download,
  ExternalLink,
  Loader2,
  LogOut,
  MessageSquareWarning,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react"
import { CAR_CLASSES, SERVICES, formatRub } from "@/lib/content"
import {
  CONTACT_LABEL,
  FEEDBACK_STATUSES,
  KIND_LABEL,
  REQUEST_STATUSES,
  STATUS_LABEL,
  type FeedbackStatus,
  type RequestStatus,
} from "@/lib/schemas"
import type { FeedbackItem, ServiceRequest } from "@/lib/db"
import { cn } from "@/lib/utils"
import { Input, Textarea } from "../form"

type Tab = "requests" | "feedback"

const STATUS_TONE: Record<string, string> = {
  new: "bg-[#e10600] text-white",
  confirmed: "bg-ink text-paper",
  in_progress: "bg-amber-400 text-ink",
  done: "bg-emerald-600 text-white",
  cancelled: "bg-ink/10 text-ink-soft",
  in_review: "bg-amber-400 text-ink",
  resolved: "bg-emerald-600 text-white",
  rejected: "bg-ink/10 text-ink-soft",
}

const fmtDate = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
const fmtDay = (ymd: string) => (ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" }) : "—")
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function Badge({ status }: { status: string }) {
  return <span className={cn("inline-flex rounded-[3px] px-2 py-0.5 text-[13px] font-semibold", STATUS_TONE[status])}>{STATUS_LABEL[status as RequestStatus]}</span>
}

/* ───────────── Login ───────────── */
function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) })
    setBusy(false)
    if (res.ok) onDone()
    else setError((await res.json().catch(() => ({}))).error || "Ошибка входа")
  }
  return (
    <main data-tone="dark" className="dark grain relative grid min-h-svh place-items-center bg-night px-4 text-[#f2f0ec]">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[400px] rounded-[4px] bg-night-2 p-8"
      >
        <div className="text-[22px] font-black tracking-[-0.04em]" style={{ fontFamily: "var(--font-display-face)" }}>
          REDLINE <span className="text-[#e10600]">·</span> панель
        </div>
        <p className="mt-2 text-[15px] text-white/60">Вход для администраторов приёмки.</p>
        <label htmlFor="pw" className="mt-8 block text-[15px] font-semibold">
          Пароль
        </label>
        <Input id="pw" type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" aria-invalid={!!error} />
        {error && <p className="mt-2 text-[14px] font-medium text-[#ff5a4f]">{error}</p>}
        <button disabled={busy || !password} className="btn-red glow-ring mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[4px] text-[16px] font-bold disabled:opacity-50">
          {busy && <Loader2 className="size-4 animate-spin" />} Войти
        </button>
        <p className="mt-5 text-[13px] text-white/45">Демо-пароль для портфолио указан в README (переменная ADMIN_PASSWORD).</p>
        <Link href="/" className="mt-4 inline-block text-[14px] text-white/60 hover:text-[#e10600]">
          ← на сайт
        </Link>
      </motion.form>
    </main>
  )
}

/* ───────────── App ───────────── */
export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>("requests")
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [openId, setOpenId] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [r, f] = await Promise.all([fetch("/api/admin/items/requests"), fetch("/api/admin/items/feedback")])
    setLoading(false)
    if (r.status === 401 || f.status === 401) {
      setAuthed(false)
      return
    }
    setRequests((await r.json()).items)
    setFeedback((await f.json()).items)
    setAuthed(true)
    setUpdatedAt(new Date())
  }, [])

  useEffect(() => {
    void Promise.resolve().then(load)
    const id = window.setInterval(load, 30000)
    return () => window.clearInterval(id)
  }, [load])

  const switchTab = (t: Tab) => {
    setTab(t)
    setStatus("all")
    setOpenId(null)
  }

  async function patch(kind: Tab, id: string, body: { status?: string; note?: string }) {
    const res = await fetch(`/api/admin/items/${kind}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.status === 401) return setAuthed(false)
    const { item } = await res.json()
    if (kind === "requests") setRequests((l) => l.map((x) => (x.id === id ? item : x)))
    else setFeedback((l) => l.map((x) => (x.id === id ? item : x)))
  }

  async function remove(kind: Tab, id: string) {
    if (!window.confirm("Удалить запись без возможности восстановления?")) return
    const res = await fetch(`/api/admin/items/${kind}/${id}`, { method: "DELETE" })
    if (res.status === 401) return setAuthed(false)
    if (kind === "requests") setRequests((l) => l.filter((x) => x.id !== id))
    else setFeedback((l) => l.filter((x) => x.id !== id))
    setOpenId(null)
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" })
    setAuthed(false)
  }

  const stats = useMemo(() => {
    const t = today()
    return {
      newRequests: requests.filter((r) => r.status === "new").length,
      todayVisits: requests.filter((r) => r.date === t && r.status !== "cancelled").length,
      inWork: requests.filter((r) => r.status === "in_progress").length,
      pipeline: requests.filter((r) => ["new", "confirmed", "in_progress"].includes(r.status)).reduce((s, r) => s + r.estimate, 0),
      openComplaints: feedback.filter((f) => f.kind === "complaint" && !["resolved", "rejected"].includes(f.status)).length,
    }
  }, [requests, feedback])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = (tab === "requests" ? requests : feedback) as (ServiceRequest | FeedbackItem)[]
    return items.filter((x) => {
      if (status !== "all" && x.status !== status) return false
      if (!q) return true
      const hay = JSON.stringify(x).toLowerCase()
      return hay.includes(q)
    })
  }, [tab, requests, feedback, query, status])

  const upcoming = useMemo(
    () =>
      requests
        .filter((r) => r.date >= today() && ["new", "confirmed"].includes(r.status))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 5),
    [requests],
  )

  if (authed === null)
    return (
      <div className="grid min-h-svh place-items-center bg-night">
        <Loader2 className="size-8 animate-spin text-[#e10600]" />
      </div>
    )
  if (!authed) return <Login onDone={load} />

  const open = list.find((x) => x.id === openId) || null
  const statuses = tab === "requests" ? REQUEST_STATUSES : FEEDBACK_STATUSES

  return (
    <div className="min-h-svh bg-paper">
      {/* top bar */}
      <header data-tone="dark" className="dark sticky top-0 z-30 bg-night text-[#f2f0ec]">
        <div className="frame flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[18px] font-black tracking-[-0.04em]" style={{ fontFamily: "var(--font-display-face)" }}>
              REDLINE <span className="text-[#e10600]">·</span> <span className="font-bold text-white/60">панель</span>
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {(
                [
                  ["requests", "Заявки", requests.filter((r) => r.status === "new").length],
                  ["feedback", "Обращения", feedback.filter((f) => f.status === "new").length],
                ] as const
              ).map(([id, label, n]) => (
                <button
                  key={id}
                  onClick={() => switchTab(id)}
                  data-active={tab === id}
                  className={cn("glow-ring rounded-[4px] px-3.5 py-2 text-[15px] font-semibold transition-colors", tab === id ? "bg-white/10 text-white" : "text-white/65 hover:text-white")}
                >
                  {label}
                  {n > 0 && <span className="ml-2 rounded-full bg-[#e10600] px-1.5 text-[12px] text-white tabular">{n}</span>}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[13px] text-white/50 md:inline">{updatedAt && `обновлено ${updatedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`}</span>
            <button onClick={load} className="glow-ring inline-flex size-10 items-center justify-center rounded-[4px] hover:bg-white/10" aria-label="Обновить">
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </button>
            <button onClick={logout} className="glow-ring inline-flex h-10 items-center gap-2 rounded-[4px] px-3 text-[14px] font-semibold hover:bg-white/10">
              <LogOut className="size-4" /> Выйти
            </button>
          </div>
        </div>
        <nav className="frame flex gap-1 pb-2 sm:hidden">
          {(["requests", "feedback"] as const).map((id) => (
            <button key={id} onClick={() => switchTab(id)} className={cn("rounded-[4px] px-3 py-1.5 text-[14px] font-semibold", tab === id ? "bg-white/10" : "text-white/60")}>
              {id === "requests" ? "Заявки" : "Обращения"}
            </button>
          ))}
        </nav>
      </header>

      <main className="frame py-8">
        {/* KPI */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Сводка">
          {[
            { icon: Wrench, label: "Новые заявки", value: String(stats.newRequests), hot: stats.newRequests > 0 },
            { icon: CalendarClock, label: "Приёмок сегодня", value: String(stats.todayVisits) },
            { icon: Car, label: "Машин в работе", value: String(stats.inWork) },
            { icon: MessageSquareWarning, label: "Открытые жалобы", value: String(stats.openComplaints), hot: stats.openComplaints > 0 },
            { icon: Wrench, label: "Оценка в работе", value: formatRub(stats.pipeline) },
          ].map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("rounded-[4px] bg-white p-4", i === 4 && "col-span-2 lg:col-span-1")}
            >
              <div className="flex items-center gap-2 text-[14px] text-ink-soft">
                <k.icon className={cn("size-4", k.hot && "text-[#e10600]")} /> {k.label}
              </div>
              <div className={cn("mt-2 text-[28px] font-bold tabular", k.hot && "text-[#e10600]")}>{k.value}</div>
            </motion.div>
          ))}
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
          <section aria-label={tab === "requests" ? "Заявки" : "Обращения"}>
            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                <Input placeholder="Поиск: имя, телефон, машина, номер" value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 pl-10 text-[15px]" />
              </div>
              <a
                href={`/api/admin/export?kind=${tab}`}
                className="glow-ring inline-flex h-11 items-center gap-2 rounded-[4px] bg-white px-4 text-[14px] font-semibold ring-1 ring-ink/12 hover:bg-paper-2"
              >
                <Download className="size-4" /> CSV для Excel
              </a>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["all", ...statuses].map((s) => {
                const n = s === "all" ? (tab === "requests" ? requests.length : feedback.length) : (tab === "requests" ? requests : feedback).filter((x) => x.status === s).length
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    data-active={status === s}
                    className={cn("glow-ring rounded-[4px] px-3 py-1.5 text-[14px] font-semibold transition-colors", status === s ? "bg-ink text-paper" : "bg-white hover:bg-paper-2")}
                  >
                    {s === "all" ? "Все" : STATUS_LABEL[s as RequestStatus]} <span className="opacity-60 tabular">{n}</span>
                  </button>
                )
              })}
            </div>

            {/* table */}
            <div className="mt-4 overflow-x-auto rounded-[4px] bg-white" data-ui>
              <table className="w-full min-w-[760px] border-collapse text-left text-[15px]">
                <thead className="text-[13px] text-ink-soft">
                  {tab === "requests" ? (
                    <tr className="border-b border-ink/8">
                      <th className="px-4 py-3 font-semibold">№</th>
                      <th className="px-4 py-3 font-semibold">Клиент</th>
                      <th className="px-4 py-3 font-semibold">Машина</th>
                      <th className="px-4 py-3 font-semibold">Приёмка</th>
                      <th className="px-4 py-3 text-right font-semibold">Оценка</th>
                      <th className="px-4 py-3 font-semibold">Статус</th>
                    </tr>
                  ) : (
                    <tr className="border-b border-ink/8">
                      <th className="px-4 py-3 font-semibold">№</th>
                      <th className="px-4 py-3 font-semibold">Тип</th>
                      <th className="px-4 py-3 font-semibold">Тема</th>
                      <th className="px-4 py-3 font-semibold">От кого</th>
                      <th className="px-4 py-3 font-semibold">Получено</th>
                      <th className="px-4 py-3 font-semibold">Статус</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {list.map((x) => (
                      <motion.tr
                        key={x.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => setOpenId(x.id)}
                        className={cn("cursor-pointer border-b border-ink/6 transition-colors hover:bg-paper", openId === x.id && "bg-paper", x.status === "new" && "font-semibold")}
                      >
                        {tab === "requests" ? (
                          <RequestCells r={x as ServiceRequest} />
                        ) : (
                          <FeedbackCells f={x as FeedbackItem} />
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-14 text-center text-ink-soft">
                        Ничего не найдено. {query && "Попробуйте другой запрос."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* schedule */}
          <aside className="space-y-3">
            <div className="rounded-[4px] bg-white p-5">
              <h2 className="text-[16px] font-bold">Ближайшие приёмки</h2>
              <ul className="mt-4 space-y-3">
                {upcoming.map((r) => (
                  <li key={r.id}>
                    <button onClick={() => (switchTab("requests"), setTimeout(() => setOpenId(r.id), 0))} className="w-full text-left hover:text-[#e10600]">
                      <div className="text-[14px] text-ink-soft">
                        {fmtDay(r.date)}, {r.time}
                      </div>
                      <div className="text-[15px] font-semibold">
                        {r.carMake} {r.carModel}
                      </div>
                      <div className="text-[14px] text-ink-soft">{r.name}</div>
                    </button>
                  </li>
                ))}
                {upcoming.length === 0 && <li className="text-[14px] text-ink-soft">Записей нет.</li>}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenId(null)} />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto bg-paper shadow-[-30px_0_60px_-30px_rgba(0,0,0,.4)]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              role="dialog"
              aria-label="Карточка"
            >
              <Drawer
                key={open.id}
                kind={tab}
                item={open}
                onClose={() => setOpenId(null)}
                onPatch={(b) => patch(tab, open.id, b)}
                onDelete={() => remove(tab, open.id)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function RequestCells({ r }: { r: ServiceRequest }) {
  return (
    <>
      <td className="px-4 py-3 tabular">{r.number}</td>
      <td className="px-4 py-3">
        <div>{r.name}</div>
        <div className="text-[13px] font-normal text-ink-soft tabular">{r.phone}</div>
      </td>
      <td className="px-4 py-3">
        {r.carMake} {r.carModel}
        <div className="text-[13px] font-normal text-ink-soft">{r.services.length} работ · {CAR_CLASSES.find((c) => c.id === r.carClass)?.label}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {fmtDay(r.date)}
        <div className="text-[13px] font-normal text-ink-soft tabular">{r.time}</div>
      </td>
      <td className="px-4 py-3 text-right tabular">{formatRub(r.estimate)}</td>
      <td className="px-4 py-3">
        <Badge status={r.status} />
      </td>
    </>
  )
}

function FeedbackCells({ f }: { f: FeedbackItem }) {
  return (
    <>
      <td className="px-4 py-3 tabular">{f.number}</td>
      <td className="px-4 py-3">
        <span className={cn("text-[14px]", f.kind === "complaint" && "font-bold text-[#e10600]")}>{KIND_LABEL[f.kind]}</span>
      </td>
      <td className="max-w-[280px] truncate px-4 py-3">{f.subject}</td>
      <td className="px-4 py-3">{f.name}</td>
      <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{fmtDate(f.createdAt)}</td>
      <td className="px-4 py-3">
        <Badge status={f.status} />
      </td>
    </>
  )
}

function Drawer({
  kind,
  item,
  onClose,
  onPatch,
  onDelete,
}: {
  kind: Tab
  item: ServiceRequest | FeedbackItem
  onClose: () => void
  onPatch: (b: { status?: string; note?: string }) => void
  onDelete: () => void
}) {
  const [note, setNote] = useState(item.note)
  const [saved, setSaved] = useState(false)
  const statuses = kind === "requests" ? REQUEST_STATUSES : FEEDBACK_STATUSES
  const r = kind === "requests" ? (item as ServiceRequest) : null
  const f = kind === "feedback" ? (item as FeedbackItem) : null

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[14px] text-ink-soft tabular">
            {r ? "Заявка" : KIND_LABEL[f!.kind]} № {item.number} · {fmtDate(item.createdAt)}
          </div>
          <h2 className="mt-1 text-[24px] font-bold leading-tight">{r ? `${r.carMake} ${r.carModel}` : f!.subject}</h2>
        </div>
        <button onClick={onClose} className="glow-ring inline-flex size-10 shrink-0 items-center justify-center rounded-[4px] hover:bg-paper-2" aria-label="Закрыть">
          <X className="size-5" />
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => onPatch({ status: s })}
            data-active={item.status === s}
            className={cn("glow-ring rounded-[4px] px-3 py-1.5 text-[14px] font-semibold transition-colors", item.status === s ? STATUS_TONE[s] : "bg-white hover:bg-paper-2")}
          >
            {STATUS_LABEL[s as RequestStatus | FeedbackStatus]}
          </button>
        ))}
      </div>

      <dl className="mt-8 space-y-3 text-[15px]">
        <Line label="Клиент" value={item.name} />
        {item.phone && (
          <Line
            label="Телефон"
            value={
              <a href={`tel:${item.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-[#e10600] hover:underline">
                <Phone className="size-3.5" /> {item.phone}
              </a>
            }
          />
        )}
        {item.email && <Line label="E-mail" value={<a href={`mailto:${item.email}`} className="hover:text-[#e10600]">{item.email}</a>} />}
        {r && (
          <>
            <Line label="Связь" value={CONTACT_LABEL[r.contactBy]} />
            <Line label="Приёмка" value={`${fmtDay(r.date)}, ${r.time}`} />
            <Line label="Год / пробег" value={`${r.carYear ?? "—"} / ${r.mileage ? `${r.mileage.toLocaleString("ru-RU")} км` : "—"}`} />
            {r.plate && <Line label="Госномер" value={r.plate} />}
            <Line label="Класс" value={CAR_CLASSES.find((c) => c.id === r.carClass)?.label ?? ""} />
            <Line label="Опции" value={[r.waitOnSite && "ждёт на месте", r.needReplacementCar && "подменная машина"].filter(Boolean).join(", ") || "—"} />
          </>
        )}
        {f && (
          <>
            <Line label="Заказ-наряд" value={f.orderNumber || "—"} />
            <Line label="Дата визита" value={f.visitDate ? fmtDay(f.visitDate) : "—"} />
            <Line label="Оценка" value={f.rating ? `${f.rating} из 5` : "—"} />
            <Line label="Перезвонить" value={f.wantsCallback ? "да" : "нет"} />
          </>
        )}
      </dl>

      {r && (
        <div className="mt-8 rounded-[4px] bg-white p-5">
          <div className="text-[15px] font-bold">Работы</div>
          <ul className="mt-3 space-y-1.5 text-[15px]">
            {r.services.map((id) => {
              const s = SERVICES.find((x) => x.id === id)
              return (
                <li key={id} className="flex items-baseline">
                  <span>{s?.name ?? id}</span>
                </li>
              )
            })}
            {r.services.length === 0 && <li className="text-ink-soft">Не выбраны</li>}
          </ul>
          <div className="mt-4 flex justify-between border-t border-ink/8 pt-3 text-[15px] font-bold">
            <span>Оценка без запчастей</span>
            <span className="tabular">{formatRub(r.estimate)}</span>
          </div>
        </div>
      )}

      {(r?.problem || f?.message) && (
        <div className="mt-6">
          <div className="text-[15px] font-bold">{r ? "Что беспокоит" : "Текст обращения"}</div>
          <p className="mt-2 whitespace-pre-wrap text-[16px] leading-relaxed">{r ? r.problem : f!.message}</p>
        </div>
      )}

      <div className="mt-8">
        <label htmlFor="note" className="text-[15px] font-bold">
          Заметка для команды
        </label>
        <Textarea id="note" className="mt-2 min-h-[100px] text-[15px]" value={note} onChange={(e) => (setNote(e.target.value), setSaved(false))} placeholder="Кто звонил, что договорились, какие запчасти заказаны" />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => {
              onPatch({ note })
              setSaved(true)
            }}
            className="btn-red glow-ring inline-flex h-11 items-center rounded-[4px] px-5 text-[15px] font-bold"
          >
            Сохранить заметку
          </button>
          {saved && <span className="text-[14px] text-emerald-700">Сохранено</span>}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink/8 pt-6">
        {item.phone ? (
          <a href={`https://wa.me/${item.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[14px] font-semibold hover:text-[#e10600]">
            Написать в WhatsApp <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <span />
        )}
        <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[14px] font-semibold text-[#a80500] hover:bg-[#e10600]/10">
          <Trash2 className="size-4" /> Удалить
        </button>
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
