import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'
import { useNavigate } from 'react-router-dom'

type User = any

type AuthContextType = {
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
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
    const init = async () => {
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } else {
        setIsLoading(false)
        return
      }

      try {
        const res = await api.get('/users/me')
        if (res?.data) {
          setUser(res.data)
          return
        }
      } catch (e: any) {
        // ... (rest of the catch block remains the same)
        const status = e?.response?.status
        if (status === 401) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('accessToken')
          delete api.defaults.headers.common['Authorization']
          setUser(null)
          setIsLoading(false)
          return
        }
      }
      
      setUser(null)
    }

    init().finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const data = res?.data || {}
      const token = data.access_token || data.accessToken || null
      if (token) {
        localStorage.setItem('access_token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const userRes = await api.get('/users/me')
        if (userRes?.data) {
            setUser(userRes.data)
            navigate('/')
            return
        }
      }
      if (data.user) {
        setUser(data.user)
        navigate('/')
        return
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('access_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
