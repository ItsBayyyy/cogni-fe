"use client"

/**
 * API client for the CogniFlip backend.
 * Requests stay same-origin and are relayed by the Next.js BFF. The BFF keeps
 * the backend JWT in an HttpOnly cookie, so browser JavaScript never sees it.
 */
export const API_BASE_URL = "/api/backend"

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

function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  return extra
}

function safeErrorMessage(status: number): string {
  if (status === 400 || status === 422) return "The request is invalid. Please check your input."
  if (status === 401) return "Your session has expired. Please sign in again."
  if (status === 403) return "You do not have permission to perform this action."
  if (status === 404) return "The requested resource was not found."
  if (status === 413) return "The uploaded file is too large."
  if (status === 415) return "This file type is not supported."
  if (status === 429) return "Too many attempts. Please wait before trying again."
  return "The service is temporarily unavailable. Please try again."
}

async function request<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init
  const baseHeaders = authHeaders(
    json ? { "Content-Type": "application/json" } : {},
  )
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "same-origin",
    headers: { ...baseHeaders, ...(headers as Record<string, string>) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  if (!res.ok) {
    throw new ApiError(safeErrorMessage(res.status), res.status)
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
  const headers = authHeaders({
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  })

  const res = await fetch(
    `${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}/message`,
    {
      method: "POST",
      credentials: "same-origin",
      headers,
      body: JSON.stringify({ content }),
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
  const headers = authHeaders() // no Content-Type — let browser set boundary
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
    credentials: "same-origin",
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
  const headers = authHeaders({ "Content-Type": "application/json" })
  const res = await fetch(`${API_BASE_URL}/voice/speak`, {
    method: "POST",
    credentials: "same-origin",
    headers,
    body: JSON.stringify({ text }),
    signal,
  })
  if (!res.ok) {
    throw new ApiError(`TTS failed: ${res.status} ${res.statusText}`, res.status)
  }
  return res.blob()
}
