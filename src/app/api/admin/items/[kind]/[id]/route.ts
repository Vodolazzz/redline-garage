import type { NextRequest } from "next/server"
import { isAdmin, unauthorized } from "@/lib/auth"
import { deleteItem, updateItem } from "@/lib/db"
import { feedbackPatchSchema, requestPatchSchema } from "@/lib/schemas"

type Ctx = RouteContext<"/api/admin/items/[kind]/[id]">

async function target(ctx: Ctx) {
  const { kind, id } = await ctx.params
  return kind === "requests" || kind === "feedback" ? { kind: kind as "requests" | "feedback", id } : null
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!isAdmin(req)) return unauthorized()
  const t = await target(ctx)
  if (!t) return Response.json({ error: "Не найдено" }, { status: 404 })
  const schema = t.kind === "requests" ? requestPatchSchema : feedbackPatchSchema
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Некорректные данные" }, { status: 400 })
  const item = await updateItem(t.kind, t.id, parsed.data)
  return item ? Response.json({ item }) : Response.json({ error: "Не найдено" }, { status: 404 })
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!isAdmin(req)) return unauthorized()
  const t = await target(ctx)
  if (!t) return Response.json({ error: "Не найдено" }, { status: 404 })
  const ok = await deleteItem(t.kind, t.id)
  return ok ? Response.json({ ok }) : Response.json({ error: "Не найдено" }, { status: 404 })
}
