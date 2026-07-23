"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

type OrbState = "idle" | "listening" | "speaking"

interface VoiceOrbProps {
  state?: OrbState
  size?: number
  className?: string
  /**
   * 0–1 reactive driver. When > 0, overrides the idle "breathing" with a
   * direct response to live audio (mic RMS) or a derived score. The orb
   * inflates, glow intensifies, and rings boost saturation in proportion.
   */
  amplitude?: number
}

/**
 * Closed wavy "flower" path centered on (0,0).
 * r(θ) = base + amplitude * sin(lobes * θ + phase)
 */
function flowerPath(
  baseRadius: number,
  lobes: number,
  amplitude: number,
  phase = 0,
  steps = 96,
): string {
  const pts: Array<[number, number]> = []
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const r = baseRadius + amplitude * Math.sin(lobes * t + phase)
    pts.push([r * Math.cos(t), r * Math.sin(t)])
  }
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`
  }
  d += " Z"
  return d
}

interface RingDef {
  r: number
  amp: number
  phase: number
  stroke: number
  color: string
  opacity: number
  dur: number
  dir: 1 | -1
}

export function VoiceOrb({
  state = "listening",
  size = 280,
  className,
  amplitude = 0,
}: VoiceOrbProps) {
  // Clamp + smooth amplitude — keeps the orb from twitching on micro-noise.
  const amp = Math.max(0, Math.min(1, amplitude))
  const reactive = amp > 0.01
  // Rings — thicker strokes & bolder opacities so the orb is clearly visible on cream bg.
  // Each ring is its OWN <svg> in its OWN absolutely-positioned div, so CSS rotation
  // happens around the div's natural center (no transform-box quirks).
  // Stroke colors are oklch literals (NOT CSS vars) — `var()` does not resolve when
  // applied as an SVG presentation attribute via React props.
  const rings: RingDef[] = useMemo(() => {
    return [
      { r: 38,  amp: 7,  phase: 0.0,  stroke: 2.6, color: "oklch(0.78 0.18 25)",  opacity: 1.0,  dur: 28, dir: 1 },
      { r: 46,  amp: 8,  phase: 0.35, stroke: 2.4, color: "oklch(0.78 0.16 350)", opacity: 0.95, dur: 34, dir: -1 },
      { r: 55,  amp: 10, phase: 0.7,  stroke: 2.2, color: "oklch(0.7 0.18 310)",  opacity: 0.9,  dur: 30, dir: 1 },
      { r: 64,  amp: 11, phase: 1.05, stroke: 2.0, color: "oklch(0.82 0.15 55)",  opacity: 0.85, dur: 38, dir: -1 },
      { r: 74,  amp: 12, phase: 1.4,  stroke: 1.9, color: "oklch(0.78 0.18 25)",  opacity: 0.78, dur: 32, dir: 1 },
      { r: 84,  amp: 13, phase: 1.75, stroke: 1.8, color: "oklch(0.78 0.16 350)", opacity: 0.7,  dur: 42, dir: -1 },
      { r: 94,  amp: 14, phase: 2.1,  stroke: 1.7, color: "oklch(0.7 0.18 310)",  opacity: 0.6,  dur: 36, dir: 1 },
      { r: 104, amp: 14, phase: 2.45, stroke: 1.6, color: "oklch(0.75 0.18 280)", opacity: 0.5,  dur: 46, dir: -1 },
      { r: 114, amp: 15, phase: 2.8,  stroke: 1.5, color: "oklch(0.82 0.15 55)",  opacity: 0.4,  dur: 40, dir: 1 },
    ]
  }, [])

  // Base state styling — the orb has 3 personas (idle / listening / speaking)
  // and amplitude layers a real-time inflation + saturation boost on top.
  const baseScale =
    state === "idle" ? 0.94 : state === "speaking" ? 1.06 : 1
  const baseSat =
    state === "idle" ? 0.9 : state === "speaking" ? 1.2 : 1.05

  // Amplitude ranges chosen so a typical voice (RMS ~0.15) feels alive, and
  // shouting (RMS ~0.6) gets a clearly bigger pulse without breaking layout.
  const ampScale = baseScale + amp * 0.12
  const ampSat = baseSat + amp * 0.5
  const stateStyle = {
    transform: `scale(${ampScale.toFixed(3)})`,
    opacity: state === "idle" && !reactive ? 0.92 : 1,
    filter: `saturate(${ampSat.toFixed(2)})`,
  }

  const listeningOpacity = state === "listening" ? 1 : 0
  const speakingOpacity = state === "speaking" ? 1 : 0
  const glowOpacity =
    (state === "idle" && !reactive ? 0.7 : 1) + amp * 0.35

  // SVG viewBox is fixed; each ring's own <svg> is sized to `size` so paths render at the same scale.
  const VB = 280

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Soft outer glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-700 ease-out"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, oklch(0.85 0.14 350 / 0.5), oklch(0.82 0.14 300 / 0.25) 45%, transparent 72%)",
          filter: "blur(22px)",
          animation: "orb-glow 6s ease-in-out infinite",
          opacity: glowOpacity,
        }}
      />

      {/* Listening ripples */}
      <div
        className="absolute inset-0 grid place-items-center pointer-events-none transition-opacity duration-700 ease-out"
        style={{ opacity: listeningOpacity }}
      >
        {[0, 1.5, 3].map((delay, i) => (
          <div
            key={i}
            className="absolute rounded-full border-2"
            style={{
              width: size * 0.78,
              height: size * 0.78,
              borderColor:
                i === 0
                  ? "oklch(0.78 0.16 350 / 0.4)"
                  : i === 1
                    ? "oklch(0.7 0.18 310 / 0.35)"
                    : "oklch(0.78 0.16 25 / 0.32)",
              animation: `orb-ripple 4.5s ease-out infinite ${delay}s`,
            }}
          />
        ))}
      </div>

      {/* Speaking pulse */}
      <div
        className="absolute inset-0 grid place-items-center pointer-events-none transition-opacity duration-700 ease-out"
        style={{ opacity: speakingOpacity }}
      >
        {[0, 0.8].map((delay, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size * 0.7,
              height: size * 0.7,
              background:
                i === 0
                  ? "radial-gradient(circle, oklch(0.78 0.16 25 / 0.22), transparent 70%)"
                  : "radial-gradient(circle, oklch(0.78 0.16 350 / 0.2), transparent 70%)",
              animation: `orb-speak-pulse 1.6s ease-in-out infinite ${delay}s`,
            }}
          />
        ))}
      </div>

      {/* State morph wrapper */}
      <div
        className="absolute inset-0 grid place-items-center"
        style={{
          ...stateStyle,
          transition:
            "transform 800ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms ease-out, filter 700ms ease-out",
          willChange: "transform, opacity, filter",
        }}
      >
        {/* Hue shift */}
        <div
          className="absolute inset-0 grid place-items-center"
          style={{ animation: "orb-hue 14s ease-in-out infinite" }}
        >
          {/* Breathing wrapper — when amplitude is driving the orb (mic / score),
              we suppress the breathing keyframe so the live signal owns the motion. */}
          <div
            className="relative grid place-items-center"
            style={{
              width: size,
              height: size,
              animation: reactive ? "none" : "orb-breathe 5s ease-in-out infinite",
              transition: "transform 90ms ease-out",
            }}
          >
            {/* Inner core glow — rendered first so it sits underneath */}
            <svg
              viewBox={`-${VB / 2} -${VB / 2} ${VB} ${VB}`}
              width={size}
              height={size}
              className="absolute inset-0 overflow-visible"
            >
              <defs>
                <radialGradient id="orb-core" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="oklch(0.96 0.04 30 / 0.9)" />
                  <stop offset="55%" stopColor="oklch(0.92 0.08 350 / 0.35)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <circle cx="0" cy="0" r="50" fill="url(#orb-core)" />
            </svg>

            {/* One rotating div per ring — CSS rotates the DIV (not an inner <g>),
                so rotation always pivots around the div's center. Bulletproof. */}
            {rings.map((ring, i) => (
              <div
                key={i}
                className="absolute inset-0 grid place-items-center"
                style={{
                  animation: `${ring.dir > 0 ? "orb-spin" : "orb-spin-rev"} ${ring.dur}s linear infinite`,
                  transformOrigin: "50% 50%",
                  willChange: "transform",
                }}
              >
                <svg
                  viewBox={`-${VB / 2} -${VB / 2} ${VB} ${VB}`}
                  width={size}
                  height={size}
                  className="overflow-visible"
                >
                  <path
                    d={flowerPath(ring.r, 5, ring.amp, ring.phase)}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={ring.stroke}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={ring.opacity}
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}