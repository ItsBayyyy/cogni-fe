"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

/**
 * Global top progress bar that appears the moment the user clicks any in-app
 * <a href> / <Link> and disappears once the new route has finished rendering.
 *
 * Why this exists:
 *  - Next.js App Router transitions are async + can take a beat on slower
 *    devices. Without feedback the UI looks frozen ("did my click register?").
 *  - We listen to clicks at the document level so EVERY internal link shows
 *    a progress bar — no need to swap out individual <Link> usages.
 */
export function NavProgress() {
  const pathname = usePathname()
  const search = useSearchParams()
  const [active, setActive] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Click interception: any in-app link click flips the bar on immediately.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Ignore non-primary, modified, or default-prevented clicks.
      if (e.defaultPrevented) return
      if (e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const target = e.target as HTMLElement | null
      if (!target) return
      const anchor = target.closest("a") as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href) return
      // Skip external links, hash-only links, and explicit downloads / new-tab.
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.hasAttribute("download")) return
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return
      }

      // Same-URL clicks don't actually navigate.
      try {
        const url = new URL(anchor.href, window.location.href)
        if (url.origin !== window.location.origin) return
        const currentPath = window.location.pathname + window.location.search
        const nextPath = url.pathname + url.search
        if (nextPath === currentPath) return
      } catch {
        return
      }

      if (finishTimer.current) {
        clearTimeout(finishTimer.current)
        finishTimer.current = null
      }
      setFinishing(false)
      setActive(true)
    }

    document.addEventListener("click", onClick, { capture: true })
    return () => document.removeEventListener("click", onClick, { capture: true })
  }, [])

  // Whenever the resolved pathname changes, the navigation has completed —
  // run the "finish" animation, then hide.
  useEffect(() => {
    if (!active) return
    setFinishing(true)
    if (finishTimer.current) clearTimeout(finishTimer.current)
    finishTimer.current = setTimeout(() => {
      setActive(false)
      setFinishing(false)
    }, 280)
    return () => {
      if (finishTimer.current) clearTimeout(finishTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search?.toString()])

  if (!active) return null

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-busy="true"
      className="fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden pointer-events-none"
    >
      <div
        className="h-full origin-left rounded-r-full"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.78 0.18 25), oklch(0.78 0.16 350), oklch(0.7 0.18 310))",
          animation: finishing
            ? "nav-progress-finish 280ms ease-out forwards"
            : "nav-progress-grow 1400ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
          boxShadow: "0 0 12px oklch(0.78 0.16 350 / 0.6)",
        }}
      />
    </div>
  )
}