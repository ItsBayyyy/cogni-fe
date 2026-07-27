import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const TOKEN_ENDPOINTS = new Set(["auth/login", "auth/verify-otp", "auth/demo"])
const SAFE_RESPONSE_HEADERS = new Set([
  "cache-control",
  "content-disposition",
  "content-type",
  "retry-after",
])

function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-cogniflip-session"
    : "cogniflip-session"
}

function backendBaseUrl(): string {
  const configured =
    process.env.COGNIFLIP_API_BASE_URL ||
    "https://cogni-be-production.up.railway.app/api/v1"
  return configured.replace(/\/+$/, "")
}

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  if (origin && origin !== request.nextUrl.origin) return false

  const fetchSite = request.headers.get("sec-fetch-site")
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none"
}

function responseHeaders(upstream: Response): Headers {
  const headers = new Headers()
  for (const [key, value] of upstream.headers) {
    if (SAFE_RESPONSE_HEADERS.has(key.toLowerCase())) headers.set(key, value)
  }
  headers.set("X-Content-Type-Options", "nosniff")
  return headers
}

async function relay(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD" && !isSameOriginRequest(request)) {
    return NextResponse.json({ code: "CSRF_BLOCKED" }, { status: 403 })
  }

  const { path } = await context.params
  const routePath = path.map(encodeURIComponent).join("/")
  const cookieStore = await cookies()
  const sessionCookie = sessionCookieName()

  if (routePath === "auth/logout") {
    cookieStore.delete(sessionCookie)
    return new NextResponse(null, { status: 204 })
  }

  const target = new URL(`${backendBaseUrl()}/${routePath}`)
  target.search = request.nextUrl.search

  const headers = new Headers()
  for (const key of ["accept", "content-type"]) {
    const value = request.headers.get(key)
    if (value) headers.set(key, value)
  }

  const token = cookieStore.get(sessionCookie)?.value
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer()

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    })
  } catch {
    return NextResponse.json({ code: "UPSTREAM_UNAVAILABLE" }, { status: 503 })
  }

  if (upstream.status === 401 && token) cookieStore.delete(sessionCookie)

  if (TOKEN_ENDPOINTS.has(routePath) && upstream.ok) {
    const data = (await upstream.json()) as Record<string, unknown>
    const accessToken = typeof data.access_token === "string" ? data.access_token : null
    if (!accessToken) {
      return NextResponse.json({ code: "INVALID_UPSTREAM_RESPONSE" }, { status: 502 })
    }

    cookieStore.set(sessionCookie, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15,
    })

    const safeData = { ...data }
    delete safeData.access_token
    return NextResponse.json(safeData, {
      status: upstream.status,
      headers: responseHeaders(upstream),
    })
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders(upstream),
  })
}

export const dynamic = "force-dynamic"
export const GET = relay
export const POST = relay
export const PUT = relay
export const PATCH = relay
export const DELETE = relay
