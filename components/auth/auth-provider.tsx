"use client"

import type React from "react"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { LoginForm } from "./login-form"
import { Loader2 } from "lucide-react"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, loading, checkAuth } = useStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <>{children}</>
}
