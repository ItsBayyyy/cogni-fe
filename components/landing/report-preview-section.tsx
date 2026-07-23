import Link from "next/link"
import { ArrowRight, TrendingUp } from "lucide-react"

const METRICS = [
  { label: "Tone", value: 92 },
  { label: "Clarity", value: 88 },
  { label: "Structure", value: 81 },
  { label: "Substance", value: 86 },
]

export function ReportPreviewSection() {
  return (
    <section className="px-4 sm:px-8 py-20 sm:py-28 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
        {/* Copy */}
        <div className="max-w-xl">
          <span className="inline-block text-[12px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
            Your report
          </span>
          <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-tight text-balance">
            Every session, a clear next step.
          </h2>
          <p className="mt-5 text-[15.5px] sm:text-[17px] leading-relaxed text-muted-foreground text-pretty">
          CogniFlip doesn&apos;t just hand you a number. You get a breakdown of
            what worked, what didn&apos;t, and what to focus on next time —
            written in language that actually helps.
          </p>

          <Link
            href="/result?topic=Sample%20conversation"
            className="mt-7 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-foreground text-background font-medium tracking-tight shadow-[0_14px_30px_-12px_oklch(0.2_0.02_60/0.5)] active:scale-[0.99] transition"
          >
            See a full sample report
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Mock report card */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-8 -z-10 rounded-[2rem] blur-3xl opacity-70"
            style={{
              background:
                "radial-gradient(60% 60% at 30% 30%, oklch(0.85 0.14 350 / 0.5), transparent), radial-gradient(60% 60% at 70% 80%, oklch(0.78 0.16 310 / 0.45), transparent)",
            }}
          />

          <div className="rounded-3xl bg-card/85 backdrop-blur-xl border border-white/70 p-6 sm:p-8 shadow-[0_30px_60px_-24px_oklch(0.4_0.08_330/0.35)]">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                  Session report
                </p>
                <h3 className="text-[18px] font-semibold tracking-tight">
                  Mock product interview
                </h3>
                <p className="text-[12.5px] text-muted-foreground mt-1">
                  18 minutes · Interviewer persona
                </p>
              </div>
              <div className="text-right">
                <div className="text-[40px] font-semibold tracking-tight leading-none">
                  87
                </div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                  Overall
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {METRICS.map((m, i) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] text-foreground/80 tracking-tight">
                      {m.label}
                    </span>
                    <span className="text-[13px] font-medium tabular-nums">
                      {m.value}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${m.value}%`,
                        background:
                          i % 2 === 0
                            ? "linear-gradient(90deg, oklch(0.78 0.18 25), oklch(0.78 0.16 350))"
                            : "linear-gradient(90deg, oklch(0.78 0.16 350), oklch(0.7 0.18 310))",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-foreground/5 flex items-center gap-3">
              <div
                className="grid place-items-center size-9 rounded-xl"
                style={{ background: "oklch(0.78 0.16 350 / 0.18)" }}
              >
                <TrendingUp className="size-4 text-foreground/80" strokeWidth={2} />
              </div>
              <p className="text-[13px] text-foreground/80 leading-snug">
                <span className="font-medium">+9 points</span>
                <span className="text-muted-foreground"> from your last session</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
