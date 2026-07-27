"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  HeartHandshake,
  GraduationCap,
  Brain,
  Laugh,
  Megaphone,
} from "lucide-react"
import { PhoneShell } from "@/components/phone-shell"
import { AppHeader } from "@/components/app-header"
import { AuthGuard } from "@/components/auth-guard"
import { startSession } from "@/lib/api"
import { cn } from "@/lib/utils"

const PERSONAS = [
  {
    id: "friendly",
    name: "The Friend",
    blurb: "Warm, encouraging, easy to open up to.",
    Icon: HeartHandshake,
  },
  {
    id: "strict",
    name: "The Strict",
    blurb: "Demanding, no-nonsense, raises the bar.",
    Icon: GraduationCap,
  },
  {
    id: "socratic",
    name: "The Socratic",
    blurb: "Probing, curious, answers with questions.",
    Icon: Brain,
  },
  {
    id: "comedian",
    name: "The Comedian",
    blurb: "Cracks jokes, laughs at their own punchlines, keeps it light.",
    Icon: Laugh,
  },
  {
    id: "nain",
    name: "The NAIN",
    blurb: "Refuses dramatically. Will absolutely scream NAINNNNN at you.",
    Icon: Megaphone,
  },
] as const

type PersonaId = (typeof PERSONAS)[number]["id"]

function SetupInner() {
  const router = useRouter()
  // The result page links here as `/setup?topic=...` for "Retry topic" so the
  // user can re-attempt the same prompt under a different persona without
  // retyping. We read it once on mount as the initial state — the input is
  // free to edit afterwards.
  const searchParams = useSearchParams()
  const initialTopic = (searchParams.get("topic") || "").slice(0, 300)
  const [topic, setTopic] = useState(initialTopic)
  const [persona, setPersona] = useState<PersonaId>("friendly")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canStart = topic.trim().length > 2 && !submitting

  const handleStart = async () => {
    if (!canStart) return
    setError(null)
    setSubmitting(true)
    try {
      const cleanTopic = topic.trim()
      const session = await startSession(cleanTopic, persona)
      const params = new URLSearchParams({
        session_id: session.session_id,
        topic: cleanTopic,
        persona,
      })
      router.push(`/session?${params.toString()}`)
    } catch {
      setError("Could not start the session. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <PhoneShell size="wide">
      <AppHeader title="New session" subtitle="Set the stage" backHref="/" />

      <main className="px-4 sm:px-8 pb-32 sm:pb-12 pt-6 sm:pt-8 lg:pt-0 lg:flex lg:items-center lg:min-h-[calc(100dvh-120px)]">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 items-start w-full">
          {/* Topic */}
          <section className="space-y-4 animate-float-up">
            <div className="space-y-1.5">
              <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-balance">
                What do you want to talk about?
              </h2>
              <p className="text-[14px] text-muted-foreground leading-relaxed text-pretty">
                Drop in a question, a topic, or paste an entire prompt. CogniFlip will listen and
                respond in your chosen voice.
              </p>
            </div>

            <div className="relative">
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={300}
                placeholder="e.g. Explain consciousness from a biological perspective…"
                rows={6}
                className="w-full resize-none rounded-3xl bg-card/80 backdrop-blur-md border border-white/60 px-5 py-4 text-[16px] leading-relaxed tracking-tight text-foreground placeholder:text-muted-foreground/70 shadow-[0_8px_24px_-16px_oklch(0.5_0.05_330/0.3)] focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-white/80"
              />
              <div className="absolute bottom-3 right-4 text-[11.5px] text-muted-foreground tabular-nums">
                {topic.length} / 300
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                "Explain consciousness biologically",
                "Pitch my SaaS in 30 seconds",
                "Help me prep for a tough interview",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTopic(s)}
                  className="text-[12.5px] tracking-tight text-foreground/70 px-3 py-1.5 rounded-full bg-card/70 backdrop-blur-md border border-white/60 hover:bg-card transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* Persona */}
          <section className="space-y-4 animate-float-up [animation-delay:80ms]">
            <div className="space-y-1.5">
              <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-balance">
                Choose a persona
              </h2>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Each persona shapes tone, depth, and pacing.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {PERSONAS.map(({ id, name, blurb, Icon }) => {
                const selected = persona === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPersona(id)}
                    aria-pressed={selected}
                    className={cn(
                      "group text-left rounded-2xl p-4 sm:p-5 border transition relative overflow-hidden",
                      "bg-card/80 backdrop-blur-md shadow-[0_8px_24px_-16px_oklch(0.5_0.05_330/0.3)]",
                      selected
                        ? "border-foreground/80 ring-2 ring-foreground/10"
                        : "border-white/60 hover:border-foreground/20",
                    )}
                  >
                    <div
                      className={cn(
                        "grid place-items-center size-9 rounded-full mb-3 transition",
                        selected
                          ? "bg-foreground text-background"
                          : "bg-foreground/5 text-foreground/80",
                      )}
                    >
                      <Icon className="size-[18px]" />
                    </div>
                    <p className="text-[15px] font-semibold tracking-tight">{name}</p>
                    <p className="text-[12.5px] text-muted-foreground leading-snug mt-1 text-pretty">
                      {blurb}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="sticky bottom-6 sm:static z-20 sm:z-auto bg-card/85 sm:bg-transparent backdrop-blur-xl sm:backdrop-blur-none p-3 sm:p-0 rounded-[2rem] sm:rounded-none border border-white/60 sm:border-none shadow-[0_14px_36px_-12px_oklch(0.5_0.05_330/0.35)] sm:shadow-none -mx-2 sm:mx-0 mt-4 sm:mt-0 flex flex-col gap-3">
              {error && (
                <p
                  role="alert"
                  className="text-[13px] text-[oklch(0.55_0.18_25)] tracking-tight px-3 sm:px-1"
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleStart}
                disabled={!canStart}
                className={cn(
                  "w-full h-14 rounded-full font-medium tracking-tight transition flex items-center justify-center gap-2",
                  "shadow-[0_14px_30px_-12px_oklch(0.2_0.02_60/0.5)]",
                  canStart
                    ? "bg-foreground text-background active:scale-[0.99]"
                    : "bg-foreground/30 text-background/80 cursor-not-allowed",
                )}
              >
                {submitting ? (
                  <>
                    <span
                      className="size-4 rounded-full border-2 border-background/30 border-t-background animate-spin"
                      aria-hidden
                    />
                    Starting session…
                  </>
                ) : (
                  <>
                    Start listening
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </main>
    </PhoneShell>
  )
}

export default function SetupPage() {
  return (
    <AuthGuard>
      <SetupInner />
    </AuthGuard>
  )
}
