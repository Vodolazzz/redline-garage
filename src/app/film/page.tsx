import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import MetroHero from "@/components/ui/scroll-locked-video-hero"

export const metadata: Metadata = {
  title: "Заезд",
  description: "Porsche 911 GT3 на ралли — прокрутите заезд кадр за кадром.",
}

export default function FilmPage() {
  return (
    <main className="dark bg-night text-white">
      <MetroHero
        videoSrc="/media/porsche-997-rally.webm"
        poster="/media/porsche-997-rally-poster.jpg"
        title="ЗАЕЗД"
        scrollHint="ЛИСТАЙТЕ"
        tagline="После нас машины едут вот так."
        signature={{ name: "видео: Jesus Dieguez Fernandez, CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:Porsche_997_GT3_-_48_Rallye_Internacional_Rias_Baixas.ogv" }}
        scrubDistance={2600}
        style={{ background: "#0a0a0b" }}
      />
      <section className="frame flex min-h-[70svh] flex-col items-start justify-center gap-8 py-24">
        <h1 className="heading max-w-[18ch] text-[clamp(36px,5vw,72px)]">Хотите так же уверенно — запишитесь на подготовку</h1>
        <p className="max-w-[48ch] text-[17px] text-white/75">
          Тормоза, жидкости, развал под трек и проверка подвески за один день. Мастер проедет с вами и расскажет, что
          изменилось.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/booking" className="btn-red glow-ring inline-flex h-14 items-center rounded-[4px] px-7 text-[17px] font-bold">
            Записаться на подготовку
          </Link>
          <Link href="/" className="glow-ring inline-flex h-14 items-center gap-2 rounded-[4px] bg-white/8 px-6 text-[17px] font-semibold hover:bg-white/14">
            <ArrowLeft className="size-5" /> На главную
          </Link>
        </div>
      </section>
    </main>
  )
}
