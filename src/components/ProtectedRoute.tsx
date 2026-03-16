import React from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <div>Загрузка...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}
