"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface WaveVisualizerProps {
  bars?: number
  active?: boolean
  className?: string
  color?: string
}

/**
 * Tiny animated bar visualizer that sits below the transcript.
 * Pure CSS — each bar uses wave-pulse with a unique delay & duration.
 */
export function WaveVisualizer({
  bars = 22,
  active = true,
  className,
  color = "oklch(0.55 0.18 290)",
}: WaveVisualizerProps) {
  const config = useMemo(
    () =>
      Array.from({ length: bars }).map((_, i) => {
        const center = (bars - 1) / 2
        const dist = Math.abs(i - center) / center
        const baseHeight = 6 + (1 - dist) * 18 // taller in the middle
        const delay = (i * 0.06) % 1.2
        const duration = 0.9 + (i % 5) * 0.15
        return { baseHeight, delay, duration }
      }),
    [bars],
  )

  return (
    <div
      className={cn("flex items-center justify-center gap-[3px] h-8", className)}
      aria-hidden
    >
      {config.map((c, i) => (
        <span
          key={i}
          className="block w-[2.5px] rounded-full origin-center"
          style={{
            height: c.baseHeight,
            background: color,
            opacity: 0.85,
            animation: active
              ? `wave-pulse ${c.duration}s ease-in-out ${c.delay}s infinite`
              : "none",
          }}
        />
      ))}
    </div>
  )
}
