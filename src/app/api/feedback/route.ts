import type { NextRequest } from "next/server"
import { feedbackSchema } from "@/lib/schemas"
import { addFeedback } from "@/lib/db"
import { rateLimited } from "@/lib/auth"

export async function POST(req: NextRequest) {
  if (rateLimited(req, "feedback")) {
    return Response.json({ error: "Слишком много обращений подряд. Попробуйте позже." }, { status: 429 })
  }
  const parsed = feedbackSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: "Проверьте поля формы", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { consent, website, ...data } = parsed.data
  if (!data.phone && !data.email) {
    return Response.json(
      { error: "Оставьте телефон или e-mail, чтобы мы могли ответить", issues: { phone: ["Телефон или e-mail"] } },
      { status: 400 },
    )
  }
  const item = await addFeedback(data)
  return Response.json({ ok: true, number: item.number }, { status: 201 })
}
