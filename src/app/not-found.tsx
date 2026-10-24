import Link from "next/link"
import { Gear } from "@/components/redline/gear"

export default function NotFound() {
  return (
    <main data-tone="dark" className="dark grain relative flex min-h-svh flex-col items-start justify-center overflow-hidden bg-night px-[var(--margin)] text-[#f2f0ec]">
      <Gear className="absolute -right-32 top-1/2 size-[520px] -translate-y-1/2 animate-[spin_24s_linear_infinite] text-[#e10600]/20" />
      <div className="display text-[clamp(120px,26vw,380px)] leading-[0.8] text-[#e10600]">404</div>
      <h1 className="heading mt-8 text-[clamp(28px,3.4vw,52px)]">Заглохли на пустой дороге</h1>
      <p className="mt-4 max-w-[40ch] text-[17px] text-white/75">Такой страницы нет. Эвакуатор не нужен — вернём на главную в один клик.</p>
      <Link href="/" className="btn-red glow-ring relative mt-10 inline-flex h-14 items-center rounded-[4px] px-7 text-[17px] font-bold">
        Завести и вернуться
      </Link>
    </main>
  )
}
