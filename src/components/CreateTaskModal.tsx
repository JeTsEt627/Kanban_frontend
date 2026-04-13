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
  const [error, setError] = useState(null as string | null)

  // Dropdowns state
  const [colDropdownOpen, setColDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  React.useEffect(() => {
    if (open && currentUser && !assignedTo) {
      setAssignedTo(currentUser.id)
    }
  }, [open, currentUser])

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleGlobalClick = () => {
      setColDropdownOpen(false)
      setUserDropdownOpen(false)
    }
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // ... rest of handleSubmit (unchanged logic)
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
        description: description.trim(),
      }
      if (assignedTo) payload.assigned_to = assignedTo

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
        try { logout() } catch (e) {}
        setError('Неавторизовано. Пожалуйста, войдите снова.')
      } else {
        setError(formatError(err) || err.message || 'Ошибка')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedColumn = columns.find(c => c.id === columnId)
  
  // Combine users for select
  const allUsers = [...projectUsers]
  if (currentUser && !allUsers.find(u => u.id === currentUser.id)) {
    allUsers.push(currentUser)
  }
  const selectedUser = allUsers.find(u => u.id === assignedTo)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Создать задачу</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Название</label>
            <input 
              className="form-input"
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              autoFocus 
              placeholder="Название задачи" 
            />
          </div>

          <div className="form-row">
            <label>Описание (необязательно)</label>
            <textarea 
              className="form-textarea"
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="О чем эта задача?" 
              rows={4}
            ></textarea>
          </div>

          <div className="form-row">
            <label>Колонка</label>
            <div className="custom-select-container">
              <div 
                className={`custom-select-trigger ${colDropdownOpen ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setColDropdownOpen(!colDropdownOpen); setUserDropdownOpen(false); }}
              >
                <span>{selectedColumn?.name || 'Выберите колонку'}</span>
                <div className="select-arrow"></div>
              </div>
              {colDropdownOpen && (
                <div className="custom-select-options">
                  {columns.map(col => (
                    <div 
                      key={col.id} 
                      className={`custom-select-option ${col.id === columnId ? 'selected' : ''}`}
                      onClick={() => { setColumnId(col.id); setColDropdownOpen(false); }}
                    >
                      {col.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <label>Исполнитель</label>
            <div className="custom-select-container">
              <div 
                className={`custom-select-trigger ${userDropdownOpen ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setUserDropdownOpen(!userDropdownOpen); setColDropdownOpen(false); }}
              >
                <span>
                  {selectedUser ? 
                    ([selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ') || selectedUser.email) 
                    : 'Не назначен'}
                </span>
                <div className="select-arrow"></div>
              </div>
              {userDropdownOpen && (
                <div className="custom-select-options">
                  {allUsers.map(u => (
                    <div 
                      key={u.id} 
                      className={`custom-select-option ${u.id === assignedTo ? 'selected' : ''}`}
                      onClick={() => { setAssignedTo(u.id); setUserDropdownOpen(false); }}
                    >
                      {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}
                      {u.id === currentUser?.id && ' (Я)'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>Отмена</button>
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Создание...' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
