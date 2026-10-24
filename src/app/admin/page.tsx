import type { Metadata } from "next"
import { Suspense } from "react"
import { AdminApp } from "@/components/redline/admin/admin-app"

export const metadata: Metadata = {
  title: "Панель управления",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-night" />}>
      <AdminApp />
    </Suspense>
  )
}
