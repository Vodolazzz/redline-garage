import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import type { NextRequest } from "next/server"

// Admin session: a signed cookie "<expiry>.<hmac>". No user table — one shared
// password from ADMIN_PASSWORD (see .env.example).

export const COOKIE = "rl_admin"
const TTL_MS = 1000 * 60 * 60 * 12

const secret = () => process.env.SESSION_SECRET || "redline-dev-secret-change-me"
export const adminPassword = () => process.env.ADMIN_PASSWORD || "redline7000"

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex")
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export function checkPassword(input: string) {
  return safeEqual(sign(`pw:${input}`), sign(`pw:${adminPassword()}`))
}

export function createToken() {
  const exp = String(Date.now() + TTL_MS)
  return { value: `${exp}.${sign(exp)}`, maxAge: TTL_MS / 1000 }
}

export function verifyToken(token: string | undefined) {
  if (!token) return false
  const [exp, mac] = token.split(".")
  if (!exp || !mac || !safeEqual(mac, sign(exp))) return false
  return Number(exp) > Date.now()
}

export function isAdmin(req: NextRequest) {
  return verifyToken(req.cookies.get(COOKIE)?.value)
}

export function unauthorized() {
  return Response.json({ error: "Требуется вход" }, { status: 401 })
}

// Naive in-memory rate limit for public forms and login.
const hits = new Map<string, number[]>()
export function rateLimited(req: NextRequest, bucket: string, max = 8, windowMs = 10 * 60 * 1000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  const key = `${bucket}:${ip}`
  const now = Date.now()
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs)
  list.push(now)
  hits.set(key, list)
  return list.length > max
}
