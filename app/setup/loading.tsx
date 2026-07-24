import { PhoneShell } from "@/components/phone-shell"

/**
 * Route-level skeleton for /setup. Mirrors the topic textarea + chip suggestions
 * + persona picker so the page shape is steady while it streams in.
 */
export default function Loading() {
  return (
    <PhoneShell size="wide">
      {/* Header skeleton */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-5 pb-3">
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="skeleton size-8 rounded-xl" />
            <div className="skeleton h-3.5 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <div className="skeleton h-7 w-16 rounded-full" />
            <div className="skeleton h-7 w-24 rounded-full" />
            <div className="skeleton h-7 w-20 rounded-full" />
          </div>
        </div>
        <div className="sm:hidden flex items-center justify-between gap-3">
          <div className="skeleton size-10 rounded-full" />
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="skeleton h-3.5 w-28" />
            <div className="skeleton h-3 w-20" />
          </div>
          <div className="skeleton size-10 rounded-full" />
        </div>
      </div>

      <main className="px-4 sm:px-8 pb-12 pt-6 sm:pt-8 lg:pt-0 lg:flex lg:items-center lg:min-h-[calc(100dvh-120px)]">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 items-start w-full">
          {/* Topic */}
          <section className="space-y-4">
            <div className="space-y-2">
              <div className="skeleton h-7 sm:h-8 w-3/4" />
              <div className="skeleton h-3.5 w-full" />
              <div className="skeleton h-3.5 w-4/5" />
            </div>
            {/* Textarea */}
            <div className="skeleton h-44 w-full rounded-3xl" />
            {/* Chips */}
            <div className="flex flex-wrap gap-2">
              <div className="skeleton h-9 w-56 rounded-full" />
              <div className="skeleton h-9 w-48 rounded-full" />
              <div className="skeleton h-9 w-60 rounded-full" />
            </div>
          </section>

          {/* Persona */}
          <section className="space-y-4">
            <div className="space-y-2">
              <div className="skeleton h-6 w-40" />
              <div className="skeleton h-3.5 w-3/4" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl bg-card/80 backdrop-blur-md border border-white/60 p-5 flex items-start gap-4"
                >
                  <div className="skeleton size-11 rounded-2xl shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
            {/* CTA */}
            <div className="skeleton h-14 w-full rounded-full" />
          </section>
        </div>
      </main>
    </PhoneShell>
  )
}