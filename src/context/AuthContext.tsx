import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'
import { useNavigate } from 'react-router-dom'

type User = any

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Попробуем загрузить профиль (если используется cookie или токен)
    // Use relative path so Vite proxy can forward to backend (avoids CORS)
    fetch('/auth/me', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) throw new Error('not authenticated')
        const data = await res.json()
        setUser(data)
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // POST to backend auth endpoint. It may set httpOnly cookie or return token.
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        // Try to parse JSON error details (422 validation errors often return JSON)
        let msg = `Login failed: ${res.status}`
        try {
          const data = await res.json()
          // common shape: { detail: ... } or validation errors
          if (data?.detail) msg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
          else msg = JSON.stringify(data)
        } catch (e) {
          const text = await res.text().catch(() => '')
          if (text) msg = text
        }
        throw new Error(msg)
      }
      const data = await res.json().catch(() => ({}))
      // If backend returns accessToken, store it; if returns user, set it.
      if ((data as any).accessToken) localStorage.setItem('accessToken', (data as any).accessToken)
      if ((data as any).user) setUser((data as any).user)
      // If backend uses cookie auth, /auth/me will return user on next request.
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    localStorage.removeItem('accessToken')
    setUser(null)
    // Try to call backend logout (if exists)
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (e) {
      /* ignore */
    }
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
