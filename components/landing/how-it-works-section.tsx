import { UserCog, Mic, ScrollText } from "lucide-react"

const STEPS = [
  {
    n: "01",
    icon: UserCog,
    title: "Pick a persona",
    desc: "Choose the voice you need — interviewer, coach, debate partner, language tutor.",
  },
  {
    n: "02",
    icon: Mic,
    title: "Have the conversation",
    desc: "Press to talk. CogniFlip listens, thinks, and responds in real time, just like a person would.",
  },
  {
    n: "03",
    icon: ScrollText,
    title: "Read your report",
    desc: "Detailed scoring on tone, clarity, structure and substance — with what to try next time.",
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="px-4 sm:px-8 py-20 sm:py-28 max-w-6xl mx-auto"
    >
      <div className="max-w-2xl mb-14 sm:mb-20">
        <span className="inline-block text-[12px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
          How it works
        </span>
        <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-tight text-balance">
          Three steps. One sharper you.
        </h2>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
        {/* Connecting line on desktop */}
        <div
          aria-hidden
          className="hidden md:block absolute left-[16%] right-[16%] top-[44px] h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.7 0.18 310 / 0.35), oklch(0.78 0.16 350 / 0.35), transparent)",
          }}
        />

        {STEPS.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.n}
              className="relative rounded-3xl bg-card/70 backdrop-blur-md border border-white/60 p-7 sm:p-8 shadow-[0_8px_24px_-16px_oklch(0.5_0.05_330/0.3)]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="grid place-items-center size-12 rounded-2xl bg-foreground text-background shadow-[0_8px_18px_-8px_oklch(0.2_0.02_60/0.5)]">
                  <Icon className="size-5" strokeWidth={1.7} />
                </div>
                <span className="text-[13px] font-mono tracking-[0.1em] text-muted-foreground">
                  {s.n}
                </span>
              </div>
              <h3 className="text-[19px] font-semibold tracking-tight mb-2">
                {s.title}
              </h3>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
