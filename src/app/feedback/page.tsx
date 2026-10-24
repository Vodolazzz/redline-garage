import type { Metadata } from "next"
import { FeedbackForm } from "@/components/redline/feedback-form"
import { BRAND } from "@/lib/content"

export const metadata: Metadata = {
  title: "Отзывы, жалобы и предложения",
  description: "Напишите руководителю REDLINE: жалоба, предложение, благодарность мастеру или вопрос. Ответ в течение 24 часов.",
}

const STEPS = [
  ["Сегодня", "Обращение читает руководитель сервиса, а не бот. Вы получаете номер."],
  ["До 24 часов", "Звоним или пишем, уточняем детали, поднимаем заказ-наряд и записи камер в боксе."],
  ["До 3 дней", "Предлагаем решение: бесплатную переделку, компенсацию или объяснение с фото и видео."],
  ["Дальше", "Если решение не устроило — вопрос переходит к директору, а вы вправе обратиться в Роспотребнадзор."],
]

export default function FeedbackPage() {
  return (
    <main className="min-h-svh pt-[120px] md:pt-[150px]">
      <div className="frame grid gap-16 pb-[140px] lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="heading text-[clamp(40px,6vw,92px)]">Напишите руководителю</h1>
          <p className="mt-6 max-w-[48ch] text-[19px] text-ink-soft">
            Жалоба, идея или спасибо мастеру — всё попадает к одному человеку, который отвечает за качество. Мы не удаляем
            неудобные отзывы.
          </p>
          <div className="mt-14">
            <FeedbackForm />
          </div>
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="dark sticky top-24 rounded-[4px] bg-night p-8 text-[#f2f0ec]">
            <h2 className="heading text-[clamp(24px,2.2vw,32px)]">Как мы разбираем жалобы</h2>
            <ol className="mt-8 space-y-6">
              {STEPS.map(([when, what]) => (
                <li key={when} className="grid grid-cols-[18px_1fr] gap-4">
                  <span className="mt-1.5 size-[10px] rounded-full bg-[#e10600] shadow-[0_0_12px_#e10600]" aria-hidden />
                  <div>
                    <div className="text-[16px] font-bold">{when}</div>
                    <p className="mt-1 text-[15px] leading-snug text-white/70">{what}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-10 space-y-1 text-[15px] text-white/70">
              <div className="font-bold text-white">Напрямую</div>
              <a href={`mailto:${BRAND.email}`} className="block hover:text-[#e10600]">{BRAND.email}</a>
              <a href={BRAND.phoneHref} className="block hover:text-[#e10600]">{BRAND.phone}</a>
              <p className="pt-3 text-[13px] leading-snug text-white/50">
                Письменную претензию можно также передать на приёмке или отправить почтой: {BRAND.address}, {BRAND.legal}.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
