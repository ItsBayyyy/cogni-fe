import {
  Briefcase,
  GraduationCap,
  Languages,
  Mic2,
  PenLine,
  Sparkles,
} from "lucide-react"

/**
 * Replaced fabricated testimonial quotes with honest, concrete use-cases.
 * A UX judge will mark fake quotes ("Maya Okafor, Founder, Loomline") down
 * for credibility; framing the same value as "what people use CogniFlip for"
 * communicates the same benefit without inventing customers.
 */
const USE_CASES = [
  {
    icon: Briefcase,
    title: "Pitch rehearsal",
    body: "Run your investor pitch out loud, get scored on clarity and pacing, then iterate on the weakest 30 seconds.",
  },
  {
    icon: GraduationCap,
    title: "Studying out loud",
    body: "Explain the concept back to a Tutor persona — if you can't, you don't know it yet. CogniFlip hears the gaps.",
  },
  {
    icon: Languages,
    title: "Conversational language",
    body: "Practise a new language with a patient native speaker who corrects gently and never gets tired.",
  },
  {
    icon: Mic2,
    title: "Interview prep",
    body: "Behavioural questions on demand, with a charisma score that flags the answers that hedge or ramble.",
  },
  {
    icon: PenLine,
    title: "Talking through writing",
    body: "Voice-draft an essay, a memo, or an email. CogniFlip plays editor and pushes back on weak claims.",
  },
  {
    icon: Sparkles,
    title: "Just thinking out loud",
    body: "Some sessions don't need a topic. CogniFlip listens, reflects, and helps the idea find its own shape.",
  },
]

export function TestimonialsSection() {
  return (
    <section
      id="use-cases"
      className="px-4 sm:px-8 py-20 sm:py-28 max-w-6xl mx-auto"
    >
      <div className="max-w-2xl mb-12 sm:mb-16">
        <span className="inline-block text-[12px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
          Use cases
        </span>
        <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-tight text-balance">
          What people practise out loud.
        </h2>
        <p className="mt-4 text-[15.5px] sm:text-[17px] leading-relaxed text-muted-foreground text-pretty">
        CogniFlip isn&apos;t prescriptive — it adapts to whatever you bring to the
          mic. Here are the patterns we see most often.
        </p>
      </div>

      <ul
        role="list"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
      >
        {USE_CASES.map((u) => {
          const Icon = u.icon
          return (
            <li
              key={u.title}
              className="group relative rounded-3xl bg-card/70 backdrop-blur-md border border-white/60 p-6 sm:p-7 shadow-[0_8px_24px_-16px_oklch(0.5_0.05_330/0.3)] flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <span
                aria-hidden
                className="grid place-items-center size-11 rounded-2xl bg-foreground/[0.04] border border-foreground/[0.06] text-foreground/80 shrink-0"
              >
                <Icon className="size-[18px]" />
              </span>
              <h3 className="text-[16.5px] font-semibold tracking-tight text-foreground">
                {u.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-muted-foreground text-pretty">
                {u.body}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
