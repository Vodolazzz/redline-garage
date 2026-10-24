import { IgnitionHero } from "@/components/redline/ignition-hero"
import { Contact, Faq, Film, Intro, Masters, Pricing, Process, Services, Showcase, TradeMarquee } from "@/components/redline/sections"

export default function Home() {
  return (
    <main>
      <IgnitionHero />
      <TradeMarquee />
      <Intro />
      <Services />
      <Process />
      <Showcase />
      <Pricing />
      <Film />
      <Masters />
      <Faq />
      <Contact />
    </main>
  )
}
