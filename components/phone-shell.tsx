import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Responsive app shell.
 * - Mobile: edge-to-edge, full-bleed.
 * - Desktop: centered content with comfortable max-width.
 */
export function PhoneShell({
  children,
  className,
  size = "default",
}: {
  children: ReactNode
  className?: string
  size?: "default" | "wide"
}) {
  return (
    <div className="min-h-dvh w-full">
      <div
        className={cn(
          "relative w-full mx-auto min-h-dvh",
          size === "wide" ? "max-w-6xl" : "max-w-3xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
