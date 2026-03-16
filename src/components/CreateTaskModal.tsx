import React, { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatError(err: any) {
  try {
    if (!err) return ''
    const resp = err.response?.data || err
    if (typeof resp === 'string') return resp
    if (resp?.detail) {
      if (typeof resp.detail === 'string') return resp.detail
      if (Array.isArray(resp.detail)) {
        return resp.detail.map((d: any) => {
          if (typeof d === 'string') return d
          if (d?.msg) return `${(d.loc || []).join('.')} : ${d.msg}`
          return JSON.stringify(d)
        }).join('; ')
      }
      return JSON.stringify(resp.detail)
    }
    // Try common validation format: { loc, msg }
    if (Array.isArray(resp)) {
      return resp.map((d: any) => (d?.msg ? `${(d.loc||[]).join('.')} : ${d.msg}` : JSON.stringify(d))).join('; ')
    }
    return JSON.stringify(resp)
  } catch (e) {
    return String(err)
  }
}

type Column = { id: number; name: string }
type Task = { id: number; title: string; description?: string; column_id?: number; priority?: string }

type ProjectUser = { id: number; email: string; first_name?: string; last_name?: string }

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (task: Task) => void
  projectId: string
  columns: Column[]
  projectUsers?: ProjectUser[]
}

export default function CreateTaskModal({ open, onClose, onCreated, projectId, columns, projectUsers = [] }: Props) {
  const { logout, user: currentUser } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [columnId, setColumnId] = useState<number | undefined>(columns.length > 0 ? columns[0].id : undefined)
  const [assignedTo, setAssignedTo] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Set default assignee to current user when modal opens or users load
  React.useEffect(() => {
    if (open && currentUser && !assignedTo) {
      setAssignedTo(currentUser.id)
    }
  }, [open, currentUser])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Введите название задачи')
      return
    }
    if (!columnId) {
      setError('Выберите колонку')
      return
    }

    setLoading(true)
    try {
      const payload: any = { 
        project_id: parseInt(projectId, 10),
        column_id: columnId,
        title,
        description: description.trim() || undefined, // Send undefined if empty
      }
      
      if (assignedTo) {
        payload.assigned_to = assignedTo
      }

      const res = await api.post('/tasks', payload)
      onCreated(res.data)
      setTitle('')
      setDescription('')
      setColumnId(columns.length > 0 ? columns[0].id : undefined)
      setAssignedTo(currentUser?.id)
      onClose()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401) {
        // token invalid -> force logout
        try { logout() } catch (e) { /* ignore */ }
        setError('Неавторизовано. Пожалуйста, войдите снова.')
      } else {
        setError(formatError(err) || err.message || 'Ошибка')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Создать задачу</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Название</label>
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus placeholder="Название задачи" />
          </div>

          <div className="form-row">
            <label>Описание (необязательно)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание задачи" rows={3}></textarea>
          </div>

          <div className="form-row">
            <label>Колонка</label>
            <select value={columnId} onChange={e => setColumnId(parseInt(e.target.value, 10))}>
              {columns.map(col => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Исполнитель</label>
            <select 
              value={assignedTo || ''} 
              onChange={e => setAssignedTo(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            >
              {projectUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {(() => {
                    const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ');
                    return fullName || u.email;
                  })()}
                </option>
              ))}
              {/* Fallback if list is empty or current user not in list (should not happen usually but safe) */}
               {!projectUsers.find(u => u.id === currentUser?.id) && currentUser && (
                 <option value={currentUser.id}>Я ({currentUser.email})</option>
               )}
            </select>
          </div>

          {error && <div className="error">{error}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>Отмена</button>
            <button type="submit" disabled={loading}>{loading ? 'Создание...' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
