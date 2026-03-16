import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ProjectsList from '../pages/ProjectsList'
import ProjectPage from '../pages/ProjectPage'
import ProtectedRoute from '../components/ProtectedRoute'

export default function AppRouter() {
  return (
      <Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<ProjectsList />} />
          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/projects/:projectId/*" element={<ProjectPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  )
}
