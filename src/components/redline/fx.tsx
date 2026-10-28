"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

/**
 * Site-wide effects:
 *  - marks <html> with .js so [data-rise] entrances can start hidden (content stays visible without JS)
 *  - reveals [data-rise] elements once as they enter
 */
export function SiteFx() {
  const pathname = usePathname()

  useEffect(() => {
    document.documentElement.classList.add("js")
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in")
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    )
    const scan = () => document.querySelectorAll("[data-rise]:not(.is-in), [data-reveal]:not(.is-in)").forEach((el) => io.observe(el))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [pathname])

  return null
}
