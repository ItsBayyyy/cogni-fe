import { PhoneShell } from "@/components/phone-shell"

/**
 * Landing-route skeleton. Mirrors the hero shape (copy + orb) so the
 * route transition feels like the page is materializing, not blanking.
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
          <div className="skeleton size-9 rounded-xl" />
          <div className="skeleton size-10 rounded-full ml-auto" />
        </div>
      </div>

      <section className="px-4 sm:px-8 pb-12 sm:pb-20">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center min-h-[calc(100dvh-160px)]">
          <div className="order-2 lg:order-1 space-y-6 max-w-xl mx-auto lg:mx-0 w-full">
            <div className="skeleton h-7 w-44 rounded-full mx-auto lg:mx-0" />
            <div className="space-y-3">
              <div className="skeleton h-12 sm:h-16 w-full" />
              <div className="skeleton h-12 sm:h-16 w-5/6" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-4/5" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <div className="skeleton h-14 w-full sm:w-44 rounded-full" />
              <div className="skeleton h-14 w-full sm:w-48 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-md mx-auto lg:mx-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="skeleton h-6 w-16 mx-auto lg:mx-0" />
                  <div className="skeleton h-3 w-12 mx-auto lg:mx-0" />
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2 grid place-items-center">
            <div
              className="size-[260px] sm:size-[340px] lg:size-[380px] xl:size-[440px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.92 0.06 350 / 0.55), oklch(0.92 0.06 300 / 0.28) 55%, transparent 75%)",
                animation: "orb-glow 2.4s ease-in-out infinite",
              }}
              aria-hidden
            />
          </div>
        </div>
      </section>
    </PhoneShell>
  )
}