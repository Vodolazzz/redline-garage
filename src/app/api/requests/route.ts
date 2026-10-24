import type { NextRequest } from "next/server"
import { bookingSchema } from "@/lib/schemas"
import { addRequest } from "@/lib/db"
import { rateLimited } from "@/lib/auth"
import { SERVICES, priceFor } from "@/lib/content"

export async function POST(req: NextRequest) {
  if (rateLimited(req, "booking")) {
    return Response.json({ error: "Слишком много заявок. Позвоните нам: +7 495 700-70-00" }, { status: 429 })
  }
  const parsed = bookingSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: "Проверьте поля формы", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { consent, website, ...data } = parsed.data
  const services = data.services.filter((id) => SERVICES.some((s) => s.id === id))
  const estimate = SERVICES.filter((s) => services.includes(s.id)).reduce((sum, s) => sum + priceFor(s, data.carClass), 0)
  const item = await addRequest({ ...data, services, estimate })
  return Response.json({ ok: true, number: item.number }, { status: 201 })
}
