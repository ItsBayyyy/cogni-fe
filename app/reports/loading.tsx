import { PhoneShell } from "@/components/phone-shell"

/**
 * Layout-mirroring skeleton for the reports list. Header band + title + 4
 * card placeholders so the route transition into /reports doesn't flash a
 * spinner that's visually disconnected from the real page.
 */
export default function ReportsLoading() {
  return (
    <PhoneShell size="wide">
      <div className="px-4 sm:px-8 pt-5 sm:pt-6 pb-3">
        <div className="h-[58px] flex items-center gap-3">
          <div className="skeleton size-9 rounded-full" />
          <div className="space-y-1.5">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-3 w-32" />
          </div>
        </div>
      </div>
      <main className="px-4 sm:px-8 pb-12 pt-4">
        <div className="space-y-2 mb-5">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-7 w-44" />
        </div>
        <ul className="space-y-3" aria-busy>
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="rounded-2xl bg-card/85 backdrop-blur-md border border-white/60 p-4 sm:p-5"
            >
              <div className="flex items-center gap-4">
                <div className="skeleton size-11 rounded-2xl shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-2/5" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </PhoneShell>
  )
}
