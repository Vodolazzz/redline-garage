import "server-only"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { DatabaseSync } from "node:sqlite"
import type { BookingInput, FeedbackInput, FeedbackStatus, RequestStatus } from "./schemas"

// SQLite store (Node's built-in node:sqlite, no native build step).
// One file: data/redline.db (or $DATA_DIR/redline.db). Tables: requests, feedback, counters.
// On a read-only host it falls back to the OS temp dir.

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

type Row = Record<string, string | number | null>

const SCHEMA = `
CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'new',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  contact_by TEXT NOT NULL,
  car_make TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_year INTEGER,
  plate TEXT NOT NULL DEFAULT '',
  mileage INTEGER,
  vin TEXT NOT NULL DEFAULT '',
  car_class TEXT NOT NULL,
  services TEXT NOT NULL DEFAULT '[]',
  problem TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  wait_on_site INTEGER NOT NULL DEFAULT 0,
  need_replacement_car INTEGER NOT NULL DEFAULT 0,
  estimate INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS requests_created ON requests(created_at DESC);
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'new',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  order_number TEXT NOT NULL DEFAULT '',
  visit_date TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 0,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  wants_callback INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS feedback_created ON feedback(created_at DESC);
`

let db: DatabaseSync | null = null

function open(): DatabaseSync {
  if (db) return db
  const dirs = [process.env.DATA_DIR || path.join(process.cwd(), "data"), path.join(os.tmpdir(), "redline-data")]
  let lastErr: unknown
  for (const dir of dirs) {
    try {
      fs.mkdirSync(dir, { recursive: true })
      const conn = new DatabaseSync(path.join(dir, "redline.db"))
      conn.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;")
      conn.exec(SCHEMA)
      db = conn
      const empty = (conn.prepare("SELECT COUNT(*) AS n FROM counters").get() as { n: number }).n === 0
      if (empty) seed(conn)
      return conn
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

function nextNumber(conn: DatabaseSync) {
  conn.prepare("INSERT INTO counters(name, value) VALUES('order', 7000) ON CONFLICT(name) DO NOTHING").run()
  const row = conn.prepare("UPDATE counters SET value = value + 1 WHERE name = 'order' RETURNING value").get() as { value: number }
  return row.value
}

function toRequest(r: Row): ServiceRequest {
  return {
    id: String(r.id),
    number: Number(r.number),
    status: r.status as RequestStatus,
    note: String(r.note ?? ""),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    name: String(r.name),
    phone: String(r.phone),
    email: String(r.email ?? ""),
    contactBy: r.contact_by as ServiceRequest["contactBy"],
    carMake: String(r.car_make),
    carModel: String(r.car_model),
    carYear: r.car_year === null ? undefined : Number(r.car_year),
    plate: String(r.plate ?? ""),
    mileage: r.mileage === null ? undefined : Number(r.mileage),
    vin: String(r.vin ?? ""),
    carClass: r.car_class as ServiceRequest["carClass"],
    services: JSON.parse(String(r.services || "[]")),
    problem: String(r.problem ?? ""),
    date: String(r.date),
    time: String(r.time),
    waitOnSite: Boolean(r.wait_on_site),
    needReplacementCar: Boolean(r.need_replacement_car),
    estimate: Number(r.estimate),
  }
}

function toFeedback(r: Row): FeedbackItem {
  return {
    id: String(r.id),
    number: Number(r.number),
    status: r.status as FeedbackStatus,
    note: String(r.note ?? ""),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    kind: r.kind as FeedbackItem["kind"],
    name: String(r.name),
    phone: String(r.phone ?? ""),
    email: String(r.email ?? ""),
    orderNumber: String(r.order_number ?? ""),
    visitDate: String(r.visit_date ?? ""),
    rating: Number(r.rating),
    subject: String(r.subject),
    message: String(r.message),
    wantsCallback: Boolean(r.wants_callback),
  }
}

type NewRequest = Omit<ServiceRequest, "id" | "number" | "status" | "note" | "createdAt" | "updatedAt">
type NewFeedback = Omit<FeedbackItem, "id" | "number" | "status" | "note" | "createdAt" | "updatedAt">

function insertRequest(conn: DatabaseSync, r: NewRequest & Partial<ServiceRequest>) {
  const now = new Date().toISOString()
  const item = { ...r, id: r.id ?? randomUUID(), number: r.number ?? nextNumber(conn), status: r.status ?? "new", note: r.note ?? "", createdAt: r.createdAt ?? now, updatedAt: r.updatedAt ?? now }
  conn
    .prepare(
      `INSERT INTO requests (id, number, status, note, created_at, updated_at, name, phone, email, contact_by, car_make, car_model,
        car_year, plate, mileage, vin, car_class, services, problem, date, time, wait_on_site, need_replacement_car, estimate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      item.id, item.number, item.status, item.note, item.createdAt, item.updatedAt, item.name, item.phone, item.email ?? "",
      item.contactBy, item.carMake, item.carModel, item.carYear ?? null, item.plate ?? "", item.mileage ?? null, item.vin ?? "",
      item.carClass, JSON.stringify(item.services ?? []), item.problem ?? "", item.date, item.time,
      item.waitOnSite ? 1 : 0, item.needReplacementCar ? 1 : 0, item.estimate,
    )
  return item as ServiceRequest
}

function insertFeedback(conn: DatabaseSync, f: NewFeedback & Partial<FeedbackItem>) {
  const now = new Date().toISOString()
  const item = { ...f, id: f.id ?? randomUUID(), number: f.number ?? nextNumber(conn), status: f.status ?? "new", note: f.note ?? "", createdAt: f.createdAt ?? now, updatedAt: f.updatedAt ?? now }
  conn
    .prepare(
      `INSERT INTO feedback (id, number, status, note, created_at, updated_at, kind, name, phone, email, order_number, visit_date,
        rating, subject, message, wants_callback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      item.id, item.number, item.status, item.note, item.createdAt, item.updatedAt, item.kind, item.name, item.phone ?? "",
      item.email ?? "", item.orderNumber ?? "", item.visitDate ?? "", item.rating ?? 0, item.subject, item.message, item.wantsCallback ? 1 : 0,
    )
  return item as FeedbackItem
}

export async function readDb() {
  const conn = open()
  return {
    requests: (conn.prepare("SELECT * FROM requests ORDER BY created_at DESC").all() as Row[]).map(toRequest),
    feedback: (conn.prepare("SELECT * FROM feedback ORDER BY created_at DESC").all() as Row[]).map(toFeedback),
  }
}

export async function addRequest(input: NewRequest) {
  return insertRequest(open(), input)
}

export async function addFeedback(input: NewFeedback) {
  return insertFeedback(open(), input)
}

export async function updateItem(kind: "requests" | "feedback", id: string, patch: { status?: string; note?: string }) {
  const conn = open()
  const now = new Date().toISOString()
  if (patch.status) conn.prepare(`UPDATE ${kind} SET status = ?, updated_at = ? WHERE id = ?`).run(patch.status, now, id)
  if (patch.note !== undefined) conn.prepare(`UPDATE ${kind} SET note = ?, updated_at = ? WHERE id = ?`).run(patch.note, now, id)
  const row = conn.prepare(`SELECT * FROM ${kind} WHERE id = ?`).get(id) as Row | undefined
  if (!row) return null
  return kind === "requests" ? toRequest(row) : toFeedback(row)
}

export async function deleteItem(kind: "requests" | "feedback", id: string) {
  const res = open().prepare(`DELETE FROM ${kind} WHERE id = ?`).run(id)
  return Number(res.changes) > 0
}

/** Demo rows so the admin panel is not empty on first run. */
function seed(conn: DatabaseSync) {
  const day = (offset: number, h = 10) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    d.setHours(h, 0, 0, 0)
    return d
  }
  const iso = (d: Date) => d.toISOString()
  const ymd = (d: Date) => iso(d).slice(0, 10)
  const base = { email: "", plate: "", vin: "", waitOnSite: false, needReplacementCar: false }
  conn.exec("BEGIN")
  conn.prepare("INSERT INTO counters(name, value) VALUES('order', 7008)").run()
  const rows: (NewRequest & Partial<ServiceRequest>)[] = [
    { ...base, number: 7001, name: "Алексей Морозов", phone: "+79161234501", contactBy: "telegram", carMake: "Dodge", carModel: "Charger Daytona Scat Pack", carYear: 2024, mileage: 18400, carClass: "sport", services: ["to", "brakes"], problem: "Скрип тормозов на холодную, пора ТО.", date: ymd(day(1)), time: "09:30", status: "confirmed", estimate: 30300, createdAt: iso(day(-1, 14)), updatedAt: iso(day(-1, 15)), waitOnSite: true },
    { ...base, number: 7002, name: "Екатерина Л.", phone: "+79031234502", contactBy: "call", carMake: "BMW", carModel: "X5 xDrive40i", carYear: 2019, mileage: 91200, carClass: "business", services: ["diag", "ac"], problem: "Кондиционер дует тёплым, горит чек.", date: ymd(day(0)), time: "14:00", status: "in_progress", estimate: 10000, createdAt: iso(day(-2, 11)), updatedAt: iso(day(0, 9)) },
    { ...base, number: 7003, name: "Тимур Г.", phone: "+79261234503", contactBy: "whatsapp", carMake: "Dodge", carModel: "Charger SRT Hellcat", carYear: 2019, mileage: 52500, carClass: "sport", services: ["spark", "cooling"], problem: "Плавают обороты, после трека пахнет антифризом.", date: ymd(day(2)), time: "11:00", status: "new", estimate: 31500, createdAt: iso(day(0, 8)), updatedAt: iso(day(0, 8)) },
    { ...base, number: 7004, name: "Ольга Сергеевна", phone: "+79851234504", contactBy: "call", carMake: "Mercedes-Benz", carModel: "E 200", carYear: 2020, mileage: 56000, carClass: "business", services: ["tires", "storage"], problem: "Переобувка + хранение летнего комплекта.", date: ymd(day(-3)), time: "17:00", status: "done", estimate: 12900, createdAt: iso(day(-6, 18)), updatedAt: iso(day(-3, 19)) },
    { ...base, number: 7005, name: "Максим", phone: "+79991234505", contactBy: "telegram", carMake: "Dodge", carModel: "Charger R/T", carYear: 2021, mileage: 41000, carClass: "sport", services: ["polish", "detailing"], problem: "Керамика перед продажей.", date: ymd(day(4)), time: "08:00", status: "new", estimate: 80600, createdAt: iso(day(0, 7)), updatedAt: iso(day(0, 7)), needReplacementCar: true },
  ]
  for (const r of rows) insertRequest(conn, r)
  const fb: (NewFeedback & Partial<FeedbackItem>)[] = [
    { number: 7006, kind: "complaint", name: "Игорь П.", phone: "+79161234506", email: "", orderNumber: "6987", visitDate: ymd(day(-5)), rating: 2, subject: "Машину выдали на час позже обещанного", message: "Записывался на 18:00, забрал в 19:10. Сделали хорошо, но предупредите, если задерживаетесь — я ждал в зоне ожидания.", wantsCallback: true, status: "in_review", createdAt: iso(day(-4, 10)), updatedAt: iso(day(-4, 10)) },
    { number: 7007, kind: "thanks", name: "Анна", phone: "", email: "anna@example.com", orderNumber: "6990", visitDate: ymd(day(-2)), rating: 5, subject: "Спасибо Сергею за ходовую", message: "Нашли стук, который два сервиса не нашли. Прислали видео с подъёмника — всё понятно даже мне.", wantsCallback: false, status: "resolved", createdAt: iso(day(-1, 20)), updatedAt: iso(day(-1, 20)) },
    { number: 7008, kind: "suggestion", name: "Павел", phone: "", email: "pavel@example.com", orderNumber: "", visitDate: "", rating: 0, subject: "Запись через Telegram-бота", message: "Было бы удобно записываться и получать фото ремонта прямо в боте.", wantsCallback: false, status: "new", createdAt: iso(day(0, 9)), updatedAt: iso(day(0, 9)) },
  ]
  for (const f of fb) insertFeedback(conn, f)
  conn.exec("COMMIT")
}
