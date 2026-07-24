import { PhoneShell } from "@/components/phone-shell"

/**
 * Route-level skeleton for /session. We can't preview the live orb without
 * audio context, so we draw a soft pulsing disk that matches the orb's
 * footprint, plus skeleton transcript + control rail. Feels like the page
 * is "tuning in" rather than blank-spinning.
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
            <div className="skeleton h-3.5 w-32" />
            <div className="skeleton h-3 w-20" />
          </div>
          <div className="skeleton size-10 rounded-full" />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden flex flex-col min-h-[calc(100dvh-72px)]">
        <div className="flex-1 grid place-items-center px-6 pt-2 sm:pt-6">
          <div
            className="size-[260px] sm:size-[320px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.92 0.06 350 / 0.5), oklch(0.92 0.06 300 / 0.25) 55%, transparent 75%)",
              animation: "orb-glow 2.4s ease-in-out infinite",
            }}
            aria-hidden
          />
        </div>
        <div className="px-6 pb-3 max-w-2xl mx-auto w-full">
          <div className="space-y-2.5">
            <div className="skeleton h-3 w-12" />
            <div className="skeleton h-6 w-3/4 mx-auto sm:mx-0" />
            <div className="skeleton h-6 w-2/3 mx-auto sm:mx-0" />
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="skeleton h-12 w-full rounded-2xl" />
        </div>
        <div className="pb-8 sm:pb-12 px-6 flex items-center justify-center gap-4">
          <div className="skeleton size-12 rounded-full" />
          <div className="skeleton size-20 rounded-full" />
          <div className="skeleton size-12 rounded-full" />
        </div>
      </div>

      {/* Desktop layout */}
      <main className="hidden lg:grid grid-cols-[1.05fr_1fr] gap-12 xl:gap-16 items-center px-8 pb-12 min-h-[calc(100dvh-110px)]">
        <div className="relative grid place-items-center">
          <div
            className="size-[360px] xl:size-[420px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.92 0.06 350 / 0.5), oklch(0.92 0.06 300 / 0.25) 55%, transparent 75%)",
              animation: "orb-glow 2.4s ease-in-out infinite",
            }}
            aria-hidden
          />
        </div>
        <div className="space-y-6 max-w-xl">
          <div className="space-y-2">
            <div className="skeleton h-3 w-12" />
            <div className="skeleton h-7 w-2/3" />
          </div>
          <div className="space-y-2.5">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-7 w-full" />
            <div className="skeleton h-7 w-5/6" />
            <div className="skeleton h-7 w-3/4" />
          </div>
          <div className="skeleton h-14 w-full rounded-2xl" />
          <div className="flex items-center gap-4 pt-2">
            <div className="skeleton size-12 rounded-full" />
            <div className="skeleton size-20 rounded-full" />
            <div className="skeleton size-12 rounded-full" />
          </div>
        </div>
      </main>
    </PhoneShell>
  )
}