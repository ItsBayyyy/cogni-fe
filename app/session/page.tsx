"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PhoneShell } from "@/components/phone-shell"
import { AppHeader } from "@/components/app-header"
import { VoiceOrb } from "@/components/voice-orb"
import { WaveVisualizer } from "@/components/wave-visualizer"
import { ControlPanel } from "@/components/control-panel"
import { AuthGuard } from "@/components/auth-guard"
import { speakText, streamMessage, transcribeAudio } from "@/lib/api"
import { useMicAmplitude } from "@/hooks/use-mic-amplitude"

type OrbState = "idle" | "listening" | "speaking"
type Phase = "idle" | "recording" | "transcribing" | "thinking" | "speaking"

function SessionInner() {
  const router = useRouter()
  const params = useSearchParams()
  const sessionId = params.get("session_id") || ""
  const topicParam = params.get("topic")?.trim() || ""
  const persona = params.get("persona") || "analyst"

  const [phase, setPhase] = useState<Phase>("idle")
  const [muted, setMuted] = useState(true)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [orbSize, setOrbSize] = useState(280)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  // Active mic stream lives in state too (mirror of streamRef) so the
  // useMicAmplitude hook can subscribe and the orb can react to live audio.
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null)
  const micAmplitude = useMicAmplitude(activeStream)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // Separate AC for the /voice/speak fetch so we can kill the MP3 download
  // independently of the SSE chat stream when the user interrupts.
  const speakAbortRef = useRef<AbortController | null>(null)
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Generation token: each user turn bumps this. Any async work that finishes
  // for an old generation will see a stale token and bail out.
  const genIdRef = useRef(0)
  // Tracks an in-flight startRecording so we can cancel it if the user releases
  // the mic button before getUserMedia / MediaRecorder finishes initializing.
  const startAborterRef = useRef<{ aborted: boolean } | null>(null)
  // Guards against double-starts and tracks the user's current "press" intent.
  const pressedRef = useRef(false)
  // Scroll containers for the live transcript so long replies stay contained
  // and auto-scroll to the latest token instead of pushing the layout.
  const mobileTranscriptRef = useRef<HTMLDivElement | null>(null)
  const desktopTranscriptRef = useRef<HTMLDivElement | null>(null)

  // ----- Layout -----
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const update = () => {
      const w = window.innerWidth
      if (w >= 1280) setOrbSize(420)
      else if (w >= 1024) setOrbSize(360)
      else if (w >= 640) setOrbSize(320)
      else setOrbSize(260)
      setIsMobile(w < 1024)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [mounted])

  // ----- Hard kill: cancel chat stream, TTS download, audio playback,
  // reveal timer, and purge any in-flight generation. Zero-latency interrupt. -----
  const hardStopPlayback = useCallback(() => {
    // Bump generation token so any pending awaits resolve into stale branches.
    genIdRef.current += 1

    // 1. Abort in-flight HTTP work (SSE chat stream + /voice/speak download).
    abortRef.current?.abort()
    abortRef.current = null
    speakAbortRef.current?.abort()
    speakAbortRef.current = null

    // 2. Stop the word-by-word reveal timer.
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current)
      revealTimerRef.current = null
    }

    // 3. Hard-kill HTMLAudioElement playback.
    const a = audioElRef.current
    if (a) {
      try {
        a.onplay = null
        a.onended = null
        a.onerror = null
        a.pause()
        a.currentTime = 0
        a.removeAttribute("src")
        a.load()
      } catch {
        /* ignore */
      }
    }

    // 4. Release the blob URL so the browser drops the buffered MP3.
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
  }, [])

  // ----- Cleanup on unmount -----
  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop()
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      hardStopPlayback()
    }
  }, [hardStopPlayback])

  // ----- If no session_id, bounce back to setup -----
  useEffect(() => {
    if (!sessionId) {
      router.replace("/setup")
    }
  }, [sessionId, router])

  // ----- Recording -----
  const startRecording = useCallback(async () => {
    // Don't start if we're not idle, or if a start is already in flight.
    if (phase !== "idle" || startAborterRef.current) return

    const aborter = { aborted: false }
    startAborterRef.current = aborter
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // User released before mic permission resolved — bail out cleanly.
      if (aborter.aborted) {
        stream.getTracks().forEach((t) => t.stop())
        setActiveStream(null)
        return
      }

      streamRef.current = stream
      setActiveStream(stream)
      chunksRef.current = []

      // Pick the best mime the browser supports
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ]
      const mimeType = candidates.find((t) => MediaRecorder.isTypeSupported(t)) || ""
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start()
      setPhase("recording")
      setUserText("")
      setAiText("")

      // If the user released *during* the async setup above, the press handler
      // could not stop the recorder (it didn't exist yet). Catch up now.
      if (aborter.aborted) {
        void stopRecordingAndProcess()
      }
    } catch {
      setError("Could not access the microphone. Check your browser permission.")
      setMuted(true)
      setPhase("idle")
    } finally {
      // Only clear if this is still the active aborter.
      if (startAborterRef.current === aborter) {
        startAborterRef.current = null
      }
    }
    // stopRecordingAndProcess is stable enough; including it would create a cycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const stopRecordingAndProcess = useCallback(async () => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === "inactive") {
      setPhase("idle")
      return
    }

    // Wait for the recorder to fully flush before reading chunks
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
    })
    try {
      recorder.stop()
    } catch {
      /* ignore */
    }
    await stopped
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setActiveStream(null)

    const blob = new Blob(chunksRef.current, {
      type: recorder.mimeType || "audio/webm",
    })
    chunksRef.current = []

    if (blob.size < 1000) {
      // Too short / silent — skip
      setPhase("idle")
      return
    }

    // Tag this turn so we can detect interruptions in late-resolving awaits.
    const myGen = ++genIdRef.current
    const isStale = () => myGen !== genIdRef.current

    try {
      setPhase("transcribing")
      const text = await transcribeAudio(blob)
      if (isStale()) return
      if (!text || !text.trim()) {
        setPhase("idle")
        return
      }
      setUserText(text)

      // Stream the assistant response into a buffer (don't reveal yet — wait for audio)
      setPhase("thinking")
      setAiText("")
      const ac = new AbortController()
      abortRef.current = ac
      const full = await streamMessage(sessionId, text, undefined, ac.signal)
      if (isStale()) return

      if (!full || !full.trim()) {
        setPhase("idle")
        return
      }

      // Request TTS for the full reply (separate AC so an interrupt can
      // kill the MP3 download independently of the chat stream).
      const speakAc = new AbortController()
      speakAbortRef.current = speakAc
      let audioBlob: Blob
      try {
        audioBlob = await speakText(full, speakAc.signal)
      } catch {
        if (isStale()) return
        // Voice failed — fall back to revealing the text instantly so the user still sees the reply
        setAiText(full)
        setError("Voice synthesis failed. The text response is still available.")
        setPhase("idle")
        return
      }
      if (isStale()) return

      // Prepare audio element
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
      const url = URL.createObjectURL(audioBlob)
      audioUrlRef.current = url

      const audioEl = audioElRef.current
      if (!audioEl) {
        setAiText(full)
        setPhase("idle")
        return
      }

      // Tokenize once for word-by-word reveal
      const words = full.split(/(\s+)/) // keep whitespace tokens to preserve spacing
      const wordCount = words.filter((w) => w.trim().length > 0).length

      const stopReveal = () => {
        if (revealTimerRef.current) {
          clearInterval(revealTimerRef.current)
          revealTimerRef.current = null
        }
      }

      audioEl.src = url
      audioEl.onplay = () => {
        if (isStale()) return
        // Time the reveal to match the audio duration (fallback: ~3 words/sec)
        stopReveal()
        const dur =
          isFinite(audioEl.duration) && audioEl.duration > 0 ? audioEl.duration : wordCount / 3
        const intervalMs = Math.max(40, (dur * 1000) / Math.max(wordCount, 1))
        let i = 0
        setAiText("")
        revealTimerRef.current = setInterval(() => {
          if (isStale()) {
            stopReveal()
            return
          }
          // Advance to the next non-whitespace token, including any trailing whitespace
          let next = ""
          while (i < words.length) {
            const tok = words[i++]
            next += tok
            if (tok.trim().length > 0) break
          }
          setAiText((prev) => prev + next)
          if (i >= words.length) stopReveal()
        }, intervalMs)
      }
      audioEl.onended = () => {
        stopReveal()
        if (isStale()) return
        // Make sure the full text is shown even if reveal lagged
        setAiText(full)
        setPhase("idle")
      }
      audioEl.onerror = () => {
        stopReveal()
        if (isStale()) return
        setAiText(full)
        setPhase("idle")
      }

      setPhase("speaking")
      try {
        await audioEl.play()
      } catch {
        if (isStale()) return
        // Autoplay blocked — show the text immediately so the user still gets the reply
        stopReveal()
        setAiText(full)
        setPhase("idle")
      }
    } catch (e) {
      // Aborts during interrupt are expected — stay silent.
      if (e instanceof DOMException && e.name === "AbortError") return
      if (isStale()) return
      setError("Something went wrong. Please try again.")
      setPhase("idle")
    }
  }, [sessionId])

  // ----- Press / toggle handlers -----
  // These call start/stop directly so there's no race between `muted` state
  // updates and async getUserMedia setup.
  const handlePressStart = useCallback(() => {
    if (pressedRef.current) return
    // Allow interrupting while CogniFlip is thinking or speaking — hard-stop first.
    if (phase === "thinking" || phase === "speaking") {
      hardStopPlayback()
      setAiText("")
      setPhase("idle")
    } else if (phase !== "idle") {
      return
    }
    pressedRef.current = true
    setMuted(false)
    void startRecording()
  }, [phase, startRecording, hardStopPlayback])

  const handlePressEnd = useCallback(() => {
    if (!pressedRef.current) return
    pressedRef.current = false
    setMuted(true)

    // Cancel any in-flight start (released before mic permission resolved).
    if (startAborterRef.current) {
      startAborterRef.current.aborted = true
    }

    // Stop & process if we're actively recording.
    if (recorderRef.current && recorderRef.current.state === "recording") {
      void stopRecordingAndProcess()
    }
  }, [stopRecordingAndProcess])

  const handleDesktopToggle = useCallback(() => {
    if (phase === "thinking" || phase === "speaking") {
      // Interrupt CogniFlip and start a new recording immediately.
      hardStopPlayback()
      setAiText("")
      setPhase("idle")
      pressedRef.current = true
      setMuted(false)
      void startRecording()
      return
    }
    if (phase === "idle" && muted) {
      pressedRef.current = true
      setMuted(false)
      void startRecording()
    } else if (phase === "recording" && !muted) {
      pressedRef.current = false
      setMuted(true)
      void stopRecordingAndProcess()
    }
  }, [phase, muted, startRecording, stopRecordingAndProcess, hardStopPlayback])

  // On mobile, default to muted; on desktop, default to muted too (mic permission gate)
  useEffect(() => {
    setMuted(true)
  }, [isMobile])

  // ----- Spacebar push-to-talk (desktop) -----
  // Hold Space to start recording, release to send. We bind only on desktop
  // because mobile has the on-screen mic button. Repeat events (held key auto-
  // repeat) are ignored. We also ignore the press if the user is typing in an
  // input/textarea/contenteditable element so accidental Space keypresses in
  // future form fields never hijack the mic.
  useEffect(() => {
    if (!mounted || isMobile) return

    const isTyping = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null
      if (!el) return false
      const tag = el.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
      if (el.isContentEditable) return true
      return false
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return
      if (e.repeat) return
      if (isTyping(e.target)) return
      // Stop the page from scrolling when Space is held to talk.
      e.preventDefault()
      handlePressStart()
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return
      if (isTyping(e.target)) return
      e.preventDefault()
      handlePressEnd()
    }

    // If the window loses focus mid-press, treat it as a release so we don't
    // strand the recorder in "pressed" state forever.
    const onBlur = () => {
      if (pressedRef.current) handlePressEnd()
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
    }
  }, [mounted, isMobile, handlePressStart, handlePressEnd])

  // Keep the transcript scrolled to the latest token as text streams in.
  useEffect(() => {
    const m = mobileTranscriptRef.current
    if (m) m.scrollTop = m.scrollHeight
    const d = desktopTranscriptRef.current
    if (d) d.scrollTop = d.scrollHeight
  }, [aiText, userText])

  // ----- Derive orb state + label -----
  const orbState: OrbState =
    phase === "recording"
      ? "listening"
      : phase === "thinking" || phase === "speaking"
        ? "speaking"
        : "idle"

  // While recording, the orb mirrors mic RMS in real time. While CogniFlip is
  // thinking we pulse a soft synthetic amplitude so the user can see the
  // assistant is working. While speaking we pulse slightly higher.
  const [synthPulse, setSynthPulse] = useState(0)
  useEffect(() => {
    if (phase !== "thinking" && phase !== "speaking") {
      setSynthPulse(0)
      return
    }
    const start = performance.now()
    let raf = 0
    const period = phase === "speaking" ? 900 : 1400
    const peak = phase === "speaking" ? 0.55 : 0.32
    const tick = () => {
      const t = (performance.now() - start) / period
      // Smooth sin² wave, never zero, so the orb keeps "alive" feel.
      const v = Math.pow(Math.sin(t * Math.PI), 2) * peak + 0.08
      setSynthPulse(v)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  const orbAmplitude = phase === "recording" ? micAmplitude : synthPulse

  const headerSubtitle =
    phase === "recording"
      ? "You're speaking…"
      : phase === "transcribing"
        ? "Transcribing…"
        : phase === "thinking"
          ? "CogniFlip thinking…"
          : phase === "speaking"
            ? "CogniFlip replying…"
            : muted
              ? "Mic muted"
              : "Ready"

  // ----- End session -----
  const handleEnd = () => {
    hardStopPlayback()
    try {
      recorderRef.current?.stop()
    } catch {
      /* ignore */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setActiveStream(null)
    const qs = new URLSearchParams({
      session_id: sessionId,
      topic: topicParam,
      persona,
    })
    router.push(`/processing?${qs.toString()}`)
  }

  // ----- Transcript content -----
  const liveText = aiText || userText || (phase === "recording" ? "Listening…" : "")
  const showCursor = phase === "recording" || phase === "thinking"

  return (
    <PhoneShell size="wide">
      <AppHeader title="AI voice assistant" subtitle={headerSubtitle} backHref="/setup" />

      {/* Hidden audio element for TTS playback */}
      <audio ref={audioElRef} className="hidden" />

      {/* Mobile layout */}
      <div className="lg:hidden flex flex-col min-h-[calc(100dvh-72px)]">
        <div className="flex-1 grid place-items-center px-6 pt-2 sm:pt-6">
          <VoiceOrb state={orbState} size={orbSize} amplitude={orbAmplitude} />
        </div>

        <div className="px-6 sm:px-10 pb-3 max-w-2xl mx-auto w-full min-w-0">
          {userText && aiText && (
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
              You:{" "}
              <span className="normal-case tracking-normal text-foreground/70 line-clamp-2 inline align-top break-words">
                {userText}
              </span>
            </p>
          )}
          <div
            ref={mobileTranscriptRef}
            className="h-[140px] sm:h-[160px] overflow-y-auto overflow-x-hidden overscroll-contain"
          >
            <p className="text-[22px] sm:text-[26px] leading-[1.25] tracking-tight font-medium text-pretty break-words text-center sm:text-left">
              {liveText}
              {showCursor && (
                <span
                  className="inline-block w-[2px] h-[22px] sm:h-[26px] align-middle ml-0.5 bg-foreground/60 animate-pulse"
                  aria-hidden
                />
              )}
            </p>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-[12.5px] text-[oklch(0.55_0.18_25)] break-words">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 pb-6">
          <WaveVisualizer active={phase === "recording" || phase === "speaking"} />
        </div>

        <div className="pb-8 sm:pb-12">
          <ControlPanel
            muted={muted}
            pushToTalk
            onPressStart={handlePressStart}
            onPressEnd={handlePressEnd}
            onClose={handleEnd}
            onPersona={() => router.push("/setup")}
          />
        </div>
      </div>

      {/* Desktop layout */}
      <main className="hidden lg:grid grid-cols-[1.05fr_1fr] gap-12 xl:gap-16 items-center px-8 pb-12 min-h-[calc(100dvh-110px)]">
        <div className="relative grid place-items-center">
          <VoiceOrb state={orbState} size={orbSize} amplitude={orbAmplitude} />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card/85 backdrop-blur-md border border-white/60 shadow-[0_10px_24px_-12px_oklch(0.5_0.05_330/0.35)] text-[12.5px] text-foreground/70 whitespace-nowrap">
            <span className="inline-flex items-center gap-2">
              <span
                className={
                  "size-1.5 rounded-full " +
                  (orbState === "speaking"
                    ? "bg-[oklch(0.78_0.18_25)] animate-pulse"
                    : orbState === "listening"
                      ? "bg-[oklch(0.78_0.16_160)] animate-pulse"
                      : "bg-muted-foreground/50")
                }
              />
              {headerSubtitle}
            </span>
          </div>

          {/* Spacebar push-to-talk hint — sits unobtrusively below the status
              chip. We pulse it lightly while idle to draw the eye, and swap it
              to a "Recording" indicator while Space is being held so the
              affordance feels alive rather than decorative. */}
          <div
            className={
              "absolute -bottom-16 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/70 backdrop-blur-md border border-white/60 text-[12px] text-foreground/65 transition " +
              (phase === "recording" ? "ring-2 ring-[oklch(0.78_0.16_160)]/40" : "")
            }
            aria-hidden
          >
            <kbd className="grid place-items-center min-w-[44px] h-[22px] px-2 rounded-md bg-foreground/8 border border-foreground/10 text-[11px] font-medium tracking-tight text-foreground/80">
              Space
            </kbd>
            <span>
              {phase === "recording"
                ? "Recording — release to send"
                : "Hold to talk"}
            </span>
          </div>
        </div>

        <div className="space-y-6 max-w-xl min-w-0">
          {userText && (
            <div className="space-y-1 min-w-0">
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                You
              </p>
              <p className="text-[16px] leading-relaxed text-foreground/70 text-pretty break-words line-clamp-3">
                {userText}
              </p>
            </div>
          )}

          <div className="space-y-2 min-w-0">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
              {userText ? "CogniFlip" : "Live transcript"}
            </p>
            <div
              ref={desktopTranscriptRef}
              className="h-[200px] xl:h-[240px] overflow-y-auto overflow-x-hidden overscroll-contain pr-1"
            >
              <p className="text-[26px] xl:text-[30px] leading-[1.22] tracking-tight font-medium text-pretty break-words">
                {liveText || (
                  <span className="text-foreground/40">
                    Press the mic and start speaking. {topicParam && `Topic: "${topicParam}".`}
                  </span>
                )}
                {showCursor && (
                  <span
                    className="inline-block w-[2px] h-[26px] align-middle ml-0.5 bg-foreground/60 animate-pulse"
                    aria-hidden
                  />
                )}
              </p>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-[oklch(0.55_0.18_25)] break-words">
              {error}
            </p>
          )}

          <div className="rounded-3xl bg-card/70 backdrop-blur-md border border-white/60 px-6 py-5 shadow-[0_8px_24px_-16px_oklch(0.5_0.05_330/0.3)]">
            <div className="flex items-center gap-4">
              <p className="text-[12.5px] uppercase tracking-[0.16em] text-muted-foreground shrink-0">
                Audio
              </p>
              <div className="flex-1">
                <WaveVisualizer active={phase === "recording" || phase === "speaking"} />
              </div>
            </div>
          </div>

          <ControlPanel
            muted={muted}
            onToggleMute={handleDesktopToggle}
            onClose={handleEnd}
            onPersona={() => router.push("/setup")}
          />
        </div>
      </main>
    </PhoneShell>
  )
}

export default function SessionPage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <SessionInner />
      </Suspense>
    </AuthGuard>
  )
}
