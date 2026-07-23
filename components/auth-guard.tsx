"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

/**
 * Wrap any protected page with <AuthGuard>...</AuthGuard>.
 * If the user is not signed in, they are redirected to /login,
 * with a `next` query param so they return to the original page after login.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) {
      const next = encodeURIComponent(pathname || "/")
      router.replace(`/login?next=${next}`)
    }
  }, [user, loading, pathname, router])

  if (loading || !user) {
    return (
      <div className="min-h-[100dvh] grid place-items-center px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className="size-10 rounded-full border-2 border-foreground/15 border-t-foreground/70 animate-spin"
            aria-hidden
          />
          <p className="text-[13px] tracking-tight text-muted-foreground">
            Checking your session…
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
