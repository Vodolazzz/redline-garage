"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, type MotionValue } from "motion/react"

// A screen that lies tilted back and stands up as you scroll to it
// (the "Scroll Animations" tablet). Title rises with it.

export function ContainerScroll({ titleComponent, children }: { titleComponent: React.ReactNode; children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] })

  const rotate = useTransform(scrollYProgress, [0.1, 0.45], [24, 0])
  const scale = useTransform(scrollYProgress, [0.1, 0.45], [1.06, 1])
  const translate = useTransform(scrollYProgress, [0.1, 0.45], [0, -60])

  return (
    <div ref={containerRef} className="relative flex items-center justify-center px-2 py-16 md:px-10 md:py-28">
      <div className="relative w-full" style={{ perspective: "1000px" }}>
        <motion.div style={{ translateY: translate }} className="mx-auto max-w-5xl text-center">
          {titleComponent}
        </motion.div>
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  )
}

function Card({ rotate, scale, children }: { rotate: MotionValue<number>; scale: MotionValue<number>; children: React.ReactNode }) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="mx-auto -mt-6 w-full max-w-6xl rounded-[30px] border-4 border-[#6c6c6c] bg-[#222222] p-2 md:p-5"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-paper-2 md:rounded-2xl">{children}</div>
    </motion.div>
  )
}
