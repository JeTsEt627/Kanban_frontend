import React, { useEffect, useState } from 'react'
import api from '../api/client'
import { Link } from 'react-router-dom'

type Project = { id: number; name: string; description?: string }

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    api.get('/projects')
      .then(res => { if (mounted) setProjects(res.data) })
      .catch(err => setError(err?.response?.data?.detail || err.message))
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Загрузка проектов...</div>
  if (error) return <div>Ошибка: {error}</div>

  return (
    <div>
      <h2>Проекты</h2>
      <ul>
        {projects.map(p => (
          <li key={p.id}>
            <Link to={`/projects/${p.id}`}>{p.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
