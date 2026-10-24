"use client"

import { cn } from "@/lib/utils"

// Form primitives shared by the booking, feedback and admin screens.
// Fields lift on focus and draw the red ring; errors slide in under the field.

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <div className={cn("group/field", className)}>
      <label htmlFor={htmlFor} className="mb-2 block text-[15px] font-semibold">
        {label}
        {hint && <span className="ml-2 font-normal text-ink-soft">{hint}</span>}
      </label>
      {children}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300",
          error ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        aria-live="polite"
      >
        <p className="overflow-hidden pt-1.5 text-[14px] font-medium text-[#e10600]">{error}</p>
      </div>
    </div>
  )
}

const base =
  "w-full rounded-[4px] bg-white px-4 text-[17px] text-ink outline-none ring-1 ring-ink/12 transition-[box-shadow,transform,background-color] duration-300 placeholder:text-ink-soft/60 hover:ring-ink/30 focus:-translate-y-[1px] focus:ring-2 focus:ring-[#e10600] focus:shadow-[0_10px_30px_-12px_rgba(225,6,0,.55)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[#e10600]/70"

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, "h-[52px]", className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "min-h-[130px] resize-y py-3.5 leading-relaxed", className)} {...props} />
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(base, "h-[52px] appearance-none bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23e10600' stroke-width='3'><path d='m6 9 6 6 6-6'/></svg>\")] bg-[length:14px] bg-[right_16px_center] bg-no-repeat pr-10", className)} {...props}>
      {children}
    </select>
  )
}

export function Choice({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-active={active}
      className={cn(
        "glow-ring rounded-[4px] px-4 py-3 text-left text-[16px] transition-colors duration-300",
        active ? "bg-ink text-paper" : "bg-white hover:bg-paper-2",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
  invalid,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
  invalid?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[3px] ring-1 transition-all duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-[#e10600]",
          checked ? "bg-[#e10600] ring-[#e10600]" : invalid ? "bg-white ring-2 ring-[#e10600]/70" : "bg-white ring-ink/25",
        )}
      >
        <svg viewBox="0 0 16 16" className={cn("size-3.5 text-white transition-transform duration-300", checked ? "scale-100" : "scale-0")}>
          <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  )
}

/** Turns "+7 (999) 123-45-67" style masking on as you type. */
export function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, "")
  if (d.startsWith("8")) d = "7" + d.slice(1)
  if (!d.startsWith("7")) d = "7" + d
  d = d.slice(0, 11)
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)]
  let out = "+7"
  if (p[0]) out += ` (${p[0]}`
  if (p[0].length === 3) out += ")"
  if (p[1]) out += ` ${p[1]}`
  if (p[2]) out += `-${p[2]}`
  if (p[3]) out += `-${p[3]}`
  return out
}
