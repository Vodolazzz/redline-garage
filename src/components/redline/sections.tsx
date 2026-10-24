import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import { BRAND, MASTERS } from "@/lib/content"
import { ServicesIndex } from "./services-index"
import { Calculator } from "./calculator"
import { Gear } from "./gear"
import { ContainerScroll } from "@/components/ui/container-scroll"

/* ───────────── Marquee of trades ───────────── */
export function TradeMarquee() {
  const words = ["Диагностика", "ТО", "Тормоза", "ГРМ", "Подвеска", "Электрика", "Кондиционер", "Шиномонтаж", "Детейлинг", "Керамика"]
  const row = [...words, ...words]
  return (
    <div className="relative overflow-hidden bg-[#e10600] py-5 text-white" aria-hidden>
      <div className="marquee" style={{ ["--marquee-speed" as string]: "34s" }}>
        {row.map((w, i) => (
          <span key={i} className="display flex items-center gap-8 pr-8 text-[clamp(28px,4vw,56px)]">
            {w}
            <Gear className="size-[0.7em] animate-[spin_6s_linear_infinite] opacity-80" />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ───────────── Intro: title, note, facts ───────────── */
export function Intro() {
  const facts = [
    { v: "7 постов", d: "два из них — под спорткары с низким клиренсом" },
    { v: "8:00–22:00", d: "без выходных, приёмка до 21:00" },
    { v: "24 месяца", d: "гарантия на работы и наши запчасти" },
    { v: "15 минут", d: "на приёмку: осмотр, фото, заказ-наряд" },
  ]
  return (
    <section className="frame relative pb-[120px] pt-[140px]" aria-labelledby="intro-h">
      <div className="grid gap-10 md:grid-cols-12">
        <h2 id="intro-h" data-rise className="heading text-[clamp(26px,5vw,76px)] md:col-span-7">
          Мастерская на Электрозаводской
        </h2>
        <p data-rise style={{ ["--i" as string]: 1 }} className="max-w-[34ch] self-end text-[17px] md:col-span-4 md:col-start-9">
          Мы чиним машины так, как хотели бы, чтобы чинили нашу: показываем каждую деталь до замены, согласуем каждый рубль и
          отдаём старые запчасти в коробке.
        </p>
      </div>
      <dl className="mt-[100px] grid grid-cols-2 gap-x-6 gap-y-10 md:flex md:justify-between">
        {facts.map((f, i) => (
          <div key={f.v} data-rise style={{ ["--i" as string]: i }} className="max-w-[220px]">
            <dt className="heading whitespace-nowrap text-[clamp(24px,2.6vw,40px)] text-ink">{f.v}</dt>
            <dd className="mt-2 text-[14px] leading-snug text-ink-soft">{f.d}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ───────────── Services: one-size name columns ───────────── */
export function Services() {
  return (
    <section id="services" className="frame relative scroll-mt-20 py-[18vh]" aria-labelledby="services-h">
      <Gear className="pointer-events-none absolute -right-24 top-10 size-[340px] animate-[spin_40s_linear_infinite] text-ink/[0.04] md:size-[520px]" />
      <h2 id="services-h" data-rise className="heading mb-24 text-[clamp(24px,2.2vw,32px)]">
        Что мы делаем
      </h2>
      <ServicesIndex />
    </section>
  )
}

/* ───────────── Process: the work order as a printed slip ───────────── */
export function Process() {
  const stages = [
    {
      when: "Утро, 8:00",
      rows: [
        ["Приёмка: осмотр, фото кузова, пробег", "15 мин"],
        ["Компьютерная диагностика", "40 мин"],
      ],
    },
    {
      when: "Утро, 9:00",
      rows: [
        ["Видео с подъёмника — вам в мессенджер", "5 мин"],
        ["Смета и согласование каждого пункта", "10 мин"],
      ],
    },
    {
      when: "День",
      rows: [
        ["Запчасти со склада или от дилера", "0–2 ч"],
        ["Ремонт по нормативу завода", "по наряду"],
        ["Контрольная поездка с мастером", "20 мин"],
      ],
    },
    {
      when: "Вечер",
      rows: [
        ["Мойка, старые детали — в коробку", "30 мин"],
        ["Выдача, гарантийный талон", "10 мин"],
      ],
    },
  ]
  return (
    <section id="process" data-tone="dark" className="dark grain relative scroll-mt-16 bg-night py-[160px] text-[#f2f0ec]" aria-labelledby="process-h">
      <div className="frame grid gap-14 md:grid-cols-12">
        <div className="md:col-span-6">
          <h2 id="process-h" data-rise className="heading text-[clamp(36px,3.8vw,60px)]">
            Один день из заказ-наряда
          </h2>
          <p data-rise style={{ ["--i" as string]: 1 }} className="mt-8 max-w-[34ch] text-[17px] text-white/80">
            Так выглядит обычный ремонт тормозов и ТО у нас. Вы получаете этот лист на руки — и видите, за что платите и
            сколько это заняло.
          </p>
          <Link
            href="/booking"
            data-rise
            style={{ ["--i" as string]: 2 }}
            className="btn-red glow-ring mt-10 inline-flex h-14 items-center gap-3 rounded-[4px] px-7 text-[17px] font-bold"
          >
            Открыть свой заказ-наряд <ArrowUpRight className="size-5" />
          </Link>
        </div>
        <div className="md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8">
          <div
            data-rise
            style={{ ["--i" as string]: 1 }}
            className="zigzag mx-auto w-full max-w-[500px] rotate-[1.2deg] bg-paper px-7 pb-14 pt-8 text-ink transition-transform duration-700 hover:rotate-0 md:px-9"
          >
            <div className="flex items-baseline justify-between">
              <div className="text-[19px] font-black tracking-[-0.03em]" style={{ fontFamily: "var(--font-display-face)" }}>
                REDLINE
              </div>
              <div className="text-[14px] text-ink-soft tabular">Заказ-наряд № 7000</div>
            </div>
            <div className="mt-1 text-[14px] text-ink-soft">Porsche 911 Carrera S · 48 200 км</div>
            {stages.map((s) => (
              <div key={s.when} className="mt-7">
                <div className="text-[16px] font-bold">{s.when}</div>
                {s.rows.map(([what, t]) => (
                  <div key={what} className="mt-2 flex items-baseline text-[15px] tabular">
                    <span>{what}</span>
                    <span className="leader" />
                    <span className="whitespace-nowrap font-semibold">{t}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="-mx-7 mt-8 flex h-11 items-center justify-between bg-ink px-7 text-[15px] font-bold text-paper md:-mx-9 md:px-9">
              <span>Машина готова</span>
              <span className="tabular">в тот же день</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────── Pricing: one sentence + the calculator ───────────── */
export function Pricing() {
  return (
    <section id="calc" className="relative scroll-mt-16 overflow-hidden bg-night" data-tone="dark" aria-labelledby="calc-h">
      <ContainerScroll
        titleComponent={
          <div className="dark px-4 text-[#f2f0ec]">
            <p className="text-[19px] font-semibold text-white/70">Соберите ремонт сами</p>
            <h2 id="calc-h" className="heading mx-auto mt-2 text-[clamp(36px,5.6vw,88px)]">
              ТО от <span className="inline-block bg-[#e10600] px-[0.15em] text-white">9 900 ₽</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-[17px] text-white/70">
              Класс машины, работы, итог и время в боксе — до того, как приедете. Запчасти считаем отдельно, по чеку.
            </p>
          </div>
        }
      >
        <div className="max-h-[78svh] overflow-y-auto px-4 pb-8 md:px-8 [&>div]:mt-6">
          <Calculator />
        </div>
      </ContainerScroll>
    </section>
  )
}

/* ───────────── People: masters as a table ───────────── */
export function Masters() {
  return (
    <section className="frame py-[160px]" aria-labelledby="masters-h">
      <div className="grid items-end gap-10 md:grid-cols-12">
        <h2 id="masters-h" data-rise className="heading text-[clamp(40px,5vw,76px)] md:col-span-7">
          Кто держит
          <br />
          <span className="md:pl-[16.6%]">ключ на 10</span>
        </h2>
        <figure data-rise style={{ ["--i" as string]: 1 }} className="relative aspect-[16/10] overflow-hidden md:col-span-5">
          <Image src="/media/parts/rear.jpg" alt="Чёрный седан сзади" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover transition-transform duration-[1.4s] hover:scale-105" />
          <figcaption className="absolute bottom-0 left-0 bg-ink/70 px-3 py-1.5 text-[13px] text-white">После диагностики — домой</figcaption>
        </figure>
      </div>
      <table className="mt-[72px] w-full border-collapse text-left text-[17px]">
        <thead className="sr-only">
          <tr>
            <th>Мастер</th>
            <th>Специализация</th>
            <th>Марки</th>
            <th>Стаж</th>
          </tr>
        </thead>
        <tbody>
          {MASTERS.map((m, i) => (
            <tr
              key={m.name}
              data-rise
              style={{ ["--i" as string]: i }}
              className="group transition-colors odd:bg-paper-2 hover:!bg-[#e10600] hover:text-white max-md:flex max-md:flex-col max-md:px-4 max-md:py-4"
            >
              <td className="py-[14px] font-bold md:pl-5">{m.name}</td>
              <td className="py-[14px] max-md:py-0">{m.role}</td>
              <td className="py-[14px] text-ink-soft group-hover:text-white/85 max-md:py-0">{m.makes}</td>
              <td className="py-[14px] text-right tabular max-md:py-0 max-md:text-left md:pr-5">
                с {m.since} года · {2026 - m.since} лет
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

/* ───────────── FAQ ───────────── */
const FAQ = [
  ["Можно ли привезти свои запчасти?", "Да. Мы установим их, но гарантию дадим только на работу. Если деталь окажется неисправной, повторная установка оплачивается отдельно."],
  ["Сохранится ли дилерская гарантия?", "Да. Мы работаем по регламенту производителя, используем допущенные масла и запчасти и ставим отметку в сервисную книжку."],
  ["Сколько ждать запись?", "Обычно — следующий день. Диагностику и шиномонтаж часто делаем день в день: оставьте заявку, администратор перезвонит за 15 минут."],
  ["Что, если в ремонте найдётся ещё что-то?", "Мы остановимся и пришлём вам фото или видео. Без вашего «да» в мессенджере ни одна дополнительная работа не начнётся."],
  ["Можно ли подождать на месте?", "Да: у нас зона ожидания с кофе, Wi-Fi и окном в бокс — видно, как идёт работа. На долгий ремонт дадим подменную машину."],
  ["Как оплатить?", "Картой, по СБП или по счёту для юрлиц. Предоплаты нет — вы платите после контрольной поездки."],
]

export function Faq() {
  return (
    <section id="faq" className="frame scroll-mt-16 py-[160px]" aria-labelledby="faq-h">
      <h2 id="faq-h" data-rise className="heading max-w-[16ch] text-[clamp(40px,5.5vw,84px)]">
        Что спрашивают на приёмке
      </h2>
      <div className="mt-20 md:ml-[33.3%]">
        {FAQ.map(([q, a], i) => (
          <details
            key={q}
            data-rise
            style={{ ["--i" as string]: i }}
            className="group -mx-6 mb-4 rounded-[4px] px-6 py-4 transition-colors open:bg-paper-2"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[clamp(19px,1.6vw,24px)] font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <span className="relative size-5 shrink-0 transition-transform duration-500 group-open:rotate-180" aria-hidden>
                <span className="absolute left-0 top-1/2 h-[2px] w-[11px] origin-right -translate-y-1/2 rotate-[40deg] bg-current" />
                <span className="absolute right-0 top-1/2 h-[2px] w-[11px] origin-left -translate-y-1/2 -rotate-[40deg] bg-current" />
              </span>
            </summary>
            <p className="mt-4 max-w-[52ch] text-[17px] text-ink-soft">{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

/* ───────────── Contact: the phone as display type ───────────── */
export function Contact() {
  return (
    <section
      id="contact"
      data-tone="dark"
      className="dark relative flex min-h-[100svh] flex-col justify-between overflow-hidden bg-[#e10600] py-[clamp(24px,4vw,48px)] text-white"
      aria-labelledby="contact-h"
    >
      <Gear className="pointer-events-none absolute -bottom-40 -right-40 size-[620px] animate-[spin_30s_linear_infinite] text-black/10" />
      <div className="frame relative grid gap-10 pt-16 md:grid-cols-2">
        <h2 id="contact-h" data-rise className="max-w-[24ch] text-[clamp(20px,1.8vw,24px)] font-semibold leading-snug">
          Стучит, горит чек или просто пора на ТО — позвоните, ответит мастер, а не колл-центр.
        </h2>
        <div data-rise style={{ ["--i" as string]: 1 }} className="relative aspect-[16/10] w-full overflow-hidden md:max-w-[520px] md:justify-self-end">
          <iframe
            title="REDLINE на карте"
            src="https://www.openstreetmap.org/export/embed.html?bbox=37.7005%2C55.7765%2C37.7165%2C55.7845&layer=mapnik&marker=55.7805%2C37.7085"
            className="absolute inset-0 h-full w-full grayscale contrast-125"
            loading="lazy"
          />
        </div>
      </div>
      <div className="frame relative">
        <a
          href={BRAND.phoneHref}
          className="display block whitespace-nowrap text-[clamp(30px,8.3vw,150px)] leading-[0.9] transition-colors duration-300 hover:text-black"
          data-cursor="Звонок"
        >
          {BRAND.phone}
        </a>
        <div className="mt-10 flex flex-col justify-between gap-3 text-[15px] md:flex-row">
          <span>
            {BRAND.address} · {BRAND.hours}
          </span>
          <span className="flex gap-6">
            <a className="underline-offset-4 hover:underline" href={`mailto:${BRAND.email}`}>
              {BRAND.email}
            </a>
            <Link className="underline-offset-4 hover:underline" href="/booking">
              Онлайн-запись
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/feedback">
              Написать жалобу
            </Link>
          </span>
        </div>
      </div>
    </section>
  )
}
