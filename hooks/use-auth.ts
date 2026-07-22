"use client"

import { useEffect, useState } from "react"
import { getCurrentUser, type AuthUser } from "@/lib/auth"

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadUser = async () => {
      const u = await getCurrentUser()
      if (active) {
        setUser(u)
        setLoading(false)
      }
    }

    loadUser()

    const handleAuthChange = () => {
      loadUser()
    }

    window.addEventListener("auth-change", handleAuthChange)

    return () => {
      active = false
      window.removeEventListener("auth-change", handleAuthChange)
    }
  }, [])

  return { user, loading }
}
