import "server-only"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { randomUUID } from "node:crypto"
import type { BookingInput, FeedbackInput, FeedbackStatus, RequestStatus } from "./schemas"

// A tiny JSON-file store. Good enough for a portfolio workshop: one file,
// writes serialised through a promise chain, atomic rename on save.
// DATA_DIR can point anywhere writable; on read-only hosts it falls back to the OS temp dir.

export interface ServiceRequest extends Omit<BookingInput, "consent" | "website"> {
  id: string
  number: number
  status: RequestStatus
  note: string
  createdAt: string
  updatedAt: string
  estimate: number
}

export interface FeedbackItem extends Omit<FeedbackInput, "consent" | "website"> {
  id: string
  number: number
  status: FeedbackStatus
  note: string
  createdAt: string
  updatedAt: string
}

interface Db {
  seq: number
  requests: ServiceRequest[]
  feedback: FeedbackItem[]
}

let dir = process.env.DATA_DIR || path.join(process.cwd(), "data")
const file = () => path.join(dir, "db.json")
let chain: Promise<unknown> = Promise.resolve()

async function load(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(file(), "utf8")) as Db
  } catch {
    return seed()
  }
}

async function save(db: Db) {
  try {
    await fs.mkdir(dir, { recursive: true })
    const tmp = `${file()}.${process.pid}.tmp`
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8")
    await fs.rename(tmp, file())
  } catch (err) {
    if (dir !== path.join(os.tmpdir(), "redline-data")) {
      dir = path.join(os.tmpdir(), "redline-data")
      return save(db)
    }
    throw err
  }
}

/** Run a read-modify-write transaction, one at a time. */
function tx<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const db = await load()
    const result = await fn(db)
    await save(db)
    return result
  })
  chain = run.catch(() => {})
  return run
}

export async function readDb(): Promise<Db> {
  await chain
  return load()
}

export function addRequest(input: Omit<ServiceRequest, "id" | "number" | "status" | "note" | "createdAt" | "updatedAt">) {
  return tx((db) => {
    const now = new Date().toISOString()
    db.seq += 1
    const item: ServiceRequest = { ...input, id: randomUUID(), number: 7000 + db.seq, status: "new", note: "", createdAt: now, updatedAt: now }
    db.requests.unshift(item)
    return item
  })
}

export function addFeedback(input: Omit<FeedbackItem, "id" | "number" | "status" | "note" | "createdAt" | "updatedAt">) {
  return tx((db) => {
    const now = new Date().toISOString()
    db.seq += 1
    const item: FeedbackItem = { ...input, id: randomUUID(), number: 7000 + db.seq, status: "new", note: "", createdAt: now, updatedAt: now }
    db.feedback.unshift(item)
    return item
  })
}

export function updateItem(kind: "requests" | "feedback", id: string, patch: { status?: string; note?: string }) {
  return tx((db) => {
    const list = db[kind] as (ServiceRequest | FeedbackItem)[]
    const item = list.find((x) => x.id === id)
    if (!item) return null
    if (patch.status) (item as { status: string }).status = patch.status
    if (patch.note !== undefined) item.note = patch.note
    item.updatedAt = new Date().toISOString()
    return item
  })
}

export function deleteItem(kind: "requests" | "feedback", id: string) {
  return tx((db) => {
    const before = db[kind].length
    ;(db as unknown as Record<string, { id: string }[]>)[kind] = db[kind].filter((x) => x.id !== id)
    return db[kind].length !== before
  })
}

