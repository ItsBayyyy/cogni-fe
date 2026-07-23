"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react"
import { VoiceOrb } from "@/components/voice-orb"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface OnboardingOverlayProps {
  userName: string
  onClose: () => void
}

const TOTAL = 4

/**
 * Interactive first-run tour that mirrors CogniFlip's visual language —
 * orb states, score sweep, wave bars, typewriter — so the lesson IS the
 * brand. Mobile compresses the orb and stacks; desktop gives it room.
 */
export function OnboardingOverlay({ userName, onClose }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const primaryRef = useRef<HTMLButtonElement>(null)
  const isMobile = useIsMobile()
  // Orb size adapts; on the smallest screens we still want a recognizable mark.
  const orbSize = isMobile ? 168 : 220

  const next = useCallback(() => setStep((s) => Math.min(TOTAL - 1, s + 1)), [])
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), [])

  const finish = useCallback(() => {
    onClose()
    // Nudge the user straight into the action — unless they're already
    // mid-flow somewhere meaningful.
    if (pathname !== "/setup" && pathname !== "/session" && pathname !== "/result") {
      router.push("/setup")
    }
  }, [onClose, router, pathname])

  // Keyboard navigation — Esc to skip, ←/→ between steps, Enter to advance.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        // Don't hijack Enter inside form fields (none here, but safe-by-default).
        const target = e.target as HTMLElement | null
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return
        e.preventDefault()
        if (step === TOTAL - 1) finish()
        else next()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        back()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [step, next, back, finish, onClose])

  // Lock background scroll while the dialog is open.
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  // Pull keyboard focus to the primary CTA whenever the step changes — so
  // pressing Enter immediately advances, no extra Tab dance.
  useEffect(() => {
    primaryRef.current?.focus()
  }, [step])

  const isLast = step === TOTAL - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboard-title"
      className="fixed inset-0 z-[100] grid place-items-center px-4 py-6 sm:p-8 bg-foreground/40 backdrop-blur-sm animate-float-up"
      onClick={(e) => {
        // Click outside the card dismisses (treats as skip).
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-card/95 backdrop-blur-xl border border-white/60 shadow-[0_30px_80px_-20px_oklch(0.5_0.05_330/0.55)] overflow-hidden">
        {/* Top bar — progress dots + skip */}
        <div className="flex items-center justify-between px-5 sm:px-7 pt-5 sm:pt-6">
          <div
            className="flex items-center gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={TOTAL}
            aria-valuenow={step + 1}
            aria-label={`Step ${step + 1} of ${TOTAL}`}
          >
            {Array.from({ length: TOTAL }).map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step
                    ? "w-7 bg-foreground"
                    : i < step
                      ? "w-1.5 bg-foreground/60"
                      : "w-1.5 bg-foreground/15",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip onboarding"
            className="text-muted-foreground hover:text-foreground/80 text-[12.5px] tracking-tight inline-flex items-center gap-1 px-2 py-1 -mr-1 rounded-full transition"
          >
            Skip
            <X className="size-3.5" aria-hidden />
          </button>
        </div>

        {/* Step content — keyed so float-up retriggers on each transition */}
        <div className="px-5 sm:px-8 pt-4 pb-6 sm:pb-8" key={step}>
          <StepContent step={step} userName={userName} orbSize={orbSize} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-foreground/5 bg-foreground/[0.015] px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="text-[13.5px] font-medium tracking-tight inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back
          </button>
          <button
            ref={primaryRef}
            type="button"
            onClick={isLast ? finish : next}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-foreground text-background text-[13.5px] font-medium tracking-tight shadow-[0_10px_24px_-12px_oklch(0.2_0.02_60/0.5)] active:scale-[0.99] hover:bg-foreground/90 transition"
          >
            {isLast ? "Get started" : "Next"}
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Step content + visuals                                                   */
/* ──────────────────────────────────────────────────────────────────────── */

const STEPS: Array<{
  title: (name: string) => string
  description: string
  hint?: string
}> = [
  {
    title: (name) => `Hi ${name.split(" ")[0]}, meet CogniFlip.`,
    description:
      "A voice coach that listens, replies in real time, and scores every session so your next take is sharper than the last.",
  },
  {
    title: () => "Start with anything on your mind.",
    description:
      "Pitch a startup, prep an interview, rehearse a toast, work out a stoic reflection — CogniFlip rolls with it. Pick a persona to set the tone.",
    hint: "Tap a chip or type your own",
  },
  {
    title: () => "Hold space, then speak.",
    description:
      "CogniFlip listens until you pause, replies in voice, and you can cut in at any time. On mobile, hold the orb. On desktop, hold the spacebar.",
    hint: "Press space · Tap to talk",
  },
  {
    title: () => "Every session ends with a coach report.",
    description:
      "Clarity, depth, pacing, charisma — scored on a 0–100 scale with a coach moment that points out exactly what to work on next.",
  },
]

function StepContent({
  step,
  userName,
  orbSize,
}: {
  step: number
  userName: string
  orbSize: number
}) {
  const meta = STEPS[step]
  return (
    <div className="animate-float-up">
      <div className="grid place-items-center min-h-[240px] sm:min-h-[280px] py-2">
        {step === 0 && <Step1Visual orbSize={orbSize} />}
        {step === 1 && <Step2Visual />}
        {step === 2 && <Step3Visual orbSize={orbSize} />}
        {step === 3 && <Step4Visual />}
      </div>
      <div className="text-center space-y-2 mt-3 sm:mt-5 max-w-md mx-auto">
        <h2
          id="onboard-title"
          className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-balance leading-[1.15]"
        >
          {meta.title(userName)}
        </h2>
        <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed text-pretty">
          {meta.description}
        </p>
        {meta.hint && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80 pt-1">
            {meta.hint}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Step 1 — meet CogniFlip (idle orb + floating sparkles) ─── */
function Step1Visual({ orbSize }: { orbSize: number }) {
  const sparkles = [
    { x: -orbSize * 0.55, y: -orbSize * 0.42, size: 16, delay: "0s", dur: "3.2s" },
    { x: orbSize * 0.5, y: -orbSize * 0.32, size: 14, delay: "0.6s", dur: "3.6s" },
    { x: orbSize * 0.6, y: orbSize * 0.36, size: 18, delay: "1.2s", dur: "3.0s" },
    { x: -orbSize * 0.48, y: orbSize * 0.5, size: 13, delay: "0.3s", dur: "3.4s" },
    { x: 0, y: -orbSize * 0.58, size: 12, delay: "0.9s", dur: "3.8s" },
  ]
  return (
    <div
      className="relative"
      style={{ width: orbSize * 1.5, height: orbSize * 1.4 }}
    >
      <div className="absolute inset-0 grid place-items-center">
        <VoiceOrb state="idle" size={orbSize} />
      </div>
      {sparkles.map((s, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px))`,
          }}
        >
          <Sparkles
            style={{
              width: s.size,
              height: s.size,
              color: "oklch(0.78 0.18 25)",
              animation: `onboard-sparkle ${s.dur} ease-in-out ${s.delay} infinite`,
              opacity: 0.85,
              filter: "drop-shadow(0 2px 8px oklch(0.78 0.18 25 / 0.35))",
            }}
          />
        </span>
      ))}
    </div>
  )
}

/* ─── Step 2 — typewriter topic input + chip suggestions ─── */
function Step2Visual() {
  const fullText = "Help me prep for a tough interview"
  const [typed, setTyped] = useState("")
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i += 1
      setTyped(fullText.slice(0, i))
      if (i >= fullText.length) clearInterval(id)
    }, 55)
    return () => clearInterval(id)
  }, [])
  const chips = ["Pitch a startup", "Stoic reflection", "Rehearse a toast"]
  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="rounded-2xl bg-background/80 border border-white/70 shadow-[inset_0_1px_0_oklch(1_0_0/0.6)] px-4 py-4">
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
          Topic
        </div>
        <div className="text-[15px] font-medium tracking-tight min-h-[22px] flex items-center">
          {typed}
          <span
            aria-hidden
            className="inline-block w-[2px] h-[16px] bg-foreground ml-0.5"
            style={{ animation: "onboard-cursor 1s steps(2) infinite" }}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {chips.map((c, i) => (
          <span
            key={c}
            className="text-[12px] tracking-tight text-foreground/70 px-3 py-1.5 rounded-full bg-card/70 border border-white/60"
            style={{
              animation: `float-up 0.5s ease-out ${0.5 + i * 0.15}s both`,
              opacity: 0,
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── Step 3 — orb cycling listening ↔ speaking with wave bars ─── */
function Step3Visual({ orbSize }: { orbSize: number }) {
  const [phase, setPhase] = useState<"listening" | "speaking">("listening")
  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => (p === "listening" ? "speaking" : "listening"))
    }, 2400)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="grid place-items-center gap-4">
      <VoiceOrb
        state={phase}
        size={orbSize}
        amplitude={phase === "speaking" ? 0.45 : 0.22}
      />
      <div
        className="flex items-end gap-1.5 h-7"
        aria-hidden
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-1.5 bg-foreground/70 rounded-full block h-full origin-center"
            style={{ animation: `wave-pulse 1s ease-in-out ${i * 0.1}s infinite` }}
          />
        ))}
      </div>
      <p
        key={phase}
        className="text-[13px] tracking-tight text-muted-foreground tabular-nums animate-float-up"
      >
        {phase === "listening" ? "You're speaking…" : "CogniFlip replies…"}
      </p>
    </div>
  )
}

/* ─── Step 4 — score ring sweep + animated metric bars ─── */
function Step4Visual() {
  const target = 87
  const [count, setCount] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const dur = 1200
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setCount(Math.round(eased * target))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const C = 226 // 2π·36 — circumference of the score ring
  const offset = C * (1 - target / 100)
  const metrics = [
    { k: "Clarity", v: 88 },
    { k: "Depth", v: 84 },
    { k: "Pacing", v: 91 },
    { k: "Charisma", v: 86 },
  ]
  return (
    <div className="grid place-items-center gap-4 w-full">
      <div className="relative grid place-items-center" style={{ width: 140, height: 140 }}>
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id="onb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.78 0.18 25)" />
              <stop offset="100%" stopColor="oklch(0.7 0.18 310)" />
            </linearGradient>
          </defs>
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="oklch(0.92 0.01 60)"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="url(#onb-grad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={
              {
                "--score-c": `${C}`,
                "--score-offset": `${offset}`,
                animation: "score-sweep 1.2s cubic-bezier(0.22, 1, 0.36, 1) both",
              } as React.CSSProperties
            }
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[36px] font-semibold tabular-nums leading-none">
              {count}
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
              Overall
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 w-full max-w-xs">
        {metrics.map((m, i) => (
          <div key={m.k} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                {m.k}
              </span>
              <span className="text-[12px] font-medium tabular-nums">{m.v}</span>
            </div>
            <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground rounded-full origin-left"
                style={{
                  width: `${m.v}%`,
                  animation: `score-bar 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${0.2 + i * 0.1}s both`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
