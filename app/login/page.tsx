"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, ShieldCheck } from "lucide-react"
import { PhoneShell } from "@/components/phone-shell"
import { VoiceOrb } from "@/components/voice-orb"
import { useAuth } from "@/hooks/use-auth"
import { signIn, signInDemo, signUp, verifyOtp, resendOtp, requestPasswordReset, verifyResetPasswordCode, confirmPasswordReset } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/brand-logo"

type Mode = "signin" | "signup" | "verify" | "forgot" | "reset_otp" | "reset_password"

const ONBOARDING_STORAGE_PREFIX = "cogniflip_onboarding_v1"

const PENDING_OTP_EMAIL_KEY = "cogniflip_pending_otp_email"
const PENDING_OTP_TIME_KEY = "cogniflip_pending_otp_time"
const PENDING_OTP_MODE_KEY = "cogniflip_pending_otp_mode"

function clearPendingVerify() {
  try {
    window.sessionStorage.removeItem(PENDING_OTP_EMAIL_KEY)
    window.sessionStorage.removeItem(PENDING_OTP_TIME_KEY)
    window.sessionStorage.removeItem(PENDING_OTP_MODE_KEY)
  } catch {}
}

function savePendingVerify(email: string, mode: "verify" | "reset_otp" | "reset_password") {
  try {
    window.sessionStorage.setItem(PENDING_OTP_EMAIL_KEY, email)
    window.sessionStorage.setItem(PENDING_OTP_TIME_KEY, Date.now().toString())
    window.sessionStorage.setItem(PENDING_OTP_MODE_KEY, mode)
  } catch {}
}

