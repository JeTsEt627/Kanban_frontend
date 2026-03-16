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
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await api.post('/auth/login', { username, password })
      // Ожидаем: res.data = { accessToken, user }
      const { accessToken, user: u } = res.data
      if (accessToken) localStorage.setItem('accessToken', accessToken)
      setUser(u || null)
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    setUser(null)
    // optional: вызвать backend logout
    try { api.post('/auth/logout') } catch (e) { /* ignore */ }
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
