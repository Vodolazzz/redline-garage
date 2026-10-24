import Link from "next/link"

export interface LegalSection {
  id: string
  title: string
  body: React.ReactNode
}

// Long-form document layout: sticky table of contents on the left, text on the right.
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: React.ReactNode; sections: LegalSection[] }) {
  return (
    <main className="frame min-h-svh pb-[160px] pt-[120px] md:pt-[150px]">
      <h1 className="heading max-w-[20ch] text-[clamp(36px,5vw,76px)]">{title}</h1>
      <p className="mt-4 text-[15px] text-ink-soft">Редакция от {updated}</p>
      <div className="mt-16 grid gap-12 lg:grid-cols-12">
        <nav className="lg:col-span-3" aria-label="Содержание">
          <ol className="sticky top-28 space-y-2 text-[15px]">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-ink-soft transition-colors hover:text-[#e10600]">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="max-w-[70ch] lg:col-span-8 lg:col-start-5 [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_ul]:list-disc [&_ul]:pl-6">
          <div className="text-[19px] leading-relaxed">{intro}</div>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 pt-14 text-[17px] leading-relaxed">
              <h2 className="heading text-[clamp(22px,2vw,30px)]">{s.title}</h2>
              {s.body}
            </section>
          ))}
          <p className="mt-16 rounded-[4px] bg-paper-2 p-5 text-[15px] text-ink-soft">
            Остались вопросы по документу? Напишите через{" "}
            <Link href="/feedback" className="font-semibold text-[#e10600] hover:underline">
              форму обращений
            </Link>
            .
          </p>
        </article>
      </div>
    </main>
  )
}
