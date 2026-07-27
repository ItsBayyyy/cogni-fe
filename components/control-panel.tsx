"use client"

import type React from "react"
import { Mic, X, Sparkles, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface ControlPanelProps {
  muted?: boolean
  micDisabled?: boolean
  /** Desktop tap-to-toggle handler */
  onToggleMute?: () => void
  /** Mobile push-to-talk: fires when user begins holding the mic button */
  onPressStart?: () => void
  /** Mobile push-to-talk: fires when user releases the mic button (or pointer leaves) */
  onPressEnd?: () => void
  /** When true, mobile mic button uses hold-to-talk (pointer events). When false, it falls back to tap-to-toggle. */
  pushToTalk?: boolean
  onClose?: () => void
  onPersona?: () => void
}

export function ControlPanel({
  muted,
  micDisabled = false,
  onToggleMute,
  onPressStart,
  onPressEnd,
  pushToTalk = false,
  onClose,
  onPersona,
}: ControlPanelProps) {
  const mobileMicHandlers: React.ComponentProps<"button"> = pushToTalk
    ? {
        onPointerDown: (e) => {
          e.preventDefault()
          if (micDisabled) return
          ;(e.currentTarget as HTMLButtonElement).setPointerCapture?.(e.pointerId)
          onPressStart?.()
        },
        onPointerUp: (e) => {
          ;(e.currentTarget as HTMLButtonElement).releasePointerCapture?.(e.pointerId)
          onPressEnd?.()
        },
        onPointerCancel: () => {
          onPressEnd?.()
        },
        onContextMenu: (e) => e.preventDefault(),
      }
    : {
        onClick: () => {
          if (!micDisabled) onToggleMute?.()
        },
      }

  const mobileLabel = micDisabled
    ? "Please wait"
    : pushToTalk
    ? muted
      ? "Hold to talk"
      : "You're speaking…"
    : muted
      ? "Tap to unmute"
      : "Tap to mute"

  return (
    <>
      {/* Mobile: centered floating cluster */}
      <div className="lg:hidden flex items-end justify-center gap-4 sm:gap-6 px-4">
        <div className="flex flex-col items-center gap-2 sm:gap-3 mb-1">
          <button
            type="button"
            onClick={onPersona}
            aria-label="Choose persona"
            className="grid place-items-center size-12 rounded-full bg-card/85 backdrop-blur-md border border-white/60 shadow-[0_6px_18px_-8px_oklch(0.5_0.05_330/0.3)] text-foreground/80 hover:bg-card transition"
          >
            <Sparkles className="size-[18px]" />
          </button>
          <span className="text-[9.5px] uppercase tracking-widest text-muted-foreground font-medium">Persona</span>
        </div>

        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label={pushToTalk ? "Hold to talk" : muted ? "Unmute" : "Mute"}
            aria-pressed={!muted}
            aria-disabled={micDisabled}
            disabled={micDisabled}
            {...mobileMicHandlers}
            className={cn(
              "relative grid place-items-center size-[72px] sm:size-[76px] rounded-full bg-foreground text-background shadow-[0_14px_30px_-10px_oklch(0.2_0.02_60/0.55)] transition select-none touch-none",
              muted ? "scale-100" : "scale-[1.06]",
              pushToTalk ? "active:scale-[0.97]" : "active:scale-95",
              micDisabled && "cursor-not-allowed opacity-45 active:scale-100",
            )}
            style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
          >
            {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
            {!muted && (
              <>
                <span className="absolute inset-0 rounded-full ring-1 ring-white/10 pointer-events-none" />
                <span className="absolute -inset-2 rounded-full border border-foreground/20 animate-pulse pointer-events-none" />
              </>
            )}
          </button>
          <span className="text-[10px] uppercase tracking-[0.15em] text-foreground font-medium whitespace-nowrap">
            {mobileLabel}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 sm:gap-3 mb-1">
          <button
            type="button"
            onClick={onClose}
            aria-label="End session"
            className="grid place-items-center size-12 rounded-full bg-card/85 backdrop-blur-md border border-white/60 shadow-[0_6px_18px_-8px_oklch(0.5_0.05_330/0.3)] text-foreground/80 hover:bg-card transition"
          >
            <X className="size-[18px]" />
          </button>
          <span className="text-[9.5px] uppercase tracking-widest text-muted-foreground font-medium">End</span>
        </div>
      </div>

      {/* Desktop: inline action bar with text labels — always tap-to-toggle */}
      <div className="hidden lg:flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          aria-disabled={micDisabled}
          disabled={micDisabled}
          className={cn(
            "inline-flex items-center gap-2.5 h-14 px-7 rounded-full font-medium tracking-tight transition shadow-[0_14px_30px_-10px_oklch(0.2_0.02_60/0.55)] active:scale-[0.99]",
            muted ? "bg-foreground/80 text-background" : "bg-foreground text-background",
            micDisabled && "cursor-not-allowed opacity-45 active:scale-100",
          )}
        >
          {muted ? <MicOff className="size-[18px]" /> : <Mic className="size-[18px]" />}
          <span className="text-[14.5px]">{muted ? "Unmute" : "Mute"}</span>
        </button>

        <button
          type="button"
          onClick={onPersona}
          className="inline-flex items-center gap-2 h-14 px-5 rounded-full bg-card/80 backdrop-blur-md border border-white/60 shadow-[0_6px_18px_-8px_oklch(0.5_0.05_330/0.3)] text-foreground/80 hover:bg-card transition text-[14px]"
        >
          <Sparkles className="size-[16px]" />
          Persona
        </button>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 h-14 px-5 rounded-full bg-card/80 backdrop-blur-md border border-white/60 shadow-[0_6px_18px_-8px_oklch(0.5_0.05_330/0.3)] text-foreground/80 hover:bg-card transition text-[14px] ml-auto"
        >
          <X className="size-[16px]" />
          End session
        </button>
      </div>
    </>
  )
}
