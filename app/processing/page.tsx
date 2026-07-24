"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PhoneShell } from "@/components/phone-shell"
import { AppHeader } from "@/components/app-header"
import { VoiceOrb } from "@/components/voice-orb"
import { AuthGuard } from "@/components/auth-guard"
import { evaluateSession } from "@/lib/api"

const STEPS = [
  "Transcribing your conversation",
  "Analyzing tone and clarity",
  "Scoring substance and structure",
  "Composing your report",
]

function ProcessingInner() {
  const router = useRouter()
  const params = useSearchParams()
  const sessionId = params.get("session_id") || ""
  const [step, setStep] = useState(0)
  const [orbSize, setOrbSize] = useState(260)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const update = () => {
      const w = window.innerWidth
      if (w >= 1280) setOrbSize(380)
      else if (w >= 1024) setOrbSize(320)
      else setOrbSize(260)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [mounted])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    if (!sessionId) {
      router.replace("/setup")
      return
    }

    let stepIdx = 0
    const stepTimer = window.setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, STEPS.length - 1)
      setStep(stepIdx)
    }, 900)

    const minDelay = new Promise<void>((r) => window.setTimeout(r, 1800))

    Promise.all([evaluateSession(sessionId), minDelay])
      .then(([result]) => {
        window.clearInterval(stepTimer)
        setStep(STEPS.length - 1)
        try {
          window.sessionStorage.setItem(
            `cogniflip_eval_${sessionId}`,
            JSON.stringify(result),
          )
        } catch {
          /* ignore */
        }
        const qs = new URLSearchParams(params.toString())
        window.setTimeout(() => router.push(`/result?${qs.toString()}`), 500)
      })
      .catch((e: unknown) => {
        window.clearInterval(stepTimer)
        const msg = e instanceof Error ? e.message : "Could not evaluate this session."
        setError(msg)
      })

    return () => window.clearInterval(stepTimer)
  }, [sessionId, router, params])

  const isInsufficient = error?.toLowerCase().includes("insufficient")

  return (
    <PhoneShell size="wide">
      <AppHeader showBrand title="Processing" subtitle={isInsufficient ? "" : "Please wait"} />

      <main className="px-4 sm:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100dvh-160px)]">
          <div className="grid place-items-center order-1">
            <VoiceOrb state={isInsufficient ? "idle" : "speaking"} size={orbSize} />
          </div>

          {isInsufficient ? (
            /* ── Friendly "not enough conversation" card ── */
            <div className="space-y-6 animate-float-up order-2 max-w-md mx-auto lg:mx-0 w-full">
              <div className="text-center lg:text-left space-y-3">
                <div className="inline-flex items-center justify-center size-12 rounded-full bg-foreground/5 border border-foreground/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                </div>
                <h2 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-balance">
                  Let&apos;s chat a little more
                </h2>
                <p className="text-[14.5px] text-muted-foreground leading-relaxed text-pretty">
                  CogniFlip needs at least a few exchanges to build a meaningful report.
                  Go back and have a short conversation — even 2–3 turns is enough!
                </p>
              </div>

              <button
                onClick={() => router.push("/setup")}
                className="w-full rounded-2xl bg-foreground text-background py-3.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
              >
                Start a new session
              </button>
            </div>
          ) : (
            /* ── Normal evaluation progress ── */
            <div className="space-y-8 animate-float-up order-2 max-w-md mx-auto lg:mx-0 w-full">
              <div className="text-center lg:text-left space-y-2">
                <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                  Evaluating
                </p>
                <h2 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-balance">
                  Building your report
                </h2>
                <p className="text-[14.5px] text-muted-foreground leading-relaxed text-pretty">
                CogniFlip is reviewing the recording across four dimensions. This usually takes a
                  few seconds.
                </p>
              </div>

              <ol className="space-y-3">
                {STEPS.map((label, i) => {
                  const done = i < step
                  const active = i === step && !error
                  return (
                    <li
                      key={label}
                      className="flex items-center gap-3 text-[14.5px] tracking-tight"
                      aria-current={active ? "step" : undefined}
                    >
                      <span
                        className={
                          "grid place-items-center size-6 rounded-full text-[11px] font-medium border transition " +
                          (done
                            ? "bg-foreground text-background border-foreground"
                            : active
                              ? "bg-foreground/10 text-foreground border-foreground/40"
                              : "bg-card/70 text-muted-foreground border-white/60")
                        }
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span
                        className={
                          done
                            ? "text-foreground/70"
                            : active
                              ? "text-foreground"
                              : "text-muted-foreground"
                        }
                      >
                        {label}
                        {active && <span className="ml-1 animate-pulse">…</span>}
                      </span>
                    </li>
                  )
                })}
              </ol>

              {error && (
                <div className="space-y-3">
                  <div
                    role="alert"
                    className="rounded-2xl bg-card/85 backdrop-blur-md border border-white/60 p-4 text-[13.5px] text-muted-foreground"
                  >
                    Something went wrong. Please try again.
                  </div>
                  <button
                    onClick={() => router.push("/setup")}
                    className="w-full rounded-2xl bg-foreground text-background py-3 text-[14px] font-medium hover:opacity-90 transition"
                  >
                    Start a new session
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </PhoneShell>
  )
}

export default function ProcessingPage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <ProcessingInner />
      </Suspense>
    </AuthGuard>
  )
}
