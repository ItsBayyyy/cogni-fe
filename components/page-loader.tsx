/**
 * Lightweight, instant-render loading screen used by every route's
 * `loading.tsx`. Pure CSS / no client JS so it shows up the moment a
 * route transition begins — no heavy SVG orb, no auth checks, no font swap.
 */
export function PageLoader({ label = "Loading" }: { label?: string }) {
    return (
      <div className="min-h-[100dvh] grid place-items-center px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative size-14">
            <span
              className="absolute inset-0 rounded-full border-2 border-foreground/10"
              aria-hidden
            />
            <span
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-foreground/70 animate-spin"
              aria-hidden
            />
          </div>
          <p className="text-[12.5px] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
        </div>
      </div>
    )
  }
  