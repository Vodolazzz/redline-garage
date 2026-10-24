import type { NextRequest } from "next/server"
import { COOKIE, checkPassword, createToken, rateLimited } from "@/lib/auth"

export async function POST(req: NextRequest) {
  if (rateLimited(req, "login", 10)) {
    return Response.json({ error: "Слишком много попыток. Подождите 10 минут." }, { status: 429 })
  }
  const body = (await req.json().catch(() => ({}))) as { password?: string }
  if (!body.password || !checkPassword(body.password)) {
    return Response.json({ error: "Неверный пароль" }, { status: 401 })
  }
  const token = createToken()
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
  const res = Response.json({ ok: true })
  res.headers.append("Set-Cookie", `${COOKIE}=${token.value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token.maxAge}${secure}`)
  return res
}
