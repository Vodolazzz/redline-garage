import { z } from "zod"

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .refine((v) => /^\+?\d{10,15}$/.test(v), "Проверьте номер телефона")

export const bookingSchema = z.object({
  name: z.string().trim().min(2, "Как к вам обращаться?").max(80),
  phone,
  email: z.union([z.literal(""), z.email("Проверьте e-mail")]).optional().default(""),
  contactBy: z.enum(["call", "telegram", "whatsapp"]).default("call"),
  carMake: z.string().trim().min(2, "Укажите марку").max(40),
  carModel: z.string().trim().min(1, "Укажите модель").max(60),
  carYear: z.coerce.number().int().min(1960).max(2027).optional(),
  plate: z.string().trim().max(12).optional().default(""),
  mileage: z.coerce.number().int().min(0).max(2_000_000).optional(),
  vin: z.string().trim().max(17).optional().default(""),
  carClass: z.enum(["comfort", "business", "sport"]),
  services: z.array(z.string()).max(30).default([]),
  problem: z.string().trim().max(2000).optional().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите день"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Выберите время"),
  waitOnSite: z.boolean().default(false),
  needReplacementCar: z.boolean().default(false),
  consent: z.literal(true, { error: "Нужно согласие на обработку данных" }),
  website: z.string().max(0).optional(), // honeypot
})

export type BookingInput = z.infer<typeof bookingSchema>

export const feedbackSchema = z.object({
  kind: z.enum(["complaint", "suggestion", "thanks", "question"]),
  name: z.string().trim().min(2, "Как к вам обращаться?").max(80),
  phone: z.union([z.literal(""), phone]).optional().default(""),
  email: z.union([z.literal(""), z.email("Проверьте e-mail")]).optional().default(""),
  orderNumber: z.string().trim().max(20).optional().default(""),
  visitDate: z.string().max(10).optional().default(""),
  rating: z.coerce.number().int().min(0).max(5).optional().default(0),
  subject: z.string().trim().min(3, "Коротко: о чём обращение?").max(140),
  message: z.string().trim().min(10, "Расскажите чуть подробнее").max(4000),
  wantsCallback: z.boolean().default(false),
  consent: z.literal(true, { error: "Нужно согласие на обработку данных" }),
  website: z.string().max(0).optional(),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>

export const REQUEST_STATUSES = ["new", "confirmed", "in_progress", "done", "cancelled"] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]
export const FEEDBACK_STATUSES = ["new", "in_review", "resolved", "rejected"] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export const STATUS_LABEL: Record<RequestStatus | FeedbackStatus, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  in_progress: "В работе",
  done: "Выполнена",
  cancelled: "Отменена",
  in_review: "На рассмотрении",
  resolved: "Решено",
  rejected: "Отклонено",
}

export const KIND_LABEL: Record<FeedbackInput["kind"], string> = {
  complaint: "Жалоба",
  suggestion: "Предложение",
  thanks: "Благодарность",
  question: "Вопрос",
}

export const CONTACT_LABEL: Record<BookingInput["contactBy"], string> = {
  call: "Звонок",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
}

export const requestPatchSchema = z.object({
  status: z.enum(REQUEST_STATUSES).optional(),
  note: z.string().max(4000).optional(),
})

export const feedbackPatchSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  note: z.string().max(4000).optional(),
})
