import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'

type Column = { id: number; name: string }
type Task = { id: number; title: string; column_id?: number }

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<any>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/columns?project_id=${projectId}`),
      api.get(`/tasks?project_id=${projectId}`),
    ])
      .then(([pRes, cRes, tRes]) => {
        setProject(pRes.data)
        setColumns(cRes.data || [])
        setTasks(tRes.data || [])
      })
      .catch(err => setError(err?.response?.data?.detail || err.message))
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) return <div>Загрузка проекта...</div>
  if (error) return <div>Ошибка: {error}</div>
  if (!project) return <div>Проект не найден</div>

  return (
    <div>
      <h2>{project.name}</h2>
      <p>{project.description}</p>
      <h3>Колонки</h3>
      <ul>
        {columns.map(c => <li key={c.id}>{c.name}</li>)}
      </ul>
      <h3>Задачи</h3>
      <ul>
        {tasks.map(t => <li key={t.id}>{t.title}</li>)}
      </ul>
    </div>
  )
}
