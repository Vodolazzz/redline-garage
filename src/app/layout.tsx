import type { Metadata, Viewport } from "next"
import { Onest, Unbounded } from "next/font/google"
import { SiteHeader } from "@/components/redline/site-header"
import { SiteFooter } from "@/components/redline/site-footer"
import { SiteFx } from "@/components/redline/fx"
import "./globals.css"

const text = Onest({
  variable: "--font-text",
  subsets: ["latin", "cyrillic"],
  display: "swap",
})

const display = Unbounded({
  variable: "--font-display-face",
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800", "900"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "REDLINE — автоателье в Москве: ремонт и ТО спорткаров и премиум-авто",
    template: "%s · REDLINE",
  },
  description:
    "Диагностика, ТО, тормоза, электрика и детейлинг для спортивных и премиальных автомобилей. Электрозаводская, 7. Ежедневно 8:00–22:00. Онлайн-запись и калькулятор стоимости.",
  keywords: ["автосервис", "ремонт Porsche", "ТО BMW", "автосервис Москва", "диагностика авто", "REDLINE"],
  openGraph: {
    title: "REDLINE — автоателье",
    description: "Ремонт и обслуживание машин, которые слышно.",
    images: ["/media/parts/body.jpg"],
    locale: "ru_RU",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${text.variable} ${display.variable} antialiased`}>
      <body className="min-h-svh">
        <SiteHeader />
        {children}
        <SiteFooter />
        <SiteFx />
      </body>
    </html>
  )
}
