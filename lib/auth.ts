"use client"

const API_URL = "/api/backend/auth"

export interface AuthUser {
  id: string
  email: string
  name: string
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isBcryptCompatible(password: string): boolean {
  return new TextEncoder().encode(password).length <= 72
}

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-change"))
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (typeof window === "undefined") return null
  try {
    const res = await fetch(`${API_URL}/me`, {
      credentials: "same-origin",
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as AuthUser
  } catch {
    return null
  }
}

function extractError(res: Response, fallback: string): string {
  if (res.status === 429) {
    return "Too many attempts. Please wait before trying again."
  }
  if (res.status === 422) return "Please check the submitted fields."
  return fallback
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  if (!isValidEmail(email)) return { ok: false, error: "Please enter a valid email." }
  if (password.length < 4) return { ok: false, error: "Password is too short." }
  if (!isBcryptCompatible(password)) return { ok: false, error: "Password is too long." }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) {
        return { ok: false, error: extractError(res, "Invalid email or password.") }
    }

    notifyAuthChange()
    return { ok: true, user: data.user }
  } catch {
    return { ok: false, error: "Network error" }
  }
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!name.trim()) return { ok: false, error: "Please enter your name." }
  if (name.trim().length > 100) return { ok: false, error: "Name must be at most 100 characters." }
  if (!isValidEmail(email)) return { ok: false, error: "Please enter a valid email." }
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." }
  if (!/[A-Z]/.test(password)) return { ok: false, error: "Password must contain at least one uppercase letter." }
  if (!/\d/.test(password)) return { ok: false, error: "Password must contain at least one digit." }
  if (!isBcryptCompatible(password)) return { ok: false, error: "Password is too long." }

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    })
    if (!res.ok) {
        return { ok: false, error: extractError(res, "Could not create the account.") }
    }
    
    return { ok: true }
  } catch {
    return { ok: false, error: "Network error" }
  }
}

export async function verifyOtp(
  email: string,
  otpCode: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  try {
    if (!/^\d{6}$/.test(otpCode)) {
      return { ok: false, error: "Enter the 6-digit verification code." }
    }
    const res = await fetch(`${API_URL}/verify-otp`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp_code: otpCode })
    })
    const data = await res.json()
    if (!res.ok) {
        return { ok: false, error: extractError(res, "Invalid or expired verification code.") }
    }

    notifyAuthChange()
    return { ok: true, user: data.user }
  } catch {
    return { ok: false, error: "Network error" }
  }
}

export async function resendOtp(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/resend-otp`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    })
    if (!res.ok) {
        return { ok: false, error: extractError(res, "Could not resend the verification code.") }
    }
    return { ok: true }
  } catch {
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
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    })
    if (!res.ok) {
      return { ok: false, error: extractError(res, "Could not start password recovery.") }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: "Network error" }
  }
}

export async function verifyResetPasswordCode(
  email: string,
  otpCode: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^\d{6}$/.test(otpCode)) {
    return { ok: false, error: "Enter the 6-digit reset code." }
  }
  try {
    const res = await fetch(`${API_URL}/verify-reset-otp`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp_code: otpCode })
    })
    if (!res.ok) {
      return { ok: false, error: extractError(res, "Invalid or expired reset code.") }
    }
    return { ok: true }
  } catch {
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
  if (!isBcryptCompatible(newPassword)) return { ok: false, error: "Password is too long." }
  if (!/^\d{6}$/.test(otpCode)) return { ok: false, error: "Enter the 6-digit reset code." }

  try {
    const res = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword })
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: extractError(res, "Could not reset the password.") }
    }
    return { ok: true, detail: data.detail || "Password reset successfully." }
  } catch {
    return { ok: false, error: "Network error" }
  }
}

export async function signOut(): Promise<boolean> {
  if (typeof window === "undefined") return false

  try {
    const res = await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    })
    if (!res.ok) return false
    notifyAuthChange()
    return true
  } catch {
    return false
  }
}

export async function signInDemo(): Promise<
  { ok: true; user: AuthUser } | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${API_URL}/demo`, {
      method: "POST",
      credentials: "same-origin",
    })
    const data = await res.json()
    if (!res.ok) {
      return {
        ok: false,
        error: extractError(res, "Demo access is temporarily unavailable."),
      }
    }

    notifyAuthChange()
    return { ok: true, user: data.user }
  } catch {
    return { ok: false, error: "Network error" }
  }
}
