import React, { useState } from 'react'
import api from '../api/client'

type Props = {
  open: boolean
  onClose: () => void
  projectId: string
  onAdded: () => void
}

export default function AddUserModal({ open, onClose, projectId, onAdded }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError('Введите email')
      return
    }

    setLoading(true)
    try {
      await api.post(`/projects/${projectId}/users?email=${encodeURIComponent(email.trim())}`)
      setEmail('')
      onAdded()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Добавить пользователя</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Email пользователя</label>
            <input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              autoFocus 
              placeholder="user@example.com" 
              className="form-input" 
            />
          </div>

          {error && <div className="error">{error}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading} className="btn secondary">Отмена</button>
            <button type="submit" disabled={loading} className="btn">{loading ? 'Добавление...' : 'Добавить'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
