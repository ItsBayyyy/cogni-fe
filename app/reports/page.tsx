"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  FileText,
  HeartHandshake,
  GraduationCap,
  Brain,
  Laugh,
  Megaphone,
  Mic,
} from "lucide-react"
import { PhoneShell } from "@/components/phone-shell"
import { AppHeader } from "@/components/app-header"
import { AuthGuard } from "@/components/auth-guard"
import { VoiceOrb } from "@/components/voice-orb"
import { listSessions, type BackendPersona, type SessionListItem } from "@/lib/api"

/**
 * Server-owned persona IDs map to their report presentation.
 */
const PERSONA_META: Record<
  BackendPersona,
  { label: string; Icon: typeof HeartHandshake; tone: string }
> = {
  friendly: {
    label: "Friend",
    Icon: HeartHandshake,
    tone: "oklch(0.78 0.16 30)",
  },
  strict: {
    label: "Strict",
    Icon: GraduationCap,
    tone: "oklch(0.7 0.18 350)",
  },
  socratic: {
    label: "Socratic",
    Icon: Brain,
    tone: "oklch(0.7 0.18 280)",
  },
  comedian: {
    label: "Comedian",
    Icon: Laugh,
    tone: "oklch(0.76 0.17 70)",
  },
  nain: {
    label: "NAIN",
    Icon: Megaphone,
    tone: "oklch(0.67 0.2 25)",
  },
}

/**
 * Lightweight relative time formatter. Avoids a date-fns dep for one piece
 * of UI. Reads "just now / 2m ago / 3h ago / 4d ago / Mar 14".
 */
function formatRelative(iso: string): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ""
  const diff = Date.now() - t
  const m = Math.round(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: new Date(iso).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  })
}

function ReportsInner() {
  const [items, setItems] = useState<SessionListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await listSessions()
        if (!active) return
        // Newest first — the API doesn't guarantee order.
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        setItems(sorted)
      } catch {
        if (!active) return
        setError("Could not load your reports. Please try again.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const isEmpty = !loading && !error && items && items.length === 0

  return (
    <PhoneShell size="wide">
      <AppHeader title="Your reports" subtitle="Past sessions" backHref="/" />

      <main className="px-4 sm:px-8 pb-12 pt-6 sm:pt-8 lg:pt-2">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
              History
            </p>
            <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-tight mt-1">
              Your reports
            </h1>
          </div>
          <Link
            href="/setup"
            className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-full bg-foreground text-background text-[14px] font-medium tracking-tight shadow-[0_10px_22px_-10px_oklch(0.2_0.02_60/0.5)] hover:translate-y-[-1px] transition"
          >
            <Mic className="size-[15px]" />
            New session
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-2xl bg-card/85 backdrop-blur-md border border-white/60 p-4 text-[13.5px] text-[oklch(0.55_0.18_25)]"
          >
            {error}
          </div>
        )}

        {loading && <ReportsListSkeleton />}

        {isEmpty && <EmptyState />}

        {!loading && items && items.length > 0 && (
          <ul className="space-y-3 animate-float-up">
            {items.map((s, idx) => (
              <li
                key={s.session_id}
                style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                className="animate-float-up"
              >
                <ReportCard item={s} />
              </li>
            ))}
          </ul>
        )}

        {/* Mobile-only trailing CTA so the new-session affordance is always reachable */}
        {!loading && items && items.length > 0 && (
          <div className="sm:hidden mt-6">
            <Link
              href="/setup"
              className="inline-flex w-full items-center justify-center gap-2 h-13 px-6 rounded-full bg-foreground text-background font-medium tracking-tight shadow-[0_14px_30px_-12px_oklch(0.2_0.02_60/0.5)]"
            >
              <Mic className="size-[15px]" />
              New session
            </Link>
          </div>
        )}
      </main>
    </PhoneShell>
  )
}

function ReportCard({ item }: { item: SessionListItem }) {
  const meta = PERSONA_META[item.persona] ?? PERSONA_META.friendly
  const Icon = meta.Icon
  const href = useMemo(() => {
    const qs = new URLSearchParams({
      session_id: item.session_id,
      topic: item.topic,
      persona: item.persona,
    })
    return `/result?${qs.toString()}`
  }, [item])

  return (
    <Link
      href={href}
      className="group block rounded-2xl bg-card/85 backdrop-blur-md border border-white/60 p-4 sm:p-5 shadow-[0_8px_24px_-16px_oklch(0.5_0.05_330/0.3)] hover:bg-card transition"
    >
      <div className="flex items-center gap-4">
        {/* Persona pill — tinted dot + lucide icon, kept compact on mobile */}
        <div
          className="grid place-items-center size-11 rounded-2xl shrink-0"
          style={{
            background: `linear-gradient(135deg, ${meta.tone} / 0.2, ${meta.tone} / 0.08)`,
            // Tailwind can't do mixed oklch alpha through arbitrary values reliably,
            // so use a CSS background. Border keeps the chip distinct on cream bg.
            border: `1px solid color-mix(in oklch, ${meta.tone}, transparent 75%)`,
          }}
          aria-hidden
        >
          <Icon
            className="size-[18px]"
            style={{ color: `color-mix(in oklch, ${meta.tone}, black 18%)` }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] sm:text-[16px] font-medium tracking-tight line-clamp-1 text-pretty">
            {item.topic || "Untitled session"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: meta.tone }}
              />
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-[13px]" />
              {formatRelative(item.created_at)}
            </span>
          </div>
        </div>

        <ChevronRight className="size-[18px] text-muted-foreground group-hover:translate-x-0.5 transition shrink-0" />
      </div>
    </Link>
  )
}

/**
 * Empty state — designed to feel inviting rather than apologetic. Pairs the
 * branded orb with one clear CTA so the first interaction with this page is
 * "start a session" rather than "404 / nothing to see".
 */
function EmptyState() {
  return (
    <div className="rounded-3xl bg-card/85 backdrop-blur-md border border-white/60 p-8 sm:p-12 shadow-[0_14px_36px_-18px_oklch(0.5_0.05_330/0.35)] grid place-items-center text-center animate-float-up">
      <div className="grid place-items-center mb-5">
        <VoiceOrb state="idle" size={140} amplitude={0.18} />
      </div>
      <p className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
        Nothing yet
      </p>
      <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight mt-1.5 text-balance">
        Your reports will live here
      </h2>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground max-w-sm text-pretty">
        Finish a voice session and you&apos;ll get a clarity, depth, pacing, and
        charisma breakdown — every one of them saved here for review.
      </p>
      <Link
        href="/setup"
        className="mt-6 inline-flex items-center gap-2 h-13 px-7 rounded-full bg-foreground text-background font-medium tracking-tight shadow-[0_14px_30px_-12px_oklch(0.2_0.02_60/0.5)] active:scale-[0.99] transition"
      >
        <Mic className="size-[15px]" />
        Start your first session
        <ArrowRight className="size-4" />
      </Link>
      <p className="mt-3 text-[12.5px] text-muted-foreground inline-flex items-center gap-1.5">
        <FileText className="size-[13px]" />
        Reports unlock automatically after each session.
      </p>
    </div>
  )
}

/** Skeleton mirroring the real list — same height, same vertical rhythm. */
function ReportsListSkeleton() {
  return (
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
  )
}

export default function ReportsPage() {
  return (
    <AuthGuard>
      <ReportsInner />
    </AuthGuard>
  )
}
