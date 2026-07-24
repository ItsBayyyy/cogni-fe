"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { ArrowRight, Loader2, Sparkles } from "lucide-react"
import { PhoneShell } from "@/components/phone-shell"
import { AppHeader } from "@/components/app-header"
import { VoiceOrb } from "@/components/voice-orb"
import { useAuth } from "@/hooks/use-auth"

/**
 * Below-fold landing sections are heavy (lots of imagery, gradients, and
 * markup). Code-split them so the hero + orb paint immediately and the rest
 * streams in as the user scrolls. Each chunk gets a lightweight skeleton so
 * we don't get layout-shift jank.
 */
const SectionFallback = ({ minH = "min-h-[320px]" }: { minH?: string }) => (
  <div className={`${minH} w-full grid place-items-center`}>
    <span
      className="size-7 rounded-full border-2 border-foreground/10 border-t-foreground/40 animate-spin"
      aria-hidden
    />
  </div>
)

const FeaturesSection = dynamic(
  () => import("@/components/landing/features-section").then((m) => m.FeaturesSection),
  { loading: () => <SectionFallback /> },
)
const HowItWorksSection = dynamic(
  () =>
    import("@/components/landing/how-it-works-section").then((m) => m.HowItWorksSection),
  { loading: () => <SectionFallback /> },
)
const PersonasSection = dynamic(
  () => import("@/components/landing/personas-section").then((m) => m.PersonasSection),
  { loading: () => <SectionFallback /> },
)
const ReportPreviewSection = dynamic(
  () =>
    import("@/components/landing/report-preview-section").then(
      (m) => m.ReportPreviewSection,
    ),
  { loading: () => <SectionFallback /> },
)
const TestimonialsSection = dynamic(
  () =>
    import("@/components/landing/testimonials-section").then((m) => m.TestimonialsSection),
  { loading: () => <SectionFallback /> },
)
const CtaFooterSection = dynamic(
  () => import("@/components/landing/cta-footer-section").then((m) => m.CtaFooterSection),
  { loading: () => <SectionFallback minH="min-h-[420px]" /> },
)

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const startHref = user ? "/setup" : "/login?next=%2Fsetup"
  const sampleHref = "/result?topic=Sample%20conversation"
  const [orbSize, setOrbSize] = useState(280)
  const [mounted, setMounted] = useState(false)
  const [isStarting, startStartTransition] = useTransition()
  const [isSampling, startSampleTransition] = useTransition()

  const goStart = () =>
    startStartTransition(() => {
      router.push(startHref)
    })
  const goSample = () =>
    startSampleTransition(() => {
      router.push(sampleHref)
    })

  // Mark as mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const update = () => {
      const w = window.innerWidth
      if (w >= 1280) setOrbSize(440)
      else if (w >= 1024) setOrbSize(380)
      else if (w >= 640) setOrbSize(340)
      else setOrbSize(260)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [mounted])

  return (
    <PhoneShell size="wide">
      <AppHeader />

      {/* Hero */}
      <section className="px-4 sm:px-8 pb-12 sm:pb-20">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center min-h-[calc(100dvh-160px)]">
          {/* Hero copy */}
          <div className="order-2 lg:order-1 space-y-7 max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/70 backdrop-blur-md border border-white/60 text-[12px] tracking-tight text-foreground/70">
              <Sparkles className="size-3.5" />
              AI voice assistant
            </div>

            <h1 className="text-[40px] sm:text-[56px] lg:text-[64px] xl:text-[72px] leading-[1.02] font-semibold tracking-tight text-balance">
              Your voice, in <br className="hidden sm:block" />
              perfect conversation.
            </h1>

            <p className="text-[16px] sm:text-[17px] lg:text-[18px] leading-relaxed text-muted-foreground text-pretty max-w-md mx-auto lg:mx-0">
              A premium AI voice assistant that listens, thinks, and replies in real time —
              then scores every session so your next take is sharper than the last.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <button
                type="button"
                onClick={goStart}
                disabled={isStarting}
                aria-busy={isStarting}
                className="group inline-flex items-center justify-center gap-2 h-13 sm:h-14 px-7 rounded-full bg-foreground text-background font-medium tracking-tight shadow-[0_14px_30px_-12px_oklch(0.2_0.02_60/0.5)] active:scale-[0.99] transition w-full sm:w-auto py-3.5 disabled:opacity-80 disabled:cursor-progress"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading…
                  </>
                ) : (
                  <>
                    {user ? "Start a session" : "Sign in to start"}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={goSample}
                disabled={isSampling}
                aria-busy={isSampling}
                className="inline-flex items-center justify-center gap-2 h-13 sm:h-14 px-6 rounded-full bg-card/80 backdrop-blur-md border border-white/60 text-foreground/80 font-medium tracking-tight hover:bg-card transition w-full sm:w-auto py-3.5 disabled:opacity-80 disabled:cursor-progress"
              >
                {isSampling ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading…
                  </>
                ) : (
                  "See a sample report"
                )}
              </button>
            </div>

            {/* Hero stats — on mobile we drop to 3 cols of pill-style chips
                rather than a tight number grid. The typography stays legible
                at small widths and the row reads as a compact spec strip. */}
            <dl className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 pt-4">
              {[
                { k: "<200ms", v: "Latency" },
                { k: "5", v: "Personas" },
                { k: "100%", v: "Private" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-md border border-white/60"
                >
                  <dt className="text-[14px] sm:text-[15px] font-semibold tracking-tight tabular-nums">
                    {s.k}
                  </dt>
                  <dd className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Orb */}
          <div className="order-1 lg:order-2 grid place-items-center">
            <div className="relative">
              <VoiceOrb state="idle" size={orbSize} />
            </div>
          </div>
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <PersonasSection />
      <ReportPreviewSection />
      <TestimonialsSection />
      <CtaFooterSection />
    </PhoneShell>
  )
}