"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronLeft,
  Menu,
  X,
  Home,
  Mic,
  FileText,
  LogOut,
  LogIn,
  User as UserIcon,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { signOut } from "@/lib/auth"
import { BrandLogo } from "@/components/brand-logo"

interface AppHeaderProps {
  title?: string
  subtitle?: string
  backHref?: string
  /** Show the brand row (desktop top nav). Defaults to true. */
  showBrand?: boolean
}

/**
 * Default app nav (route-level). Used on every page except the landing.
 */
const APP_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/setup", label: "New session", icon: Mic },
  { href: "/reports", label: "Reports", icon: FileText },
]

/**
 * Landing-only nav (in-page anchors). On a long marketing page, jumping
 * to the section the visitor cares about beats forcing them to scroll.
 * Smooth-scroll is enabled globally in globals.css.
 */
const LANDING_NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#personas", label: "Personas" },
  { href: "#use-cases", label: "Use cases" },
]

export function AppHeader({
  title,
  subtitle,
  backHref,
  showBrand = true,
}: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const userMenuRef = useRef<HTMLDivElement | null>(null)

  // On the landing page, swap the route-level nav for in-page anchor links
  // (Features / How it works / Personas / Use cases). Anywhere else, keep the
  // standard app nav.
  const isLanding = pathname === "/"

  // Mark as mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show frosted background only after user scrolls a bit.
  useEffect(() => {
    if (!mounted) return
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [mounted])

  // Lock body scroll while drawer is open + close on Escape.
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

  // Close the desktop user menu on outside click / Escape.
  useEffect(() => {
    if (!userMenuOpen) return
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false)
    }
    window.addEventListener("mousedown", onClick)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("mousedown", onClick)
      window.removeEventListener("keydown", onKey)
    }
  }, [userMenuOpen])

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : ""

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    setSignOutError(null)

    const didSignOut = await signOut()
    if (!didSignOut) {
      setSigningOut(false)
      setSignOutError("Could not sign out. Please try again.")
      return
    }

    setUserMenuOpen(false)
    setMenuOpen(false)
    router.replace("/")
    router.refresh()
  }

  const BackButton = backHref ? (
    <Link
      href={backHref}
      aria-label="Back"
      className="grid place-items-center size-10 rounded-full bg-card/80 backdrop-blur-md shadow-[0_4px_14px_-6px_oklch(0.5_0.05_330/0.25)] border border-white/60 text-foreground/80 hover:bg-card transition"
    >
      <ChevronLeft className="size-5" />
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back"
      className="grid place-items-center size-10 rounded-full bg-card/80 backdrop-blur-md shadow-[0_4px_14px_-6px_oklch(0.5_0.05_330/0.25)] border border-white/60 text-foreground/80 hover:bg-card transition"
    >
      <ChevronLeft className="size-5" />
    </button>
  )

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ease-out print:hidden ${
          scrolled ? "px-3 sm:px-6 pt-3 sm:pt-4 pb-2" : "px-4 sm:px-8 pt-4 sm:pt-5 pb-3"
        }`}
      >
        <div
          className={`mx-auto transition-all duration-300 ease-out ${
            scrolled
              ? "max-w-5xl rounded-full bg-background/80 backdrop-blur-xl border border-foreground/10 shadow-[0_10px_40px_-12px_oklch(0.2_0.02_60/0.18)] px-4 sm:px-5 py-2 sm:py-2.5"
              : "max-w-none px-0 py-0"
          }`}
        >
        {/* Desktop brand row — only shown on sm+ */}
        {showBrand && (
          <div className="hidden sm:flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <BrandLogo size={32} priority />
              <span className="text-[15px] font-semibold tracking-tight">CogniFlip</span>
              {(title || subtitle) && (
                <span className="hidden md:inline-flex items-center gap-2 ml-2 pl-3 border-l border-foreground/10 text-[13px] text-muted-foreground">
                  {title && <span className="text-foreground/80 font-medium tracking-tight">{title}</span>}
                  {subtitle && <span className="text-muted-foreground">· {subtitle}</span>}
                </span>
              )}
            </Link>
            <nav className="flex items-center gap-1 text-[13.5px] text-muted-foreground">
              {(isLanding ? LANDING_NAV_ITEMS : APP_NAV_ITEMS).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-full hover:text-foreground hover:bg-card/60 transition"
                >
                  {item.label}
                </Link>
              ))}

              {/* Auth slot — desktop */}
              {mounted && user ? (
                <div className="relative ml-2" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-card/80 backdrop-blur-md border border-white/60 hover:bg-card transition"
                  >
                    <span className="grid place-items-center size-7 rounded-full bg-foreground text-background text-[11px] font-semibold tracking-tight">
                      {initials}
                    </span>
                    <span className="text-[13px] tracking-tight text-foreground/80 max-w-[120px] truncate">
                      {user.name}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-2xl bg-background/95 backdrop-blur-xl border border-foreground/10 shadow-[0_20px_50px_-20px_oklch(0.2_0.02_60/0.3)] p-2 z-50"
                    >
                      <div className="px-3 py-2.5 border-b border-foreground/5 mb-1">
                        <p className="text-[13.5px] font-medium tracking-tight text-foreground truncate">
                          {user.name}
                        </p>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        role="menuitem"
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13.5px] text-foreground/80 hover:bg-card transition text-left disabled:cursor-wait disabled:opacity-50"
                      >
                        <LogOut className="size-[15px]" />
                        {signingOut ? "Signing out…" : "Sign out"}
                      </button>
                      {signOutError && (
                        <p role="alert" className="px-3 pb-2 text-[11.5px] text-[oklch(0.55_0.18_25)]">
                          {signOutError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : mounted ? (
                <Link
                  href="/login"
                  className="ml-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-foreground text-background text-[13px] font-medium tracking-tight hover:bg-foreground/90 transition"
                >
                  <LogIn className="size-[14px]" />
                  Sign in
                </Link>
              ) : null}
            </nav>
          </div>
        )}

        {/* Mobile-only page row — back / title / menu */}
        <div className="sm:hidden flex items-center justify-between gap-3">
          {(title || backHref) && BackButton}

          {!title && !backHref && (
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo size={36} priority />
              <span className="text-[15px] font-semibold tracking-tight">CogniFlip</span>
            </Link>
          )}

          {(title || backHref) && (
            <div className="flex-1 text-center min-w-0">
              {title && (
                <h1 className="text-[16px] font-semibold tracking-tight text-foreground truncate">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-[12.5px] text-muted-foreground mt-0.5 tracking-tight truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="grid place-items-center size-10 rounded-full bg-card/80 backdrop-blur-md shadow-[0_4px_14px_-6px_oklch(0.5_0.05_330/0.25)] border border-white/60 text-foreground/80 hover:bg-card transition shrink-0"
          >
            <Menu className="size-5" />
          </button>
        </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      <div
        className={`sm:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        />

        {/* Panel */}
        <aside
          role="dialog"
          aria-modal="true"
          className={`absolute top-0 right-0 h-full w-[82%] max-w-sm bg-background shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-foreground/5">
            <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2">
              <BrandLogo size={36} />
              <span className="text-[16px] font-semibold tracking-tight">CogniFlip</span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="grid place-items-center size-10 rounded-full bg-card/80 border border-white/60 text-foreground/80 hover:bg-card transition"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {/* User card / sign-in CTA */}
            {mounted && user ? (
              <div className="mx-1 mb-3 flex items-center gap-3 px-3 py-3 rounded-2xl bg-card border border-foreground/5">
                <span className="grid place-items-center size-10 rounded-full bg-foreground text-background text-[13px] font-semibold tracking-tight">
                  {initials}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium tracking-tight text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-[12px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            ) : mounted ? (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="mx-1 mb-3 flex items-center gap-3 px-3 py-3 rounded-2xl bg-card border border-foreground/5 hover:bg-card/80 transition"
              >
                <span className="grid place-items-center size-10 rounded-full bg-foreground/5 text-foreground/70">
                  <UserIcon className="size-[18px]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium tracking-tight text-foreground">
                    Sign in
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    Save your sessions and reports
                  </p>
                </div>
              </Link>
            ) : null}

            <ul className="flex flex-col gap-1">
              {APP_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[15px] font-medium text-foreground/90 hover:bg-card transition"
                    >
                      <span className="grid place-items-center size-9 rounded-xl bg-card border border-foreground/5 text-foreground/70">
                        <Icon className="size-[17px]" />
                      </span>
                      {item.label}
                    </Link>
                  </li>
                )
              })}

              {/* On the landing page, also surface in-page anchors so mobile
                  visitors can jump to a section without scrolling 6 viewports. */}
              {isLanding && (
                <>
                  <li
                    className="px-4 pt-4 pb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
                    aria-hidden
                  >
                    On this page
                  </li>
                  {LANDING_NAV_ITEMS.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[14.5px] text-foreground/80 hover:bg-card transition"
                      >
                        <span className="grid place-items-center size-9 rounded-xl bg-card border border-foreground/5 text-foreground/60 text-[12px] font-medium tracking-tight">
                          #
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </>
              )}

              {mounted && user && (
                <li>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-[15px] font-medium text-foreground/90 hover:bg-card transition text-left disabled:cursor-wait disabled:opacity-50"
                  >
                    <span className="grid place-items-center size-9 rounded-xl bg-card border border-foreground/5 text-foreground/70">
                      <LogOut className="size-[17px]" />
                    </span>
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                  {signOutError && (
                    <p role="alert" className="px-4 pb-2 text-[12px] text-[oklch(0.55_0.18_25)]">
                      {signOutError}
                    </p>
                  )}
                </li>
              )}
            </ul>
          </nav>

          <div className="px-5 py-5 border-t border-foreground/5">
            <Link
              href={user ? "/setup" : "/login?next=%2Fsetup"}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 h-12 rounded-full bg-foreground text-background text-[14.5px] font-medium tracking-tight active:scale-[0.99] transition"
            >
              Start a session
            </Link>
            <p className="mt-3 text-center text-[11.5px] text-muted-foreground tracking-wide">
            CogniFlip · AI voice assistant
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
