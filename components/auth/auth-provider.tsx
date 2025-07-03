"use client"

import type React from "react"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { LoginForm } from "./login-form"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, checkAuth } = useStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <>{children}</>
}
