import { Mic2, Gauge, Users2, ShieldCheck, Globe2, Sparkles } from "lucide-react"

const FEATURES = [
  {
    icon: Mic2,
    title: "Real-time conversation",
    desc: "Sub-200ms voice loop. Natural turn-taking, no walkie-talkie feel.",
    accent: "oklch(0.78 0.18 25 / 0.18)", // coral
  },
  {
    icon: Gauge,
    title: "Honest scoring",
    desc: "Tone, clarity, structure, substance — graded with reasoning you can act on.",
    accent: "oklch(0.78 0.16 350 / 0.18)", // pink
  },
  {
    icon: Users2,
    title: "5 personas",
    desc: "Interviewer, coach, therapist, tutor — pick a partner that matches your goal.",
    accent: "oklch(0.7 0.18 310 / 0.18)", // lavender
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    desc: "End-to-end encrypted. Your sessions are never used to train models.",
    accent: "oklch(0.82 0.15 55 / 0.18)", // peach
  },
  {
    icon: Globe2,
    title: "Speaks your language",
    desc: "Fluent in 30+ languages with localised idioms and accent handling.",
    accent: "oklch(0.75 0.18 280 / 0.18)", // violet
  },
  {
    icon: Sparkles,
    title: "Coaching memory",
    desc: "Tracks your growth across sessions and surfaces patterns you missed.",
    accent: "oklch(0.78 0.18 25 / 0.18)",
  },
]

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="px-4 sm:px-8 py-20 sm:py-28 max-w-6xl mx-auto"
    >
      <div className="max-w-2xl mb-12 sm:mb-16">
        <span className="inline-block text-[12px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
          Capabilities
        </span>
        <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-tight text-balance">
          Built for conversations that matter.
        </h2>
        <p className="mt-4 text-[15px] sm:text-[17px] leading-relaxed text-muted-foreground text-pretty">
        CogniFlip is more than a voice toy. It&apos;s a deliberate practice partner
          designed around the way human dialogue actually works.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {FEATURES.map((f) => {
          const Icon = f.icon
          return (
            <div
              key={f.title}
              className="group relative rounded-3xl bg-card/70 backdrop-blur-md border border-white/60 p-6 sm:p-7 hover:bg-card transition shadow-[0_8px_24px_-16px_oklch(0.5_0.05_330/0.3)]"
            >
              <div
                className="grid place-items-center size-11 rounded-2xl mb-5 transition group-hover:scale-105"
                style={{ background: f.accent }}
              >
                <Icon className="size-5 text-foreground/80" strokeWidth={1.7} />
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight mb-2">
                {f.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
