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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Введите название')
      return
    }
    setLoading(true)
    try {
      const payload: any = { name }
      if (user && (user as any).id) payload.created_by = (user as any).id

      const res = await api.post('/projects', payload)
      onCreated(res.data)
      setName('')
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
            <input value={name} onChange={e => setName(e.target.value)} autoFocus />
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