/** Demo rows so the admin panel is not empty on first run. */
function seed(): Db {
  const day = (offset: number, h = 10) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    d.setHours(h, 0, 0, 0)
    return d
  }
  const iso = (d: Date) => d.toISOString()
  const ymd = (d: Date) => iso(d).slice(0, 10)
  const base = {
    email: "",
    plate: "",
    vin: "",
    waitOnSite: false,
    needReplacementCar: false,
    note: "",
  }
  const requests: ServiceRequest[] = [
    { ...base, id: randomUUID(), number: 7001, name: "Алексей Морозов", phone: "+79161234501", contactBy: "telegram", carMake: "Porsche", carModel: "911 Carrera S (992)", carYear: 2021, mileage: 38400, carClass: "sport", services: ["to", "brakes"], problem: "Скрип тормозов на холодную, пора ТО.", date: ymd(day(1)), time: "09:30", status: "confirmed", estimate: 30300, createdAt: iso(day(-1, 14)), updatedAt: iso(day(-1, 15)), waitOnSite: true },
    { ...base, id: randomUUID(), number: 7002, name: "Екатерина Л.", phone: "+79031234502", contactBy: "call", carMake: "BMW", carModel: "X5 xDrive40i", carYear: 2019, mileage: 91200, carClass: "business", services: ["diag", "ac"], problem: "Кондиционер дует тёплым, горит чек.", date: ymd(day(0)), time: "14:00", status: "in_progress", estimate: 10000, createdAt: iso(day(-2, 11)), updatedAt: iso(day(0, 9)) },
    { ...base, id: randomUUID(), number: 7003, name: "Тимур Г.", phone: "+79261234503", contactBy: "whatsapp", carMake: "Volkswagen", carModel: "Golf GTI", carYear: 2017, mileage: 120500, carClass: "comfort", services: ["timing", "spark"], problem: "", date: ymd(day(2)), time: "11:00", status: "new", estimate: 29800, createdAt: iso(day(0, 8)), updatedAt: iso(day(0, 8)) },
    { ...base, id: randomUUID(), number: 7004, name: "Ольга Сергеевна", phone: "+79851234504", contactBy: "call", carMake: "Mercedes-Benz", carModel: "E 200", carYear: 2020, mileage: 56000, carClass: "business", services: ["tires", "storage"], problem: "Переобувка + хранение летнего комплекта.", date: ymd(day(-3)), time: "17:00", status: "done", estimate: 12900, createdAt: iso(day(-6, 18)), updatedAt: iso(day(-3, 19)) },
    { ...base, id: randomUUID(), number: 7005, name: "Максим", phone: "+79991234505", contactBy: "telegram", carMake: "Audi", carModel: "RS6 Avant", carYear: 2022, mileage: 21000, carClass: "sport", services: ["polish", "detailing"], problem: "Керамика перед продажей.", date: ymd(day(4)), time: "08:00", status: "new", estimate: 80600, createdAt: iso(day(0, 7)), updatedAt: iso(day(0, 7)), needReplacementCar: true },
  ]
  const feedback: FeedbackItem[] = [
    { id: randomUUID(), number: 7006, kind: "complaint", name: "Игорь П.", phone: "+79161234506", email: "", orderNumber: "6987", visitDate: ymd(day(-5)), rating: 2, subject: "Машину выдали на час позже обещанного", message: "Записывался на 18:00, забрал в 19:10. Сделали хорошо, но предупредите, если задерживаетесь — я ждал в зоне ожидания.", wantsCallback: true, status: "in_review", note: "", createdAt: iso(day(-4, 10)), updatedAt: iso(day(-4, 10)) },
    { id: randomUUID(), number: 7007, kind: "thanks", name: "Анна", phone: "", email: "anna@example.com", orderNumber: "6990", visitDate: ymd(day(-2)), rating: 5, subject: "Спасибо Сергею за ходовую", message: "Нашли стук, который два сервиса не нашли. Прислали видео с подъёмника — всё понятно даже мне.", wantsCallback: false, status: "resolved", note: "", createdAt: iso(day(-1, 20)), updatedAt: iso(day(-1, 20)) },
    { id: randomUUID(), number: 7008, kind: "suggestion", name: "Павел", phone: "", email: "pavel@example.com", orderNumber: "", visitDate: "", rating: 0, subject: "Запись через Telegram-бота", message: "Было бы удобно записываться и получать фото ремонта прямо в боте.", wantsCallback: false, status: "new", note: "", createdAt: iso(day(0, 9)), updatedAt: iso(day(0, 9)) },
  ]
  return { seq: 8, requests, feedback }
}
