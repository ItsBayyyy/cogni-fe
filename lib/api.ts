"use client"

import { getAccessToken } from "@/lib/auth"

/**
 * API client for the CogniFlip backend.
 * Base URL is configurable via NEXT_PUBLIC_API_BASE_URL,
 * defaulting to http://localhost:8000/api/v1 for local dev.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://cogni-be-production.up.railway.app/api/v1"

// ---------- Types ----------

export type BackendPersona = "friendly" | "strict" | "socratic"

export interface SessionStartResponse {
  session_id: string
  user_id: string
  topic: string
  persona: BackendPersona
  status: "active" | string
  created_at: string
}

export interface SessionListItem {
  session_id: string
  topic: string
  persona: BackendPersona
  created_at: string
}

export interface TranscriptMessage {
  id: string
  role: "user" | "student_agent"
  content: string
  created_at: string
}

export interface TranscriptResponse {
  session_id: string
  messages: TranscriptMessage[]
}

export interface EvaluateHighlight {
  type: "positive" | "negative"
  title: string
  description: string
}

export interface EvaluateResponse {
  overall_score: number
  highlights: EvaluateHighlight[]
  breakdown: {
    clarity: number
    depth: number
    pacing: number
    charisma: number
  }
}

// ---------- Persona helper ----------

export function toBackendPersona(p: string | null | undefined): BackendPersona {
  if (p === "friendly" || p === "strict" || p === "socratic") return p
  return "friendly"
}

// ---------- Internals ----------

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

async function authHeaders(extra: Record<string, string> = {}): Promise<HeadersInit> {
  const token = await getAccessToken()
  if (!token) {
    throw new ApiError("Not authenticated", 401)
  }
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init
  const baseHeaders = await authHeaders(
    json ? { "Content-Type": "application/json" } : {},
  )
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: { ...baseHeaders, ...(headers as Record<string, string>) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`
    try {
      const data = await res.json()
      if (data?.detail) {
        if (typeof data.detail === "string") {
          msg = data.detail
        } else if (Array.isArray(data.detail)) {
          msg = data.detail.map((d: Record<string, unknown>) => (d.msg || d.message || "") as string).filter(Boolean).join("; ") || "Validation error"
        } else {
          msg = "Request failed"
        }
      } else if (data?.message) msg = data.message
    } catch {
      /* ignore */
    }
    throw new ApiError(msg, res.status)
  }
  // Some endpoints may return empty responses
  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) return (await res.json()) as T
  return undefined as unknown as T
}

// ---------- Sessions ----------

export async function startSession(
  topic: string,
  persona: string,
): Promise<SessionStartResponse> {
  return request<SessionStartResponse>("/sessions/start", {
    method: "POST",
    json: { topic, persona: toBackendPersona(persona) },
  })
}

export async function listSessions(): Promise<SessionListItem[]> {
  return request<SessionListItem[]>("/sessions/", { method: "GET" })
}

export async function getTranscript(sessionId: string): Promise<TranscriptResponse> {
  return request<TranscriptResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/transcript`,
    { method: "GET" },
  )
}

// ---------- Chat (SSE) ----------

/**
 * Sends a user message and streams the assistant response via SSE.
 * Calls `onChunk` for every `data: {"content": "..."}` line.
 * Resolves with the full concatenated text when the stream emits `[DONE]`.
 */
export async function streamMessage(
  sessionId: string,
  content: string,
  onChunk?: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const headers = await authHeaders({
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  })

  const res = await fetch(
    `${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}/message`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ role: "user", content }),
      signal,
    },
  )

  if (!res.ok || !res.body) {
    throw new ApiError("Stream connection failed. Please try again.", res.status)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""
  let full = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE events are separated by blank lines
    const events = buffer.split(/\r?\n\r?\n/)
    buffer = events.pop() ?? ""

    for (const event of events) {
      const lines = event.split(/\r?\n/).filter(Boolean)
      for (const line of lines) {
        if (!line.startsWith("data:")) continue
        const data = line.slice(5).trim()
        if (data === "[DONE]") {
          return full
        }
        try {
          const parsed = JSON.parse(data) as { content?: string }
          if (parsed.content) {
            full += parsed.content
            onChunk?.(parsed.content)
          }
        } catch {
          // Some servers send raw text after `data:`
          full += data
          onChunk?.(data)
        }
      }
    }
  }
  return full
}

// ---------- Evaluate ----------

export async function evaluateSession(sessionId: string): Promise<EvaluateResponse> {
  return request<EvaluateResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/evaluate`,
    { method: "POST" },
  )
}

// ---------- Voice ----------

export async function transcribeAudio(blob: Blob): Promise<string> {
  const headers = await authHeaders() // no Content-Type — let browser set boundary
  const form = new FormData()
  // Use a sensible filename + extension based on the blob mime
  const ext = blob.type.includes("webm")
    ? "webm"
    : blob.type.includes("mp4")
      ? "m4a"
      : blob.type.includes("ogg")
        ? "ogg"
        : "wav"
  form.append("file", blob, `recording.${ext}`)

  const res = await fetch(`${API_BASE_URL}/voice/transcribe`, {
    method: "POST",
    headers,
    body: form,
  })
  if (!res.ok) {
    throw new ApiError(`Transcription failed: ${res.status} ${res.statusText}`, res.status)
  }
  const data = (await res.json()) as { text: string }
  return data.text
}

export async function speakText(text: string, signal?: AbortSignal): Promise<Blob> {
  const headers = await authHeaders({ "Content-Type": "application/json" })
  const res = await fetch(`${API_BASE_URL}/voice/speak`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
    signal,
  })
  if (!res.ok) {
    throw new ApiError(`TTS failed: ${res.status} ${res.statusText}`, res.status)
  }
  return res.blob()
}
