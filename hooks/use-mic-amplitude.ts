"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Reads RMS amplitude (0–1) from a live MediaStream so we can drive the
 * VoiceOrb directly from the mic. Uses a single AudioContext + AnalyserNode,
 * sampled inside requestAnimationFrame, with exponential smoothing so the
 * orb glides instead of jittering.
 *
 * Pass `null` (or stop the stream) to release resources cleanly.
 */
export function useMicAmplitude(stream: MediaStream | null) {
  const [amplitude, setAmplitude] = useState(0)
  // Refs so we don't re-create the audio graph on every render.
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const smoothedRef = useRef(0)

  useEffect(() => {
    if (!stream) {
      setAmplitude(0)
      return
    }

    let cancelled = false
    // Lazily create the AudioContext — Safari requires a gesture, but the
    // session page only mounts this hook after the user has already pressed
    // the mic button (which is a user gesture), so this is safe.
    let ctx: AudioContext
    try {
      ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)()
    } catch {
      return
    }
    ctxRef.current = ctx

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.4
    analyserRef.current = analyser

    let source: MediaStreamAudioSourceNode
    try {
      source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source
    } catch {
      return
    }

    const buf = new Uint8Array(analyser.fftSize)

    const tick = () => {
      if (cancelled) return
      analyser.getByteTimeDomainData(buf)
      // Compute RMS around 128 (silence baseline for byte time-domain data).
      let sum = 0
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / buf.length)
      // Map RMS into a "felt" range. 0.02 floor so background noise doesn't
      // visibly drive the orb; ~0.35 cap so a typical voice fills the range.
      const norm = Math.max(0, Math.min(1, (rms - 0.02) / 0.33))
      // Asymmetric smoothing — fast attack, slower release feels musical.
      const prev = smoothedRef.current
      const next =
        norm > prev ? prev + (norm - prev) * 0.55 : prev + (norm - prev) * 0.18
      smoothedRef.current = next
      setAmplitude(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      try {
        sourceRef.current?.disconnect()
      } catch {
        /* noop */
      }
      try {
        void ctxRef.current?.close()
      } catch {
        /* noop */
      }
      ctxRef.current = null
      analyserRef.current = null
      sourceRef.current = null
      smoothedRef.current = 0
      setAmplitude(0)
    }
  }, [stream])

  return amplitude
}
