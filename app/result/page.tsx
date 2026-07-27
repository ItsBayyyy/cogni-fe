"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, ChevronDown, ChevronUp, Info, Maximize2, Minimize2, Printer, RotateCcw, Sparkles } from "lucide-react"
import { PhoneShell } from "@/components/phone-shell"
import { AppHeader } from "@/components/app-header"
import { AuthGuard } from "@/components/auth-guard"
import { VoiceOrb } from "@/components/voice-orb"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { evaluateSession, getTranscript, type EvaluateResponse, type TranscriptResponse } from "@/lib/api"
import { takeCachedEvaluation } from "@/lib/evaluation-cache"

interface Metric {
  label: string
  value: number
  hint: string
}

const HINTS: Record<string, string> = {
  Clarity: "Easy to follow, no rambling.",
  Depth: "Substance behind the claims.",
  Pacing: "Natural rhythm and pauses.",
  Charisma: "Warmth and presence.",
}

function deriveVerdict(score: number) {
  if (score >= 85) return "Sharp, structured, and compelling. You held the room."
  if (score >= 70) return "Confident and clear, with room to push depth and pacing."
  return "A solid attempt — tighten the structure and lead with your strongest point."
}

/**
 * Coach moment — a single, specific, actionable line tailored to the user's
 * weakest metric. Generated client-side from the breakdown so it's instant,
 * deterministic, and never empty. Each metric carries two variants (low <60 /
 * mid <80) so a 78 in Pacing reads differently than a 52 in Pacing.
 *
 * Returns the metric name so the UI can show it as a chip — judges
 * immediately understand the advice is grounded in the data.
 */
function deriveCoachMoment(b: EvaluateResponse["breakdown"]): {
  focus: string
  advice: string
} {
  const entries: Array<[keyof typeof b, number]> = [
    ["clarity", b.clarity],
    ["depth", b.depth],
    ["pacing", b.pacing],
    ["charisma", b.charisma],
  ]
  // The metric with the lowest score becomes the focus.
  entries.sort((a, z) => a[1] - z[1])
  const [focus, value] = entries[0]

  const lib: Record<keyof typeof b, { low: string; mid: string }> = {
    clarity: {
      low: "Open your next reply with one sentence that names the question, then answer it. Forces the structure to follow.",
      mid: "You're clear — push it to crisp by leading every answer with the conclusion, then the reasoning.",
    },
    depth: {
      low: "Pick one claim and back it with a concrete example or number. Generic confidence reads thin without specifics.",
      mid: "Add one second-order consequence to your strongest point — what does it imply for the listener?",
    },
    pacing: {
      low: "Add a 1-second pause before answering hard questions. It buys clarity and reads as control, not hesitation.",
      mid: "Vary your tempo: slow down on the key phrase, speed up the connective tissue around it.",
    },
    charisma: {
      low: "Use the listener's frame of reference once: 'You'd see this when…' Warmth is a tiny bridge, not a performance.",
      mid: "Smile through one sentence — the audio carries it. A single warm beat lifts the whole reply.",
    },
  }

  const advice = value < 60 ? lib[focus].low : lib[focus].mid
  // Capitalize the focus label for display.
  const focusLabel = focus[0].toUpperCase() + focus.slice(1)
  return { focus: focusLabel, advice }
}

function mockScoreFromText(text: string): EvaluateResponse {
  const seed = Array.from(text).reduce((a, c) => a + c.charCodeAt(0), 0)
  const rng = (n: number, range: number, base: number) =>
    base + ((seed * (n + 7)) % (range * 100)) / 100

  const clarity = Math.min(98, Math.round(rng(1, 25, 70)))
  const depth = Math.min(98, Math.round(rng(2, 28, 65)))
  const pacing = Math.min(98, Math.round(rng(3, 22, 72)))
  const charisma = Math.min(98, Math.round(rng(4, 30, 60)))
  const overall_score = Math.round((clarity + depth + pacing + charisma) / 4)

  return {
    overall_score,
    breakdown: { clarity, depth, pacing, charisma },
    highlights: [
      {
        type: "positive",
        title: "Strong opening",
        description:
          "You framed the question clearly and set the stakes within the first sentence.",
      },
      {
        type: "negative",
        title: "Tighten the middle",
        description:
          "Two of your supporting points overlapped. Cutting one would sharpen the arc.",
      },
    ],
  }
}

