import { ChargerHero } from "@/components/redline/charger-hero"
import { Teardown } from "@/components/redline/teardown"
import { ServicesTrack } from "@/components/redline/services-track"
import { Contact, Faq, Intro, Masters, Pricing, Process, TradeMarquee } from "@/components/redline/sections"

export default function Home() {
  return (
    <main>
      <ChargerHero />
      <TradeMarquee />
      <Teardown />
      <Intro />
      <ServicesTrack />
      <Process />
      <Pricing />
      <Masters />
      <Faq />
      <Contact />
    </main>
  )
}
