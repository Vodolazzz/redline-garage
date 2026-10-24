import type { NextRequest } from "next/server"
import { isAdmin, unauthorized } from "@/lib/auth"
import { readDb } from "@/lib/db"
import { CONTACT_LABEL, KIND_LABEL, STATUS_LABEL } from "@/lib/schemas"
import { CAR_CLASSES, SERVICES } from "@/lib/content"

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const kind = req.nextUrl.searchParams.get("kind") === "feedback" ? "feedback" : "requests"
  const db = await readDb()
  let rows: unknown[][]
  if (kind === "requests") {
    rows = [
      ["№", "Создана", "Статус", "Имя", "Телефон", "E-mail", "Связь", "Марка", "Модель", "Год", "Пробег", "Класс", "Работы", "Оценка, ₽", "Дата", "Время", "Проблема", "Заметка"],
      ...db.requests.map((r) => [
        r.number,
        r.createdAt,
        STATUS_LABEL[r.status],
        r.name,
        r.phone,
        r.email,
        CONTACT_LABEL[r.contactBy],
        r.carMake,
        r.carModel,
        r.carYear ?? "",
        r.mileage ?? "",
        CAR_CLASSES.find((c) => c.id === r.carClass)?.label,
        r.services.map((id) => SERVICES.find((s) => s.id === id)?.name ?? id).join("; "),
        r.estimate,
        r.date,
        r.time,
        r.problem,
        r.note,
      ]),
    ]
  } else {
    rows = [
      ["№", "Создано", "Тип", "Статус", "Имя", "Телефон", "E-mail", "Заказ-наряд", "Дата визита", "Оценка", "Тема", "Текст", "Перезвонить", "Заметка"],
      ...db.feedback.map((f) => [
        f.number,
        f.createdAt,
        KIND_LABEL[f.kind],
        STATUS_LABEL[f.status],
        f.name,
        f.phone,
        f.email,
        f.orderNumber,
        f.visitDate,
        f.rating || "",
        f.subject,
        f.message,
        f.wantsCallback ? "да" : "нет",
        f.note,
      ]),
    ]
  }
  // BOM so Excel opens Cyrillic correctly; semicolons for the Russian locale
  const csv = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n")
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="redline-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