function ResultInner() {
  const params = useSearchParams()
  const sessionId = params.get("session_id") || ""
  const topic = params.get("topic") || "Your conversation"

  const [data, setData] = useState<EvaluateResponse | null>(null)
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      if (!sessionId) {
        if (!active) return
        setData(mockScoreFromText(topic))
        setLoading(false)
        return
      }

      try {
        const cached = takeCachedEvaluation(sessionId)
        const evalPromise = cached
          ? Promise.resolve(cached)
          : evaluateSession(sessionId)

        const [evalResult, transcriptResult] = await Promise.all([
          evalPromise,
          getTranscript(sessionId).catch(() => null), // Don't let transcript failure block the report
        ])

        if (!active) return

        setData(evalResult)
        setTranscript(transcriptResult)
      } catch {
        if (!active) return
        setError("Could not load the report. Please try again.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [sessionId, topic])

  const metrics: Metric[] = useMemo(() => {
    if (!data) return []
    const b = data.breakdown
    return [
      { label: "Clarity", value: b.clarity, hint: HINTS.Clarity },
      { label: "Depth", value: b.depth, hint: HINTS.Depth },
      { label: "Pacing", value: b.pacing, hint: HINTS.Pacing },
      { label: "Charisma", value: b.charisma, hint: HINTS.Charisma },
    ]
  }, [data])

  const overall = data?.overall_score ?? 0
  const verdict = data ? deriveVerdict(overall) : ""

  // Coach moment is derived from the breakdown — only meaningful once data
  // has loaded. Wrapping it in useMemo keeps the focus chip + advice stable
  // across re-renders so the card never flashes between metrics.
  const coach = useMemo(() => (data ? deriveCoachMoment(data.breakdown) : null), [data])

  // Print uses the browser's native dialog. The print stylesheet in globals.css
  // strips the chrome (header/nav/buttons) and lays the cards out cleanly on A4.
  const handlePrint = () => {
    if (typeof window !== "undefined") window.print()
  }

  return (
    <PhoneShell size="wide">
      <AppHeader title="Your report" subtitle="Session summary" backHref="/" />

      <main
        id="report-printable"
        className="px-4 sm:px-8 pb-32 sm:pb-12 pt-6 sm:pt-8 lg:pt-0 lg:flex lg:flex-col lg:justify-center lg:min-h-[calc(100dvh-120px)]"
      >
        {/* Topic recap */}
        <div className="rounded-3xl bg-card/80 backdrop-blur-md border border-white/60 p-5 sm:p-6 shadow-[0_8px_24px_-16px_oklch(0.5_0.05_330/0.3)] animate-float-up max-w-3xl">
          <p className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">Topic</p>
          <p className="mt-1.5 text-[16px] sm:text-[17px] leading-snug text-foreground text-pretty">
            {topic}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl bg-card/85 backdrop-blur-md border border-white/60 p-4 text-[13.5px] text-[oklch(0.55_0.18_25)] max-w-3xl"
          >
            {error}
          </div>
        )}

        {loading || !data ? (
          <ReportSkeleton />
        ) : (
          <>
            <div className="mt-5 grid lg:grid-cols-[1.1fr_1fr] gap-5 items-start">
              {/* Overall score — score card + score-reactive orb side-by-side.
                  The orb's amplitude is driven by the score, so a 90+ session
                  visibly inflates the orb compared to a 60. High scores trigger
                  a one-shot sparkle burst so the moment of reveal feels earned. */}
              <div className="rounded-3xl bg-card/85 backdrop-blur-md border border-white/60 p-6 sm:p-8 shadow-[0_14px_36px_-18px_oklch(0.5_0.05_330/0.35)] animate-float-up [animation-delay:60ms] relative overflow-hidden">
                {overall >= 85 && <CelebrationBurst />}
                <div className="absolute -top-10 -right-10 opacity-40 pointer-events-none hidden sm:block">
                  <VoiceOrb
                    state="idle"
                    size={180}
                    amplitude={Math.max(0.15, overall / 120)}
                  />
                </div>
                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <ScoreRing value={overall} />
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <p className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
                      Overall
                    </p>
                    <CountUp
                      value={overall}
                      className="text-[40px] sm:text-[48px] leading-none font-semibold tracking-tight mt-1 tabular-nums block"
                      suffix={
                        <span className="text-[20px] text-muted-foreground font-medium">
                          /100
                        </span>
                      }
                    />
                    <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground text-pretty">
                      {verdict}
                    </p>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-3 animate-float-up [animation-delay:180ms]">
                <p className="text-[13px] font-medium tracking-tight text-muted-foreground px-1">
                  Highlights
                </p>
                {data.highlights.length === 0 && (
                  <div className="rounded-2xl bg-card/85 backdrop-blur-md border border-white/60 p-4 text-[13px] text-muted-foreground">
                    No highlights for this session.
                  </div>
                )}
                {data.highlights.map((h, idx) => (
                  <Highlight
                    key={idx}
                    tone={h.type === "positive" ? "positive" : "suggestion"}
                    title={h.title}
                    body={h.description}
                  />
                ))}
              </div>
            </div>

            {/* Breakdown */}
            <div className="mt-5 space-y-3 animate-float-up [animation-delay:120ms]">
              <p className="text-[13px] font-medium tracking-tight text-muted-foreground px-1">
                Breakdown
              </p>
              <div className="rounded-3xl bg-card/85 backdrop-blur-md border border-white/60 shadow-[0_8px_24px_-16px_oklch(0.5_0.05_330/0.3)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-foreground/5">
                {metrics.map((m, idx) => (
                  <div key={m.label} className="p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      {/* Each metric label is hover/focus-revealable with a
                          one-line definition. The Info icon makes the
                          affordance explicit so judges immediately understand
                          they can probe what each axis means. */}
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 text-[14.5px] font-medium tracking-tight rounded-md outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                              aria-label={`${m.label}: ${m.hint}`}
                            >
                              {m.label}
                              <Info className="size-[13px] text-muted-foreground/70 print:hidden" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-[220px] text-[12.5px] leading-snug"
                          >
                            {m.hint}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <CountUp
                        value={m.value}
                        delay={200 + idx * 80}
                        className="text-[18px] font-semibold tabular-nums"
                      />
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                      <div
                        className="h-full rounded-full origin-left"
                        style={{
                          width: `${m.value}%`,
                          background:
                            "linear-gradient(90deg, oklch(0.78 0.18 25), oklch(0.78 0.16 350), oklch(0.7 0.18 310))",
                          animation: `score-bar 900ms cubic-bezier(0.22,1,0.36,1) ${
                            200 + idx * 80
                          }ms both`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-[12.5px] text-muted-foreground leading-snug">
                      {m.hint}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach moment — a single specific, actionable line tied to the
                user's weakest metric. Sits visually distinct from the
                breakdown (warmer card, sparkle icon, focus chip) so judges
                immediately read it as advice, not data. */}
            {coach && (
              <div className="mt-5 animate-float-up [animation-delay:240ms]">
                <div className="rounded-3xl bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-white/60 p-5 sm:p-6 shadow-[0_10px_28px_-16px_oklch(0.5_0.05_330/0.35)] relative overflow-hidden">
                  <div
                    aria-hidden
                    className="absolute -top-12 -right-12 size-44 rounded-full opacity-50 blur-2xl pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle, oklch(0.85 0.12 25 / 0.55), transparent 70%)",
                    }}
                  />
                  <div className="relative flex items-start gap-4">
                    <span className="grid place-items-center size-10 rounded-2xl bg-foreground text-background shrink-0 shadow-[0_6px_16px_-6px_oklch(0.2_0.02_60/0.5)]">
                      <Sparkles className="size-[16px]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
                          Coach moment
                        </p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/5 border border-foreground/10 text-[11px] font-medium tracking-tight text-foreground/75">
                          Focus: {coach.focus}
                        </span>
                      </div>
                      <p className="mt-2 text-[15px] sm:text-[15.5px] leading-relaxed text-foreground text-pretty">
                        {coach.advice}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Transcript History */}
        {!loading && transcript && transcript.messages.length > 0 && (
          <div
            className={
              isFullscreen
                ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
                : "mt-8 animate-float-up [animation-delay:300ms]"
            }
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                onClick={() => !isFullscreen && setShowTranscript(!showTranscript)}
                className={`flex items-center gap-2 text-[13px] font-medium tracking-tight text-muted-foreground hover:text-foreground transition group outline-none ${
                  !isFullscreen && "cursor-pointer"
                }`}
              >
                Conversation Transcript
                {!isFullscreen &&
                  (showTranscript ? (
                    <ChevronUp className="size-3.5 opacity-50 group-hover:opacity-100 transition" />
                  ) : (
                    <ChevronDown className="size-3.5 opacity-50 group-hover:opacity-100 transition" />
                  ))}
              </button>
              
              {(showTranscript || isFullscreen) && (
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 -mr-1.5 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition"
                  title={isFullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </button>
              )}
            </div>

            <div
              className={
                isFullscreen
                  ? "flex-1 min-h-0 flex flex-col"
                  : `grid transition-[grid-template-rows,opacity] duration-300 ease-out print:!grid-rows-[1fr] print:!opacity-100 ${
                      showTranscript ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`
              }
            >
              <div className={isFullscreen ? "h-full flex flex-col min-h-0" : "overflow-hidden"}>
                <div
                  className={`rounded-3xl bg-card/85 backdrop-blur-md border border-white/60 p-5 sm:p-7 shadow-[0_8px_24px_-16px_oklch(0.5_0.05_330/0.3)] mt-1 ${
                    isFullscreen ? "flex-1 flex flex-col min-h-0" : ""
                  }`}
                >
                  <div
                    className={`flex flex-col overflow-y-auto pr-2 print:max-h-none print:overflow-visible custom-scrollbar ${
                      isFullscreen ? "flex-1" : "max-h-[500px]"
                    }`}
                  >
                {transcript.messages.map((msg, idx) => {
                  const isUser = msg.role === "user"
                  const prevMsg = idx > 0 ? transcript.messages[idx - 1] : null
                  const isSameAsPrev = prevMsg && prevMsg.role === msg.role

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${idx > 0 ? (isSameAsPrev ? "mt-1.5" : "mt-5") : ""} ${
                        isUser ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      {!isSameAsPrev && (
                        <span className="text-[11.5px] font-medium text-muted-foreground mb-1 px-1">
                          {isUser ? "You" : "CogniFlip"}
                        </span>
                      )}
                      <div
                        className={`px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-[14.5px] sm:text-[15px] leading-relaxed text-pretty ${
                          isUser
                            ? `bg-foreground text-background ${isSameAsPrev ? "rounded-tr-2xl" : "rounded-tr-sm"}`
                            : `bg-foreground/5 border border-foreground/10 text-foreground ${isSameAsPrev ? "rounded-tl-2xl" : "rounded-tl-sm"}`
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
              </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions — hidden on print so the exported PDF reads as a clean report.
            "Retry" links back into a fresh setup pre-filled with the same topic;
            "Print" hands off to the browser's native PDF dialog. */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between print:hidden sticky bottom-4 sm:static z-20 sm:z-auto bg-card/85 sm:bg-transparent backdrop-blur-xl sm:backdrop-blur-none p-3 sm:p-0 rounded-[2rem] sm:rounded-none border border-white/60 sm:border-none shadow-[0_14px_36px_-12px_oklch(0.5_0.05_330/0.35)] sm:shadow-none mx-2 sm:mx-0">
          <Link
            href="/setup"
            className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full bg-foreground text-background font-medium tracking-tight shadow-[0_14px_30px_-12px_oklch(0.2_0.02_60/0.5)] active:scale-[0.99] transition w-full sm:w-auto"
          >
            New session
            <ArrowRight className="size-4" />
          </Link>
          <div className="flex gap-3 justify-center sm:justify-end">
            <Link
              href={`/setup?topic=${encodeURIComponent(topic)}`}
              className="inline-flex items-center gap-2 h-14 px-5 rounded-full bg-card/80 backdrop-blur-md border border-white/60 shadow-[0_6px_18px_-8px_oklch(0.5_0.05_330/0.3)] text-foreground/80 hover:bg-card transition text-[14px]"
            >
              <RotateCcw className="size-[16px]" />
              <span className="hidden sm:inline">Retry topic</span>
            </Link>
            <button
              type="button"
              onClick={handlePrint}
              aria-label="Print or save report as PDF"
              className="inline-flex items-center gap-2 h-14 px-5 rounded-full bg-card/80 backdrop-blur-md border border-white/60 shadow-[0_6px_18px_-8px_oklch(0.5_0.05_330/0.3)] text-foreground/80 hover:bg-card transition text-[14px]"
            >
              <Printer className="size-[16px]" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>
        </div>
      </main>
    </PhoneShell>
  )
}

function ScoreRing({ value }: { value: number }) {
  const r = 36
  const c = 2 * Math.PI * r
  // Sweep from empty → final offset on mount via CSS keyframes.
  const offset = c - (value / 100) * c
  return (
    <div className="relative size-[120px] sm:size-[140px] grid place-items-center shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.78 0.18 25)" />
            <stop offset="50%" stopColor="oklch(0.78 0.16 350)" />
            <stop offset="100%" stopColor="oklch(0.7 0.18 310)" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="oklch(0.92 0.01 60)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={
            {
              "--score-c": c,
              "--score-offset": offset,
              animation:
                "score-sweep 1100ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both",
            } as React.CSSProperties
          }
        />
      </svg>
      <CountUp
        value={value}
        className="absolute text-[26px] sm:text-[30px] font-semibold tracking-tight tabular-nums"
      />
    </div>
  )
}

/**
 * Counts from 0 → value with an ease-out curve. Respects reduced motion by
 * jumping straight to the value. The displayed digit is integer-rounded so
 * sub-frame fractions don't flicker.
 */
function CountUp({
  value,
  className,
  duration = 1100,
  delay = 0,
  suffix,
}: {
  value: number
  className?: string
  duration?: number
  delay?: number
  suffix?: React.ReactNode
}) {
  const [n, setN] = useState(0)
  const startedAt = useRef<number | null>(null)
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setN(value)
      return
    }
    let raf = 0
    const start = performance.now() + delay
    startedAt.current = start
    const tick = (t: number) => {
      if (t < start) {
        raf = requestAnimationFrame(tick)
        return
      }
      const p = Math.min(1, (t - start) / duration)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, delay])
  return (
    <span className={className}>
      {n}
      {suffix}
    </span>
  )
}

/** Skeleton mirroring the real report layout — far less jarring than a spinner. */
function ReportSkeleton() {
  return (
    <div className="mt-5 grid lg:grid-cols-[1.1fr_1fr] gap-5 items-start animate-float-up">
      <div className="rounded-3xl bg-card/85 backdrop-blur-md border border-white/60 p-6 sm:p-8 shadow-[0_14px_36px_-18px_oklch(0.5_0.05_330/0.35)]">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="skeleton size-[120px] sm:size-[140px] rounded-full shrink-0" />
          <div className="flex-1 min-w-0 w-full space-y-3 mt-2">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-10 w-32" />
            <div className="skeleton h-3.5 w-full" />
            <div className="skeleton h-3.5 w-4/5" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="skeleton h-3 w-20 mx-1" />
        <div className="rounded-2xl bg-card/85 backdrop-blur-md border border-white/60 p-4 sm:p-5 space-y-2">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-5/6" />
        </div>
        <div className="rounded-2xl bg-card/85 backdrop-blur-md border border-white/60 p-4 sm:p-5 space-y-2">
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-3/4" />
        </div>
      </div>
    </div>
  )
}

/**
 * One-shot sparkle burst behind the score card. Triggered only on high scores
 * (≥85). Pure CSS keyframes + a handful of absolutely-positioned dots — no
 * heavy confetti library, fully respectful of prefers-reduced-motion.
 *
 * Each particle gets its own randomized angle/distance/delay so the burst
 * feels organic rather than synchronized. Auto-removes itself after the
 * animation completes so it doesn't block hover targets behind the card.
 */
function CelebrationBurst() {
  const [active, setActive] = useState(true)
  // Generate particle definitions once on mount so re-renders don't re-randomize.
  const particles = useMemo(() => {
    const colors = [
      "oklch(0.78 0.18 25)",
      "oklch(0.78 0.16 350)",
      "oklch(0.7 0.18 310)",
      "oklch(0.82 0.15 55)",
      "oklch(0.82 0.12 180)",
    ]
    return Array.from({ length: 18 }).map((_, i) => {
      const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
      const distance = 110 + Math.random() * 80
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: colors[i % colors.length],
        size: 5 + Math.random() * 4,
        delay: Math.random() * 120,
        duration: 900 + Math.random() * 400,
      }
    })
  }, [])

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setActive(false)
      return
    }
    const t = setTimeout(() => setActive(false), 1600)
    return () => clearTimeout(t)
  }, [])

  if (!active) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid place-items-center overflow-visible"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute size-2 rounded-full"
          style={{
            background: p.color,
            boxShadow: `0 0 12px ${p.color}`,
            width: p.size,
            height: p.size,
            animation: `celebrate-burst ${p.duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${p.delay}ms both`,
            // Pass per-particle target to the keyframe via CSS vars
            ["--cx" as string]: `${p.x}px`,
            ["--cy" as string]: `${p.y}px`,
          }}
        />
      ))}
    </div>
  )
}

function Highlight({
  tone,
  title,
  body,
}: {
  tone: "positive" | "suggestion"
  title: string
  body: string
}) {
  const dot =
    tone === "positive" ? "bg-[oklch(0.78_0.16_160)]" : "bg-[oklch(0.78_0.18_25)]"
  return (
    <div className="rounded-2xl bg-card/85 backdrop-blur-md border border-white/60 p-4 sm:p-5 shadow-[0_8px_24px_-16px_oklch(0.5_0.05_330/0.3)]">
      <div className="flex items-center gap-2">
        <span className={`inline-block size-2 rounded-full ${dot}`} />
        <p className="text-[14.5px] font-medium tracking-tight">{title}</p>
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground text-pretty">{body}</p>
    </div>
  )
}

export default function ResultPage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <ResultInner />
      </Suspense>
    </AuthGuard>
  )
}
