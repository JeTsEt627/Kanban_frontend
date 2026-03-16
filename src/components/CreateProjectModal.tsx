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

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (project: any) => void
}

export default function CreateProjectModal({ open, onClose, onCreated }: Props) {
  const { user, logout } = useAuth()
  const [name, setName] = useState('')
  const [columns, setColumns] = useState<string[]>(['To Do', 'In Progress', 'Done'])
  const [memberEmails, setMemberEmails] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleAddColumn = () => {
    setColumns([...columns, ''])
  }

  const handleColumnChange = (index: number, value: string) => {
    const newCols = [...columns]
    newCols[index] = value
    setColumns(newCols)
  }

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Введите название')
      return
    }
    const filteredColumns = columns.map(c => c.trim()).filter(c => c)
    if (filteredColumns.length === 0) {
      setError('Добавьте хотя бы одну колонку')
      return
    }

    setLoading(true)
    try {
      const emailsList = memberEmails
        .split(',')
        .map(e => e.trim())
        .filter(e => e)

      const payload: any = { 
        name, 
        columns: filteredColumns,
        member_emails: emailsList
      }
      if (user && (user as any).id) payload.created_by = (user as any).id

      const res = await api.post('/projects', payload)
      onCreated(res.data)
      setName('')
      setMemberEmails('')
      setColumns(['To Do', 'In Progress', 'Done'])
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
        <h3>Создать доску</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Название</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="Мой новый проект" className="form-input" />
          </div>

          <div className="form-row">
            <label>Участники (email через запятую)</label>
            <input 
              value={memberEmails} 
              onChange={e => setMemberEmails(e.target.value)} 
              placeholder="user1@example.com, user2@example.com" 
              className="form-input"
            />
          </div>

          <div className="form-row">
            <label>Колонки</label>
            {columns.map((col, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  value={col}
                  onChange={e => handleColumnChange(idx, e.target.value)}
                  placeholder={`Колонка ${idx + 1}`}
                  className="form-input"
                />
                <button 
                    type="button" 
                    onClick={() => handleRemoveColumn(idx)} 
                    className="btn secondary" 
                    style={{color: '#b91c1c', borderColor: '#b91c1c', padding: '8px 12px', fontSize: '1em', borderRadius: '6px', lineHeight: '1'}}
                >&times;</button>
              </div>
            ))}
            <button type="button" onClick={handleAddColumn} className="btn secondary" style={{ fontSize: '0.9em' }}>+ Добавить колонку</button>
          </div>

          {error && <div className="error">{error}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading} className="btn secondary">Отмена</button>
            <button type="submit" disabled={loading} className="btn">{loading ? 'Создание...' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
