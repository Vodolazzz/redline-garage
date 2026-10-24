import type { NextRequest } from "next/server"
import { isAdmin, unauthorized } from "@/lib/auth"
import { readDb } from "@/lib/db"

export async function GET(req: NextRequest, ctx: RouteContext<"/api/admin/items/[kind]">) {
  if (!isAdmin(req)) return unauthorized()
  const { kind } = await ctx.params
  if (kind !== "requests" && kind !== "feedback") return Response.json({ error: "Не найдено" }, { status: 404 })
  const db = await readDb()
  return Response.json({ items: db[kind] })
}
