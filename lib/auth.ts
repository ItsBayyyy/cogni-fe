"use client"

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL 
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth`
  : "https://cogni-be-production.up.railway.app/api/v1/auth"

export interface AuthUser {
  id: string
  email: string
  name: string
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-change"))
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("cogniflip_user")
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

export async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  return localStorage.getItem("cogniflip_token")
}

function extractError(res: Response, data: any, fallback: string): string {
  if (res.status === 429) {
    return data?.detail || data?.error || "Too many attempts. Please wait a minute before trying again."
  }
  if (data?.detail) {
    if (typeof data.detail === "string") return data.detail
    if (Array.isArray(data.detail)) {
      return data.detail.map((d: any) => d.msg || d.message || "").filter(Boolean).join("; ") || fallback
    }
  }
  if (data?.error && typeof data.error === "string") return data.error
  return fallback
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  if (!isValidEmail(email)) return { ok: false, error: "Please enter a valid email." }
  if (password.length < 4) return { ok: false, error: "Password is too short." }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) {
        return { ok: false, error: extractError(res, data, "Sign in failed") }
    }
    
    localStorage.setItem("cogniflip_token", data.access_token)
    localStorage.setItem("cogniflip_user", JSON.stringify(data.user))
    notifyAuthChange()
    return { ok: true, user: data.user }
  } catch (err) {
    return { ok: false, error: "Network error" }
  }
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!name.trim()) return { ok: false, error: "Please enter your name." }
  if (!isValidEmail(email)) return { ok: false, error: "Please enter a valid email." }
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." }
  if (!/[A-Z]/.test(password)) return { ok: false, error: "Password must contain at least one uppercase letter." }
  if (!/\d/.test(password)) return { ok: false, error: "Password must contain at least one digit." }

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    })
    const data = await res.json()
    if (!res.ok) {
        return { ok: false, error: extractError(res, data, "Sign up failed") }
    }
    
    return { ok: true }
  } catch (err) {
    return { ok: false, error: "Network error" }
  }
}

export async function verifyOtp(
  email: string,
  otpCode: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp_code: otpCode })
    })
    const data = await res.json()
    if (!res.ok) {
        return { ok: false, error: extractError(res, data, "Verification failed") }
    }
    
    localStorage.setItem("cogniflip_token", data.access_token)
    localStorage.setItem("cogniflip_user", JSON.stringify(data.user))
    notifyAuthChange()
    return { ok: true, user: data.user }
  } catch (err) {
    return { ok: false, error: "Network error" }
  }
}

export async function resendOtp(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    })
    const data = await res.json()
    if (!res.ok) {
        return { ok: false, error: extractError(res, data, "Failed to resend OTP") }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: "Network error" }
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isValidEmail(email)) return { ok: false, error: "Please enter a valid email." }
  try {
    const res = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: extractError(res, data, "Failed to send reset code") }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: "Network error" }
  }
}

export async function verifyResetPasswordCode(
  email: string,
  otpCode: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/verify-reset-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp_code: otpCode })
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: extractError(res, data, "Invalid reset code") }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: "Network error" }
  }
}

export async function confirmPasswordReset(
  email: string,
  otpCode: string,
  newPassword: string,
): Promise<{ ok: true; detail: string } | { ok: false; error: string }> {
  if (newPassword.length < 8) return { ok: false, error: "Password must be at least 8 characters." }
  if (!/[A-Z]/.test(newPassword)) return { ok: false, error: "Password must contain at least one uppercase letter." }
  if (!/\d/.test(newPassword)) return { ok: false, error: "Password must contain at least one digit." }

  try {
    const res = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword })
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: extractError(res, data, "Failed to reset password") }
    }
    return { ok: true, detail: data.detail || "Password reset successfully." }
  } catch (err) {
    return { ok: false, error: "Network error" }
  }
}

export async function signOut() {
  if (typeof window !== "undefined") {
      localStorage.removeItem("cogniflip_token")
      localStorage.removeItem("cogniflip_user")
      notifyAuthChange()
  }
}
