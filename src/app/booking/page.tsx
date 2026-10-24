import type { Metadata } from "next"
import { Suspense } from "react"
import { BookingWizard } from "@/components/redline/booking-wizard"

export const metadata: Metadata = {
  title: "Запись на сервис",
  description: "Онлайн-запись в REDLINE: выберите работы, день и время приёмки — предварительная стоимость сразу.",
}

export default function BookingPage() {
  return (
    <main className="frame min-h-svh pb-[140px] pt-[120px] md:pt-[150px]">
      <header className="mb-14 grid gap-6 md:grid-cols-12">
        <h1 className="heading text-[clamp(40px,6vw,92px)] md:col-span-8">Запись на сервис</h1>
        <p className="max-w-[36ch] self-end text-[17px] text-ink-soft md:col-span-4">
          Четыре шага, две минуты. Предварительная стоимость считается сразу — справа, на черновике заказ-наряда.
        </p>
      </header>
      <Suspense fallback={<div className="h-[60vh]" />}>
        <BookingWizard />
      </Suspense>
    </main>
  )
}
