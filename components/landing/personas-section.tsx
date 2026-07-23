import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const PERSONAS = [
  {
    name: "The Interviewer",
    tag: "Job prep",
    desc: "Behavioural and technical drills, live follow-ups, STAR-format feedback.",
    grad: "linear-gradient(135deg, oklch(0.86 0.12 25 / 0.5), oklch(0.82 0.15 55 / 0.4))",
  },
  {
    name: "The Coach",
    tag: "Performance",
    desc: "Sharpens your pitch, your tone, and the way you handle hard questions.",
    grad: "linear-gradient(135deg, oklch(0.84 0.12 350 / 0.5), oklch(0.78 0.16 320 / 0.4))",
  },
  {
    name: "The Therapist",
    tag: "Reflection",
    desc: "A calm, attentive listener trained to help you think out loud, safely.",
    grad: "linear-gradient(135deg, oklch(0.82 0.1 280 / 0.5), oklch(0.78 0.14 310 / 0.4))",
  },
  {
    name: "The Tutor",
    tag: "Learning",
    desc: "Explains, quizzes, and adapts to where your understanding actually is.",
    grad: "linear-gradient(135deg, oklch(0.86 0.1 180 / 0.45), oklch(0.82 0.14 200 / 0.4))",
  },
  {
    name: "The Comedian",
    tag: "Levity",
    desc: "Cracks jokes, laughs at their own punchlines, keeps the room loose.",
    grad: "linear-gradient(135deg, oklch(0.86 0.13 75 / 0.5), oklch(0.82 0.15 35 / 0.4))",
  },
  {
    name: "The NAIN",
    tag: "Hard refusal",
    desc: "Pushes back theatrically. Will absolutely scream NAINNNNN at a bad take.",
    grad: "linear-gradient(135deg, oklch(0.84 0.14 15 / 0.55), oklch(0.78 0.16 350 / 0.45))",
  },
]

export function PersonasSection() {
  return (
    <section
      id="personas"
      className="px-4 sm:px-8 py-20 sm:py-28 max-w-6xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 sm:mb-16">
        <div className="max-w-2xl">
          <span className="inline-block text-[12px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
            Personas
          </span>
          <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-tight text-balance">
            A voice for every conversation.
          </h2>
        </div>
        <Link
          href="/setup"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground/80 hover:text-foreground transition self-start sm:self-end"
        >
          Browse all personas
          <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {PERSONAS.map((p) => (
          <div
            key={p.name}
            className="group relative rounded-3xl overflow-hidden border border-white/60 bg-card/60 backdrop-blur-md p-6 min-h-[260px] flex flex-col justify-between shadow-[0_10px_30px_-18px_oklch(0.5_0.05_330/0.4)] hover:-translate-y-1 transition"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-90"
              style={{ background: p.grad }}
            />
            <div
              aria-hidden
              className="absolute -right-12 -top-12 size-40 rounded-full opacity-60 blur-2xl"
              style={{ background: p.grad }}
            />

            <div className="relative">
              <span className="inline-block text-[11px] uppercase tracking-[0.15em] text-foreground/60 mb-3">
                {p.tag}
              </span>
              <h3 className="text-[20px] font-semibold tracking-tight text-foreground">
                {p.name}
              </h3>
            </div>

            <p className="relative text-[13.5px] leading-relaxed text-foreground/75 mt-6">
              {p.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
