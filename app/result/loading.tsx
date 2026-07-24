import { PhoneShell } from "@/components/phone-shell"

/**
 * Route-level skeleton for /result. Mirrors the actual report layout
 * (topic recap → score card + highlights → breakdown grid → actions)
 * so the user sees the *shape* of the page during route transition.
 * Far less jarring than a centered spinner.
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
            <div className="skeleton h-3.5 w-24" />
            <div className="skeleton h-3 w-16" />
          </div>
          <div className="skeleton size-10 rounded-full" />
        </div>
      </div>

      <main className="px-4 sm:px-8 pb-12 pt-6 sm:pt-8 lg:pt-0 lg:flex lg:flex-col lg:justify-center lg:min-h-[calc(100dvh-120px)]">
        {/* Topic recap */}
        <div className="rounded-3xl bg-card/80 backdrop-blur-md border border-white/60 p-5 sm:p-6 max-w-3xl space-y-2.5">
          <div className="skeleton h-3 w-12" />
          <div className="skeleton h-4 w-3/4" />
        </div>

        {/* Score card + highlights */}
        <div className="mt-5 grid lg:grid-cols-[1.1fr_1fr] gap-5 items-start">
          <div className="rounded-3xl bg-card/85 backdrop-blur-md border border-white/60 p-6 sm:p-8">
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
            <div className="rounded-2xl bg-card/85 backdrop-blur-md border border-white/60 p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="skeleton size-2 rounded-full" />
                <div className="skeleton h-4 w-2/3" />
              </div>
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-5/6" />
            </div>
            <div className="rounded-2xl bg-card/85 backdrop-blur-md border border-white/60 p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="skeleton size-2 rounded-full" />
                <div className="skeleton h-4 w-1/2" />
              </div>
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-3/4" />
            </div>
          </div>
        </div>

        {/* Breakdown grid */}
        <div className="mt-5 space-y-3">
          <div className="skeleton h-3 w-20 mx-1" />
          <div className="rounded-3xl bg-card/85 backdrop-blur-md border border-white/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-foreground/5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 space-y-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="skeleton h-4 w-16" />
                  <div className="skeleton h-5 w-10" />
                </div>
                <div className="skeleton h-1.5 w-full rounded-full" />
                <div className="skeleton h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="skeleton h-14 w-full sm:w-44 rounded-full" />
          <div className="flex gap-3 justify-center sm:justify-end">
            <div className="skeleton h-14 w-24 rounded-full" />
            <div className="skeleton h-14 w-24 rounded-full" />
          </div>
        </div>
      </main>
    </PhoneShell>
  )
}