function resolvePostAuthHref(next: string, userId: string): string {
  if (next !== "/setup") return next
  try {
    const seen = window.localStorage.getItem(`${ONBOARDING_STORAGE_PREFIX}_${userId}`)
    if (seen) return "/setup"
  } catch {}
  return "/setup?onboarding=1"
}

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/setup"
  const { user, loading } = useAuth()

  const [mode, setMode] = useState<Mode>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")
  
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [orbSize, setOrbSize] = useState(280)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    setMounted(true)
    try {
      const savedEmail = window.sessionStorage.getItem(PENDING_OTP_EMAIL_KEY)
      const savedTimeStr = window.sessionStorage.getItem(PENDING_OTP_TIME_KEY)
      const savedMode = window.sessionStorage.getItem(PENDING_OTP_MODE_KEY) as Mode | null
      if (savedEmail && (savedMode === "verify" || savedMode === "reset_otp" || savedMode === "reset_password")) {
        setEmail(savedEmail)
        setMode(savedMode)
        if (savedTimeStr) {
          const elapsed = Math.floor((Date.now() - parseInt(savedTimeStr, 10)) / 1000)
          if (elapsed < 60) {
            setCooldown(60 - elapsed)
          }
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!mounted) return
    const update = () => {
      const w = window.innerWidth
      if (w >= 1280) setOrbSize(440)
      else if (w >= 1024) setOrbSize(380)
      else setOrbSize(320)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [mounted])

  useEffect(() => {
    if (!loading && user) router.replace(resolvePostAuthHref(next, user.id))
  }, [user, loading, next, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setSubmitting(true)
    
    if (mode === "signin") {
        const result = await signIn(email.trim(), password)
        setSubmitting(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        router.replace(resolvePostAuthHref(next, result.user.id))
    } else if (mode === "signup") {
        const result = await signUp(name.trim(), email.trim(), password)
        setSubmitting(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        // Switch to OTP verify mode
        setMode("verify")
        setCooldown(60)
        savePendingVerify(email.trim(), "verify")
        setSuccessMsg("We sent a 6-digit code to your email.")
    } else if (mode === "verify") {
        const result = await verifyOtp(email.trim(), otp.trim())
        setSubmitting(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        clearPendingVerify()
        router.replace(resolvePostAuthHref(next, result.user.id))
    } else if (mode === "forgot") {
        const result = await requestPasswordReset(email.trim())
        setSubmitting(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        setMode("reset_otp")
        setCooldown(60)
        savePendingVerify(email.trim(), "reset_otp")
        setSuccessMsg("We sent a 6-digit reset code to your email.")
    } else if (mode === "reset_otp") {
        const result = await verifyResetPasswordCode(email.trim(), otp.trim())
        setSubmitting(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        setMode("reset_password")
        savePendingVerify(email.trim(), "reset_password")
        setSuccessMsg("Reset code verified! Please enter your new password.")
    } else if (mode === "reset_password") {
        if (newPassword !== confirmPassword) {
            setSubmitting(false)
            setError("Passwords do not match.")
            return
        }
        const result = await confirmPasswordReset(email.trim(), otp.trim(), newPassword)
        setSubmitting(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        clearPendingVerify()
        setMode("signin")
        setPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setOtp("")
        setSuccessMsg(result.detail || "Password reset successfully. Please sign in.")
    }
  }

  const handleResendOtp = async () => {
      if (resending || submitting || cooldown > 0) return
      setError(null)
      setSuccessMsg(null)
      setResending(true)
      const res = mode === "reset_otp" ? await requestPasswordReset(email.trim()) : await resendOtp(email.trim())
      setResending(false)
      if (res.ok) {
          setCooldown(60)
          try {
            window.sessionStorage.setItem(PENDING_OTP_TIME_KEY, Date.now().toString())
          } catch {}
          setSuccessMsg(mode === "reset_otp" ? "New reset code sent to your email." : "New code sent to your email.")
      } else {
          setError(res.error)
          // Synchronize cooldown timer if backend returned remaining seconds (e.g., "wait 45 seconds")
          const match = res.error.match(/wait (\d+) seconds/i)
          if (match && match[1]) {
              setCooldown(parseInt(match[1], 10))
          }
      }
  }

  const handleDemoLogin = async () => {
    if (submitting) return
    setError(null)
    setSuccessMsg(null)
    setSubmitting(true)
    const result = await signInDemo()
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.replace(resolvePostAuthHref(next, result.user.id))
  }

  return (
    <PhoneShell size="wide">
      <header className="px-4 sm:px-8 pt-5 sm:pt-6 pb-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
        <BrandLogo size={32} priority />
          <span className="text-[15px] font-semibold tracking-tight">CogniFlip</span>
        </Link>
      </header>

      <main className="px-4 sm:px-8 pb-12 pt-4 lg:pt-0 lg:flex lg:items-center lg:min-h-[calc(100dvh-100px)]">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-center w-full">
          <div className="hidden lg:flex flex-col items-center lg:items-start gap-8 order-2 lg:order-1">
            <div className="relative">
              <VoiceOrb state="idle" size={orbSize} />
            </div>
            <div className="space-y-3 max-w-md text-center lg:text-left">
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                Welcome back
              </p>
              <h2 className="text-[32px] xl:text-[40px] font-semibold tracking-tight leading-[1.05] text-balance">
                Pick up where your voice left off.
              </h2>
              <p className="text-[15px] text-muted-foreground leading-relaxed text-pretty">
                Your sessions, reports, and personas — all waiting for you.
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2 max-w-md w-full mx-auto">
            <div className="lg:hidden text-center space-y-3 mb-6">
              <div className="grid place-items-center mx-auto mb-1">
                <VoiceOrb state="idle" size={92} />
              </div>
              <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-tight text-balance">
                {mode === "signin"
                  ? "Welcome back"
                  : mode === "signup"
                  ? "Create your account"
                  : mode === "verify" || mode === "reset_otp"
                  ? "Check your email"
                  : mode === "forgot"
                  ? "Reset your password"
                  : "Set new password"}
              </h1>
              <p className="text-[14px] text-muted-foreground leading-relaxed text-pretty max-w-sm mx-auto">
                {mode === "signin"
                  ? "Sign in to start a new session or revisit a report."
                  : mode === "signup"
                  ? "It only takes a moment. No credit card, no setup."
                  : mode === "verify"
                  ? "We've sent a 6-digit verification code to your email."
                  : mode === "forgot"
                  ? "Enter your email address and we'll send you a 6-digit reset code."
                  : mode === "reset_otp"
                  ? "We've sent a 6-digit password reset code to your email."
                  : "Enter your strong new password below."}
              </p>
            </div>

            <div className="rounded-3xl bg-card/85 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_-24px_oklch(0.5_0.05_330/0.45)] p-5 sm:p-7">
              {(mode === "signin" || mode === "signup") && (
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-foreground/5 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin")
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className={cn(
                        "h-10 rounded-full text-[13.5px] font-medium tracking-tight transition",
                        mode === "signin"
                          ? "bg-background text-foreground shadow-[0_4px_12px_-6px_oklch(0.2_0.02_60/0.25)]"
                          : "text-muted-foreground hover:text-foreground/80",
                      )}
                      aria-pressed={mode === "signin"}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup")
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className={cn(
                        "h-10 rounded-full text-[13.5px] font-medium tracking-tight transition",
                        mode === "signup"
                          ? "bg-background text-foreground shadow-[0_4px_12px_-6px_oklch(0.2_0.02_60/0.25)]"
                          : "text-muted-foreground hover:text-foreground/80",
                      )}
                      aria-pressed={mode === "signup"}
                    >
                      Create account
                    </button>
                  </div>
              )}

              <div className="hidden lg:block mb-5 space-y-1">
                <h1 className="text-[24px] font-semibold tracking-tight">
                  {mode === "signin"
                    ? "Sign in"
                    : mode === "signup"
                    ? "Create your account"
                    : mode === "verify" || mode === "reset_otp"
                    ? "Check your email"
                    : mode === "forgot"
                    ? "Reset your password"
                    : "Set new password"}
                </h1>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                  {mode === "signin"
                    ? "Use your email and password to continue."
                    : mode === "signup"
                    ? "Just a name, an email, and a password."
                    : mode === "verify"
                    ? "Enter the 6-digit code we sent you."
                    : mode === "forgot"
                    ? "Enter your email to receive a password reset code."
                    : mode === "reset_otp"
                    ? "Enter the 6-digit reset code sent to your email."
                    : "Enter and confirm your new password below."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === "signup" && (
                  <Field
                    id="name"
                    label="Name"
                    icon={<User className="size-[16px]" />}
                  >
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ada Lovelace"
                      autoComplete="name"
                      required
                      className="w-full bg-transparent outline-none text-[15px] tracking-tight placeholder:text-muted-foreground/60"
                    />
                  </Field>
                )}

                {(mode === "signin" || mode === "signup" || mode === "forgot") && (
                    <Field id="email" label="Email" icon={<Mail className="size-[16px]" />}>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        autoComplete="email"
                        required
                        className="w-full bg-transparent outline-none text-[15px] tracking-tight placeholder:text-muted-foreground/60"
                      />
                    </Field>
                )}

                {(mode === "signin" || mode === "signup") && (
                    <div>
                      <Field
                        id="password"
                        label="Password"
                        icon={<Lock className="size-[16px]" />}
                        rightSlot={
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="text-muted-foreground hover:text-foreground/80 transition p-1 -mr-1"
                          >
                            {showPassword ? (
                              <EyeOff className="size-[16px]" />
                            ) : (
                              <Eye className="size-[16px]" />
                            )}
                          </button>
                        }
                      >
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={mode === "signup" ? "At least 8 chars, 1 uppercase, 1 digit" : "••••••••"}
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
                          required
                          minLength={4}
                          className="w-full bg-transparent outline-none text-[15px] tracking-tight placeholder:text-muted-foreground/60"
                        />
                      </Field>
                      {mode === "signin" && (
                        <div className="flex justify-end pt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setMode("forgot")
                              setError(null)
                              setSuccessMsg(null)
                            }}
                            className="text-[12.5px] text-muted-foreground hover:text-foreground font-medium transition"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}
                    </div>
                )}

                {(mode === "verify" || mode === "reset_otp") && (
                    <Field
                      id="otp"
                      label="6-Digit Code"
                      icon={<ShieldCheck className="size-[16px]" />}
                    >
                      <input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        required
                        minLength={6}
                        maxLength={6}
                        className="w-full bg-transparent outline-none text-[18px] tracking-[0.2em] font-medium placeholder:text-muted-foreground/60"
                      />
                    </Field>
                )}

                {mode === "reset_password" && (
                    <>
                      <Field
                        id="newPassword"
                        label="New Password"
                        icon={<Lock className="size-[16px]" />}
                      >
                        <input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 chars, 1 uppercase, 1 digit"
                          required
                          minLength={8}
                          className="w-full bg-transparent outline-none text-[15px] tracking-tight placeholder:text-muted-foreground/60"
                        />
                      </Field>

                      <Field
                        id="confirmPassword"
                        label="Confirm New Password"
                        icon={<Lock className="size-[16px]" />}
                      >
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                          minLength={8}
                          className="w-full bg-transparent outline-none text-[15px] tracking-tight placeholder:text-muted-foreground/60"
                        />
                      </Field>
                    </>
                )}

                {error && (
                  <p
                    role="alert"
                    className="text-[13px] text-[oklch(0.55_0.18_25)] tracking-tight px-1"
                  >
                    {error}
                  </p>
                )}
                
                {successMsg && (
                  <p
                    role="alert"
                    className="text-[13px] text-green-500 tracking-tight px-1"
                  >
                    {successMsg}
                  </p>
                )}

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={cn(
                      "w-full h-13 sm:h-14 rounded-full font-medium tracking-tight transition flex items-center justify-center gap-2",
                      "shadow-[0_14px_30px_-12px_oklch(0.2_0.02_60/0.5)]",
                      submitting
                        ? "bg-foreground/40 text-background/80 cursor-not-allowed"
                        : "bg-foreground text-background active:scale-[0.99] hover:bg-foreground/90",
                    )}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="size-4 rounded-full border-2 border-background/30 border-t-background animate-spin"
                          aria-hidden
                        />
                        {mode === "signin"
                          ? "Signing in…"
                          : mode === "signup"
                          ? "Creating account…"
                          : mode === "verify"
                          ? "Verifying…"
                          : mode === "forgot"
                          ? "Sending reset code…"
                          : mode === "reset_otp"
                          ? "Verifying reset code…"
                          : "Resetting password…"}
                      </span>
                    ) : (
                      <>
                        {mode === "signin"
                          ? "Sign in"
                          : mode === "signup"
                          ? "Create account"
                          : mode === "verify"
                          ? "Verify Code"
                          : mode === "forgot"
                          ? "Send Reset Code"
                          : mode === "reset_otp"
                          ? "Verify Reset Code"
                          : "Reset Password"}
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>

                  {mode === "signin" && (
                    <>
                      <div className="flex items-center gap-3" aria-hidden>
                        <span className="h-px flex-1 bg-foreground/10" />
                        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Jury access
                        </span>
                        <span className="h-px flex-1 bg-foreground/10" />
                      </div>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleDemoLogin}
                        className={cn(
                          "w-full h-11 sm:h-12 rounded-full font-medium tracking-tight transition",
                          "border border-foreground/15 text-foreground hover:bg-foreground/5 active:scale-[0.99]",
                          submitting && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        Continue as demo judge
                      </button>
                      <p className="text-center text-[11.5px] leading-relaxed text-muted-foreground">
                        Creates a private temporary workspace. No password required.
                      </p>
                    </>
                  )}

                  {(mode === "verify" || mode === "reset_otp") && (
                      <button
                        type="button"
                        disabled={resending || submitting || cooldown > 0}
                        onClick={handleResendOtp}
                        className={cn(
                          "w-full h-11 sm:h-12 rounded-full font-medium tracking-tight transition flex items-center justify-center gap-2",
                          "border border-foreground/10 text-foreground hover:bg-foreground/5 active:scale-[0.99]",
                          (resending || submitting || cooldown > 0) && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        {resending ? (
                          <span className="flex items-center gap-2">
                            <span
                              className="size-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin"
                              aria-hidden
                            />
                            Resending code…
                          </span>
                        ) : cooldown > 0 ? (
                          `Resend Code in ${cooldown}s`
                        ) : (
                          "Resend Code"
                        )}
                      </button>
                  )}
                </div>
              </form>

              <p className="mt-5 text-center text-[12.5px] text-muted-foreground tracking-tight">
                {mode === "signin" && (
                  <>
                    {"Don't have an account? "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup")
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className="text-foreground font-medium hover:underline underline-offset-4"
                    >
                      Create one
                    </button>
                  </>
                )}

                {mode === "signup" && (
                  <>
                    {"Already have one? "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin")
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className="text-foreground font-medium hover:underline underline-offset-4"
                    >
                      Sign in
                    </button>
                  </>
                )}

                {mode === "forgot" && (
                  <>
                    {"Remembered your password? "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin")
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className="text-foreground font-medium hover:underline underline-offset-4"
                    >
                      Sign in
                    </button>
                  </>
                )}

                {mode === "reset_otp" && (
                  <>
                    {"Wrong email? "}
                    <button
                      type="button"
                      onClick={() => {
                        clearPendingVerify()
                        setMode("forgot")
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className="text-foreground font-medium hover:underline underline-offset-4"
                    >
                      Back to forgot password
                    </button>
                  </>
                )}

                {mode === "reset_password" && (
                  <>
                    {"Want to sign in instead? "}
                    <button
                      type="button"
                      onClick={() => {
                        clearPendingVerify()
                        setMode("signin")
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className="text-foreground font-medium hover:underline underline-offset-4"
                    >
                      Sign in
                    </button>
                  </>
                )}

                {mode === "verify" && (
                  <>
                    {"Wrong email? "}
                    <button
                      type="button"
                      onClick={() => {
                        clearPendingVerify()
                        setMode("signup")
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className="text-foreground font-medium hover:underline underline-offset-4"
                    >
                      Back to sign up
                    </button>
                  </>
                )}
              </p>
            </div>

            <p className="mt-5 text-center text-[11.5px] text-muted-foreground tracking-wide px-4">
              By continuing you agree to our Terms and acknowledge our Privacy Notice.
            </p>
          </div>
        </div>
      </main>
    </PhoneShell>
  )
}

function Field({
  id,
  label,
  icon,
  rightSlot,
  children,
}: {
  id: string
  label: string
  icon: React.ReactNode
  rightSlot?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground px-1"
      >
        {label}
      </label>
      <div className="flex items-center gap-3 px-4 h-13 sm:h-14 rounded-2xl bg-background/70 border border-white/70 shadow-[inset_0_1px_0_oklch(1_0_0/0.6)] focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-foreground/10 transition">
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">{children}</div>
        {rightSlot}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
